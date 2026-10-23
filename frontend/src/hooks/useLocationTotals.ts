import { fetchLocationTotalsForYear } from '../api/counts'
import { useYearData } from './useYearData'

export function useLocationTotals(year: number) {
  return useYearData(fetchLocationTotalsForYear, year)
}
