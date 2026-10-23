import { fetchMonthlyCountsForYear } from '../api/counts'
import { useYearData } from './useYearData'

export function useMonthlyCounts(year: number) {
  return useYearData(fetchMonthlyCountsForYear, year)
}
