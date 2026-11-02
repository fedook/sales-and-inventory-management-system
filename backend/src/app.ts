import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { apiRouter } from './routes/index.js';

/**
 * The Express application is created in app.ts (no listen() here).
 * server.ts starts it. This separation makes the app easy to test later.
 */
export const app = express();

// Do not advertise the framework in response headers.
app.disable('x-powered-by');

// Allow the Vite dev server to call this API.
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Parse JSON and form bodies into req.body.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Small welcome route so hitting the base URL is not confusing.
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sales and Inventory Management API',
    docs: 'See /api/health and the README for available endpoints',
  });
});

// All feature routes live under /api.
app.use('/api', apiRouter);

// Order matters: 404 handler first, then the error handler.
app.use(notFoundHandler);
app.use(errorHandler);
