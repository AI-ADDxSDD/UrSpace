import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  forkPublicDeckMock,
  getPublicDeckDetails,
  listPublicDecks,
} from '../api/mockPublicDecksApi'
import { filterPublicDecks, getPublicDeckFilterOptions } from '../helpers/publicDeckFilters'
import type {
  PublicDeckDetails,
  PublicDeckForkHandler,
  PublicDeckStudyHandler,
  PublicDeckSummary,
} from '../types'
import './PublicDeckMarketplace.css'
import FlashcardReportModal from '../../card-reports/components/FlashcardReportModal'
import type { ReportableFlashcard } from '../../card-reports/types'

export type PublicDeckMarketplaceProps = {
  loadDecks?: () => Promise<PublicDeckSummary[]>
  loadDeckDetails?: (deckId: string) => Promise<PublicDeckDetails>
  onStudyDeck?: PublicDeckStudyHandler
  onForkDeck?: PublicDeckForkHandler
}

const PAGE_SIZE = 6

function SearchIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.7" /><path d="m13 13 4 4" /></svg>
}

function DeckCardArt({ deck }: { deck: PublicDeckSummary }) {
  return (
    <div className={`deck-card-art art-${deck.accent}`}>
      <div className="deck-art-topline">
        <span>{deck.topic}</span>
        <span className="public-pill"><i /> PUBLIC</span>
      </div>
      <div className="deck-art-stack" aria-hidden="true">
        <span className="stack-card stack-card-back" />
        <span className="stack-card stack-card-middle" />
        <span className="stack-card stack-card-front">
          <span className="stack-card-lines"><i /><i /><i /></span>
          <span className="stack-card-symbol">{deck.subject.slice(0, 1)}</span>
        </span>
      </div>
      <div className="deck-art-count"><strong>{deck.cardCount}</strong><span>thẻ học</span></div>
      <span className="deck-art-orbit orbit-one" />
      <span className="deck-art-orbit orbit-two" />
    </div>
  )
}

function LoadingDeckCard({ index }: { index: number }) {
  return (
    <div className="market-card market-card-skeleton" aria-hidden="true" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="skeleton-art" />
      <div className="skeleton-line skeleton-subject" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-description" />
      <div className="skeleton-line skeleton-description skeleton-short" />
      <div className="skeleton-bottom"><span /><span /></div>
    </div>
  )
}

function PublicDeckMarketplace({
  loadDecks = listPublicDecks,
  loadDeckDetails = getPublicDeckDetails,
  onStudyDeck,
  onForkDeck,
}: PublicDeckMarketplaceProps) {
  const [decks, setDecks] = useState<PublicDeckSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedDeck, setSelectedDeck] = useState<PublicDeckDetails | null>(null)
  const [reportContext, setReportContext] = useState<ReportableFlashcard | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailActionMessage, setDetailActionMessage] = useState('')
  const [globalActionMessage, setGlobalActionMessage] = useState('')
  const [forkingDeckId, setForkingDeckId] = useState<string | null>(null)
  const [forkedDeckIds, setForkedDeckIds] = useState<Set<string>>(() => new Set())
  const forkLock = useRef<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    loadDecks()
      .then((result) => {
        if (isCurrent) setDecks(result.filter((deck) => deck.visibility === 'PUBLIC'))
      })
      .catch(() => {
        if (isCurrent) setLoadError('Không thể tải Marketplace lúc này. Vui lòng thử lại.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [loadDecks, retryKey])

  useEffect(() => {
    if (!isDetailOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reportContext) setIsDetailOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailOpen, reportContext])

  const filters = useMemo(
    () => ({ query: searchQuery, subject: subjectFilter, topic: topicFilter, tags: selectedTags }),
    [searchQuery, subjectFilter, topicFilter, selectedTags],
  )
  const filteredDecks = useMemo(() => filterPublicDecks(decks, filters), [decks, filters])
  const visibleDecks = filteredDecks.slice(0, visibleCount)
  const filterOptions = useMemo(() => getPublicDeckFilterOptions(decks), [decks])
  const hasActiveFilters = Boolean(searchQuery || subjectFilter || topicFilter || selectedTags.length)

  const resetPagination = () => {
    setVisibleCount(PAGE_SIZE)
    setGlobalActionMessage('')
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    resetPagination()
  }

  const handleSubjectChange = (value: string) => {
    setSubjectFilter(value)
    resetPagination()
  }

  const handleTopicChange = (value: string) => {
    setTopicFilter(value)
    resetPagination()
  }

  const handleToggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    )
    resetPagination()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSubjectFilter('')
    setTopicFilter('')
    setSelectedTags([])
    resetPagination()
  }

  const handleRetryLoad = () => {
    setIsLoading(true)
    setLoadError(null)
    setRetryKey((value) => value + 1)
  }

  const handleOpenDetails = useCallback(async (deck: PublicDeckSummary) => {
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    setSelectedDeck(null)
    setDetailError(null)
    setDetailActionMessage('')

    try {
      const details = await loadDeckDetails(deck.id)
      if (details.visibility !== 'PUBLIC') throw new Error('Private deck is not available.')
      setSelectedDeck(details)
    } catch {
      setDetailError('Không thể tải chi tiết bộ thẻ. Hãy đóng cửa sổ và thử lại.')
    } finally {
      setIsDetailLoading(false)
    }
  }, [loadDeckDetails])

  const handleStudyDeck = async (deck: PublicDeckSummary) => {
    try {
      if (onStudyDeck) {
        await onStudyDeck(deck)
        const message = `Đã gửi “${deck.name}” tới trải nghiệm học.`
        if (isDetailOpen) setDetailActionMessage(message)
        else setGlobalActionMessage(message)
      } else {
        const message = `Đã chọn “${deck.name}” để học thử. Chưa kết nối với phiên học UC-05.2.`
        if (isDetailOpen) setDetailActionMessage(message)
        else setGlobalActionMessage(message)
      }
    } catch {
      const message = 'Không thể mở phiên học cho bộ thẻ này. Vui lòng thử lại.'
      if (isDetailOpen) setDetailActionMessage(message)
      else setGlobalActionMessage(message)
    }
  }

  const handleForkDeck = async (deck: PublicDeckSummary) => {
    if (forkLock.current === deck.id || forkedDeckIds.has(deck.id)) return

    forkLock.current = deck.id
    setForkingDeckId(deck.id)
    setDetailActionMessage('')

    try {
      if (onForkDeck) {
        await onForkDeck(deck)
        setForkedDeckIds((current) => new Set([...current, deck.id]))
        setDetailActionMessage('Callback tích hợp đã nhận yêu cầu fork. Trạng thái lưu cần do backend xác nhận.')
      } else {
        await forkPublicDeckMock(deck.id)
        setForkedDeckIds((current) => new Set([...current, deck.id]))
        setDetailActionMessage('Đã tạo bản sao trong mock session. Bản fork chưa được lưu vào database.')
      }
    } catch {
      setDetailActionMessage('Không thể fork bộ thẻ này. Bản gốc không bị thay đổi.')
    } finally {
      forkLock.current = null
      setForkingDeckId(null)
    }
  }

  const handleCloseDetails = () => {
    setIsDetailOpen(false)
    setSelectedDeck(null)
    setDetailError(null)
  }

  return (
    <main className="public-marketplace">
      <header className="marketplace-topbar">
        <div className="marketplace-brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>urspace</span>
        </div>
        <span className="marketplace-topbar-divider" />
        <span className="marketplace-context">Khám phá tri thức cộng đồng</span>
        <span className="marketplace-public-note"><i /> Bộ thẻ công khai</span>
      </header>

      <section className="marketplace-hero">
        <div className="marketplace-hero-inner">
          <div className="hero-copy">
            <p className="marketplace-eyebrow"><span /> THƯ VIỆN CỘNG ĐỒNG</p>
            <h1>Khám phá bộ thẻ<br /><span>đáng để ghi nhớ.</span></h1>
            <p className="marketplace-subtitle">Tìm cảm hứng học tập từ những bộ thẻ được chia sẻ bởi cộng đồng UrSpace.</p>
            <div className="hero-proof-points">
              <span><i>✓</i> Chỉ bộ thẻ Public</span>
              <span><i>✓</i> Xem trước miễn phí</span>
            </div>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <span className="hero-glow" />
            <span className="hero-orbit hero-orbit-a" />
            <span className="hero-orbit hero-orbit-b" />
            <div className="hero-floating-card hero-card-back"><i /><i /><i /></div>
            <div className="hero-floating-card hero-card-front">
              <span className="hero-card-badge">UR</span>
              <strong>Học điều<br />bạn tò mò.</strong>
              <span className="hero-card-lines"><i /><i /></span>
            </div>
            <span className="hero-sparkle sparkle-a">✦</span>
            <span className="hero-sparkle sparkle-b">✧</span>
          </div>
        </div>
      </section>

      <div className="marketplace-content">
        <section className="marketplace-search-panel" aria-label="Tìm và lọc bộ thẻ">
          <label className="marketplace-searchbox" htmlFor="market-search">
            <SearchIcon />
            <input
              id="market-search"
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm bộ thẻ, môn học hoặc từ khóa..."
            />
            <kbd>/</kbd>
          </label>
          <div className="marketplace-select-filters">
            <label htmlFor="market-subject">
              <span>Môn học</span>
              <select id="market-subject" value={subjectFilter} onChange={(event) => handleSubjectChange(event.target.value)}>
                <option value="">Tất cả môn học</option>
                {filterOptions.subjects.map((subject) => <option value={subject} key={subject}>{subject}</option>)}
              </select>
            </label>
            <label htmlFor="market-topic">
              <span>Chủ đề</span>
              <select id="market-topic" value={topicFilter} onChange={(event) => handleTopicChange(event.target.value)}>
                <option value="">Tất cả chủ đề</option>
                {filterOptions.topics.map((topic) => <option value={topic} key={topic}>{topic}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="marketplace-tags" aria-label="Lọc theo tags">
          <span className="tag-filter-label">Tags phổ biến</span>
          <div className="tag-filter-list">
            {filterOptions.tags.slice(0, 14).map((tag) => (
              <button
                className={`tag-filter-chip${selectedTags.includes(tag) ? ' tag-filter-selected' : ''}`}
                type="button"
                key={tag}
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {hasActiveFilters && <button className="clear-filter-button" onClick={handleClearFilters} type="button">Xóa bộ lọc</button>}
        </section>

        <section className="marketplace-results" aria-labelledby="marketplace-results-title">
          <div className="results-heading">
            <div>
              <p className="results-overline">BỘ THẺ DÀNH CHO BẠN</p>
              <h2 id="marketplace-results-title">Khám phá Marketplace <span>{isLoading ? '…' : filteredDecks.length}</span></h2>
            </div>
            {!isLoading && !loadError && <span className="results-order">Mới cập nhật <span>⌄</span></span>}
          </div>

          {loadError ? (
            <div className="marketplace-state state-error" role="alert">
              <span className="state-icon">!</span>
              <h3>Chưa tải được bộ thẻ</h3>
              <p>{loadError}</p>
              <button type="button" onClick={handleRetryLoad}>Thử tải lại</button>
            </div>
          ) : isLoading ? (
            <div className="deck-grid" aria-label="Đang tải bộ thẻ" aria-busy="true">
              {Array.from({ length: PAGE_SIZE }, (_, index) => <LoadingDeckCard key={index} index={index} />)}
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="marketplace-state state-empty">
              <span className="state-icon"><SearchIcon /></span>
              <h3>Chưa tìm thấy bộ thẻ phù hợp</h3>
              <p>Thử từ khóa khác hoặc xóa một vài bộ lọc để xem thêm lựa chọn.</p>
              <button type="button" onClick={handleClearFilters}>Xóa bộ lọc</button>
            </div>
          ) : (
            <>
              <div className="deck-grid" aria-live="polite">
                {visibleDecks.map((deck) => (
                  <article className="market-card" key={deck.id}>
                    <button className="deck-art-button" onClick={() => void handleOpenDetails(deck)} type="button" aria-label={`Xem chi tiết bộ thẻ ${deck.name}`}>
                      <DeckCardArt deck={deck} />
                    </button>
                    <div className="deck-card-content">
                      <div className="deck-card-subject"><span className={`subject-dot dot-${deck.accent}`} />{deck.subject}<span>·</span>{deck.topic}</div>
                      <h3>{deck.name}</h3>
                      <p className="market-deck-description">{deck.description}</p>
                      <div className="deck-card-author-row">
                        <span className={`author-avatar avatar-${deck.accent}`} aria-hidden="true">{deck.authorName.split(' ').map((part) => part[0]).slice(-2).join('')}</span>
                        <span className="author-name">{deck.authorName}</span>
                        <span className="deck-card-count">{deck.cardCount} flashcard</span>
                      </div>
                      <div className="deck-card-tags">
                        {deck.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                        {deck.tags.length > 2 && <span>+{deck.tags.length - 2}</span>}
                      </div>
                      <div className="deck-card-actions">
                        <button className="deck-view-button" onClick={() => void handleOpenDetails(deck)} type="button">Xem chi tiết</button>
                        <button className="deck-study-button" onClick={() => void handleStudyDeck(deck)} type="button" aria-label={`Chọn học bộ thẻ ${deck.name}`}>
                          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m6.5 4.5 7 4.5-7 4.5z" /></svg>
                          Học bộ thẻ
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {visibleCount < filteredDecks.length && (
                <div className="load-more-wrap">
                  <span>Đang hiển thị {visibleDecks.length} / {filteredDecks.length} bộ thẻ</span>
                  <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                    Tải thêm bộ thẻ
                    <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4 7 5 5 5-5" /></svg>
                  </button>
                </div>
              )}
            </>
          )}

          {globalActionMessage && <p className="marketplace-action-status" role="status">{globalActionMessage}</p>}
        </section>

        <footer className="marketplace-footer">
          <span>UrSpace Marketplace</span>
          <span>Chia sẻ tri thức, học cùng nhau.</span>
          <span className="marketplace-footer-spacer" />
          <span>Chỉ hiển thị bộ thẻ Public</span>
        </footer>
      </div>

      {isDetailOpen && (
        <div className="deck-detail-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) handleCloseDetails() }}>
          <section className="deck-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="deck-detail-title">
            <button className="detail-close-button" type="button" onClick={handleCloseDetails} aria-label="Đóng chi tiết bộ thẻ">×</button>
            {isDetailLoading ? (
              <div className="detail-state" role="status"><span className="detail-spinner" />Đang tải chi tiết bộ thẻ…</div>
            ) : detailError ? (
              <div className="detail-state detail-error" role="alert">
                <h2>Không thể mở bộ thẻ</h2>
                <p>{detailError}</p>
              </div>
            ) : selectedDeck ? (
              <>
                <div className={`detail-cover art-${selectedDeck.accent}`}>
                  <span className="public-pill"><i /> PUBLIC</span>
                  <span className="detail-cover-topic">{selectedDeck.topic}</span>
                  <span className="detail-cover-number">{selectedDeck.cardCount}<small> thẻ</small></span>
                </div>
                <div className="detail-body">
                  <div className="detail-subject-line">{selectedDeck.subject}<span>·</span>{selectedDeck.topic}</div>
                  <h2 id="deck-detail-title">{selectedDeck.name}</h2>
                  <p className="detail-description">{selectedDeck.description}</p>
                  <div className="detail-author"><span className={`author-avatar avatar-${selectedDeck.accent}`}>{selectedDeck.authorName.split(' ').map((part) => part[0]).slice(-2).join('')}</span><span>Được chia sẻ bởi <strong>{selectedDeck.authorName}</strong></span><span className="detail-updated">Cập nhật {new Date(selectedDeck.updatedAt).toLocaleDateString('vi-VN')}</span></div>
                  <div className="detail-tags">{selectedDeck.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="detail-preview-heading"><div><h3>Xem trước flashcard</h3><p>{selectedDeck.flashcards.length} thẻ mẫu trong tổng số {selectedDeck.cardCount}</p></div><span>Chỉ xem</span></div>
                  <div className="flashcard-preview-list">
                    {selectedDeck.flashcards.map((card, index) => (
                      <article className="flashcard-preview" key={card.id}>
                        <span className="preview-card-index">{String(index + 1).padStart(2, '0')}</span>
                        <div><span>MẶT TRƯỚC</span><p>{card.front}</p></div>
                        <div><span>MẶT SAU</span><p>{card.back}</p></div>
                        <button
                          className="preview-report-button"
                          type="button"
                          onClick={() => setReportContext({ flashcardId: card.id, deckId: selectedDeck.id, front: card.front, back: card.back })}
                        >
                          Báo cáo nội dung
                        </button>
                      </article>
                    ))}
                  </div>
                  <div className="fork-rule-note">Bạn có thể học bộ thẻ Public. Muốn chỉnh sửa nội dung, hãy Fork một bản riêng; bộ gốc của tác giả không bị thay đổi.</div>
                  {detailActionMessage && <p className="detail-action-status" role="status">{detailActionMessage}</p>}
                  <div className="detail-actions">
                    <button className="detail-fork-button" type="button" disabled={forkingDeckId === selectedDeck.id || forkedDeckIds.has(selectedDeck.id)} onClick={() => void handleForkDeck(selectedDeck)}>
                      {forkingDeckId === selectedDeck.id ? 'Đang fork…' : forkedDeckIds.has(selectedDeck.id) ? 'Đã fork' : 'Fork về thư viện'}
                    </button>
                    <button className="detail-study-button" type="button" onClick={() => void handleStudyDeck(selectedDeck)}>
                      <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m6.5 4.5 7 4.5-7 4.5z" /></svg>
                      Chọn học bộ thẻ
                    </button>
                  </div>
                  <p className="detail-mock-note">Marketplace demo · Nội dung chỉ đọc, không thể sửa trực tiếp</p>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
      {reportContext && (
        <FlashcardReportModal
          flashcard={reportContext}
          onClose={() => setReportContext(null)}
        />
      )}
    </main>
  )
}

export default PublicDeckMarketplace
