import { useMemo } from 'react'

import { DEFAULT_SPECIES_COLOR, SPECIES_COLORS } from '../constants/speciesColors'
import type { HeatmapCell } from '../types'
import { formatCount } from '../utils/chartData'
import { formatWeekRange, monthWeekLabels } from '../utils/dates'
import { buildHeatmapGrid, cellIntensity, type HeatmapScale } from '../utils/heatmap'

const WEEKS = 52
const CELL_W = 14
const CELL_H = 8
const LEFT = 40
const TOP = 22
const PAD = 8
const NOT_COUNTED = '#e3e9e5'
const COUNTED_NONE = '#ffffff'

interface RunHeatmapProps {
  cells: HeatmapCell[]
  speciesCode: string
  scale: HeatmapScale
}

export function RunHeatmap({ cells, speciesCode, scale }: RunHeatmapProps) {
  const grid = useMemo(() => buildHeatmapGrid(cells), [cells])

  if (grid.years.length === 0) {
    return <p className="empty-state">No fish counts at this dam for this species.</p>
  }

  const color = SPECIES_COLORS[speciesCode] ?? DEFAULT_SPECIES_COLOR
  const width = LEFT + WEEKS * CELL_W + PAD
  const height = TOP + grid.years.length * CELL_H + PAD

  return (
    <div className="heatmap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Fish counted per week, one row per year"
      >
        {monthWeekLabels().map(({ week, label }) => (
          <text
            key={label}
            x={LEFT + (week - 1) * CELL_W}
            y={TOP - 8}
            fontSize={9}
            fill="#4a5c54"
          >
            {label}
          </text>
        ))}

        {grid.years.map((year, row) => {
          const y = TOP + row * CELL_H
          const weeks = grid.byYear.get(year)
          return (
            <g key={year}>
              {year % 5 === 0 && (
                <text x={LEFT - 6} y={y + CELL_H - 1} fontSize={8} textAnchor="end" fill="#4a5c54">
                  {year}
                </text>
              )}
              <rect x={LEFT} y={y} width={WEEKS * CELL_W} height={CELL_H} fill={NOT_COUNTED} />
              {weeks &&
                Array.from(weeks.entries()).map(([week, count]) => {
                  const intensity = cellIntensity(grid, year, count, scale)
                  return (
                    <rect
                      key={week}
                      x={LEFT + (week - 1) * CELL_W}
                      y={y}
                      width={CELL_W - 1}
                      height={CELL_H - 1}
                      fill={count > 0 ? color : COUNTED_NONE}
                      fillOpacity={count > 0 ? 0.1 + 0.9 * intensity : 1}
                    >
                      <title>{`${year}, ${formatWeekRange(week)}: ${formatCount(count)}`}</title>
                    </rect>
                  )
                })}
            </g>
          )
        })}
      </svg>

      <div className="heatmap-legend">
        <span>Fewer fish</span>
        <span
          className="heatmap-gradient"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, ${color} 10%, white), ${color})`,
          }}
        />
        <span>More fish</span>
        <span className="heatmap-legend-item">
          <span className="legend-swatch" style={{ background: COUNTED_NONE, border: '1px solid #c5d4cb' }} />
          Counted, none seen
        </span>
        <span className="heatmap-legend-item">
          <span className="legend-swatch" style={{ background: NOT_COUNTED }} />
          Not counted
        </span>
      </div>
    </div>
  )
}
