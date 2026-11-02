# Final Defense Notes — Sales & Inventory Management System

## 60–90 second project overview

“Our Sales and Inventory Management System is a full-stack web application for small businesses. The React and TypeScript frontend communicates with an Express and TypeScript REST API. The backend uses Drizzle ORM with PostgreSQL on Neon. Authenticated users can manage products, customers, suppliers, inventory, and sales. When a sale is recorded, the backend validates the request, reads authoritative product prices from the database, checks stock, writes the sale and sale items, deducts stock, and records inventory movements in one transaction. This keeps the sales history and inventory ledger consistent. Administrator-only analytics provide descriptive reports, moving-average forecasts, stock-cover estimates, and explainable reorder recommendations.”

## Architecture walkthrough

1. **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS 4, Axios, Recharts, and Lucide icons.
2. **API:** Express 5 routes delegate to controllers and service modules. Zod schemas validate incoming bodies, query strings, and IDs.
3. **Persistence:** Drizzle ORM talks to PostgreSQL through the Neon serverless driver. Database schema and SQL migrations are under `backend/src/db/schema` and `backend/drizzle`.
4. **Authentication:** Passwords are hashed; login returns a signed access token. Protected requests send a Bearer token. The authentication middleware reloads the user from the database so role changes and deleted accounts take effect immediately.
5. **Authorization:** Routes use `requireRole('admin')` for user management and analytics. Product, customer, and supplier deletion are administrator-only; staff can perform the documented day-to-day operations.
6. **Sales consistency:** Sale creation is designed to run in a transaction, lock/check products, use database prices, insert sale and line items, decrement stock, and append stock movements. A failed operation should roll back the complete transaction.

## Demo flow

1. Start the backend and frontend in separate terminals.
2. Confirm the API health endpoint and sign in with a known account.
3. Show the dashboard and explain the difference between staff operational views and administrator analytics.
4. Open Products and Inventory; show current stock and movement history.
5. Create a test sale using a product with known stock. Record its stock before and after, then show the sale details and inventory movement.
6. Attempt a sale quantity greater than available stock and confirm it is rejected without a partial sale or stock change.
7. Sign in as staff and attempt to open Users or Analytics; confirm access is denied by the API, not merely hidden in the interface.
8. Sign in as admin and show analytics, user-role management, and low-stock/reorder recommendations.

Use a disposable demo database for the defense. Do not seed or run destructive tests against a production database.

## Likely panel questions

**Why use a database transaction for a sale?**  A sale touches multiple related records. A transaction ensures the sale, its line items, stock deduction, and movement ledger succeed or fail together.

**Why should the server determine price?**  Browser values are untrusted. The backend reads the product's current selling price from the database so a client cannot alter the total by editing a request.

**How are roles enforced?**  The API authenticates the token, reloads the current user and role from the database, and applies role middleware to restricted routes. Hiding a button in the frontend is not considered authorization.

**What do the analytics mean?**  Descriptive analytics summarize recorded activity; the forecast uses a simple moving-average approach; recommendations use explainable demand, stock-cover, reorder-level, and slow-moving-product signals. They are decision support, not guaranteed predictions.

**What are limitations?**  Forecast quality depends on the amount and quality of historical sales. A production deployment should also use controlled account provisioning, secure secret management, backups, monitoring, and a tested deployment configuration.

## Important account-provisioning caveat

`backend/src/services/auth.service.ts` makes the first account registered in an empty user table an administrator and subsequent public registrations staff. This is convenient for a fresh demo but is a bootstrap risk if public registration remains enabled on a deployed instance: an attacker who registers first could become admin. Before production, provision the initial administrator through a controlled setup/seed process and disable or restrict public registration. Never publish real credentials or commit `.env` files.
