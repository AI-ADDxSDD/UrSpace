import { createMockStudyStreakResponse } from '../data/mockStudyActivity'
import type { StudyActivityResponseDto, StudyStreakRange } from '../types'

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 260))
}

/** Returns synthetic demo activity only; no FSRS or database values are created here. */
export async function getMockStudyStreak(
  days: StudyStreakRange,
): Promise<StudyActivityResponseDto> {
  await mockDelay()
  return createMockStudyStreakResponse(days)
}
