import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEMO_MASTERY_THRESHOLDS,
  calculateMasteryDistribution,
  filterConceptNodes,
  getMasteryLevelMeta,
  groupNodesByTopic,
  normalizeSearchString,
} from '../src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts'

const sampleNodes = [
  {
    conceptNodeId: 'node-1',
    name: 'Màng tế bào',
    subject: 'Sinh học',
    topic: 'Tế bào',
    level: 'mastered',
    masteryScore: 90,
    cardCount: 10,
    lastReviewedAt: '2026-11-01',
    nextReviewDue: '2026-11-15',
    retentionRate: 95,
    recommendedAction: 'Duy trì',
    description: 'Cấu trúc màng',
  },
  {
    conceptNodeId: 'node-2',
    name: 'Ty thể',
    subject: 'Sinh học',
    topic: 'Tế bào',
    level: 'in_progress',
    masteryScore: 70,
    cardCount: 8,
    lastReviewedAt: '2026-11-02',
    nextReviewDue: '2026-11-09',
    retentionRate: 75,
    recommendedAction: 'Ôn thêm',
    description: 'Hô hấp tế bào',
  },
  {
    conceptNodeId: 'node-3',
    name: 'Định luật Newton',
    subject: 'Vật lý',
    topic: 'Cơ học',
    level: 'needs_review',
    masteryScore: 40,
    cardCount: 12,
    lastReviewedAt: '2026-10-20',
    nextReviewDue: '2026-10-27',
    retentionRate: 45,
    recommendedAction: 'Ôn gấp',
    description: 'Ba định luật',
  },
  {
    conceptNodeId: 'node-4',
    name: 'Phương trình Maxwell',
    subject: 'Vật lý',
    topic: 'Điện từ',
    level: 'unlearned',
    masteryScore: 0,
    cardCount: 15,
    lastReviewedAt: null,
    nextReviewDue: null,
    retentionRate: null,
    recommendedAction: 'Bắt đầu',
    description: 'Hệ phương trình',
  },
]

test('calculates concept mastery distribution counts and percentages', () => {
  const { distribution, averageMasteryScore } = calculateMasteryDistribution(sampleNodes)

  assert.equal(distribution.unlearned, 1)
  assert.equal(distribution.needsReview, 1)
  assert.equal(distribution.inProgress, 1)
  assert.equal(distribution.mastered, 1)

  // 1 out of 4 = 25.0% each
  assert.equal(distribution.unlearnedPercentage, 25.0)
  assert.equal(distribution.needsReviewPercentage, 25.0)
  assert.equal(distribution.inProgressPercentage, 25.0)
  assert.equal(distribution.masteredPercentage, 25.0)

  // (90 + 70 + 40 + 0) / 4 = 50.0
  assert.equal(averageMasteryScore, 50.0)
})

test('safely handles empty concept node list without division by zero or NaN', () => {
  const { distribution, averageMasteryScore } = calculateMasteryDistribution([])

  assert.equal(distribution.unlearned, 0)
  assert.equal(distribution.needsReview, 0)
  assert.equal(distribution.inProgress, 0)
  assert.equal(distribution.mastered, 0)
  assert.equal(distribution.unlearnedPercentage, 0)
  assert.equal(distribution.needsReviewPercentage, 0)
  assert.equal(distribution.inProgressPercentage, 0)
  assert.equal(distribution.masteredPercentage, 0)
  assert.equal(averageMasteryScore, 0)
})

test('filters concept nodes by subject and mastery level', () => {
  // Filter by subject
  const bioNodes = filterConceptNodes(sampleNodes, {
    subject: 'Sinh học',
    level: 'all',
    searchQuery: '',
  })
  assert.equal(bioNodes.length, 2)
  assert.ok(bioNodes.every((n) => n.subject === 'Sinh học'))

  // Filter by level
  const masteredNodes = filterConceptNodes(sampleNodes, {
    subject: 'all',
    level: 'mastered',
    searchQuery: '',
  })
  assert.equal(masteredNodes.length, 1)
  assert.equal(masteredNodes[0].name, 'Màng tế bào')

  // Filter by both subject and level
  const bioNeedsReview = filterConceptNodes(sampleNodes, {
    subject: 'Sinh học',
    level: 'needs_review',
    searchQuery: '',
  })
  assert.equal(bioNeedsReview.length, 0)
})

test('performs case-insensitive and diacritic-tolerant search filtering', () => {
  // Search without diacritics: "mang te bao" -> matches "Màng tế bào"
  const searchResult = filterConceptNodes(sampleNodes, {
    subject: 'all',
    level: 'all',
    searchQuery: 'mang te bao',
  })
  assert.equal(searchResult.length, 1)
  assert.equal(searchResult[0].conceptNodeId, 'node-1')

  // Search by topic
  const topicResult = filterConceptNodes(sampleNodes, {
    subject: 'all',
    level: 'all',
    searchQuery: 'co hoc',
  })
  assert.equal(topicResult.length, 1)
  assert.equal(topicResult[0].conceptNodeId, 'node-3')

  // Unmatched query
  const emptyResult = filterConceptNodes(sampleNodes, {
    subject: 'all',
    level: 'all',
    searchQuery: 'khong ton tai',
  })
  assert.equal(emptyResult.length, 0)
})

test('groups concept nodes by subject and topic', () => {
  const groups = groupNodesByTopic(sampleNodes)

  // Sinh học__Tế bào (2 nodes), Vật lý__Cơ học (1 node), Vật lý__Điện từ (1 node)
  assert.equal(groups.length, 3)

  const cellGroup = groups.find((g) => g.topic === 'Tế bào')
  assert.ok(cellGroup)
  assert.equal(cellGroup.nodes.length, 2)
  // Average score: (90 + 70) / 2 = 80
  assert.equal(cellGroup.averageScore, 80)
})

test('validates mastery level metadata and demo thresholds', () => {
  const unlearnedMeta = getMasteryLevelMeta('unlearned')
  assert.equal(unlearnedMeta.label, 'Chưa học')

  const needsReviewMeta = getMasteryLevelMeta('needs_review')
  assert.equal(needsReviewMeta.label, 'Cần ôn tập')

  const inProgressMeta = getMasteryLevelMeta('in_progress')
  assert.equal(inProgressMeta.label, 'Đang tiến bộ')

  const masteredMeta = getMasteryLevelMeta('mastered')
  assert.equal(masteredMeta.label, 'Thành thạo')

  assert.equal(DEMO_MASTERY_THRESHOLDS.unlearnedScore, 0)
  assert.equal(DEMO_MASTERY_THRESHOLDS.needsReviewMaxScore, 49)
  assert.equal(DEMO_MASTERY_THRESHOLDS.inProgressMaxScore, 79)
  assert.equal(DEMO_MASTERY_THRESHOLDS.masteredMinScore, 80)
})
