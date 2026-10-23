import { DEFAULT_SPECIES_COLOR, SPECIES_COLORS } from '../constants/speciesColors'
import type { SpeciesTotal } from '../types'
import { formatCount } from '../utils/chartData'

interface SpeciesTotalsProps {
  species: SpeciesTotal[]
}

export function SpeciesTotals({ species }: SpeciesTotalsProps) {
  if (species.length === 0) {
    return <p className="empty-state">No fish totals for this year.</p>
  }

  return (
    <ul className="totals-grid">
      {species.map((item) => (
        <li
          key={item.code}
          className="total-card"
          style={{ borderTopColor: SPECIES_COLORS[item.code] ?? DEFAULT_SPECIES_COLOR }}
        >
          <span className="total-label">{item.name}</span>
          <span className="total-value">{formatCount(item.total)}</span>
        </li>
      ))}
    </ul>
  )
}
