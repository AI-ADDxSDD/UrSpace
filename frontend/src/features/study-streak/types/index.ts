export type StudyStreakRange = 90 | 365

/** Calendar day already grouped by the learner's account timezone. */
export type DailyStudyActivity = {
  date: string
  sessionCount: number
  reviewedCardCount?: number
}

/** Proposed response contract for GET /api/v1/users/me/study-activity. */
export type StudyActivityResponseDto = {
  timezone: string
  startDate: string
  endDate: string
  dailyActivity: DailyStudyActivity[]
  /** Current consecutive active days through endDate, including an unfinished current day. */
  currentStreak: number
  /** Longest consecutive active-day run in the learner's available history. */
  longestStreak: number
  /** Unique active days inside startDate..endDate. */
  totalActiveDays: number
}

export type StudyStreakLoader = (
  days: StudyStreakRange,
) => Promise<StudyActivityResponseDto>

export type StudyStreakStats = {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
}

export type StudyHeatmapDay = DailyStudyActivity & {
  isActive: boolean
  activityLevel: 0 | 1 | 2 | 3 | 4
}

export type StudyHeatmapWeek = {
  days: Array<StudyHeatmapDay | null>
  monthLabel: string
}
