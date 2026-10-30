import { ChartSection } from '../components/ChartSection'
import { CompositionShareChart } from '../components/CompositionShareChart'
import { CompositionStackedChart } from '../components/CompositionStackedChart'
import { LabeledSelect } from '../components/LabeledSelect'
import { SiblingScatterChart } from '../components/SiblingScatterChart'
import { SiblingSummary } from '../components/SiblingSummary'
import { useClassComposition, useSiblingForecast } from '../hooks/useAnalytics'
import { useLocationSelection, useSpeciesSelection } from '../hooks/useSelections'
import { focusClassFor, hasComponentClasses, toShareRows } from '../utils/composition'

export function CompositionPage() {
  const species = useSpeciesSelection(hasComponentClasses)
  const location = useLocationSelection('BON')
  const composition = useClassComposition(species.code)

  const focus = focusClassFor(species.selected)
  const hasJacks = species.selected?.class_codes.includes('jack') ?? false
  const sibling = useSiblingForecast(species.code, location.code, hasJacks)

  const speciesName = species.selected?.name ?? 'Species'
  const damName = location.selected?.name ?? 'dam'

  const compositionLoading = species.loading || composition.loading
  const compositionError = species.error ?? composition.error
  const selectedDam = composition.data?.locations.find((entry) => entry.code === location.code)

  const shareRows =
    composition.data && focus
      ? toShareRows(composition.data.locations, focus.code, composition.data.classes)
      : []
  const firstYear =
    composition.data === null
      ? null
      : composition.data.locations.reduce<number | null>((earliest, entry) => {
          const first = entry.years[0]?.year
          if (first === undefined) {
            return earliest
          }
          return earliest === null ? first : Math.min(earliest, first)
        }, null)

  return (
    <div className="app">
      <header className="header">
        <h1>Run Composition</h1>
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
        {focus && (
          <ChartSection
            title={`${speciesName}: ${focus.label.toLowerCase()}, by dam`}
            loading={compositionLoading}
            error={compositionError}
            note={`${focus.note} Years still being counted are left out.${
              firstYear !== null ? ` Counts are only split by class from ${firstYear}.` : ''
            }`}
          >
            {composition.data && (
              <CompositionShareChart
                locations={composition.data.locations}
                rows={shareRows}
                yLabel={focus.label}
              />
            )}
          </ChartSection>
        )}

        <ChartSection
          title={`${speciesName} at ${damName}: fish counted by class`}
          loading={compositionLoading || location.loading}
          error={compositionError ?? location.error}
          note={
            selectedDam?.years.some((entry) => entry.in_progress)
              ? 'The latest year is still being counted, so its bar is partial.'
              : ''
          }
        >
          {composition.data && selectedDam && (
            <CompositionStackedChart location={selectedDam} classes={composition.data.classes} />
          )}
          {composition.data && !selectedDam && (
            <p className="empty-state">No data at this dam for this species.</p>
          )}
        </ChartSection>

        {hasJacks && (
          <>
            <ChartSection
              title={`${speciesName} jack-to-adult forecast at ${damName}`}
              loading={species.loading || location.loading || sibling.loading}
              error={species.error ?? location.error ?? sibling.error}
            >
              {sibling.data && <SiblingSummary response={sibling.data} />}
            </ChartSection>

            <ChartSection
              title={`Jacks one year, adults the next (${damName})`}
              loading={species.loading || location.loading || sibling.loading}
              error={species.error ?? location.error ?? sibling.error}
              note="Each dot pairs one year's jack count with the following year's adult count. Jacks are young males that return after fewer years at sea, so a strong jack year hints at how many of the same brood return as adults. The dashed line is a least-squares fit across complete years. It is a rough guide: it ignores ocean conditions, harvest and hatchery releases."
            >
              {sibling.data && <SiblingScatterChart response={sibling.data} />}
            </ChartSection>
          </>
        )}
      </main>
    </div>
  )
}
