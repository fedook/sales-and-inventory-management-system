import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Centralized error handler.
 *
 * Express recognizes an error middleware by its FOUR parameters.
 * Any error passed to next(error) (or thrown in an async handler in
 * Express 5) ends up here, so controllers stay short and clean.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isKnownError = error instanceof AppError;

  // Express' JSON parser throws its own error for malformed bodies.
  const isMalformedJson =
    error instanceof SyntaxError && 'body' in (error as unknown as Record<string, unknown>);

  if (isMalformedJson) {
    res.status(400).json({
      success: false,
      message: 'Request body must be valid JSON.',
    });
    return;
  }

  const isPayloadTooLarge =
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: unknown }).type === 'entity.too.large';

  if (isPayloadTooLarge) {
    res.status(413).json({
      success: false,
      message: 'Request body is too large.',
    });
    return;
  }

  const statusCode = isKnownError ? error.statusCode : 500;
  const message = isKnownError ? error.message : 'Something went wrong on the server';

  // Unknown errors are bugs: log them so they can be fixed.
  if (!isKnownError) {
    console.error('[error]', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isKnownError && error.details !== undefined ? { errors: error.details } : {}),
    // Never leak stack traces in production.
    ...(env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {}),
  });
};
