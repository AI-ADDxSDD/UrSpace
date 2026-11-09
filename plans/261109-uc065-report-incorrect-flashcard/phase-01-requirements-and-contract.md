---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-06.5

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Mở Modal báo cáo khi người dùng click vào biểu tượng báo cáo trên thẻ | SRS §3.2 + UC-06.5 | AC01, AC02 |
| R02 | Hiển thị danh sách 5 lý do báo cáo dạng radio card đồng nhất, dễ chọn | UX Decision D01 | AC03, AC04 |
| R03 | Vùng nhập mô tả chi tiết với giới hạn tối đa 500 ký tự và cảnh báo vượt giới hạn | SRS Validation | AC05, AC06 |
| R04 | Validation bắt buộc chọn lý do và kiểm tra độ dài mô tả hợp lệ trước khi gửi | SRS Validation | AC07, AC08 |
| R05 | Gửi báo cáo lên backend/mock API và hiển thị thông báo thành công hoặc lỗi | SRS UC-06.5 | AC09, AC10, AC11 |
| R06 | Hỗ trợ phím Escape, click ra ngoài để đóng, và giữ trải nghiệm học không bị gián đoạn | Frontend a11y | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `cardId` | `string` | UUID của thẻ bị báo cáo |
| `reason` | `enum` | "typo_or_grammar" | "factually_incorrect" | "inappropriate_content" | "duplicate_card" | "other", bắt buộc |
| `description` | `string` | Mô tả chi tiết, tối đa 500 ký tự, trim khoảng trắng |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `POST /api/v1/cards/{card_id}/reports` | Bearer User Token | `201 { report_id, status: "pending_review", created_at } | 400 BAD_REQUEST | 401 UNAUTHORIZED` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "card_id": "card-algo-01",
  "reason": "factually_incorrect",
  "description": "Độ phức tạp của thuật toán QuickSort trường hợp xấu nhất là O(n^2) chứ không phải O(n log n) như trong thẻ ghi."
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "report_id": "rep-20261109-001",
    "card_id": "card-algo-01",
    "status": "pending_review",
    "message": "Cảm ơn bạn đã báo cáo. Đội ngũ kiểm duyệt sẽ xem xét nội dung này sớm nhất.",
    "created_at": "2026-11-09T08:50:00Z"
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
- [`frontend/src/features/card-reports/components/FlashcardReportModal.tsx`](../../frontend/src/features/card-reports/components/FlashcardReportModal.tsx)
- [`frontend/src/features/card-reports/components/FlashcardReportModal.css`](../../frontend/src/features/card-reports/components/FlashcardReportModal.css)
- [`frontend/src/features/card-reports/api/mockCardReportsApi.ts`](../../frontend/src/features/card-reports/api/mockCardReportsApi.ts)
- [`frontend/src/features/card-reports/helpers/validateFlashcardReport.ts`](../../frontend/src/features/card-reports/helpers/validateFlashcardReport.ts)
- [`frontend/src/features/card-reports/types/index.ts`](../../frontend/src/features/card-reports/types/index.ts)
- [`frontend/tests/card-reports.test.mjs`](../../frontend/tests/card-reports.test.mjs)

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
