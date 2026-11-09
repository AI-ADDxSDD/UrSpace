import { useEffect, useRef, useState } from 'react'
import { submitFlashcardReportMock } from '../api/mockCardReportsApi'
import { MAX_REPORT_TEXT_LENGTH, validateFlashcardReport } from '../helpers/validateFlashcardReport'
import type {
  FlashcardReport,
  FlashcardReportFormErrors,
  FlashcardReportFormValues,
  FlashcardReportReason,
  FlashcardReportSubmitter,
  ReportableFlashcard,
  SubmitFlashcardReportRequest,
} from '../types'
import './FlashcardReportModal.css'

type FlashcardReportModalProps = {
  flashcard: ReportableFlashcard
  onClose: () => void
  submitReport?: FlashcardReportSubmitter
}

const reasonOptions: { value: FlashcardReportReason; label: string; detail: string }[] = [
  { value: 'incorrect-knowledge', label: 'Nội dung sai kiến thức', detail: 'Thông tin hoặc dữ kiện không đúng.' },
  { value: 'incorrect-answer', label: 'Đáp án không chính xác', detail: 'Đáp án không khớp với câu hỏi.' },
  { value: 'unclear-question', label: 'Câu hỏi không rõ ràng', detail: 'Câu hỏi mơ hồ hoặc khó hiểu.' },
  { value: 'inappropriate-content', label: 'Nội dung không phù hợp', detail: 'Có nội dung cần được xem xét.' },
  { value: 'other', label: 'Lý do khác', detail: 'Báo cáo vấn đề khác về thẻ.' },
]

const initialValues: FlashcardReportFormValues = {
  reason: '',
  description: '',
  suggestedCorrection: '',
}

function FlashcardReportModal({
  flashcard,
  onClose,
  submitReport = submitFlashcardReportMock,
}: FlashcardReportModalProps) {
  const [values, setValues] = useState<FlashcardReportFormValues>(initialValues)
  const [errors, setErrors] = useState<FlashcardReportFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedReport, setSubmittedReport] = useState<FlashcardReport | null>(null)
  const submitLock = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const updateValue = <Field extends keyof FlashcardReportFormValues>(
    field: Field,
    value: FlashcardReportFormValues[Field],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError('')
  }

  const handleSubmit = async (): Promise<void> => {
    if (submitLock.current || submittedReport) return

    const validationErrors = validateFlashcardReport(values)
    setErrors(validationErrors)
    setSubmitError('')
    if (Object.keys(validationErrors).length > 0 || !values.reason) return

    submitLock.current = true
    setIsSubmitting(true)

    const request: SubmitFlashcardReportRequest = {
      flashcardId: flashcard.flashcardId,
      deckId: flashcard.deckId,
      reason: values.reason,
      description: values.description.trim(),
      suggestedCorrection: values.suggestedCorrection.trim(),
    }

    try {
      setSubmittedReport(await submitReport(request))
    } catch {
      setSubmitError('Chưa gửi được báo cáo. Nội dung vẫn còn ở đây để bạn thử lại.')
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (!isSubmitting) onClose()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (!firstElement || !lastElement) return

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return (
    <div
      className="flashcard-report-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <section
        className="flashcard-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-report-title"
        aria-describedby="flashcard-report-intro"
        ref={dialogRef}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="report-modal-header">
          <div className="report-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3.5 21 20H3l9-16.5Z" /><path d="M12 9v4.5M12 17h.01" /></svg>
          </div>
          <div className="report-header-copy">
            <p className="report-eyebrow">GÓP Ý CỘNG ĐỒNG</p>
            <h2 id="flashcard-report-title">Báo cáo thẻ sai</h2>
            <p id="flashcard-report-intro">Giúp UrSpace cải thiện chất lượng nội dung học tập.</p>
          </div>
          <button
            ref={closeButtonRef}
            className="report-close-button"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng báo cáo"
          >
            ×
          </button>
        </header>

        {submittedReport ? (
          <div className="report-success-state" role="status" aria-live="polite">
            <span className="report-success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m5 12.5 4.2 4.1L19 7" /></svg>
            </span>
            <h3>Đã ghi nhận báo cáo</h3>
            <p>Báo cáo đã được giữ trong mock state. Chưa gửi đến Admin và chưa lưu vào SQL Server.</p>
            <div className="report-reference">
              <span>Mã thử nghiệm</span><strong>{submittedReport.reportId}</strong>
              <span>Trạng thái</span><strong>Đang chờ xem xét · Mock</strong>
            </div>
            <button className="report-primary-button" type="button" onClick={onClose}>
              Đóng và tiếp tục học
            </button>
          </div>
        ) : (
          <>
            <div className="report-card-context">
              <div className="report-context-topline"><span>THẺ ĐANG BÁO CÁO</span><span>ID · {flashcard.flashcardId}</span></div>
              <div className="report-context-content">
                <div><span>MẶT TRƯỚC</span><p>{flashcard.front}</p></div>
                <div><span>MẶT SAU</span><p>{flashcard.back}</p></div>
              </div>
            </div>

            <div className="report-form-content">
              <fieldset className="report-reason-fieldset" aria-describedby={errors.reason ? 'report-reason-error' : undefined}>
                <legend>Lý do báo cáo <span aria-hidden="true">*</span></legend>
                <div className="report-reason-grid">
                  {reasonOptions.map((option) => (
                    <label className={`report-reason-option${values.reason === option.value ? ' report-reason-selected' : ''}`} key={option.value}>
                      <input
                        type="radio"
                        name="flashcard-report-reason"
                        value={option.value}
                        checked={values.reason === option.value}
                        onChange={() => updateValue('reason', option.value)}
                        disabled={isSubmitting}
                      />
                      <span className="report-radio-indicator" aria-hidden="true" />
                      <span className="report-reason-copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
                    </label>
                  ))}
                </div>
                {errors.reason && <p className="report-field-error" id="report-reason-error" role="alert">{errors.reason}</p>}
              </fieldset>

              <label className="report-text-field" htmlFor="report-description">
                <span className="report-label-line"><strong>Mô tả chi tiết</strong><small>Không bắt buộc</small></span>
                <textarea
                  id="report-description"
                  rows={3}
                  maxLength={MAX_REPORT_TEXT_LENGTH}
                  value={values.description}
                  onChange={(event) => updateValue('description', event.target.value)}
                  placeholder="Mô tả ngắn gọn chỗ chưa chính xác hoặc khó hiểu…"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'report-description-error' : 'report-description-count'}
                />
                {errors.description ? <small className="report-field-error" id="report-description-error">{errors.description}</small> : <small className="report-character-count" id="report-description-count">{values.description.length}/{MAX_REPORT_TEXT_LENGTH}</small>}
              </label>

              <label className="report-text-field" htmlFor="report-suggested-correction">
                <span className="report-label-line"><strong>Đề xuất nội dung sửa đúng</strong><small>Không bắt buộc</small></span>
                <textarea
                  id="report-suggested-correction"
                  rows={3}
                  maxLength={MAX_REPORT_TEXT_LENGTH}
                  value={values.suggestedCorrection}
                  onChange={(event) => updateValue('suggestedCorrection', event.target.value)}
                  placeholder="Nếu biết, hãy gợi ý câu hỏi hoặc đáp án chính xác hơn…"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.suggestedCorrection)}
                  aria-describedby={errors.suggestedCorrection ? 'report-correction-error' : 'report-correction-count'}
                />
                {errors.suggestedCorrection ? <small className="report-field-error" id="report-correction-error">{errors.suggestedCorrection}</small> : <small className="report-character-count" id="report-correction-count">{values.suggestedCorrection.length}/{MAX_REPORT_TEXT_LENGTH}</small>}
              </label>
            </div>

            {submitError && <p className="report-submit-error" role="alert">{submitError}</p>}

            <footer className="report-modal-footer">
              <p><span /> Mock mode · Chưa gửi Admin, chưa lưu database</p>
              <div>
                <button className="report-cancel-button" type="button" onClick={onClose} disabled={isSubmitting}>Hủy</button>
                <button className="report-primary-button" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                  {isSubmitting ? <><span className="report-spinner" aria-hidden="true" /> Đang gửi…</> : <><svg viewBox="0 0 18 18" aria-hidden="true"><path d="m3 9.5 4 4L15 5" /></svg> Gửi báo cáo</>}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}

export default FlashcardReportModal
