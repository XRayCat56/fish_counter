import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
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
import type { SiblingForecastResponse } from '../types'
import { formatCount, niceCeil } from '../utils/chartData'
import {
  isSiblingPlotPoint,
  regressionSegment,
  toSiblingPlotPoints,
  type SiblingPlotPoint,
} from '../utils/composition'

interface SiblingTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

function SiblingTooltip({ active, payload }: SiblingTooltipProps) {
  const datum: unknown = payload?.[0]?.payload
  if (!active || !isSiblingPlotPoint(datum)) {
    return null
  }
  const adultsLabel = datum.kind === 'forecast' ? 'Predicted adults' : 'Adults'
  return (
    <div className="chart-tooltip" style={TOOLTIP_STYLE}>
      <div>
        Jacks {datum.jackYear}: <strong>{formatCount(Math.round(datum.x))}</strong>
      </div>
      <div>
        {adultsLabel} {datum.adultYear}: <strong>{formatCount(Math.round(datum.y))}</strong>
      </div>
      {datum.kind === 'in-progress' && <div>Adult year still being counted</div>}
    </div>
  )
}

interface SiblingScatterChartProps {
  response: SiblingForecastResponse
}

export function SiblingScatterChart({ response }: SiblingScatterChartProps) {
  if (response.pairs.length === 0) {
    return <p className="empty-state">No jack and adult counts to compare at this dam.</p>
  }

  const points = toSiblingPlotPoints(response)
  const ofKind = (kind: SiblingPlotPoint['kind']) => points.filter((point) => point.kind === kind)
  const maxX = niceCeil(Math.max(...points.map((point) => point.x)) * 1.02)
  const xTicks = Array.from({ length: 6 }, (_, index) => (maxX * index) / 5)
  const segment = response.fit !== null ? regressionSegment(response.fit, maxX) : null

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ ...CHART_MARGIN, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            type="number"
            dataKey="x"
            name="Jacks"
            domain={[0, maxX]}
            ticks={xTicks}
            tickFormatter={(value: number) => formatCount(value)}
            tick={AXIS_TICK}
            label={{
              value: 'Jacks counted in a year',
              position: 'insideBottom',
              offset: -12,
              style: AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Adults"
            width={92}
            domain={[0, 'auto']}
            tickFormatter={(value: number) => formatCount(value)}
            tick={AXIS_TICK}
            label={{
              value: 'Adults counted the next year',
              angle: -90,
              position: 'insideLeft',
              style: AXIS_LABEL_STYLE,
            }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<SiblingTooltip />} />
          <Legend verticalAlign="top" itemSorter={null} />
          {segment !== null && (
            <ReferenceLine
              segment={segment}
              stroke={BASELINE_COLOR}
              strokeDasharray="6 4"
              strokeWidth={2}
              ifOverflow="hidden"
            />
          )}
          <Scatter
            name="Complete years"
            data={ofKind('fit')}
            fill={BASELINE_COLOR}
            isAnimationActive={false}
          />
          <Scatter
            name="Adult year in progress"
            data={ofKind('in-progress')}
            fill="#6b705c"
            shape="diamond"
            isAnimationActive={false}
          />
          <Scatter
            name="Forecast"
            data={ofKind('forecast')}
            fill={HIGHLIGHT_COLOR}
            shape="star"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
