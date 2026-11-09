import { useEffect, useMemo, useState } from 'react'
import { getMockUpcomingReviewSchedule } from '../api/mockReviewScheduleApi'
import type {
  ReviewScheduleLoader,
  ReviewScheduleRange,
  UpcomingReviewScheduleDto,
} from '../types'
import './ReviewSchedule.css'

type ReviewScheduleProps = {
  loadSchedule?: ReviewScheduleLoader
}

type LoadState =
  | { rangeDays: ReviewScheduleRange; status: 'loading' }
  | { rangeDays: ReviewScheduleRange; status: 'error'; message: string }
  | { rangeDays: ReviewScheduleRange; status: 'ready'; schedule: UpcomingReviewScheduleDto }

const rangeOptions: Array<{ value: ReviewScheduleRange; label: string }> = [
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' },
]

const utcDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function getDateLabel(dateKey: string): string {
  return utcDateFormatter.format(new Date(`${dateKey}T00:00:00.000Z`))
}

function ReviewSchedule({ loadSchedule = getMockUpcomingReviewSchedule }: ReviewScheduleProps) {
  const [rangeDays, setRangeDays] = useState<ReviewScheduleRange>(7)
  const [retryToken, setRetryToken] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ rangeDays: 7, status: 'loading' })

  useEffect(() => {
    let isCurrent = true
    loadSchedule(rangeDays)
      .then((schedule) => {
        if (isCurrent) setLoadState({ rangeDays, status: 'ready', schedule })
      })
      .catch(() => {
        if (isCurrent) setLoadState({ rangeDays, status: 'error', message: 'Chưa tải được lịch ôn tập. Hãy thử lại.' })
      })

    return () => { isCurrent = false }
  }, [loadSchedule, rangeDays, retryToken])

  const isCurrentRange = loadState.rangeDays === rangeDays
  const isLoading = !isCurrentRange || loadState.status === 'loading'
  const errorMessage = isCurrentRange && loadState.status === 'error' ? loadState.message : ''
  const schedule = isCurrentRange && loadState.status === 'ready' ? loadState.schedule : null
  const maxDailyCount = useMemo(
    () => Math.max(1, ...(schedule?.dailyCounts.map((day) => day.dueCount) ?? [])),
    [schedule],
  )
  const isNoData = Boolean(schedule && schedule.totalDueInRange === 0 && schedule.overdueCount === 0)
  const today = schedule?.dailyCounts[0]?.date

  const handleRefresh = () => {
    setLoadState({ rangeDays, status: 'loading' })
    setRetryToken((token) => token + 1)
  }

  return (
    <main className="review-schedule-page">
      <header className="schedule-topbar">
        <div className="schedule-brand"><span className="schedule-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>urspace</span></div>
        <span className="schedule-divider" />
        <span className="schedule-context">Học tập của bạn</span>
        <span className="schedule-mock-pill"><i /> DỮ LIỆU MINH HỌA</span>
      </header>

      <div className="schedule-content">
        <section className="schedule-heading">
          <div>
            <p className="schedule-eyebrow">FSRS REVIEW · LỊCH DỰ KIẾN</p>
            <h1>Lịch ôn tập sắp tới</h1>
            <p>Xem số thẻ đã được hệ thống lên lịch theo due date từng ngày.</p>
          </div>
          <button className="schedule-refresh-button" type="button" onClick={handleRefresh} disabled={isLoading}>
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M14.8 7A6 6 0 0 0 4.4 4.5L3 6M3 3v3h3M3.2 11A6 6 0 0 0 13.6 13.5L15 12m0 3v-3h-3" /></svg>
            {isLoading ? 'Đang làm mới…' : 'Làm mới dữ liệu'}
          </button>
        </section>

        <div className="schedule-mock-disclaimer" role="note">
          <span aria-hidden="true">i</span>
          Đây là dữ liệu minh họa trong phiên Mock, không phải lịch ôn của tài khoản thật. Lịch lấy từ due date có sẵn; giao diện không tính hoặc cập nhật FSRS.
        </div>

        <section className="schedule-controls" aria-label="Bộ lọc khoảng thời gian">
          <label htmlFor="review-range">Khoảng thời gian</label>
          <select
            id="review-range"
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value) as ReviewScheduleRange)}
          >
            {rangeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
          {today && <span className="schedule-as-of">Ngày tham chiếu UTC: {today}</span>}
        </section>

        {schedule && (
          <section className="schedule-summary" aria-label="Tóm tắt lịch ôn tập">
            <article className="schedule-stat schedule-stat-total"><span className="schedule-stat-icon" aria-hidden="true">▦</span><span className="schedule-stat-label">Trong {rangeDays} ngày</span><strong>{schedule.totalDueInRange}</strong><small>thẻ đến hạn trong biểu đồ</small></article>
            <article className="schedule-stat schedule-stat-overdue"><span className="schedule-stat-icon" aria-hidden="true">↶</span><span className="schedule-stat-label">Quá hạn</span><strong>{schedule.overdueCount}</strong><small>ngày UTC trước hôm nay</small></article>
            <article className="schedule-stat schedule-stat-today"><span className="schedule-stat-icon" aria-hidden="true">◷</span><span className="schedule-stat-label">Đến hạn hôm nay</span><strong>{schedule.dueTodayCount}</strong><small>{today ?? 'Ngày UTC hiện tại'}</small></article>
            <article className="schedule-stat schedule-stat-upcoming"><span className="schedule-stat-icon" aria-hidden="true">↗</span><span className="schedule-stat-label">Sắp đến hạn</span><strong>{schedule.upcomingCount}</strong><small>các ngày tương lai trong khoảng</small></article>
          </section>
        )}

        {isLoading ? (
          <section className="schedule-panel schedule-loading" role="status" aria-busy="true">
            <div className="schedule-panel-heading"><div><span className="schedule-skeleton-line" /><span className="schedule-skeleton-line schedule-skeleton-short" /></div><span className="schedule-loader" /></div>
            <div className="schedule-chart-skeleton"><i /><i /><i /><i /><i /><i /><i /></div>
            <p>Đang tải dữ liệu lịch ôn tập…</p>
          </section>
        ) : errorMessage ? (
          <section className="schedule-panel schedule-error" role="alert">
            <span className="schedule-state-icon">!</span><h2>Không thể tải lịch ôn tập</h2><p>{errorMessage}</p>
            <button className="schedule-primary-button" type="button" onClick={handleRefresh}>Thử tải lại</button>
          </section>
        ) : schedule && isNoData ? (
          <section className="schedule-panel schedule-empty" role="status">
            <span className="schedule-state-icon">▤</span><h2>Chưa có lịch ôn tập</h2>
            <p>Chưa có thẻ nào được lên lịch trong {rangeDays} ngày tới hoặc đang quá hạn. Dữ liệu sẽ xuất hiện khi Backend cung cấp due date.</p>
            <button className="schedule-secondary-button" type="button" onClick={handleRefresh}>Làm mới dữ liệu</button>
          </section>
        ) : schedule ? (
          <section className="schedule-panel" aria-labelledby="schedule-chart-title">
            <div className="schedule-panel-heading">
              <div><p className="schedule-eyebrow">SỐ THẺ THEO NGÀY</p><h2 id="schedule-chart-title">Thẻ đến hạn</h2><p>Ngày theo UTC · Quá hạn được tóm tắt riêng.</p></div>
              <span className="schedule-chart-total"><strong>{schedule.totalDueInRange}</strong><small>thẻ trong {rangeDays} ngày</small></span>
            </div>
            {schedule.totalDueInRange === 0 && schedule.overdueCount > 0 && (
              <p className="schedule-no-future" role="status">Không có thẻ đến hạn trong các ngày được chọn; hiện có {schedule.overdueCount} thẻ quá hạn.</p>
            )}
            <div className="schedule-chart-legend"><span><i /> Thẻ đến hạn</span><span>Ngày không có thẻ hiển thị là 0</span></div>
            <div className="schedule-chart-scroll" role="region" aria-label={`Biểu đồ lịch ôn tập ${rangeDays} ngày; cuộn ngang để xem hết`} tabIndex={0}>
              <div className="schedule-chart-board" style={{ minWidth: `${Math.max(500, schedule.dailyCounts.length * 35 + 48)}px` }}>
                <div className="schedule-y-axis" aria-hidden="true"><span>{maxDailyCount}</span><span>{Math.ceil(maxDailyCount / 2)}</span><span>0</span><small>THẺ</small></div>
                <div className="schedule-chart-days" style={{ gridTemplateColumns: `repeat(${schedule.dailyCounts.length}, minmax(0, 1fr))` }}>
                  {schedule.dailyCounts.map((day, index) => {
                    const dateLabel = getDateLabel(day.date)
                    const isToday = index === 0
                    const isLabelVisible = rangeDays === 7 || index % (rangeDays === 14 ? 2 : 5) === 0 || index === schedule.dailyCounts.length - 1
                    const barHeight = day.dueCount === 0 ? 0 : Math.max(5, (day.dueCount / maxDailyCount) * 100)
                    return (
                      <div className={`schedule-day-column${isToday ? ' schedule-day-today' : ''}`} key={day.date}>
                        <button className="schedule-bar-button" type="button" aria-label={`${day.date}: ${day.dueCount} thẻ đến hạn${isToday ? ', hôm nay' : ''}`} title={`${day.date} · ${day.dueCount} thẻ`}>
                          <span className="schedule-bar-count">{day.dueCount}</span>
                          <span className="schedule-bar-area"><i style={{ height: `${barHeight}%` }} /></span>
                          <span className="schedule-bar-tooltip"><strong>{day.date}</strong><span>{day.dueCount} {day.dueCount === 1 ? 'thẻ' : 'thẻ'} đến hạn</span></span>
                        </button>
                        <span className={`schedule-day-label${isLabelVisible ? '' : ' schedule-day-label-muted'}`} aria-hidden={isLabelVisible ? undefined : true}>{isLabelVisible ? dateLabel : '·'}</span>
                        {isToday && <span className="schedule-today-label">Hôm nay</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="schedule-gridlines" aria-hidden="true"><i /><i /><i /></div>
              </div>
            </div>
            <p className="schedule-chart-footnote">Tổng {schedule.totalDueInRange} bằng tổng số thẻ trong từng cột. Thẻ trùng ID chỉ tính một lần.</p>
          </section>
        ) : null}

        <footer className="schedule-footer"><span>UrSpace · Lịch ôn tập</span><span>Không thay đổi lịch FSRS khi mở biểu đồ</span></footer>
      </div>
    </main>
  )
}

export default ReviewSchedule
