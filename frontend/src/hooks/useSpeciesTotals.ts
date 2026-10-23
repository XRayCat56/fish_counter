import { fetchSpeciesTotalsForYear } from '../api/counts'
import { useYearData } from './useYearData'

export function useSpeciesTotals(year: number) {
  return useYearData(fetchSpeciesTotalsForYear, year)
}
