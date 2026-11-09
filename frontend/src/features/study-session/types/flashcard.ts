export type Flashcard = {
  id: string
  deckName: string
  subject: string
  prompt: string
  answer: string
  hint?: string
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type RatingOption = {
  value: Rating
  label: string
  description: string
  shortcut: '1' | '2' | '3' | '4'
}

export type CardReview = {
  cardId: string
  rating: Rating
}

export type StudySessionResultStatus =
  | 'empty'
  | 'not-rated'
  | 'all-again'
  | 'all-remembered'
  | 'mixed'

export type StudySessionResultData = {
  totalCards: number
  reviewedCards: number
  ratingCounts: Record<Rating, number>
  durationSeconds: number
  completionPercent: number
  estimatedRecallPercent: number
  status: StudySessionResultStatus
}
