import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFlashcards, validateQuickAddRow } from '../src/features/quick-add/helpers/parseFlashcards.ts'

test('auto-detects Excel tab-separated data and parses five flashcards', () => {
  const text = [
    'Câu 1\tĐáp án 1',
    'Câu 2\tĐáp án 2',
    'Câu 3\tĐáp án 3',
    'Câu 4\tĐáp án 4',
    'Câu 5\tĐáp án 5',
  ].join('\r\n')
  const parsed = parseFlashcards(text)

  assert.equal(parsed.delimiter, '\t')
  assert.equal(parsed.rows.length, 5)
  assert.deepEqual(parsed.rows[4], {
    id: 'parsed-row-5',
    front: 'Câu 5',
    back: 'Đáp án 5',
    parseIssues: [],
  })
  assert.ok(parsed.rows.every((row) => validateQuickAddRow(row).length === 0))
})

test('keeps commas inside a quoted CSV field', () => {
  const parsed = parseFlashcards('"Thủ đô của Việt Nam, hiện nay?",Hà Nội')

  assert.equal(parsed.delimiter, ',')
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].front, 'Thủ đô của Việt Nam, hiện nay?')
  assert.equal(parsed.rows[0].back, 'Hà Nội')
  assert.deepEqual(parsed.rows[0].parseIssues, [])
})

test('reports missing front and back independently', () => {
  const parsed = parseFlashcards('\tĐáp án có sẵn\nCâu hỏi có sẵn\t')

  assert.equal(parsed.rows.length, 2)
  assert.deepEqual(validateQuickAddRow(parsed.rows[0]).map((issue) => issue.code), ['missing-front'])
  assert.deepEqual(validateQuickAddRow(parsed.rows[1]).map((issue) => issue.code), ['missing-back'])
})

test('supports semicolon and explicitly selected comma delimiters', () => {
  const semicolon = parseFlashcards('Câu hỏi;Câu trả lời', 'semicolon')
  const comma = parseFlashcards('Câu hỏi,Câu trả lời', 'comma')

  assert.deepEqual([semicolon.rows[0].front, semicolon.rows[0].back], ['Câu hỏi', 'Câu trả lời'])
  assert.deepEqual([comma.rows[0].front, comma.rows[0].back], ['Câu hỏi', 'Câu trả lời'])
})

test('reports extra columns, unclosed quotes, and ignores blank input lines', () => {
  const parsed = parseFlashcards('Q,A,extra\n"câu hỏi chưa đóng,đáp án\n\n')

  assert.equal(parsed.rows.length, 2)
  assert.ok(parsed.rows[0].parseIssues.some((issue) => issue.code === 'too-many-columns'))
  assert.ok(parsed.rows[1].parseIssues.some((issue) => issue.code === 'unclosed-quote'))
  assert.equal(parseFlashcards(' \n\r\n').rows.length, 0)
})

test('supports a comma and a line break inside quoted CSV fields', () => {
  const parsed = parseFlashcards('"Câu hỏi,\ntrên hai dòng",Đáp án')

  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].front, 'Câu hỏi,\ntrên hai dòng')
  assert.equal(parsed.rows[0].back, 'Đáp án')
})
