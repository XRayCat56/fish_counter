import type {
  ChartRow,
  DailyCountPoint,
  LocationYearlyTotals,
  MonthlyChartRow,
  SpeciesMonthlySeries,
  YearlyChartRow,
} from '../types'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Any series of daily points keyed by a code (species or dam location). */
interface DailySeries {
  code: string
  counts: DailyCountPoint[]
}

export function toChartRows(species: DailySeries[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>()

  for (const series of species) {
    for (const point of series.counts) {
      const existing = byDate.get(point.date) ?? { date: point.date }
      existing[series.code] = point.count
      byDate.set(point.date, existing)
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function formatChartDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${month}/${day}`
}

/** Pivot per-species monthly series into 12 rows (Jan–Dec), zero-filled. */
export function toMonthlyChartRows(species: SpeciesMonthlySeries[]): MonthlyChartRow[] {
  const rows: MonthlyChartRow[] = MONTH_LABELS.map((label) => {
    const row: MonthlyChartRow = { month: label }
    for (const series of species) {
      row[series.code] = 0
    }
    return row
  })

  for (const series of species) {
    for (const point of series.counts) {
      const row = rows[point.month - 1]
      if (row) {
        row[series.code] = point.count
      }
    }
  }

  return rows
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

/** Pivot per-dam yearly totals into one row per year. Years a dam lacks data for are left out of that row. */
export function toYearlyChartRows(locations: LocationYearlyTotals[]): YearlyChartRow[] {
  const byYear = new Map<number, YearlyChartRow>()

  for (const location of locations) {
    for (const point of location.totals) {
      const row = byYear.get(point.year) ?? { year: point.year }
      row[location.code] = point.total
      byYear.set(point.year, row)
    }
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year)
}

/** Round `value` up to a tidy axis maximum (1, 1.5, 2, 2.5, ... times a power of ten). */
export function niceCeil(value: number): number {
  if (value <= 0) {
    return 1
  }
  const step = 10 ** Math.floor(Math.log10(value)) / 2
  return Math.ceil(value / step) * step
}
