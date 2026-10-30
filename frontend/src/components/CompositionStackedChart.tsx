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

import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_MARGIN,
  CLASS_COLORS,
  GRID_STROKE,
  TOOLTIP_STYLE,
} from '../constants/chartStyle'
import { DEFAULT_SPECIES_COLOR } from '../constants/speciesColors'
import type { ClassInfo, LocationComposition } from '../types'
import { formatCount } from '../utils/chartData'
import { toStackedRows } from '../utils/composition'

interface CompositionStackedChartProps {
  location: LocationComposition
  classes: ClassInfo[]
}

export function CompositionStackedChart({ location, classes }: CompositionStackedChartProps) {
  if (location.years.length === 0) {
    return <p className="empty-state">No data at this dam for this species.</p>
  }

  const rows = toStackedRows(location, classes)

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="year" tick={AXIS_TICK} minTickGap={16} />
          <YAxis
            tickFormatter={(value: number) => formatCount(value)}
            tick={AXIS_TICK}
            label={{
              value: 'Fish counted',
              angle: -90,
              position: 'insideLeft',
              style: AXIS_LABEL_STYLE,
            }}
          />
          <Tooltip
            labelFormatter={(label) => `Year ${String(label)}`}
            formatter={(value) => formatCount(Number(value))}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend itemSorter={null} />
          {classes.map((info) => (
            <Bar
              key={info.code}
              dataKey={info.code}
              name={info.name}
              stackId="classes"
              fill={CLASS_COLORS[info.code] ?? DEFAULT_SPECIES_COLOR}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
