const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchJson<T>(path: string, errorLabel: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`${errorLabel} (${response.status})`)
  }
  return (await response.json()) as T
}
