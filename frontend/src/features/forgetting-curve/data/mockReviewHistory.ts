import {
  DEFAULT_STABILITY_FACTOR_DAYS,
  aggregateObservedRetention,
  calculateForgettingCurveSummary,
} from '../helpers/forgettingCurveCalculation'
import type {
  CardReviewLog,
  ForgettingCurveRange,
  ForgettingCurveResponseDto,
} from '../types'

export const mockReviewLogs: CardReviewLog[] = [
  // Day 0: Ngay sau khi học
  { reviewId: 'rev-0-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-01T08:00:00Z', elapsedDays: 0, rating: 'easy', isRecallSuccessful: true },
  { reviewId: 'rev-0-2', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-11-01T08:05:00Z', elapsedDays: 0, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-0-3', cardId: 'c-03', cardTitle: 'Định luật 1 Newton - Quán tính', reviewedAt: '2026-11-01T08:10:00Z', elapsedDays: 0, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-0-4', cardId: 'c-04', cardTitle: 'Phương trình Định luật 2 Newton (F=ma)', reviewedAt: '2026-11-01T08:12:00Z', elapsedDays: 0, rating: 'easy', isRecallSuccessful: true },
  { reviewId: 'rev-0-5', cardId: 'c-05', cardTitle: 'Khái niệm pH và Nồng độ ion H+', reviewedAt: '2026-11-01T08:15:00Z', elapsedDays: 0, rating: 'easy', isRecallSuccessful: true },

  // Day 1: Ôn sau 24h
  { reviewId: 'rev-1-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-02T09:00:00Z', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-1-2', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-11-02T09:02:00Z', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-1-3', cardId: 'c-03', cardTitle: 'Định luật 1 Newton - Quán tính', reviewedAt: '2026-11-02T09:05:00Z', elapsedDays: 1, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-1-4', cardId: 'c-04', cardTitle: 'Phương trình Định luật 2 Newton (F=ma)', reviewedAt: '2026-11-02T09:07:00Z', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-1-5', cardId: 'c-05', cardTitle: 'Khái niệm pH và Nồng độ ion H+', reviewedAt: '2026-11-02T09:10:00Z', elapsedDays: 1, rating: 'easy', isRecallSuccessful: true },
  { reviewId: 'rev-1-6', cardId: 'c-06', cardTitle: 'Quá trình Quang hợp ở thực vật', reviewedAt: '2026-11-02T09:15:00Z', elapsedDays: 1, rating: 'good', isRecallSuccessful: true },

  // Day 2:
  { reviewId: 'rev-2-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-03T10:00:00Z', elapsedDays: 2, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-2-2', cardId: 'c-03', cardTitle: 'Định luật 1 Newton - Quán tính', reviewedAt: '2026-11-03T10:04:00Z', elapsedDays: 2, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-2-3', cardId: 'c-07', cardTitle: 'Phản ứng Este hóa', reviewedAt: '2026-11-03T10:10:00Z', elapsedDays: 2, rating: 'hard', isRecallSuccessful: false },
  { reviewId: 'rev-2-4', cardId: 'c-08', cardTitle: 'Vòng lặp Sự kiện JS (Event Loop)', reviewedAt: '2026-11-03T10:15:00Z', elapsedDays: 2, rating: 'good', isRecallSuccessful: true },

  // Day 3:
  { reviewId: 'rev-3-1', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-11-04T08:30:00Z', elapsedDays: 3, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-3-2', cardId: 'c-04', cardTitle: 'Phương trình Định luật 2 Newton (F=ma)', reviewedAt: '2026-11-04T08:33:00Z', elapsedDays: 3, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-3-3', cardId: 'c-05', cardTitle: 'Khái niệm pH và Nồng độ ion H+', reviewedAt: '2026-11-04T08:36:00Z', elapsedDays: 3, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-3-4', cardId: 'c-09', cardTitle: 'Định lý Pytago mở rộng', reviewedAt: '2026-11-04T08:40:00Z', elapsedDays: 3, rating: 'easy', isRecallSuccessful: true },

  // Day 5:
  { reviewId: 'rev-5-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-06T14:00:00Z', elapsedDays: 5, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-5-2', cardId: 'c-03', cardTitle: 'Định luật 1 Newton - Quán tính', reviewedAt: '2026-11-06T14:05:00Z', elapsedDays: 5, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-5-3', cardId: 'c-06', cardTitle: 'Quá trình Quang hợp ở thực vật', reviewedAt: '2026-11-06T14:10:00Z', elapsedDays: 5, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-5-4', cardId: 'c-08', cardTitle: 'Vòng lặp Sự kiện JS (Event Loop)', reviewedAt: '2026-11-06T14:15:00Z', elapsedDays: 5, rating: 'good', isRecallSuccessful: true },

  // Day 7:
  { reviewId: 'rev-7-1', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-11-08T16:00:00Z', elapsedDays: 7, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-7-2', cardId: 'c-04', cardTitle: 'Phương trình Định luật 2 Newton (F=ma)', reviewedAt: '2026-11-08T16:05:00Z', elapsedDays: 7, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-7-3', cardId: 'c-05', cardTitle: 'Khái niệm pH và Nồng độ ion H+', reviewedAt: '2026-11-08T16:10:00Z', elapsedDays: 7, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-7-4', cardId: 'c-07', cardTitle: 'Phản ứng Este hóa', reviewedAt: '2026-11-08T16:15:00Z', elapsedDays: 7, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-7-5', cardId: 'c-10', cardTitle: 'Cấu trúc màng tế bào Prokaryote', reviewedAt: '2026-11-08T16:20:00Z', elapsedDays: 7, rating: 'good', isRecallSuccessful: true },

  // Day 10:
  { reviewId: 'rev-10-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-11T11:00:00Z', elapsedDays: 10, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-10-2', cardId: 'c-08', cardTitle: 'Vòng lặp Sự kiện JS (Event Loop)', reviewedAt: '2026-11-11T11:05:00Z', elapsedDays: 10, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-10-3', cardId: 'c-09', cardTitle: 'Định lý Pytago mở rộng', reviewedAt: '2026-11-11T11:10:00Z', elapsedDays: 10, rating: 'good', isRecallSuccessful: true },

  // Day 14:
  { reviewId: 'rev-14-1', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-11-15T09:00:00Z', elapsedDays: 14, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-14-2', cardId: 'c-06', cardTitle: 'Quá trình Quang hợp ở thực vật', reviewedAt: '2026-11-15T09:05:00Z', elapsedDays: 14, rating: 'good', isRecallSuccessful: true },
  { reviewId: 'rev-14-3', cardId: 'c-07', cardTitle: 'Phản ứng Este hóa', reviewedAt: '2026-11-15T09:10:00Z', elapsedDays: 14, rating: 'again', isRecallSuccessful: false },

  // Day 21:
  { reviewId: 'rev-21-1', cardId: 'c-01', cardTitle: 'Khái niệm Lớp kép Phospholipid', reviewedAt: '2026-11-22T15:00:00Z', elapsedDays: 21, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-21-2', cardId: 'c-08', cardTitle: 'Vòng lặp Sự kiện JS (Event Loop)', reviewedAt: '2026-11-22T15:05:00Z', elapsedDays: 21, rating: 'good', isRecallSuccessful: true },

  // Day 28:
  { reviewId: 'rev-28-1', cardId: 'c-09', cardTitle: 'Định lý Pytago mở rộng', reviewedAt: '2026-11-29T10:00:00Z', elapsedDays: 28, rating: 'again', isRecallSuccessful: false },
  { reviewId: 'rev-28-2', cardId: 'c-10', cardTitle: 'Cấu trúc màng tế bào Prokaryote', reviewedAt: '2026-11-29T10:05:00Z', elapsedDays: 28, rating: 'again', isRecallSuccessful: false },

  // Day 45 (for 60 days range):
  { reviewId: 'rev-45-1', cardId: 'c-02', cardTitle: 'Chức năng Ty thể (Mitochondria)', reviewedAt: '2026-12-16T08:00:00Z', elapsedDays: 45, rating: 'again', isRecallSuccessful: false },
]

export const FORGETTING_CURVE_DISCLAIMER =
  'LƯU Ý MINH HỌA: Đường cong lý thuyết được tính theo mô hình hàm mũ Ebbinghaus (R = 100 * exp(-t/S)) mang tính chất tham khảo trực quan. Tỷ lệ quan sát thực tế được tổng hợp từ lịch sử ôn tập mock, KHÔNG đại diện cho dự đoán thuật toán FSRS và KHÔNG thay thế logic Spaced Repetition của Backend ASP.NET Core.'

export function createMockForgettingCurveResponse(
  range: ForgettingCurveRange,
  customReviews: CardReviewLog[] = mockReviewLogs,
): ForgettingCurveResponseDto {
  const points = aggregateObservedRetention(customReviews, range, DEFAULT_STABILITY_FACTOR_DAYS)
  const summary = calculateForgettingCurveSummary(points, range, DEFAULT_STABILITY_FACTOR_DAYS)

  return {
    timeRangeDays: range,
    stabilityFactorDays: DEFAULT_STABILITY_FACTOR_DAYS,
    summary,
    points,
    disclaimer: FORGETTING_CURVE_DISCLAIMER,
  }
}
