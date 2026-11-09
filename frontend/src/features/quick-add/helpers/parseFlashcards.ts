import type {
  DelimiterCharacter,
  DelimiterMode,
  ParsedQuickAddData,
  QuickAddIssueCode,
  QuickAddRow,
  QuickAddRowIssue,
} from '../types'

type RawRecord = {
  fields: string[]
  issues: QuickAddIssueCode[]
}

type DelimiterOption = {
  character: DelimiterCharacter
  label: string
  mode: Exclude<DelimiterMode, 'auto'>
}

const delimiterOptions: DelimiterOption[] = [
  { character: '\t', label: 'Tab', mode: 'tab' },
  { character: ',', label: 'dấu phẩy (,)', mode: 'comma' },
  { character: ';', label: 'dấu chấm phẩy (;)', mode: 'semicolon' },
]

const issueMessages: Record<QuickAddIssueCode, string> = {
  'missing-front': 'Thiếu mặt trước (câu hỏi).',
  'missing-back': 'Thiếu mặt sau (câu trả lời).',
  'too-many-columns': 'Có nhiều hơn 2 cột; chỉ dùng hai cột câu hỏi và câu trả lời.',
  'unclosed-quote': 'Dấu ngoặc kép chưa được đóng.',
  'unexpected-after-quote': 'Có ký tự không hợp lệ sau dấu ngoặc kép đóng.',
}

function parseRecords(text: string, delimiter: DelimiterCharacter): RawRecord[] {
  const records: RawRecord[] = []
  let fields: string[] = []
  let field = ''
  let insideQuotes = false
  let afterClosingQuote = false
  let recordIssues = new Set<QuickAddIssueCode>()

  const finishRecord = (): void => {
    const nextFields = [...fields, field.trim()]
    const hasContent = nextFields.some((value) => value.length > 0)
    const hasExplicitColumns = nextFields.length > 1
    const issues = [...recordIssues]

    if (insideQuotes) issues.push('unclosed-quote')
    if (hasContent || hasExplicitColumns || issues.length > 0) {
      records.push({ fields: nextFields, issues: [...new Set(issues)] })
    }

    fields = []
    field = ''
    insideQuotes = false
    afterClosingQuote = false
    recordIssues = new Set<QuickAddIssueCode>()
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          insideQuotes = false
          afterClosingQuote = true
        }
      } else {
        field += character
      }
      continue
    }

    if (character === delimiter) {
      fields.push(field.trim())
      field = ''
      afterClosingQuote = false
      continue
    }

    if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      finishRecord()
      continue
    }

    if (character === '"' && field.trim().length === 0 && !afterClosingQuote) {
      field = ''
      insideQuotes = true
      continue
    }

    if (afterClosingQuote && !/\s/.test(character)) {
      recordIssues.add('unexpected-after-quote')
    }

    field += character
  }

  if (fields.length > 0 || field.length > 0 || recordIssues.size > 0 || insideQuotes) {
    finishRecord()
  }

  return records
}

function scoreDelimiter(records: readonly RawRecord[]): number {
  let exactPairs = 0
  let extraColumns = 0
  let malformed = 0

  for (const record of records) {
    if (record.fields.length === 2) exactPairs += 1
    if (record.fields.length > 2) extraColumns += 1
    if (record.issues.length > 0) malformed += 1
  }

  return exactPairs * 10 + extraColumns * 4 - malformed * 15
}

function chooseDelimiter(text: string): DelimiterOption {
  let bestOption = delimiterOptions[0]
  let bestScore = Number.NEGATIVE_INFINITY

  for (const option of delimiterOptions) {
    const score = scoreDelimiter(parseRecords(text, option.character))
    if (score > bestScore) {
      bestOption = option
      bestScore = score
    }
  }

  return bestOption
}

function validateRecord(
  fields: readonly string[],
  parserIssues: readonly QuickAddIssueCode[],
): QuickAddRowIssue[] {
  const issues = parserIssues.map((code) => ({ code, message: issueMessages[code] }))

  if (fields.length > 2) {
    issues.push({ code: 'too-many-columns', message: issueMessages['too-many-columns'] })
  }

  return issues
}

export function validateQuickAddRow(row: Pick<QuickAddRow, 'front' | 'back'>): QuickAddRowIssue[] {
  const issues: QuickAddRowIssue[] = []
  if (!row.front.trim()) {
    issues.push({ code: 'missing-front', message: issueMessages['missing-front'] })
  }
  if (!row.back.trim()) {
    issues.push({ code: 'missing-back', message: issueMessages['missing-back'] })
  }
  return issues
}

export function parseFlashcards(
  text: string,
  mode: DelimiterMode = 'auto',
): ParsedQuickAddData {
  const selectedOption =
    mode === 'auto'
      ? chooseDelimiter(text)
      : delimiterOptions.find((option) => option.mode === mode) ?? delimiterOptions[0]
  const records = parseRecords(text, selectedOption.character)

  const rows: QuickAddRow[] = records.map((record, index) => ({
    id: `parsed-row-${index + 1}`,
    front: record.fields[0] ?? '',
    back: record.fields[1] ?? '',
    parseIssues: validateRecord(record.fields, record.issues),
  }))

  const parsedNonEmptyLines = records.reduce(
    (count, record) => count + Math.max(record.fields.length - 1, 1),
    0,
  )
  const physicalLines = text.split(/\r\n|\r|\n/).length

  return {
    rows,
    delimiter: selectedOption.character,
    delimiterLabel: selectedOption.label,
    ignoredBlankLines: Math.max(physicalLines - parsedNonEmptyLines, 0),
  }
}
