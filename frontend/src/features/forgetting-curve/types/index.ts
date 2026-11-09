export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

/** Mock card review entry representing a learner's historical recall evaluation. */
export type CardReviewLog = {
  reviewId: string
  cardId: string
  cardTitle: string
  reviewedAt: string
  /** Elapsed days since the previous review or first introduction */
  elapsedDays: number
  rating: ReviewRating
  isRecallSuccessful: boolean
}

/** Individual point along the retention timeline (Day t) for chart plotting and backend DTO. */
export type RetentionDataPointDto = {
  /** Day offset along the forgetting curve timeline (t >= 0) */
  elapsedDays: number
  /** Theoretical Ebbinghaus retention rate percentage (0 - 100) */
  theoreticalRetentionRate: number
  /** Observed recall retention percentage (0 - 100), or null if no cards were reviewed at day t */
  observedRetentionRate: number | null
  /** Total reviews recorded on day t */
  totalReviews: number
  /** Number of successful recall reviews (rating 'good' | 'easy') on day t */
  successfulReviews: number
}

/** Summary metrics for the selected forgetting curve time window. */
export type ForgettingCurveSummaryDto = {
  timeRangeDays: number
  totalReviewsCount: number
  /** Mean recall rate across all observed days with reviews; null when 0 reviews exist */
  observedAverageRetention: number | null
  /** Theoretical model retention percentage at the end of the time range */
  theoreticalEndRetention: number
  /** S parameter in Ebbinghaus R = exp(-t/S) model (in days) */
  stabilityFactorDays: number
  /** Total number of day bins with at least 1 actual observed review */
  observedPointsCount: number
}

/**
 * Proposed Backend API Contract for GET /api/v1/analytics/retention-curve?days={range}.
 * Note: DTO prepares frontend for future C# ASP.NET Core Web API integration.
 */
export type ForgettingCurveResponseDto = {
  timeRangeDays: number
  stabilityFactorDays: number
  summary: ForgettingCurveSummaryDto
  points: RetentionDataPointDto[]
  disclaimer: string
}

export type ForgettingCurveRange = 7 | 14 | 30 | 60

export type ForgettingCurveLoader = (
  range: ForgettingCurveRange,
) => Promise<ForgettingCurveResponseDto>
