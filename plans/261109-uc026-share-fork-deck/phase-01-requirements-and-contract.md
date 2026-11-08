---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-02.6: Chia sẻ link Public có kiểm soát và tạo bản Fork Private độc lập, không sao chép tiến trình hoặc nguồn. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Chỉ share Public, clipboard fallback, không tự Public | SRS BR10+C08 | AC01, AC02, AC03 |
| R02 | Fork snapshot ACTIVE remap concept/card/edge | SRS02.6+C08 | AC04, AC05, AC06 |
| R03 | Title/owner/Private/metadata target đúng | UC021+C08 | AC07, AC08 |
| R04 | Fresh New state, không copy personal/citation | UC035/064+C08 | AC09, AC10 |
| R05 | Source race/version/receipt an toàn | C03/C04/C08 | AC11, AC12, AC13, AC14 |
| R06 | Cancel/nav/list/focus/a11y | C11 | AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| share_url | URL HTTPS tuyệt đối trên trusted app origin trỏ /decks/{id}; nếu API trả relative path thì resolve trước Copy. Không token/file/ngoài origin; clipboard fallback chọn URL |
| title | Required; prefill sourced title để user tự sửa, rules 021; trùng 409 không auto suffix |
| expected_source_version | integer≥1 từ GET, bind snapshot |
| targetvisibility | Server Private, không Field owner/membership/source |
| targetmetadata | description/category/Deck tags copy snapshot; card tags copy; sourceanchors drop |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id} | Auth read+visibility/archive capability | 200 metadata/version/can_fork/share_url nếu Public |
| POST /api/v1/decks/{source_id}/fork | title,expected_source_version,Idempotency-Key | 201 target Deck;200 replay;409 source version/title;404 denied;410 target deleted |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "title": "Giải tích của tôi",
  "expected_source_version": 12
}
```

Response hoặc local projection:
```json
{
  "data": {
    "deck_id": "deck-fork",
    "deck_version": 1,
    "title": "Giải tích của tôi",
    "visibility": "Private",
    "concepts_count": 3,
    "flashcards_count": 8
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-03, Deck Public read-only, module feature UC-02.6, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.6-share-fork-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Fork với stale Public preflight có thể lộ content sau thu hồi quyền nếu clone không lock. No copy User State phải khác fresh state; nếu bỏ cả fresh state thì queue không thấy card. Không thể xác nhận API hoặc validation thực khi chưa có mã.
