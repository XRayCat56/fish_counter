import type { DamConversionSeries, YearlyChartRow } from '../types'

/**
 * Ratios built from fewer shared counting days than this are dropped. A short
 * overlap says more about the counting window than about fish.
 */
export const MIN_MATCHED_DAYS = 30

/** One row per complete year with each non-reference dam's ratio to the reference dam. */
export function toRatioRows(
  locations: DamConversionSeries[],
  referenceCode: string,
): YearlyChartRow[] {
  const byYear = new Map<number, YearlyChartRow>()

  for (const location of locations) {
    if (location.code === referenceCode) {
      continue
    }
    for (const point of location.years) {
      if (point.in_progress || point.ratio === null || point.matched_days < MIN_MATCHED_DAYS) {
        continue
      }
      const row = byYear.get(point.year) ?? { year: point.year }
      row[location.code] = point.ratio
      byYear.set(point.year, row)
    }
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year)
}

export interface FunnelRow {
  code: string
  name: string
  river: string | null
  total: number
  ratio: number | null
  /** Text shown above the bar, e.g. "72%". */
  ratioLabel: string
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

/** One bar per dam for a single year, downstream to upstream. Dams with no data that year are skipped. */
export function toFunnelRows(locations: DamConversionSeries[], year: number): FunnelRow[] {
  const rows: FunnelRow[] = []
  for (const location of locations) {
    const point = location.years.find((entry) => entry.year === year)
    if (point === undefined) {
      continue
    }
    const hasRatio = point.ratio !== null && point.matched_days >= MIN_MATCHED_DAYS
    rows.push({
      code: location.code,
      name: location.name,
      river: location.river,
      total: Math.max(point.total, 0),
      ratio: hasRatio ? point.ratio : null,
      ratioLabel: hasRatio && point.ratio !== null ? formatPercent(point.ratio) : '',
    })
  }
  return rows
}
