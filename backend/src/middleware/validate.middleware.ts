import type { RequestHandler } from 'express';
import { z, type ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Validate req.body with a Zod schema.
 *
 * On success, req.body is replaced with the parsed value (trimmed strings,
 * normalized numbers, unknown keys removed). On failure, the client receives
 * a 422 with a per-field error map that the UI can display next to inputs.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError('Please check the highlighted fields.', 422, {
          fieldErrors: z.flattenError(result.error).fieldErrors,
        }),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}

/** Same idea for route parameters, for example "/users/:id". */
export function validateParams<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(new AppError('Invalid request parameters.', 400));
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

/**
 * Validate req.query (search, filters, page, limit, sort...).
 *
 * In Express 5 `req.query` is a read-only getter, so the parsed result is
 * stored on `req.validatedQuery` instead of replacing it. Controllers read
 * that property, which is already typed and free of string/number surprises.
 */
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(
        new AppError('Please check the filter values.', 422, {
          fieldErrors: z.flattenError(result.error).fieldErrors,
        }),
      );
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}
