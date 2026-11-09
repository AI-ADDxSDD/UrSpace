export type DelimiterMode = 'auto' | 'tab' | 'comma' | 'semicolon'

export type DelimiterCharacter = '\t' | ',' | ';'

export type QuickAddIssueCode =
  | 'missing-front'
  | 'missing-back'
  | 'too-many-columns'
  | 'unclosed-quote'
  | 'unexpected-after-quote'

export type QuickAddRowIssue = {
  code: QuickAddIssueCode
  message: string
}

export type QuickAddRow = {
  id: string
  front: string
  back: string
  parseIssues: QuickAddRowIssue[]
}

/** Data transfer shape for saving a standard front/back flashcard. */
export type QuickAddFlashcardInput = {
  front: string
  back: string
}

export type ParsedQuickAddData = {
  rows: QuickAddRow[]
  delimiter: DelimiterCharacter
  delimiterLabel: string
  ignoredBlankLines: number
}

export type QuickAddSaveRequest = {
  deckId: string | null
  cards: readonly QuickAddFlashcardInput[]
}

export type QuickAddSaveResponse = {
  savedCount: number
  totalInMockSession: number
  storage: 'mock-session'
}

export type QuickAddFlashcardSaveHandler = (
  deckId: string | null,
  cards: readonly QuickAddFlashcardInput[],
) => void | Promise<void>
