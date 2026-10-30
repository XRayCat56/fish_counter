import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_MARGIN,
  DEFAULT_RIVER_COLOR,
  GRID_STROKE,
  RIVER_COLORS,
  TOOLTIP_STYLE,
} from '../constants/chartStyle'
import { formatCount } from '../utils/chartData'
import type { FunnelRow } from '../utils/conversion'

interface DamFunnelChartProps {
  rows: FunnelRow[]
  referenceName: string
}

function riverColor(river: string | null): string {
  return (river !== null ? RIVER_COLORS[river] : undefined) ?? DEFAULT_RIVER_COLOR
}

export function DamFunnelChart({ rows, referenceName }: DamFunnelChartProps) {
  if (rows.length === 0) {
    return <p className="empty-state">No counts at any dam for this species and year.</p>
  }

  const rivers = Array.from(
    new Set(rows.map((row) => row.river).filter((river): river is string => river !== null)),
  )

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={rows} margin={{ ...CHART_MARGIN, top: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} interval={0} />
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
            formatter={(value) => formatCount(Number(value))}
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(45, 106, 79, 0.08)' }}
          />
          <Bar dataKey="total" name="Fish counted" isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.code} fill={riverColor(row.river)} />
            ))}
            <LabelList dataKey="ratioLabel" position="top" fill="#1b4332" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="legend-inline" aria-label="River colors">
        {rivers.map((river) => (
          <li key={river}>
            <span className="legend-swatch" style={{ background: riverColor(river) }} />
            {river} River
          </li>
        ))}
        <li>Percent labels: share of {referenceName}&apos;s count over days both dams counted</li>
      </ul>
    </div>
  )
}
