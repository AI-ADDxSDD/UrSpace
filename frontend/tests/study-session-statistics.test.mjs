import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateStudySessionResult, formatStudyDuration } from '../src/features/study-session/helpers/sessionStats.ts'

const cards = Array.from({ length: 5 }, (_, index) => ({
  id: `card-${index + 1}`,
  deckName: 'Test deck',
  subject: 'TEST',
  prompt: 'Question',
  answer: 'Answer',
}))

const reviewsFor = (ratings) =>
  ratings.map((rating, index) => ({ cardId: cards[index].id, rating }))

test('calculates mixed ratings and rates for five reviewed cards', () => {
  const result = calculateStudySessionResult(
    cards,
    reviewsFor(['again', 'hard', 'good', 'good', 'easy']),
    125.8,
  )

  assert.deepEqual(result.ratingCounts, { again: 1, hard: 1, good: 2, easy: 1 })
  assert.equal(result.reviewedCards, 5)
  assert.equal(result.completionPercent, 100)
  assert.equal(result.estimatedRecallPercent, 60)
  assert.equal(result.durationSeconds, 125)
  assert.equal(result.status, 'mixed')
})

test('recognizes a complete session rated Again for every card', () => {
  const result = calculateStudySessionResult(cards, reviewsFor(Array(5).fill('again')), 30)

  assert.equal(result.ratingCounts.again, 5)
  assert.equal(result.estimatedRecallPercent, 0)
  assert.equal(result.status, 'all-again')
})

test('recognizes a complete session rated Good or Easy for every card', () => {
  const result = calculateStudySessionResult(
    cards,
    reviewsFor(['good', 'easy', 'good', 'easy', 'good']),
    30,
  )

  assert.equal(result.estimatedRecallPercent, 100)
  assert.equal(result.status, 'all-remembered')
})

test('handles empty decks and unreviewed cards without division by zero', () => {
  const empty = calculateStudySessionResult([], [], 0)
  const notRated = calculateStudySessionResult(cards, [], 0)

  assert.equal(empty.status, 'empty')
  assert.equal(empty.completionPercent, 0)
  assert.equal(empty.estimatedRecallPercent, 0)
  assert.equal(notRated.status, 'not-rated')
  assert.equal(notRated.completionPercent, 0)
  assert.equal(notRated.estimatedRecallPercent, 0)
})

test('counts each valid card once and ignores reviews for unknown cards', () => {
  const result = calculateStudySessionResult(
    cards,
    [
      { cardId: 'card-1', rating: 'again' },
      { cardId: 'card-1', rating: 'easy' },
      { cardId: 'unknown-card', rating: 'good' },
    ],
    -5,
  )

  assert.equal(result.reviewedCards, 1)
  assert.equal(result.ratingCounts.again, 1)
  assert.equal(result.ratingCounts.easy, 0)
  assert.equal(result.durationSeconds, 0)
})

test('formats duration as minutes and zero-padded seconds', () => {
  assert.equal(formatStudyDuration(125), '2 phút 05 giây')
  assert.equal(formatStudyDuration(0), '0 phút 00 giây')
  assert.equal(formatStudyDuration(Number.NaN), '0 phút 00 giây')
})
