export type DeckVisibility = 'PUBLIC' | 'PRIVATE'

export type DeckAccent = 'violet' | 'blue' | 'mint' | 'amber' | 'rose' | 'indigo'

export type PublicDeckSummary = {
  id: string
  name: string
  description: string
  authorName: string
  subject: string
  topic: string
  tags: string[]
  cardCount: number
  visibility: DeckVisibility
  updatedAt: string
  accent: DeckAccent
  keywords: string[]
}

export type PublicDeckFlashcard = {
  id: string
  front: string
  back: string
}

export type PublicDeckDetails = PublicDeckSummary & {
  flashcards: PublicDeckFlashcard[]
}

export type PublicDeckFilters = {
  query: string
  subject: string
  topic: string
  tags: string[]
}

export type PublicDeckListQuery = {
  page: number
  pageSize: number
  search?: string
  subject?: string
  topic?: string
  tags?: string[]
}

export type PublicDeckListResult = {
  items: PublicDeckSummary[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type PublicDeckForkResult = {
  deck: PublicDeckSummary
  sourceDeckId: string
  persistence: 'mock-session'
}

/** Future ASP.NET API boundary; the Marketplace mock does not make HTTP requests. */
export type PublicDeckMarketplaceApi = {
  listPublicDecks: (query: PublicDeckListQuery) => Promise<PublicDeckListResult>
  getPublicDeckDetails: (deckId: string) => Promise<PublicDeckDetails>
  forkPublicDeck: (sourceDeckId: string) => Promise<PublicDeckForkResult>
}

export type PublicDeckStudyHandler = (
  deck: PublicDeckSummary,
) => void | Promise<void>

export type PublicDeckForkHandler = (
  deck: PublicDeckSummary,
) => void | Promise<void>
