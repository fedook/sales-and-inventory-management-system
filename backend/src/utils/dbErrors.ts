/**
 * PostgreSQL error helpers.
 *
 * Drizzle wraps driver errors, so the SQLSTATE code can live on the error
 * itself or on its `cause`. These helpers walk that chain.
 */
function hasSqlState(error: unknown, state: string): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; cause?: unknown };

  if (candidate.code === state) {
    return true;
  }

  return hasSqlState(candidate.cause, state);
}

/** 23505 = unique constraint violation (for example a duplicate name). */
export function isUniqueViolation(error: unknown): boolean {
  return hasSqlState(error, '23505');
}

/** 23503 = foreign key violation (for example a supplier that does not exist). */
export function isForeignKeyViolation(error: unknown): boolean {
  return hasSqlState(error, '23503');
}
