import { useEffect, useMemo, useState } from 'react'
import { getMockKnowledgeMastery } from '../api/mockKnowledgeMasteryApi'
import {
  filterConceptNodes,
  getMasteryLevelMeta,
  groupNodesByTopic,
} from '../helpers/knowledgeMasteryHelpers'
import type {
  ConceptMasteryNode,
  ConceptMasteryResponseDto,
  KnowledgeMasteryFilter,
  KnowledgeMasteryLoader,
  MasteryLevel,
} from '../types'
import { ConceptDetailModal } from './ConceptDetailModal'
import './KnowledgeMastery.css'

type KnowledgeMasteryProps = {
  loadMastery?: KnowledgeMasteryLoader
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; response: ConceptMasteryResponseDto }

const LEVEL_FILTER_OPTIONS: Array<{ value: 'all' | MasteryLevel; label: string }> = [
  { value: 'all', label: 'Tất cả mức độ' },
  { value: 'unlearned', label: 'Chưa học' },
  { value: 'needs_review', label: 'Cần ôn tập' },
  { value: 'in_progress', label: 'Đang tiến bộ' },
  { value: 'mastered', label: 'Thành thạo' },
]

export function KnowledgeMastery({ loadMastery = getMockKnowledgeMastery }: KnowledgeMasteryProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)

  const [filter, setFilter] = useState<KnowledgeMasteryFilter>({
    subject: 'all',
    level: 'all',
    searchQuery: '',
  })

  const [selectedNode, setSelectedNode] = useState<ConceptMasteryNode | null>(null)

  useEffect(() => {
    let isCurrent = true
    loadMastery()
      .then((response) => {
        if (isCurrent) setLoadState({ status: 'ready', response })
      })
      .catch(() => {
        if (isCurrent) {
          setLoadState({
            status: 'error',
            message: 'Chưa thể tải dữ liệu mức độ thành thạo kiến thức. Vui lòng thử lại.',
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [loadMastery, retryToken])

  const isLoading = loadState.status === 'loading'
  const errorMessage = loadState.status === 'error' ? loadState.message : ''
  const response = loadState.status === 'ready' ? loadState.response : null

  const handleRefresh = () => {
    setLoadState({ status: 'loading' })
    setRetryToken((t) => t + 1)
  }

  const handleResetFilter = () => {
    setFilter({
      subject: 'all',
      level: 'all',
      searchQuery: '',
    })
  }

  const filteredNodes = useMemo(() => {
    if (!response) return []
    return filterConceptNodes(response.nodes, filter)
  }, [response, filter])

  const topicGroups = useMemo(() => {
    return groupNodesByTopic(filteredNodes)
  }, [filteredNodes])

  const isFilterActive =
    filter.subject !== 'all' || filter.level !== 'all' || filter.searchQuery.trim().length > 0

  return (
    <main className="mastery-page">
      <header className="mastery-topbar">
        <div className="mastery-brand">
          <span className="mastery-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>urspace</span>
        </div>
        <span className="mastery-divider" />
        <span className="mastery-context">Độ thành thạo kiến thức</span>
        <span className="mastery-mock-pill">
          <i /> MOCK HEATMAP
        </span>
      </header>

      <div className="mastery-content">
        <section className="mastery-heading">
          <div>
            <p className="mastery-eyebrow">UC-07.3 · CONCEPT MASTERY</p>
            <h1>Bản đồ nhiệt Thành thạo Kiến thức</h1>
            <p>
              Theo dõi mức độ hấp thu và độ bền vững kiến thức theo từng Concept Node.
            </p>
          </div>
          <div className="mastery-heading-actions">
            <button
              className="mastery-refresh-button"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Làm mới bản đồ nhiệt"
            >
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path d="M14.8 7A6 6 0 0 0 4.4 4.5L3 6M3 3v3h3M3.2 11A6 6 0 0 0 13.6 13.5L15 12m0 3v-3h-3" />
              </svg>
              {isLoading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </section>

        {/* Demo Threshold Notice (Requirements 9 & 10) */}
        <div className="mastery-notice" role="note">
          <span className="mastery-notice-icon" aria-hidden="true">i</span>
          <div>
            <strong>Ghi chú phân cấp & thuật toán:</strong> Các ngưỡng hiển thị demo:
            Chưa học (0%), Cần ôn tập (&lt;50%), Đang tiến bộ (50-79%), Thành thạo (≥80%).
            Frontend <strong>KHÔNG tự tính FSRS Retrievability</strong> và không can thiệp ghi
            bảng UserConceptMasteries; các chỉ số này chờ Backend xác nhận.
          </div>
        </div>

        {/* Distribution Statistics Cards (Requirement 7) */}
        {response && (
          <section className="mastery-stats" aria-label="Thống kê phân bố mức thành thạo">
            <article className="mastery-stat mastery-stat-total">
              <span className="mastery-stat-icon" aria-hidden="true">▦</span>
              <span className="mastery-stat-label">Tổng Concept Nodes</span>
              <strong>
                {response.totalNodes}
                <small> nodes</small>
              </strong>
              <span className="mastery-stat-caption">
                Điểm thành thạo TB: <strong>{response.averageMasteryScore}%</strong>
              </span>
            </article>

            <article className="mastery-stat mastery-stat-unlearned">
              <span className="mastery-stat-icon" aria-hidden="true">○</span>
              <span className="mastery-stat-label">Chưa học</span>
              <strong>
                {response.distribution.unlearned}
                <small> ({response.distribution.unlearnedPercentage}%)</small>
              </strong>
              <span className="mastery-stat-caption">Chưa có lượt ôn tập</span>
            </article>

            <article className="mastery-stat mastery-stat-needs-review">
              <span className="mastery-stat-icon" aria-hidden="true">⚠</span>
              <span className="mastery-stat-label">Cần ôn tập</span>
              <strong>
                {response.distribution.needsReview}
                <small> ({response.distribution.needsReviewPercentage}%)</small>
              </strong>
              <span className="mastery-stat-caption">Độ ghi nhớ &lt; 50%</span>
            </article>

            <article className="mastery-stat mastery-stat-in-progress">
              <span className="mastery-stat-icon" aria-hidden="true">↗</span>
              <span className="mastery-stat-label">Đang tiến bộ</span>
              <strong>
                {response.distribution.inProgress}
                <small> ({response.distribution.inProgressPercentage}%)</small>
              </strong>
              <span className="mastery-stat-caption">Độ ghi nhớ 50% - 79%</span>
            </article>

            <article className="mastery-stat mastery-stat-mastered">
              <span className="mastery-stat-icon" aria-hidden="true">✓</span>
              <span className="mastery-stat-label">Thành thạo</span>
              <strong>
                {response.distribution.mastered}
                <small> ({response.distribution.masteredPercentage}%)</small>
              </strong>
              <span className="mastery-stat-caption">Độ ghi nhớ ≥ 80%</span>
            </article>
          </section>
        )}

        {/* Segmented Distribution Progress Bar */}
        {response && response.totalNodes > 0 && (
          <div className="mastery-distribution-bar-wrapper" aria-label="Thanh phân bố thành thạo">
            <div className="mastery-distribution-bar">
              {response.distribution.unlearnedPercentage > 0 && (
                <div
                  className="mastery-bar-segment mastery-bar-unlearned"
                  style={{ width: `${response.distribution.unlearnedPercentage}%` }}
                  title={`Chưa học: ${response.distribution.unlearnedPercentage}%`}
                />
              )}
              {response.distribution.needsReviewPercentage > 0 && (
                <div
                  className="mastery-bar-segment mastery-bar-needs-review"
                  style={{ width: `${response.distribution.needsReviewPercentage}%` }}
                  title={`Cần ôn tập: ${response.distribution.needsReviewPercentage}%`}
                />
              )}
              {response.distribution.inProgressPercentage > 0 && (
                <div
                  className="mastery-bar-segment mastery-bar-in-progress"
                  style={{ width: `${response.distribution.inProgressPercentage}%` }}
                  title={`Đang tiến bộ: ${response.distribution.inProgressPercentage}%`}
                />
              )}
              {response.distribution.masteredPercentage > 0 && (
                <div
                  className="mastery-bar-segment mastery-bar-mastered"
                  style={{ width: `${response.distribution.masteredPercentage}%` }}
                  title={`Thành thạo: ${response.distribution.masteredPercentage}%`}
                />
              )}
            </div>
            <div className="mastery-distribution-labels">
              <span>Chưa học ({response.distribution.unlearnedPercentage}%)</span>
              <span>Cần ôn ({response.distribution.needsReviewPercentage}%)</span>
              <span>Tiến bộ ({response.distribution.inProgressPercentage}%)</span>
              <span>Thành thạo ({response.distribution.masteredPercentage}%)</span>
            </div>
          </div>
        )}

        {/* Filter Toolbar (Requirement 5) */}
        {response && (
          <section className="mastery-filters-toolbar" aria-label="Bộ lọc kiến thức">
            <div className="mastery-filter-group">
              <label htmlFor="mastery-subject-filter">Môn học:</label>
              <select
                id="mastery-subject-filter"
                value={filter.subject}
                onChange={(e) => setFilter((prev) => ({ ...prev, subject: e.target.value }))}
              >
                <option value="all">Tất cả môn học ({response.nodes.length})</option>
                {response.subjects.map((sub) => {
                  const count = response.nodes.filter((n) => n.subject === sub).length
                  return (
                    <option key={sub} value={sub}>
                      {sub} ({count})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="mastery-filter-group">
              <label htmlFor="mastery-level-filter">Trạng thái:</label>
              <select
                id="mastery-level-filter"
                value={filter.level}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    level: e.target.value as 'all' | MasteryLevel,
                  }))
                }
              >
                {LEVEL_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mastery-filter-group mastery-filter-search">
              <label htmlFor="mastery-search-input">Tìm kiếm:</label>
              <div className="mastery-search-box">
                <input
                  id="mastery-search-input"
                  type="search"
                  placeholder="Tìm theo tên khái niệm, chủ đề..."
                  value={filter.searchQuery}
                  onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
                />
              </div>
            </div>

            {isFilterActive && (
              <button
                type="button"
                className="mastery-filter-reset-btn"
                onClick={handleResetFilter}
              >
                Đặt lại lọc
              </button>
            )}
          </section>
        )}

        {/* Loading State */}
        {isLoading ? (
          <section className="mastery-panel mastery-loading" role="status" aria-busy="true">
            <div className="mastery-panel-heading">
              <div>
                <span className="mastery-skeleton-line" />
                <span className="mastery-skeleton-line mastery-skeleton-short" />
              </div>
              <span className="mastery-loader" />
            </div>
            <div className="mastery-skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="mastery-skeleton-card" />
              ))}
            </div>
            <p>Đang tải bản đồ nhiệt độ thành thạo kiến thức…</p>
          </section>
        ) : errorMessage ? (
          /* Error State */
          <section className="mastery-panel mastery-state-panel" role="alert">
            <span className="mastery-state-icon mastery-error-icon">!</span>
            <h2>Không thể tải dữ liệu</h2>
            <p>{errorMessage}</p>
            <button className="mastery-primary-button" type="button" onClick={handleRefresh}>
              Thử tải lại
            </button>
          </section>
        ) : filteredNodes.length === 0 ? (
          /* Empty State */
          <section className="mastery-panel mastery-state-panel" role="status">
            <span className="mastery-state-icon">▦</span>
            <h2>Không tìm thấy khái niệm phù hợp</h2>
            <p>
              {isFilterActive
                ? 'Không có concept node nào khớp với bộ lọc hiện tại. Hãy thử thay đổi môn học hoặc từ khóa tìm kiếm.'
                : 'Chưa có dữ liệu concept node nào trong hệ thống.'}
            </p>
            {isFilterActive && (
              <button
                className="mastery-primary-button"
                type="button"
                onClick={handleResetFilter}
              >
                Xóa bộ lọc
              </button>
            )}
          </section>
        ) : (
          /* Heatmap Matrix Display (Requirement 1, 2, 3, 4, 11) */
          <section className="mastery-panel" aria-labelledby="mastery-heatmap-heading">
            <div className="mastery-panel-heading">
              <div>
                <p className="mastery-eyebrow">HEATMAP LƯỚI THEO CHỦ ĐỀ</p>
                <h2 id="mastery-heatmap-heading">
                  Hiển thị {filteredNodes.length} / {response?.totalNodes ?? 0} Concepts
                </h2>
                <p>Nhấp vào bất kỳ concept node nào để xem chi tiết và khuyến nghị ôn tập</p>
              </div>
              <div className="mastery-legend" aria-label="Chú giải các mức thành thạo">
                <span className="mastery-legend-item">
                  <i className="mastery-swatch-unlearned" /> Chưa học
                </span>
                <span className="mastery-legend-item">
                  <i className="mastery-swatch-needs-review" /> Cần ôn (&lt;50%)
                </span>
                <span className="mastery-legend-item">
                  <i className="mastery-swatch-in-progress" /> Tiến bộ (50-79%)
                </span>
                <span className="mastery-legend-item">
                  <i className="mastery-swatch-mastered" /> Thành thạo (≥80%)
                </span>
              </div>
            </div>

            <div className="mastery-topic-groups">
              {topicGroups.map((group) => (
                <div key={`${group.subject}-${group.topic}`} className="mastery-topic-group">
                  <div className="mastery-topic-header">
                    <div className="mastery-topic-title">
                      <span className="mastery-topic-subject-badge">{group.subject}</span>
                      <h3>{group.topic}</h3>
                    </div>
                    <span className="mastery-topic-meta">
                      {group.nodes.length} nodes · TB: <strong>{group.averageScore}%</strong>
                    </span>
                  </div>

                  <div className="mastery-node-grid">
                    {group.nodes.map((node) => {
                      const meta = getMasteryLevelMeta(node.level)
                      return (
                        <button
                          key={node.conceptNodeId}
                          type="button"
                          className={`mastery-node-card ${meta.cssClass}`}
                          onClick={() => setSelectedNode(node)}
                          aria-label={`${node.name}: ${meta.label}, mức độ ${node.masteryScore}%`}
                        >
                          <div className="mastery-node-header">
                            <span className="mastery-node-name">{node.name}</span>
                            <span className="mastery-node-score">{node.masteryScore}%</span>
                          </div>
                          <div className="mastery-node-bar-track">
                            <div
                              className="mastery-node-bar-fill"
                              style={{ width: `${node.masteryScore}%` }}
                            />
                          </div>
                          <div className="mastery-node-footer">
                            <span className={`mastery-node-badge ${meta.badgeClass}`}>
                              {meta.shortLabel}
                            </span>
                            <span className="mastery-node-cards-count">
                              {node.cardCount} thẻ
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <footer className="mastery-panel-footnote">
              <span>* Chú ý: Heatmap hiển thị dạng lưới phân nhóm theo chủ đề, không thay thế đồ thị mạng DAG toàn phần.</span>
              <span>Backend endpoint tương lai: <code>GET /api/v1/concepts/mastery</code></span>
            </footer>
          </section>
        )}

        <footer className="mastery-page-footer">
          <span>UrSpace · UC-07.3 Knowledge Mastery Heatmap</span>
          <span>Frontend Mock · Không tự tính FSRS Retrievability hoặc cập nhật Database</span>
        </footer>
      </div>

      {/* Detail Modal (Requirement 6) */}
      {selectedNode && (
        <ConceptDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </main>
  )
}

export default KnowledgeMastery
