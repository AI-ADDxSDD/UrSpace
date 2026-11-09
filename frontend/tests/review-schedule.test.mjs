import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateReviewSchedule, toUtcDateKey } from '../src/features/review-schedule/helpers/aggregateReviewSchedule.ts'

const today = new Date('2026-11-09T00:30:00.000Z')

test('builds complete 7, 14 and 30 day ranges including dates with zero cards', () => {
  const records = [
    { flashcardId: 'overdue-1', dueDate: '2026-11-08' },
    { flashcardId: 'today-1', dueDate: '2026-11-09' },
    { flashcardId: 'today-2', dueDate: '2026-11-09' },
    { flashcardId: 'tomorrow-1', dueDate: '2026-11-10' },
    { flashcardId: 'next-week', dueDate: '2026-11-16' },
    { flashcardId: 'two-weeks', dueDate: '2026-11-22' },
    { flashcardId: 'month-end', dueDate: '2026-12-08' },
  ]

  const sevenDays = aggregateReviewSchedule(records, 7, today)
  const fourteenDays = aggregateReviewSchedule(records, 14, today)
  const thirtyDays = aggregateReviewSchedule(records, 30, today)

  assert.equal(sevenDays.dailyCounts.length, 7)
  assert.equal(fourteenDays.dailyCounts.length, 14)
  assert.equal(thirtyDays.dailyCounts.length, 30)
  assert.equal(sevenDays.dailyCounts[2].dueCount, 0)
  assert.equal(sevenDays.dailyCounts[0].date, '2026-11-09')
  assert.equal(thirtyDays.dailyCounts.at(-1).date, '2026-12-08')
  assert.equal(sevenDays.dailyCounts.reduce((sum, day) => sum + day.dueCount, 0), sevenDays.totalDueInRange)
})

test('counts overdue, due today and future cards separately with exact totals', () => {
  const result = aggregateReviewSchedule([
    { flashcardId: 'late-1', dueDate: '2026-11-07' },
    { flashcardId: 'late-2', dueDate: '2026-11-08' },
    { flashcardId: 'due-now', dueDate: '2026-11-09' },
    { flashcardId: 'later-1', dueDate: '2026-11-10' },
    { flashcardId: 'later-2', dueDate: '2026-11-11' },
    { flashcardId: 'outside-window', dueDate: '2026-11-20' },
  ], 7, today)

  assert.equal(result.overdueCount, 2)
  assert.equal(result.dueTodayCount, 1)
  assert.equal(result.upcomingCount, 2)
  assert.equal(result.totalDueInRange, 3)
})

test('counts repeated card IDs once and resolves conflicting duplicates consistently', () => {
  const result = aggregateReviewSchedule([
    { flashcardId: 'same-card', dueDate: '2026-11-12' },
    { flashcardId: 'same-card', dueDate: '2026-11-09' },
    { flashcardId: 'same-card', dueDate: '2026-11-11' },
    { flashcardId: 'another-card', dueDate: '2026-11-09' },
  ], 7, today)

  assert.equal(result.dueTodayCount, 2)
  assert.equal(result.totalDueInRange, 2)
})

test('normalizes timezone offsets to UTC dates near midnight without local timezone drift', () => {
  const nearUtcMidnight = new Date('2026-11-09T23:30:00.000-07:00')
  const result = aggregateReviewSchedule([
    { flashcardId: 'offset-past', dueDate: '2026-11-10T00:30:00+07:00' },
    { flashcardId: 'utc-today', dueDate: '2026-11-10' },
    { flashcardId: 'offset-future', dueDate: '2026-11-10T23:30:00-08:00' },
    { flashcardId: 'ambiguous-local-time', dueDate: '2026-11-10T09:00:00' },
  ], 7, nearUtcMidnight)

  assert.equal(result.asOfDateUtc, '2026-11-10')
  assert.equal(toUtcDateKey('2026-11-10T00:30:00+07:00'), '2026-11-09')
  assert.equal(result.overdueCount, 1)
  assert.equal(result.dueTodayCount, 1)
  assert.equal(result.upcomingCount, 1)
  assert.equal(result.totalDueInRange, 2)
  assert.equal(toUtcDateKey('2026-11-10T09:00:00'), null)
})

test('returns zeroed daily buckets safely for empty, invalid and out-of-range data', () => {
  const result = aggregateReviewSchedule([
    { flashcardId: 'invalid', dueDate: 'not-a-date' },
    { flashcardId: 'no-zone', dueDate: '2026-11-12T14:00:00' },
    { flashcardId: 'too-late', dueDate: '2027-01-01' },
  ], 7, today)
  const empty = aggregateReviewSchedule([], 14, today)

  assert.equal(result.totalDueInRange, 0)
  assert.equal(result.overdueCount, 0)
  assert.ok(result.dailyCounts.every((day) => day.dueCount === 0))
  assert.equal(empty.dailyCounts.length, 14)
  assert.equal(empty.totalDueInRange, 0)
})
