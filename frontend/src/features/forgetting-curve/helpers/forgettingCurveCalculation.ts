import type {
  CardReviewLog,
  ForgettingCurveSummaryDto,
  RetentionDataPointDto,
} from '../types'

/** Default stability factor S (in days) used for illustrative Ebbinghaus retention decay. */
export const DEFAULT_STABILITY_FACTOR_DAYS = 14

/**
 * Calculates theoretical retention percentage using Ebbinghaus exponential decay model:
 * R(t) = 100 * exp(-t / S)
 *
 * NOTE: This is an illustrative academic model (Hermann Ebbinghaus, 1885),
 * NOT an FSRS prediction and does NOT replace the backend spaced repetition algorithm.
 */
export function calculateTheoreticalRetention(
  elapsedDays: number,
  stabilityFactorDays: number = DEFAULT_STABILITY_FACTOR_DAYS,
): number {
  if (elapsedDays <= 0) return 100
  const stability = stabilityFactorDays > 0 ? stabilityFactorDays : DEFAULT_STABILITY_FACTOR_DAYS
  const decay = Math.exp(-elapsedDays / stability)
  const rate = Math.round(decay * 1000) / 10
  return Math.min(100, Math.max(0, rate))
}

/**
 * Aggregates raw card review history logs into daily retention points across [0 .. timeRangeDays].
 * For days without reviews, observedRetentionRate is explicitly NULL to prevent drawing fake data.
 */
export function aggregateObservedRetention(
  reviews: CardReviewLog[],
  timeRangeDays: number,
  stabilityFactorDays: number = DEFAULT_STABILITY_FACTOR_DAYS,
): RetentionDataPointDto[] {
  const safeRange = Math.max(1, timeRangeDays)
  const points: RetentionDataPointDto[] = []

  // Group reviews by rounded elapsedDays within range
  const reviewsByDay = new Map<number, { total: number; successful: number }>()

  for (const review of reviews) {
    const day = Math.round(review.elapsedDays)
    if (day >= 0 && day <= safeRange) {
      const current = reviewsByDay.get(day) ?? { total: 0, successful: 0 }
      current.total += 1
      if (review.isRecallSuccessful) {
        current.successful += 1
      }
      reviewsByDay.set(day, current)
    }
  }

  for (let day = 0; day <= safeRange; day += 1) {
    const reviewData = reviewsByDay.get(day)
    const hasData = Boolean(reviewData && reviewData.total > 0)
    const totalReviews = reviewData?.total ?? 0
    const successfulReviews = reviewData?.successful ?? 0
    const observedRetentionRate = hasData
      ? Math.round((successfulReviews / totalReviews) * 1000) / 10
      : null

    points.push({
      elapsedDays: day,
      theoreticalRetentionRate: calculateTheoreticalRetention(day, stabilityFactorDays),
      observedRetentionRate,
      totalReviews,
      successfulReviews,
    })
  }

  return points
}

/**
 * Computes high-level summary statistics across the retention data points.
 */
export function calculateForgettingCurveSummary(
  points: RetentionDataPointDto[],
  timeRangeDays: number,
  stabilityFactorDays: number = DEFAULT_STABILITY_FACTOR_DAYS,
): ForgettingCurveSummaryDto {
  let totalReviewsCount = 0
  let totalSuccessfulReviews = 0
  let observedPointsCount = 0

  for (const point of points) {
    totalReviewsCount += point.totalReviews
    totalSuccessfulReviews += point.successfulReviews
    if (point.observedRetentionRate !== null) {
      observedPointsCount += 1
    }
  }

  const observedAverageRetention = totalReviewsCount > 0
    ? Math.round((totalSuccessfulReviews / totalReviewsCount) * 1000) / 10
    : null

  const theoreticalEndRetention = calculateTheoreticalRetention(timeRangeDays, stabilityFactorDays)

  return {
    timeRangeDays,
    totalReviewsCount,
    observedAverageRetention,
    theoreticalEndRetention,
    stabilityFactorDays,
    observedPointsCount,
  }
}

/**
 * Builds an SVG path string for a continuous line across given coordinates.
 */
export function buildSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  return points.reduce((path, pt, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${path} ${command} ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`
  }, '').trim()
}
