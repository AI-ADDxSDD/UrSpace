import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK_STUDY_DECK_ID, mockFlashcards, ratingOptions } from '../data/mockFlashcards'
import { calculateStudySessionResult } from '../helpers/sessionStats'
import type { CardReview, Flashcard, Rating } from '../types/flashcard'
import FlashcardReportModal from '../../card-reports/components/FlashcardReportModal'
import type { ReportableFlashcard } from '../../card-reports/types'
import StudySessionResult from './StudySessionResult'

export type StudySessionProps = {
  onReturnToDeck?: () => void
}

const ratingLabels: Record<Rating, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
}

function StudySession({ onReturnToDeck }: StudySessionProps) {
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviews, setReviews] = useState<CardReview[]>([])
  const [lastRating, setLastRating] = useState<Rating | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now())
  const [sessionCompletedAt, setSessionCompletedAt] = useState<number | null>(null)
  const [returnMessage, setReturnMessage] = useState('')
  const [reportContext, setReportContext] = useState<ReportableFlashcard | null>(null)
  const isComplete = cardIndex >= mockFlashcards.length
  const currentCard: Flashcard | undefined = mockFlashcards[cardIndex]
  const currentReview = currentCard
    ? reviews.find((review) => review.cardId === currentCard.id)
    : undefined
  const progress = isComplete
    ? mockFlashcards.length === 0 ? 0 : 100
    : (cardIndex / mockFlashcards.length) * 100
  const result = useMemo(
    () =>
      calculateStudySessionResult(
        mockFlashcards,
        reviews,
        sessionCompletedAt === null
          ? 0
          : (sessionCompletedAt - sessionStartedAt) / 1000,
      ),
    [reviews, sessionCompletedAt, sessionStartedAt],
  )

  const handleReturnToDeck = useCallback(() => {
    if (onReturnToDeck) {
      onReturnToDeck()
      return
    }

    setReturnMessage('Chức năng quay về bộ thẻ chưa được tích hợp.')
  }, [onReturnToDeck])

  const handleFlip = useCallback(() => {
    if (!isComplete) {
      setIsFlipped((flipped) => !flipped)
      setShowHint(false)
    }
  }, [isComplete])

  const handleRating = useCallback(
    (rating: Rating) => {
      if (
        !currentCard ||
        !isFlipped ||
        reviews.some((review) => review.cardId === currentCard.id)
      ) return

      const nextReview: CardReview = { cardId: currentCard.id, rating }
      setReviews((currentReviews) => [...currentReviews, nextReview])
      if (reviews.length + 1 === mockFlashcards.length) {
        setSessionCompletedAt(Date.now())
      }
      setLastRating(rating)
      setCardIndex((index) => index + 1)
      setIsFlipped(false)
      setShowHint(false)
    },
    [currentCard, isFlipped, reviews],
  )

  const handleRestart = useCallback(() => {
    setCardIndex(0)
    setIsFlipped(false)
    setReviews([])
    setLastRating(null)
    setShowHint(false)
    setSessionStartedAt(Date.now())
    setSessionCompletedAt(null)
    setReturnMessage('')
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isInteractive =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')

      if (isInteractive || isComplete || reportContext) return

      if (event.code === 'Space') {
        if (target instanceof HTMLElement && target.tagName === 'BUTTON') return
        event.preventDefault()
        handleFlip()
        return
      }

      if (isFlipped) {
        const option = ratingOptions.find(
          (ratingOption) => ratingOption.shortcut === event.key,
        )
        if (option) handleRating(option.value)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFlip, handleRating, isComplete, isFlipped, reportContext])

  return (
    <main className="study-app">
      <header className="topbar">
        <div className="brand" aria-label="UrSpace">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>urspace</span>
        </div>
        <div className="topbar-divider" />
        <span className="topbar-context">Không gian học tập</span>
        <button className="avatar-button" type="button" aria-label="Tài khoản">
          A
        </button>
      </header>

      <div className="session-layout">
        <section className="session-main" aria-label="Phiên học flashcard">
          <div className="session-heading">
            <div className="heading-copy">
              <button className="back-link" onClick={handleReturnToDeck} type="button">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m12.5 4.5-5.5 5.5 5.5 5.5" />
                </svg>
                <span>Bộ thẻ của tôi</span>
              </button>
              <p className="eyebrow">PHIÊN HỌC HÔM NAY</p>
              <h1>
                {isComplete
                  ? mockFlashcards.length === 0 ? 'Kết quả phiên học' : 'Bạn đã hoàn thành!'
                  : 'Khoa học tự nhiên'}
              </h1>
              <p className="deck-description">
                Ôn tập kiến thức cơ bản · {mockFlashcards.length} thẻ
              </p>
            </div>
            <div className="session-status">
              <span className="status-dot" />
              <span>{isComplete ? mockFlashcards.length === 0 ? 'Chưa bắt đầu' : 'Đã hoàn tất' : 'Đang học'}</span>
            </div>
          </div>

          <div className="progress-panel" aria-label="Tiến độ phiên học">
            <div className="progress-meta">
              <span>Tiến độ học</span>
              <strong>
                {isComplete ? mockFlashcards.length : cardIndex + 1}
                <span> / {mockFlashcards.length}</span>
              </strong>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Tiến độ học"
              aria-valuemin={0}
              aria-valuemax={Math.max(mockFlashcards.length, 1)}
              aria-valuenow={isComplete ? mockFlashcards.length : cardIndex}
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-footnote">
              <span>{reviews.length} thẻ đã đánh giá</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {isComplete ? (
            <StudySessionResult
              result={result}
              onRestart={handleRestart}
              onReturnToDeck={onReturnToDeck}
            />
          ) : (
            <>
              <div className="card-meta-row">
                <div className="subject-label">
                  <span className="subject-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20">
                      <path d="M10 2.5 17 6v8l-7 3.5L3 14V6l7-3.5Z" />
                      <path d="m3.5 6.3 6.5 3.4 6.5-3.4M10 9.7v7.5" />
                    </svg>
                  </span>
                  <span>{currentCard?.subject}</span>
                </div>
                <span className="card-counter">
                  Thẻ <strong>{cardIndex + 1}</strong> / {mockFlashcards.length}
                </span>
              </div>

              <div className={`flashcard-scene${isFlipped ? ' is-flipped' : ''}`}>
                <button
                  className="flashcard"
                  type="button"
                  onClick={handleFlip}
                  aria-label={
                    isFlipped
                      ? 'Mặt sau thẻ. Nhấn để xem câu hỏi.'
                      : 'Mặt trước thẻ. Nhấn để lật xem đáp án.'
                  }
                  aria-pressed={isFlipped}
                >
                  <span className="card-face card-front">
                    <span className="face-topline">
                      <span className="face-label">
                        <span className="face-dot" />
                        CÂU HỎI
                      </span>
                      <span className="sparkle-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2.8 14.5 9.5 21.2 12l-6.7 2.5L12 21.2l-2.5-6.7L2.8 12l6.7-2.5L12 2.8Z" />
                        </svg>
                      </span>
                    </span>
                    <span className="card-content">
                      <span className="card-subject">{currentCard?.subject}</span>
                      <span className="card-prompt">{currentCard?.prompt}</span>
                    </span>
                    <span className="flip-prompt">
                      <span className="flip-icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20">
                          <path d="M3 7.5 10 4l7 3.5M3 7.5V15l7 3.5 7-3.5V7.5M10 11v7.3M6.5 5.7l7 3.6" />
                        </svg>
                      </span>
                      Nhấn để lật thẻ
                      <span className="keyboard-key">Space</span>
                    </span>
                  </span>
                  <span className="card-face card-back">
                    <span className="face-topline">
                      <span className="face-label answer-label">
                        <span className="face-dot" />
                        ĐÁP ÁN
                      </span>
                      <span className="sparkle-icon answer-sparkle" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2.8 14.5 9.5 21.2 12l-6.7 2.5L12 21.2l-2.5-6.7L2.8 12l6.7-2.5L12 2.8Z" />
                        </svg>
                      </span>
                    </span>
                    <span className="card-content answer-content">
                      <span className="card-subject">GHI NHỚ</span>
                      <span className="card-answer">{currentCard?.answer}</span>
                    </span>
                    <span className="flip-prompt back-prompt">
                      Đánh giá mức độ ghi nhớ bên dưới
                    </span>
                  </span>
                </button>
              </div>

              <div className="card-tools">
                <div className="hint-area">
                  {currentCard?.hint && (
                    <>
                      <button
                        className={`hint-button${showHint ? ' hint-active' : ''}`}
                        onClick={() => setShowHint((visible) => !visible)}
                        type="button"
                        aria-expanded={showHint}
                      >
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M10 17.2a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" />
                          <path d="M10 9.1v4.2M10 6.7h.01" />
                        </svg>
                        Gợi ý
                      </button>
                      {showHint && <span className="hint-copy">{currentCard.hint}</span>}
                    </>
                  )}
                </div>
                <div className="keyboard-hint">
                  <span>Phím tắt</span>
                  <kbd>Space</kbd>
                  <span>để lật</span>
                </div>
              </div>

              <div className="card-report-control">
                <span>Nội dung thẻ có vấn đề?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentCard) return
                    setReportContext({
                      flashcardId: currentCard.id,
                      deckId: MOCK_STUDY_DECK_ID,
                      front: currentCard.prompt,
                      back: currentCard.answer,
                    })
                  }}
                >
                  <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.3 16 15H2L9 2.3Z" /><path d="M9 6.5v4M9 12.8h.01" /></svg>
                  Báo cáo thẻ sai
                </button>
              </div>

              <section className="rating-section" aria-label="Đánh giá mức độ ghi nhớ">
                <div className="rating-heading">
                  <span>{isFlipped ? 'Bạn nhớ đáp án thế nào?' : 'Tự kiểm tra trước khi xem đáp án'}</span>
                  <span className="rating-lock">
                    {!isFlipped && (
                      <>
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <rect x="3" y="7" width="10" height="7" rx="1.5" />
                          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                        </svg>
                        Lật thẻ để đánh giá
                      </>
                    )}
                  </span>
                </div>
                <div className="rating-grid">
                  {ratingOptions.map((option) => (
                    <button
                      className={`rating-button rating-${option.value}`}
                      key={option.value}
                      onClick={() => handleRating(option.value)}
                      type="button"
                      disabled={!isFlipped}
                      aria-label={`${option.label}: ${option.description}, phím ${option.shortcut}`}
                    >
                      <span className="rating-shortcut">{option.shortcut}</span>
                      <span className="rating-copy">
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="rating-note" aria-live="polite">
                  {currentReview ? (
                    <>
                      Đã ghi nhận lần đánh giá trước: <strong>{ratingLabels[currentReview.rating]}</strong>
                    </>
                  ) : lastRating ? (
                    <>
                      Vừa ghi nhận: <strong>{ratingLabels[lastRating]}</strong>. Kết quả được lưu trong state thử nghiệm.
                    </>
                  ) : (
                    <>Kết quả đánh giá sẽ được lưu trong phiên học thử nghiệm này.</>
                  )}
                </p>
              </section>
            </>
          )}
          {returnMessage && <p className="deck-return-status" role="status">{returnMessage}</p>}
        </section>

        <aside className="session-sidebar" aria-label="Thông tin phiên học">
          <section className="sidebar-card deck-card">
            <div className="sidebar-card-heading">
              <span className="sidebar-icon deck-icon" aria-hidden="true">
                <svg viewBox="0 0 22 22">
                  <rect x="3.5" y="4" width="12" height="14" rx="2" />
                  <path d="M7.5 7.5h4M7.5 10.5h5M7.5 13.5h2M16 7l2.5 1.5V18a1 1 0 0 1-1 1H8" />
                </svg>
              </span>
              <span className="sidebar-overline">ĐANG HỌC</span>
            </div>
            <h2>{mockFlashcards[0]?.deckName}</h2>
            <p className="sidebar-muted">Bộ thẻ đã chọn cho phiên học này.</p>
            <div className="sidebar-divider" />
            <div className="deck-facts">
              <div>
                <span>Số lượng thẻ</span>
                <strong>{mockFlashcards.length} thẻ</strong>
              </div>
              <div>
                <span>Đã đánh giá</span>
                <strong>{reviews.length} thẻ</strong>
              </div>
            </div>
          </section>

          <section className="sidebar-card guide-card">
            <div className="guide-heading">
              <span className="guide-icon" aria-hidden="true">
                <svg viewBox="0 0 22 22">
                  <path d="M11 2.8 13.5 8.5l5.7 2.5-5.7 2.5-2.5 5.7-2.5-5.7-5.7-2.5 5.7-2.5L11 2.8Z" />
                </svg>
              </span>
              <h2>Mẹo ghi nhớ</h2>
            </div>
            <p>Hãy cố gắng tự nhớ câu trả lời trước khi lật thẻ. Việc chủ động gợi nhớ giúp kiến thức ở lại lâu hơn.</p>
            <div className="guide-divider" />
            <div className="keyboard-guide">
              <div><span>Lật thẻ</span><kbd>Space</kbd></div>
              <div><span>Đánh giá</span><span className="key-range"><kbd>1</kbd>–<kbd>4</kbd></span></div>
            </div>
          </section>

          <p className="mock-note">
            <span className="mock-dot" />
            Dữ liệu mẫu · Chưa kết nối máy chủ
          </p>
        </aside>
      </div>

      <footer className="page-footer">
        <span>© 2026 UrSpace</span>
        <span className="footer-separator">·</span>
        <span>Học tập theo cách của bạn</span>
        <span className="footer-spacer" />
        <span>Phiên học thử nghiệm</span>
      </footer>
      {reportContext && (
        <FlashcardReportModal
          flashcard={reportContext}
          onClose={() => setReportContext(null)}
        />
      )}
    </main>
  )
}

export default StudySession
