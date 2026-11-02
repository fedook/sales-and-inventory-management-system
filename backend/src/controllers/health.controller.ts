import type { Request, Response } from 'express';

/**
 * GET /api/health
 * A lightweight liveness check. It intentionally does NOT touch the database,
 * so it works even before Neon is configured.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
}
