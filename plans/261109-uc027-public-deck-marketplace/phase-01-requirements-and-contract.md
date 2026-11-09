---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-02.7

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Khám phá và Sao chép Bộ thẻ Công khai (Public Deck Marketplace)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Hiển thị danh sách bộ thẻ công khai dạng Grid thẻ hiện đại, responsive 3-4 cột | SRS FE-01 + UC-02.7 | AC01, AC02 |
| R02 | Tìm kiếm từ khóa (tiêu đề, mô tả, tags) hỗ trợ tiếng Việt không dấu | SRS FE-01 | AC03, AC04 |
| R03 | Bộ lọc đa tiêu chí: theo môn học (Subject), chủ đề (Topic), tag và sắp xếp | SRS FE-01 | AC05, AC06 |
| R04 | Modal xem trước chi tiết bộ thẻ (thông tin, tags, tác giả, danh sách thẻ mẫu) | UX Decision D04 | AC07, AC08 |
| R05 | Hành động Sao chép (Fork) bộ thẻ về thư viện cá nhân với xác nhận và thông báo | SRS UC-02.6 / UC-02.7 | AC09, AC10, AC11 |
| R06 | Xử lý phân trang (Pagination) và các trạng thái Loading, Empty, Error | SRS §3.2 + Frontend baseline | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `searchQuery` | `string` | Tối đa 100 ký tự, normalize khoảng trắng, tìm kiếm tức thì với debounce |
| `selectedSubject` | `string` | Tùy chọn, mặc định "all" hoặc danh mục môn học hợp lệ |
| `selectedTopic` | `string` | Tùy chọn, mặc định "all" hoặc chủ đề trực thuộc môn học |
| `selectedTag` | `string` | Tùy chọn, lọc theo tag cụ thể của bộ thẻ |
| `sortBy` | `enum` | "popular" | "newest" | "card_count", mặc định "popular" |
| `page / pageSize` | `number` | page >= 1, pageSize = 12 (hoặc 6/24) |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/marketplace/decks` | Public/Optional | `200 { data: PublicDeckItem[], total, page, pageSize }` |
| `GET /api/v1/marketplace/decks/{id}` | Public/Optional | `200 { data: PublicDeckDetailDto } | 404 NOT_FOUND` |
| `POST /api/v1/marketplace/decks/{id}/fork` | Bearer User Token | `201 { forked_deck_id, title, card_count } | 401 UNAUTHORIZED | 409 CONFLICT` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "search": "tiếng anh",
  "subject": "Ngoại ngữ",
  "sort_by": "popular",
  "page": 1,
  "page_size": 12
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": [
    {
      "deck_id": "deck-pub-01",
      "title": "3000 Từ vựng Oxford Thông dụng",
      "description": "Bộ từ vựng tiếng Anh cốt lõi dành cho người mới bắt đầu.",
      "subject": "Ngoại ngữ",
      "topic": "Từ vựng",
      "tags": [
        "English",
        "Oxford",
        "Vocabulary"
      ],
      "card_count": 150,
      "author_name": "UrSpace Community",
      "fork_count": 1240,
      "rating": 4.9,
      "created_at": "2026-03-15T08:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "page_size": 12
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
- [`frontend/src/features/public-decks/components/PublicDeckMarketplace.tsx`](../../frontend/src/features/public-decks/components/PublicDeckMarketplace.tsx)
- [`frontend/src/features/public-decks/components/PublicDeckMarketplace.css`](../../frontend/src/features/public-decks/components/PublicDeckMarketplace.css)
- [`frontend/src/features/public-decks/api/mockPublicDecksApi.ts`](../../frontend/src/features/public-decks/api/mockPublicDecksApi.ts)
- [`frontend/src/features/public-decks/helpers/publicDeckFilters.ts`](../../frontend/src/features/public-decks/helpers/publicDeckFilters.ts)
- [`frontend/src/features/public-decks/types/index.ts`](../../frontend/src/features/public-decks/types/index.ts)
- [`frontend/tests/public-decks.test.mjs`](../../frontend/tests/public-decks.test.mjs)

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
