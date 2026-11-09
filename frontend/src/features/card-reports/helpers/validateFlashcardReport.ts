import type {
  FlashcardReportFormErrors,
  FlashcardReportFormValues,
} from '../types'

export const MAX_REPORT_TEXT_LENGTH = 2000

export function validateFlashcardReport(
  values: FlashcardReportFormValues,
): FlashcardReportFormErrors {
  const errors: FlashcardReportFormErrors = {}

  if (!values.reason) {
    errors.reason = 'Hãy chọn lý do báo cáo.'
  }

  if (values.description.length > MAX_REPORT_TEXT_LENGTH) {
    errors.description = `Mô tả không được vượt quá ${MAX_REPORT_TEXT_LENGTH} ký tự.`
  }

  if (values.suggestedCorrection.length > MAX_REPORT_TEXT_LENGTH) {
    errors.suggestedCorrection = `Nội dung đề xuất không được vượt quá ${MAX_REPORT_TEXT_LENGTH} ký tự.`
  }

  return errors
}
