import { useEffect, useRef, useState } from 'react'

export interface AsyncData<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface Settled<T> {
  key: string
  data: T | null
  error: string | null
}

/**
 * Loads data whenever `key` changes. Pass `null` to skip loading (for example
 * while a required selection is still unknown).
 *
 * `loading` is derived from whether the latest result belongs to the current
 * key, so switching keys never shows the previous key's data.
 */
export function useAsyncData<T>(
  key: string | null,
  load: () => Promise<T>,
  fallbackError: string,
): AsyncData<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  // Always call the latest loader without making it an effect dependency.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (key === null) {
      return
    }
    let cancelled = false

    loadRef
      .current()
      .then((data) => {
        if (!cancelled) {
          setSettled({ key, data, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSettled({
            key,
            data: null,
            error: err instanceof Error ? err.message : fallbackError,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, fallbackError])

  const current = settled !== null && settled.key === key ? settled : null
  return {
    data: current?.data ?? null,
    loading: key !== null && current === null,
    error: current?.error ?? null,
  }
}
