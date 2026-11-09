export type ReviewScheduleRange = 7 | 14 | 30

/** A card's due date as an ISO timestamp with timezone or a YYYY-MM-DD calendar date. */
export type ReviewDueCard = {
  flashcardId: string
  dueDate: string
}

export type DailyReviewCount = {
  date: string
  dueCount: number
}

/** Proposed backend response contract for an upcoming review schedule. */
export type UpcomingReviewScheduleDto = {
  asOfDateUtc: string
  timezone: 'UTC'
  rangeDays: ReviewScheduleRange
  overdueCount: number
  dueTodayCount: number
  upcomingCount: number
  totalDueInRange: number
  dailyCounts: DailyReviewCount[]
}

export type ReviewScheduleLoader = (
  days: ReviewScheduleRange,
) => Promise<UpcomingReviewScheduleDto>
