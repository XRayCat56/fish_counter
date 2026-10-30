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
import type { TrendFit, YearTimingPoint } from '../types'
import { formatDayOfYear, monthAxis } from '../utils/dates'
import { toTimingRows } from '../utils/runTiming'

interface TimingTrendChartProps {
  years: YearTimingPoint[]
  trend: TrendFit | null
}

export function TimingTrendChart({ years, trend }: TimingTrendChartProps) {
  if (years.length === 0) {
    return <p className="empty-state">Not enough fish counted to measure run timing.</p>
  }

  const rows = toTimingRows(years, trend)
  const axis = monthAxis(
    Math.min(...years.map((point) => point.p10_doy)),
    Math.max(...years.map((point) => point.p90_doy)),
  )

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="year"
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={axis.domain}
            ticks={axis.ticks}
            allowDataOverflow
            tickFormatter={(value: number) => formatDayOfYear(value)}
            tick={AXIS_TICK}
            label={{
              value: 'Date fish passed',
              angle: -90,
              position: 'insideLeft',
              style: AXIS_LABEL_STYLE,
            }}
          />
          <Tooltip
            labelFormatter={(label) => `Year ${String(label)}`}
            formatter={(value) =>
              Array.isArray(value)
                ? value.map((entry) => formatDayOfYear(Number(entry))).join(' – ')
                : formatDayOfYear(Number(value))
            }
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend itemSorter={null} />
          <Area
            dataKey="range"
            name="10% – 90% of run"
            stroke="none"
            fill={BASELINE_COLOR}
            fillOpacity={0.18}
            isAnimationActive={false}
          />
          <Line
            dataKey="p50"
            name="Half of run passed"
            stroke={HIGHLIGHT_COLOR}
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
          {trend !== null && (
            <Line
              dataKey="trend"
              name="Trend in median date"
              stroke="#1b4332"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
