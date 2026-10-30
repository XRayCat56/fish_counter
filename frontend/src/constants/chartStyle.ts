import type { CSSProperties } from 'react'

export const AXIS_TICK = { fill: '#4a5c54', fontSize: 12 } as const

export const AXIS_LABEL_STYLE = { fill: '#4a5c54', fontSize: 12 } as const

export const GRID_STROKE = '#d4ddd8'

export const TOOLTIP_STYLE: CSSProperties = {
  background: '#f7faf8',
  border: '1px solid #c5d4cb',
  borderRadius: 6,
}

export const CHART_MARGIN = { top: 12, right: 24, left: 8, bottom: 8 } as const

/** Accent for the selected year and other "this is the one to look at" series. */
export const HIGHLIGHT_COLOR = '#c45c26'

/** Neutral color for baselines, bands and fitted lines. */
export const BASELINE_COLOR = '#3d5a80'

export const RIVER_COLORS: Record<string, string> = {
  Columbia: '#3d5a80',
  Snake: '#c45c26',
}

export const DEFAULT_RIVER_COLOR = '#6b705c'

/** Colors for the classes within a species (adult/jack, unclipped/clipped). */
export const CLASS_COLORS: Record<string, string> = {
  adult: '#2d6a4f',
  jack: '#c45c26',
  unclipped: '#2a6f6f',
  clipped: '#bc6c25',
}
