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
import { MAX_YEAR, YEARS } from './constants/years'
import './App.css'

const PASSAGE_NOTE =
  'A fish is counted at every dam it climbs, so totals across dams count passages rather than distinct fish. For the size of a run, look at a single dam such as Bonneville.'

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
        <ChartSection
          title={`${year} dam passages by species`}
          loading={totals.loading}
          error={totals.error}
          note={PASSAGE_NOTE}
        >
          {totals.data && <SpeciesTotals species={totals.data.species} />}
        </ChartSection>

        <ChartSection title="Daily passages, all dams" loading={daily.loading} error={daily.error} note={PASSAGE_NOTE}>
          {daily.data && <FishCountChart species={daily.data.species} />}
        </ChartSection>

        <ChartSection title="Monthly passages by species, all dams" loading={monthly.loading} error={monthly.error} note={PASSAGE_NOTE}>
          {monthly.data && <MonthlySpeciesBarChart species={monthly.data.species} />}
        </ChartSection>

        <ChartSection title="Passages by dam" loading={locations.loading} error={locations.error}>
          {locations.data && <LocationPieChart locations={locations.data.locations} />}
        </ChartSection>
      </main>
    </div>
  )
}

export default App
