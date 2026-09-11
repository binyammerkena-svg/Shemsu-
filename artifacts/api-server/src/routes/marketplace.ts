import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  AddFavoriteParams,
  AddToCartBody,
  CreateOrderBody,
  CreateProductBody,
  DeleteProductParams,
  GetProductParams,
  ListProductsQueryParams,
  RemoveCartItemParams,
  RemoveFavoriteParams,
  UpdateCartItemBody,
  UpdateCartItemParams,
  UpdateProductBody,
  LoginBody,
  SignupBody,
} from "@workspace/api-zod";
import {
  cart,
  db,
  favorites,
  orderItems,
  orders,
  products,
  sessions,
  users,
  type Product,
  type User,
} from "@workspace/db";

const router: IRouter = Router();
const SESSION_COOKIE = "shemsu_session";
const SESSION_DAYS = 30;
const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Phones",
  "Shoes",
  "Beauty",
  "Home",
  "Food",
  "Accessories",
  "Sports",
  "Other",
];

type RequestWithUser = Request & { user?: User };

function asyncRoute(
  handler: (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req as RequestWithUser, res, next).catch(next);
  };
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

function productDto(product: Product, sellerName: string) {
  return {
    id: product.id,
    sellerId: product.sellerId,
    sellerName,
    name: product.name,
    price: Number(product.price),
    currency: "ETB",
    category: product.category,
    description: product.description,
    image: product.image,
    quantity: product.quantity,
    rating: Number(product.rating),
    createdAt: product.createdAt.toISOString(),
  };
}

async function userFromRequest(req: RequestWithUser) {
  if (req.user) return req.user;
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return null;
  const result = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  const record = result[0];
  if (!record) return null;
  if (record.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  req.user = record.user;
  return record.user;
}

async function requireUser(req: RequestWithUser, res: Response) {
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Please log in to continue." });
    return null;
  }
  return user;
}

async function requireSeller(req: RequestWithUser, res: Response) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== "seller" && user.role !== "admin") {
    res.status(403).json({ error: "Seller access is required." });
    return null;
  }
  return user;
}

async function createSession(user: User, res: Response) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id, userId: user.id, expiresAt });
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

async function getCart(userId: number) {
  const rows = await db
    .select({ item: cart, product: products, sellerName: users.name })
    .from(cart)
    .innerJoin(products, eq(cart.productId, products.id))
    .innerJoin(users, eq(products.sellerId, users.id))
    .where(eq(cart.userId, userId));
  const items = rows.map(({ item, product, sellerName }) => ({
    product: productDto(product, sellerName),
    quantity: item.quantity,
    lineTotal: Number(product.price) * item.quantity,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const delivery = items.length ? 120 : 0;
  return { items, subtotal, delivery, total: subtotal + delivery };
}

async function getOrder(userId: number, orderId: number) {
  const row = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!row[0]) return null;
  const items = await db
    .select({ item: orderItems, productName: products.name })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
  return {
    id: row[0].id,
    total: Number(row[0].total),
    status: row[0].status,
    deliveryAddress: row[0].deliveryAddress,
    phone: row[0].phone,
    createdAt: row[0].createdAt.toISOString(),
    items: items.map(({ item, productName }) => ({
      productId: item.productId,
      productName,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
}

router.post(
  "/auth/signup",
  asyncRoute(async (req, res) => {
    const body = SignupBody.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }
    const created = await db
      .insert(users)
      .values({
        name: body.name?.trim() || email.split("@")[0],
        email,
        phone: body.phone?.trim() || "",
        passwordHash: hashPassword(body.password),
        role: "buyer",
      })
      .returning();
    await createSession(created[0], res);
    res.status(201).json(publicUser(created[0]));
  }),
);

router.post(
  "/auth/login",
  asyncRoute(async (req, res) => {
    const body = LoginBody.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!found[0] || !verifyPassword(body.password, found[0].passwordHash)) {
      res.status(401).json({ error: "Email or password is incorrect." });
      return;
    }
    await createSession(found[0], res);
    res.json(publicUser(found[0]));
  }),
);

router.post(
  "/auth/logout",
  asyncRoute(async (req, res) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) await db.delete(sessions).where(eq(sessions.id, sessionId));
    res.clearCookie(SESSION_COOKIE);
    res.status(204).send();
  }),
);

router.get(
  "/me",
  asyncRoute(async (req, res) => {
    const user = await userFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    res.json(publicUser(user));
  }),
);

router.get(
  "/categories",
  asyncRoute(async (_req, res) => {
    res.json(CATEGORIES);
  }),
);

router.get(
  "/products",
  asyncRoute(async (req, res) => {
    const query = ListProductsQueryParams.parse(req.query);
    const filters = [];
    if (query.search) {
      const term = `%${query.search}%`;
      filters.push(or(ilike(products.name, term), ilike(products.category, term), ilike(users.name, term)));
    }
    if (query.category) filters.push(eq(products.category, query.category));
    if (query.seller) filters.push(ilike(users.name, `%${query.seller}%`));
    const rows = await db
      .select({ product: products, sellerName: users.name })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(products.createdAt))
      .limit(query.limit);
    res.json(rows.map(({ product, sellerName }) => productDto(product, sellerName)));
  }),
);

router.get(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const { id } = GetProductParams.parse(req.params);
    const row = await db
      .select({ product: products, sellerName: users.name })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.id, id))
      .limit(1);
    if (!row[0]) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(productDto(row[0].product, row[0].sellerName));
  }),
);

router.get(
  "/home-summary",
  asyncRoute(async (_req, res) => {
    const rows = await db
      .select({ product: products, sellerName: users.name })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .orderBy(desc(products.createdAt))
      .limit(40);
    const all = rows.map(({ product, sellerName }) => productDto(product, sellerName));
    res.json({
      featured: all.slice(0, 4),
      trending: all.slice(4, 10),
      recommended: all.slice(10, 18),
      categories: CATEGORIES,
    });
  }),
);

router.post(
  "/products",
  asyncRoute(async (req, res) => {
    const seller = await requireSeller(req, res);
    if (!seller) return;
    const body = CreateProductBody.parse(req.body);
    const created = await db
      .insert(products)
      .values({
        sellerId: seller.id,
        name: body.name.trim(),
        price: body.price.toFixed(2),
        category: body.category,
        description: body.description.trim(),
        image: body.image,
        quantity: body.quantity,
        rating: "4.5",
      })
      .returning();
    res.status(201).json(productDto(created[0], seller.name));
  }),
);

router.patch(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const seller = await requireSeller(req, res);
    if (!seller) return;
    const { id } = GetProductParams.parse(req.params);
    const body = UpdateProductBody.parse(req.body);
    const existing = await db.select().from(products).where(and(eq(products.id, id), eq(products.sellerId, seller.id))).limit(1);
    if (!existing[0]) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const updated = await db
      .update(products)
      .set({
        name: body.name.trim(),
        price: body.price.toFixed(2),
        category: body.category,
        description: body.description.trim(),
        image: body.image,
        quantity: body.quantity,
      })
      .where(eq(products.id, id))
      .returning();
    res.json(productDto(updated[0], seller.name));
  }),
);

router.delete(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const seller = await requireSeller(req, res);
    if (!seller) return;
    const { id } = DeleteProductParams.parse(req.params);
    const deleted = await db.delete(products).where(and(eq(products.id, id), eq(products.sellerId, seller.id))).returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.status(204).send();
  }),
);

router.get(
  "/favorites",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const rows = await db
      .select({ product: products, sellerName: users.name })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.id));
    res.json(rows.map(({ product, sellerName }) => productDto(product, sellerName)));
  }),
);

router.post(
  "/favorites/:productId",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { productId } = AddFavoriteParams.parse(req.params);
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product[0]) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    await db.insert(favorites).values({ userId: user.id, productId }).onConflictDoNothing();
    const seller = await db.select({ name: users.name }).from(users).where(eq(users.id, product[0].sellerId)).limit(1);
    res.status(201).json(productDto(product[0], seller[0]?.name ?? "SHEMSU seller"));
  }),
);

router.delete(
  "/favorites/:productId",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { productId } = RemoveFavoriteParams.parse(req.params);
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.productId, productId)));
    res.status(204).send();
  }),
);

router.get(
  "/cart",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    res.json(await getCart(user.id));
  }),
);

router.post(
  "/cart",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = AddToCartBody.parse(req.body);
    const product = await db.select().from(products).where(eq(products.id, body.productId)).limit(1);
    if (!product[0] || product[0].quantity < body.quantity) {
      res.status(400).json({ error: "That product is not available in the requested quantity." });
      return;
    }
    await db
      .insert(cart)
      .values({ userId: user.id, productId: body.productId, quantity: body.quantity })
      .onConflictDoUpdate({ target: [cart.userId, cart.productId], set: { quantity: body.quantity } });
    res.json(await getCart(user.id));
  }),
);

router.patch(
  "/cart/:productId",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { productId } = UpdateCartItemParams.parse(req.params);
    const body = UpdateCartItemBody.parse(req.body);
    if (body.quantity === 0) {
      await db.delete(cart).where(and(eq(cart.userId, user.id), eq(cart.productId, productId)));
    } else {
      await db.update(cart).set({ quantity: body.quantity }).where(and(eq(cart.userId, user.id), eq(cart.productId, productId)));
    }
    res.json(await getCart(user.id));
  }),
);

router.delete(
  "/cart/:productId",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const { productId } = RemoveCartItemParams.parse(req.params);
    await db.delete(cart).where(and(eq(cart.userId, user.id), eq(cart.productId, productId)));
    res.json(await getCart(user.id));
  }),
);

router.get(
  "/orders",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const rows = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
    const result = [];
    for (const row of rows) {
      const order = await getOrder(user.id, row.id);
      if (order) result.push(order);
    }
    res.json(result);
  }),
);

router.post(
  "/orders",
  asyncRoute(async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const body = CreateOrderBody.parse(req.body);
    const currentCart = await getCart(user.id);
    if (!currentCart.items.length) {
      res.status(400).json({ error: "Your cart is empty." });
      return;
    }
    const created = await db.transaction(async (tx) => {
      const order = await tx
        .insert(orders)
        .values({
          userId: user.id,
          total: currentCart.total.toFixed(2),
          status: "placed",
          customerName: body.customerName.trim(),
          deliveryAddress: body.deliveryAddress.trim(),
          phone: body.phone.trim(),
        })
        .returning();
      await tx.insert(orderItems).values(
        currentCart.items.map((item) => ({
          orderId: order[0].id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price.toFixed(2),
        })),
      );
      await tx.delete(cart).where(eq(cart.userId, user.id));
      return order[0];
    });
    res.status(201).json({
      id: created.id,
      total: Number(created.total),
      status: created.status,
      deliveryAddress: created.deliveryAddress,
      phone: created.phone,
      createdAt: created.createdAt.toISOString(),
      items: currentCart.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
    });
  }),
);

router.get(
  "/seller/dashboard",
  asyncRoute(async (req, res) => {
    const seller = await requireSeller(req, res);
    if (!seller) return;
    const sellerProducts = await db
      .select({ product: products, sellerName: users.name })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.sellerId, seller.id))
      .orderBy(desc(products.createdAt));
    const salesRows = await db
      .select({ orderId: orders.id, total: orders.total })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(products.sellerId, seller.id));
    const uniqueOrders = new Set(salesRows.map((row) => row.orderId));
    res.json({
      totalProducts: sellerProducts.length,
      totalOrders: uniqueOrders.size,
      sales: salesRows.reduce((sum, row) => sum + Number(row.total), 0),
      products: sellerProducts.map(({ product, sellerName }) => productDto(product, sellerName)),
    });
  }),
);

router.get(
  "/seller/orders",
  asyncRoute(async (req, res) => {
    const seller = await requireSeller(req, res);
    if (!seller) return;
    const rows = await db
      .selectDistinct({ id: orders.id, userId: orders.userId })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(products.sellerId, seller.id))
      .orderBy(desc(orders.id));
    const result = [];
    for (const row of rows) {
      const order = await getOrder(row.userId, row.id);
      if (order) result.push(order);
    }
    res.json(result);
  }),
);

export async function ensureSeed() {
  const existing = await db.select().from(users).where(eq(users.email, "seller@shemsu.demo")).limit(1);
  const seller = existing[0] ?? (
    await db
      .insert(users)
      .values({
        name: "Shemsu Collective",
        email: "seller@shemsu.demo",
        phone: "+251 911 000 000",
        passwordHash: hashPassword("shemsu123"),
        role: "seller",
      })
      .returning()
  )[0];
  const buyer = await db.select().from(users).where(eq(users.email, "buyer@shemsu.demo")).limit(1);
  if (!buyer[0]) {
    await db.insert(users).values({
      name: "Mimi Bekele",
      email: "buyer@shemsu.demo",
      phone: "+251 911 111 111",
      passwordHash: hashPassword("shemsu123"),
      role: "buyer",
    });
  }
  const productCount = await db.select({ id: products.id }).from(products).limit(1);
  if (productCount[0]) return;
  const image = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;
  const samples = [
    ["Handwoven Addis Tote", 1250, "Fashion", "A structured everyday tote woven by artisans in Addis Ababa.", image(994523), 18],
    ["Sahara Linen Set", 1850, "Fashion", "Breathable two-piece linen set for warm city days.", image(1488463), 12],
    ["Nile Blue Sneakers", 2400, "Shoes", "Comfortable everyday sneakers with a soft blue finish.", image(2529148), 22],
    ["Kaffa Leather Loafers", 3200, "Shoes", "Hand-finished leather loafers made for long days.", image(292999), 8],
    ["Abyssinia Gold Hoops", 680, "Accessories", "Minimal gold-tone hoops that pair with everything.", image(1191531), 30],
    ["Woven Sun Hat", 900, "Accessories", "A lightweight woven hat for bright weekends.", image(1084540), 16],
    ["Lemlem Cotton Scarf", 760, "Fashion", "A soft cotton scarf with a modern woven texture.", image(1055691), 25],
    ["Coffee Ceremony Set", 2100, "Home", "A refined three-piece set for your next coffee ceremony.", image(6205509), 7],
    ["Clay Incense Holder", 420, "Home", "Small-batch clay holder with a warm terracotta glaze.", image(6074934), 20],
    ["Teff & Honey Box", 980, "Food", "A breakfast bundle with Ethiopian teff and local honey.", image(5946083), 14],
    ["Roasted Yirgacheffe", 540, "Food", "Bright, floral single-origin coffee roasted in Addis.", image(302899), 50],
    ["Berbere Spice Blend", 220, "Food", "A fragrant house blend for stews, eggs, and roasted vegetables.", image(4198015), 40],
    ["Lumi Glow Face Oil", 1150, "Beauty", "Lightweight botanical face oil with a soft natural finish.", image(3762879), 15],
    ["Shea + Coffee Scrub", 620, "Beauty", "A gentle body scrub made with shea and coffee.", image(4465122), 24],
    ["SHEMSU Pocket Speaker", 1850, "Electronics", "Compact wireless audio for picnics and shared moments.", image(164829), 11],
    ["Solar Study Lamp", 1350, "Electronics", "Rechargeable lamp for focused study anywhere.", image(1112598), 19],
    ["Mekelle Phone Sleeve", 480, "Phones", "Protective woven sleeve sized for everyday phones.", image(404280), 28],
    ["Travel Power Bank", 1650, "Phones", "Slim fast-charge battery for commutes and travel.", image(4042802), 17],
    ["Resistance Band Trio", 790, "Sports", "Three resistance levels for home workouts.", image(416778), 21],
    ["Bamboo Desk Tray", 690, "Other", "A calm landing place for keys, cards, and earbuds.", image(37347), 13],
  ] as const;
  await db.insert(products).values(
    samples.map(([name, price, category, description, productImage, quantity]) => ({
      sellerId: seller.id,
      name,
      price: price.toFixed(2),
      category,
      description,
      image: productImage,
      quantity,
      rating: (4.2 + (name.length % 8) / 10).toFixed(2),
    })),
  );
}

export default router;