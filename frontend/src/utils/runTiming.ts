import type { CurvePoint, TrendFit, YearTimingPoint } from '../types'

export type CurveMode = 'percent' | 'count'

export interface CurveRow {
  doy: number
  /** Selected year's cumulative value; `null` where the year has no data. */
  year: number | null
  /** Average cumulative value across the baseline years. */
  baseline: number | null
  /** [lowest, highest] across the baseline years, for the shaded band. */
  band: [number, number] | null
}

/** Chart rows for the cumulative run curve in either percent-of-run or fish-count terms. */
export function toCurveRows(points: CurvePoint[], mode: CurveMode): CurveRow[] {
  return points.map((point) => {
    const year = mode === 'percent' ? point.year_pct : point.year_count
    const baseline = mode === 'percent' ? point.baseline_avg_pct : point.baseline_avg_count
    const low = mode === 'percent' ? point.baseline_min_pct : point.baseline_min_count
    const high = mode === 'percent' ? point.baseline_max_pct : point.baseline_max_count
    return {
      doy: point.doy,
      year,
      baseline,
      band: low !== null && high !== null ? [low, high] : null,
    }
  })
}

export interface TimingRow {
  year: number
  p50: number
  /** [10% day, 90% day] for the shaded band. */
  range: [number, number]
  /** Fitted median day, `null` for years the trend does not cover. */
  trend: number | null
  inProgress: boolean
}

/** Chart rows for the timing-over-the-decades chart. */
export function toTimingRows(years: YearTimingPoint[], trend: TrendFit | null): TimingRow[] {
  return years.map((point) => ({
    year: point.year,
    p50: point.p50_doy,
    range: [point.p10_doy, point.p90_doy],
    trend:
      trend !== null && !point.in_progress
        ? trend.intercept + trend.slope_per_year * point.year
        : null,
    inProgress: point.in_progress,
  }))
}

/** Describe a trend in days per decade, e.g. "3.3 days later per decade". */
export function describeTrend(trend: TrendFit): string {
  const perDecade = trend.slope_per_year * 10
  if (Math.abs(perDecade) < 0.05) {
    return 'no change per decade'
  }
  return `${Math.abs(perDecade).toFixed(1)} days ${perDecade > 0 ? 'later' : 'earlier'} per decade`
}
