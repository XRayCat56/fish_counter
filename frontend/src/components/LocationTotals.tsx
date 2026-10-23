import { LOCATION_COLORS } from '../constants/speciesColors'
import type { LocationYearSeries } from '../types'
import { formatCount } from '../utils/chartData'

interface LocationTotalsProps {
  locations: LocationYearSeries[]
}

export function LocationTotals({ locations }: LocationTotalsProps) {
  if (locations.length === 0) {
    return <p className="empty-state">No fish totals for this species and year.</p>
  }

  return (
    <ul className="totals-grid">
      {locations.map((location, index) => {
        const total = location.counts.reduce((sum, point) => sum + point.count, 0)
        return (
          <li
            key={location.code}
            className="total-card"
            // Matches the line color used for this dam in LocationLineChart.
            style={{ borderTopColor: LOCATION_COLORS[index % LOCATION_COLORS.length] }}
          >
            <span className="total-label">{location.name}</span>
            <span className="total-value">{formatCount(total)}</span>
          </li>
        )
      })}
    </ul>
  )
}
