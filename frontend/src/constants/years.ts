export const MIN_YEAR = 1938
export const MAX_YEAR = 2026
export const YEARS: number[] = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MAX_YEAR - i,
)
