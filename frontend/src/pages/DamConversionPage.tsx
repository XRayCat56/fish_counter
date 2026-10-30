import { useState } from 'react'

import { ChartSection } from '../components/ChartSection'
import { DamFunnelChart } from '../components/DamFunnelChart'
import { DamRatioChart } from '../components/DamRatioChart'
import { LabeledSelect } from '../components/LabeledSelect'
import { MAX_YEAR, YEAR_OPTIONS } from '../constants/years'
import { useDamConversion } from '../hooks/useAnalytics'
import { useSpeciesSelection } from '../hooks/useSelections'
import { toFunnelRows, toRatioRows } from '../utils/conversion'

const RATIO_NOTE =
  'Fish leave the main run for tributaries, harvest and mortality, so counts fall as the river goes upstream. Dams count over different windows (Bonneville counts year-round), so each percentage only uses days when both dams recorded a count, and years with under a month of overlap are left out. Fish counted late in the year can pass upstream dams the next year, which makes steelhead ratios noisier.'

export function DamConversionPage() {
  // The most recent complete year is the useful default for a whole-year comparison.
  const [year, setYear] = useState(MAX_YEAR - 1)

  const species = useSpeciesSelection()
  const conversion = useDamConversion(species.code)

  const speciesName = species.selected?.name ?? 'Species'
  const loading = species.loading || conversion.loading
  const error = species.error ?? conversion.error
  const data = conversion.data

  const funnelRows = data ? toFunnelRows(data.locations, year) : []
  const ratioRows = data ? toRatioRows(data.locations, data.reference_code) : []

  return (
    <div className="app">
      <header className="header">
        <h1>Dam-to-Dam Conversion</h1>
        <div className="picker-group">
          <LabeledSelect
            label="Species"
            value={species.code ?? ''}
            options={species.options}
            onChange={species.setCode}
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
          title={`${year} ${speciesName} counted at each dam`}
          loading={loading}
          error={error}
          note={year >= MAX_YEAR ? `${year} is still being counted, so these totals are partial.` : ''}
        >
          {data && <DamFunnelChart rows={funnelRows} referenceName={data.reference_name} />}
        </ChartSection>

        <ChartSection
          title={`${speciesName} counted upstream as a share of ${data?.reference_name ?? 'the first dam'}`}
          loading={loading}
          error={error}
          note={RATIO_NOTE}
        >
          {data && (
            <DamRatioChart
              locations={data.locations}
              rows={ratioRows}
              referenceCode={data.reference_code}
              referenceName={data.reference_name}
            />
          )}
        </ChartSection>
      </main>
    </div>
  )
}
