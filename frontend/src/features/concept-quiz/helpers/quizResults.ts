import type {
  ConceptQuizCompletion,
  ConceptQuizQuestion,
  ConceptQuizQuestionResult,
} from '../types'

export function createQuestionResult(
  question: ConceptQuizQuestion,
  selectedOptionId: string,
): ConceptQuizQuestionResult {
  return {
    questionId: question.questionId,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    isCorrect: selectedOptionId === question.correctOptionId,
  }
}

export function calculateConceptQuizCompletion(
  conceptNodeId: string,
  totalQuestions: number,
  answers: ConceptQuizQuestionResult[],
): ConceptQuizCompletion {
  const correctCount = answers.filter((answer) => answer.isCorrect).length
  const answeredCount = answers.length

  return {
    conceptNodeId,
    totalQuestions,
    correctCount,
    incorrectCount: answeredCount - correctCount,
    accuracyPercent: answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100),
    answers: answers.map((answer) => ({ ...answer })),
  }
}
