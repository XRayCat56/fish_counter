import { useEffect, useState } from 'react'

interface UseYearDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Loads data for a given year. `fetcher` must be a stable reference
 * (e.g. a module-level function) so the effect only re-runs on year change.
 */
export function useYearData<T>(
  fetcher: (year: number) => Promise<T>,
  year: number,
): UseYearDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher(year)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Failed to load data')
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
  }, [fetcher, year])

  return { data, loading, error }
}
