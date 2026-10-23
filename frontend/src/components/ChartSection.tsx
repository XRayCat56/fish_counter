import type { ReactNode } from 'react'

interface ChartSectionProps {
  title: string
  loading: boolean
  error: string | null
  children: ReactNode
}

export function ChartSection({ title, loading, error, children }: ChartSectionProps) {
  return (
    <section className="chart-section">
      <h2 className="section-title">{title}</h2>
      {loading && <p className="status">Loading…</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && children}
    </section>
  )
}
