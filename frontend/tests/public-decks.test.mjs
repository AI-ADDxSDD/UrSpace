import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearMockForkedDecks,
  forkPublicDeckMock,
  getMockForkedDecks,
  getPublicDeckDetails,
  listPublicDecks,
} from '../src/features/public-decks/api/mockPublicDecksApi.ts'
import {
  filterPublicDecks,
  getPublicDeckFilterOptions,
  paginatePublicDecks,
} from '../src/features/public-decks/helpers/publicDeckFilters.ts'

const summary = (overrides = {}) => ({
  id: 'public-1',
  name: 'Tâm lý học cơ bản',
  description: 'Nhập môn trí nhớ và học tập.',
  authorName: 'Linh Nguyễn',
  subject: 'Tâm lý học',
  topic: 'Khoa học nhận thức',
  tags: ['Trí nhớ', 'Đại học'],
  cardCount: 20,
  visibility: 'PUBLIC',
  updatedAt: '2026-10-01',
  accent: 'violet',
  keywords: ['active recall', 'cognitive science'],
  ...overrides,
})

const noFilters = { query: '', subject: '', topic: '', tags: [] }

test('searches deck titles, descriptions and keywords without Vietnamese diacritics', () => {
  const decks = [summary(), summary({
    id: 'public-2',
    name: 'Giải tích',
    description: 'Giới hạn và đạo hàm.',
    subject: 'Toán học',
    topic: 'Giải tích',
    tags: ['STEM'],
    keywords: ['calculus'],
  })]

  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, query: 'tam ly hoc' }).map((deck) => deck.id), ['public-1'])
  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, query: 'active recall' }).map((deck) => deck.id), ['public-1'])
  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, query: 'trí nhớ' }).map((deck) => deck.id), ['public-1'])
})

test('filters by subject, topic and any selected tag while excluding private decks', () => {
  const decks = [
    summary(),
    summary({ id: 'public-2', subject: 'Toán học', topic: 'Giải tích', tags: ['STEM'] }),
    summary({ id: 'private-1', visibility: 'PRIVATE' }),
  ]

  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, subject: 'Tâm lý học' }).map((deck) => deck.id), ['public-1'])
  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, topic: 'Giải tích' }).map((deck) => deck.id), ['public-2'])
  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, tags: ['STEM', 'Đại học'] }).map((deck) => deck.id), ['public-1', 'public-2'])
  assert.deepEqual(filterPublicDecks(decks, noFilters).map((deck) => deck.id), ['public-1', 'public-2'])
})

test('returns no results for unmatched queries and exposes only public filter options', () => {
  const decks = [summary(), summary({ id: 'private-1', visibility: 'PRIVATE', subject: 'Riêng tư', tags: ['bí mật'] })]

  assert.deepEqual(filterPublicDecks(decks, { ...noFilters, query: 'không tồn tại' }), [])
  assert.deepEqual(getPublicDeckFilterOptions(decks), {
    subjects: ['Tâm lý học'],
    topics: ['Khoa học nhận thức'],
    tags: ['Đại học', 'Trí nhớ'],
  })
})

test('paginates long result lists and reports whether more decks remain', () => {
  const decks = Array.from({ length: 8 }, (_, index) => summary({ id: `deck-${index}` }))
  const firstPage = paginatePublicDecks(decks, 1, 6)
  const lastPage = paginatePublicDecks(decks, 2, 6)

  assert.equal(firstPage.items.length, 6)
  assert.equal(firstPage.totalCount, 8)
  assert.equal(firstPage.hasMore, true)
  assert.equal(lastPage.items.length, 2)
  assert.equal(lastPage.hasMore, false)
})

test('mock API lists only public decks and blocks private detail or fork requests', async () => {
  const decks = await listPublicDecks()

  assert.ok(decks.length >= 10)
  assert.ok(decks.every((deck) => deck.visibility === 'PUBLIC'))
  await assert.rejects(getPublicDeckDetails('deck-private-demo-013'))
  await assert.rejects(forkPublicDeckMock('deck-private-demo-013'))
})

test('fork creates a private in-memory copy and does not mutate the public original', async () => {
  clearMockForkedDecks()
  const original = await getPublicDeckDetails('deck-biology-002')
  const result = await forkPublicDeckMock(original.id)
  const storedForks = getMockForkedDecks()

  assert.equal(result.sourceDeckId, original.id)
  assert.equal(result.persistence, 'mock-session')
  assert.equal(result.deck.visibility, 'PRIVATE')
  assert.equal(result.deck.authorName, 'Bạn · bản sao thử nghiệm')
  assert.equal(storedForks.length, 1)
  assert.equal((await getPublicDeckDetails(original.id)).visibility, 'PUBLIC')
  clearMockForkedDecks()
})
