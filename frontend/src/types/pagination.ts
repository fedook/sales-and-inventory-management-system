/** Shape returned by every paginated list endpoint. */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** What the services return: the page of items plus its pagination info. */
export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}
