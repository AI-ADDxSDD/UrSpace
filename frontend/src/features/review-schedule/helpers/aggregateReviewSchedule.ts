import type {
  DailyReviewCount,
  ReviewDueCard,
  ReviewScheduleRange,
  UpcomingReviewScheduleDto,
} from '../types'

export function toUtcDateKey(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`)
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
  }

  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function addUtcDays(dateKey: string, days: number): string {
  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`)
  return new Date(timestamp + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Groups existing due dates only. Duplicate card IDs are counted once; if duplicate
 * rows disagree, the earliest valid due date wins so ordering cannot change totals.
 */
export function aggregateReviewSchedule(
  records: readonly ReviewDueCard[],
  rangeDays: ReviewScheduleRange,
  now: Date = new Date(),
): UpcomingReviewScheduleDto {
  const asOfDateUtc = now.toISOString().slice(0, 10)
  const dailyCounts: DailyReviewCount[] = Array.from({ length: rangeDays }, (_, index) => ({
    date: addUtcDays(asOfDateUtc, index),
    dueCount: 0,
  }))
  const countsByDate = new Map(dailyCounts.map((item) => [item.date, item]))
  const uniqueCards = new Map<string, string>()
  const validRows = records
    .map((record) => ({ id: record.flashcardId.trim(), date: toUtcDateKey(record.dueDate) }))
    .filter((record): record is { id: string; date: string } => Boolean(record.id && record.date))
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))

  for (const record of validRows) {
    if (!uniqueCards.has(record.id)) uniqueCards.set(record.id, record.date)
  }

  let overdueCount = 0
  for (const dueDate of uniqueCards.values()) {
    if (dueDate < asOfDateUtc) {
      overdueCount += 1
      continue
    }
    const dailyCount = countsByDate.get(dueDate)
    if (dailyCount) dailyCount.dueCount += 1
  }

  const dueTodayCount = dailyCounts[0]?.dueCount ?? 0
  const totalDueInRange = dailyCounts.reduce((total, day) => total + day.dueCount, 0)

  return {
    asOfDateUtc,
    timezone: 'UTC',
    rangeDays,
    overdueCount,
    dueTodayCount,
    upcomingCount: totalDueInRange - dueTodayCount,
    totalDueInRange,
    dailyCounts,
  }
}
