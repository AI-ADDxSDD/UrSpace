import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateObservedRetention,
  buildSvgPath,
  calculateForgettingCurveSummary,
  calculateTheoreticalRetention,
} from '../src/features/forgetting-curve/helpers/forgettingCurveCalculation.ts'

test('calculates Ebbinghaus theoretical retention decay curve correctly', () => {
  // Day 0 must be 100%
  assert.equal(calculateTheoreticalRetention(0, 14), 100)
  assert.equal(calculateTheoreticalRetention(-5, 14), 100)

  // With stability S = 14 days, R(14) = 100 * exp(-1) ≈ 36.8%
  const day14 = calculateTheoreticalRetention(14, 14)
  assert.equal(day14, 36.8)

  // As time increases, retention strictly decreases
  const day7 = calculateTheoreticalRetention(7, 14)
  const day28 = calculateTheoreticalRetention(28, 14)
  assert.ok(day7 > day14)
  assert.ok(day14 > day28)
  assert.ok(day28 >= 0)

  // Higher stability factor slows the rate of forgetting
  const day14HigherStability = calculateTheoreticalRetention(14, 30)
  assert.ok(day14HigherStability > day14)
})

test('aggregates observed retention points from mock review history', () => {
  const mockReviews = [
    { reviewId: 'r1', cardId: 'c1', cardTitle: 'Card 1', reviewedAt: '2026-11-01', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },
    { reviewId: 'r2', cardId: 'c2', cardTitle: 'Card 2', reviewedAt: '2026-11-01', elapsedDays: 1, rating: 'again', isRecallSuccessful: false },
    { reviewId: 'r3', cardId: 'c3', cardTitle: 'Card 3', reviewedAt: '2026-11-01', elapsedDays: 1, rating: 'easy', isRecallSuccessful: true },
    { reviewId: 'r4', cardId: 'c4', cardTitle: 'Card 4', reviewedAt: '2026-11-03', elapsedDays: 3, rating: 'again', isRecallSuccessful: false },
  ]

  const points = aggregateObservedRetention(mockReviews, 7, 14)
  assert.equal(points.length, 8) // Day 0 through Day 7

  // Day 0: No reviews -> observedRetentionRate must be NULL (no fake line)
  assert.equal(points[0].elapsedDays, 0)
  assert.equal(points[0].observedRetentionRate, null)
  assert.equal(points[0].totalReviews, 0)

  // Day 1: 2 successful out of 3 -> 66.7%
  assert.equal(points[1].elapsedDays, 1)
  assert.equal(points[1].observedRetentionRate, 66.7)
  assert.equal(points[1].totalReviews, 3)
  assert.equal(points[1].successfulReviews, 2)

  // Day 2: No reviews -> null
  assert.equal(points[2].observedRetentionRate, null)

  // Day 3: 0 successful out of 1 -> 0%
  assert.equal(points[3].elapsedDays, 3)
  assert.equal(points[3].observedRetentionRate, 0)
  assert.equal(points[3].totalReviews, 1)
  assert.equal(points[3].successfulReviews, 0)

  // Days 4-7: No reviews -> null
  for (let d = 4; d <= 7; d += 1) {
    assert.equal(points[d].observedRetentionRate, null)
  }
})

test('safely handles empty review dataset without division by zero', () => {
  const points = aggregateObservedRetention([], 14, 14)
  assert.equal(points.length, 15)

  // All points should have null observedRetentionRate
  for (const point of points) {
    assert.equal(point.observedRetentionRate, null)
    assert.equal(point.totalReviews, 0)
    assert.equal(point.successfulReviews, 0)
    assert.ok(point.theoreticalRetentionRate >= 0 && point.theoreticalRetentionRate <= 100)
  }

  const summary = calculateForgettingCurveSummary(points, 14, 14)
  assert.equal(summary.totalReviewsCount, 0)
  assert.equal(summary.observedAverageRetention, null)
  assert.equal(summary.observedPointsCount, 0)
  assert.equal(summary.timeRangeDays, 14)
  assert.equal(summary.theoreticalEndRetention, 36.8)
})

test('computes forgetting curve summary statistics correctly', () => {
  const mockReviews = [
    { reviewId: 'r1', cardId: 'c1', cardTitle: 'C1', reviewedAt: '2026-11-01', elapsedDays: 0, rating: 'easy', isRecallSuccessful: true },
    { reviewId: 'r2', cardId: 'c2', cardTitle: 'C2', reviewedAt: '2026-11-02', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },
    { reviewId: 'r3', cardId: 'c3', cardTitle: 'C3', reviewedAt: '2026-11-02', elapsedDays: 1, rating: 'again', isRecallSuccessful: false },
    { reviewId: 'r4', cardId: 'c4', cardTitle: 'C4', reviewedAt: '2026-11-05', elapsedDays: 5, rating: 'good', isRecallSuccessful: true },
  ]

  const points = aggregateObservedRetention(mockReviews, 7, 14)
  const summary = calculateForgettingCurveSummary(points, 7, 14)

  assert.equal(summary.totalReviewsCount, 4)
  // 3 successful out of 4 reviews = 75.0%
  assert.equal(summary.observedAverageRetention, 75.0)
  // Observed points are at Day 0, Day 1, and Day 5
  assert.equal(summary.observedPointsCount, 3)
})

test('generates valid SVG path commands and handles empty coordinates', () => {
  assert.equal(buildSvgPath([]), '')

  const path = buildSvgPath([
    { x: 10, y: 20 },
    { x: 30, y: 40 },
    { x: 50, y: 15 },
  ])
  assert.equal(path, 'M 10.00,20.00 L 30.00,40.00 L 50.00,15.00')
})
