import { useEffect } from 'react'
import { getMasteryLevelMeta } from '../helpers/knowledgeMasteryHelpers'
import type { ConceptMasteryNode } from '../types'

type ConceptDetailModalProps = {
  node: ConceptMasteryNode
  onClose: () => void
}

export function ConceptDetailModal({ node, onClose }: ConceptDetailModalProps) {
  const meta = getMasteryLevelMeta(node.level)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return 'Chưa có'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div
      className="concept-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="concept-modal-title"
    >
      <div
        className="concept-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="concept-modal-header">
          <div className="concept-modal-header-meta">
            <span className="concept-modal-subject">{node.subject}</span>
            <span className="concept-modal-sep">·</span>
            <span className="concept-modal-topic">{node.topic}</span>
          </div>
          <button
            type="button"
            className="concept-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng chi tiết khái niệm"
          >
            ×
          </button>
        </header>

        <div className="concept-modal-body">
          <div className="concept-modal-title-row">
            <h2 id="concept-modal-title">{node.name}</h2>
            <span className={`concept-modal-badge ${meta.badgeClass}`}>
              {meta.label}
            </span>
          </div>

          <p className="concept-modal-desc">{node.description}</p>

          <div className="concept-modal-progress-section">
            <div className="concept-modal-progress-labels">
              <span>Mức độ thành thạo minh họa</span>
              <strong>{node.masteryScore}%</strong>
            </div>
            <div className="concept-modal-progress-track">
              <div
                className={`concept-modal-progress-fill ${meta.cssClass}`}
                style={{ width: `${node.masteryScore}%` }}
              />
            </div>
            <p className="concept-modal-progress-caption">{meta.description}</p>
          </div>

          <div className="concept-modal-grid">
            <div className="concept-modal-grid-item">
              <span className="concept-modal-grid-label">Số thẻ liên kết</span>
              <strong>{node.cardCount} flashcards</strong>
            </div>
            <div className="concept-modal-grid-item">
              <span className="concept-modal-grid-label">Tỷ lệ nhớ quan sát</span>
              <strong>
                {node.retentionRate !== null ? `${node.retentionRate}%` : 'Chưa có'}
              </strong>
            </div>
            <div className="concept-modal-grid-item">
              <span className="concept-modal-grid-label">Lần ôn tập gần nhất</span>
              <span>{formatDate(node.lastReviewedAt)}</span>
            </div>
            <div className="concept-modal-grid-item">
              <span className="concept-modal-grid-label">Lịch ôn tiếp theo</span>
              <span>{formatDate(node.nextReviewDue)}</span>
            </div>
          </div>

          <div className="concept-modal-action-box">
            <span className="concept-modal-action-icon" aria-hidden="true">💡</span>
            <div>
              <strong>Khuyến nghị học tập:</strong>
              <p>{node.recommendedAction}</p>
            </div>
          </div>

          <div className="concept-modal-disclaimer">
            <span>* Chỉ số này mang tính chất minh họa frontend. Backend ASP.NET Core FSRS engine sẽ điều phối trạng thái thực tế.</span>
          </div>
        </div>

        <footer className="concept-modal-footer">
          <button
            type="button"
            className="concept-modal-action-button"
            onClick={onClose}
          >
            Đã hiểu
          </button>
        </footer>
      </div>
    </div>
  )
}
