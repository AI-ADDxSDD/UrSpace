---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-04.2: Lọc trực quan theo trạng thái viewer, giữ nguyên DAG gốc và ngữ cảnh xem. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Bốn status, OR, default all/reset | SRS04.2+C09 | AC01, AC02, AC03 |
| R02 | Visible edges induced, không cạnh giả/DAG mutation | UC034+C09 | AC04, AC05 |
| R03 | Counts/labels/metrics viewer đúng snapshot | C07/C09 | AC06, AC07 |
| R04 | Selection/focus/viewport với filter/refetch | Yêu cầu UX+C09/C10 | AC08, AC09, AC10 |
| R05 | A11 y/empty/error/mobile và access | C01/C11 | AC11, AC12, AC13, AC14 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| selected_statuses | Local Set enum 4 values; default all; none hợp lệ |
| statuscounts | Counts trên full authorized graph snapshot, không trên list đã lọc |
| visible_nodes | node.display_status thuộc set; không tính lại theo R/M ở FE |
| visible_edges | Cả source và target visible; giữ direction ID gốc, không tạo edge đường tắt |
| selection/viewport | Selection node ẩn→close drawer, focus filter; viewport giữ |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| Không endpoint mutation mới | Lấy graph qua GET /api/v1/decks/{id}/graph của 041 | Derive local, không network mỗi checkbox; Refresh dùng read 041 |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID. Với UC042, ví dụ là local state, không endpoint mới.

Request hoặc read context:
```json
{
  "selected_statuses": [
    "UNLEARNED",
    "GAP"
  ]
}
```

Response hoặc local projection:
```json
{
  "visible_concept_ids": [
    "c1",
    "c4"
  ],
  "visible_relation_ids": [],
  "note": "Local derived view, không phải API response"
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-04, module feature UC-04.2, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.2-skill-tree-status-filter-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Lọc khỏi canvas không có nghĩa mất prerequisite. Tạo cạnh A→C để thay node B đang bị ẩn sẽ làm người học hiểu sai DAG; phải giữ đầy đủ ngữ cảnh cho drawer chi tiết. Không thể xác nhận API hoặc validation thực khi chưa có mã.
