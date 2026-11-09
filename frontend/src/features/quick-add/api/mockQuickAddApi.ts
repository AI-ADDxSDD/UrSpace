import type {
  QuickAddFlashcardInput,
  QuickAddSaveRequest,
  QuickAddSaveResponse,
} from '../types'

let mockSessionCards: QuickAddFlashcardInput[] = []

/** Simulates a save for this browser session. No request is sent to a server. */
export async function saveQuickAddFlashcards(
  request: QuickAddSaveRequest,
): Promise<QuickAddSaveResponse> {
  const savedCards = request.cards.map((card) => ({
    front: card.front.trim(),
    back: card.back.trim(),
  }))

  mockSessionCards = [...mockSessionCards, ...savedCards]

  return {
    savedCount: savedCards.length,
    totalInMockSession: mockSessionCards.length,
    storage: 'mock-session',
  }
}

export function getMockSessionFlashcards(): readonly QuickAddFlashcardInput[] {
  return mockSessionCards.map((card) => ({ ...card }))
}

export function clearMockSessionFlashcards(): void {
  mockSessionCards = []
}
