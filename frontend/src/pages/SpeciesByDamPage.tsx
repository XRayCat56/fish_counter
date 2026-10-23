import { useState } from 'react'

import { ChartSection } from '../components/ChartSection'
import { LocationLineChart } from '../components/LocationLineChart'
import { LocationTotals } from '../components/LocationTotals'
import { MAX_YEAR, YEARS } from '../constants/years'
import { useSpeciesList } from '../hooks/useSpeciesList'
import { useSpeciesLocationCounts } from '../hooks/useSpeciesLocationCounts'

export function SpeciesByDamPage() {
  const [year, setYear] = useState(MAX_YEAR)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const speciesList = useSpeciesList()
  const speciesCode = selectedCode ?? speciesList.species[0]?.code ?? null
  const counts = useSpeciesLocationCounts(year, speciesCode)

  const speciesName =
    speciesList.species.find((s) => s.code === speciesCode)?.name ?? 'Species'

  const isLoading = speciesList.loading || (speciesCode !== null && counts.loading)
  const error = speciesList.error ?? counts.error

  return (
    <div className="app">
      <header className="header">
        <h1>Species by Dam</h1>
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
          <label className="year-picker">
            <span>Year</span>
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              aria-label="Select year"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="main">
        <ChartSection
          title={`${year} ${speciesName} totals by dam`}
          loading={isLoading}
          error={error}
        >
          {counts.data && <LocationTotals locations={counts.data.locations} />}
        </ChartSection>

        <ChartSection
          title={`${speciesName} daily counts by dam, ${year}`}
          loading={isLoading}
          error={error}
        >
          {counts.data && <LocationLineChart locations={counts.data.locations} />}
        </ChartSection>
      </main>
    </div>
  )
}
