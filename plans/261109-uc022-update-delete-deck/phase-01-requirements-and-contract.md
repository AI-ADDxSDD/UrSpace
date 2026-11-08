---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-02.2: Sửa metadata, archive/restore và hard-delete có xác nhận, bảo toàn quyền và tránh lost update. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Metadata đúng rules 021, title unique cả archived | SRS FE 01 + UC021 | AC01, AC02 |
| R02 | Chỉ owner ghi; archive reversible và giữ dữ liệu | SRS02.2 + C01/C05 | AC03, AC04, AC05 |
| R03 | Xác nhận hard-delete với counts và ảnh hưởng mọi user, nguồn còn | SRS02.2 + UC031 + C05 | AC06, AC07 |
| R04 | Optimistic version và atomic cascade/receipt | C03/C04 | AC08, AC09, AC10, AC11 |
| R05 | Giữ draft, retry, update list/navigation/focus đúng | Yêu cầu hiện tại + C11 | AC12, AC13, AC14, AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| title/description/category/tags/visibility | PATCH optional, bỏ field=giữ; normalize và bounds 021, null/sai kiểu 400 |
| is_archived | boolean; archive/restore riêng request với expected version, không kèm edit metadata |
| expected_deck_version | integer≥1 từ GET; bắt buộc mọi write |
| confirm delete | UI hiển thị counts thẻ/concept/states/log; gõ đúng canonical title trước nút Xóa |
| delete-impact | owner-only counts+deck_version; không danh tính người học |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id} | Auth; archived owner-only | 200 metadata+deck_version+is_archived |
| PATCH /api/v1/decks/{id} | expected_deck_version + fields metadata HOẶC is_archived | 200 current projection;409 VERSION_CONFLICT/DECK_TITLE_EXISTS |
| GET /api/v1/decks/{id}/delete-impact | Owner | 200 counts,deck_version,source_files_retained:true |
| DELETE /api/v1/decks/{id}?expected_deck_version=7 | Idempotency-Key; owner/version/transaction | 200 {deleted_deck_id,deleted:true}; replay 200 tombstone |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "expected_deck_version": 7,
  "title": "Giải tích nâng cao",
  "visibility": "Private"
}
```

Response hoặc local projection:
```json
{
  "data": {
    "deck_id": "deck-a",
    "deck_version": 8,
    "title": "Giải tích nâng cao",
    "visibility": "Private",
    "is_archived": false
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-03, menu bộ thẻ tại S-02, module feature UC-02.2, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.2-update-delete-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Hard-delete ảnh hưởng mọi người học là nghiệp vụ SRS, cần confirm rõ. File nguồn vẫn còn; queue/worker coordination chưa có mã là gate thật. Không thể xác nhận API hoặc validation thực khi chưa có mã.
