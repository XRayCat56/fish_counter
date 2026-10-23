import { useState } from 'react'

import { ChartSection } from '../components/ChartSection'
import { YearlyTotalsLineChart } from '../components/YearlyTotalsLineChart'
import { useSpeciesList } from '../hooks/useSpeciesList'
import { useSpeciesYearlyTotals } from '../hooks/useSpeciesYearlyTotals'

export function YearlyTotalsByDamPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const speciesList = useSpeciesList()
  const speciesCode = selectedCode ?? speciesList.species[0]?.code ?? null
  const totals = useSpeciesYearlyTotals(speciesCode)

  const speciesName =
    speciesList.species.find((s) => s.code === speciesCode)?.name ?? 'Species'

  const isLoading = speciesList.loading || (speciesCode !== null && totals.loading)
  const error = speciesList.error ?? totals.error

  return (
    <div className="app">
      <header className="header">
        <h1>Yearly Totals by Dam</h1>
        <div className="picker-group">
          <label className="year-picker">
            <span>Species</span>
            <select
              value={speciesCode ?? ''}
              onChange={(event) => setSelectedCode(event.target.value)}
              aria-label="Select species"
              disabled={speciesList.species.length === 0}
            >
              {speciesList.species.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="main">
        <ChartSection
          title={`${speciesName} yearly totals by dam`}
          loading={isLoading}
          error={error}
        >
          {totals.data && <YearlyTotalsLineChart locations={totals.data.locations} />}
        </ChartSection>
      </main>
    </div>
  )
}
