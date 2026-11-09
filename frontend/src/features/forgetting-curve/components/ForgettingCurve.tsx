import { useEffect, useState } from 'react'
import { getMockForgettingCurve } from '../api/mockForgettingCurveApi'
import type {
  ForgettingCurveLoader,
  ForgettingCurveRange,
  ForgettingCurveResponseDto,
} from '../types'
import { ForgettingCurveChart } from './ForgettingCurveChart'
import './ForgettingCurve.css'

type ForgettingCurveProps = {
  loadCurve?: ForgettingCurveLoader
}

type LoadState =
  | { range: ForgettingCurveRange; status: 'loading' }
  | { range: ForgettingCurveRange; status: 'error'; message: string }
  | { range: ForgettingCurveRange; status: 'ready'; response: ForgettingCurveResponseDto }

const rangeOptions: Array<{ value: ForgettingCurveRange; label: string }> = [
  { value: 7, label: '7 ngày qua' },
  { value: 14, label: '14 ngày qua' },
  { value: 30, label: '30 ngày qua' },
  { value: 60, label: '60 ngày qua' },
]

export function ForgettingCurve({ loadCurve = getMockForgettingCurve }: ForgettingCurveProps) {
  const [range, setRange] = useState<ForgettingCurveRange>(14)
  const [retryToken, setRetryToken] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ range: 14, status: 'loading' })

  useEffect(() => {
    let isCurrent = true
    loadCurve(range)
      .then((response) => {
        if (isCurrent) setLoadState({ range, status: 'ready', response })
      })
      .catch(() => {
        if (isCurrent) {
          setLoadState({
            range,
            status: 'error',
            message: 'Chưa thể tải dữ liệu đường cong quên lãng. Vui lòng thử lại.',
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [range, loadCurve, retryToken])

  const isCurrentRange = loadState.range === range
  const isLoading = !isCurrentRange || loadState.status === 'loading'
  const errorMessage = isCurrentRange && loadState.status === 'error' ? loadState.message : ''
  const response = isCurrentRange && loadState.status === 'ready' ? loadState.response : null

  const handleRefresh = () => {
    setLoadState({ range, status: 'loading' })
    setRetryToken((token) => token + 1)
  }

  const hasObservedReviews = Boolean(response && response.summary.totalReviewsCount > 0)

  return (
    <main className="forgetting-page">
      <header className="forgetting-topbar">
        <div className="forgetting-brand">
          <span className="forgetting-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>urspace</span>
        </div>
        <span className="forgetting-divider" />
        <span className="forgetting-context">Phân tích khả năng ghi nhớ</span>
        <span className="forgetting-mock-pill">
          <i /> MOCK ANALYTICS
        </span>
      </header>

      <div className="forgetting-content">
        <section className="forgetting-heading">
          <div>
            <p className="forgetting-eyebrow">UC-07.2 · RETENTION ANALYTICS</p>
            <h1>Đường cong quên lãng</h1>
            <p>
              Đối chiếu tỷ lệ ghi nhớ thực tế quan sát được với mô hình suy giảm trí nhớ Ebbinghaus.
            </p>
          </div>
          <div className="forgetting-heading-actions">
            <label htmlFor="forgetting-range-select">Phạm vi thời gian</label>
            <select
              id="forgetting-range-select"
              value={range}
              onChange={(e) => setRange(Number(e.target.value) as ForgettingCurveRange)}
              disabled={isLoading}
            >
              {rangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              className="forgetting-refresh-button"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Làm mới dữ liệu đường cong quên"
            >
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <path d="M14.8 7A6 6 0 0 0 4.4 4.5L3 6M3 3v3h3M3.2 11A6 6 0 0 0 13.6 13.5L15 12m0 3v-3h-3" />
              </svg>
              {isLoading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </section>

        {/* Disclaimer Notice: Important Requirements 4 & 5 */}
        <div className="forgetting-disclaimer-notice" role="note">
          <span className="forgetting-notice-icon" aria-hidden="true">i</span>
          <div>
            <strong>Ghi chú mô hình & dữ liệu:</strong> Đường lý thuyết được tính toán theo mô hình
            hàm mũ Ebbinghaus cổ điển (minh họa, độ ổn định S = {response?.stabilityFactorDays ?? 14} ngày),
            <strong> KHÔNG phải dự đoán FSRS</strong> và không thay thế thuật toán backend. Tỷ lệ quan sát
            được tổng hợp từ mock review history, không can thiệp cơ sở dữ liệu học tập thật.
          </div>
        </div>

        {/* Stats summary cards */}
        {response && (
          <section className="forgetting-stats" aria-label="Thống kê tổng hợp ghi nhớ">
            <article className="forgetting-stat forgetting-stat-observed">
              <span className="forgetting-stat-icon" aria-hidden="true">●</span>
              <span className="forgetting-stat-label">Retention quan sát</span>
              <strong>
                {response.summary.observedAverageRetention !== null ? (
                  <>
                    {response.summary.observedAverageRetention}
                    <small>%</small>
                  </>
                ) : (
                  <span className="forgetting-no-data-text">Chưa có</span>
                )}
              </strong>
              <span className="forgetting-stat-caption">
                {hasObservedReviews
                  ? `Trung bình từ ${response.summary.totalReviewsCount} lượt ôn tập`
                  : 'Chưa có lượt ôn tập nào'}
              </span>
            </article>

            <article className="forgetting-stat forgetting-stat-theoretical">
              <span className="forgetting-stat-icon" aria-hidden="true">〜</span>
              <span className="forgetting-stat-label">Lý thuyết ngày {range}</span>
              <strong>
                {response.summary.theoreticalEndRetention}
                <small>%</small>
              </strong>
              <span className="forgetting-stat-caption">Mô hình Ebbinghaus (S = {response.stabilityFactorDays}d)</span>
            </article>

            <article className="forgetting-stat forgetting-stat-reviews">
              <span className="forgetting-stat-icon" aria-hidden="true">✓</span>
              <span className="forgetting-stat-label">Tổng lượt đánh giá</span>
              <strong>
                {response.summary.totalReviewsCount}
                <small> lượt</small>
              </strong>
              <span className="forgetting-stat-caption">
                {response.summary.observedPointsCount} mốc ngày có dữ liệu
              </span>
            </article>

            <article className="forgetting-stat forgetting-stat-points">
              <span className="forgetting-stat-icon" aria-hidden="true">▦</span>
              <span className="forgetting-stat-label">Điểm mốc quan sát</span>
              <strong>
                {response.summary.observedPointsCount}
                <small> / {range + 1} ngày</small>
              </strong>
              <span className="forgetting-stat-caption">Không vẽ đường giả cho ngày trống</span>
            </article>
          </section>
        )}

        {/* Loading State */}
        {isLoading ? (
          <section className="forgetting-panel forgetting-loading" role="status" aria-busy="true">
            <div className="forgetting-panel-heading">
              <div>
                <span className="forgetting-skeleton-line" />
                <span className="forgetting-skeleton-line forgetting-skeleton-short" />
              </div>
              <span className="forgetting-loader" />
            </div>
            <div className="forgetting-skeleton-chart" />
            <p>Đang tải dữ liệu đường cong quên lãng…</p>
          </section>
        ) : errorMessage ? (
          /* Error State */
          <section className="forgetting-panel forgetting-state-panel" role="alert">
            <span className="forgetting-state-icon forgetting-error-icon">!</span>
            <h2>Không thể tải biểu đồ</h2>
            <p>{errorMessage}</p>
            <button className="forgetting-primary-button" type="button" onClick={handleRefresh}>
              Thử tải lại
            </button>
          </section>
        ) : response ? (
          /* Main Chart Panel */
          <section className="forgetting-panel" aria-labelledby="forgetting-chart-heading">
            <div className="forgetting-panel-heading">
              <div>
                <p className="forgetting-eyebrow">BIỂU ĐỒ SUY GIẢM TRÍ NHỚ</p>
                <h2 id="forgetting-chart-heading">Đường cong trong {range} ngày qua</h2>
                <p>
                  Mô hình lý thuyết Ebbinghaus vs. Tỷ lệ nhớ thực tế (quan sát từ kết quả ôn tập)
                </p>
              </div>
              <div className="forgetting-panel-meta">
                <span>Phạm vi: <strong>0 — {range} ngày</strong></span>
              </div>
            </div>

            {/* Empty state notice (Requirement 8) */}
            {!hasObservedReviews && (
              <div className="forgetting-empty-banner" role="status">
                <strong>Chưa có dữ liệu quan sát:</strong> Không có lượt ôn tập nào được ghi nhận
                trong phạm vi {range} ngày này. Biểu đồ chỉ hiển thị đường cong lý thuyết minh họa;
                hệ thống <em>không vẽ giả đường Observed</em>.
              </div>
            )}

            {/* Responsive Chart */}
            <ForgettingCurveChart
              points={response.points}
              timeRangeDays={response.timeRangeDays}
              stabilityFactorDays={response.stabilityFactorDays}
            />

            <footer className="forgetting-panel-footnote">
              <span>* Chú ý: Trục Y biểu thị tỷ lệ ghi nhớ ước lượng (%). Trục X biểu thị số ngày trôi qua từ lần học/ôn trước đó.</span>
              <span>Backend endpoint tương lai: <code>GET /api/v1/analytics/retention-curve</code></span>
            </footer>
          </section>
        ) : null}

        <footer className="forgetting-page-footer">
          <span>UrSpace · UC-07.2 Forgetting Curve</span>
          <span>Frontend Mock · Không ghi nhận hoặc can thiệp dữ liệu FSRS thật</span>
        </footer>
      </div>
    </main>
  )
}

export default ForgettingCurve
