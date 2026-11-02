/**
 * An error that we intentionally throw inside controllers/services.
 * Central error middleware turns it into a clean JSON response.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    // Keep the stack trace friendly when extending built-in Error.
    Error.captureStackTrace?.(this, AppError);
  }
}
