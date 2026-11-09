import type {
  PublicDeckFilters,
  PublicDeckListResult,
  PublicDeckSummary,
} from '../types'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi')
    .trim()
}

export function filterPublicDecks(
  decks: readonly PublicDeckSummary[],
  filters: PublicDeckFilters,
): PublicDeckSummary[] {
  const query = normalizeSearchText(filters.query)

  return decks.filter((deck) => {
    if (deck.visibility !== 'PUBLIC') return false
    if (filters.subject && deck.subject !== filters.subject) return false
    if (filters.topic && deck.topic !== filters.topic) return false
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => deck.tags.includes(tag))
    ) {
      return false
    }

    if (!query) return true

    const searchableText = normalizeSearchText(
      [deck.name, deck.description, deck.authorName, deck.subject, deck.topic, ...deck.tags, ...deck.keywords].join(' '),
    )

    return searchableText.includes(query)
  })
}

export function paginatePublicDecks(
  decks: readonly PublicDeckSummary[],
  page: number,
  pageSize: number,
): PublicDeckListResult {
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const totalCount = decks.length
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages)
  const start = (safePage - 1) * safePageSize
  const items = decks.slice(start, start + safePageSize)

  return {
    items: [...items],
    totalCount,
    page: safePage,
    pageSize: safePageSize,
    hasMore: start + items.length < totalCount,
  }
}

export function getPublicDeckFilterOptions(decks: readonly PublicDeckSummary[]) {
  const publicDecks = decks.filter((deck) => deck.visibility === 'PUBLIC')
  const unique = (values: readonly string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'vi'))

  return {
    subjects: unique(publicDecks.map((deck) => deck.subject)),
    topics: unique(publicDecks.map((deck) => deck.topic)),
    tags: unique(publicDecks.flatMap((deck) => deck.tags)),
  }
}
