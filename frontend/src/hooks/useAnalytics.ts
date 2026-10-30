import {
  fetchClassComposition,
  fetchDamConversion,
  fetchLocationList,
  fetchRunCurve,
  fetchRunTiming,
  fetchSiblingForecast,
  fetchWeeklyHeatmap,
} from '../api/analytics'
import type {
  ClassCompositionResponse,
  DamConversionResponse,
  LocationListResponse,
  RunCurveResponse,
  RunTimingResponse,
  SiblingForecastResponse,
  WeeklyHeatmapResponse,
} from '../types'
import { useAsyncData, type AsyncData } from './useAsyncData'

/** Joins request parameters into a cache key, or `null` if any is missing. */
function keyOf(...parts: Array<string | number | null>): string | null {
  return parts.some((part) => part === null) ? null : parts.join('|')
}

export function useLocationList(): AsyncData<LocationListResponse> {
  return useAsyncData('locations', fetchLocationList, 'Failed to load dams')
}

export function useRunTiming(
  speciesCode: string | null,
  locationCode: string | null,
): AsyncData<RunTimingResponse> {
  return useAsyncData(
    keyOf('timing', speciesCode, locationCode),
    () => fetchRunTiming(speciesCode ?? '', locationCode ?? ''),
    'Failed to load run timing',
  )
}

export function useRunCurve(
  speciesCode: string | null,
  locationCode: string | null,
  year: number,
): AsyncData<RunCurveResponse> {
  return useAsyncData(
    keyOf('curve', speciesCode, locationCode, year),
    () => fetchRunCurve(speciesCode ?? '', locationCode ?? '', year),
    'Failed to load run curve',
  )
}

export function useClassComposition(
  speciesCode: string | null,
): AsyncData<ClassCompositionResponse> {
  return useAsyncData(
    keyOf('composition', speciesCode),
    () => fetchClassComposition(speciesCode ?? ''),
    'Failed to load composition',
  )
}

/** Pass `enabled = false` for species that have no jack counts. */
export function useSiblingForecast(
  speciesCode: string | null,
  locationCode: string | null,
  enabled: boolean,
): AsyncData<SiblingForecastResponse> {
  return useAsyncData(
    enabled ? keyOf('sibling', speciesCode, locationCode) : null,
    () => fetchSiblingForecast(speciesCode ?? '', locationCode ?? ''),
    'Failed to load jack forecast',
  )
}

export function useDamConversion(
  speciesCode: string | null,
): AsyncData<DamConversionResponse> {
  return useAsyncData(
    keyOf('conversion', speciesCode),
    () => fetchDamConversion(speciesCode ?? ''),
    'Failed to load dam conversion',
  )
}

export function useWeeklyHeatmap(
  speciesCode: string | null,
  locationCode: string | null,
): AsyncData<WeeklyHeatmapResponse> {
  return useAsyncData(
    keyOf('heatmap', speciesCode, locationCode),
    () => fetchWeeklyHeatmap(speciesCode ?? '', locationCode ?? ''),
    'Failed to load heatmap',
  )
}
