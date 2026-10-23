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

import { LOCATION_COLORS } from '../constants/speciesColors'
import type { LocationYearSeries } from '../types'
import { formatChartDate, formatCount, toChartRows } from '../utils/chartData'

interface LocationLineChartProps {
  locations: LocationYearSeries[]
}

export function LocationLineChart({ locations }: LocationLineChartProps) {
  if (locations.length === 0) {
    return <p className="empty-state">No fish count data for this species and year.</p>
  }

  const rows = toChartRows(locations)

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
            domain={[0, 'auto']}
            allowDataOverflow
            tickFormatter={(value: number) => formatCount(value)}
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
            formatter={(value) => formatCount(Number(value))}
            contentStyle={{
              background: '#f7faf8',
              border: '1px solid #c5d4cb',
              borderRadius: 6,
            }}
          />
          <Legend />
          {locations.map((location, index) => (
            <Line
              key={location.code}
              type="monotone"
              dataKey={location.code}
              name={location.name}
              stroke={LOCATION_COLORS[index % LOCATION_COLORS.length]}
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
