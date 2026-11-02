# QA and Security Audit — Initial Source Review

**Scope:** Static inspection of the supplied ZIP. This is not a claim that the app has passed runtime tests. A live database and configured environment were not available in this review.

## Initial findings

### Build environment
- Separate `backend/` and `frontend/` npm projects; install dependencies in each directory.
- The README specifies Node.js 20.19+ or 22.12+ and npm 10+.
- Backend scripts include `build`, `typecheck`, `lint`, `db:check`, `db:migrate`, and `db:seed`. Frontend scripts include `build` and `lint`.
- Dependency installation did not complete within the available execution window, so TypeScript builds and lint commands remain **unverified**. Live Neon connectivity and migrations are also **unverified**.

### Seeder and accounts
- `backend/src/db/seed.ts` creates 50 suppliers, 50 customers, 50 products, and 200 sales with sale items and inventory movements.
- The seed uses a deterministic PRNG and refuses to run when business tables already contain suppliers, customers, products, or sales. It is intended for an empty/demo database and should not be run against production data.
- The seeder does not create a dedicated login account. It associates seeded sales/movements with the first existing user if one exists; otherwise the cashier reference is null. Create the initial account through the app before seeding if you want demo sales attributed to a user.
- Registration promotes the first account in an empty users table to `admin`; later registrations become `staff`. This needs controlled provisioning before public deployment (details in `FINAL_DEFENSE.md`).

### Role and route review
- `GET /api/users` and related user-management routes require `admin` at router level.
- All analytics routes require `admin` at router level.
- Product/customer/supplier deletion requires `admin`.
- Authenticated staff can currently create/update products, customers, and suppliers; view inventory; restock; and record sales. Confirm this matches the institution/business requirements.
- Authorization is implemented server-side. Still test forbidden requests using a staff token to verify expected HTTP 403 responses.

### Sales and inventory
- The sale service documents atomic transaction behavior: product locking and stock validation, database-authoritative prices, sale and line inserts, stock deduction, and inventory movement entries.
- This is a promising implementation pattern, but must be verified with integration tests against PostgreSQL, including insufficient stock, concurrent sales, and rollback after a forced failure.

## Commands to run in a configured environment

From the project root, use two terminals:

```bash
cd backend
npm ci
npm run typecheck
npm run lint
npm run db:check
npm run build
```

```bash
cd frontend
npm ci
npm run lint
npm run build
```

After configuring `backend/.env` using `.env.example` and applying migrations to a disposable database:

```bash
cd backend
npm run db:migrate
# Register a demo account in the UI, then seed only an empty demo database:
npm run db:seed
npm run dev
```

In another terminal:

```bash
cd frontend
# Configure frontend/.env from frontend/.env.example
npm run dev
```

Check actual environment variable names in the two `.env.example` files before running. Never share secrets in screenshots or defense materials.

## Manual acceptance matrix

| Area | Test | Expected result | Status in this review |
|---|---|---|---|
| Build | Backend typecheck/build/lint | All commands pass | Not run to completion; dependency install timed out |
| Build | Frontend lint/build | All commands pass | Not run |
| Database | Migration and health check | Database reachable and schema current | Not run; credentials required |
| Seeder | Seed empty demo DB | 50 suppliers, 50 customers, 50 products, 200 sales, matching item/movement records | Source reviewed; runtime not run |
| Seeder safety | Seed non-empty business tables | Refuses to seed | Source reviewed; runtime not run |
| Auth | Invalid email/password | Generic 401 error | Source reviewed; runtime not run |
| Roles | Staff requests `/api/users` and `/api/analytics/overview` | 403 Forbidden | Route middleware reviewed; runtime not run |
| CRUD | Create/read/update/delete records under allowed roles | Validation and expected persistence | Not run |
| Sales | Valid sale | Correct total, sale items, stock deductions, movement rows | Transaction implementation reviewed; runtime not run |
| Sales | Quantity exceeds stock | Request rejected; no partial writes | Must integration-test |
| Concurrency | Two sales compete for same stock | No negative stock or inconsistent ledger | Must integration-test |
| Analytics | Compare dashboard values with source records | Totals and trends agree | Not run |

## Release gate

Do not describe the project as fully tested until all commands and integration checks above pass in an environment configured with a disposable PostgreSQL database. Record the Node/npm versions, command output, test date, and any fixes in the final submission.
