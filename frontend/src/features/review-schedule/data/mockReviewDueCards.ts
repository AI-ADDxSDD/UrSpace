import { addUtcDays } from '../helpers/aggregateReviewSchedule'
import type { ReviewDueCard } from '../types'

/** Synthetic data for the demo only; it is not associated with a signed-in learner. */
export function createMockReviewDueCards(now: Date = new Date()): ReviewDueCard[] {
  const today = now.toISOString().slice(0, 10)
  const rows: ReviewDueCard[] = []
  const buckets: Array<[offset: number, count: number]> = [
    [-3, 2], [-1, 1], [0, 3], [1, 4], [3, 2], [6, 1],
    [9, 5], [13, 2], [20, 6], [29, 3],
  ]

  for (const [offset, count] of buckets) {
    for (let index = 0; index < count; index += 1) {
      rows.push({
        flashcardId: `mock-schedule-card-${offset}-${index + 1}`,
        dueDate: addUtcDays(today, offset),
      })
    }
  }

  const duplicate = rows.find((row) => row.dueDate === addUtcDays(today, 1))
  if (duplicate) rows.push({ ...duplicate })

  return rows
}
