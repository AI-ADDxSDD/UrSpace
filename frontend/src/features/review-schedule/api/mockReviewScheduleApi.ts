import { aggregateReviewSchedule } from '../helpers/aggregateReviewSchedule'
import { createMockReviewDueCards } from '../data/mockReviewDueCards'
import type { ReviewScheduleRange, UpcomingReviewScheduleDto } from '../types'

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 260))
}

/** Returns labeled synthetic demo data; no user data or FSRS calculation is involved. */
export async function getMockUpcomingReviewSchedule(
  days: ReviewScheduleRange,
  now: Date = new Date(),
): Promise<UpcomingReviewScheduleDto> {
  await mockDelay()
  return aggregateReviewSchedule(createMockReviewDueCards(now), days, now)
}
