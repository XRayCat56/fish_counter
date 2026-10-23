import { useEffect, useState } from 'react'

import { fetchSpeciesYearlyTotals } from '../api/counts'
import type { SpeciesYearlyTotalsResponse } from '../types'

interface UseSpeciesYearlyTotalsResult {
  data: SpeciesYearlyTotalsResponse | null
  loading: boolean
  error: string | null
}

/** Loads yearly totals per dam for a species. Skips fetching while `speciesCode` is null. */
export function useSpeciesYearlyTotals(
  speciesCode: string | null,
): UseSpeciesYearlyTotalsResult {
  const [data, setData] = useState<SpeciesYearlyTotalsResponse | null>(null)
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
        const result = await fetchSpeciesYearlyTotals(code)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Failed to load yearly totals')
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
  }, [speciesCode])

  return { data, loading, error }
}
