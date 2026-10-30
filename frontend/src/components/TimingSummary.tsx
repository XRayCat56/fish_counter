import type { PassageDays, RunCurveResponse } from '../types'
import { formatCount } from '../utils/chartData'
import { describeDayShift, formatDayOfYear } from '../utils/dates'

interface Milestone {
  label: string
  actual: number
  baseline: number | null
}

function milestonesFor(year: PassageDays, baseline: PassageDays | null): Milestone[] {
  return [
    { label: '10% of run passed', actual: year.p10_doy, baseline: baseline?.p10_doy ?? null },
    { label: 'Half of run passed', actual: year.p50_doy, baseline: baseline?.p50_doy ?? null },
    { label: '90% of run passed', actual: year.p90_doy, baseline: baseline?.p90_doy ?? null },
  ]
}

interface TimingSummaryProps {
  curve: RunCurveResponse
}

export function TimingSummary({ curve }: TimingSummaryProps) {
  if (curve.year_timing === null) {
    return null
  }

  const counted = [...curve.points].reverse().find((point) => point.year_count !== null)
  const baselineSpan =
    curve.baseline_years.length > 0
      ? `${curve.baseline_years[0]}–${curve.baseline_years[curve.baseline_years.length - 1]}`
      : null

  return (
    <ul className="totals-grid">
      {milestonesFor(curve.year_timing, curve.baseline_timing).map((milestone) => (
        <li key={milestone.label} className="total-card">
          <span className="total-label">{milestone.label}</span>
          <span className="total-value">{formatDayOfYear(milestone.actual)}</span>
          {milestone.baseline !== null && baselineSpan !== null && (
            <span className="total-sub">
              {describeDayShift(milestone.actual, milestone.baseline)} than the {baselineSpan}{' '}
              average ({formatDayOfYear(milestone.baseline)})
            </span>
          )}
        </li>
      ))}
      <li className="total-card">
        <span className="total-label">{curve.in_progress ? 'Counted so far' : 'Counted in year'}</span>
        <span className="total-value">{formatCount(counted?.year_count ?? 0)}</span>
        {curve.in_progress && curve.last_data_doy !== null && (
          <span className="total-sub">through {formatDayOfYear(curve.last_data_doy)}</span>
        )}
      </li>
    </ul>
  )
}
