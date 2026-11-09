import { createMockKnowledgeMasteryResponse } from '../data/mockKnowledgeMastery'
import type { ConceptMasteryResponseDto } from '../types'

function mockDelay(ms: number = 240): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns mock concept mastery status.
 * In production, this will invoke GET /api/v1/concepts/mastery.
 */
export async function getMockKnowledgeMastery(): Promise<ConceptMasteryResponseDto> {
  await mockDelay()
  return createMockKnowledgeMasteryResponse()
}

/**
 * Returns an empty concept node dataset for testing empty states.
 */
export async function getEmptyMockKnowledgeMastery(): Promise<ConceptMasteryResponseDto> {
  await mockDelay()
  return createMockKnowledgeMasteryResponse([])
}
