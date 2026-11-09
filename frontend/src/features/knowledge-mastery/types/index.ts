export type MasteryLevel = 'unlearned' | 'needs_review' | 'in_progress' | 'mastered'

/**
 * Demo threshold definition for visual classification in Frontend.
 * Requirement 10: These thresholds are for demo display only;
 * Backend ASP.NET Core FSRS Retrievability engine will govern actual thresholds.
 */
export type DemoThresholdConfig = {
  unlearnedScore: 0
  needsReviewMaxScore: 49
  inProgressMaxScore: 79
  masteredMinScore: 80
  notice: string
}

/** Individual Concept Node with mastery state and learning metadata. */
export type ConceptMasteryNode = {
  conceptNodeId: string
  name: string
  subject: string
  topic: string
  level: MasteryLevel
  /** Illustrative mastery percentage (0 - 100) from mock API */
  masteryScore: number
  cardCount: number
  lastReviewedAt: string | null
  nextReviewDue: string | null
  retentionRate: number | null
  recommendedAction: string
  description: string
}

/** Distribution summary across all concept nodes. */
export type MasteryDistributionDto = {
  unlearned: number
  needsReview: number
  inProgress: number
  mastered: number
  unlearnedPercentage: number
  needsReviewPercentage: number
  inProgressPercentage: number
  masteredPercentage: number
}

/**
 * Proposed Backend API Contract for GET /api/v1/concepts/mastery.
 * Note: DTO prepares frontend for future C# ASP.NET Core Web API integration.
 */
export type ConceptMasteryResponseDto = {
  totalNodes: number
  averageMasteryScore: number
  distribution: MasteryDistributionDto
  nodes: ConceptMasteryNode[]
  subjects: string[]
  topics: string[]
  demoThresholds: DemoThresholdConfig
  disclaimer: string
}

export type KnowledgeMasteryFilter = {
  subject: string
  level: 'all' | MasteryLevel
  searchQuery: string
}

export type KnowledgeMasteryLoader = () => Promise<ConceptMasteryResponseDto>
