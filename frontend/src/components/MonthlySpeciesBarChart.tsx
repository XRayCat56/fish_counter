import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DEFAULT_SPECIES_COLOR, SPECIES_COLORS } from '../constants/speciesColors'
import type { SpeciesMonthlySeries } from '../types'
import { formatCount, toMonthlyChartRows } from '../utils/chartData'

interface MonthlySpeciesBarChartProps {
  species: SpeciesMonthlySeries[]
}

export function MonthlySpeciesBarChart({ species }: MonthlySpeciesBarChartProps) {
  if (species.length === 0) {
    return <p className="empty-state">No monthly fish count data for this year.</p>
  }

  const rows = toMonthlyChartRows(species)

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={rows} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4ddd8" />
          <XAxis dataKey="month" tick={{ fill: '#4a5c54', fontSize: 12 }} />
          <YAxis
            domain={[0, 'auto']}
            allowDataOverflow
            tickFormatter={(value: number) => formatCount(value)}
            tick={{ fill: '#4a5c54', fontSize: 12 }}
            label={{
              value: 'Monthly count',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#4a5c54', fontSize: 12 },
            }}
          />
          <Tooltip
            formatter={(value) => formatCount(Number(value))}
            contentStyle={{
              background: '#f7faf8',
              border: '1px solid #c5d4cb',
              borderRadius: 6,
            }}
          />
          <Legend />
          {species.map((series) => (
            <Bar
              key={series.code}
              dataKey={series.code}
              name={series.name}
              fill={SPECIES_COLORS[series.code] ?? DEFAULT_SPECIES_COLOR}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
