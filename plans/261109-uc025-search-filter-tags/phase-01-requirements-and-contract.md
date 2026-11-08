---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-02.5: Tìm thẻ theo nội dung và chỉ số của chính viewer, quản lý tag môn học ở cấp card. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Keyword literal front/back, server pagination deterministic | SRS02.5+C07 | AC01, AC02, AC03 |
| R02 | D/S viewer finite ranges, NEW/null chưa học | SRS UserCardState+C07 | AC04, AC05, AC06 |
| R03 | Card.tags độc lập Deck.tags, owner-only ≤10×30 | SRS02.5 + C02 giả định | AC07, AC08, AC09 |
| R04 | Query races/cursor/query change đúng | C07 | AC10, AC11 |
| R05 | Tag version/receipt và read privacy | C01/C03/C04/C07 | AC12, AC13, AC14 |
| R06 | Loading/empty/error/reset/a11y/UI update | C11 | AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| q | ≤100 scalar; literal không regex, giữ dấu; debounce 300 ms trừ composing |
| d_min/d_max | finite 1..10, min≤max; blank=bỏ filter |
| s_min/s_max | finite≥0, min≤max; thêm theo SRS, UI advanced không ép user nhập |
| unlearned/tags | boolean unlearned lọc no-reviewed-state; tags OR, nhóm khác AND; unlearned + numeric range 400 tránh ambiguous |
| page_size/cursor | 20 mặc định, max100; bind subject/Deck/query/content version. Mỗi trang là snapshot riêng; D/S đổi giữa trang cần Refresh/reset cursor theo C07 |
| tags edit | Card array≤10×30, pending tag flush trước save; expected_deck_version,key |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id}/flashcards?q=...&d_min=...&s_min=...&tags=...&page_size=20&cursor=... | Viewer principal; ACTIVE only; C07 null semantics | 200 items+next_cursor+deck_version;409 LIST_CHANGED |
| PATCH /api/v1/decks/{id}/flashcards/{card_id}/tags | tags,expected_deck_version,Idempotency-Key; owner | 200 card_id,tags,deck_version;400/403/409 |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "expected_deck_version": 7,
  "tags": [
    "đại số",
    "ôn thi"
  ]
}
```

Response hoặc local projection:
```json
{
  "data": {
    "card_id": "card-a",
    "tags": [
      "đại số",
      "ôn thi"
    ],
    "deck_version": 8
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-03, module feature UC-02.5, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.5-search-filter-tags-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Card.tags là schema mới cần Backend; D=Concept Difficulty hoặc no-state=0 sẽ cho kết quả sai. Search/paging mock không chứng minh SQL parameterization. Không thể xác nhận API hoặc validation thực khi chưa có mã.
