import type { RequestHandler } from 'express';

/**
 * Runs after every route. If no route matched the request,
 * we return a consistent JSON 404 instead of Express' HTML page.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} was not found`,
  });
};
