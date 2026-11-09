import { useEffect, useMemo, useState } from 'react'
import { getMockStudyStreak } from '../api/mockStudyStreakApi'
import { buildStudyHeatmapWeeks } from '../helpers/studyStreakCalendar'
import type {
  StudyActivityResponseDto,
  StudyStreakLoader,
  StudyStreakRange,
} from '../types'
import './StudyStreak.css'

type StudyStreakProps = {
  loadStreak?: StudyStreakLoader
}

type LoadState =
  | { days: StudyStreakRange; status: 'loading' }
  | { days: StudyStreakRange; status: 'error'; message: string }
  | { days: StudyStreakRange; status: 'ready'; response: StudyActivityResponseDto }

const rangeOptions: Array<{ value: StudyStreakRange; label: string }> = [
  { value: 90, label: '90 ngày' },
  { value: 365, label: '365 ngày' },
]

const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getActivityDescription(
  date: string,
  sessionCount: number,
  reviewedCardCount?: number,
): string {
  const sessions = sessionCount === 0 ? 'không có lượt học' : `${sessionCount} ${sessionCount === 1 ? 'lượt học' : 'lượt học'}`
  const reviewed = reviewedCardCount === undefined ? '' : `, ${reviewedCardCount} thẻ đã ôn`
  return `${date}: ${sessions}${reviewed}`
}

function StudyStreak({ loadStreak = getMockStudyStreak }: StudyStreakProps) {
  const [days, setDays] = useState<StudyStreakRange>(90)
  const [retryToken, setRetryToken] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ days: 90, status: 'loading' })
  const [focusedDate, setFocusedDate] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    loadStreak(days)
      .then((response) => {
        if (isCurrent) setLoadState({ days, status: 'ready', response })
      })
      .catch(() => {
        if (isCurrent) setLoadState({ days, status: 'error', message: 'Chưa tải được lịch sử học tập. Hãy thử lại.' })
      })

    return () => { isCurrent = false }
  }, [days, loadStreak, retryToken])

  const isCurrentRange = loadState.days === days
  const isLoading = !isCurrentRange || loadState.status === 'loading'
  const errorMessage = isCurrentRange && loadState.status === 'error' ? loadState.message : ''
  const response = isCurrentRange && loadState.status === 'ready' ? loadState.response : null
  const weeks = useMemo(
    () => response ? buildStudyHeatmapWeeks(response.dailyActivity, response.startDate, response.endDate) : [],
    [response],
  )
  const calendarCells = weeks.flatMap((week) => week.days)
  const focusableDays = calendarCells.filter((day) => day !== null)
  const activeFocusDate = focusableDays.some((day) => day.date === focusedDate)
    ? focusedDate
    : focusableDays[0]?.date ?? null
  const hasActiveDays = Boolean(response && response.totalActiveDays > 0)

  const handleRefresh = () => {
    setLoadState({ days, status: 'loading' })
    setRetryToken((token) => token + 1)
  }

  const handleHeatmapKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLButtonElement)) return
    const currentDate = event.target.dataset.date
    const currentIndex = calendarCells.findIndex((cell) => cell?.date === currentDate)
    if (currentIndex < 0) return

    const offsetByKey: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
    }
    const offset = offsetByKey[event.key]
    if (offset === undefined) return
    event.preventDefault()

    let nextIndex = currentIndex + offset
    while (nextIndex >= 0 && nextIndex < calendarCells.length && calendarCells[nextIndex] === null) {
      nextIndex += offset > 0 ? 1 : -1
    }
    const nextDate = calendarCells[nextIndex]?.date
    if (!nextDate) return
    setFocusedDate(nextDate)
    document.getElementById(`study-activity-date-${nextDate}`)?.focus()
  }

  return (
    <main className="study-streak-page">
      <header className="streak-topbar">
        <div className="streak-brand"><span className="streak-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>urspace</span></div>
        <span className="streak-divider" />
        <span className="streak-context">Hoạt động học tập</span>
        <span className="streak-mock-pill"><i /> DỮ LIỆU MINH HỌA</span>
      </header>

      <div className="streak-content">
        <section className="streak-heading">
          <div>
            <p className="streak-eyebrow">THÓI QUEN HỌC TẬP</p>
            <h1>Chuỗi ngày học tập</h1>
            <p>Theo dõi nhịp học qua từng ngày, không bỏ lỡ những bước tiến nhỏ.</p>
          </div>
          <div className="streak-heading-actions">
            <label htmlFor="streak-range">Khoảng thời gian</label>
            <select id="streak-range" value={days} onChange={(event) => setDays(Number(event.target.value) as StudyStreakRange)}>
              {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button className="streak-refresh-button" type="button" onClick={handleRefresh} disabled={isLoading} aria-label="Làm mới dữ liệu học tập">
              <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M14.8 7A6 6 0 0 0 4.4 4.5L3 6M3 3v3h3M3.2 11A6 6 0 0 0 13.6 13.5L15 12m0 3v-3h-3" /></svg>
              {isLoading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </section>

        <div className="streak-mock-notice" role="note">
          <span aria-hidden="true">i</span>
          Dữ liệu trong phiên Mock chỉ minh họa giao diện, không phải lịch sử của tài khoản thật. Một ngày được tính hoạt động khi có ít nhất một lượt học hoàn thành; quy tắc này cần Backend xác nhận.
        </div>

        {response && (
          <section className="streak-stats" aria-label="Thống kê chuỗi học">
            <article className="streak-stat streak-stat-current"><span className="streak-stat-icon" aria-hidden="true">✦</span><span className="streak-stat-label">Current Streak</span><strong>{response.currentStreak}<small> ngày</small></strong><span className="streak-stat-caption">Tính đến {response.endDate}</span></article>
            <article className="streak-stat streak-stat-longest"><span className="streak-stat-icon" aria-hidden="true">↗</span><span className="streak-stat-label">Longest Streak</span><strong>{response.longestStreak}<small> ngày</small></strong><span className="streak-stat-caption">Chuỗi dài nhất trong lịch sử</span></article>
            <article className="streak-stat streak-stat-active"><span className="streak-stat-icon" aria-hidden="true">▦</span><span className="streak-stat-label">Total Active Days</span><strong>{response.totalActiveDays}<small> ngày</small></strong><span className="streak-stat-caption">Trong {days} ngày đang xem</span></article>
          </section>
        )}

        {isLoading ? (
          <section className="streak-panel streak-loading" role="status" aria-busy="true">
            <div className="streak-panel-heading"><div><span className="streak-skeleton-line" /><span className="streak-skeleton-line streak-skeleton-short" /></div><span className="streak-loader" /></div>
            <div className="streak-skeleton-heatmap"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <p>Đang tải hoạt động học tập…</p>
          </section>
        ) : errorMessage ? (
          <section className="streak-panel streak-state-panel" role="alert">
            <span className="streak-state-icon streak-error-icon">!</span><h2>Không thể tải lịch sử học</h2><p>{errorMessage}</p>
            <button className="streak-primary-button" type="button" onClick={handleRefresh}>Thử tải lại</button>
          </section>
        ) : response ? (
          <section className="streak-panel" aria-labelledby="streak-heatmap-title">
            <div className="streak-panel-heading">
              <div><p className="streak-eyebrow">NHỊP HỌC CỦA BẠN</p><h2 id="streak-heatmap-title">Hoạt động trong {days} ngày qua</h2><p>Múi giờ lịch: {response.timezone} · {response.startDate} — {response.endDate}</p></div>
              <div className="streak-panel-total"><strong>{response.totalActiveDays}</strong><span>ngày hoạt động</span></div>
            </div>
            {!hasActiveDays && <div className="streak-empty-note" role="status">Chưa có ngày học nào trong khoảng thời gian này. Các ô trung tính biểu thị ngày chưa ghi nhận hoạt động.</div>}
            {hasActiveDays && <div className="streak-empty-note streak-empty-note-success" role="note">Mỗi ô có hoạt động tương ứng ít nhất một lượt học hoàn thành.</div>}

            <div className="streak-heatmap-scroll" role="region" aria-label={`Heatmap hoạt động học ${days} ngày. Dùng phím mũi tên để di chuyển giữa các ngày.`}>
              <div className="streak-calendar-layout">
                <div className="streak-weekday-labels" aria-hidden="true">
                  <span className="streak-label-spacer" />
                  {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
                </div>
                <div className="streak-calendar-scroll" tabIndex={0} onKeyDown={handleHeatmapKeyDown}>
                  <div className="streak-calendar-inner" style={{ minWidth: `${Math.max(300, weeks.length * 19)}px` }}>
                    <div className="streak-month-row" style={{ gridTemplateColumns: `repeat(${weeks.length}, 15px)` }} aria-hidden="true">
                      {weeks.map((week, index) => <span key={`${week.monthLabel}-${index}`}>{week.monthLabel}</span>)}
                    </div>
                    <div className="streak-week-columns" aria-label="Lịch học theo ngày">
                      {weeks.map((week, weekIndex) => (
                        <div className="streak-week-column" key={`week-${weekIndex}`}>
                          {week.days.map((day, weekdayIndex) => day ? (
                            <button
                              className={`streak-day-cell streak-level-${day.activityLevel}`}
                              type="button"
                              key={day.date}
                              id={`study-activity-date-${day.date}`}
                              data-date={day.date}
                              tabIndex={day.date === activeFocusDate ? 0 : -1}
                              aria-label={getActivityDescription(day.date, day.sessionCount, day.reviewedCardCount)}
                              title={getActivityDescription(day.date, day.sessionCount, day.reviewedCardCount)}
                              onFocus={() => setFocusedDate(day.date)}
                            />
                          ) : <span className="streak-day-placeholder" key={`empty-${weekIndex}-${weekdayIndex}`} aria-hidden="true" />)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="streak-heatmap-footer">
              <span>Ngày ít hoạt động</span>
              <div className="streak-legend" aria-label="Chú giải mức hoạt động">
                <span className="streak-level-0" aria-label="Không có lượt học" />
                <span className="streak-level-1" aria-label="1 lượt học" />
                <span className="streak-level-2" aria-label="2 lượt học" />
                <span className="streak-level-3" aria-label="3 đến 4 lượt học" />
                <span className="streak-level-4" aria-label="5 lượt học trở lên" />
              </div>
              <span>Nhiều hoạt động</span>
            </div>
            <p className="streak-footnote">Cường độ màu dựa trên số lượt học hoàn thành trong ngày. Số thẻ ôn tập hiển thị khi dữ liệu nguồn cung cấp.</p>
          </section>
        ) : null}

        <footer className="streak-footer"><span>UrSpace · Study Streak</span><span>Không tạo hoặc cập nhật dữ liệu học tập ở Frontend</span></footer>
      </div>
    </main>
  )
}

export default StudyStreak
