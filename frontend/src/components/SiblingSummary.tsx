import type { SiblingForecastResponse } from '../types'
import { formatCount } from '../utils/chartData'

interface SiblingSummaryProps {
  response: SiblingForecastResponse
}

export function SiblingSummary({ response }: SiblingSummaryProps) {
  const { fit, forecast } = response
  if (fit === null || forecast === null) {
    return <p className="empty-state">Not enough paired years to fit a forecast at this dam.</p>
  }

  const inProgressPair = response.pairs.find((pair) => pair.adults_in_progress)

  return (
    <ul className="totals-grid">
      <li className="total-card">
        <span className="total-label">Forecast adults, {forecast.adult_year}</span>
        <span className="total-value">{formatCount(Math.round(forecast.predicted_adults))}</span>
        <span className="total-sub">
          likely between {formatCount(Math.round(forecast.predicted_low))} and{' '}
          {formatCount(Math.round(forecast.predicted_high))}
          {forecast.jacks_in_progress
            ? `. ${forecast.jack_year} jacks are still being counted, so this is probably low.`
            : ''}
        </span>
      </li>
      {inProgressPair && (
        <li className="total-card">
          <span className="total-label">Adults so far, {inProgressPair.adult_year}</span>
          <span className="total-value">{formatCount(inProgressPair.adults)}</span>
          {inProgressPair.predicted_adults !== null && (
            <span className="total-sub">
              forecast from {inProgressPair.jack_year} jacks:{' '}
              {formatCount(Math.round(inProgressPair.predicted_adults))}
            </span>
          )}
        </li>
      )}
      <li className="total-card">
        <span className="total-label">Adults per extra jack</span>
        <span className="total-value">{fit.slope.toFixed(1)}</span>
        <span className="total-sub">slope of the fitted line</span>
      </li>
      <li className="total-card">
        <span className="total-label">Fit (R²)</span>
        <span className="total-value">{fit.r_squared.toFixed(2)}</span>
        <span className="total-sub">
          {fit.n} years. Higher means jack counts predict adults better.
        </span>
      </li>
    </ul>
  )
}
