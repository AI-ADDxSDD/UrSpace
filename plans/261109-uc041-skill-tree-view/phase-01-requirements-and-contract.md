---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-04.1: Hiển thị đầy đủ DAG ACTIVE và trạng thái viewer với zoom/pan mượt, có lối truy cập keyboard. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Graph ACTIVE cùng snapshot, U→Vd own stream, không write | UC034/035 + SRS04.1 | AC01, AC02, AC03, AC04 |
| R02 | Zoom/pan/drag viewport/fit/reset và giữ viewport | SRS04.1 | AC05, AC06 |
| R03 | Status viewer Backend, gray/blue/green/red+text | SRS¶466+C09 | AC07, AC08, AC09 |
| R04 | Privacy/access và request/cache correctness | C01/C07 | AC10, AC11, AC12 |
| R05 | 300 node 60 FPS đo thật, >300 fallback không truncate | SRSNFR+C09 | AC13, AC14 |
| R06 | Keyboard/HTML list/error/empty/responsive | SRSAA+C11 | AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| deck_version/evaluated_at | Snapshot shared content và mốc metrics; không HTTP validator cá nhân |
| nodes[] | concept_id,name,difficulty_level,card_count,display_status,mastery_score?,retrievability?; ACTIVE only |
| edges[] | relation_id,source_node_id,target_node_id,relation_type PREREQUISITE_OF; endpoints valid |
| display_status | UNLEARNED/LEARNING/MASTERED/GAP do Backend, C09 precedence |
| viewport | Local memory per Deck, zoom bounds 0.2..2 đề xuất, fit/reset buttons; drag chỉ tọa độ hiển thị |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id}/graph | Auth viewer, ACTIVE snapshot, private,no-store | 200 {deck_id,deck_version,evaluated_at,nodes,edges};404 denied;409 GRAPH_INVALID nếu corrupt |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "method": "GET",
  "path": "/api/v1/decks/deck-a/graph"
}
```

Response hoặc local projection:
```json
{
  "data": {
    "deck_id": "deck-a",
    "deck_version": 12,
    "evaluated_at": "2026-11-09T03:00:00Z",
    "nodes": [
      {
        "concept_id": "c1",
        "name": "Đạo hàm",
        "card_count": 1,
        "display_status": "UNLEARNED"
      }
    ],
    "edges": []
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-04 từ S-03, module feature UC-04.1, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.1-skill-tree-view-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

60 FPS chưa đo; renderer/layout engine chưa installed. Không thể suy màu green từM>=.85 hoặc bỏ missingR. >300 ngoài NFR target được hiển thị đầy đủ bằng list. Không thể xác nhận API hoặc validation thực khi chưa có mã.
