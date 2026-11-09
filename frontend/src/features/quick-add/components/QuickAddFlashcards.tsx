import { useMemo, useRef, useState } from 'react'
import { saveQuickAddFlashcards } from '../api/mockQuickAddApi'
import { parseFlashcards, validateQuickAddRow } from '../helpers/parseFlashcards'
import type {
  DelimiterMode,
  QuickAddFlashcardInput,
  QuickAddFlashcardSaveHandler,
  QuickAddRow,
} from '../types'
import './QuickAddFlashcards.css'

type QuickAddFlashcardsProps = {
  deckId?: string | null
  onSave?: QuickAddFlashcardSaveHandler
}

type ActionNotice = {
  tone: 'success' | 'error' | 'info'
  message: string
}

const delimiterOptions: { value: DelimiterMode; label: string }[] = [
  { value: 'auto', label: 'Tự nhận diện' },
  { value: 'tab', label: 'Tab' },
  { value: 'comma', label: 'Dấu phẩy (,)' },
  { value: 'semicolon', label: 'Dấu chấm phẩy (;)' },
]

const exampleRows = [
  'Ti thể có vai trò gì?\tTạo ra phần lớn ATP cho tế bào.',
  'Định luật II Newton?\tF = m × a.',
].join('\n')

function QuickAddFlashcards({ deckId = null, onSave }: QuickAddFlashcardsProps) {
  const [input, setInput] = useState('')
  const [delimiterMode, setDelimiterMode] = useState<DelimiterMode>('auto')
  const [rows, setRows] = useState<QuickAddRow[]>([])
  const [parsedDelimiter, setParsedDelimiter] = useState('')
  const [notice, setNotice] = useState<ActionNotice | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null)
  const saveLock = useRef(false)

  const reviewRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        issues: [...row.parseIssues, ...validateQuickAddRow(row)],
      })),
    [rows],
  )
  const validCards = useMemo<QuickAddFlashcardInput[]>(
    () =>
      reviewRows
        .filter((row) => row.issues.length === 0)
        .map((row) => ({ front: row.front.trim(), back: row.back.trim() })),
    [reviewRows],
  )
  const invalidRows = reviewRows.filter((row) => row.issues.length > 0)
  const fingerprint = JSON.stringify({ deckId, cards: validCards })
  const alreadySaved = savedFingerprint === fingerprint

  const handleAnalyze = () => {
    const parsed = parseFlashcards(input, delimiterMode)
    setRows(parsed.rows)
    setParsedDelimiter(parsed.delimiterLabel)
    setSavedFingerprint(null)

    if (parsed.rows.length === 0) {
      setNotice({ tone: 'error', message: 'Chưa có dòng dữ liệu để phân tích. Hãy nhập ít nhất một flashcard.' })
      return
    }

    const validCount = parsed.rows.filter(
      (row) => row.parseIssues.length === 0 && validateQuickAddRow(row).length === 0,
    ).length
    const errorCount = parsed.rows.length - validCount
    setNotice({
      tone: errorCount === 0 ? 'success' : 'info',
      message: `Đã phân tích ${parsed.rows.length} dòng bằng ${parsed.delimiterLabel}: ${validCount} hợp lệ, ${errorCount} cần kiểm tra.`,
    })
  }

  const handleClearAll = () => {
    setInput('')
    setRows([])
    setParsedDelimiter('')
    setSavedFingerprint(null)
    setNotice({ tone: 'info', message: 'Đã xóa nội dung nhập và danh sách xem trước.' })
  }

  const handleEditRow = (rowId: string, field: 'front' | 'back', value: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    )
    setSavedFingerprint(null)
    setNotice(null)
  }

  const handleDeleteRow = (rowId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId))
    setSavedFingerprint(null)
    setNotice({ tone: 'info', message: 'Đã xóa dòng khỏi danh sách xem trước.' })
  }

  const handleSave = async () => {
    if (saveLock.current || validCards.length === 0 || alreadySaved) return

    saveLock.current = true
    setIsSaving(true)
    setNotice(null)

    try {
      if (onSave) {
        await onSave(deckId, validCards)
        setNotice({
          tone: 'success',
          message: `Đã chuyển ${validCards.length} flashcard cho callback tích hợp.`,
        })
      } else {
        const response = await saveQuickAddFlashcards({ deckId, cards: validCards })
        setNotice({
          tone: 'success',
          message: `Đã thêm ${response.savedCount} flashcard vào mock state của phiên này. Chưa lưu lên SQL Server.`,
        })
      }
      setSavedFingerprint(fingerprint)
    } catch {
      setNotice({
        tone: 'error',
        message: 'Không thể lưu các flashcard. Dữ liệu vẫn còn trong bảng xem trước để bạn thử lại.',
      })
    } finally {
      saveLock.current = false
      setIsSaving(false)
    }
  }

  return (
    <main className="quick-add-app">
      <header className="quick-add-topbar">
        <div className="quick-add-brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>urspace</span>
        </div>
        <div className="quick-add-topbar-divider" />
        <span className="quick-add-context">Tạo flashcard nhanh</span>
        <span className="quick-add-session-tag"><span /> Chế độ thử nghiệm</span>
      </header>

      <div className="quick-add-content">
        <header className="quick-add-heading">
          <div>
            <p className="quick-add-eyebrow">THƯ VIỆN HỌC TẬP <span>/</span> FLASHCARD</p>
            <h1>Nhập nhanh flashcard</h1>
            <p className="quick-add-lede">
              Dán danh sách câu hỏi và câu trả lời, xem lại rồi chỉnh sửa trước khi lưu.
            </p>
          </div>
          <div className="quick-add-count-badge">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3.5" width="11" height="13" rx="2" />
              <path d="M6.5 7h4M6.5 10h4M6.5 13h2M14.5 6l2.5 1.5V16a1 1 0 0 1-1 1h-8" />
            </svg>
            <span>{rows.length} dòng</span>
          </div>
        </header>

        <section className="quick-add-input-card" aria-labelledby="paste-title">
          <div className="quick-add-section-heading">
            <div className="quick-add-heading-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20">
                <path d="M7 4.5H5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 5 16.5h10a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 15 4.5h-2M7 3h6v3H7zM7 9h6M7 12h6" />
              </svg>
            </div>
            <div>
              <h2 id="paste-title">Dán dữ liệu của bạn</h2>
              <p>Mỗi dòng là một thẻ · Câu hỏi trước, câu trả lời sau</p>
            </div>
          </div>

          <label className="quick-add-input-label" htmlFor="quick-add-input">
            Nội dung flashcard
            <span>Hỗ trợ dữ liệu từ Excel, Word và CSV</span>
          </label>
          <textarea
            id="quick-add-input"
            className="quick-add-textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'Dán dữ liệu tại đây…\nVí dụ: Câu hỏi\tCâu trả lời'}
            spellCheck={false}
            aria-describedby="quick-add-format-help"
          />

          <div className="quick-add-input-controls">
            <label className="delimiter-control" htmlFor="quick-add-delimiter">
              <span>Phân cách bằng</span>
              <select
                id="quick-add-delimiter"
                value={delimiterMode}
                onChange={(event) => setDelimiterMode(event.target.value as DelimiterMode)}
              >
                {delimiterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="input-action-buttons">
              <button className="clear-all-button" onClick={handleClearAll} type="button" disabled={!input && rows.length === 0}>
                <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 5h11M7 5V3.5h4V5m2.5 0-.6 9H5.1l-.6-9M7.5 8v3.5M10.5 8v3.5" /></svg>
                Xóa tất cả
              </button>
              <button className="analyze-button" onClick={handleAnalyze} type="button">
                <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M7.8 3.2a4.6 4.6 0 1 0 2.8 8.2l3.1 3.1 1.2-1.2-3.1-3.1a4.6 4.6 0 0 0-4-7Z" /></svg>
                Phân tích dữ liệu
              </button>
            </div>
          </div>

          <div className="format-help" id="quick-add-format-help">
            <span className="format-help-icon" aria-hidden="true">i</span>
            <div>
              <strong>Ví dụ định dạng</strong>
              <code>{exampleRows}</code>
              <span>CSV có dấu phẩy trong nội dung: <code>"Thủ đô của Việt Nam, hiện nay?",Hà Nội</code></span>
            </div>
          </div>
        </section>

        <section className="quick-add-preview" aria-labelledby="preview-title">
          <div className="preview-heading">
            <div>
              <div className="preview-title-line">
                <h2 id="preview-title">Xem trước flashcard</h2>
                {parsedDelimiter && <span className="detected-delimiter">Đã nhận diện: {parsedDelimiter}</span>}
              </div>
              <p>Kiểm tra và chỉnh sửa nội dung trước khi lưu</p>
            </div>
            <div className="preview-totals" aria-live="polite">
              <span className="valid-total"><i /> {validCards.length} hợp lệ</span>
              <span className="error-total"><i /> {invalidRows.length} lỗi</span>
            </div>
          </div>

          {notice && (
            <div className={`quick-add-notice notice-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
              <span className="notice-symbol" aria-hidden="true">{notice.tone === 'success' ? '✓' : notice.tone === 'error' ? '!' : 'i'}</span>
              <span>{notice.message}</span>
            </div>
          )}

          {rows.length > 0 ? (
            <div className="preview-table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th className="row-number-heading" scope="col">#</th>
                    <th scope="col">Mặt trước <span>(Câu hỏi)</span></th>
                    <th scope="col">Mặt sau <span>(Câu trả lời)</span></th>
                    <th className="row-status-heading" scope="col">Trạng thái</th>
                    <th className="row-action-heading" scope="col"><span className="visually-hidden">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {reviewRows.map((row, index) => (
                    <tr className={row.issues.length > 0 ? 'preview-row-invalid' : ''} key={row.id}>
                      <td className="row-number-cell" data-label="#">{index + 1}</td>
                      <td className="preview-edit-cell" data-label="Mặt trước — Câu hỏi">
                        <label className="visually-hidden" htmlFor={`${row.id}-front`}>Mặt trước dòng {index + 1}</label>
                        <textarea
                          id={`${row.id}-front`}
                          rows={2}
                          value={row.front}
                          onChange={(event) => handleEditRow(row.id, 'front', event.target.value)}
                          placeholder="Nhập câu hỏi…"
                          aria-invalid={row.issues.some((issue) => issue.code === 'missing-front')}
                        />
                      </td>
                      <td className="preview-edit-cell" data-label="Mặt sau — Câu trả lời">
                        <label className="visually-hidden" htmlFor={`${row.id}-back`}>Mặt sau dòng {index + 1}</label>
                        <textarea
                          id={`${row.id}-back`}
                          rows={2}
                          value={row.back}
                          onChange={(event) => handleEditRow(row.id, 'back', event.target.value)}
                          placeholder="Nhập câu trả lời…"
                          aria-invalid={row.issues.some((issue) => issue.code === 'missing-back')}
                        />
                      </td>
                      <td className="row-status-cell" data-label="Trạng thái">
                        {row.issues.length === 0 ? (
                          <span className="row-valid-status"><i /> Hợp lệ</span>
                        ) : (
                          <ul className="row-issue-list">
                            {row.issues.map((issue, issueIndex) => (
                              <li key={`${issue.code}-${issueIndex}`}>{issue.message}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="row-action-cell" data-label="Xóa">
                        <button
                          className="delete-row-button"
                          onClick={() => handleDeleteRow(row.id)}
                          type="button"
                          aria-label={`Xóa dòng ${index + 1}`}
                          title="Xóa dòng"
                        >
                          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 5h11M7 5V3.5h4V5m2.5 0-.6 9H5.1l-.6-9M7.5 8v3.5M10.5 8v3.5" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-preview">
              <span className="empty-preview-icon" aria-hidden="true">
                <svg viewBox="0 0 28 28"><rect x="5" y="4.5" width="15" height="18" rx="2.5" /><path d="M9 10h7M9 14h7M9 18h4M20 8l3 1.5V22a1.5 1.5 0 0 1-1.5 1.5H10" /></svg>
              </span>
              <strong>Chưa có dữ liệu xem trước</strong>
              <span>Dán nội dung phía trên rồi chọn “Phân tích dữ liệu” để bắt đầu.</span>
            </div>
          )}

          {invalidRows.length > 0 && (
            <div className="validation-summary" role="status">
              <strong>Cần sửa {invalidRows.length} dòng trước khi lưu</strong>
              <ul>
                {invalidRows.slice(0, 4).map((row) => (
                  <li key={row.id}>Dòng {reviewRows.indexOf(row) + 1}: {row.issues.map((issue) => issue.message).join(' ')}</li>
                ))}
              </ul>
              {invalidRows.length > 4 && <span>và {invalidRows.length - 4} dòng khác</span>}
            </div>
          )}

          <div className="quick-add-save-row">
            <div className="save-context">
              <span className="save-context-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18"><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7L15 6.5v7A1.5 1.5 0 0 1 13.5 15h-9A1.5 1.5 0 0 1 3 13.5zM6 3v4h6V4M6 15v-5h6v5" /></svg>
              </span>
              <span>
                <strong>{deckId ? 'Bộ thẻ đã được chọn' : 'Chưa chọn bộ thẻ'}</strong>
                <small>{deckId ? `Deck ID: ${deckId}` : 'Deck Workspace sẽ cung cấp deckId khi tích hợp.'}</small>
              </span>
            </div>
            <button
              className="save-flashcards-button"
              onClick={handleSave}
              type="button"
              disabled={validCards.length === 0 || isSaving || alreadySaved}
            >
              {isSaving ? (
                <><span className="save-spinner" aria-hidden="true" /> Đang lưu…</>
              ) : alreadySaved ? (
                <><svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4 9 3.3 3.2L14 5.8" /></svg> Đã lưu</>
              ) : (
                <><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3.5v11M3.5 9h11" /></svg> Lưu {validCards.length || ''} Flashcard</>
              )}
            </button>
          </div>
          <p className="mock-storage-note">
            <span /> Lưu thử nghiệm trong mock state của phiên này · Chưa gửi dữ liệu lên SQL Server
          </p>
        </section>
      </div>
    </main>
  )
}

export default QuickAddFlashcards
