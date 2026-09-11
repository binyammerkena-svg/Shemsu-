# SHEMSU

SHEMSU is a mobile-first Ethiopian and African marketplace where shoppers browse, swipe, save, and order products from local sellers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/shemsu/src/App.tsx` — mobile-first marketplace UI and routes
- `artifacts/api-server/src/routes/marketplace.ts` — auth, catalog, favorites, cart, orders, and seller API
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/index.ts` — PostgreSQL schema for marketplace data

## Architecture decisions

- The API contract is OpenAPI-first and generated React Query hooks are used by the frontend.
- Checkout is intentionally demo-only; no financial provider is called.
- User passwords are stored as salted scrypt hashes, while sessions are stored in PostgreSQL and sent via HttpOnly cookies.
- Prices are returned as ETB today, with a currency field in the product response for future multi-currency support.

## Product

- Browse/search products across ten categories
- Discover products with pointer/touch swipe gestures
- Save favorites, manage a cart, and place demo orders
- Buyer profile with order history and demo sign-up/login
- Seller dashboard with product create/edit/delete and seller order views

## Gotchas

- Sample buyer login: `buyer@shemsu.demo` / `shemsu123`
- Sample seller login: `seller@shemsu.demo` / `shemsu123`
- Product images are public Pexels image URLs; sellers provide an image URL in the MVP.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
