---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-04.4

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Bài kiểm tra Mini theo Khái niệm (Concept Node Mini-Quiz)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải ngân hàng câu hỏi mini-quiz theo Concept Node ID từ mock/API | SRS §3.2 + UC-04.4 | AC01, AC02 |
| R02 | Giao diện câu hỏi rõ ràng với thanh tiến độ câu hỏi hiện tại (ví dụ: Câu 2/4) | UX Requirement | AC03, AC04 |
| R03 | Bốn thẻ lựa chọn A/B/C/D hỗ trợ chọn đáp án bằng chuột và phím số 1-4 | Frontend Accessibility | AC05, AC06 |
| R04 | Hỗ trợ chuyển câu hỏi mượt mà, lưu tạm đáp án đã chọn trong phiên làm bài | Frontend State | AC07, AC08 |
| R05 | Tính toán điểm số chính xác dựa trên các câu trả lời thực tế | SRS UC-04.4 | AC09, AC10, AC11 |
| R06 | Màn hình tổng kết điểm số, phân tích câu đúng/sai và nút "Làm lại bài" hoặc "Quay lại" | UX Requirement | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `conceptNodeId` | `string` | UUID hoặc mã định danh của Khái niệm |
| `answers` | `Record<string, string>` | Map giữa QuestionId và OptionId được chọn |
| `score` | `number` | Số câu đúng / Tổng số câu (0 - 100%) |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/concepts/{concept_id}/quiz` | Bearer User Token | `200 { concept_id, concept_name, questions: QuizQuestion[] } | 404 NOT_FOUND` |
| `POST /api/v1/concepts/{concept_id}/quiz/submit` | Bearer User Token | `200 { score, total_questions, correct_count, accuracy_percentage }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "concept_id": "concept-oop-encap",
  "answers": [
    {
      "question_id": "q1",
      "selected_option_id": "opt-b"
    },
    {
      "question_id": "q2",
      "selected_option_id": "opt-a"
    },
    {
      "question_id": "q3",
      "selected_option_id": "opt-c"
    }
  ]
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "concept_id": "concept-oop-encap",
    "score": 3,
    "total_questions": 3,
    "accuracy_percentage": 100,
    "mastery_impact": "Củng cố vững chắc khái niệm Đóng gói (Encapsulation)",
    "completed_at": "2026-11-09T08:30:00Z"
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
- [`frontend/src/features/concept-quiz/components/ConceptQuiz.tsx`](../../frontend/src/features/concept-quiz/components/ConceptQuiz.tsx)
- [`frontend/src/features/concept-quiz/components/ConceptQuizDemo.tsx`](../../frontend/src/features/concept-quiz/components/ConceptQuizDemo.tsx)
- [`frontend/src/features/concept-quiz/components/ConceptQuiz.css`](../../frontend/src/features/concept-quiz/components/ConceptQuiz.css)
- [`frontend/src/features/concept-quiz/api/mockConceptQuizApi.ts`](../../frontend/src/features/concept-quiz/api/mockConceptQuizApi.ts)
- [`frontend/src/features/concept-quiz/helpers/quizResults.ts`](../../frontend/src/features/concept-quiz/helpers/quizResults.ts)
- [`frontend/src/features/concept-quiz/types/index.ts`](../../frontend/src/features/concept-quiz/types/index.ts)
- [`frontend/tests/concept-quiz.test.mjs`](../../frontend/tests/concept-quiz.test.mjs)

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
