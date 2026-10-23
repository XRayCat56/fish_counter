import { useEffect, useState } from 'react'

import { fetchCountsForYear } from '../api/counts'
import type { YearCountsResponse } from '../types'

interface UseYearCountsResult {
  data: YearCountsResponse | null
  loading: boolean
  error: string | null
}

export function useYearCounts(year: number): UseYearCountsResult {
  const [data, setData] = useState<YearCountsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchCountsForYear(year)
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

    void load()
    return () => {
      cancelled = true
    }
  }, [year])

  return { data, loading, error }
}
