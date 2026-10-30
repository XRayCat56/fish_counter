import { useState } from 'react'

import { ChartSection } from '../components/ChartSection'
import { LabeledSelect } from '../components/LabeledSelect'
import { RunHeatmap } from '../components/RunHeatmap'
import { ToggleGroup } from '../components/ToggleGroup'
import { useWeeklyHeatmap } from '../hooks/useAnalytics'
import { useLocationSelection, useSpeciesSelection } from '../hooks/useSelections'
import type { HeatmapScale } from '../utils/heatmap'

const SCALE_OPTIONS: Array<{ value: HeatmapScale; label: string }> = [
  { value: 'absolute', label: 'Compare size' },
  { value: 'relative', label: 'Compare timing' },
]

const SCALE_NOTES: Record<HeatmapScale, string> = {
  absolute:
    'Every year uses the same color scale, so big years stand out from small ones. Colors use a square-root scale so quiet weeks stay visible.',
  relative:
    "Each year is colored against its own busiest week, so the shape and timing of the run is easy to compare even in small years.",
}

export function HeatmapPage() {
  const [scale, setScale] = useState<HeatmapScale>('absolute')

  const species = useSpeciesSelection()
  const location = useLocationSelection('BON')
  const heatmap = useWeeklyHeatmap(species.code, location.code)

  const speciesName = species.selected?.name ?? 'Species'
  const damName = location.selected?.name ?? 'dam'

  return (
    <div className="app">
      <header className="header">
        <h1>Run Heatmap</h1>
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
        </div>
      </header>

      <main className="main">
        <ChartSection
          title={`${speciesName} at ${damName}: fish counted per week`}
          loading={species.loading || location.loading || heatmap.loading}
          error={species.error ?? location.error ?? heatmap.error}
          note={SCALE_NOTES[scale]}
        >
          <div className="chart-toolbar">
            <ToggleGroup
              label="Color scale"
              options={SCALE_OPTIONS}
              value={scale}
              onChange={setScale}
            />
          </div>
          {heatmap.data && species.code !== null && (
            <RunHeatmap cells={heatmap.data.cells} speciesCode={species.code} scale={scale} />
          )}
        </ChartSection>
      </main>
    </div>
  )
}
