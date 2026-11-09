import type {
  ConceptMasteryNode,
  DemoThresholdConfig,
  KnowledgeMasteryFilter,
  MasteryDistributionDto,
  MasteryLevel,
} from '../types'

export const DEMO_MASTERY_THRESHOLDS: DemoThresholdConfig = {
  unlearnedScore: 0,
  needsReviewMaxScore: 49,
  inProgressMaxScore: 79,
  masteredMinScore: 80,
  notice:
    'Ngưỡng phân cấp demo: Chưa học (0%), Cần ôn tập (1-49%), Đang tiến bộ (50-79%), Thành thạo (80-100%). Ngưỡng thực tế sẽ do Backend xác nhận theo FSRS retrievability.',
}

export type MasteryLevelMeta = {
  label: string
  shortLabel: string
  cssClass: string
  badgeClass: string
  color: string
  description: string
}

export const MASTERY_LEVEL_CONFIG: Record<MasteryLevel, MasteryLevelMeta> = {
  unlearned: {
    label: 'Chưa học',
    shortLabel: 'Chưa học',
    cssClass: 'mastery-level-unlearned',
    badgeClass: 'mastery-badge-unlearned',
    color: '#94a3b8',
    description: 'Chưa bắt đầu học hoặc chưa có lượt ôn nào',
  },
  needs_review: {
    label: 'Cần ôn tập',
    shortLabel: 'Cần ôn',
    cssClass: 'mastery-level-needs-review',
    badgeClass: 'mastery-badge-needs-review',
    color: '#f59e0b',
    description: 'Khả năng ghi nhớ suy giảm dưới ngưỡng an toàn, cần ôn tập gấp',
  },
  in_progress: {
    label: 'Đang tiến bộ',
    shortLabel: 'Tiến bộ',
    cssClass: 'mastery-level-in-progress',
    badgeClass: 'mastery-badge-in-progress',
    color: '#3b82f6',
    description: 'Đã ôn tập tốt một số lượt, đang trong giai đoạn củng cố',
  },
  mastered: {
    label: 'Thành thạo',
    shortLabel: 'Thành thạo',
    cssClass: 'mastery-level-mastered',
    badgeClass: 'mastery-badge-mastered',
    color: '#10b981',
    description: 'Trí nhớ dài hạn vững chắc, tỷ lệ nhớ cao',
  },
}

export function getMasteryLevelMeta(level: MasteryLevel): MasteryLevelMeta {
  return MASTERY_LEVEL_CONFIG[level] ?? MASTERY_LEVEL_CONFIG.unlearned
}

/**
 * Calculates distribution counts and percentages safely, handling empty lists without NaN.
 */
export function calculateMasteryDistribution(nodes: ConceptMasteryNode[]): {
  distribution: MasteryDistributionDto
  averageMasteryScore: number
} {
  const total = nodes.length

  let unlearned = 0
  let needsReview = 0
  let inProgress = 0
  let mastered = 0
  let scoreSum = 0

  for (const node of nodes) {
    scoreSum += node.masteryScore
    switch (node.level) {
      case 'unlearned':
        unlearned += 1
        break
      case 'needs_review':
        needsReview += 1
        break
      case 'in_progress':
        inProgress += 1
        break
      case 'mastered':
        mastered += 1
        break
    }
  }

  const calcPercent = (count: number): number => {
    if (total === 0) return 0
    return Math.round((count / total) * 1000) / 10
  }

  const averageMasteryScore = total === 0 ? 0 : Math.round((scoreSum / total) * 10) / 10

  return {
    distribution: {
      unlearned,
      needsReview,
      inProgress,
      mastered,
      unlearnedPercentage: calcPercent(unlearned),
      needsReviewPercentage: calcPercent(needsReview),
      inProgressPercentage: calcPercent(inProgress),
      masteredPercentage: calcPercent(mastered),
    },
    averageMasteryScore,
  }
}

/**
 * Normalizes string for search comparison (lowercase and removes common diacritics).
 */
export function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Filters concept nodes by subject, mastery level, and search term.
 */
export function filterConceptNodes(
  nodes: ConceptMasteryNode[],
  filter: KnowledgeMasteryFilter,
): ConceptMasteryNode[] {
  const normQuery = normalizeSearchString(filter.searchQuery)

  return nodes.filter((node) => {
    // Subject filter
    if (filter.subject !== 'all' && node.subject !== filter.subject) {
      return false
    }

    // Level filter
    if (filter.level !== 'all' && node.level !== filter.level) {
      return false
    }

    // Search query filter
    if (normQuery.length > 0) {
      const matchName = normalizeSearchString(node.name).includes(normQuery)
      const matchTopic = normalizeSearchString(node.topic).includes(normQuery)
      const matchSubject = normalizeSearchString(node.subject).includes(normQuery)
      if (!matchName && !matchTopic && !matchSubject) {
        return false
      }
    }

    return true
  })
}

export type TopicGroup = {
  subject: string
  topic: string
  nodes: ConceptMasteryNode[]
  averageScore: number
}

/**
 * Groups concept nodes by Subject & Topic for structured heatmap grid presentation.
 */
export function groupNodesByTopic(nodes: ConceptMasteryNode[]): TopicGroup[] {
  const groupMap = new Map<string, { subject: string; topic: string; nodes: ConceptMasteryNode[] }>()

  for (const node of nodes) {
    const key = `${node.subject}__${node.topic}`
    const existing = groupMap.get(key)
    if (existing) {
      existing.nodes.push(node)
    } else {
      groupMap.set(key, {
        subject: node.subject,
        topic: node.topic,
        nodes: [node],
      })
    }
  }

  const groups: TopicGroup[] = []
  for (const group of groupMap.values()) {
    const totalScore = group.nodes.reduce((sum, n) => sum + n.masteryScore, 0)
    const averageScore = group.nodes.length > 0 ? Math.round(totalScore / group.nodes.length) : 0
    groups.push({
      subject: group.subject,
      topic: group.topic,
      nodes: group.nodes,
      averageScore,
    })
  }

  return groups
}
