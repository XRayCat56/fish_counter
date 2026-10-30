import type { HeatmapCell } from '../types'

export type HeatmapScale = 'absolute' | 'relative'

export interface HeatmapGrid {
  /** Years with any data, ascending. */
  years: number[]
  /** year -> week -> fish counted. */
  byYear: Map<number, Map<number, number>>
  maxCount: number
  /** Busiest week of each year. */
  yearMax: Map<number, number>
}

export function buildHeatmapGrid(cells: HeatmapCell[]): HeatmapGrid {
  const byYear = new Map<number, Map<number, number>>()
  const yearMax = new Map<number, number>()
  let maxCount = 0

  for (const cell of cells) {
    const weeks = byYear.get(cell.year) ?? new Map<number, number>()
    weeks.set(cell.week, cell.count)
    byYear.set(cell.year, weeks)
    yearMax.set(cell.year, Math.max(yearMax.get(cell.year) ?? 0, cell.count))
    maxCount = Math.max(maxCount, cell.count)
  }

  return {
    years: Array.from(byYear.keys()).sort((a, b) => a - b),
    byYear,
    maxCount,
    yearMax,
  }
}

/**
 * Color strength (0-1) of a cell. A square-root curve keeps quiet weeks visible
 * next to the very busy ones.
 */
export function cellIntensity(
  grid: HeatmapGrid,
  year: number,
  count: number,
  scale: HeatmapScale,
): number {
  const ceiling = scale === 'absolute' ? grid.maxCount : (grid.yearMax.get(year) ?? 0)
  if (ceiling <= 0 || count <= 0) {
    return 0
  }
  return Math.sqrt(Math.min(count / ceiling, 1))
}
