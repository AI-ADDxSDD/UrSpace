import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildStudyHeatmapWeeks,
  calculateStudyStreakStats,
  getAccountDateKey,
  getWeekdayIndex,
  isLeapYear,
  isValidDateKey,
  nextCalendarDate,
  previousCalendarDate,
} from '../src/features/study-streak/helpers/studyStreakCalendar.ts'

function previousDays(endDate, count) {
  const dates = []
  let date = endDate
  for (let index = 0; index < count; index += 1) {
    dates.push(date)
    date = previousCalendarDate(date)
  }
  return dates.reverse()
}

test('calculates a seven day active streak and unique active-day count', () => {
  const activities = previousDays('2026-05-20', 7).map((date) => ({ date, sessionCount: 1 }))
  assert.deepEqual(calculateStudyStreakStats(activities, '2026-05-20'), {
    currentStreak: 7,
    longestStreak: 7,
    totalActiveDays: 7,
  })
})

test('keeps the current streak when today is not complete but yesterday was active', () => {
  const activities = previousDays('2026-08-11', 7).map((date) => ({ date, sessionCount: 2 }))
  assert.deepEqual(calculateStudyStreakStats(activities, '2026-08-12'), {
    currentStreak: 7,
    longestStreak: 7,
    totalActiveDays: 7,
  })
})

test('breaks current streak after a missed day while retaining longest historical streak', () => {
  const activities = [
    ...previousDays('2026-09-04', 4).map((date) => ({ date, sessionCount: 1 })),
    { date: '2026-09-06', sessionCount: 1 },
    { date: '2026-09-07', sessionCount: 1 },
  ]
  assert.deepEqual(calculateStudyStreakStats(activities, '2026-09-07'), {
    currentStreak: 2,
    longestStreak: 4,
    totalActiveDays: 6,
  })
})

test('returns zero streaks for no active days and counts multiple sessions on a day once', () => {
  assert.deepEqual(calculateStudyStreakStats([], '2026-10-02'), {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
  })
  assert.deepEqual(calculateStudyStreakStats([
    { date: '2026-10-01', sessionCount: 5, reviewedCardCount: 18 },
    { date: '2026-10-02', sessionCount: 0 },
  ], '2026-10-02'), {
    currentStreak: 1,
    longestStreak: 1,
    totalActiveDays: 1,
  })
})

test('deduplicates repeated date rows without inflating daily session/card totals', () => {
  const weeks = buildStudyHeatmapWeeks([
    { date: '2026-10-05', sessionCount: 2, reviewedCardCount: 8 },
    { date: '2026-10-05', sessionCount: 2, reviewedCardCount: 8 },
    { date: '2026-10-05', sessionCount: 1, reviewedCardCount: 4 },
  ], '2026-10-04', '2026-10-10')
  const day = weeks.flatMap((week) => week.days).find((item) => item?.date === '2026-10-05')

  assert.deepEqual({ sessionCount: day.sessionCount, reviewedCardCount: day.reviewedCardCount, activityLevel: day.activityLevel }, {
    sessionCount: 2,
    reviewedCardCount: 8,
    activityLevel: 2,
  })
  assert.equal(weeks.flatMap((week) => week.days).filter((item) => item?.date === '2026-10-05').length, 1)
})

test('keeps consecutive dates across year boundary and validates leap days', () => {
  assert.equal(nextCalendarDate('2025-12-31'), '2026-01-01')
  assert.equal(previousCalendarDate('2026-01-01'), '2025-12-31')
  assert.deepEqual(calculateStudyStreakStats([
    { date: '2025-12-31', sessionCount: 1 },
    { date: '2026-01-01', sessionCount: 1 },
  ], '2026-01-01'), { currentStreak: 2, longestStreak: 2, totalActiveDays: 2 })
  assert.equal(isLeapYear(2000), true)
  assert.equal(isLeapYear(1900), false)
  assert.equal(isLeapYear(2024), true)
  assert.equal(isValidDateKey('2024-02-29'), true)
  assert.equal(isValidDateKey('2025-02-29'), false)
  assert.equal(nextCalendarDate('2024-02-28'), '2024-02-29')
  assert.equal(nextCalendarDate('2024-02-29'), '2024-03-01')
})

test('builds 90 and 365 day heatmaps with calendar month labels and weekday alignment', () => {
  const endDate = '2025-12-31'
  const start90 = previousDays(endDate, 90)[0]
  const start365 = previousDays(endDate, 365)[0]
  const ninetyDays = buildStudyHeatmapWeeks([], start90, endDate)
  const year = buildStudyHeatmapWeeks([], start365, endDate)

  assert.equal(ninetyDays.flatMap((week) => week.days).filter(Boolean).length, 90)
  assert.equal(year.flatMap((week) => week.days).filter(Boolean).length, 365)
  assert.ok(ninetyDays.length >= 13)
  assert.ok(year.length >= 53)
  assert.ok(year.some((week) => week.monthLabel === 'T1'))
  assert.equal(getWeekdayIndex('2023-01-01'), 0)
  assert.equal(getWeekdayIndex('2024-02-29'), 4)
})

test('uses the account timezone to obtain today while retaining backend date-only values', () => {
  const instant = new Date('2026-11-09T17:30:00.000Z')
  assert.equal(getAccountDateKey(instant, 'Asia/Ho_Chi_Minh'), '2026-11-10')
  assert.equal(getAccountDateKey(instant, 'America/Los_Angeles'), '2026-11-09')
})
