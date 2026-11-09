import type {
  DailyStudyActivity,
  StudyHeatmapDay,
  StudyHeatmapWeek,
  StudyStreakStats,
} from '../types'

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const weekdayOffsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
const monthShortNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29
  return monthLengths[month - 1] ?? 0
}

export function isValidDateKey(dateKey: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
}

export function nextCalendarDate(dateKey: string): string {
  if (!isValidDateKey(dateKey)) throw new Error(`Invalid calendar date: ${dateKey}`)
  let [year, month, day] = dateKey.split('-').map(Number)
  if (day < daysInMonth(year, month)) day += 1
  else if (month < 12) { month += 1; day = 1 }
  else { year += 1; month = 1; day = 1 }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function previousCalendarDate(dateKey: string): string {
  if (!isValidDateKey(dateKey)) throw new Error(`Invalid calendar date: ${dateKey}`)
  let [year, month, day] = dateKey.split('-').map(Number)
  if (day > 1) day -= 1
  else if (month > 1) { month -= 1; day = daysInMonth(year, month) }
  else { year -= 1; month = 12; day = 31 }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Sunday = 0, Monday = 1, ...; works on date-only strings without Date/timezone conversion. */
export function getWeekdayIndex(dateKey: string): number {
  if (!isValidDateKey(dateKey)) throw new Error(`Invalid calendar date: ${dateKey}`)
  const [originalYear, month, day] = dateKey.split('-').map(Number)
const year = month < 3 ? originalYear - 1 : originalYear
  return (year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + weekdayOffsets[month - 1] + day) % 7
}

function normalizeActivity(
  dailyActivity: readonly DailyStudyActivity[],
  startDate?: string,
  endDate?: string,
): Map<string, DailyStudyActivity> {
  const byDate = new Map<string, DailyStudyActivity>()
  for (const item of dailyActivity) {
    if (!isValidDateKey(item.date) || (startDate && item.date < startDate) || (endDate && item.date > endDate)) continue
    const sessionCount = Number.isFinite(item.sessionCount) ? Math.max(0, Math.floor(item.sessionCount)) : 0
    const reviewedCardCount = item.reviewedCardCount === undefined
      ? undefined
      : Number.isFinite(item.reviewedCardCount) ? Math.max(0, Math.floor(item.reviewedCardCount)) : 0
    const existing = byDate.get(item.date)
    if (!existing) {
      byDate.set(item.date, { date: item.date, sessionCount, ...(reviewedCardCount === undefined ? {} : { reviewedCardCount }) })
      continue
    }

    // Daily DTOs should be unique. For duplicate snapshots keep per-field maxima to avoid inflating activity.
    byDate.set(item.date, {
      date: item.date,
      sessionCount: Math.max(existing.sessionCount, sessionCount),
      ...(existing.reviewedCardCount === undefined && reviewedCardCount === undefined
        ? {}
        : { reviewedCardCount: Math.max(existing.reviewedCardCount ?? 0, reviewedCardCount ?? 0) }),
    })
  }
  return byDate
}

export function calculateStudyStreakStats(
  dailyActivity: readonly DailyStudyActivity[],
  endDate: string,
): StudyStreakStats {
  if (!isValidDateKey(endDate)) throw new Error(`Invalid calendar date: ${endDate}`)
  const byDate = normalizeActivity(dailyActivity, undefined, endDate)
  const activeDates = [...byDate.values()]
    .filter((item) => item.sessionCount > 0)
    .map((item) => item.date)
    .sort()
  const activeDateSet = new Set(activeDates)

  let longestStreak = 0
  let runningStreak = 0
  let previousDate: string | null = null
  for (const date of activeDates) {
    runningStreak = previousDate !== null && nextCalendarDate(previousDate) === date ? runningStreak + 1 : 1
    longestStreak = Math.max(longestStreak, runningStreak)
    previousDate = date
  }

  const currentAnchor = activeDateSet.has(endDate) ? endDate : previousCalendarDate(endDate)
  let currentStreak = 0
  let cursor = currentAnchor
  while (activeDateSet.has(cursor)) {
    currentStreak += 1
    cursor = previousCalendarDate(cursor)
  }

  return { currentStreak, longestStreak, totalActiveDays: activeDates.length }
}

function activityLevel(sessionCount: number): StudyHeatmapDay['activityLevel'] {
  if (sessionCount <= 0) return 0
  if (sessionCount === 1) return 1
  if (sessionCount === 2) return 2
  if (sessionCount <= 4) return 3
  return 4
}

export function buildStudyHeatmapWeeks(
  dailyActivity: readonly DailyStudyActivity[],
  startDate: string,
  endDate: string,
): StudyHeatmapWeek[] {
  if (!isValidDateKey(startDate) || !isValidDateKey(endDate) || startDate > endDate) return []
  const activityByDate = normalizeActivity(dailyActivity, startDate, endDate)
  const cells: Array<StudyHeatmapDay | null> = Array.from({ length: getWeekdayIndex(startDate) }, () => null)
  let date = startDate
  while (date <= endDate) {
    const activity = activityByDate.get(date) ?? { date, sessionCount: 0 }
    cells.push({ ...activity, isActive: activity.sessionCount > 0, activityLevel: activityLevel(activity.sessionCount) })
    date = nextCalendarDate(date)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: StudyHeatmapWeek[] = []
  for (let offset = 0; offset < cells.length; offset += 7) {
    const days = cells.slice(offset, offset + 7)
    const firstOfMonth = days.find((day) => day?.date.slice(-2) === '01')
    const firstVisibleDay = days.find((day): day is StudyHeatmapDay => day !== null)
    const labelDate = firstOfMonth ?? (weeks.length === 0 ? firstVisibleDay : undefined)
    const month = labelDate ? Number(labelDate.date.slice(5, 7)) : 0
    weeks.push({ days, monthLabel: monthShortNames[month - 1] ?? '' })
  }
  return weeks
}

export function getAccountDateKey(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
