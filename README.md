# Sales & Inventory Management System with Business Analytics

A full-stack web application for small businesses such as convenience stores, grocery
stores, and school-supplies shops. It manages products, sales, customers, suppliers, and
stock, then uses **descriptive, predictive, and prescriptive analytics** to support real
business decisions.

> **Project status: Phases 1–8 implemented; final runtime verification is pending.**
> The original Phase 1–5 implementation is preserved. Phases 6–8 now add descriptive
> reports, a simple moving-average forecast, demand/stock-cover estimates, and explainable
> reorder and slow-moving-product recommendations. The analytics API uses existing Neon
> records and does not require a new database table or migration. Build and live Neon
> verification must be run in an environment with dependencies and credentials configured.

---

## Table of contents

1. [Project overview](#project-overview)
2. [System objectives](#system-objectives)
3. [Technology stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Project structure](#project-structure)
6. [Installation](#installation)
7. [Environment configuration](#environment-configuration)
8. [Neon database setup](#neon-database-setup)
9. [Database schema](#database-schema)
10. [Migrations](#migrations)
11. [Running the project](#running-the-project)
12. [Available scripts](#available-scripts)
13. [API documentation](#api-documentation)
14. [Authentication & roles](#authentication--roles)
15. [How the backend works](#how-the-backend-works)
16. [Technical decisions](#technical-decisions)
17. [Testing and verification](#testing-and-verification)
18. [Production build](#production-build)
19. [Troubleshooting](#troubleshooting)
20. [Roadmap](#roadmap)

---

## Project overview

The system gives a small business owner one place to answer three questions:

| Analytics type | Question | Example output |
| -------------- | -------- | -------------- |
| Descriptive | What happened? | Revenue this month, best-selling products, low-stock items |
| Predictive | What might happen? | Next month's expected sales, products likely to run out |
| Prescriptive | What should we do? | Which products to reorder, how much, and when |

The application is split into two independent projects:

- `backend/` — Express + TypeScript REST API, Drizzle ORM, Neon PostgreSQL
- `frontend/` — React + TypeScript single-page app built with Vite

---

## System objectives

- Record sales quickly and deduct stock safely inside a database transaction.
- Keep product, customer, supplier, and inventory records accurate.
- Warn the owner before popular products run out.
- Turn real sales records into understandable charts and reports.
- Provide explainable forecasts and recommendations (no random suggestions).
- Protect business data with authentication and role-based permissions.

---

## Technology stack

**Backend**

| Tool | Purpose |
| ---- | ------- |
| Node.js + TypeScript (strict) | Runtime and type safety |
| Express.js 5 | HTTP server and routing |
| Drizzle ORM | Typed SQL queries and schema definition |
| `@neondatabase/serverless` (WebSocket Pool) | Neon-compatible driver with transaction support |
| Drizzle Kit | Migration generation and Studio |
| Zod | Request and environment validation |
| bcrypt | Password hashing |
| jsonwebtoken | JWT access tokens |
| dotenv | Loading `.env` files |
| ESLint + typescript-eslint | Code quality |

**Frontend**

| Tool | Purpose |
| ---- | ------- |
| React 19 + TypeScript | UI and type safety |
| Vite | Dev server and production build |
| Tailwind CSS 4 | Utility-first styling |
| React Router | Page navigation |
| Axios | API requests |
| Recharts | Analytics charts |
| Lucide React | Icons |
| oxlint | Fast linting (included with the Vite template) |

**Database**

Neon Serverless PostgreSQL, managed through Drizzle ORM and Drizzle Kit migrations.

---

## Prerequisites

- **Node.js 20.19+ or 22.12+** (developed with Node 24)
- **npm 10+**
- A free **[Neon](https://neon.tech)** account
- Git (optional, but recommended)

No local PostgreSQL installation is required.

---

## Project structure

```
sales-inventory-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                    # Loads and validates environment variables
│   │   ├── controllers/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── inventory.controller.ts   # Stock, movements, alerts, restock
│   │   │   ├── product.controller.ts
│   │   │   ├── sale.controller.ts        # Sales history + sale entry
│   │   │   ├── supplier.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── enums.ts              # PostgreSQL enums
│   │   │   │   ├── users.ts
│   │   │   │   ├── suppliers.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── sales.ts
│   │   │   │   ├── saleItems.ts
│   │   │   │   ├── inventoryMovements.ts
│   │   │   │   ├── relations.ts          # Drizzle relation metadata
│   │   │   │   └── index.ts
│   │   │   ├── client.ts                 # Neon connection + requireDb()
│   │   │   ├── check.ts                  # npm run db:check
│   │   │   └── seed.ts                   # npm run db:seed (manual demo data)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts        # authenticate + requireRole
│   │   │   ├── error.middleware.ts       # Central error handler
│   │   │   ├── notFound.middleware.ts
│   │   │   ├── rateLimit.middleware.ts   # Limits repeated login attempts
│   │   │   └── validate.middleware.ts    # Zod body/param/query validation
│   │   ├── routes/
│   │   │   ├── analytics.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── sale.routes.ts
│   │   │   ├── supplier.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── index.ts                  # Mounts every feature router
│   │   ├── services/
│   │   │   ├── analytics.service.ts
│   │   │   ├── auth.service.ts           # Register, login, current user
│   │   │   ├── customer.service.ts       # Customers + purchase history
│   │   │   ├── inventory.service.ts      # Stock levels, movements, restock
│   │   │   ├── product.service.ts        # Catalogue + stock audit trail
│   │   │   ├── sale.service.ts           # Atomic sale creation + history
│   │   │   ├── supplier.service.ts       # Suppliers + linked products
│   │   │   └── user.service.ts           # Admin account management
│   │   ├── types/
│   │   │   ├── auth.ts                   # PublicUser, AuthResult, roles
│   │   │   └── express.d.ts              # Adds req.user and req.validatedQuery
│   │   ├── utils/
│   │   │   ├── AppError.ts
│   │   │   ├── dbErrors.ts               # Unique / foreign-key helpers
│   │   │   ├── jwt.ts                    # Sign and verify access tokens
│   │   │   ├── money.ts                  # Rounds amounts to 2 decimals
│   │   │   ├── pagination.ts             # Shared page metadata
│   │   │   └── password.ts               # bcrypt hash and compare
│   │   ├── validators/
│   │   │   ├── analytics.validator.ts
│   │   │   ├── auth.validator.ts         # Zod request schemas
│   │   │   ├── common.validator.ts       # IDs, pagination, money, quantities, dates
│   │   │   ├── customer.validator.ts
│   │   │   ├── inventory.validator.ts    # Stock, movement, restock schemas
│   │   │   ├── product.validator.ts
│   │   │   ├── sale.validator.ts         # Sale body + query schemas
│   │   │   └── supplier.validator.ts
│   │   ├── app.ts                        # Express app configuration
│   │   └── server.ts                     # Starts the HTTP server
│   ├── drizzle/
│   │   ├── 0000_condemned_sprite.sql     # Initial migration
│   │   └── meta/                         # Drizzle Kit snapshots
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── eslint.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── customers/
│   │   │   │   ├── CustomerFormModal.tsx  # Create/edit customer
│   │   │   │   └── PurchaseHistoryModal.tsx
│   │   │   ├── inventory/
│   │   │   │   └── RestockModal.tsx       # Receive a stock delivery
│   │   │   ├── products/
│   │   │   │   └── ProductFormModal.tsx   # Create/edit + stock adjustment
│   │   │   ├── sales/
│   │   │   │   ├── SaleDetailsModal.tsx   # Receipt with line items
│   │   │   │   └── SaleFormModal.tsx      # Sale entry + stock checks
│   │   │   ├── suppliers/
│   │   │   │   ├── SupplierDetailsModal.tsx
│   │   │   │   └── SupplierFormModal.tsx
│   │   │   ├── ui/                       # Button, Modal, Pagination, ...
│   │   │   ├── GuestRoute.tsx            # Redirects signed-in users
│   │   │   └── ProtectedRoute.tsx        # Requires login / a role
│   │   ├── context/
│   │   │   ├── authContext.ts
│   │   │   └── AuthProvider.tsx          # Login state + token handling
│   │   ├── hooks/
│   │   │   ├── useApiHealth.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useDebouncedValue.ts      # Delays search requests
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx             # Sidebar for signed-in pages
│   │   │   └── AuthLayout.tsx            # Login/register split screen
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── CustomersPage.tsx         # Customers + purchase history
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── HomePage.tsx              # Public landing + live status
│   │   │   ├── InventoryPage.tsx         # Stock levels + movement history
│   │   │   ├── LoginPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── ProductsPage.tsx          # Catalogue + stock warnings
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── SalesPage.tsx             # Sales history + sale entry
│   │   │   ├── SuppliersPage.tsx         # Suppliers + linked products
│   │   │   └── UsersPage.tsx             # Admin-only account management
│   │   ├── services/
│   │   │   ├── analytics.service.ts
│   │   │   ├── api.ts                    # Axios + token interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── health.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── sale.service.ts
│   │   │   ├── supplier.service.ts
│   │   │   └── user.service.ts
│   │   ├── types/
│   │   │   ├── analytics.ts
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── customer.ts
│   │   │   ├── envelope.ts
│   │   │   ├── inventory.ts
│   │   │   ├── pagination.ts
│   │   │   ├── product.ts
│   │   │   ├── sale.ts
│   │   │   └── supplier.ts
│   │   ├── utils/
│   │   │   ├── format.ts                 # Peso, number, and date display
│   │   │   ├── getErrorMessage.ts
│   │   │   ├── getFieldErrors.ts
│   │   │   └── tokenStorage.ts
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## Installation

Open a terminal in the project root.

### 1. Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Then open `backend/.env` and fill in the values (see
[Environment configuration](#environment-configuration)).

### 2. Frontend

```powershell
cd ..\frontend
npm install
```

The frontend works without a `.env` file because it defaults to
`http://localhost:7000/api`. Create `frontend/.env` only if your API runs elsewhere.

---

## Environment configuration

### `backend/.env`

| Variable | Required | Example | Notes |
| -------- | -------- | ------- | ----- |
| `DATABASE_URL` | Yes (for data) | `postgresql://...-pooler...neon.tech/neondb?sslmode=require` | **Pooled** Neon string used by the API at runtime |
| `DATABASE_URL_UNPOOLED` | Recommended | `postgresql://...neon.tech/neondb?sslmode=require` | **Direct** Neon string used only by Drizzle Kit migrations |
| `PORT` | No | `7000` | API port (default `7000`) |
| `JWT_SECRET` | Yes (for auth) | 48 random bytes as hex | Minimum 32 characters; signs login tokens |
| `JWT_EXPIRES_IN_DAYS` | No | `7` | How long a login stays valid (1–365) |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `FRONTEND_URL` | No | `http://localhost:5173` | Used for CORS |

### `frontend/.env`

| Variable | Required | Example |
| -------- | -------- | ------- |
| `VITE_API_URL` | No | `http://localhost:7000/api` |

**Generate a JWT secret** (do not reuse an example value):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET` in `backend/.env`. Never commit that file or paste the
secret into source code, screenshots, or chat.

Environment variables are validated with Zod when the backend starts. An invalid value
(for example a `PORT` that is not a number, a `DATABASE_URL` that is not a PostgreSQL
URL, or a `JWT_SECRET` shorter than 32 characters) stops the server with a clear message
instead of failing later in a confusing way.

> Empty `DATABASE_URL` and `JWT_SECRET` values are allowed so that `GET /api/health`
> keeps working before Neon and authentication are configured. Database-backed routes
> return `503`, and `/api/auth/*` returns `503` until `JWT_SECRET` is set.

---

## Neon database setup

You need **two** connection strings from the same Neon database:

- **Pooled** (hostname contains `-pooler`) → `DATABASE_URL`, used by the running API.
- **Direct** (no `-pooler`) → `DATABASE_URL_UNPOOLED`, used by Drizzle Kit for migrations.

Neon recommends a direct connection for migrations because PgBouncer (the pooler) does
not support every session-level feature migrations may use.

### Steps

1. Go to <https://neon.tech> and create a free account.
2. Click **Create project**, choose a name (for example `sales-inventory`) and the region
   closest to you.
3. Open the project dashboard and click **Connect**.
4. Copy the **pooled** connection string (the toggle should be set to *Pooled connection*)
   and make sure it keeps `?sslmode=require`.
5. Switch the toggle to the direct/unpooled connection and copy that string too.
6. Paste both into `backend/.env`:

   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

7. **Never commit** `backend/.env`. It is already listed in `.gitignore`.

If you only copy one string, use the pooled one for `DATABASE_URL`; Drizzle Kit will fall
back to it, but migrations are more reliable with the direct string.

Database tables are **never created automatically when the server starts**. Apply the
checked-in migrations explicitly (next section).

---

## Database schema

All tables use `snake_case` names in PostgreSQL and `camelCase` property names in
TypeScript. Money is stored as `NUMERIC(12, 2)`, timestamps use `timestamptz`, and IDs
are `serial` primary keys.

### Tables

| Table | Purpose | Important columns |
| ----- | ------- | ----------------- |
| `users` | Admin and staff accounts | `email` (unique), `password` (bcrypt hash), `role` (`admin` / `staff`) |
| `suppliers` | Product suppliers | `name` (unique), `contact_information`, `address`, `average_delivery_time_days` |
| `customers` | Buyers | `customer_type` (`walk-in` / `regular` / `wholesale`), `location`, `contact_information` |
| `products` | Items for sale | `name` (unique), `category`, `selling_price`, `purchase_cost`, `stock`, `reorder_level`, `supplier_id` |
| `sales` | One row per transaction | `customer_id`, `total_amount`, `payment_method`, `sale_date`, `processed_by` |
| `sale_items` | Products inside a sale | `sale_id`, `product_id`, `quantity`, `unit_price`, `subtotal` |
| `inventory_movements` | Audit trail of stock changes | `quantity_change` (signed), `stock_after`, `movement_type`, `sale_id`, `user_id`, `reason` |

### Relationships

```mermaid
erDiagram
    USERS ||--o{ SALES : processes
    USERS ||--o{ INVENTORY_MOVEMENTS : records
    SUPPLIERS ||--o{ PRODUCTS : supplies
    CUSTOMERS ||--o{ SALES : places
    SALES ||--|{ SALE_ITEMS : contains
    PRODUCTS ||--o{ SALE_ITEMS : sold_in
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : moves
    SALES ||--o{ INVENTORY_MOVEMENTS : causes
```

### Referential integrity and checks

- Deleting a **supplier** keeps its products and sets `supplier_id` to `NULL`.
- Deleting a **customer** keeps historical sales and sets `customer_id` to `NULL`.
- Deleting a **sale** removes its `sale_items` (`ON DELETE CASCADE`).
- A product that appears in **past sales cannot be deleted** (the API returns `409`) so
  revenue history stays accurate. Its database foreign key is `ON DELETE RESTRICT`.
- A product that was **never sold** can be deleted. The API removes its inventory
  movements and the product in one transaction, because there is no financial history to
  preserve.
- Database `CHECK` constraints prevent negative stock, prices, totals, and subtotals.
- `sale_items.quantity` must be greater than zero.
- `inventory_movements.quantity_change` cannot be zero, and `stock_after` cannot be negative.

### Enums

| Enum | Values |
| ---- | ------ |
| `user_role` | `admin`, `staff` |
| `customer_type` | `walk-in`, `regular`, `wholesale` |
| `payment_method` | `cash`, `card`, `mobile_money`, `bank_transfer` |
| `inventory_movement_type` | `initial`, `restock`, `sale`, `return`, `adjustment` |

---

## Migrations

The initial migration is already generated at
`backend/drizzle/0000_condemned_sprite.sql`. Review it before applying — it creates the 4
enums, 7 tables, 13 indexes, 8 foreign keys, and all check constraints.

### Apply the migration to Neon

```powershell
cd backend
npm run db:migrate
npm run db:check
```

`db:migrate` uses `DATABASE_URL_UNPOOLED` when present, otherwise `DATABASE_URL`.
`db:check` connects through the same driver the API uses, lists the tables, and confirms
that interactive transactions work.

> Drizzle Kit prints a generic WebSocket warning when it detects a Neon connection. It is
> informational — the migration still runs. Confirm the result with `npm run db:check`.

Expected `db:check` output:

```
[db:check] Connection successful.
[db:check] Database: neondb
[db:check] User: neondb_owner
[db:check] PostgreSQL version: ...
[db:check] Tables in public schema: customers, inventory_movements, ...
[db:check] All expected tables are present.
[db:check] Interactive transactions are supported.
```

### Changing the schema later

1. Edit the relevant file in `backend/src/db/schema/`.
2. Run `npm run db:generate` to create a new numbered migration.
3. **Read the generated SQL** and commit it with your code.
4. Run `npm run db:migrate`.
5. Run `npm run db:check`.

Use `npm run db:studio` to browse the data in Drizzle Studio.

> Migrations are never applied automatically by the API on startup. This prevents
> accidental schema changes in production.

### Demo data (seeding)

Seeding is **manual and opt-in**. The API never inserts demo records at startup.

```powershell
cd backend
npm run db:seed
```

The seeder creates a complete, repeatable demo dataset from a fixed random seed:

| Dataset | Count |
| ------- | ----- |
| Suppliers | 50 |
| Customers | 50 |
| Products | 50 |
| Sales | 200 (1–4 lines each) |
| Sale items | Determined by the generated sales |
| Inventory movements | Opening stock + one movement per sale line + restocks |
| Low-stock products | 5, for trying the alerts and filters |

The current verified run produced **499 sale items** and **549 inventory movements**.

Important behaviour:

- **It refuses to run when any business table already has rows.** If `suppliers`,
  `customers`, `products`, or `sales` is non-empty, the script stops and tells you which
  tables are populated. Use a fresh database, or clear those rows first.
- Sales are generated only from products that still have stock, so stock never goes
  negative and the sale count is always exactly 200.
- It does **not** create a user. Seeded sales have `processed_by = NULL`, which the UI
  shows as no cashier. The first account you register still becomes the administrator.
- It does not modify migrations or schema; run `npm run db:migrate` first.

To reset and reseed during development, clear the business tables in your Neon SQL editor
(or create a fresh Neon branch), then run `npm run db:seed` again. Never run the seeder
against production data.

---

## Running the project

Use **two terminals**.

**Terminal 1 — backend**

```powershell
cd backend
npm run dev
```

Expected output:

```
[server] API listening on http://localhost:7000
[server] Environment: development
[server] CORS origin: http://localhost:5173
```

**Terminal 2 — frontend**

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173>. The home page performs a real request to
`GET /api/health` and shows **API connected** when both servers are running.

---

## Available scripts

### Backend (`backend/`)

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Starts the API with `tsx watch` (auto-restarts on save) |
| `npm run build` | Type-checks and compiles TypeScript into `dist/` |
| `npm start` | Runs the compiled server from `dist/server.js` |
| `npm run typecheck` | Type-checks without writing files |
| `npm run lint` | Runs ESLint |
| `npm run db:check` | Verifies the Neon connection, tables, and transaction support |
| `npm run db:generate` | Generates a new SQL migration from the schema |
| `npm run db:migrate` | Applies pending migrations to Neon |
| `npm run db:seed` | Inserts deterministic demo data — only on an empty business database |
| `npm run db:studio` | Opens Drizzle Studio to browse data |

### Frontend (`frontend/`)

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Starts Vite on port `5173` |
| `npm run build` | Type-checks and builds the production bundle into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs oxlint |

---

## API documentation

Base URL: `http://localhost:7000/api`

### `GET /api/health`

Public liveness check. **Does not require a database connection.**

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-11-01T07:51:29.583Z"
}
```

Status: `200 OK`

### Error format

Every error returns the same shape:

```json
{
  "success": false,
  "message": "Route GET /api/unknown was not found"
}
```

Validation errors return `422` with a per-field map:

```json
{
  "success": false,
  "message": "Please check the highlighted fields.",
  "errors": {
    "fieldErrors": {
      "email": ["Enter a valid email address."],
      "password": ["Password must be at least 8 characters."]
    }
  }
}
```

### Authentication endpoints

All request bodies are JSON.

#### `POST /api/auth/register`

Creates an account. **The very first account becomes `admin`; every later account is
`staff`.** An admin can promote staff from the Users page.

```json
{ "name": "Maria Santos", "email": "owner@shop.com", "password": "StrongPass123" }
```

Response `201 Created`:

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 1,
      "name": "Maria Santos",
      "email": "owner@shop.com",
      "role": "admin",
      "createdAt": "2026-11-01T08:30:00.000Z"
    }
  }
}
```

| Status | Meaning |
| ------ | ------- |
| `201` | Account created |
| `409` | That email already has an account |
| `422` | Validation failed |
| `429` | Too many attempts from this client |
| `503` | `DATABASE_URL` or `JWT_SECRET` is not configured |

#### `POST /api/auth/login`

```json
{ "email": "owner@shop.com", "password": "StrongPass123" }
```

Response `200 OK` has the same `data` shape as registration (`token` + `user`).
Unknown email and wrong password both return `401` with the same message, so an attacker
cannot discover registered emails.

#### `GET /api/auth/me`

Requires `Authorization: Bearer <token>`. Returns the signed-in user:

```json
{ "success": true, "data": { "user": { "id": 1, "name": "...", "role": "admin", "...": "..." } } }
```

#### `POST /api/auth/logout`

Requires a token. JWTs are stateless, so this confirms the sign-out; the client deletes
its stored token. Response `200 OK`.

### User management endpoints (admin only)

Every route below requires a valid token whose user currently has the `admin` role.
A staff token receives `403`.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/users` | List every account (never includes password hashes) |
| `GET` | `/api/users/:id` | Get one account |
| `PATCH` | `/api/users/:id/role` | Change a role: `{ "role": "admin" }` or `{ "role": "staff" }` |
| `DELETE` | `/api/users/:id` | Delete an account |

Protection rules enforced in a database transaction:

- An admin cannot delete their own account.
- The last remaining admin cannot be demoted or deleted.
- Deleting an account invalidates that person's existing JWT immediately, because the
  middleware reloads the user from the database on every protected request.

### Example authenticated request

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:7000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"owner@shop.com","password":"StrongPass123"}'

Invoke-RestMethod -Uri http://localhost:7000/api/users `
  -Headers @{ Authorization = "Bearer $($login.data.token)" }
```

### Product endpoints

Every route requires a signed-in user. Staff and admins can view, create, and edit
products; only admins can delete them.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/products` | Paginated catalogue with search, filters, and sorting |
| `GET` | `/api/products/categories` | Distinct category names for the filter dropdown |
| `GET` | `/api/products/:id` | One product with its supplier name and `isLowStock` flag |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/:id` | Update a product (and record a stock adjustment) |
| `DELETE` | `/api/products/:id` | Delete a never-sold product (admin only) |

List query parameters:

| Parameter | Default | Notes |
| --------- | ------- | ----- |
| `page` | `1` | Positive whole number |
| `limit` | `20` | 1–100 |
| `search` | — | Case-insensitive match on name, category, or description |
| `category` | — | Exact category match |
| `supplierId` | — | Only products from that supplier |
| `lowStock` | — | `true` returns products where `stock <= reorderLevel` |
| `sort` | `name` | `name`, `newest`, `stock`, or `price` |
| `direction` | `asc` | `asc` or `desc` |

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Coffee",
        "description": "Ground coffee, 250 g",
        "category": "Beverages",
        "sellingPrice": 25.5,
        "purchaseCost": 12.25,
        "stock": 20,
        "reorderLevel": 5,
        "supplierId": 1,
        "supplierName": "Acme Supply",
        "isLowStock": false,
        "createdAt": "2026-11-01T08:30:00.000Z",
        "updatedAt": "2026-11-01T08:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

`POST` and `PUT` body (the same schema is used for both):

```json
{
  "name": "Coffee",
  "description": "Ground coffee, 250 g",
  "category": "Beverages",
  "sellingPrice": 25.5,
  "purchaseCost": 12.25,
  "stock": 20,
  "reorderLevel": 5,
  "supplierId": 1
}
```

`description` and `supplierId` are optional (`supplierId` may be `null`). `stock` defaults
to `0` and `reorderLevel` to `10` on create. On create, stock above zero writes an
`initial` inventory movement. On update, a changed stock value writes an `adjustment`
movement with the signed difference and the resulting stock.

| Status | Meaning |
| ------ | ------- |
| `201` | Product created |
| `200` | Product updated or deleted |
| `400` | Invalid `:id`, or the selected supplier no longer exists |
| `401` | Missing or invalid token |
| `404` | Product not found |
| `409` | Product name already exists, or the product appears in past sales and cannot be deleted |
| `422` | Body or query validation failed |
| `503` | `DATABASE_URL` is not configured |

### Customer endpoints

Every route requires a signed-in user. Staff and admins can view, create, and edit
customers; only admins can delete them.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/customers` | Paginated customers with real spend summaries |
| `GET` | `/api/customers/:id` | One customer |
| `GET` | `/api/customers/:id/purchases` | Purchase history and totals from real sales |
| `POST` | `/api/customers` | Create a customer |
| `PUT` | `/api/customers/:id` | Update a customer |
| `DELETE` | `/api/customers/:id` | Delete a customer (admin only) |

List query parameters: `page`, `limit`, `search` (name, location, or contact),
`customerType` (`walk-in`, `regular`, `wholesale`), `sort` (`name` or `newest`), and
`direction` (`asc` or `desc`).

Each list row includes `totalSpent`, `saleCount`, and `lastPurchaseAt`, calculated from
the `sales` table (zero/`null` when the customer has no purchases yet). `POST`/`PUT` body:

```json
{
  "name": "Maria Santos",
  "customerType": "regular",
  "location": "Cebu City",
  "contactInformation": "0917 000 0000"
}
```

`customerType` defaults to `regular`; `location` and `contactInformation` are optional.
Names do not have to be unique. Statuses: `201` created, `200` updated/deleted, `400`
invalid `:id`, `401` not signed in, `404` not found, `422` validation failed, `503`
database not configured.

Purchase history response `200 OK`:

```json
{
  "success": true,
  "data": {
    "customer": { "id": 1, "name": "Maria Santos", "...": "..." },
    "summary": {
      "saleCount": 3,
      "totalSpent": 1250.5,
      "averageSale": 416.83,
      "lastPurchaseAt": "2026-11-01T09:15:00.000Z"
    },
    "purchases": [
      {
        "id": 10,
        "saleDate": "2026-11-01T09:15:00.000Z",
        "totalAmount": 500,
        "paymentMethod": "cash",
        "processedByName": "Maria Santos",
        "items": [
          {
            "productId": 1,
            "productName": "Coffee",
            "quantity": 2,
            "unitPrice": 25.5,
            "subtotal": 51
          }
        ]
      }
    ]
  }
}
```

The endpoint returns the 20 newest sales, each with its items. Customers with no sales
correctly report zero purchases rather than mock data. Deleting a customer keeps their
sales; only `sales.customer_id` becomes `NULL`.

### Supplier endpoints

Every route requires a signed-in user. Staff and admins can view, create, and edit
suppliers; only admins can delete them.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/suppliers` | Paginated suppliers with product counts |
| `GET` | `/api/suppliers/:id` | Supplier details plus linked products (max 100) |
| `POST` | `/api/suppliers` | Create a supplier |
| `PUT` | `/api/suppliers/:id` | Update a supplier |
| `DELETE` | `/api/suppliers/:id` | Delete a supplier (admin only) |

List query parameters: `page`, `limit`, `search` (name, contact, or address), `sort`
(`name`, `newest`, or `delivery`), and `direction` (`asc` or `desc`). Delivery sorting puts
suppliers without a delivery time last.

`POST`/`PUT` body:

```json
{
  "name": "Acme Supply",
  "contactInformation": "supplier@acme.test",
  "address": "12 Test Street, Cebu City",
  "averageDeliveryTime": 3
}
```

`name` is required and unique. The other fields are optional; `averageDeliveryTime` is a
whole number of days or `null`. Statuses: `201` created, `200` updated/deleted, `400`
invalid `:id`, `401` not signed in, `404` not found, `409` duplicate name, `422`
validation failed, `503` database not configured.

`GET /api/suppliers/:id` returns the supplier plus `products`, where each product has
`id`, `name`, `category`, `stock`, `reorderLevel`, `sellingPrice`, and `isLowStock`.
Deleting a supplier keeps its products; only `products.supplier_id` becomes `NULL`.

### Sales endpoints

Every route requires a signed-in user. **Sales are immutable records:** the API exposes
create, list, and detail only. There is no update or delete endpoint, so recorded revenue
and stock history cannot silently change.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/sales` | Paginated sales history with customer, cashier, and line counts |
| `GET` | `/api/sales/:id` | One sale with its product line items |
| `POST` | `/api/sales` | Record a sale, deduct stock, and write inventory movements |

List query parameters:

| Parameter | Default | Notes |
| --------- | ------- | ----- |
| `page` | `1` | Positive whole number |
| `limit` | `20` | 1–100 |
| `search` | — | Sale number, customer name, cashier name, or product name |
| `paymentMethod` | — | `cash`, `card`, `mobile_money`, or `bank_transfer` |
| `customerId` | — | Only that customer's sales |
| `from` | — | `YYYY-MM-DD`, inclusive start date (UTC day) |
| `to` | — | `YYYY-MM-DD`, inclusive end date |
| `sort` | `date` | `date` or `total` |
| `direction` | `desc` | `asc` or `desc` |

An inverted range (`from` later than `to`) returns `422`.

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "sales": [
      {
        "id": 201,
        "saleDate": "2026-11-02T05:14:00.000Z",
        "totalAmount": 46,
        "paymentMethod": "card",
        "customerId": 1,
        "customerName": "Maria Santos",
        "processedByName": "Owner Account",
        "itemCount": 1
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 201, "totalPages": 11 }
  }
}
```

`GET /api/sales/:id` returns the same fields plus `createdAt` and `items`:

```json
{
  "success": true,
  "data": {
    "sale": {
      "id": 201,
      "saleDate": "2026-11-02T05:14:00.000Z",
      "totalAmount": 46,
      "paymentMethod": "card",
      "customerId": 1,
      "customerName": "Maria Santos",
      "processedByName": "Owner Account",
      "itemCount": 1,
      "createdAt": "2026-11-02T05:14:00.000Z",
      "items": [
        {
          "id": 700,
          "productId": 15,
          "productName": "A4 Bond Paper",
          "quantity": 2,
          "unitPrice": 23,
          "subtotal": 46
        }
      ]
    }
  }
}
```

`POST /api/sales` body:

```json
{
  "customerId": 1,
  "paymentMethod": "cash",
  "items": [
    { "productId": 15, "quantity": 2 }
  ]
}
```

- `customerId` may be `null` or omitted for a walk-in sale.
- `items` must contain 1–50 lines. The same product cannot appear twice; change the
  quantity instead. Duplicates return `422`.
- **The client never sends a price or total.** For each product the API locks the row,
  reads `sellingPrice` from the database, calculates `subtotal` and `totalAmount`, and
  stores those values.
- Stock is deducted and one `sale` movement (with the negative change, resulting balance,
  sale reference, and user) is written **in the same transaction**. If any line has
  insufficient stock, the whole sale is rejected and nothing changes.

Response `201 Created`:

```json
{
  "success": true,
  "message": "Sale #201 recorded successfully.",
  "data": { "sale": { "...": "same shape as GET /api/sales/:id" } }
}
```

| Status | Meaning |
| ------ | ------- |
| `201` | Sale recorded |
| `400` | Invalid `:id`, a missing customer/product, or an invalid customer reference |
| `401` | Missing or invalid token |
| `404` | Sale not found |
| `409` | Not enough stock for one of the products |
| `422` | Body or query validation failed (including duplicate products or a bad date range) |
| `503` | `DATABASE_URL` is not configured |

### Inventory endpoints

Every route requires a signed-in user. Staff and admins can view stock and receive
deliveries; restocking is a normal daily task, so it is not admin-only.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/inventory/stock` | Current stock levels with cost value and low-stock flags |
| `GET` | `/api/inventory/movements` | Full stock audit trail |
| `GET` | `/api/inventory/alerts` | Every product at or below its reorder level |
| `POST` | `/api/inventory/restock` | Add stock and write a `restock` movement |

#### `GET /api/inventory/stock`

Query parameters: `page`, `limit`, `search` (name, category, or description), `category`,
`supplierId`, `lowStock` (`true`/`false`), `sort` (`name`, `stock`, `value`, `newest`), and
`direction` (`asc`/`desc`).

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 15,
        "name": "A4 Bond Paper",
        "category": "Stationery",
        "stock": 156,
        "reorderLevel": 17,
        "sellingPrice": 23,
        "purchaseCost": 16.36,
        "supplierId": 15,
        "supplierName": "Blue Harbor Distributors",
        "stockValue": 2552.16,
        "isLowStock": false,
        "updatedAt": "2026-11-02T05:15:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

`stockValue` is `stock × purchaseCost` (cost, not selling price), rounded to two decimals.
`isLowStock` is true when `stock <= reorderLevel`.

#### `GET /api/inventory/movements`

Query parameters: `page`, `limit`, `productId`, `movementType` (`initial`, `restock`,
`sale`, `return`, `adjustment`), `from`, `to`, and `direction` (`asc`/`desc`, default
`desc`). The same inverted-range `422` rule applies.

```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": 550,
        "productId": 15,
        "productName": "A4 Bond Paper",
        "quantityChange": 5,
        "stockAfter": 156,
        "movementType": "restock",
        "saleId": null,
        "userName": "Owner Account",
        "reason": "Delivery from supplier",
        "createdAt": "2026-11-02T05:15:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 550, "totalPages": 28 }
  }
}
```

#### `GET /api/inventory/alerts`

Returns every product where `stock <= reorderLevel`, most urgent first (lowest stock,
then name), capped at 100 rows:

```json
{
  "success": true,
  "data": {
    "total": 5,
    "alerts": [
      {
        "id": 7,
        "name": "Ballpoint Pen",
        "stock": 0,
        "reorderLevel": 12,
        "isLowStock": true,
        "...": "same fields as a stock row"
      }
    ]
  }
}
```

#### `POST /api/inventory/restock`

```json
{
  "productId": 15,
  "quantity": 10,
  "reason": "Delivery from supplier"
}
```

`quantity` must be a whole number of at least 1; `reason` is optional (255 characters).
The product row is locked, stock is increased, and a `restock` movement with the positive
change and new balance is written inside one transaction.

Response `200 OK`:

```json
{
  "success": true,
  "message": "Stock updated for \"A4 Bond Paper\".",
  "data": { "product": { "...": "updated stock row with isLowStock" } }
}
```

| Status | Meaning |
| ------ | ------- |
| `200` | Stock received and movement recorded |
| `401` | Missing or invalid token |
| `404` | Product not found |
| `422` | Body or query validation failed |
| `503` | `DATABASE_URL` is not configured |

### Analytics endpoints

All analytics endpoints require a valid JWT and the `admin` role. Date-filtered reports
accept optional `from` and `to` query parameters in `YYYY-MM-DD` format; both dates are
inclusive. The API returns actual database records, not demo values.

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `GET` | `/api/analytics/overview` | Revenue, transaction count, average order value, customers, products, low-stock count, and current inventory value |
| `GET` | `/api/analytics/sales-trend` | Monthly revenue and transaction totals |
| `GET` | `/api/analytics/top-products` | Top 10 products ranked by units sold |
| `GET` | `/api/analytics/lowest-products` | 10 lowest-selling products, including products with zero sales |
| `GET` | `/api/analytics/category-performance` | Units sold and revenue grouped by product category |
| `GET` | `/api/analytics/inventory-summary` | Current product count, low/out-of-stock counts, and low-stock products |
| `GET` | `/api/analytics/forecast?months=6` | Revenue moving-average forecast and product demand/stock-cover estimates |
| `GET` | `/api/analytics/recommendations` | Reorder, stockout-risk, and slow-moving-product actions |

The dashboard overview endpoint is admin-only because it exposes business-wide financial
figures. Staff can still use the existing sales and inventory pages according to their
existing permissions.

### Analytics calculation rules

- Revenue and category/product revenue use the stored sale totals and sale-item subtotals.
- The date filter is applied to the sale timestamp, not the product creation date.
- Revenue forecasting averages the last three completed calendar months. Months with no
  sales are treated as zero. The forecast is an estimate and does not model seasonality.
- Product demand uses the previous 30 days of recorded quantities and estimates daily
  demand as `units sold / 30`; stock cover is `current stock / average daily demand`.
- Reorder recommendations compare current stock with the reorder level and estimated
  stock cover with supplier lead time. Suggested quantity targets at least two reorder
  levels or estimated lead-time demand plus a 14-day buffer, whichever is larger.
- Slow-moving products are those with more than the reorder level in stock and no more
  than two units sold in the previous 90 days. The system suggests reviewing promotions
  or future purchasing; it does not automatically change prices or stock.
- Sales have no status column in the existing schema, so every recorded sale is included
  in revenue and transaction reports. Do not interpret this as a separate paid/fulfilled
  status report.

---

## Authentication & roles

### How a login works

1. The client sends an email and password to `POST /api/auth/login`.
2. The service lowercases the email and looks the account up in PostgreSQL.
3. `bcrypt.compare` checks the password against the stored hash. The plain password is
   never stored or logged.
4. On success, the API signs a JWT with `JWT_SECRET` (HS256). The payload contains the
   user ID, role, and email — never a password or hash.
5. The token is returned once and stored by the browser.

Every protected request then sends `Authorization: Bearer <token>`. The `authenticate`
middleware:

1. verifies the signature and expiry,
2. loads the user from the database,
3. rejects the request with `401` if the account was deleted,
4. attaches the **current** role to `req.user`, so a demotion takes effect immediately.

`requireRole('admin')` then decides whether the route is allowed.

### Roles

| Role | Can do |
| ---- | ------ |
| `admin` | Everything: manage products, customers, and suppliers (including delete), record sales, receive stock, review inventory, open `/users`, change roles, and delete accounts |
| `staff` | View, create, and edit products, customers, and suppliers; record sales; receive stock and review inventory movements. Cannot delete business records or administer users. Analytics reports will be read-only for both roles |

### First account

After a fresh migration the `users` table is empty. The first successful registration is
made an `admin` inside a transaction guarded by a PostgreSQL advisory lock, so two
simultaneous first sign-ups cannot both become admin. Later registrations are `staff`.
If you ever delete every account, the next registration becomes the first admin again.

### Frontend behaviour

- `AuthProvider` keeps the signed-in user in React state and re-validates the stored token
  on page refresh with `GET /api/auth/me`.
- Axios adds the Bearer token to every request. A `401` (other than a bad login attempt)
  clears the token and resets the app to the signed-out state.
- `ProtectedRoute` blocks `/dashboard`, `/products`, `/sales`, `/inventory`,
  `/customers`, `/suppliers`, and `/users`. `/users` is additionally restricted to admins.
  `GuestRoute` sends signed-in users away from `/login` and `/register`.
- Admins see the **Users** navigation item and delete controls; staff do not, and the API
  rejects them even if they call `DELETE` directly.
- The Products, Customers, and Suppliers pages share the same patterns: debounced search,
  server-side filters/sorting, pagination, a create/edit modal, and a confirmation step
  before deleting.
- Products show a low-stock badge when `stock <= reorderLevel`. Customers show real spend
  totals and a purchase-history modal. Suppliers show product counts and a details modal
  with linked products.
- **Sales** lists every transaction with date, customer, payment method, cashier, line
  count, and total. The sale form loads the catalogue and customers, lets you add several
  products, shows a running total, and blocks quantities above the available stock before
  submitting. A details modal shows the full receipt and line items.
- **Inventory** has two views: **Stock levels** (on-hand, reorder level, cost value, and a
  restock action) and **Movement history** (every initial, sale, restock, return, and
  adjustment entry). A banner summarises low-stock products and links to a filtered view.
- After a sale, the page reloads the list, stock options, and alerts so the UI matches the
  transaction that just committed.
- Field errors from the API's `422` response are shown next to the relevant input; a
  failed delete (for example `409` for a sold product) is shown as a page alert.

### Security notes

- Passwords are hashed with **bcrypt** (cost factor 10, 72-byte limit enforced by Zod).
- Login/register are rate limited to **20 attempts per 10 minutes per client** (in-memory;
  reset by a server restart).
- Login failures use one generic message to avoid revealing registered emails.
- The JWT secret must be at least 32 characters and must never be committed.
- Authorisation is always re-checked server-side; hiding a button is not a security control.
- The token is stored in `localStorage` for simplicity. For a higher-security deployment,
  switch to short-lived access tokens plus an HttpOnly refresh cookie.

---

## How the backend works

A request flows through the app in this order:

```
server.ts        starts the HTTP server, closes the DB pool on shutdown
   ↓
app.ts           CORS, JSON parsing, mounts /api, 404 and error handlers
   ↓
routes/          decides which URL + method matches
   ↓
middleware/      rate limit → authenticate → requireRole → Zod validation
   ↓
controllers/     reads the validated request and sends the response
   ↓
services/        business rules and database queries
   ↓
db/client.ts     Neon connection + requireDb()
   ↓
db/schema/       Drizzle table definitions
```

- **Routes** stay small: they only wire URLs to controller functions.
- **Middleware** validates bodies, params, and query strings with Zod, verifies JWTs, and
  enforces roles before a controller runs.
- **Controllers** read the validated input and call services.
- **Services** contain business logic such as "hash the password, insert the user, sign a
  token" or "write the stock adjustment inside the same transaction as the product
  update".
- **Errors** are thrown as `AppError` and converted to consistent JSON in one place.

Express 5 automatically forwards rejected promises from `async` handlers to the error
middleware, so controllers do not need repetitive `try/catch` blocks.

`validateBody` and `validateParams` replace the request values with the parsed result.
Express 5 makes `req.query` read-only, so `validateQuery` stores the parsed filters on
`req.validatedQuery`; controllers then read that property, which already has numbers,
defaults, and trimmed strings instead of raw query-string values.

### Recording a sale and changing stock

Sale creation is the most important transaction in the system. Inside
`db.transaction(async (tx) => { ... })` the service:

1. checks that the optional customer still exists;
2. locks each product row with `SELECT ... FOR UPDATE` (in product-ID order, so two
   concurrent sales cannot deadlock or oversell);
3. compares the requested quantity with the locked `stock` and rejects with `409` if it is
   too high;
4. reads `sellingPrice` from the database and calculates each subtotal and the total;
5. inserts the `sales` row and all `sale_items`;
6. updates each product's stock and inserts one negative `sale` movement per line.

If any step throws, PostgreSQL rolls the whole transaction back. A sale can therefore never
exist without its items, stock deduction, and audit trail — and stock can never go negative
through the sales path.

Receiving stock follows the same idea on a smaller scale: lock the product row, add the
quantity, and insert a positive `restock` movement in one transaction. Editing a product's
stock directly from the catalogue continues to write an `adjustment` movement.

---

## Technical decisions

| Decision | Why |
| -------- | --- |
| Neon **WebSocket** driver instead of HTTP | The HTTP driver cannot run interactive transactions; recording a sale needs a single atomic transaction for sale + items + stock + movements |
| Pooled URL at runtime, direct URL for migrations | Matches Neon's recommendation; avoids PgBouncer limitations during DDL |
| `requireDb()` helper | Keeps `/api/health` working without a database and returns a clear `503` elsewhere |
| Separate `app.ts` and `server.ts` | The app can be tested without opening a port; `server.ts` handles listening and graceful shutdown |
| Zod validation for environment variables | Configuration mistakes are caught at startup with readable messages |
| Central error handler + `AppError` | Consistent JSON errors and correct HTTP status codes in one place |
| No database work during startup | Prevents surprise schema changes; migrations are explicit and reviewable |
| Database `CHECK` constraints | Stock and money values stay valid even if a future bug bypasses service logic |
| `ON DELETE RESTRICT` for sold products | Preserves accurate sales and analytics history |
| Never-sold products can be deleted with their movements | There is no financial history to preserve, so the catalogue stays tidy |
| Stock edits write an `adjustment` movement | A manual stock change is never silent; the audit trail records the signed difference and new balance |
| `ON DELETE SET NULL` for suppliers and customers | Deleting a contact never deletes products or sales, and revenue reports stay correct |
| Sales are immutable (no update/delete endpoint) | Preserves revenue history and keeps the stock audit trail explainable |
| Prices and totals calculated server-side | A browser cannot alter unit prices or totals by editing the request |
| Product rows locked with `FOR UPDATE` in ID order | Prevents overselling and deadlocks when two sales run at the same time |
| Sale, items, stock updates, and movements in one transaction | Sales and stock can never drift apart; a failure changes nothing |
| Dedicated restock endpoint | Receiving a delivery is a distinct positive event, not a silent stock edit |
| Sale search matches product names | Finds a transaction from the item the customer bought, not only its number |
| Deterministic, guarded demo seeder | Repeatable screenshots and demos without ever overwriting real business records |
| Aggregated spend/count summaries in list queries | The customer and supplier pages need totals without one extra request per row |
| Server-side search, filters, sorting, and pagination | Behaviour matches what the API exposes and stays correct as the data grows |
| Express 5 `req.validatedQuery` | Works with read-only `req.query` while keeping controllers strongly typed |
| Shared money and quantity validators | Prices, stock, and delivery days follow the same rules on every module |
| Peso formatting in one frontend utility | `en-PH` / `PHP` display is consistent and the database still stores plain `NUMERIC` |
| bcrypt instead of a custom hash | Industry-standard, deliberately slow, and never reversible |
| JWT (HS256) instead of server sessions | The API stays stateless and is easy to host; the role is re-read from the database per request |
| First registration becomes admin | A new installation needs an owner without a manual database edit |
| Role loaded per request | Deleted users and demotions take effect immediately instead of at token expiry |
| Generic login error | Prevents attackers from discovering which emails have accounts |
| Account changes inside transactions | Prevents two admins demoting each other and leaving no admin |
| Zod validation middleware | One consistent 422 shape with per-field messages for every form |
| In-memory rate limit on auth routes | Simple protection for this single-process project; swap for Redis in a clustered deployment |

---

## Testing and verification

### Phase 1 checks

```powershell
cd backend
npm run lint
npm run build
npm start        # use PORT=7100 in a second test if 7000 is already in use

Invoke-RestMethod http://localhost:7000/api/health

cd ..\frontend
npm run lint
npm run build
npm run dev
```

- `GET /api/health` returns `200` with the expected JSON body.
- Unknown routes return a JSON `404`.
- The React page loads, calls the API, and displays **API connected**.
- No browser console errors.

### Phase 2 checks

The migration was applied to Neon and the live schema was verified:

- `npm run db:migrate` created all 7 tables, 4 enums, 13 indexes, 8 foreign keys, and
  10 check constraints.
- The four enums contain exactly the expected values.
- All eight foreign keys use the intended `CASCADE`, `SET NULL`, or `RESTRICT` actions.
- All named indexes and check constraints exist in the `public` schema.
- A write inside `db.transaction()` was rolled back successfully, leaving zero rows.
- Inserting a product with `stock = -1` was rejected by
  `products_stock_non_negative`.
- `npm run db:check` reports all tables present and interactive transactions supported.
- The health endpoint still works independently of the database.

Reproduce the connection check at any time:

```powershell
cd backend
npm run db:check
```

### Phase 3 checks

Backend (32 assertions against the real Neon database):

- Invalid registration returns `422` with per-field errors.
- The first account becomes `admin`; the second becomes `staff`.
- Emails are stored lowercase and duplicates are rejected with `409` even with different casing.
- Unknown email and wrong password both return `401` with the same message.
- Correct login returns a three-part JWT.
- `GET /api/auth/me` works with a token and returns `401` without one.
- `GET /api/users` returns `403` for staff and `200` for admins.
- Admins can promote/demote accounts; the last admin cannot be demoted.
- An admin cannot delete their own account, but can delete another user.
- A deleted user's existing token immediately returns `401`.
- A demoted admin's existing token immediately loses access (`403`).
- Passwords are stored as bcrypt hashes, and no response ever includes them.
- Malformed JSON returns `400`; an invalid `:id` returns `400`.
- Backend build and ESLint pass.

Frontend (browser flow):

- Registered the first account → landed on the dashboard as **Admin**.
- Dashboard shows the real name, email, role, and join date (no mock numbers).
- Users page lists real accounts; the current admin's own role/delete controls are disabled.
- Sign out clears the token; signing in again works.
- A second account registers as **Staff**, has no Users navigation item, and is redirected
  away from `/users`.
- An admin promotes that account; after signing in again it can open `/users`.
- Zero console errors throughout.
- Frontend `npm run lint` and `npm run build` pass.

All temporary test accounts were deleted afterwards, so the database is empty and the
next real registration becomes the administrator.

> The `bcrypt` native module was verified on Node 24. If you use a different Node version
> and see a module error, run `npm rebuild bcrypt` in `backend/`.

### Phase 4 checks

Backend (55 assertions against the real Neon database):

- Product, customer, and supplier create/list/get/update/delete all return the documented
  shapes and status codes.
- Missing tokens return `401`; staff deletes return `403`; admin deletes succeed.
- Invalid bodies and query strings return `422` with per-field errors; invalid `:id`
  returns `400`; unknown records return `404`.
- Duplicate product and supplier names return `409` with a `name` field error.
- Product search matches name, category, and description; category, supplier, and
  `lowStock=true` filters work; every sort and direction is applied.
- Creating a product with stock writes an `initial` movement; editing stock writes an
  `adjustment` movement with the signed difference and correct `stockAfter`.
- Deleting a product that appears in a sale is rejected with `409`.
- Deleting a never-sold product removes its product row and inventory movements together.
- Customer list rows contain real `totalSpent`, `saleCount`, and `lastPurchaseAt` values.
- Customer purchase history returns the summary totals and nested sale items.
- Supplier details include linked products with the correct `isLowStock` flag.
- Deleting a supplier keeps linked products and sets `supplier_id` to `NULL`.
- Deleting a customer keeps sales and sets `customer_id` to `NULL`.
- Backend ESLint and build pass.

Frontend (browser flow):

- An admin creates and edits a supplier, then a product linked to it with opening stock;
  the low-stock badge updates when stock is raised above the reorder level.
- Product search, no-results state, category filter, sorting, and pagination work against
  the API.
- A customer is created and edited; the purchase-history modal reports zero purchases
  with a clear empty state before Phase 5.
- The supplier details modal lists the linked product.
- A staff account sees no delete buttons and no **Users** navigation item, is redirected
  from `/users`, and receives `403` from a direct `DELETE` API call.
- The admin deletes a supplier, product, customer, and staff account through the UI; the
  lists refresh and show the expected confirmation messages.
- Zero console errors across the pages; frontend `npm run lint` and `npm run build` pass.

All temporary Phase 4 records were removed afterwards with a one-off script. The `users`,
`products`, `customers`, `suppliers`, `sales`, `sale_items`, and `inventory_movements`
tables are back to **0 rows**, and the script was deleted.

### Phase 6–8 analytics verification checklist

These are the checks to run after installing dependencies and configuring `backend/.env`
with a migrated Neon database. They have **not** been run in the archive-inspection
environment because package installation could not reach the npm registry and no Neon
credentials were included.

1. Start the backend and frontend, then sign in with an admin account.
2. Open `/analytics`; verify the page loads from the database and the date filters change
   revenue, trend, product rankings, and category totals.
3. Compare the overview revenue with `SUM(sales.total_amount)` for the same date range.
4. Compare top/lowest product quantities with grouped `sale_items.quantity` joined to
   `sales` inside the same date range. Confirm products with no sales appear in the
   lowest-selling list with zero units.
5. Check inventory counts against `products.stock` and `products.reorder_level`.
6. Recalculate the revenue forecast manually from the last three completed months,
   including zero-sales months. Verify the forecast label is the next calendar month.
7. Check a product's 30-day unit sales, daily average, and estimated stock-cover days.
8. Check reorder recommendations against current stock, reorder level, 90-day sales
   velocity, and supplier lead time. Confirm the system never changes stock or prices.
9. Sign in as staff and verify `/analytics` and all `/api/analytics/*` endpoints return
   `403`; the dashboard should still show the staff-permitted recent sales list.
10. Try reversed dates and malformed date strings; expect a `422` validation response.

There are no new tables or migration files for analytics: every calculation uses the
existing `sales`, `sale_items`, `products`, `suppliers`, and `customers` records.

### Phase 5 checks

Backend (44 assertions against the real Neon database):

- The first registered test account becomes `admin`; every sales and inventory route
  returns `401` without a token.
- A temporary customer and product were created, then sold through `POST /api/sales`.
- Sale totals come from the database selling price, not the request; the sale stores its
  line items, customer, cashier, unit price, quantity, and subtotal.
- Stock is deducted correctly; a sale below the reorder level flips `isLowStock` to true.
- One negative `sale` movement is written per line with the resulting `stockAfter`, the
  sale reference, and the user name.
- Selling more than the available stock returns `409` and leaves stock unchanged.
- Duplicate products on one sale return `422`.
- Walk-in sales with `customerId: null` are recorded and listed.
- Restocking adds the quantity, writes a positive `restock` movement with the new
  balance and reason, and clears the low-stock flag when appropriate.
- Sales filters (search, payment method, customer, date range, sort) and the inverted-date
  `422` behave as documented; missing sales return `404`.
- Inventory stock filters, low-stock filter, movement type/date filters, and alerts return
  real database rows.
- Invalid restock quantities return `422`.
- Backend ESLint and build pass.

Seed verification (run twice):

- Exactly **50 suppliers, 50 customers, 50 products, 200 sales, 499 sale items, and 549
  inventory movements**.
- No product has negative stock; all 499 sale movements are negative.
- Exactly 5 products are at or below their reorder level.
- The seeder creates **0 users**, so the next registration becomes the administrator.
- The guard refuses to run when business tables already contain rows.

Frontend (browser flow):

- Registered a temporary admin and opened `/sales`: 200 seeded sales shown, 20 per page,
  filters and pagination working.
- Recorded sale **#201** through the UI (2 × A4 Bond Paper, card payment, customer 1):
  total **₱46.00**, stock moved **153 → 151**, and the movement history showed a `-2` sale
  entry referencing Sale #201 and the signed-in cashier.
- Opened the sale details modal; line item, total, payment method, customer, and cashier
  all matched the committed transaction.
- Opened `/inventory`: 50 products, 5 low-stock alerts, and 550 movements after the sale.
- Restocked A4 Bond Paper by **+5** through the UI: stock **151 → 156**, and the movement
  history showed a `+5` restock with the reason and user.
- Zero console errors across the pages; frontend `npm run lint` and `npm run build` pass.

After the browser checks, the temporary account and test sale were wiped and the database
was reseeded. Final verified state: **50 suppliers, 50 customers, 50 products, 200 sales,
499 sale items, 549 movements, 0 users, no negative stock**. All temporary verification
scripts were deleted.

---

## Production build

```powershell
# Backend
cd backend
npm run build
npm start

# Frontend
cd ..\frontend
npm run build
npm run preview
```

The backend serves only the API. The frontend is a separate static bundle in
`frontend/dist/` that can be hosted on Vercel, Netlify, or any static host. Set
`VITE_API_URL` at build time to the deployed API URL, and set `FRONTEND_URL` in the
backend environment to the deployed frontend URL so CORS allows it.

---

## Troubleshooting

| Problem | Solution |
| ------- | -------- |
| Home page says **API unreachable** | Start the backend (`cd backend; npm run dev`) and confirm it uses port `7000` |
| `EADDRINUSE` on port 7000 | Another process uses the port. Stop it, or change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env` |
| Browser CORS error | `FRONTEND_URL` in `backend/.env` must exactly match the frontend URL (including port) |
| Backend exits with "Invalid environment variables" | Check `backend/.env`; `PORT` must be a number, `DATABASE_URL` must start with `postgresql://`, and `JWT_SECRET`, if set, must be at least 32 characters |
| `db:check` says DATABASE_URL is not set | Paste your Neon pooled connection string into `backend/.env` |
| Migration fails with a PgBouncer/prepared-statement error | Set `DATABASE_URL_UNPOOLED` to Neon's direct connection string and retry `npm run db:migrate` |
| `db:check` reports missing tables | Run `npm run db:migrate` |
| `db:check` fails to connect | Confirm the password, hostname, and `?sslmode=require`; check that the Neon project is not suspended |
| Database-backed endpoints return `503` | `DATABASE_URL` is empty; the API intentionally refuses to guess a database |
| Auth endpoints return `503` | Set `JWT_SECRET` in `backend/.env` (at least 32 characters) and restart the backend |
| Login always says the password is incorrect | Confirm the account exists and the password is 8–72 characters; passwords are case-sensitive |
| `401` immediately after signing in | The token expired, the account was deleted, or `JWT_SECRET` changed (which invalidates all old tokens) |
| `403` on `/api/users` | The signed-in account is `staff`, not `admin`. Promote it from the Users page using an admin account |
| Cannot demote/delete an admin | The API refuses to remove the last remaining admin. Promote another account first |
| "Too many authentication attempts" | The in-memory limit allows 20 attempts per 10 minutes per client. Wait, or restart the backend |
| First registration is not admin | An account already exists in the database. Sign in as that admin and promote the new account, or clear the users table in a fresh database |
| Password field rejected as too long | bcrypt only checks the first 72 bytes, so the API rejects longer passwords explicitly |
| Product delete returns `409` | The product appears in past sales, so deleting it would corrupt sales history. Keep it, or delete the related sales first if that is really intended |
| Duplicate product or supplier name returns `409` | Names are unique per module. Choose a different name; customers may share names |
| `422` on a product list request | Check `page`, `limit` (1–100), `lowStock` (`true`/`false`), `sort`, and `direction` values against the tables above |
| Low-stock badge never appears | The badge appears when `stock <= reorderLevel`; check both values in the product editor |
| Purchase history is empty | No sales exist for that customer yet. Record a sale from the Sales page; the page never uses mock data |
| `npm run db:seed` refuses to run | The database already has business rows. Use a fresh database or clear `suppliers`, `customers`, `products`, and `sales` first; the seeder never overwrites real data |
| Seeded sales have no cashier | The seeder deliberately creates no user, so `processed_by` is `NULL`. Register an account and record new sales to see a cashier name |
| Sale returns `409` (not enough stock) | Stock is checked inside the sale transaction. Restock the product or reduce the quantity; the full sale is rolled back |
| Sale returns `422` for a duplicate product | Each product may appear only once per sale. Increase its quantity on the existing line instead |
| Cannot edit or delete a sale | Sales are immutable by design; the API has no update or delete route. Correct stock with a restock or product adjustment instead |
| A sale is missing from the list | Check the filters (customer, payment method, date range), clear them, or lower the search term. Sales are ordered newest first by default |
| Restock returns `422` | `quantity` must be a whole number of at least 1; `reason` is optional and limited to 255 characters |
| Inventory stock value looks different from selling price | `stockValue` uses `purchaseCost × stock`, not the selling price, so it reflects what the stock cost the business |
| Dashboard or sales pages show old totals | Reload the page or use the **Reload** button; each list is fetched from the API, and a newly committed sale should appear after the automatic refresh |
| Supplier/customer delete returns `404` | The record was already deleted (possibly in another tab). Reload the list |
| Delete buttons are missing | The signed-in account is `staff`. Deleting products, customers, suppliers, and users is an admin action |

---

## Roadmap

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | Project setup, Express + React + Tailwind, health endpoint | **Complete** |
| 2 | Neon connection, Drizzle schema, migrations, connectivity check | **Complete — previously verified on Neon** |
| 3 | Authentication, JWT, roles, login/register pages | **Complete — previously verified against Neon** |
| 4 | Product, customer, and supplier management | **Complete — previously verified against Neon** |
| 5 | Sales transactions, stock deduction, inventory movements, seed data | **Complete — previously verified against Neon** |
| 6 | Descriptive analytics, date filters, KPI cards, charts, lowest/top products | **Implemented; runtime verification pending** |
| 7 | Moving-average revenue forecast, product demand, stock-cover estimates | **Implemented; runtime verification pending** |
| 8 | Reorder, stockout-risk, and slow-moving recommendations | **Implemented; runtime verification pending** |
| 9 | Full integration, end-to-end testing, final documentation | **Partially completed; requires configured environment** |

---

## License

This project is created for educational purposes as a college Information Technology final
project.
