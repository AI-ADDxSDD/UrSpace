import assert from 'node:assert/strict'
import test from 'node:test'
import { mockConceptNodes, mockConceptQuizzes } from '../src/features/concept-quiz/data/mockConceptQuizzes.ts'
import { calculateConceptQuizCompletion, createQuestionResult } from '../src/features/concept-quiz/helpers/quizResults.ts'

test('mock quiz banks are attached to ConceptNode IDs and contain 3 to 5 questions', async () => {
  const nodes = mockConceptNodes
  assert.ok(nodes.length >= 3)

  const quizNodes = nodes.filter((node) => node.hasQuiz)
  for (const node of quizNodes) {
    const quiz = mockConceptQuizzes.find((item) => item.conceptNodeId === node.conceptNodeId)
    assert.ok(quiz)
    assert.equal(quiz.conceptNodeId, node.conceptNodeId)
    assert.ok(quiz.questions.length >= 3 && quiz.questions.length <= 5)
    assert.ok(quiz.questions.every((question) => question.conceptNodeId === node.conceptNodeId))
    assert.ok(quiz.questions.every((question) => question.options.some((option) => option.id === question.correctOptionId)))
  }
})

test('records correct and incorrect answers and computes a 3-question result', async () => {
  const quiz = mockConceptQuizzes.find((item) => item.conceptNodeId === 'concept-cell-membrane')
  assert.ok(quiz)
  const answers = [
    createQuestionResult(quiz.questions[0], quiz.questions[0].correctOptionId),
    createQuestionResult(quiz.questions[1], 'a'),
    createQuestionResult(quiz.questions[2], quiz.questions[2].correctOptionId),
  ]
  const result = calculateConceptQuizCompletion(quiz.conceptNodeId, quiz.questions.length, answers)

  assert.equal(answers[0].isCorrect, true)
  assert.equal(answers[1].isCorrect, false)
  assert.equal(result.correctCount, 2)
  assert.equal(result.incorrectCount, 1)
  assert.equal(result.totalQuestions, 3)
  assert.equal(result.accuracyPercent, 67)
  assert.equal(result.answers.length, 3)
})

test('computes score from the five answers actually recorded in the session', async () => {
  const quiz = mockConceptQuizzes.find((item) => item.conceptNodeId === 'concept-acid-base')
  assert.ok(quiz)
  const answers = quiz.questions.map((question, index) =>
    createQuestionResult(question, index === 1 ? 'a' : question.correctOptionId),
  )
  const result = calculateConceptQuizCompletion(quiz.conceptNodeId, quiz.questions.length, answers)

  assert.equal(result.totalQuestions, 5)
  assert.equal(result.correctCount, 4)
  assert.equal(result.incorrectCount, 1)
  assert.equal(result.accuracyPercent, 80)
})

test('returns a safe zero rate when a node has no questions or no answers', async () => {
  const emptyNode = mockConceptNodes.find((node) => node.conceptNodeId === 'concept-without-quiz')
  assert.equal(emptyNode.hasQuiz, false)
  assert.equal(mockConceptQuizzes.some((quiz) => quiz.conceptNodeId === emptyNode.conceptNodeId), false)
  assert.deepEqual(calculateConceptQuizCompletion('concept-empty', 0, []), {
    conceptNodeId: 'concept-empty',
    totalQuestions: 0,
    correctCount: 0,
    incorrectCount: 0,
    accuracyPercent: 0,
    answers: [],
  })
})
