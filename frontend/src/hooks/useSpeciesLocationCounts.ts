import { useEffect, useState } from 'react'

import { fetchSpeciesLocationCounts } from '../api/counts'
import type { SpeciesLocationCountsResponse } from '../types'

interface UseSpeciesLocationCountsResult {
  data: SpeciesLocationCountsResponse | null
  loading: boolean
  error: string | null
}

/** Loads daily counts per dam for a species/year. Skips fetching while `speciesCode` is null. */
export function useSpeciesLocationCounts(
  year: number,
  speciesCode: string | null,
): UseSpeciesLocationCountsResult {
  const [data, setData] = useState<SpeciesLocationCountsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (speciesCode === null) {
      return
    }
    let cancelled = false

    async function load(code: string) {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchSpeciesLocationCounts(year, code)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Failed to load fish counts')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load(speciesCode)
    return () => {
      cancelled = true
    }
  }, [year, speciesCode])

  return { data, loading, error }
}
