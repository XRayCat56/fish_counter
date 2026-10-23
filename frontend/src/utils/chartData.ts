import type { ChartRow, DailyCountPoint, MonthlyChartRow, SpeciesMonthlySeries } from '../types'

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
