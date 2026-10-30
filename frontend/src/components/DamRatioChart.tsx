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

import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_MARGIN,
  GRID_STROKE,
  TOOLTIP_STYLE,
} from '../constants/chartStyle'
import { LOCATION_COLORS } from '../constants/speciesColors'
import type { DamConversionSeries, YearlyChartRow } from '../types'
import { formatPercent } from '../utils/conversion'

interface DamRatioChartProps {
  locations: DamConversionSeries[]
  rows: YearlyChartRow[]
  referenceCode: string
  referenceName: string
}

export function DamRatioChart({
  locations,
  rows,
  referenceCode,
  referenceName,
}: DamRatioChartProps) {
  if (rows.length === 0) {
    return <p className="empty-state">Not enough overlapping counts to compare dams.</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="year"
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={[0, 'auto']}
            tickFormatter={(value: number) => formatPercent(value)}
            tick={AXIS_TICK}
            label={{
              value: `% of ${referenceName} count`,
              angle: -90,
              position: 'insideLeft',
              style: AXIS_LABEL_STYLE,
            }}
          />
          <Tooltip
            labelFormatter={(label) => `Year ${String(label)}`}
            formatter={(value) => formatPercent(Number(value), 1)}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend itemSorter={null} />
          {locations.map((location, index) =>
            location.code === referenceCode ? null : (
              <Line
                key={location.code}
                type="monotone"
                dataKey={location.code}
                name={location.name}
                // Same color as this dam gets in the other dam charts.
                stroke={LOCATION_COLORS[index % LOCATION_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ),
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
