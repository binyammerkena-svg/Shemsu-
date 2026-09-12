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
 
