import type {
  ClassInfo,
  LocationComposition,
  SiblingForecast,
  SiblingFit,
  SiblingForecastResponse,
  SpeciesInfo,
  YearlyChartRow,
} from '../types'

/** A class whose share of returns is worth tracking, in priority order. */
export interface FocusClass {
  code: string
  /** Chart/section label, e.g. "Jack share of returns". */
  label: string
  /** Short noun used in sentences, e.g. "jacks". */
  noun: string
  /** Caveat shown under the chart. */
  note: string
}

const FOCUS_CLASSES: readonly FocusClass[] = [
  {
    code: 'jack',
    label: 'Jack share of returns',
    noun: 'jacks',
    note: 'Jacks are early-maturing males. A high jack share often follows strong ocean survival for that brood.',
  },
  {
    code: 'unclipped',
    label: 'Unclipped share of returns',
    noun: 'unclipped fish',
    note: 'Unclipped steelhead are a rough proxy for wild fish. Some hatchery fish are released without a clipped adipose fin.',
  },
]

/** Which class to highlight for a species, or `null` when it records no component classes. */
export function focusClassFor(species: SpeciesInfo | undefined): FocusClass | null {
  if (species === undefined) {
    return null
  }
  return FOCUS_CLASSES.find((focus) => species.class_codes.includes(focus.code)) ?? null
}

/** Species that record component classes (adult/jack, clipped/unclipped) and can be compared. */
export function hasComponentClasses(species: SpeciesInfo): boolean {
  return focusClassFor(species) !== null
}

/** Fraction (0-1) of a year's returns in the focus class, or `null` if nothing was counted. */
export function focusShare(
  counts: Record<string, number>,
  focusCode: string,
  classCodes: readonly string[],
): number | null {
  const whole = classCodes.reduce((sum, code) => sum + Math.max(counts[code] ?? 0, 0), 0)
  if (whole <= 0) {
    return null
  }
  return Math.max(counts[focusCode] ?? 0, 0) / whole
}

/** One row per year with each dam's focus-class share. Years still being counted are skipped. */
export function toShareRows(
  locations: LocationComposition[],
  focusCode: string,
  classes: ClassInfo[],
): YearlyChartRow[] {
  const classCodes = classes.map((info) => info.code)
  const byYear = new Map<number, YearlyChartRow>()

  for (const location of locations) {
    for (const entry of location.years) {
      if (entry.in_progress) {
        continue
      }
      const share = focusShare(entry.counts, focusCode, classCodes)
      if (share === null) {
        continue
      }
      const row = byYear.get(entry.year) ?? { year: entry.year }
      row[location.code] = share
      byYear.set(entry.year, row)
    }
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year)
}

/** One row per year with each class's count at a single dam. */
export function toStackedRows(
  location: LocationComposition,
  classes: ClassInfo[],
): YearlyChartRow[] {
  return location.years.map((entry) => {
    const row: YearlyChartRow = { year: entry.year }
    for (const info of classes) {
      row[info.code] = Math.max(entry.counts[info.code] ?? 0, 0)
    }
    return row
  })
}

export type SiblingPointKind = 'fit' | 'in-progress' | 'forecast'

export interface SiblingPlotPoint {
  /** Jacks counted in `jackYear`. */
  x: number
  /** Adults counted (or predicted) in `adultYear`. */
  y: number
  jackYear: number
  adultYear: number
  kind: SiblingPointKind
}

export function isSiblingPlotPoint(value: unknown): value is SiblingPlotPoint {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return 'x' in value && 'y' in value && 'jackYear' in value && 'adultYear' in value && 'kind' in value
}

/** Scatter points for the jack-to-adult chart: fitted years, an in-progress year, and the forecast. */
export function toSiblingPlotPoints(response: SiblingForecastResponse): SiblingPlotPoint[] {
  const points: SiblingPlotPoint[] = response.pairs.map((pair) => ({
    x: pair.jacks,
    y: pair.adults,
    jackYear: pair.jack_year,
    adultYear: pair.adult_year,
    kind: pair.adults_in_progress ? 'in-progress' : 'fit',
  }))

  const { forecast } = response
  if (forecast !== null) {
    points.push(forecastPoint(forecast))
  }
  return points
}

function forecastPoint(forecast: SiblingForecast): SiblingPlotPoint {
  return {
    x: forecast.jacks,
    y: forecast.predicted_adults,
    jackYear: forecast.jack_year,
    adultYear: forecast.adult_year,
    kind: 'forecast',
  }
}

/** End points of the regression line across the plotted jack range. */
export function regressionSegment(
  fit: SiblingFit,
  maxX: number,
): [{ x: number; y: number }, { x: number; y: number }] {
  const at = (x: number) => ({ x, y: Math.max(fit.intercept + fit.slope * x, 0) })
  return [at(0), at(maxX)]
}
