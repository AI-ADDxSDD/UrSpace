---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-05.2

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Phiên học Gợi nhớ Tích cực (Active Recall Study Session)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải danh sách thẻ cần học trong phiên theo Deck ID từ mock/API | SRS §3.2 + UC-05.2 | AC01, AC02 |
| R02 | Thẻ Flashcard lớn ở trung tâm với hiệu ứng lật mặt trước / mặt sau mượt mà | UX Core Requirement | AC03, AC04 |
| R03 | Hỗ trợ phím Space để lật thẻ và click chuột vào thẻ | Frontend Keyboard Interaction | AC05, AC06 |
| R04 | Cụm 4 nút đánh giá Again, Hard, Good, Easy với màu sắc phân biệt và phím tắt 1-4 | SRS UC-05.2 | AC07, AC08 |
| R05 | Thanh tiến độ phiên học hiển thị số thẻ đã học / tổng số thẻ và tỷ lệ % | UX Requirement | AC09, AC10 |
| R06 | Ghi nhận thời gian làm bài, chuyển thẻ tự động và điều hướng sang UC-05.9 khi kết thúc | SRS UC-05.2 + UC-05.9 | AC11, AC12, AC13, AC14, AC15, AC16 |
| R07 | Hiển thị khối Mẹo nhớ (Mnemonic Block) ở mặt sau thẻ nếu thẻ có pinned_mnemonic | UC-06.4 Integration | AC17 |
| R08 | Hỗ trợ nút Hoàn tác (Undo Rating) gọi API hoàn tác lượt chấm gần nhất | UC-05.4 Integration | AC18 |
| R09 | Hỗ trợ menu Tạm hoãn thẻ (Suspend Card) khỏi phiên học hiện tại | UC-05.5 Integration | AC19 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `deckId` | `string` | UUID của bộ thẻ đang học |
| `cardId` | `string` | UUID của thẻ ghi nhớ đang hiển thị |
| `rating` | `enum` | "Again" | "Hard" | "Good" | "Easy" |
| `reviewTimeMs` | `number` | Thời gian suy nghĩ tính bằng mili-giây |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/study-sessions/next?deck_id={id}` | Bearer User Token | `200 { session_id, cards: Flashcard[] } | 200 { cards: [] } (all caught up)` |
| `POST /api/v1/study-sessions/{session_id}/reviews` | Bearer User Token | `200 { review_id, next_due_date, interval_days }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "session_id": "sess-20261109-01",
  "card_id": "card-algo-01",
  "rating": "Good",
  "review_duration_ms": 4500
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "session_id": "sess-20261109-01",
    "card_id": "card-algo-01",
    "rating": "Good",
    "scheduled_days": 3,
    "next_review": "2026-11-12T08:00:00Z"
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
- [`frontend/src/features/study-session/components/StudySession.tsx`](../../frontend/src/features/study-session/components/StudySession.tsx)
- [`frontend/src/features/study-session/components/StudySession.css`](../../frontend/src/features/study-session/components/StudySession.css)
- [`frontend/src/features/study-session/data/mockFlashcards.ts`](../../frontend/src/features/study-session/data/mockFlashcards.ts)
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
