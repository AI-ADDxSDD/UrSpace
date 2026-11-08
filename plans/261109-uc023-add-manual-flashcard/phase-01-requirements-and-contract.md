---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-02.3: Soạn thẻ Markdown/LaTeX/Code, preview an toàn và lưu card ACTIVE với Concept/state hợp lệ. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Editor+preview Markdown/LaTeX/Code giữ whitespace và Unicode | SRS FE 01/C02 | AC01, AC02, AC03 |
| R02 | Front/back required và bounds 5000/10000 | UC035 Requirements | AC04 |
| R03 | Concept cùng Deck hoặc new_concept do user nhập; không Document | SRS ¶455 + C06 | AC05, AC06, AC07 |
| R04 | Card ACTIVE + fresh owner state cùng transaction | SRS ¶455/C06 | AC08, AC09 |
| R05 | Owner/version/retry không tạo thẻ/Concept đôi | C01/C03/C04 | AC10, AC11, AC12, AC13 |
| R06 | Điều hướng, cancel, UI/a11y đầy đủ | C11 | AC14, AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| front | required non-whitespace,≤5000 scalar; CRLF→LF; preserve indent, không trim |
| back | required non-whitespace,≤10000 scalar; cùng quy tắc preserve |
| concept_id XOR new_concept.name | ACTIVE cùng Deck hoặc tên 1–255 scalar người dùng nhập; exactly one |
| card_type/status/source | Server STANDARD/ACTIVE; client không gán owner/status/source; source nullable |
| expected_deck_version | integer≥1; key UUIDv 4 |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id}/concepts?status=ACTIVE | Owner; no Document required | 200 items{concept_id,name},deck_version |
| POST /api/v1/decks/{id}/flashcards | front/back + concept select or + expected_deck_version + Idempotency-Key | 201; replay 200 same card;409 version;410 result deleted |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "expected_deck_version": 3,
  "front": "Định nghĩa đạo hàm?",
  "back": "$$f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}$$",
  "new_concept": {
    "name": "Đạo hàm"
  }
}
```

Response hoặc local projection:
```json
{
  "data": {
    "card_id": "card-new",
    "deck_id": "deck-a",
    "concept_id": "concept-new",
    "card_type": "STANDARD",
    "status": "ACTIVE",
    "tags": [],
    "deck_version": 4,
    "has_citation": false
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-03, module feature UC-02.3, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.3-add-manual-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Đối chiếu host/schema thật với bảng fields và C01–C12; ghi mapping snake_case/C# rõ.
2. Dùng source table trong brainstorm phân biệt SRS/plan/example/giả định mới.
3. Backend bàn giao validation/readmodel/atomicity theo phase 3; FE làm mock không chờ runtime.
4. Chuyển trace R→AC sang phase 4, giữ error/version/privacy contract nhất quán.

## Success Criteria

- [ ] Mọi R có nguồn và AC; những giới hạn chưa SRS được ghi Cxx/decision.
- [ ] Request/response thực đáp ứng authority owner/viewer, version và shared rule khi triển khai.
- [ ] Không áp nhầm AI lifecycle/minimum/placeholder hoặc source permission rộng hơn.
- [ ] Boundary mismatch được sửa, không thêm wire adapters che giấu hai chuẩn.

## Risk Assessment

FK Concept không nullable nên không thể bỏ select or ở Deck rỗng. Renderer/source schema chưa có mã; test preview không thay validation server. Không thể xác nhận API hoặc validation thực khi chưa có mã.
