import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  BASELINE_COLOR,
  CHART_MARGIN,
  GRID_STROKE,
  HIGHLIGHT_COLOR,
  TOOLTIP_STYLE,
} from '../constants/chartStyle'
import type { CurvePoint } from '../types'
import { formatCount } from '../utils/chartData'
import { DAYS_IN_YEAR, MONTH_START_DOY, formatDayOfYear, formatMonthTick } from '../utils/dates'
import { toCurveRows, type CurveMode } from '../utils/runTiming'

interface RunCurveChartProps {
  points: CurvePoint[]
  mode: CurveMode
  yearLabel: string
  baselineLabel: string
  hasBaseline: boolean
}

function formatCurveValue(value: number, mode: CurveMode): string {
  return mode === 'percent' ? `${value.toFixed(0)}%` : formatCount(Math.round(value))
}

export function RunCurveChart({
  points,
  mode,
  yearLabel,
  baselineLabel,
  hasBaseline,
}: RunCurveChartProps) {
  const rows = toCurveRows(points, mode)

  if (rows.every((row) => row.year === null)) {
    return <p className="empty-state">No fish were counted here for this species and year.</p>
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="doy"
            type="number"
            domain={[1, DAYS_IN_YEAR]}
            ticks={[...MONTH_START_DOY]}
            tickFormatter={formatMonthTick}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={mode === 'percent' ? [0, 100] : [0, 'auto']}
            tickFormatter={(value: number) => formatCurveValue(value, mode)}
            tick={AXIS_TICK}
            label={{
              value: mode === 'percent' ? 'Cumulative % of run' : 'Cumulative fish counted',
              angle: -90,
              position: 'insideLeft',
              style: AXIS_LABEL_STYLE,
            }}
          />
          <Tooltip
            labelFormatter={(label) => formatDayOfYear(Number(label))}
            formatter={(value) =>
              Array.isArray(value)
                ? value.map((entry) => formatCurveValue(Number(entry), mode)).join(' – ')
                : formatCurveValue(Number(value), mode)
            }
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend itemSorter={null} />
          {hasBaseline && (
            <Area
              dataKey="band"
              name="Baseline range"
              stroke="none"
              fill={BASELINE_COLOR}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          )}
          {hasBaseline && (
            <Line
              dataKey="baseline"
              name={baselineLabel}
              stroke={BASELINE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
          <Line
            dataKey="year"
            name={yearLabel}
            stroke={HIGHLIGHT_COLOR}
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
