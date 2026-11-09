import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  clearMockFlashcardReports,
  getMockFlashcardReports,
  submitFlashcardReportMock,
} from '../src/features/card-reports/api/mockCardReportsApi.ts'
import { validateFlashcardReport } from '../src/features/card-reports/helpers/validateFlashcardReport.ts'

afterEach(() => clearMockFlashcardReports())

test('requires a report reason and accepts each supported reason', () => {
  assert.deepEqual(
    validateFlashcardReport({ reason: '', description: '', suggestedCorrection: '' }),
    { reason: 'Hãy chọn lý do báo cáo.' },
  )

  for (const reason of ['incorrect-knowledge', 'incorrect-answer', 'unclear-question', 'inappropriate-content', 'other']) {
    assert.deepEqual(validateFlashcardReport({ reason, description: '', suggestedCorrection: '' }), {})
  }
})

test('checks detailed text limits, including long descriptions', () => {
  const result = validateFlashcardReport({
    reason: 'other',
    description: 'x'.repeat(2001),
    suggestedCorrection: 'y'.repeat(2001),
  })

  assert.match(result.description, /2000/)
  assert.match(result.suggestedCorrection, /2000/)
})

test('stores mock report metadata and request fields without client identity', async () => {
  const request = {
    flashcardId: 'flashcard-1',
    deckId: 'deck-1',
    reason: 'incorrect-answer',
    description: 'Đáp án thiếu đơn vị.',
    suggestedCorrection: 'Thêm đơn vị mét.',
  }

  const report = await submitFlashcardReportMock(request)
  const { reportId, status, createdAt, ...storedRequest } = report
  assert.deepEqual(storedRequest, request)
  assert.match(reportId, /^mock-report-/)
  assert.equal(status, 'PENDING')
  assert.ok(Number.isFinite(Date.parse(createdAt)))
  assert.equal('userId' in report, false)
  assert.equal(getMockFlashcardReports().length, 1)
})
