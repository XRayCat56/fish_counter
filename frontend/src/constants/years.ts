import type { SelectOption } from '../types'

export const MIN_YEAR = 1938
export const MAX_YEAR = 2026
export const YEARS: number[] = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MAX_YEAR - i,
)

export const YEAR_OPTIONS: SelectOption[] = YEARS.map((year) => ({
  value: String(year),
  label: String(year),
}))
