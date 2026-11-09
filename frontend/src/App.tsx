import { useState } from 'react'
import QuickAddFlashcards from './features/quick-add'
import PublicDeckMarketplace from './features/public-decks'
import ConceptQuizDemo from './features/concept-quiz'
import StudySession from './features/study-session'
import ReviewSchedule from './features/review-schedule'
import StudyStreak from './features/study-streak'
import ForgettingCurve from './features/forgetting-curve'
import KnowledgeMastery from './features/knowledge-mastery'
import './App.css'

type FeatureKey =
  | 'study'
  | 'quick-add'
  | 'marketplace'
  | 'concept-quiz'
  | 'review-schedule'
  | 'study-streak'
  | 'forgetting-curve'
  | 'knowledge-mastery'

function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>('study')

  return (
    <>
      <nav className="feature-switcher" aria-label="Chọn trải nghiệm UrSpace">
        <div className="feature-switcher-inner">
          <div className="feature-switcher-brand">
            <div className="feature-switcher-logo">
              <span className="feature-switcher-logo-mark" aria-hidden="true">
                <i />
                <i />
              </span>
              <span>UrSpace</span>
            </div>
            <span className="feature-switcher-badge">Active Recall</span>
          </div>
          <div className="feature-switcher-options">
            <button
              className={activeFeature === 'study' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('study')}
              type="button"
              aria-pressed={activeFeature === 'study'}
            >
              Trải nghiệm học
            </button>
            <button
              className={activeFeature === 'quick-add' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('quick-add')}
              type="button"
              aria-pressed={activeFeature === 'quick-add'}
            >
              Nhập nhanh thẻ
            </button>
            <button
              className={activeFeature === 'marketplace' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('marketplace')}
              type="button"
              aria-pressed={activeFeature === 'marketplace'}
            >
              Marketplace
            </button>
            <button
              className={activeFeature === 'concept-quiz' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('concept-quiz')}
              type="button"
              aria-pressed={activeFeature === 'concept-quiz'}
            >
              Mini-Quiz
            </button>
            <button
              className={activeFeature === 'review-schedule' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('review-schedule')}
              type="button"
              aria-pressed={activeFeature === 'review-schedule'}
            >
              Lịch ôn tập
            </button>
            <button
              className={activeFeature === 'study-streak' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('study-streak')}
              type="button"
              aria-pressed={activeFeature === 'study-streak'}
            >
              Study Streak
            </button>
            <button
              className={activeFeature === 'forgetting-curve' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('forgetting-curve')}
              type="button"
              aria-pressed={activeFeature === 'forgetting-curve'}
            >
              Đường cong quên
            </button>
            <button
              className={activeFeature === 'knowledge-mastery' ? 'feature-switcher-active' : ''}
              onClick={() => setActiveFeature('knowledge-mastery')}
              type="button"
              aria-pressed={activeFeature === 'knowledge-mastery'}
            >
              Độ thành thạo
            </button>
          </div>
        </div>
      </nav>
      {activeFeature === 'study' ? (
        <StudySession />
      ) : activeFeature === 'quick-add' ? (
        <QuickAddFlashcards />
      ) : activeFeature === 'marketplace' ? (
        <PublicDeckMarketplace />
      ) : activeFeature === 'concept-quiz' ? (
        <ConceptQuizDemo />
      ) : activeFeature === 'review-schedule' ? (
        <ReviewSchedule />
      ) : activeFeature === 'study-streak' ? (
        <StudyStreak />
      ) : activeFeature === 'forgetting-curve' ? (
        <ForgettingCurve />
      ) : (
        <KnowledgeMastery />
      )}
    </>
  )
}

export default App
