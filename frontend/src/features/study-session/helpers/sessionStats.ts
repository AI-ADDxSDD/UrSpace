import type {
  CardReview,
  Flashcard,
  Rating,
  StudySessionResultData,
} from '../types/flashcard'

const createEmptyRatingCounts = (): Record<Rating, number> => ({
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
})

export function calculateStudySessionResult(
  cards: readonly Flashcard[],
  reviews: readonly CardReview[],
  durationSeconds: number,
): StudySessionResultData {
  const ratingCounts = createEmptyRatingCounts()
  const validCardIds = new Set(cards.map((card) => card.id))
  const reviewedCardIds = new Set<string>()

  for (const review of reviews) {
    if (!validCardIds.has(review.cardId) || reviewedCardIds.has(review.cardId)) {
      continue
    }

    reviewedCardIds.add(review.cardId)
    ratingCounts[review.rating] += 1
  }

  const totalCards = cards.length
  const reviewedCards = reviewedCardIds.size
  const recalledCards = ratingCounts.good + ratingCounts.easy
  const completionPercent = totalCards
    ? Math.round((reviewedCards / totalCards) * 100)
    : 0
  const estimatedRecallPercent = reviewedCards
    ? Math.round((recalledCards / reviewedCards) * 100)
    : 0

  let status: StudySessionResultData['status']
  if (totalCards === 0) {
    status = 'empty'
  } else if (reviewedCards === 0) {
    status = 'not-rated'
  } else if (reviewedCards === totalCards && ratingCounts.again === totalCards) {
    status = 'all-again'
  } else if (
    reviewedCards === totalCards &&
    recalledCards === totalCards
  ) {
    status = 'all-remembered'
  } else {
    status = 'mixed'
  }

  return {
    totalCards,
    reviewedCards,
    ratingCounts,
    durationSeconds: Number.isFinite(durationSeconds)
      ? Math.max(0, Math.floor(durationSeconds))
      : 0,
    completionPercent,
    estimatedRecallPercent,
    status,
  }
}

export function formatStudyDuration(durationSeconds: number): string {
  const safeSeconds = Number.isFinite(durationSeconds)
    ? Math.max(0, Math.floor(durationSeconds))
    : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${minutes} phút ${seconds.toString().padStart(2, '0')} giây`
}
