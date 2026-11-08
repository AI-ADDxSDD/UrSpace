---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-04.3: Drawer hiển thị lý thuyết, tiên quyết trực tiếp/chuỗi tổ tiên và thẻ liên quan, giữ ngữ cảnh cây. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Summary safe, node/cross Deck access đúng | SRS04.3+C01/C02 | AC01, AC02, AC03 |
| R02 | Direct incoming và full ancestor chain phân biệt | SRS¶466+UC034+C10 | AC04, AC05, AC06 |
| R03 | Related ACTIVE cards, version bound paging/metrics viewer | SRS04.3+C07/C10 | AC07, AC08, AC09 |
| R04 | Source capability độc lập, edited/manual provenance đúng | UC036+C01/C06 | AC10, AC11 |
| R05 | Race/close/focus/viewport/error/a11y | C10/C11 | AC12, AC13, AC14, AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| concept_id/name/summary | ACTIVE same Deck; Markdown summary sanitize; summary không giả excerpt |
| direct_prerequisites | Incoming PREREQUISITE_OF IDs/names; direct label |
| ancestor_nodes/ancestor_edges | Full transitive closure from snapshot, visited set; direct khác indirect, no PART_OF as prerequisite |
| card_count/cardlist | ACTIVE only; phântrangC 07 concept_id; NEW/no-state/null metrics viewer |
| deck_version/evaluated_at | Content version must match graph;409 GRAPH_CHANGED refresh |
| can_view_source | Quyền/provenance của chính Concept. Concept AI owner đủ quyền vẫn có nguồn dù related manual card source=null; Concept mới thủ công/Fork không nguồn thì false; source403 là lỗi riêng |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id}/concepts/{concept_id}?expected_deck_version=12 | Auth viewer; same Deck/version/snapshot | 200 detail+ancestors+capability;409 GRAPH_CHANGED;404 denied |
| GET /api/v1/decks/{id}/flashcards?concept_id={concept_id}&expected_deck_version=12&page_size=20 | C07 paging+ACTIVE/current viewer | 200 list/count/version, no owner state/source leak |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "method": "GET",
  "path": "/api/v1/decks/deck-a/concepts/c2?expected_deck_version=12"
}
```

Response hoặc local projection:
```json
{
  "data": {
    "concept_id": "c2",
    "deck_id": "deck-a",
    "deck_version": 12,
    "name": "Đạo hàm",
    "summary": "Tốc độ biến thiên tức thời.",
    "direct_prerequisites": [
      {
        "concept_id": "c1",
        "name": "Giới hạn"
      }
    ],
    "ancestor_nodes": [
      {
        "concept_id": "c1",
        "name": "Giới hạn"
      }
    ],
    "ancestor_edges": [
      {
        "source_node_id": "c1",
        "target_node_id": "c2"
      }
    ],
    "card_count": 0,
    "can_view_source": false
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-04 drawer, module feature UC-04.3, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.3-concept-detail-prerequisites-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Đảo nhầm hướng incoming/outgoing sẽ dạy sai tiên quyết; snapshot mix gây cạnh/ancestor giả. Capability không thay server auth, summary không là nguồn trích dẫn. Không thể xác nhận API hoặc validation thực khi chưa có mã.
