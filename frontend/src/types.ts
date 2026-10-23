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
