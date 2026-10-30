import { useState } from 'react'

import type { LocationInfo, SelectOption, SpeciesInfo } from '../types'
import { useLocationList } from './useAnalytics'
import { useSpeciesList } from './useSpeciesList'

export interface SpeciesSelection {
  /** Species the page can show, after any filter. */
  candidates: SpeciesInfo[]
  selected: SpeciesInfo | undefined
  /** Code of the selected species, or `null` until the list has loaded. */
  code: string | null
  setCode: (code: string) => void
  options: SelectOption[]
  loading: boolean
  error: string | null
}

/** Species picker state. Falls back to the first candidate until the user chooses one. */
export function useSpeciesSelection(
  filter?: (species: SpeciesInfo) => boolean,
): SpeciesSelection {
  const list = useSpeciesList()
  const [choice, setChoice] = useState<string | null>(null)

  const candidates = filter ? list.species.filter(filter) : list.species
  const selected = candidates.find((species) => species.code === choice) ?? candidates[0]

  return {
    candidates,
    selected,
    code: selected?.code ?? null,
    setCode: setChoice,
    options: candidates.map((species) => ({ value: species.code, label: species.name })),
    loading: list.loading,
    error: list.error,
  }
}

export interface LocationSelection {
  locations: LocationInfo[]
  selected: LocationInfo | undefined
  code: string | null
  setCode: (code: string) => void
  options: SelectOption[]
  loading: boolean
  error: string | null
}

/** Dam picker state. Prefers `preferredCode` until the user chooses one. */
export function useLocationSelection(preferredCode: string): LocationSelection {
  const list = useLocationList()
  const [choice, setChoice] = useState<string>(preferredCode)

  const locations = list.data?.locations ?? []
  const selected =
    locations.find((location) => location.code === choice) ?? locations[0]

  return {
    locations,
    selected,
    code: selected?.code ?? null,
    setCode: setChoice,
    options: locations.map((location) => ({ value: location.code, label: location.name })),
    loading: list.loading,
    error: list.error,
  }
}
