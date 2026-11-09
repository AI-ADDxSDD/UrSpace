import { createMockForgettingCurveResponse } from '../data/mockReviewHistory'
import type { ForgettingCurveRange, ForgettingCurveResponseDto } from '../types'

function mockDelay(ms: number = 240): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns mock forgetting curve analytics.
 * In production, this will invoke GET /api/v1/analytics/retention-curve?days={range}.
 */
export async function getMockForgettingCurve(
  range: ForgettingCurveRange,
): Promise<ForgettingCurveResponseDto> {
  await mockDelay()
  return createMockForgettingCurveResponse(range)
}

/**
 * Emulates an empty review state where no card reviews have been logged yet.
 */
export async function getEmptyMockForgettingCurve(
  range: ForgettingCurveRange,
): Promise<ForgettingCurveResponseDto> {
  await mockDelay()
  return createMockForgettingCurveResponse(range, [])
}
