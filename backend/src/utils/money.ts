/** Money is stored as NUMERIC(12, 2), so round before sending it to PostgreSQL. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
