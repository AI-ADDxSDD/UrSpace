import { mockConceptNodes, mockConceptQuizzes } from '../data/mockConceptQuizzes'
import type { ConceptNodeSummary, ConceptQuizSet } from '../types'

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 180))
}

export async function listMockConceptNodes(): Promise<ConceptNodeSummary[]> {
  await mockDelay()
  return mockConceptNodes.map((node) => ({ ...node }))
}

/** Fetches a quiz by its owning ConceptNode ID. Null means the node has no quiz yet. */
export async function getMockConceptQuiz(
  conceptNodeId: string,
): Promise<ConceptQuizSet | null> {
  await mockDelay()
  if (!mockConceptNodes.some((node) => node.conceptNodeId === conceptNodeId)) {
    throw new Error(`Unknown ConceptNode: ${conceptNodeId}`)
  }

  const quiz = mockConceptQuizzes.find((item) => item.conceptNodeId === conceptNodeId)
  return quiz ? { ...quiz, questions: quiz.questions.map((question) => ({ ...question, options: [...question.options] })) } : null
}
