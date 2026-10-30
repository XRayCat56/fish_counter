import { useState } from 'react'

import { ChartSection } from '../components/ChartSection'
import { LabeledSelect } from '../components/LabeledSelect'
import { RunCurveChart } from '../components/RunCurveChart'
import { TimingSummary } from '../components/TimingSummary'
import { TimingTrendChart } from '../components/TimingTrendChart'
import { ToggleGroup } from '../components/ToggleGroup'
import { MAX_YEAR, YEAR_OPTIONS } from '../constants/years'
import { useRunCurve, useRunTiming } from '../hooks/useAnalytics'
import { useLocationSelection, useSpeciesSelection } from '../hooks/useSelections'
import { describeTrend, type CurveMode } from '../utils/runTiming'

const MULTI_RUN_SPECIES = new Set(['chinook', 'steelhead'])

const MODE_OPTIONS: Array<{ value: CurveMode; label: string }> = [
  { value: 'percent', label: '% of run' },
  { value: 'count', label: 'Fish counted' },
]

export function RunTimingPage() {
  const [year, setYear] = useState(MAX_YEAR)
  const [mode, setMode] = useState<CurveMode>('percent')

  const species = useSpeciesSelection()
  const location = useLocationSelection('BON')
  const curve = useRunCurve(species.code, location.code, year)
  const timing = useRunTiming(species.code, location.code)

  const speciesName = species.selected?.name ?? 'Species'
  const damName = location.selected?.name ?? 'dam'

  const curveData = curve.data
  const curveLoading = species.loading || location.loading || curve.loading
  const curveError = species.error ?? location.error ?? curve.error
  const timingLoading = species.loading || location.loading || timing.loading
  const timingError = species.error ?? location.error ?? timing.error
  const isMultiRun = species.code !== null && MULTI_RUN_SPECIES.has(species.code)

  const curveNotes: string[] = []
  if (curveData?.in_progress) {
    curveNotes.push(
      `${year} is still being counted. The curve stops at the last counted day, and percentages are of the fish counted so far, so these dates will shift as the run continues.`,
    )
  }
  if (curveData !== null && curveData.baseline_years.length === 0) {
    curveNotes.push('There are no earlier complete years to compare against.')
  }
  if (isMultiRun) {
    curveNotes.push(
      `${speciesName} return in several runs, so the curve can climb in more than one stretch of the year.`,
    )
  }

  const trend = timing.data?.p50_trend ?? null
  const timingNote = [
    trend !== null
      ? `The half-way date has moved ${describeTrend(trend)} across ${trend.n} complete years (R² = ${trend.r_squared.toFixed(2)}).`
      : '',
    isMultiRun
      ? `${speciesName} return in several runs. The half-way date jumps between seasons when a different run is the biggest, so read the trend with care.`
      : '',
    'Years with fewer than 100 fish are left out. The year in progress is shown but is not part of the trend.',
  ]
    .filter((sentence) => sentence !== '')
    .join(' ')

  return (
    <div className="app">
      <header className="header">
        <h1>Run Timing</h1>
        <div className="picker-group">
          <LabeledSelect
            label="Species"
            value={species.code ?? ''}
            options={species.options}
            onChange={species.setCode}
          />
          <LabeledSelect
            label="Dam"
            value={location.code ?? ''}
            options={location.options}
            onChange={location.setCode}
          />
          <LabeledSelect
            label="Year"
            value={String(year)}
            options={YEAR_OPTIONS}
            onChange={(value) => setYear(Number(value))}
          />
        </div>
      </header>

      <main className="main">
        <ChartSection
          title={`${year} ${speciesName} passage at ${damName}`}
          loading={curveLoading}
          error={curveError}
          note={curveNotes.join(' ')}
        >
          {curveData && (
            <>
              <TimingSummary curve={curveData} />
              <div className="chart-toolbar">
                <ToggleGroup
                  label="Curve units"
                  options={MODE_OPTIONS}
                  value={mode}
                  onChange={setMode}
                />
              </div>
              <RunCurveChart
                points={curveData.points}
                mode={mode}
                yearLabel={String(year)}
                baselineLabel={
                  curveData.baseline_years.length > 0
                    ? `Average ${curveData.baseline_years[0]}–${curveData.baseline_years[curveData.baseline_years.length - 1]}`
                    : 'Baseline average'
                }
                hasBaseline={curveData.baseline_years.length > 0}
              />
            </>
          )}
        </ChartSection>

        <ChartSection
          title={`When ${speciesName} pass ${damName}, by year`}
          loading={timingLoading}
          error={timingError}
          note={timingNote}
        >
          {timing.data && <TimingTrendChart years={timing.data.years} trend={trend} />}
        </ChartSection>
      </main>
    </div>
  )
}
