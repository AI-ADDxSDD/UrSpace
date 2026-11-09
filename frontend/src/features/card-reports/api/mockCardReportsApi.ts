import type {
  FlashcardReport,
  SubmitFlashcardReportRequest,
} from '../types'

let mockReports: FlashcardReport[] = []
let nextMockReportNumber = 1

function mockNetworkDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

/** Creates a mock report in memory. The authenticated user is never supplied by the client. */
export async function submitFlashcardReportMock(
  request: SubmitFlashcardReportRequest,
): Promise<FlashcardReport> {
  await mockNetworkDelay()

  const report: FlashcardReport = {
    ...request,
    reportId: `mock-report-${Date.now().toString(36)}-${nextMockReportNumber++}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }

  mockReports = [...mockReports, report]
  return { ...report }
}

export function getMockFlashcardReports(): readonly FlashcardReport[] {
  return mockReports.map((report) => ({ ...report }))
}

export function clearMockFlashcardReports(): void {
  mockReports = []
  nextMockReportNumber = 1
}
