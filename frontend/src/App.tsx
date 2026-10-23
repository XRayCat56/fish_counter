import { useState } from 'react'

import { ChartSection } from './components/ChartSection'
import { FishCountChart } from './components/FishCountChart'
import { LocationPieChart } from './components/LocationPieChart'
import { MonthlySpeciesBarChart } from './components/MonthlySpeciesBarChart'
import { SpeciesTotals } from './components/SpeciesTotals'
import { useLocationTotals } from './hooks/useLocationTotals'
import { useMonthlyCounts } from './hooks/useMonthlyCounts'
import { useSpeciesTotals } from './hooks/useSpeciesTotals'
import { useYearCounts } from './hooks/useYearCounts'
import './App.css'

const MIN_YEAR = 1938
const MAX_YEAR = 2025
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i)

function App() {
  const [year, setYear] = useState(MAX_YEAR)
  const daily = useYearCounts(year)
  const monthly = useMonthlyCounts(year)
  const locations = useLocationTotals(year)
  const totals = useSpeciesTotals(year)

  return (
    <div className="app">
      <header className="header">
        <h1>PNW Fish Tracker</h1>
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
      </header>

      <main className="main">
        <ChartSection title={`${year} totals by species`} loading={totals.loading} error={totals.error}>
          {totals.data && <SpeciesTotals species={totals.data.species} />}
        </ChartSection>

        <ChartSection title="Daily counts" loading={daily.loading} error={daily.error}>
          {daily.data && <FishCountChart species={daily.data.species} />}
        </ChartSection>

        <ChartSection title="Monthly counts by species" loading={monthly.loading} error={monthly.error}>
          {monthly.data && <MonthlySpeciesBarChart species={monthly.data.species} />}
        </ChartSection>

        <ChartSection title="Totals by dam location" loading={locations.loading} error={locations.error}>
          {locations.data && <LocationPieChart locations={locations.data.locations} />}
        </ChartSection>
      </main>
    </div>
  )
}

export default App
