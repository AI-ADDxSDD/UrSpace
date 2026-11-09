import { useState } from 'react'
import { ratingOptions } from '../data/mockFlashcards'
import { formatStudyDuration } from '../helpers/sessionStats'
import type { StudySessionResultData } from '../types/flashcard'

type StudySessionResultProps = {
  result: StudySessionResultData
  onRestart: () => void
  onReturnToDeck?: () => void
}

const statusCopy: Record<StudySessionResultData['status'], { title: string; copy: string }> = {
  empty: {
    title: 'Bộ thẻ chưa có flashcard',
    copy: 'Thêm thẻ vào bộ học để bắt đầu một phiên Active Recall.',
  },
  'not-rated': {
    title: 'Chưa có lượt đánh giá',
    copy: 'Phiên học chưa ghi nhận đánh giá nào. Bạn có thể bắt đầu lại khi sẵn sàng.',
  },
  'all-again': {
    title: 'Đây là lúc để ôn lại',
    copy: 'Bạn đã chọn Again cho tất cả thẻ. Hãy quay lại những kiến thức này sau khi nghỉ một chút.',
  },
  'all-remembered': {
    title: 'Bạn nhớ rất tốt!',
    copy: 'Tất cả thẻ đều được tự đánh giá Good hoặc Easy trong phiên này.',
  },
  mixed: {
    title: 'Bạn đã hoàn thành phiên học',
    copy: 'Mỗi lần tự nhớ lại giúp bạn hiểu rõ hơn phần kiến thức cần ôn tập.',
  },
}

function StudySessionResult({
  result,
  onRestart,
  onReturnToDeck,
}: StudySessionResultProps) {
  const [returnMessage, setReturnMessage] = useState('')
  const copy = statusCopy[result.status]

  const handleReturnToDeck = () => {
    if (onReturnToDeck) {
      onReturnToDeck()
      return
    }

    setReturnMessage('Chức năng quay về bộ thẻ chưa được tích hợp.')
  }

  return (
    <section className="result-panel" aria-labelledby="result-title" aria-live="polite">
      <div className={`result-status-icon result-status-${result.status}`} aria-hidden="true">
        {result.status === 'empty' || result.status === 'not-rated' ? (
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 8v4.5M12 16h.01" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="m5 12.5 4.3 4.2L19.5 6.8" />
          </svg>
        )}
      </div>
      <p className="eyebrow">KẾT QUẢ PHIÊN HỌC</p>
      <h2 id="result-title" className="result-title">{copy.title}</h2>
      <p className="result-description">{copy.copy}</p>

      <div className="result-metrics">
        <article className="result-metric metric-studied">
          <span className="metric-label">Thẻ đã học</span>
          <strong>{result.reviewedCards}<span> / {result.totalCards}</span></strong>
          <span className="metric-caption">thẻ được đánh giá</span>
        </article>
        <article className="result-metric metric-duration">
          <span className="metric-label">Thời gian học</span>
          <strong className="duration-value">{formatStudyDuration(result.durationSeconds)}</strong>
          <span className="metric-caption">trong phiên này</span>
        </article>
        <article className="result-metric metric-completion">
          <span className="metric-label">Hoàn thành</span>
          <strong>{result.completionPercent}<span>%</span></strong>
          <div className="metric-progress" aria-hidden="true">
            <span style={{ width: `${result.completionPercent}%` }} />
          </div>
        </article>
        <article className="result-metric metric-recall">
          <span className="metric-label">Tự đánh giá ghi nhớ</span>
          <strong>{result.estimatedRecallPercent}<span>%</span></strong>
          <div className="metric-progress" aria-hidden="true">
            <span style={{ width: `${result.estimatedRecallPercent}%` }} />
          </div>
        </article>
      </div>

      <section className="rating-breakdown" aria-labelledby="breakdown-title">
        <div className="breakdown-heading">
          <div>
            <h3 id="breakdown-title">Kết quả tự đánh giá</h3>
            <p>Số thẻ ở mỗi mức trong phiên học này</p>
          </div>
          <span className="breakdown-total">{result.reviewedCards} thẻ</span>
        </div>
        <div className="rating-bars">
          {ratingOptions.map((option) => {
            const count = result.ratingCounts[option.value]
            const percent = result.reviewedCards
              ? Math.round((count / result.reviewedCards) * 100)
              : 0

            return (
              <div className={`rating-bar-row bar-${option.value}`} key={option.value}>
                <div className="rating-bar-label">
                  <span className="rating-bar-name">{option.label}</span>
                  <span className="rating-bar-description">{option.description}</span>
                </div>
                <div
                  className="rating-bar-track"
                  role="progressbar"
                  aria-label={`${option.label}: ${count} thẻ`}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(result.reviewedCards, 1)}
                  aria-valuenow={count}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
                <strong className="rating-bar-count">{count}</strong>
              </div>
            )
          })}
        </div>
        <p className="recall-disclaimer">
          Tỷ lệ ghi nhớ tạm tính là thống kê từ tự đánh giá Good và Easy, không phải Retrievability của thuật toán FSRS.
        </p>
      </section>

      <div className="result-actions">
        <button className="result-primary-button" onClick={onRestart} type="button">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M16 10a6 6 0 1 1-1.7-4.2M16 4v4h-4" />
          </svg>
          Học lại bộ thẻ
        </button>
        <button className="result-secondary-button" onClick={handleReturnToDeck} type="button">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m12.5 4.5-5.5 5.5 5.5 5.5" />
          </svg>
          Quay về bộ thẻ
        </button>
      </div>
      <p className="return-status" role="status" aria-live="polite">{returnMessage}</p>
      <p className="result-data-note">Kết quả chỉ được giữ trong state của phiên thử nghiệm này.</p>
    </section>
  )
}

export default StudySessionResult
