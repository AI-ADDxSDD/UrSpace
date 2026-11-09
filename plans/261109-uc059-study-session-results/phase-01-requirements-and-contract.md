---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-05.9

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Kết quả và Tổng kết Phiên học (Study Session Results)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Nhận dữ liệu tổng kết từ phiên học UC-05.2 (danh sách thẻ, đánh giá, thời gian) | SRS UC-05.9 | AC01, AC02 |
| R02 | Tính toán chính xác các chỉ số: Số thẻ đã học, Tỷ lệ thành công (Good+Easy)/Total, Thời lượng | SRS §3.2.1 | AC03, AC04 |
| R03 | Hiển thị 4 thẻ KPI lớn với phân cấp thị giác hiện đại, số liệu Manrope nổi bật | UX EdTech SaaS | AC05, AC06 |
| R04 | Thanh phân bố tỷ lệ 4 mức đánh giá kèm số lượng và % cho từng loại | SRS UC-05.9 | AC07, AC08 |
| R05 | Xử lý an toàn các trường hợp biên: 100% Again, 100% Easy, phiên học 0 thẻ | Robustness | AC09, AC10, AC11 |
| R06 | Các nút hành động: Học lại phiên này, Học lại thẻ chưa thuộc, Quay về danh mục thẻ | UX Navigation | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `totalCards` | `number` | Tổng số thẻ đã hoàn thành trong phiên |
| `successRate` | `number` | Tỷ lệ % thẻ nhớ tốt (Good + Easy) / Tổng số thẻ |
| `durationSeconds` | `number` | Thời gian hoàn thành phiên học tính bằng giây |
| `ratingsCount` | `Record<StudyRating, number>` | Số lượng từng mức Again, Hard, Good, Easy |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/study-sessions/{session_id}/summary` | Bearer User Token | `200 { session_id, deck_id, total_cards, duration_seconds, success_rate, breakdown }` |
| `POST /api/v1/study-sessions/{session_id}/complete` | Bearer User Token | `200 { status: "recorded", streak_incremented: true }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "session_id": "sess-20261109-01",
  "completed_at": "2026-11-09T08:45:00Z"
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "session_id": "sess-20261109-01",
    "deck_id": "deck-cs-01",
    "total_cards": 10,
    "duration_seconds": 245,
    "accuracy_percentage": 80,
    "ratings": {
      "again": 1,
      "hard": 1,
      "good": 5,
      "easy": 3
    },
    "message": "Phiên học tuyệt vời! Bạn đã ghi nhớ tốt 80% kiến thức."
  }
}
```

### Chuẩn hóa Xử lý Lỗi (RFC 7807 Problem Details)
Khi có lỗi phát sinh (dữ liệu không hợp lệ, không tìm thấy, xung đột hoặc lỗi máy chủ), Backend trả về phản hồi định dạng chuẩn:
```json
{
  "type": "https://api.urspace.edu.vn/errors/invalid-request",
  "title": "Yêu cầu không hợp lệ",
  "status": 400,
  "detail": "Dữ liệu gửi lên không vượt qua các quy tắc kiểm tra tính hợp lệ.",
  "instance": "/api/v1/resource/endpoint",
  "code": "VALIDATION_FAILED"
}
```

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 1:
- [`frontend/src/features/study-session/components/StudySessionResult.tsx`](../../frontend/src/features/study-session/components/StudySessionResult.tsx)
- [`frontend/src/features/study-session/components/StudySession.css`](../../frontend/src/features/study-session/components/StudySession.css)
- [`frontend/src/features/study-session/helpers/sessionStats.ts`](../../frontend/src/features/study-session/helpers/sessionStats.ts)
- [`frontend/src/features/study-session/types/flashcard.ts`](../../frontend/src/features/study-session/types/flashcard.ts)
- [`frontend/tests/study-session-statistics.test.mjs`](../../frontend/tests/study-session-statistics.test.mjs)

## Implementation Steps

1. Rà soát danh sách trường và đối chiếu kiểu dữ liệu TypeScript trong `types/index.ts`.
2. Kiểm tra tính tương thích giữa DTO của mock API và hợp đồng đề xuất cho Backend C# ASP.NET Core.
3. Đồng bộ hóa mã lỗi và thông báo thân thiện với người dùng cả tiếng Việt và tiếng Anh.
4. Chuyển giao các ràng buộc kiểm thử sang Phase 4 để làm căn cứ viết unit test.

## Success Criteria

- [x] Đầy đủ các trường dữ liệu được định nghĩa kiểu rõ ràng trong TypeScript.
- [x] Có ví dụ JSON request và response hợp lệ, dễ đọc.
- [x] Quy định mã lỗi rõ ràng theo chuẩn RFC 7807, không trả về lỗi thô 500.
- [x] Truy vết 100% từ Requirements (R01–R06) sang Acceptance Criteria (AC01–AC16).

## Risk Assessment

- **Rủi ro lệch pha hợp đồng:** Backend có thể dùng quy ước đặt tên khác (`PascalCase` trong C#). Giải pháp: Frontend dùng `camelCase` và cấu hình serializer JSON chuyển đổi `snake_case` thống nhất ở tầng API gateway.
