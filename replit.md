# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## PISAL Ecommerce Project

### Brand
- **Name**: PISAL | Tagline: "Pure Taste of India"
- **Primary Color**: Deep red (HSL 0 72% 38%)
- **Accent Color**: Gold (HSL 42 80% 50%)
- **Font**: Playfair Display (serif headings), Inter (body)
- **Admin Phone**: 9999999999 | OTP: any 6 digits (or "123456")

### Architecture
- **Frontend**: React + Vite (`artifacts/pisal-store`) at path `/`
- **Backend API**: Express server (`artifacts/api-server`) at port 8080
- **Auth**: Phone+OTP login, JWT token stored in localStorage as `pisal_token`
- **Auth header injection**: Done in `lib/api-client-react/src/custom-fetch.ts`

### Database Schema (9 tables)
- `users` - customers + admin accounts
- `categories` - product categories (4 seeded)
- `products` - 10 PISAL spice products seeded
- `orders` + `order_items` - order management
- `coupons` - 4 seeded (PISAL10, PISAL20, WELCOME15, FREESHIP)
- `reviews` - product reviews
- `cart_items` - shopping cart
- `wishlist` - wishlisted products
- `addresses` - saved delivery addresses

### Frontend Pages
- `/` - Home page (hero, categories, featured products, newsletter)
- `/products` - Catalog with filters, search, price range
- `/products/:id` - Product detail with reviews
- `/cart` - Cart with coupon codes
- `/checkout` - Address + payment method selection
- `/orders` - Order list
- `/orders/:id` - Order tracking/detail
- `/wishlist` - Saved items
- `/profile` - Profile edit + saved addresses
- `/dashboard` - User Dashboard (Overview + analytics charts, My Orders with search/filter, My Savings with insights, Profile)
- `/admin` - Full admin dashboard (dashboard with recharts analytics/products/orders/customers/coupons tabs)

### API Endpoints (OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Auth: `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`, `POST /api/auth/logout`
- Products: `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`
- Cart: CRUD at `/api/cart`
- Wishlist: CRUD at `/api/wishlist/:productId`
- Orders: `GET/POST /api/orders`, `GET /api/orders/:id`
- Coupons: `POST /api/coupons/validate`
- Users: `GET/PATCH /api/users/profile`, addresses CRUD
- Admin: Dashboard, all orders, customers, coupons management

### Features Implemented
- Phone+OTP login
- Product catalog with category filters, search, price range filter, sort
- Shopping cart with quantity management
- Wishlist (heart toggle on products)
- Checkout with address selection + payment method (UPI/Card/COD)
- Order tracking with status steps
- Coupon code validation
- Loyalty points system (shown on profile)
- User profile management
- Saved addresses
- Admin dashboard (stats, products CRUD, order status updates, customers, coupons)
- User Dashboard at `/dashboard` with recharts analytics (bar/line/pie charts)
- Savings insights (total saved, best deal, savings trend chart, per-order savings bars)
- Orders search, date filter, price breakdown (MRP/Discount/Paid), reorder, invoice download
- Admin analytics charts: monthly revenue bar chart, orders trend line, top products horizontal bar, order status pie
- CartDrawer (Flipkart-style slide-in with coupon input and price breakdown)

### Loyalty Points
- 1 point per ₹10 spent
- Free delivery on orders > ₹499

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   ├── pisal-store/        # React+Vite frontend (main preview)
│   └── mockup-sandbox/     # Component preview server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + customFetch with auth
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── ...
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
