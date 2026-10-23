import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { LOCATION_COLORS } from '../constants/speciesColors'
import type { LocationTotal } from '../types'
import { formatCount } from '../utils/chartData'

interface LocationPieChartProps {
  locations: LocationTotal[]
}

export function LocationPieChart({ locations }: LocationPieChartProps) {
  // Pie slices can't represent zero or negative (corrected) totals.
  const slices = locations.filter((location) => location.total > 0)

  if (slices.length === 0) {
    return <p className="empty-state">No fish count data by location for this year.</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={(entry: { name?: string }) => entry.name ?? ''}
          >
            {slices.map((location, index) => (
              <Cell
                key={location.code}
                fill={LOCATION_COLORS[index % LOCATION_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCount(Number(value))}
            contentStyle={{
              background: '#f7faf8',
              border: '1px solid #c5d4cb',
              borderRadius: 6,
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
