import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("shemsu_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("buyer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("shemsu_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const products = pgTable("shemsu_products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  quantity: integer("quantity").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.5"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favorites = pgTable(
  "shemsu_favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.userId, table.productId)],
);

export const cart = pgTable(
  "shemsu_cart",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [unique().on(table.userId, table.productId)],
);

export const orders = pgTable("shemsu_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("placed"),
  customerName: text("customer_name").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("shemsu_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;