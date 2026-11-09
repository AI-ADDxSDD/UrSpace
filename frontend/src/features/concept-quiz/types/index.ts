export type ConceptNodeSummary = {
  conceptNodeId: string
  name: string
  description: string
  subject: string
  hasQuiz: boolean
}

export type ConceptQuizOption = {
  id: string
  text: string
}

export type ConceptQuizQuestion = {
  questionId: string
  conceptNodeId: string
  prompt: string
  options: ConceptQuizOption[]
  correctOptionId: string
  explanation: string
}

export type ConceptQuizSet = {
  conceptNodeId: string
  conceptName: string
  questions: ConceptQuizQuestion[]
}

export type ConceptQuizQuestionResult = {
  questionId: string
  selectedOptionId: string
  correctOptionId: string
  isCorrect: boolean
}

export type ConceptQuizCompletion = {
  conceptNodeId: string
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  accuracyPercent: number
  answers: ConceptQuizQuestionResult[]
}

export type ConceptQuizLoader = (
  conceptNodeId: string,
) => Promise<ConceptQuizSet | null>

export type ConceptQuizCompleteHandler = (
  completion: ConceptQuizCompletion,
) => void

export type ConceptQuizProps = {
  conceptNodeId: string
  onComplete?: ConceptQuizCompleteHandler
  onClose?: () => void
  loadQuiz?: ConceptQuizLoader
}
