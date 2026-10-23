import { useEffect, useState } from 'react'

import { fetchSpeciesList } from '../api/counts'
import type { SpeciesInfo } from '../types'

interface UseSpeciesListResult {
  species: SpeciesInfo[]
  loading: boolean
  error: string | null
}

export function useSpeciesList(): UseSpeciesListResult {
  const [species, setSpecies] = useState<SpeciesInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchSpeciesList()
        if (!cancelled) {
          setSpecies(result.species)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load species list')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { species, loading, error }
}
