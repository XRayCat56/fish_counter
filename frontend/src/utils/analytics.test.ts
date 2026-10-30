import { describe, expect, it } from 'vitest'

import type {
  CurvePoint,
  DamConversionSeries,
  HeatmapCell,
  LocationComposition,
  SiblingForecastResponse,
  SpeciesInfo,
} from '../types'
import { focusClassFor, focusShare, regressionSegment, toShareRows, toSiblingPlotPoints } from './composition'
import { MIN_MATCHED_DAYS, toFunnelRows, toRatioRows } from './conversion'
import {
  describeDayShift,
  formatDayOfYear,
  formatMonthTick,
  formatWeekRange,
  monthAxis,
  monthWeekLabels,
} from './dates'
import { niceCeil } from './chartData'
import { buildHeatmapGrid, cellIntensity } from './heatmap'
import { describeTrend, toCurveRows, toTimingRows } from './runTiming'

describe('dates', () => {
  it('formats day-of-year indexes on a non-leap calendar', () => {
    expect(formatDayOfYear(1)).toBe('Jan 1')
    expect(formatDayOfYear(59)).toBe('Feb 28')
    expect(formatDayOfYear(60)).toBe('Mar 1')
    expect(formatDayOfYear(365)).toBe('Dec 31')
  })

  it('rounds fractional and clamps out-of-range days', () => {
    expect(formatDayOfYear(243.6)).toBe('Sep 1')
    expect(formatDayOfYear(0)).toBe('Jan 1')
    expect(formatDayOfYear(999)).toBe('Dec 31')
  })

  it('labels month starts and falls back to dates elsewhere', () => {
    expect(formatMonthTick(1)).toBe('Jan')
    expect(formatMonthTick(121)).toBe('May')
    expect(formatMonthTick(122)).toBe('May 2')
  })

  it('describes shifts in days', () => {
    expect(describeDayShift(100, 103)).toBe('3 days earlier')
    expect(describeDayShift(104, 103)).toBe('1 day later')
    expect(describeDayShift(103.2, 103)).toBe('on the average date')
  })

  it('formats week ranges and ends the last week on Dec 31', () => {
    expect(formatWeekRange(1)).toBe('Jan 1 – Jan 7')
    expect(formatWeekRange(52)).toBe('Dec 24 – Dec 31')
  })

  it('builds a month-aligned axis around a date range', () => {
    // Apr 10 (day 100) to Oct 27 (day 300) -> Apr 1 ... Nov 1
    expect(monthAxis(100, 300)).toEqual({
      domain: [91, 305],
      ticks: [91, 121, 152, 182, 213, 244, 274, 305],
    })
    // Past the last month start the axis ends on Dec 31.
    expect(monthAxis(340, 360).domain).toEqual([335, 365])
  })

  it('rounds chart maxima up to tidy numbers', () => {
    expect(niceCeil(215000)).toBe(250000)
    expect(niceCeil(100000)).toBe(100000)
    expect(niceCeil(7)).toBe(7)
    expect(niceCeil(0)).toBe(1)
  })

  it('places one label per month along the week axis', () => {
    const labels = monthWeekLabels()
    expect(labels).toHaveLength(12)
    expect(labels[0]).toEqual({ week: 1, label: 'Jan' })
    expect(labels[11].label).toBe('Dec')
  })
})

describe('runTiming', () => {
  const point = (overrides: Partial<CurvePoint>): CurvePoint => ({
    doy: 1,
    year_pct: null,
    year_count: null,
    baseline_avg_pct: null,
    baseline_min_pct: null,
    baseline_max_pct: null,
    baseline_avg_count: null,
    baseline_min_count: null,
    baseline_max_count: null,
    ...overrides,
  })

  it('switches between percent and count series', () => {
    const points = [
      point({
        year_pct: 50,
        year_count: 500,
        baseline_avg_pct: 40,
        baseline_avg_count: 400,
        baseline_min_pct: 30,
        baseline_max_pct: 60,
        baseline_min_count: 300,
        baseline_max_count: 600,
      }),
    ]
    expect(toCurveRows(points, 'percent')[0]).toEqual({
      doy: 1,
      year: 50,
      baseline: 40,
      band: [30, 60],
    })
    expect(toCurveRows(points, 'count')[0]).toEqual({
      doy: 1,
      year: 500,
      baseline: 400,
      band: [300, 600],
    })
  })

  it('leaves the band empty without a baseline', () => {
    expect(toCurveRows([point({ year_pct: 5 })], 'percent')[0].band).toBeNull()
  })

  it('only draws the trend line over complete years', () => {
    const rows = toTimingRows(
      [
        { year: 2000, total: 1, first_doy: 1, last_doy: 9, peak_doy: 5, p10_doy: 2, p50_doy: 5, p90_doy: 8, in_progress: false },
        { year: 2001, total: 1, first_doy: 1, last_doy: 9, peak_doy: 5, p10_doy: 2, p50_doy: 6, p90_doy: 8, in_progress: true },
      ],
      { slope_per_year: 2, intercept: -3995, r_squared: 0.5, n: 2 },
    )
    expect(rows[0].trend).toBe(5)
    expect(rows[0].range).toEqual([2, 8])
    expect(rows[1].trend).toBeNull()
  })

  it('describes trends per decade', () => {
    const fit = { slope_per_year: 0.33, intercept: 0, r_squared: 0.1, n: 10 }
    expect(describeTrend(fit)).toBe('3.3 days later per decade')
    expect(describeTrend({ ...fit, slope_per_year: -0.2 })).toBe('2.0 days earlier per decade')
    expect(describeTrend({ ...fit, slope_per_year: 0 })).toBe('no change per decade')
  })
})

describe('composition', () => {
  const species = (class_codes: string[]): SpeciesInfo => ({ code: 'x', name: 'X', class_codes })

  it('picks the focus class a species records', () => {
    expect(focusClassFor(species(['total', 'adult', 'jack']))?.code).toBe('jack')
    expect(focusClassFor(species(['total', 'unclipped', 'clipped']))?.code).toBe('unclipped')
    expect(focusClassFor(species(['total']))).toBeNull()
    expect(focusClassFor(undefined)).toBeNull()
  })

  it('computes shares from component classes only', () => {
    expect(focusShare({ adult: 75, jack: 25 }, 'jack', ['adult', 'jack'])).toBe(0.25)
    expect(focusShare({ adult: 0, jack: 0 }, 'jack', ['adult', 'jack'])).toBeNull()
    expect(focusShare({ adult: -5, jack: 10 }, 'jack', ['adult', 'jack'])).toBe(1)
  })

  const locations: LocationComposition[] = [
    {
      code: 'BON',
      name: 'Bonneville',
      years: [
        { year: 2000, counts: { adult: 90, jack: 10 }, in_progress: false },
        { year: 2001, counts: { adult: 50, jack: 50 }, in_progress: true },
      ],
    },
    {
      code: 'LGR',
      name: 'Lower Granite',
      years: [{ year: 2000, counts: { adult: 60, jack: 40 }, in_progress: false }],
    },
  ]
  const classes = [
    { code: 'adult', name: 'Adult' },
    { code: 'jack', name: 'Jack' },
  ]

  it('builds one share row per complete year', () => {
    expect(toShareRows(locations, 'jack', classes)).toEqual([{ year: 2000, BON: 0.1, LGR: 0.4 }])
  })

  const response = (overrides: Partial<SiblingForecastResponse>): SiblingForecastResponse => ({
    species_code: 'chinook',
    species_name: 'Chinook',
    location_code: 'BON',
    location_name: 'Bonneville',
    pairs: [],
    fit: null,
    forecast: null,
    ...overrides,
  })

  it('classifies sibling plot points and appends the forecast', () => {
    const points = toSiblingPlotPoints(
      response({
        pairs: [
          { jack_year: 1, adult_year: 2, jacks: 10, adults: 100, predicted_adults: 90, adults_in_progress: false },
          { jack_year: 2, adult_year: 3, jacks: 20, adults: 50, predicted_adults: 190, adults_in_progress: true },
        ],
        forecast: {
          jack_year: 3,
          adult_year: 4,
          jacks: 30,
          predicted_adults: 300,
          predicted_low: 250,
          predicted_high: 350,
          jacks_in_progress: false,
        },
      }),
    )
    expect(points.map((p) => p.kind)).toEqual(['fit', 'in-progress', 'forecast'])
    expect(points[2]).toMatchObject({ x: 30, y: 300, jackYear: 3, adultYear: 4 })
  })

  it('draws the regression line from zero and never below zero', () => {
    const fit = { slope: 2, intercept: -10, r_squared: 0.5, residual_std_error: 1, n: 5 }
    expect(regressionSegment(fit, 100)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 190 },
    ])
  })
})

describe('conversion', () => {
  const series: DamConversionSeries[] = [
    {
      code: 'BON',
      name: 'Bonneville',
      river: 'Columbia',
      years: [
        { year: 2020, total: 1000, days_counted: 365, matched_days: 365, ratio: 1, in_progress: false },
      ],
    },
    {
      code: 'LGR',
      name: 'Lower Granite',
      river: 'Snake',
      years: [
        { year: 2019, total: 400, days_counted: 300, matched_days: 10, ratio: 0.9, in_progress: false },
        { year: 2020, total: 400, days_counted: 300, matched_days: 300, ratio: 0.4, in_progress: false },
        { year: 2021, total: 50, days_counted: 100, matched_days: 100, ratio: 0.5, in_progress: true },
      ],
    },
  ]

  it('keeps only complete, well-overlapped years for non-reference dams', () => {
    expect(toRatioRows(series, 'BON')).toEqual([{ year: 2020, LGR: 0.4 }])
    expect(MIN_MATCHED_DAYS).toBe(30)
  })

  it('builds one funnel bar per dam with data that year', () => {
    const rows = toFunnelRows(series, 2020)
    expect(rows.map((row) => row.code)).toEqual(['BON', 'LGR'])
    expect(rows[1]).toMatchObject({ total: 400, ratio: 0.4, ratioLabel: '40%' })
    expect(toFunnelRows(series, 2019).map((row) => row.code)).toEqual(['LGR'])
  })

  it('drops the ratio label when overlap is too short', () => {
    expect(toFunnelRows(series, 2019)[0]).toMatchObject({ ratio: null, ratioLabel: '' })
  })
})

describe('heatmap', () => {
  const cells: HeatmapCell[] = [
    { year: 2000, week: 1, count: 0 },
    { year: 2000, week: 2, count: 100 },
    { year: 2001, week: 2, count: 25 },
  ]

  it('indexes cells by year and week', () => {
    const grid = buildHeatmapGrid(cells)
    expect(grid.years).toEqual([2000, 2001])
    expect(grid.byYear.get(2000)?.get(2)).toBe(100)
    expect(grid.maxCount).toBe(100)
    expect(grid.yearMax.get(2001)).toBe(25)
  })

  it('scales intensity against the whole data set or each year', () => {
    const grid = buildHeatmapGrid(cells)
    expect(cellIntensity(grid, 2001, 25, 'absolute')).toBeCloseTo(0.5)
    expect(cellIntensity(grid, 2001, 25, 'relative')).toBeCloseTo(1)
    expect(cellIntensity(grid, 2000, 0, 'absolute')).toBe(0)
  })
})
