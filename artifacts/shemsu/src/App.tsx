import {
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Link,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
  useParams,
} from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home,
  LogIn,
  LogOut,
  Menu,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trash2,
  Truck,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';

import {
  getGetCartQueryKey,
  getGetHomeSummaryQueryKey,
  getGetMeQueryKey,
  getGetProductQueryKey,
  getGetSellerDashboardQueryKey,
  getListFavoritesQueryKey,
  getListOrdersQueryKey,
  getListCategoriesQueryKey,
  getListProductsQueryKey,
  getListSellerOrdersQueryKey,
  getHealthCheckQueryKey,
  useAddFavorite,
  useAddToCart,
  useCreateOrder,
  useCreateProduct,
  useDeleteProduct,
  useGetCart,
  useGetHomeSummary,
  useGetMe,
  useGetProduct,
  useGetSellerDashboard,
  useListFavorites,
  useListOrders,
  useListCategories,
  useListProducts,
  useListSellerOrders,
  useHealthCheck,
  useLogin,
  useLogout,
  useRemoveCartItem,
  useRemoveFavorite,
  useSignup,
  useUpdateCartItem,
  useUpdateProduct,
  type Cart,
  type Order,
  type Product,
  type ProductInput,
} from '@workspace/api-client-react';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const money = (value = 0) =>
  `${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function Loading({ label = 'Gathering the good things' }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-secondary/30 text-primary">
          <Sparkles size={22} />
        </div>
        <p className="font-mono-app text-[10px] uppercase tracking-[.18em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="rounded-3xl border border-accent/20 bg-accent/5 p-10 text-center">
      <p className="font-display text-2xl text-primary">That didn’t land.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn’t reach the market right now.
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          data-testid="button-retry"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon = ShoppingBag,
  title,
  copy,
  action,
}: {
  icon?: typeof ShoppingBag;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 font-display text-2xl text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {copy}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  const { data: me } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const { data: cart } = useGetCart({
    query: {
      enabled: !!me,
      retry: false,
      queryKey: getGetCartQueryKey(),
    },
  });

  const health = useHealthCheck({
    query: {
      retry: false,
      queryKey: getHealthCheckQueryKey(),
    },
  });

  const logout = useLogout();
  const [menu, setMenu] = useState(false);

  const nav = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discover', icon: Zap },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/profile', label: 'Profile', icon: CircleUserRound },
  ];

  const cartItems = asArray<any>((cart as any)?.items);

  const isActive = (href: string) =>
    href === '/' ? location === '/' : location.startsWith(href);

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), undefined);
        setLocation('/');
      },
    });

  return (
    <div className="shemsu-grain min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            data-testid="link-logo"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-secondary shadow-sm">
              <span className="font-display text-xl">S</span>
            </span>

            <span className="font-display text-[25px] font-bold tracking-tight text-primary">
              shemsu<span className="text-accent">.</span>
            </span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <nav className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
              {nav.slice(0, 3).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive(href)
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid={`link-nav-${label.toLowerCase()}`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-muted"
              data-testid="link-cart"
            >
              <ShoppingCart size={21} />

              {cartItems.length > 0 && (
                <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {health.isError && (
              <span
                className="hidden text-[10px] font-semibold text-accent lg:inline"
                data-testid="status-health"
              >
                Offline mode
              </span>
            )}

            <button
              onClick={() => setMenu(!menu)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary md:hidden"
              data-testid="button-mobile-menu"
            >
              <Menu size={20} />
            </button>

            <Link
              href="/profile"
              className="hidden h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-primary sm:flex"
              data-testid="link-account"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                {me?.name?.slice(0, 1).toUpperCase() ?? (
                  <CircleUserRound size={16} />
                )}
              </span>

              {me?.name?.split(' ')[0] ?? 'Account'}
            </Link>
          </div>
        </div>

        {menu && (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden">
            <div className="grid grid-cols-5 gap-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenu(false)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${
                    isActive(href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                  data-testid={`link-mobile-${label.toLowerCase()}`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="page-enter mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8">
        {children}
      </main>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-card/95 px-3 pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[54px] flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold ${
                isActive(href)
                  ? 'text-accent'
                  : 'text-muted-foreground'
              }`}
              data-testid={`link-bottom-${label.toLowerCase()}`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {me?.role === 'seller' && (
        <Link
          href="/seller"
          className="fixed bottom-20 right-4 z-20 hidden items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg md:flex"
          data-testid="link-seller-float"
        >
          <Store size={15} />
          Seller studio
        </Link>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  action = 'See all',
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-primary">
          {title}
        </h2>
      </div>

      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary underline decoration-secondary decoration-2 underline-offset-4"
          data-testid={`link-see-${title
            .toLowerCase()
            .replaceAll(' ', '-')}`}
        >
          {action}
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

function ProductCard({
  product,
  favoriteIds,
  onFavorite,
  onCart,
}: {
  product: Product;
  favoriteIds: Set<number>;
  onFavorite: (p: Product) => void;
  onCart: (p: Product) => void;
}) {
  const saved = favoriteIds.has(product.id);

  return (
    <article
      className="group card-lift overflow-hidden rounded-3xl border border-border bg-card"
      data-testid={`card-product-${product.id}`}
    >
      <Link
        href={`/product/${product.id}`}
        className="block"
        data-testid={`link-product-${product.id}`}
      >
        <div className="relative aspect-[.92] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="image-fade h-full w-full object-cover"
          />

          <div className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 font-mono-app text-[10px] uppercase tracking-wide text-primary">
            {product.category}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${product.id}`}
              className="line-clamp-1 font-semibold text-primary"
              data-testid={`link-product-name-${product.id}`}
            >
              {product.name}
            </Link>

            <p className="mt-1 text-xs text-muted-foreground">
              {product.sellerName}
            </p>
          </div>

          <button
            onClick={() => onFavorite(product)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              saved
                ? 'bg-accent/10 text-accent'
                : 'bg-muted text-muted-foreground hover:text-accent'
            }`}
            data-testid={`button-favorite-${product.id}`}
            aria-label={saved ? 'Remove from favorites' : 'Save product'}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono-app text-sm font-bold text-primary">
            {money(product.price)}
          </span>

          <button
            onClick={() => onCart(product)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-accent"
            data-testid={`button-add-cart-${product.id}`}
            aria-label="Add to cart"
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  products,
  favoriteIds,
  onFavorite,
  onCart,
}: {
  products: Product[];
  favoriteIds: Set<number>;
  onFavorite: (p: Product) => void;
  onCart: (p: Product) => void;
}) {
  const safeProducts = asArray<Product>(products);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {safeProducts.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          favoriteIds={favoriteIds}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

function useShopActions() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: me } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addCart = useAddToCart();

  const { data: favorites } = useListFavorites({
    query: {
      enabled: !!me,
      retry: false,
      queryKey: getListFavoritesQueryKey(),
    },
  });

  const favoriteList = asArray<Product>(favorites);

  const favoriteIds = useMemo(
    () => new Set(favoriteList.map((p) => p.id)),
    [favoriteList],
  );

  const onFavorite = (product: Product) => {
    const mutation = favoriteIds.has(product.id)
      ? removeFavorite
      : addFavorite;

    mutation.mutate(
      { productId: product.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getListFavoritesQueryKey(),
          });

          toast({
            title: favoriteIds.has(product.id)
              ? 'Removed from saved'
              : 'Saved for later',
          });
        },
        onError: () =>
          toast({
            title: 'Sign in to save products',
            variant: 'destructive',
          }),
      },
    );
  };

  const onCart = (product: Product) =>
    addCart.mutate(
      {
        data: {
          productId: product.id,
          quantity: 1,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });

          toast({
            title: 'Added to your bag',
            description: product.name,
          });
        },
        onError: () =>
          toast({
            title: 'Could not add this item',
            variant: 'destructive',
          }),
      },
    );

  return {
    favoriteIds,
    onFavorite,
    onCart,
  };
}

function HomePage() {
  const { data, isLoading, isError, refetch } =
    useGetHomeSummary({
      query: {
        queryKey: getGetHomeSummaryQueryKey(),
      },
    });

  const { data: apiCategories } = useListCategories({
    query: {
      retry: false,
      queryKey: getListCategoriesQueryKey(),
    },
  });

  const { onFavorite, onCart, favoriteIds } =
    useShopActions();

  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();

  if (isLoading) return <Loading />;

  if (isError || !data) {
    return <ErrorState retry={refetch} />;
  }

  const safeData = data as any;

  const summaryCategories = asArray<string>(
    safeData.categories,
  );

  const fallbackCategories = asArray<string>(
    apiCategories,
  );

  const categories =
    summaryCategories.length > 0
      ? summaryCategories
      : fallbackCategories;

  const featured = asArray<Product>(
    safeData.featured,
  );

  const trending = asArray<Product>(
    safeData.trending,
  );

  const recommended = asArray<Product>(
    safeData.recommended,
  );

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14 lg:px-16">
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[30px] border-secondary/30" />
        <div className="absolute bottom-[-90px] right-[18%] h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 font-mono-app text-[10px] uppercase tracking-[.2em] text-secondary">
            <Sparkles size={13} />
            Curated close to home
          </div>

          <h1 className="font-display text-5xl leading-[.98] tracking-tight sm:text-7xl">
            Good finds.
            <br />
            <span className="text-secondary">Great energy.</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/70 sm:text-base">
            A warmer way to shop Ethiopian and African goods — from makers you
            can actually reach.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (search.trim()) {
                setLocation(
                  `/search?q=${encodeURIComponent(search)}`,
                );
              }
            }}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-card p-2 text-primary shadow-xl"
          >
            <Search
              size={20}
              className="ml-3 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="What are you looking for?"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none"
              data-testid="input-home-search"
            />

            <button
              type="submit"
              className="rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground"
              data-testid="button-home-search"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Shop by feeling"
          title="Find your next favorite"
        />

        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category, i) => (
            <Link
              key={category}
              href={`/search?category=${encodeURIComponent(category)}`}
              className={`min-w-[145px] rounded-2xl px-4 py-4 transition hover:-translate-y-1 ${
                i % 3 === 0
                  ? 'bg-secondary'
                  : i % 3 === 1
                    ? 'bg-accent/15'
                    : 'bg-primary text-primary-foreground'
              }`}
              data-testid={`link-category-${category}`}
            >
              <span className="font-mono-app text-[10px] uppercase tracking-[.14em] opacity-60">
                0{i + 1}
              </span>

              <p className="mt-7 font-display text-xl font-semibold">
                {category}
              </p>

              <ChevronRight
                className="mt-3 opacity-50"
                size={16}
              />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Handpicked today"
          title="Featured"
          href="/search"
        />

        <ProductGrid
          products={featured}
          favoriteIds={favoriteIds}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl bg-secondary p-7 sm:p-9">
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-primary/60">
            The SHEMSU edit
          </p>

          <h2 className="mt-3 max-w-md font-display text-4xl leading-tight text-primary">
            The little things that make a place yours.
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-6 text-primary/70">
            Discover objects with a story, made for the everyday rituals that
            matter.
          </p>

          <Link
            href="/discover"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-start-discover"
          >
            Start discovering
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
              In the mix
            </p>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary">
              <Zap size={16} />
            </span>
          </div>

          <h2 className="mt-3 font-display text-4xl text-primary">
            Trending now
          </h2>

          <div className="mt-5 space-y-3">
            {trending.slice(0, 3).map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted"
                data-testid={`link-trending-${p.id}`}
              >
                <span className="font-mono-app text-xs text-muted-foreground">
                  0{i + 1}
                </span>

                <img
                  src={p.image}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />

                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                  {p.name}
                </span>

                <ChevronRight
                  size={15}
                  className="text-muted-foreground"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Picked for you"
          title="Recommended"
        />

        <ProductGrid
          products={recommended}
          favoriteIds={favoriteIds}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      </section>
    </div>
  );
}

function DiscoverPage() {
  const { data, isLoading, isError, refetch } =
    useListProducts(
      { limit: 30 },
      {
        query: {
          queryKey: getListProductsQueryKey({
            limit: 30,
          }),
        },
      },
    );

  const products = asArray<Product>(data);

  const { onFavorite } = useShopActions();

  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const start = useRef(0);

  const current = products[index];
  const next = products[index + 1];

  const decide = (liked: boolean) => {
    if (current && liked) {
      onFavorite(current);
    }

    setDrag(0);
    setIndex((i) =>
      Math.min(i + 1, products.length),
    );
  };

  const pointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
  ) => {
    start.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const pointerMove = (
    e: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (start.current) {
      setDrag(e.clientX - start.current);
    }
  };

  const pointerUp = () => {
    if (Math.abs(drag) > 80) {
      decide(drag > 0);
    } else {
      setDrag(0);
    }

    start.current = 0;
  };

  if (isLoading) {
    return <Loading label="Setting the table" />;
  }

  if (isError) {
    return <ErrorState retry={refetch} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            One good thing at a time
          </p>

          <h1 className="mt-1 font-display text-4xl text-primary">
            Discover
          </h1>
        </div>

        <span className="font-mono-app text-xs text-muted-foreground">
          {Math.min(index + 1, products.length)} / {products.length}
        </span>
      </div>

      {current ? (
        <>
          <div className="relative h-[min(68vh,590px)]">
            <div className="absolute inset-x-4 top-4 overflow-hidden rounded-[2rem] bg-muted opacity-70">
              <div className="aspect-[.78] bg-muted">
                {next && (
                  <img
                    src={next.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <div
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              style={{
                transform: `translateX(${drag}px) rotate(${drag * 0.035}deg)`,
              }}
              className="absolute inset-0 touch-none select-none overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl transition-transform duration-200"
            >
              <img
                src={current.image}
                alt={current.name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary via-primary/75 to-transparent p-6 pt-32 text-primary-foreground">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono-app text-[10px] uppercase tracking-widest text-secondary">
                      {current.category}
                    </p>

                    <h2 className="mt-2 font-display text-3xl leading-tight">
                      {current.name}
                    </h2>

                    <p className="mt-1 text-sm text-primary-foreground/70">
                      {current.sellerName}
                    </p>
                  </div>

                  <p className="font-mono-app text-sm font-bold text-secondary">
                    {money(current.price)}
                  </p>
                </div>
              </div>

              {drag > 40 && (
                <div className="absolute left-5 top-8 rounded-xl border-2 border-secondary px-4 py-2 font-bold text-secondary">
                  KEEP
                </div>
              )}

              {drag < -40 && (
                <div className="absolute right-5 top-8 rounded-xl border-2 border-accent px-4 py-2 font-bold text-accent">
                  SKIP
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              onClick={() => decide(false)}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:-translate-y-1 hover:border-accent hover:text-accent"
              data-testid="button-skip"
            >
              <X size={22} />
            </button>

            <Link
              href={`/product/${current.id}`}
              className="flex h-11 items-center rounded-full border border-border px-4 text-xs font-bold text-muted-foreground"
              data-testid="link-discover-details"
            >
              Details
            </Link>

            <button
              onClick={() => decide(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:-translate-y-1"
              data-testid="button-like"
            >
              <Heart size={22} fill="currentColor" />
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="You’re all caught up"
          copy="Come back soon for more local finds to discover."
          action={
            <Link
              href="/"
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-discover-home"
            >
              Back home
            </Link>
          }
        />
      )}
    </div>
  );
}

function SearchPage() {
  const params = new URLSearchParams(
    typeof window !== 'undefined'
      ? window.location.search
      : '',
  );

  const [term, setTerm] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(
    params.get('category') ?? '',
  );
  const [submitted, setSubmitted] = useState(term);

  const paramsObj = useMemo(
    () => ({
      search: submitted || undefined,
      category: category || undefined,
      limit: 50,
    }),
    [submitted, category],
  );

  const { data, isLoading, isError, refetch } =
    useListProducts(paramsObj, {
      query: {
        queryKey: getListProductsQueryKey(paramsObj),
      },
    });

  const products = asArray<Product>(data);

  const { data: allData } = useListProducts(
    { limit: 100 },
    {
      query: {
        queryKey: getListProductsQueryKey({
          limit: 100,
        }),
      },
    },
  );

  const all = asArray<Product>(allData);

  const categoryOptions = useMemo(
    () => Array.from(new Set(all.map((p) => p.category))),
    [all],
  );

  const { onFavorite, onCart, favoriteIds } =
    useShopActions();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            Browse the market
          </p>

          <h1 className="mt-1 font-display text-4xl text-primary">
            Search
          </h1>
        </div>

        <span className="hidden text-sm text-muted-foreground sm:block">
          {products.length} finds
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(term);
        }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
      >
        <Search
          size={19}
          className="ml-3 text-muted-foreground"
        />

        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products, makers, categories"
          className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none"
          data-testid="input-search-products"
        />

        <button
          className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          data-testid="button-submit-search"
        >
          Search
        </button>
      </form>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <SlidersHorizontal
          size={16}
          className="shrink-0 text-muted-foreground"
        />

        <button
          onClick={() => setCategory('')}
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            !category
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
          data-testid="button-filter-all"
        >
          All
        </button>

        {categoryOptions.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
              category === c
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
            data-testid={`button-filter-${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : products.length ? (
        <ProductGrid
          products={products}
          favoriteIds={favoriteIds}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ) : (
        <EmptyState
          icon={Search}
          title="Nothing in that corner"
          copy="Try another phrase, or browse all our makers."
          action={
            <button
              onClick={() => {
                setTerm('');
                setSubmitted('');
                setCategory('');
              }}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="button-clear-search"
            >
              Clear filters
            </button>
          }
        />
      )}
    </div>
  );
}

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { data: product, isLoading, isError, refetch } =
    useGetProduct(productId, {
      query: {
        queryKey: getGetProductQueryKey(productId),
      },
    });

  const {
    onFavorite,
    onCart,
    favoriteIds,
  } = useShopActions();

  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const buy = useAddToCart();

  const buyNow = () => {
    if (!product) return;

    buy.mutate(
      {
        data: {
          productId: product.id,
          quantity: 1,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });

          setLocation('/cart');
        },
      },
    );
  };

  if (isLoading) return <Loading />;

  if (isError || !product) {
    return <ErrorState retry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        data-testid="link-back-search"
      >
        <ArrowLeft size={17} />
        Back to market
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="overflow-hidden rounded-[2rem] bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            {product.category} · from {product.sellerName}
          </p>

          <h1 className="mt-3 font-display text-5xl leading-[.98] text-primary sm:text-6xl">
            {product.name}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="font-mono-app text-xl font-bold text-primary">
              {money(product.price)}
            </span>

            <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-semibold text-primary">
              In stock · {product.quantity} left
            </span>
          </div>

          <p className="mt-7 text-sm leading-7 text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onCart(product)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground sm:flex-none"
              data-testid="button-product-add-cart"
            >
              <ShoppingBag size={18} />
              Add to bag
            </button>

            <button
              onClick={buyNow}
              disabled={buy.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-sm font-bold text-secondary-foreground sm:flex-none"
              data-testid="button-product-buy"
            >
              Buy now
            </button>

            <button
              onClick={() => onFavorite(product)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                favoriteIds.has(product.id)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card text-primary'
              }`}
              data-testid="button-product-favorite"
            >
              <Heart
                size={20}
                fill={
                  favoriteIds.has(product.id)
                    ? 'currentColor'
                    : 'none'
                }
              />
            </button>

            <button
              onClick={() => setLocation('/cart')}
              className="rounded-2xl border border-border px-5 py-4 text-sm font-bold text-primary"
              data-testid="button-product-go-cart"
            >
              View bag
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 border-y border-border py-5 text-center">
            <div>
              <Truck
                className="mx-auto mb-2 text-accent"
                size={18}
              />
              <p className="text-xs text-muted-foreground">
                Local delivery
              </p>
            </div>

            <div>
              <Check
                className="mx-auto mb-2 text-accent"
                size={18}
              />
              <p className="text-xs text-muted-foreground">
                Verified maker
              </p>
            </div>

            <div>
              <Heart
                className="mx-auto mb-2 text-accent"
                size={18}
              />
              <p className="text-xs text-muted-foreground">
                Loved locally
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesPage() {
  const {
    data: me,
    isLoading: authLoading,
  } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useListFavorites({
    query: {
      enabled: !!me,
      queryKey: getListFavoritesQueryKey(),
    },
  });

  const favorites = asArray<Product>(data);

  const {
    onFavorite,
    onCart,
    favoriteIds,
  } = useShopActions();

  if (authLoading) return <Loading />;

  if (!me) {
    return (
      <EmptyState
        icon={Heart}
        title="Your shortlist starts here"
        copy="Sign in to save products and keep your finds across devices."
        action={
          <Link
            href="/profile"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-favorites-login"
          >
            Sign in to save
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your shortlist"
        title="Saved finds"
        href="/search"
        action="Keep browsing"
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : favorites.length ? (
        <ProductGrid
          products={favorites}
          favoriteIds={favoriteIds}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ) : (
        <EmptyState
          icon={Heart}
          title="Make a little list"
          copy="Tap the heart on anything that catches your eye. Your saved finds live here."
          action={
            <Link
              href="/discover"
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-favorites-discover"
            >
              Discover products
            </Link>
          }
        />
      )}
    </div>
  );
}

function CartPage() {
  const {
    data: me,
    isLoading: authLoading,
  } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const {
    data: cart,
    isLoading,
    isError,
    refetch,
  } = useGetCart({
    query: {
      enabled: !!me,
      queryKey: getGetCartQueryKey(),
    },
  });

  const qc = useQueryClient();
  const { toast } = useToast();
  const [checkout, setCheckout] = useState(false);

  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const order = useCreateOrder();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    deliveryAddress: '',
  });

  const [, setLocation] = useLocation();

  const cartItems = asArray<any>((cart as any)?.items);

  const change = (
    productId: number,
    quantity: number,
  ) =>
    update.mutate(
      {
        productId,
        data: { quantity },
      },
      {
        onSuccess: () =>
          qc.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          }),
      },
    );

  const place = (e: FormEvent) => {
    e.preventDefault();

    order.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });

          qc.invalidateQueries({
            queryKey: getListOrdersQueryKey(),
          });

          toast({
            title: 'Order placed',
            description: 'We’re getting it ready.',
          });

          setCheckout(false);
          setLocation('/orders');
        },
        onError: () =>
          toast({
            title: 'Please check your details',
            variant: 'destructive',
          }),
      },
    );
  };

  if (authLoading) {
    return <Loading label="Opening your bag" />;
  }

  if (!me) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your bag is waiting"
        copy="Sign in to keep your cart ready across sessions."
        action={
          <Link
            href="/profile"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-cart-login"
          >
            Sign in to shop
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return <Loading label="Counting your finds" />;
  }

  if (isError) {
    return <ErrorState retry={refetch} />;
  }

  if (!cartItems.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your bag is taking a walk"
        copy="Add something lovely and it’ll meet you here."
        action={
          <Link
            href="/search"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-cart-shop"
          >
            Shop the market
          </Link>
        }
      />
    );
  }

  const safeCart = cart as any;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Ready when you are"
        title="Your bag"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {cartItems.map((item: any) => {
            if (!item?.product) return null;

            return (
              <div
                key={item.product.id}
                className="flex gap-4 rounded-3xl border border-border bg-card p-3 sm:p-4"
                data-testid={`row-cart-${item.product.id}`}
              >
                <img
                  src={item.product.image}
                  alt=""
                  className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-primary">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.product.sellerName}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        remove.mutate(
                          {
                            productId: item.product.id,
                          },
                          {
                            onSuccess: () =>
                              qc.invalidateQueries({
                                queryKey:
                                  getGetCartQueryKey(),
                              }),
                          },
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`button-remove-cart-${item.product.id}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center rounded-full bg-muted">
                      <button
                        onClick={() =>
                          change(
                            item.product.id,
                            Math.max(
                              1,
                              Number(item.quantity || 1) - 1,
                            ),
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center"
                        data-testid={`button-decrease-${item.product.id}`}
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-7 text-center text-sm font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          change(
                            item.product.id,
                            Number(item.quantity || 1) + 1,
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center"
                        data-testid={`button-increase-${item.product.id}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="font-mono-app text-sm font-bold text-primary">
                      {money(item.lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-secondary">
            Summary
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-primary-foreground/70">
              <span>Subtotal</span>
              <span>{money(safeCart.subtotal)}</span>
            </div>

            <div className="flex justify-between text-primary-foreground/70">
              <span>Delivery</span>
              <span>{money(safeCart.delivery)}</span>
            </div>

            <div className="my-4 border-t border-primary-foreground/15" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="font-mono-app text-secondary">
                {money(safeCart.total)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCheckout(true)}
            className="mt-7 w-full rounded-2xl bg-secondary px-5 py-4 text-sm font-bold text-secondary-foreground"
            data-testid="button-checkout"
          >
            Continue to checkout
          </button>
        </aside>
      </div>

      {checkout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 sm:items-center sm:p-6">
          <form
            onSubmit={place}
            className="w-full max-w-lg rounded-t-[2rem] bg-card p-6 sm:rounded-[2rem] sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-primary">
                Delivery details
              </h2>

              <button
                type="button"
                onClick={() => setCheckout(false)}
                data-testid="button-close-checkout"
              >
                <X />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              A demo checkout — no payment is taken.
            </p>

            <div className="mt-6 space-y-4">
              {[
                ['customerName', 'Your name'],
                ['phone', 'Phone number'],
                ['deliveryAddress', 'Delivery address'],
              ].map(([key, label]) => (
                <input
                  key={key}
                  required
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value,
                    })
                  }
                  placeholder={label}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm outline-none focus:border-primary"
                  data-testid={`input-checkout-${key}`}
                />
              ))}
            </div>

            <button
              disabled={order.isPending}
              className="mt-6 w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
              data-testid="button-place-order"
            >
              {order.isPending
                ? 'Placing order…'
                : 'Place order'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function OrdersPage() {
  const {
    data: me,
    isLoading: authLoading,
  } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useListOrders({
    query: {
      enabled: !!me,
      queryKey: getListOrdersQueryKey(),
    },
  });

  const orders = asArray<Order>(data);

  if (authLoading) return <Loading />;

  if (!me) {
    return (
      <EmptyState
        icon={Package}
        title="Your order trail starts here"
        copy="Sign in to see past purchases and delivery updates."
        action={
          <Link
            href="/profile"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-orders-login"
          >
            Sign in to view orders
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your SHEMSU trail"
        title="Orders"
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : orders.length ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No orders yet"
          copy="Your first local find is waiting in the market."
          action={
            <Link
              href="/search"
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-orders-shop"
            >
              Start shopping
            </Link>
          }
        />
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const items = asArray<any>((order as any)?.items);

  return (
    <div
      className="rounded-3xl border border-border bg-card p-5"
      data-testid={`row-order-${order.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono-app text-[10px] uppercase tracking-widest text-muted-foreground">
            Order #{order.id}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-bold capitalize text-primary">
          {order.status}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {items.map((item: any, i) => (
          <div
            key={i}
            className="flex justify-between text-sm"
          >
            <span className="text-muted-foreground">
              {item.quantity} × {item.productName}
            </span>

            <span className="font-mono-app text-xs">
              {money(
                Number(item.price || 0) *
                  Number(item.quantity || 0),
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-between border-t border-border pt-4 text-sm font-bold">
        <span>Total</span>

        <span className="font-mono-app text-primary">
          {money(order.total)}
        </span>
      </div>
    </div>
  );
}

function ProfilePage() {
  const {
    data: me,
    isLoading,
    refetch,
  } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const [auth, setAuth] = useState<
    'login' | 'signup'
  >('login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const { toast } = useToast();
  const qc = useQueryClient();
  const login = useLogin();
  const signup = useSignup();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const mutation =
      auth === 'login' ? login : signup;

    mutation.mutate(
      {
        data:
          auth === 'login'
            ? {
                email: form.email,
                password: form.password,
              }
            : form,
      },
      {
        onSuccess: (user) => {
          qc.setQueryData(
            getGetMeQueryKey(),
            user,
          );

          toast({
            title: `Welcome${
              user.name
                ? `, ${user.name.split(' ')[0]}`
                : ''
            }`,
          });
        },
        onError: () =>
          toast({
            title: 'Could not sign you in',
            description:
              'Check your details and try again.',
            variant: 'destructive',
          }),
      },
    );
  };

  if (isLoading) return <Loading />;

  if (me) {
    return (
      <div className="mx-auto max-w-2xl space-y-7">
        <div className="rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10">
          <div className="flex items-start justify-between">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-2xl font-bold text-primary">
              {me.name
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <span className="rounded-full border border-primary-foreground/20 px-3 py-1 font-mono-app text-[10px] uppercase tracking-widest text-secondary">
              {me.role}
            </span>
          </div>

          <h1 className="mt-7 font-display text-4xl">
            {me.name}
          </h1>

          <p className="mt-1 text-sm text-primary-foreground/70">
            {me.email} · {me.phone}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/orders"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 font-semibold text-primary"
            data-testid="link-profile-orders"
          >
            <span className="flex items-center gap-3">
              <Package size={19} />
              My orders
            </span>

            <ChevronRight size={17} />
          </Link>

          <Link
            href="/favorites"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 font-semibold text-primary"
            data-testid="link-profile-favorites"
          >
            <span className="flex items-center gap-3">
              <Heart size={19} />
              Saved finds
            </span>

            <ChevronRight size={17} />
          </Link>

          <Link
            href="/seller"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 font-semibold text-primary"
            data-testid="link-profile-seller"
          >
            <span className="flex items-center gap-3">
              <Store size={19} />
              Seller studio
            </span>

            <ChevronRight size={17} />
          </Link>
        </div>

        <button
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                qc.setQueryData(
                  getGetMeQueryKey(),
                  undefined,
                );

                refetch();
                setLocation('/');
              },
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-bold text-primary"
          data-testid="button-logout"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-primary">
          <CircleUserRound size={28} />
        </div>

        <h1 className="mt-5 font-display text-4xl text-primary">
          {auth === 'login'
            ? 'Welcome back'
            : 'Join the market'}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {auth === 'login'
            ? 'Your saved finds are waiting.'
            : 'Shop local. Share good finds.'}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        {auth === 'signup' && (
          <input
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="Full name"
            className="mb-3 w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm outline-none"
            data-testid="input-auth-name"
          />
        )}

        {auth === 'signup' && (
          <input
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            placeholder="Phone (optional)"
            className="mb-3 w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm outline-none"
            data-testid="input-auth-phone"
          />
        )}

        <input
          required
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
          placeholder="Email address"
          className="mb-3 w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm outline-none"
          data-testid="input-auth-email"
        />

        <input
          required
          minLength={6}
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
          placeholder="Password"
          className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-sm outline-none"
          data-testid="input-auth-password"
        />

        <button
          disabled={
            login.isPending || signup.isPending
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          data-testid="button-auth-submit"
        >
          {auth === 'login' ? (
            <LogIn size={17} />
          ) : (
            <UserPlus size={17} />
          )}

          {auth === 'login'
            ? 'Sign in'
            : 'Create account'}
        </button>
      </form>

      <button
        onClick={() =>
          setAuth(
            auth === 'login'
              ? 'signup'
              : 'login',
          )
        }
        className="mt-5 w-full text-center text-sm font-semibold text-primary underline decoration-secondary decoration-2 underline-offset-4"
        data-testid="button-toggle-auth"
      >
        {auth === 'login'
          ? 'New here? Create an account'
          : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}

function SellerGate({
  children,
}: {
  children: ReactNode;
}) {
  const { data: me, isLoading } =
    useGetMe({
      query: {
        retry: false,
        queryKey: getGetMeQueryKey(),
      },
    });

  if (isLoading) return <Loading />;

  if (!me) {
    return (
      <EmptyState
        icon={Store}
        title="Seller studio is members only"
        copy="Sign in to manage your products and orders."
        action={
          <Link
            href="/profile"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-seller-login"
          >
            Sign in
          </Link>
        }
      />
    );
  }

  if (
    me.role !== 'seller' &&
    me.role !== 'admin'
  ) {
    return (
      <EmptyState
        icon={Store}
        title="Ready to sell?"
        copy="Your account is currently a buyer account. Seller access is managed by the SHEMSU team."
        action={
          <Link
            href="/profile"
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            data-testid="link-seller-profile"
          >
            Back to profile
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}

function SellerPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetSellerDashboard({
    query: {
      queryKey:
        getGetSellerDashboardQueryKey(),
    },
  });

  const qc = useQueryClient();
  const del = useDeleteProduct();
  const { toast } = useToast();

  if (isLoading) {
    return <Loading label="Opening your studio" />;
  }

  if (isError || !data) {
    return <ErrorState retry={refetch} />;
  }

  const safeData = data as any;
  const sellerProducts = asArray<Product>(
    safeData.products,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            For the makers
          </p>

          <h1 className="mt-1 font-display text-4xl text-primary">
            Seller studio
          </h1>
        </div>

        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          data-testid="link-new-product"
        >
          <Plus size={17} />
          Add product
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="font-mono-app text-2xl font-bold text-primary">
            {safeData.totalProducts ?? 0}
          </p>

          <p className="mt-1 text-xs text-primary/60">
            Products
          </p>
        </div>

        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
          <p className="font-mono-app text-2xl font-bold text-secondary">
            {safeData.totalOrders ?? 0}
          </p>

          <p className="mt-1 text-xs text-primary-foreground/60">
            Orders
          </p>
        </div>

        <div className="rounded-2xl bg-accent/15 p-4">
          <p className="font-mono-app text-2xl font-bold text-primary">
            {money(safeData.sales ?? 0).split(' ')[0]}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Sales ETB
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <Link
          href="/seller"
          className="rounded-full bg-muted px-4 py-2 text-xs font-bold text-primary"
          data-testid="link-seller-products"
        >
          Products
        </Link>

        <Link
          href="/seller/orders"
          className="rounded-full px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
          data-testid="link-seller-orders"
        >
          Orders
        </Link>
      </div>

      {sellerProducts.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {sellerProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-3"
              data-testid={`row-seller-product-${p.id}`}
            >
              <img
                src={p.image}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">
                  {p.name}
                </p>

                <p className="mt-1 font-mono-app text-xs text-muted-foreground">
                  {money(p.price)} · {p.quantity} in stock
                </p>
              </div>

              <Link
                href={`/seller/products/${p.id}/edit`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary"
                data-testid={`link-edit-product-${p.id}`}
              >
                <Pencil size={15} />
              </Link>

              <button
                onClick={() =>
                  del.mutate(
                    { id: p.id },
                    {
                      onSuccess: () => {
                        qc.invalidateQueries({
                          queryKey:
                            getGetSellerDashboardQueryKey(),
                        });

                        toast({
                          title: 'Product removed',
                        });
                      },
                    },
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent"
                data-testid={`button-delete-product-${p.id}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="Your shelf is empty"
          copy="Add your first product and let shoppers find it."
          action={
            <Link
              href="/seller/products/new"
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-empty-new-product"
            >
              Add your first product
            </Link>
          }
        />
      )}
    </div>
  );
}

function ProductForm({
  existing,
}: {
  existing?: Product;
}) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [form, setForm] = useState<ProductInput>({
    name: existing?.name ?? '',
    price: existing?.price ?? 0,
    category: existing?.category ?? '',
    description: existing?.description ?? '',
    image: existing?.image ?? '',
    quantity: existing?.quantity ?? 1,
  });

  const set = (
    key: keyof ProductInput,
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]:
        key === 'price' ||
        key === 'quantity'
          ? Number(value)
          : value,
    }));

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const mutation = existing ? update : create;

    const variables = existing
      ? {
          id: existing.id,
          data: form,
        }
      : {
          data: form,
        };

    mutation.mutate(variables as never, {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey:
            getGetSellerDashboardQueryKey(),
        });

        qc.invalidateQueries({
          queryKey: getListProductsQueryKey(),
        });

        toast({
          title: existing
            ? 'Product updated'
            : 'Product published',
        });

        setLocation('/seller');
      },
      onError: () =>
        toast({
          title: 'Could not save product',
          variant: 'destructive',
        }),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <Link
        href="/seller"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground"
        data-testid="link-back-seller"
      >
        <ArrowLeft size={17} />
        Seller studio
      </Link>

      <div>
        <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
          Build your shelf
        </p>

        <h1 className="mt-1 font-display text-4xl text-primary">
          {existing
            ? 'Edit product'
            : 'New product'}
        </h1>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-primary sm:col-span-2">
            Product name
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) =>
                set('name', e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-name"
            />
          </label>

          <label className="text-sm font-semibold text-primary">
            Price (ETB)
            <input
              required
              min={0}
              type="number"
              value={form.price}
              onChange={(e) =>
                set('price', e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-price"
            />
          </label>

          <label className="text-sm font-semibold text-primary">
            Quantity
            <input
              required
              min={0}
              type="number"
              value={form.quantity}
              onChange={(e) =>
                set('quantity', e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-quantity"
            />
          </label>

          <label className="text-sm font-semibold text-primary sm:col-span-2">
            Category
            <input
              required
              minLength={2}
              value={form.category}
              onChange={(e) =>
                set('category', e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-category"
            />
          </label>

          <label className="text-sm font-semibold text-primary sm:col-span-2">
            Image URL
            <input
              required
              value={form.image}
              onChange={(e) =>
                set('image', e.target.value)
              }
              placeholder="https://…"
              className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-image"
            />
          </label>

          <label className="text-sm font-semibold text-primary sm:col-span-2">
            Description
            <textarea
              required
              minLength={2}
              rows={5}
              value={form.description}
              onChange={(e) =>
                set('description', e.target.value)
              }
              className="mt-2 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3.5 font-normal outline-none"
              data-testid="input-product-description"
            />
          </label>
        </div>

        <button
          disabled={
            create.isPending ||
            update.isPending
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          data-testid="button-save-product"
        >
          {create.isPending ||
          update.isPending ? (
            'Saving…'
          ) : (
            <>
              <Check size={17} />
              {existing
                ? 'Save changes'
                : 'Publish product'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function EditProductPage() {
  const { id } =
    useParams<{ id: string }>();

  const productId = Number(id);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetProduct(productId, {
    query: {
      queryKey:
        getGetProductQueryKey(productId),
    },
  });

  if (isLoading) return <Loading />;

  if (isError || !data) {
    return <ErrorState retry={refetch} />;
  }

  return <ProductForm existing={data} />;
}

function NewProductPage() {
  return <ProductForm />;
}

function SellerOrdersPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useListSellerOrders({
    query: {
      queryKey:
        getListSellerOrdersQueryKey(),
    },
  });

  const orders = asArray<Order>(data);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">
            Fulfilment
          </p>

          <h1 className="mt-1 font-display text-4xl text-primary">
            Seller orders
          </h1>
        </div>

        <Link
          href="/seller"
          className="text-sm font-bold text-primary"
          data-testid="link-orders-dashboard"
        >
          Dashboard
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : orders.length ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No orders to fulfil"
          copy="When shoppers find your products, their orders will appear here."
        />
      )}
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route
          path="/"
          component={HomePage}
        />

        <Route
          path="/discover"
          component={DiscoverPage}
        />

        <Route
          path="/search"
          component={SearchPage}
        />

        <Route
          path="/product/:id"
          component={ProductPage}
        />

        <Route
          path="/favorites"
          component={FavoritesPage}
        />

        <Route
          path="/cart"
          component={CartPage}
        />

        <Route
          path="/orders"
          component={OrdersPage}
        />

        <Route
          path="/profile"
          component={ProfilePage}
        />

        <Route path="/seller/products/new">
          {() => (
            <SellerGate>
              <NewProductPage />
            </SellerGate>
          )}
        </Route>

        <Route path="/seller/products/:id/edit">
          {() => (
            <SellerGate>
              <EditProductPage />
            </SellerGate>
          )}
        </Route>

        <Route path="/seller/orders">
          {() => (
            <SellerGate>
              <SellerOrdersPage />
            </SellerGate>
          )}
        </Route>

        <Route path="/seller">
          {() => (
            <SellerGate>
              <SellerPage />
            </SellerGate>
          )}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(
            /\/$/,
            '',
          )}
        >
          <Shell>
            <Router />
          </Shell>
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
