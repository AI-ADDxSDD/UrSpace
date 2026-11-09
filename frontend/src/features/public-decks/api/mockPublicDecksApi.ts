import { filterPublicDecks } from '../helpers/publicDeckFilters.ts'
import { mockPublicDecks } from '../data/mockPublicDecks.ts'
import type {
  PublicDeckDetails,
  PublicDeckFilters,
  PublicDeckForkResult,
  PublicDeckSummary,
} from '../types'

const MOCK_NETWORK_DELAY_MS = 180
let mockForks: PublicDeckSummary[] = []

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))
}

function toSummary(deck: PublicDeckDetails): PublicDeckSummary {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    authorName: deck.authorName,
    subject: deck.subject,
    topic: deck.topic,
    tags: [...deck.tags],
    cardCount: deck.cardCount,
    visibility: deck.visibility,
    updatedAt: deck.updatedAt,
    accent: deck.accent,
    keywords: [...deck.keywords],
  }
}

export async function listPublicDecks(): Promise<PublicDeckSummary[]> {
  await delay()
  return mockPublicDecks
    .filter((deck) => deck.visibility === 'PUBLIC')
    .map(toSummary)
}

export async function searchPublicDecks(
  filters: PublicDeckFilters,
): Promise<PublicDeckSummary[]> {
  const decks = await listPublicDecks()
  return filterPublicDecks(decks, filters)
}

export async function getPublicDeckDetails(deckId: string): Promise<PublicDeckDetails> {
  await delay()
  const deck = mockPublicDecks.find(
    (candidate) => candidate.id === deckId && candidate.visibility === 'PUBLIC',
  )

  if (!deck) throw new Error('Không tìm thấy bộ thẻ công khai này.')
  return { ...deck, tags: [...deck.tags], keywords: [...deck.keywords], flashcards: [...deck.flashcards] }
}

/** Creates an in-memory private copy; this mock never writes to a database. */
export async function forkPublicDeckMock(deckId: string): Promise<PublicDeckForkResult> {
  await delay()
  const sourceDeck = mockPublicDecks.find(
    (candidate) => candidate.id === deckId && candidate.visibility === 'PUBLIC',
  )
  if (!sourceDeck) throw new Error('Chỉ có thể fork bộ thẻ công khai.')

  const existingFork = mockForks.find((deck) => deck.id === `mock-fork-${deckId}`)
  if (existingFork) {
    return { deck: { ...existingFork }, sourceDeckId: deckId, persistence: 'mock-session' }
  }

  const fork: PublicDeckSummary = {
    ...toSummary(sourceDeck),
    id: `mock-fork-${deckId}`,
    name: `${sourceDeck.name} (Bản sao)`,
    authorName: 'Bạn · bản sao thử nghiệm',
    visibility: 'PRIVATE',
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  mockForks = [...mockForks, fork]

  return { deck: { ...fork }, sourceDeckId: deckId, persistence: 'mock-session' }
}

export function getMockForkedDecks(): readonly PublicDeckSummary[] {
  return mockForks.map((deck) => ({ ...deck, tags: [...deck.tags], keywords: [...deck.keywords] }))
}

export function clearMockForkedDecks(): void {
  mockForks = []
}
