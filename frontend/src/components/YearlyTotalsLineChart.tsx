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
import type { LocationYearlyTotals } from '../types'
import { formatCount, toYearlyChartRows } from '../utils/chartData'

interface YearlyTotalsLineChartProps {
  locations: LocationYearlyTotals[]
}

export function YearlyTotalsLineChart({ locations }: YearlyTotalsLineChartProps) {
  if (locations.length === 0) {
    return <p className="empty-state">No fish count data for this species.</p>
  }

  const rows = toYearlyChartRows(locations)

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={rows} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4ddd8" />
          <XAxis
            dataKey="year"
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tick={{ fill: '#4a5c54', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 'auto']}
            tickFormatter={(value: number) => formatCount(value)}
            tick={{ fill: '#4a5c54', fontSize: 12 }}
            label={{
              value: 'Yearly total',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#4a5c54', fontSize: 12 },
            }}
          />
          <Tooltip
            labelFormatter={(label) => `Year ${String(label)}`}
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
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
