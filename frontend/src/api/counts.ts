import type {
  LocationTotalsResponse,
  MonthlyCountsResponse,
  SpeciesListResponse,
  SpeciesLocationCountsResponse,
  SpeciesTotalsResponse,
  SpeciesYearlyTotalsResponse,
  YearCountsResponse,
} from '../types'
import { fetchJson } from './client'

export function fetchCountsForYear(year: number): Promise<YearCountsResponse> {
  return fetchJson(`/api/counts/${year}`, `Failed to load counts for ${year}`)
}

export function fetchMonthlyCountsForYear(year: number): Promise<MonthlyCountsResponse> {
  return fetchJson(
    `/api/counts/${year}/monthly`,
    `Failed to load monthly counts for ${year}`,
  )
}

export function fetchLocationTotalsForYear(year: number): Promise<LocationTotalsResponse> {
  return fetchJson(
    `/api/counts/${year}/locations`,
    `Failed to load location totals for ${year}`,
  )
}

export function fetchSpeciesTotalsForYear(year: number): Promise<SpeciesTotalsResponse> {
  return fetchJson(
    `/api/counts/${year}/totals`,
    `Failed to load species totals for ${year}`,
  )
}

export function fetchSpeciesList(): Promise<SpeciesListResponse> {
  return fetchJson('/api/species', 'Failed to load species list')
}

export function fetchSpeciesLocationCounts(
  year: number,
  speciesCode: string,
): Promise<SpeciesLocationCountsResponse> {
  return fetchJson(
    `/api/counts/${year}/species/${encodeURIComponent(speciesCode)}/locations`,
    `Failed to load ${speciesCode} counts for ${year}`,
  )
}

export function fetchSpeciesYearlyTotals(
  speciesCode: string,
): Promise<SpeciesYearlyTotalsResponse> {
  return fetchJson(
    `/api/species/${encodeURIComponent(speciesCode)}/yearly-totals`,
    `Failed to load yearly totals for ${speciesCode}`,
  )
}
