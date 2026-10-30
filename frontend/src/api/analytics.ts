import type {
  ClassCompositionResponse,
  DamConversionResponse,
  LocationListResponse,
  RunCurveResponse,
  RunTimingResponse,
  SiblingForecastResponse,
  WeeklyHeatmapResponse,
} from '../types'
import { fetchJson } from './client'

function speciesPath(speciesCode: string): string {
  return `/api/species/${encodeURIComponent(speciesCode)}`
}

export function fetchLocationList(): Promise<LocationListResponse> {
  return fetchJson('/api/locations', 'Failed to load dams')
}

export function fetchRunTiming(
  speciesCode: string,
  locationCode: string,
): Promise<RunTimingResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/run-timing?location=${encodeURIComponent(locationCode)}`,
    `Failed to load run timing for ${speciesCode}`,
  )
}

export function fetchRunCurve(
  speciesCode: string,
  locationCode: string,
  year: number,
): Promise<RunCurveResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/run-timing/${year}/curve?location=${encodeURIComponent(locationCode)}`,
    `Failed to load ${speciesCode} run curve for ${year}`,
  )
}

export function fetchClassComposition(speciesCode: string): Promise<ClassCompositionResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/class-composition`,
    `Failed to load composition for ${speciesCode}`,
  )
}

export function fetchSiblingForecast(
  speciesCode: string,
  locationCode: string,
): Promise<SiblingForecastResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/sibling-forecast?location=${encodeURIComponent(locationCode)}`,
    `Failed to load jack forecast for ${speciesCode}`,
  )
}

export function fetchDamConversion(speciesCode: string): Promise<DamConversionResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/dam-conversion`,
    `Failed to load dam conversion for ${speciesCode}`,
  )
}

export function fetchWeeklyHeatmap(
  speciesCode: string,
  locationCode: string,
): Promise<WeeklyHeatmapResponse> {
  return fetchJson(
    `${speciesPath(speciesCode)}/weekly-heatmap?location=${encodeURIComponent(locationCode)}`,
    `Failed to load heatmap for ${speciesCode}`,
  )
}
