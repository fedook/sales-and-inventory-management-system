/** Shared shape returned by every paginated list endpoint. */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    // An empty list still shows "page 1 of 1" in the UI.
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
