import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import * as schema from './schema/index.js';

// Node 20 needs an explicit WebSocket implementation for Neon's Pool driver.
// (Node 22+ and Node 24 ship a global WebSocket, but this keeps older Node 20
// versions working too.)
neonConfig.webSocketConstructor = ws;

/**
 * Why the WebSocket driver instead of Neon's HTTP driver?
 *
 * Sales processing must be atomic: create the sale, create its items, reduce
 * stock, and write inventory movements in ONE database transaction. The
 * HTTP driver cannot run interactive transactions, so we use the Pool-based
 * driver, which supports `db.transaction()`.
 *
 * No connection is opened until a query runs. When DATABASE_URL is missing,
 * `db` is null so /api/health keeps working; database-backed routes call
 * requireDb() and get a clear 503 instead of a crash.
 */
function createDatabase() {
  if (!env.DATABASE_URL) {
    return null;
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });

  // Idle clients can emit errors (for example, a dropped connection).
  // Without a listener Node would crash the whole process.
  pool.on('error', (error: Error) => {
    console.error('[db] Unexpected pool error:', error.message);
  });

  return {
    pool,
    db: drizzle(pool, { schema }),
  };
}

const connection = createDatabase();

export const db = connection?.db ?? null;

export type Database = NonNullable<typeof db>;

/** Use this inside services that need the database. */
export function requireDb(): Database {
  if (!db) {
    throw new AppError(
      'Database is not configured. Set DATABASE_URL in backend/.env and run the migrations.',
      503,
    );
  }

  return db;
}

/** Called during graceful shutdown so open connections are closed properly. */
export async function closeDatabase(): Promise<void> {
  if (connection) {
    await connection.pool.end();
  }
}
