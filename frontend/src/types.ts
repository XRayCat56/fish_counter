export interface DailyCountPoint {
  date: string
  count: number
}

export interface SpeciesYearSeries {
  code: string
  name: string
  counts: DailyCountPoint[]
}

export interface YearCountsResponse {
  year: number
  species: SpeciesYearSeries[]
}

/** One row per date for Recharts multi-line chart. */
export type ChartRow = {
  date: string
  [speciesCode: string]: string | number | null
}

export interface MonthlyCountPoint {
  month: number
  count: number
}

export interface SpeciesMonthlySeries {
  code: string
  name: string
  counts: MonthlyCountPoint[]
}

export interface MonthlyCountsResponse {
  year: number
  species: SpeciesMonthlySeries[]
}

export interface LocationTotal {
  code: string
  name: string
  total: number
}

export interface LocationTotalsResponse {
  year: number
  locations: LocationTotal[]
}

export interface SpeciesTotal {
  code: string
  name: string
  total: number
}

export interface SpeciesTotalsResponse {
  year: number
  species: SpeciesTotal[]
}

/** One row per month for the Recharts grouped bar chart. */
export type MonthlyChartRow = {
  month: string
  [speciesCode: string]: string | number
}

export interface SpeciesInfo {
  code: string
  name: string
  /** Count classes recorded for the species (total, adult, jack, clipped, ...). */
  class_codes: string[]
}

export interface SpeciesListResponse {
  species: SpeciesInfo[]
}

export interface LocationYearSeries {
  code: string
  name: string
  counts: DailyCountPoint[]
}

export interface SpeciesLocationCountsResponse {
  year: number
  species_code: string
  species_name: string
  locations: LocationYearSeries[]
}

export interface YearlyTotalPoint {
  year: number
  total: number
}

export interface LocationYearlyTotals {
  code: string
  name: string
  totals: YearlyTotalPoint[]
}

export interface SpeciesYearlyTotalsResponse {
  species_code: string
  species_name: string
  locations: LocationYearlyTotals[]
}

/** One row per year for the Recharts yearly-totals line chart. */
export type YearlyChartRow = {
  year: number
  [locationCode: string]: number
}

export interface SelectOption {
  value: string
  label: string
}

// ---- Analytics ---------------------------------------------------------

export interface LocationInfo {
  code: string
  name: string
  river: string | null
  sort_order: number
}

export interface LocationListResponse {
  locations: LocationInfo[]
}

/** Day of year on a fixed non-leap calendar (1-365). */
export type DayOfYear = number

export interface YearTimingPoint {
  year: number
  total: number
  first_doy: DayOfYear
  last_doy: DayOfYear
  peak_doy: DayOfYear
  p10_doy: DayOfYear
  p50_doy: DayOfYear
  p90_doy: DayOfYear
  in_progress: boolean
}

export interface TrendFit {
  slope_per_year: number
  intercept: number
  r_squared: number
  n: number
}

export interface RunTimingResponse {
  species_code: string
  species_name: string
  location_code: string
  location_name: string
  years: YearTimingPoint[]
  p50_trend: TrendFit | null
}

export interface CurvePoint {
  doy: DayOfYear
  year_pct: number | null
  year_count: number | null
  baseline_avg_pct: number | null
  baseline_min_pct: number | null
  baseline_max_pct: number | null
  baseline_avg_count: number | null
  baseline_min_count: number | null
  baseline_max_count: number | null
}

export interface PassageDays {
  p10_doy: number
  p50_doy: number
  p90_doy: number
}

export interface RunCurveResponse {
  species_code: string
  species_name: string
  location_code: string
  location_name: string
  year: number
  in_progress: boolean
  last_data_doy: DayOfYear | null
  year_timing: PassageDays | null
  baseline_years: number[]
  baseline_timing: PassageDays | null
  points: CurvePoint[]
}

export interface ClassInfo {
  code: string
  name: string
}

export interface CompositionYear {
  year: number
  /** Fish counted per class code. */
  counts: Record<string, number>
  in_progress: boolean
}

export interface LocationComposition {
  code: string
  name: string
  years: CompositionYear[]
}

export interface ClassCompositionResponse {
  species_code: string
  species_name: string
  classes: ClassInfo[]
  locations: LocationComposition[]
}

export interface SiblingPairPoint {
  jack_year: number
  adult_year: number
  jacks: number
  adults: number
  predicted_adults: number | null
  adults_in_progress: boolean
}

export interface SiblingFit {
  slope: number
  intercept: number
  r_squared: number
  residual_std_error: number
  n: number
}

export interface SiblingForecast {
  jack_year: number
  adult_year: number
  jacks: number
  predicted_adults: number
  predicted_low: number
  predicted_high: number
  jacks_in_progress: boolean
}

export interface SiblingForecastResponse {
  species_code: string
  species_name: string
  location_code: string
  location_name: string
  pairs: SiblingPairPoint[]
  fit: SiblingFit | null
  forecast: SiblingForecast | null
}

export interface DamConversionPoint {
  year: number
  total: number
  days_counted: number
  matched_days: number
  ratio: number | null
  in_progress: boolean
}

export interface DamConversionSeries {
  code: string
  name: string
  river: string | null
  years: DamConversionPoint[]
}

export interface DamConversionResponse {
  species_code: string
  species_name: string
  reference_code: string
  reference_name: string
  locations: DamConversionSeries[]
}

export interface HeatmapCell {
  year: number
  week: number
  count: number
}

export interface WeeklyHeatmapResponse {
  species_code: string
  species_name: string
  location_code: string
  location_name: string
  cells: HeatmapCell[]
}
