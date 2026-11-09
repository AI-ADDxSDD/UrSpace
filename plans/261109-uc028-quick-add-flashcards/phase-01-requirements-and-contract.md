---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-02.8

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Nhập nhanh Thẻ ghi nhớ (Quick Add Flashcards)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Vùng soạn thảo văn bản đa dòng (Textarea) hỗ trợ paste trực tiếp từ Excel/Google Sheets | SRS FE-01 + UC-02.8 | AC01, AC02 |
| R02 | Thanh công cụ lựa chọn ký tự phân tách: Tự động, Tab, Phẩy (,), Chấm phẩy (;), Gạch ngang (-) | UX Decision D01 | AC03, AC04 |
| R03 | Bảng xem trước danh sách thẻ đã phân tích với cột Số thứ tự, Mặt trước, Mặt sau và Trạng thái | SRS FE-01 | AC05, AC06, AC07 |
| R04 | Validation từng dòng độc lập: kiểm tra thiếu mặt trước, thiếu mặt sau, thừa cột, lỗi đóng ngoặc | SRS Validation | AC08, AC09, AC10 |
| R05 | Hành động Lưu hàng loạt (Batch Save) với xác nhận số lượng thẻ hợp lệ và loại trừ dòng lỗi | SRS UC-02.8 | AC11, AC12, AC13 |
| R06 | Các nút hỗ trợ thao tác nhanh: Tải dữ liệu mẫu, Xóa trắng, và Hướng dẫn cú pháp | UX Polish | AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `rawText` | `string` | Văn bản đầu vào, tối đa 100.000 ký tự (khoảng 500 thẻ mỗi lần nhập) |
| `delimiter` | `enum` | "auto" | "tab" | "comma" | "semicolon" | "dash", mặc định "auto" |
| `parsedCards` | `ParsedCardItem[]` | Danh sách thẻ sau phân tích: { index, front, back, isValid, errorMessage } |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `POST /api/v1/decks/{deck_id}/cards/batch` | Bearer User Token | `201 { inserted_count, deck_id } | 400 BAD_REQUEST | 403 FORBIDDEN` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "cards": [
    {
      "front": "Algorithm",
      "back": "Tập hợp các bước giải quyết bài toán"
    },
    {
      "front": "Data Structure",
      "back": "Cách tổ chức và lưu trữ dữ liệu"
    }
  ]
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "deck_id": "deck-cs-01",
    "inserted_count": 2,
    "failed_count": 0,
    "message": "Đã thêm thành công 2 thẻ ghi nhớ."
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
- [`frontend/src/features/quick-add/components/QuickAddFlashcards.tsx`](../../frontend/src/features/quick-add/components/QuickAddFlashcards.tsx)
- [`frontend/src/features/quick-add/components/QuickAddFlashcards.css`](../../frontend/src/features/quick-add/components/QuickAddFlashcards.css)
- [`frontend/src/features/quick-add/api/mockQuickAddApi.ts`](../../frontend/src/features/quick-add/api/mockQuickAddApi.ts)
- [`frontend/src/features/quick-add/helpers/parseFlashcards.ts`](../../frontend/src/features/quick-add/helpers/parseFlashcards.ts)
- [`frontend/src/features/quick-add/types/index.ts`](../../frontend/src/features/quick-add/types/index.ts)
- [`frontend/tests/quick-add-parser.test.mjs`](../../frontend/tests/quick-add-parser.test.mjs)

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
