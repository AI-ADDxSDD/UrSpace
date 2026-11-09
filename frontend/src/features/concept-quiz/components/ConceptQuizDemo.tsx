import { useEffect, useState } from 'react'
import { listMockConceptNodes } from '../api/mockConceptQuizApi'
import type { ConceptNodeSummary, ConceptQuizCompletion } from '../types'
import ConceptQuiz from './ConceptQuiz'
import './ConceptQuiz.css'

export type ConceptQuizDemoProps = {
  onComplete?: (completion: ConceptQuizCompletion) => void
}

function ConceptQuizDemo({ onComplete }: ConceptQuizDemoProps) {
  const [loadState, setLoadState] = useState<
    { status: 'loading' } |
    { status: 'error'; message: string } |
    { status: 'ready'; nodes: ConceptNodeSummary[] }
  >({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    listMockConceptNodes()
      .then((nodes) => { if (isCurrent) setLoadState({ status: 'ready', nodes }) })
      .catch(() => { if (isCurrent) setLoadState({ status: 'error', message: 'Không tải được danh sách Concept Node demo.' }) })
    return () => { isCurrent = false }
  }, [retryToken])

  if (selectedNodeId) {
    return (
      <ConceptQuiz
        key={selectedNodeId}
        conceptNodeId={selectedNodeId}
        onComplete={onComplete}
        onClose={() => setSelectedNodeId(null)}
      />
    )
  }

  const isLoading = loadState.status === 'loading'
  const loadError = loadState.status === 'error' ? loadState.message : ''
  const nodes = loadState.status === 'ready' ? loadState.nodes : []

  return (
    <main className="concept-quiz-page">
      <header className="quiz-topbar">
        <div className="quiz-brand"><span className="quiz-brand-mark" aria-hidden="true"><i /><i /><i /></span><span>urspace</span></div>
        <span className="quiz-topbar-divider" />
        <span className="quiz-context">Tự kiểm tra khái niệm</span>
        <span className="quiz-demo-badge">DEMO</span>
      </header>
      <div className="quiz-demo-content">
        <section className="quiz-demo-heading">
          <p className="quiz-eyebrow">CONCEPT NODE · MINI-QUIZ</p>
          <h1>Chọn một khái niệm để tự kiểm tra</h1>
          <p>Mỗi quiz được mở trực tiếp từ một Concept Node cụ thể. Chọn node để bắt đầu.</p>
        </section>
        {isLoading ? (
          <div className="quiz-demo-state" role="status" aria-busy="true"><span className="quiz-loader" />Đang tải Concept Node…</div>
        ) : loadError ? (
          <div className="quiz-demo-state quiz-demo-error" role="alert"><p>{loadError}</p><button className="quiz-secondary-button" type="button" onClick={() => { setLoadState({ status: 'loading' }); setRetryToken((value) => value + 1) }}>Thử lại</button></div>
        ) : (
          <div className="quiz-node-grid" aria-label="Concept Node demo">
            {nodes.map((node, index) => {
              return (
                <button
                  className="quiz-node-card"
                  type="button"
                  key={node.conceptNodeId}
                  onClick={() => setSelectedNodeId(node.conceptNodeId)}
                >
                  <span className={`quiz-node-symbol node-symbol-${index % 3}`} aria-hidden="true">{node.name.slice(0, 1)}</span>
                  <span className="quiz-node-subject">{node.subject}{node.hasQuiz ? ' · 3–5 câu' : ' · Chưa có quiz'}</span>
                  <strong>{node.name}</strong>
                  <span className="quiz-node-description">{node.description}</span>
                  <span className="quiz-node-action">{node.hasQuiz ? 'Mở Mini-Quiz' : 'Xem trạng thái'} <i aria-hidden="true">→</i></span>
                </button>
              )
            })}
          </div>
        )}
        <p className="quiz-demo-note">Đây là danh sách chọn node mẫu để thử giao diện. Concept Map do thành viên phụ trách sẽ mở Mini-Quiz bằng conceptNodeId.</p>
      </div>
    </main>
  )
}

export default ConceptQuizDemo
