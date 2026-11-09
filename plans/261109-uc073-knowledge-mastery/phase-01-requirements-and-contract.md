---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-07.3

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải dữ liệu danh sách Concept Nodes từ mock API / backend DTO | SRS §3.2 + UC-07.3 | AC01, AC02 |
| R02 | Năm thẻ KPI tóm tắt: Tổng khái niệm, Chưa học, Cần ôn tập, Đang tiến bộ, và Thành thạo | UX EdTech SaaS | AC03, AC04 |
| R03 | Thanh phân bố tổng thể (Distribution Bar) 4 màu kèm tỷ lệ % và nhãn chú thích | UX Requirement | AC05, AC06 |
| R04 | Thanh công cụ lọc đa tiêu chí: Lọc theo Môn học, Lọc theo Mức độ, và Ô tìm kiếm tức thì | SRS FE-01 | AC07, AC08 |
| R05 | Lưới hiển thị Concept Nodes theo từng Chủ đề, mỗi card có viền màu cấp độ và thanh tiến độ mini | SRS UC-07.3 | AC09, AC10, AC11 |
| R06 | Modal chi tiết khái niệm khi click vào card và xử lý an toàn các trường hợp biên | UX Modal + a11y | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `conceptNodes` | `ConceptMasteryNode[]` | Danh sách các node khái niệm |
| `selectedSubject` | `string` | "all" hoặc tên môn học cụ thể |
| `selectedLevel` | `enum` | "all" | "unlearned" | "needs_review" | "in_progress" | "mastered" |
| `searchQuery` | `string` | Từ khóa tìm kiếm tên khái niệm không dấu |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/concepts/mastery?subject={s}&level={l}&search={q}` | Bearer User Token | `200 { summary: MasteryDistributionDto, groups: TopicConceptGroupDto[] }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "subject": "all",
  "level": "needs_review",
  "search": "cấu trúc"
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "summary": {
      "total_concepts": 24,
      "unlearned_count": 5,
      "needs_review_count": 6,
      "in_progress_count": 8,
      "mastered_count": 5,
      "overall_mastery_percentage": 62.5
    },
    "groups": [
      {
        "subject": "Khoa học máy tính",
        "topic": "Cấu trúc dữ liệu",
        "nodes": [
          {
            "concept_id": "c-tree-01",
            "name": "Cây nhị phân tìm kiếm (BST)",
            "mastery_score": 45,
            "level": "needs_review",
            "card_count": 12
          }
        ]
      }
    ]
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
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx)
- [`frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx`](../../frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx)
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css)
- [`frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts`](../../frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts)
- [`frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts`](../../frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts)
- [`frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts`](../../frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts)
- [`frontend/src/features/knowledge-mastery/types/index.ts`](../../frontend/src/features/knowledge-mastery/types/index.ts)
- [`frontend/tests/knowledge-mastery.test.mjs`](../../frontend/tests/knowledge-mastery.test.mjs)

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
