import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit reads this file for `db:generate`, `db:migrate`, and `db:studio`.
 * It loads backend/.env, so DATABASE_URL never appears in source code.
 */
// Prefer the direct URL for migrations. An empty string (the default in
// .env.example) must fall back to DATABASE_URL, so use || rather than ??.
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(
    '[drizzle] DATABASE_URL is not set. Add your Neon connection string to backend/.env first.',
  );
  process.exit(1);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
