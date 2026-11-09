import { useCallback, useEffect, useRef, useState } from 'react'
import { getMockConceptQuiz } from '../api/mockConceptQuizApi'
import { calculateConceptQuizCompletion, createQuestionResult } from '../helpers/quizResults'
import type {
  ConceptQuizCompletion,
  ConceptQuizProps,
  ConceptQuizQuestionResult,
  ConceptQuizSet,
} from '../types'
import './ConceptQuiz.css'

function ConceptQuiz({
  conceptNodeId,
  onComplete,
  onClose,
  loadQuiz = getMockConceptQuiz,
}: ConceptQuizProps) {
  const [loadState, setLoadState] = useState<
    { conceptNodeId: string; status: 'loading' } |
    { conceptNodeId: string; status: 'error'; message: string } |
    { conceptNodeId: string; status: 'ready'; quiz: ConceptQuizSet | null }
  >({ conceptNodeId, status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [selectionError, setSelectionError] = useState('')
  const [confirmedAnswer, setConfirmedAnswer] = useState<ConceptQuizQuestionResult | null>(null)
  const [answers, setAnswers] = useState<ConceptQuizQuestionResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [closeMessage, setCloseMessage] = useState('')
  const confirmLock = useRef(false)
  const completionSent = useRef(false)

  useEffect(() => {
    let isCurrent = true

    loadQuiz(conceptNodeId)
      .then((loadedQuiz) => {
        if (!isCurrent) return
        setLoadState({ conceptNodeId, status: 'ready', quiz: loadedQuiz })
        setQuestionIndex(0)
        setSelectedOptionId('')
        setSelectionError('')
        setConfirmedAnswer(null)
        setAnswers([])
        setShowResults(false)
        setCloseMessage('')
        confirmLock.current = false
        completionSent.current = false
      })
      .catch(() => {
        if (isCurrent) setLoadState({ conceptNodeId, status: 'error', message: 'Chưa tải được Mini-Quiz. Hãy thử lại.' })
      })

    return () => { isCurrent = false }
  }, [conceptNodeId, loadQuiz, retryToken])

  const isCurrentRequest = loadState.conceptNodeId === conceptNodeId
  const isLoading = !isCurrentRequest || loadState.status === 'loading'
  const loadError = isCurrentRequest && loadState.status === 'error' ? loadState.message : ''
  const quiz = isCurrentRequest && loadState.status === 'ready' ? loadState.quiz : null
  const questions = quiz?.questions ?? []
  const currentQuestion = questions[questionIndex]
  const result = quiz
    ? calculateConceptQuizCompletion(quiz.conceptNodeId, questions.length, answers)
    : null

  const handleConfirm = useCallback(() => {
    if (!currentQuestion || confirmLock.current || confirmedAnswer) return
    if (!selectedOptionId) {
      setSelectionError('Hãy chọn một phương án trước khi xác nhận.')
      return
    }

    confirmLock.current = true
    setSelectionError('')
    const answer = createQuestionResult(currentQuestion, selectedOptionId)
    setConfirmedAnswer(answer)
    setAnswers((current) => [...current, answer])
  }, [currentQuestion, confirmedAnswer, selectedOptionId])

  const handleNext = useCallback(() => {
    if (!confirmedAnswer) return
    if (questionIndex === questions.length - 1) {
      if (!quiz || completionSent.current) return
      const completion: ConceptQuizCompletion = calculateConceptQuizCompletion(
        quiz.conceptNodeId,
        questions.length,
        answers,
      )
      completionSent.current = true
      onComplete?.(completion)
      setShowResults(true)
      return
    }

    setQuestionIndex((index) => index + 1)
    setSelectedOptionId('')
    setSelectionError('')
    setConfirmedAnswer(null)
    confirmLock.current = false
  }, [answers, confirmedAnswer, onComplete, questionIndex, questions.length, quiz])

  const handleRestart = () => {
    setQuestionIndex(0)
    setSelectedOptionId('')
    setSelectionError('')
    setConfirmedAnswer(null)
    setAnswers([])
    setShowResults(false)
    setCloseMessage('')
    confirmLock.current = false
    completionSent.current = false
  }

  const handleClose = () => {
    if (onClose) onClose()
    else setCloseMessage('Chức năng quay về Concept Map chưa được tích hợp.')
  }

  const handleKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('button, input, textarea, select')) return

    if (event.key >= '1' && event.key <= '4' && currentQuestion && !confirmedAnswer) {
      const option = currentQuestion.options[Number(event.key) - 1]
      if (option) {
        event.preventDefault()
        setSelectedOptionId(option.id)
        setSelectionError('')
      }
    }
    if (event.key === 'Enter' && !showResults) {
      event.preventDefault()
      if (confirmedAnswer) handleNext()
      else handleConfirm()
    }
  }

  const reportCompletion = (): void => {
    if (result && !completionSent.current) {
      completionSent.current = true
      onComplete?.(result)
    }
    setShowResults(true)
  }

  return (
    <main className="concept-quiz-page" onKeyDown={handleKeyboard}>
      <header className="quiz-topbar">
        <div className="quiz-brand"><span className="quiz-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>urspace</span></div>
        <span className="quiz-topbar-divider" />
        <span className="quiz-context">Mini-Quiz theo khái niệm</span>
        <button className="quiz-close-link" type="button" onClick={handleClose}>Đóng quiz</button>
      </header>

      <div className="quiz-content">
        {isLoading ? (
          <section className="quiz-state-card" role="status" aria-busy="true">
            <span className="quiz-loader" /><h1>Đang tải câu hỏi…</h1><p>Đang mở quiz cho Concept Node.</p>
          </section>
        ) : loadError ? (
          <section className="quiz-state-card quiz-error-state" role="alert">
            <span className="quiz-state-icon">!</span><h1>Chưa mở được Mini-Quiz</h1><p>{loadError}</p>
            <button className="quiz-primary-button" type="button" onClick={() => { setLoadState({ conceptNodeId, status: 'loading' }); setRetryToken((token) => token + 1) }}>Thử tải lại</button>
          </section>
        ) : !quiz || questions.length === 0 ? (
          <section className="quiz-state-card quiz-empty-state" role="status">
            <span className="quiz-state-icon">?</span><p className="quiz-eyebrow">CONCEPT NODE</p>
            <h1>Chưa có câu hỏi cho khái niệm này</h1>
            <p>Bộ Mini-Quiz sẽ xuất hiện khi node có câu hỏi phù hợp.</p>
            {closeMessage && <p className="quiz-close-message" role="status">{closeMessage}</p>}
            <button className="quiz-secondary-button" type="button" onClick={handleClose}>Quay về Concept Map</button>
          </section>
        ) : showResults && result ? (
          <section className="quiz-results-card" aria-labelledby="quiz-results-title">
            <div className="quiz-results-art" aria-hidden="true"><span>✓</span><i /><i /><i /></div>
            <p className="quiz-eyebrow">KẾT QUẢ MINI-QUIZ</p>
            <h1 id="quiz-results-title">{quiz.conceptName}</h1>
            <p className="quiz-results-intro">Bạn đã hoàn thành lượt tự kiểm tra khái niệm này.</p>
            <div className="quiz-score-grid">
              <div><span>Câu đúng</span><strong className="score-correct">{result.correctCount}</strong></div>
              <div><span>Câu sai</span><strong className="score-incorrect">{result.incorrectCount}</strong></div>
              <div><span>Tổng số câu</span><strong>{result.totalQuestions}</strong></div>
            </div>
            <div className="quiz-accuracy"><div><span>Tỷ lệ đúng</span><strong>{result.accuracyPercent}%</strong></div><div className="quiz-progress-track"><span style={{ width: `${result.accuracyPercent}%` }} /></div></div>
            <p className="quiz-mock-note">Kết quả chỉ lưu trong state của phiên demo. Chưa cập nhật tiến độ hay dữ liệu Backend.</p>
            {closeMessage && <p className="quiz-close-message" role="status">{closeMessage}</p>}
            <div className="quiz-result-actions">
              <button className="quiz-secondary-button" type="button" onClick={handleRestart}>Làm lại</button>
              <button className="quiz-primary-button" type="button" onClick={handleClose}>Đóng / Quay về Concept Map</button>
            </div>
          </section>
        ) : currentQuestion ? (
          <section className="quiz-session-card" aria-labelledby="quiz-question-title">
            <div className="quiz-session-heading">
              <div><p className="quiz-eyebrow">ĐANG TỰ KIỂM TRA</p><h1>{quiz.conceptName}</h1><p>Chọn phương án phù hợp nhất.</p></div>
              <span className="quiz-concept-icon" aria-hidden="true">✦</span>
            </div>
            <div className="quiz-progress-heading"><span>Tiến độ</span><strong>Câu {questionIndex + 1} <i>/</i> {questions.length}</strong></div>
            <div className="quiz-progress-track" role="progressbar" aria-label="Tiến độ câu hỏi" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answers.length}><span style={{ width: `${(answers.length / questions.length) * 100}%` }} /></div>

            <div className="quiz-question-block">
              <span className="quiz-question-kicker">CÂU {String(questionIndex + 1).padStart(2, '0')}</span>
              <h2 id="quiz-question-title">{currentQuestion.prompt}</h2>
              <div className="quiz-options" role="radiogroup" aria-labelledby="quiz-question-title">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOptionId === option.id
                  const isCorrectOption = confirmedAnswer?.correctOptionId === option.id
                  const isWrongSelection = confirmedAnswer?.selectedOptionId === option.id && !confirmedAnswer.isCorrect
                  const stateClass = confirmedAnswer
                    ? isCorrectOption ? ' option-correct' : isWrongSelection ? ' option-incorrect' : ''
                    : isSelected ? ' option-selected' : ''
                  return (
                    <button
                      className={`quiz-option${stateClass}`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      key={option.id}
                      disabled={Boolean(confirmedAnswer)}
                      tabIndex={isSelected || (!selectedOptionId && index === 0) ? 0 : -1}
                      onClick={() => { setSelectedOptionId(option.id); setSelectionError('') }}
                      onFocus={() => {
                        if (!confirmedAnswer) setSelectedOptionId(option.id)
                      }}
                      onKeyDown={(event) => {
                        if (confirmedAnswer) return
                        const digit = Number(event.key)
                        if (digit >= 1 && digit <= currentQuestion.options.length) {
                          event.preventDefault()
                          const nextOption = currentQuestion.options[digit - 1]
                          setSelectedOptionId(nextOption.id)
                          setSelectionError('')
                          return
                        }
                        const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
                        if (!direction) return
                        event.preventDefault()
                        const nextIndex = (index + direction + currentQuestion.options.length) % currentQuestion.options.length
                        const nextOption = currentQuestion.options[nextIndex]
                        setSelectedOptionId(nextOption.id)
                        setSelectionError('')
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus()
                      }}
                    >
                      <span className="quiz-option-key">{index + 1}</span><span className="quiz-option-text">{option.text}</span>
                      {confirmedAnswer && isCorrectOption && <span className="quiz-option-mark" aria-label="Đáp án đúng">✓</span>}
                      {isWrongSelection && <span className="quiz-option-mark" aria-label="Bạn đã chọn">×</span>}
                    </button>
                  )
                })}
              </div>
              {selectionError && <p className="quiz-validation-message" role="alert">{selectionError}</p>}
            </div>

            {confirmedAnswer && (
              <div className={`quiz-feedback${confirmedAnswer.isCorrect ? ' feedback-correct' : ' feedback-incorrect'}`} role="status" aria-live="polite">
                <strong>{confirmedAnswer.isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</strong>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            <footer className="quiz-session-footer">
              <p><span className="quiz-shortcut-hint"><kbd>1</kbd>–<kbd>4</kbd></span> chọn đáp án <span className="quiz-shortcut-hint"><kbd>Enter</kbd></span> xác nhận / tiếp tục</p>
              {!confirmedAnswer ? (
                <button className="quiz-primary-button" type="button" onClick={handleConfirm}>Xác nhận đáp án</button>
              ) : questionIndex < questions.length - 1 ? (
                <button className="quiz-primary-button" type="button" onClick={handleNext}>Câu tiếp theo <span aria-hidden="true">→</span></button>
              ) : (
                <button className="quiz-primary-button" type="button" onClick={reportCompletion}>Xem kết quả <span aria-hidden="true">→</span></button>
              )}
            </footer>
            <p className="quiz-session-note">Bài làm thử nghiệm · Không thay đổi mức độ thành thạo của khái niệm</p>
            {closeMessage && <p className="quiz-close-message" role="status">{closeMessage}</p>}
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default ConceptQuiz
