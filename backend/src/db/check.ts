import { sql } from 'drizzle-orm';
import { closeDatabase, db } from './client.js';

/**
 * npm run db:check
 *
 * Verifies that DATABASE_URL works and that the expected tables exist.
 * Run it after configuring Neon and after `npm run db:migrate`.
 */
const expectedTables = [
  'customers',
  'inventory_movements',
  'products',
  'sale_items',
  'sales',
  'suppliers',
  'users',
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Drizzle wraps driver errors; the cause contains the useful message.
    if (error.cause instanceof Error && error.cause.message) {
      return error.cause.message;
    }
    return error.message;
  }
  return String(error);
}

async function main(): Promise<void> {
  if (!db) {
    console.error(
      '[db:check] DATABASE_URL is not set. Add your Neon connection string to backend/.env first.',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const connection = await db.execute(sql`
      select
        current_database() as database,
        current_user as "user",
        current_setting('server_version') as server_version
    `);

    const info = connection.rows[0];
    console.log('[db:check] Connection successful.');
    console.log(`[db:check] Database: ${String(info?.database ?? 'unknown')}`);
    console.log(`[db:check] User: ${String(info?.user ?? 'unknown')}`);
    console.log(`[db:check] PostgreSQL version: ${String(info?.server_version ?? 'unknown')}`);

    const tables = await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    const tableNames = tables.rows.map((row) => String(row.table_name));
    console.log(`[db:check] Tables in public schema: ${tableNames.join(', ') || '(none)'}`);

    const missing = expectedTables.filter((table) => !tableNames.includes(table));
    if (missing.length > 0) {
      console.error(`[db:check] Missing tables: ${missing.join(', ')}`);
      console.error('[db:check] Apply the migrations with: npm run db:migrate');
      process.exitCode = 1;
      return;
    }

    console.log('[db:check] All expected tables are present.');

    // Phase 5 creates sales and updates stock inside one transaction, so make
    // sure the configured driver really supports interactive transactions.
    await db.transaction(async (tx) => {
      await tx.execute(sql`select 1`);
    });
    console.log('[db:check] Interactive transactions are supported.');
  } catch (error) {
    console.error('[db:check] Connection failed.');
    console.error(getErrorMessage(error));
    console.error(
      '[db:check] Check that the Neon connection string is correct and includes ?sslmode=require.',
    );
    process.exitCode = 1;
  } finally {
    // The Neon Pool keeps a WebSocket open; close it so the script can exit.
    await closeDatabase().catch((error: unknown) => {
      console.error(
        '[db:check] Could not close the database pool:',
        error instanceof Error ? error.message : error,
      );
    });
  }
}

void main();
