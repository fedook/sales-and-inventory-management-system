
import { createServer } from 'node:http';
import { app } from './app.js';
import { env, isAuthConfigured, isDatabaseConfigured } from './config/env.js';
import { closeDatabase } from './db/client.js';

const server = createServer(app);

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[server] API listening on port ${env.PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
  console.log(`[server] CORS origin: ${env.FRONTEND_URL}`);

  if (!isDatabaseConfigured) {
    console.warn(
      '[server] DATABASE_URL is not set. /api/health works, but database features are disabled.',
    );
  }

  if (!isAuthConfigured) {
    console.warn(
      '[server] JWT_SECRET is not set. Authentication endpoints are disabled until it is configured.',
    );
  }
});

/**
 * Close connections gracefully when the process is stopped
 * (Ctrl+C, Docker stop, hosting platform restart).
 */
function shutdown(signal: string): void {
  console.log(`[server] Received ${signal}. Shutting down...`);

  server.close((error) => {
    void finishShutdown(error);
  });
}

async function finishShutdown(error?: Error): Promise<void> {
  if (error) {
    console.error('[server] Error while shutting down', error);
    process.exit(1);
  }

  try {
    await closeDatabase();
  } catch (databaseError) {
    console.error('[server] Error while closing the database pool', databaseError);
  }

  console.log('[server] Closed cleanly.');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
