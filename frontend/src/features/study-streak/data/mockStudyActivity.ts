import {
  calculateStudyStreakStats,
  getAccountDateKey,
  previousCalendarDate,
} from '../helpers/studyStreakCalendar'
import type {
  DailyStudyActivity,
  StudyActivityResponseDto,
  StudyStreakRange,
} from '../types'

export const MOCK_STUDY_TIMEZONE = 'Asia/Ho_Chi_Minh'

function isMockActiveOffset(daysAgo: number): boolean {
  if (daysAgo >= 1 && daysAgo <= 7) return true
  if (daysAgo >= 9 && daysAgo <= 11) return true
  return daysAgo >= 14 && daysAgo % 19 <= 2
}

/** Builds clearly synthetic activity history for the demo; it is not learner account data. */
export function createMockStudyActivityHistory(
  now: Date = new Date(),
  timezone: string = MOCK_STUDY_TIMEZONE,
): { asOfDate: string; dailyActivity: DailyStudyActivity[] } {
  const asOfDate = getAccountDateKey(now, timezone)
  const dailyActivity: DailyStudyActivity[] = []
  let date = previousCalendarDate(asOfDate)

  for (let daysAgo = 1; daysAgo <= 365; daysAgo += 1) {
    if (isMockActiveOffset(daysAgo)) {
      const sessionCount = daysAgo % 11 === 0 ? 3 : daysAgo % 5 === 0 ? 2 : 1
      dailyActivity.push({
        date,
        sessionCount,
        ...(daysAgo % 4 === 0 ? {} : { reviewedCardCount: sessionCount * 4 + daysAgo % 7 }),
      })
    }
    date = previousCalendarDate(date)
  }

  return { asOfDate, dailyActivity }
}

export function createMockStudyStreakResponse(
  days: StudyStreakRange,
  now: Date = new Date(),
): StudyActivityResponseDto {
  const { asOfDate, dailyActivity: history } = createMockStudyActivityHistory(now)
  let startDate = asOfDate
  for (let day = 1; day < days; day += 1) startDate = previousCalendarDate(startDate)
  const dailyActivity = history.filter((activity) => activity.date >= startDate && activity.date <= asOfDate)
  const allHistoryStats = calculateStudyStreakStats(history, asOfDate)
  const selectedRangeStats = calculateStudyStreakStats(dailyActivity, asOfDate)

  return {
    timezone: MOCK_STUDY_TIMEZONE,
    startDate,
    endDate: asOfDate,
    dailyActivity,
    currentStreak: allHistoryStats.currentStreak,
    longestStreak: allHistoryStats.longestStreak,
    totalActiveDays: selectedRangeStats.totalActiveDays,
  }
}
