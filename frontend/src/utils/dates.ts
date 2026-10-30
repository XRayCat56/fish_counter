import type { DayOfYear } from '../types'

export const DAYS_IN_YEAR = 365

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Day-of-year index of the first day of each month on a non-leap calendar. */
export const MONTH_START_DOY: readonly DayOfYear[] = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

/** Format a 1-365 day index as e.g. "Aug 31". Fractions are rounded to the nearest day. */
export function formatDayOfYear(doy: number): string {
  const day = Math.min(Math.max(Math.round(doy), 1), DAYS_IN_YEAR)
  let monthIndex = 0
  for (let i = 0; i < MONTH_START_DOY.length; i += 1) {
    if (MONTH_START_DOY[i] <= day) {
      monthIndex = i
    }
  }
  return `${MONTH_LABELS[monthIndex]} ${day - MONTH_START_DOY[monthIndex] + 1}`
}

/** Short month name for a tick that sits on the first day of a month. */
export function formatMonthTick(doy: number): string {
  const index = MONTH_START_DOY.indexOf(doy)
  return index === -1 ? formatDayOfYear(doy) : MONTH_LABELS[index]
}

/** Describe how many days `actual` is from `expected`, e.g. "3 days earlier". */
export function describeDayShift(actual: number, expected: number): string {
  const shift = Math.round(actual - expected)
  if (shift === 0) {
    return 'on the average date'
  }
  const days = Math.abs(shift)
  return `${days} ${days === 1 ? 'day' : 'days'} ${shift < 0 ? 'earlier' : 'later'}`
}

/** First day of a 1-52 week index as a day of year. */
export function weekStartDoy(week: number): DayOfYear {
  return (week - 1) * 7 + 1
}

/** Human-readable span for a 1-52 week index, e.g. "Jun 4 – Jun 10". Week 52 runs to Dec 31. */
export function formatWeekRange(week: number): string {
  const start = weekStartDoy(week)
  const end = week >= 52 ? DAYS_IN_YEAR : start + 6
  return `${formatDayOfYear(start)} – ${formatDayOfYear(end)}`
}

/** Week index (1-52) containing the first day of each month, for heatmap axis labels. */
export function monthWeekLabels(): Array<{ week: number; label: string }> {
  const labels: Array<{ week: number; label: string }> = []
  MONTH_START_DOY.forEach((doy, index) => {
    const week = Math.min(Math.floor((doy - 1) / 7) + 1, 52)
    if (labels.length === 0 || labels[labels.length - 1].week !== week) {
      labels.push({ week, label: MONTH_LABELS[index] })
    }
  })
  return labels
}

/**
 * Axis domain and ticks on month starts that cover `[min, max]`, for charts
 * whose value axis is a date.
 */
export function monthAxis(min: number, max: number): { domain: [number, number]; ticks: number[] } {
  const lower = [...MONTH_START_DOY].reverse().find((start) => start <= min) ?? 1
  const upper = MONTH_START_DOY.find((start) => start >= max) ?? DAYS_IN_YEAR
  return {
    domain: [lower, upper],
    ticks: MONTH_START_DOY.filter((start) => start >= lower && start <= upper),
  }
}
