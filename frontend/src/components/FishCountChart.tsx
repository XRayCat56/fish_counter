import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DEFAULT_SPECIES_COLOR, SPECIES_COLORS } from '../constants/speciesColors'
import type { SpeciesYearSeries } from '../types'
import { formatChartDate, toChartRows } from '../utils/chartData'

interface FishCountChartProps {
  species: SpeciesYearSeries[]
}

export function FishCountChart({ species }: FishCountChartProps) {
  if (species.length === 0) {
    return <p className="empty-state">No fish count data for this year.</p>
  }

  const rows = toChartRows(species)

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={rows} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4ddd8" />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            minTickGap={28}
            tick={{ fill: '#4a5c54', fontSize: 12 }}
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.ceil(dataMax / 1000) * 1000]}
            allowDataOverflow
            tickFormatter={(value: number) => String(Math.max(0, value))}
            tick={{ fill: '#4a5c54', fontSize: 12 }}
            label={{
              value: 'Daily count',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#4a5c54', fontSize: 12 },
            }}
          />
          <Tooltip
            labelFormatter={(label) => formatChartDate(String(label))}
            contentStyle={{
              background: '#f7faf8',
              border: '1px solid #c5d4cb',
              borderRadius: 6,
            }}
          />
          <Legend />
          {species.map((series) => (
            <Line
              key={series.code}
              type="monotone"
              dataKey={series.code}
              name={series.name}
              stroke={SPECIES_COLORS[series.code] ?? DEFAULT_SPECIES_COLOR}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
