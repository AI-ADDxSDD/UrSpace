---
phase: 3
title: "Backend Integration"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3 Backend Integration

## Overview

Tích hợp UC-04.2 với host/API thật sau phase 2; trước đó FE dùng fake client nhỏ. Backend vẫn là đề xuất; không triển khai service/migration ở nhiệm vụ tài liệu.

## Requirements

### Mock tối thiểu
4 status mix, chainA→B→C vớiBhidden, all same/0 nodes, status change làm selection hidden, viewer change.
Mock ở boundary client, không cần mock-server package, database/queue/AI cho làm UI. Mock không chứng minh race/authorization/persistence. Transport mô phỏng delay/network/error chỉ phục vụ UI; write mô phỏng commit rồi mất response khi UC có mutation.

### Backend/nhóm liên quan bàn giao
- Không new API; Backend graph 041 phải trả display_status đúngC 09.
- Host 041 truyền full graph/selection/viewport và callback visibility, drawer 043 không đọc derived edges nhầm full chain.
- No-store cache subject scope, invalid snapshot xử lý tại 041.

FE: UI/state/validation/context wiring; Backend: principal/readmodel/validation/transaction; thành viên 3: FSRS/mastery/status khi liên quan; nhóm AI/citation: lifecycle/source/version handshake. Không giao FE âm thầm viết lại thuật toán Backend.

## Architecture / Interfaces

Endpoints phase 1; C01–C12 áp tại trust boundary. Callback/cache keyed subject+Deck+query; protected reads private,no-store. Khi có write, replay receipt trước resource/source/version check sau auth. Owner/version/archive recheck trong transaction, no source inference từ Public. Không dùng database in-memory để kết luận constraint thật đã đúng.

## Related Code Files

Chưa có source; tích hợp vào API client/auth, screens S-04, callback list/detail/graph và DTO/backend project thực sau khi có code. Không tạo wrapper/dependency chỉ để wiring. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.2-skill-tree-status-filter-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Reuse graph read model 041, pure derived node IDs/edges và counts full graph.
2. Nối control checkbox, canvas/list cùng derived view; node list keyboard không bất đồng với canvas.
3. Nối selection-hidden với drawer 043+focus, không query DB/filter server mỗi toggle.
4. Bàn giao môi trường, fixtures và phần tích hợp chưa sẵn cho phase 4; không đánh dấu done bằng mock.

## Success Criteria

- [ ] Mock đủ dữ liệu lỗi/biên đặc thù trên để FE làm độc lập.
- [ ] Mapping/request/response, authority và version/retry đúng phase 1.
- [ ] UI invalidation/navigation không biến lỗi read/refresh thành gửi mutation mới.
- [ ] Gate Backend chưa có được nêu đúng; phase 4 có môi trường để kiểm chứng thật.

## Risk Assessment

Lọc khỏi canvas không có nghĩa mất prerequisite. Tạo cạnh A→C để thay node B đang bị ẩn sẽ làm người học hiểu sai DAG; phải giữ đầy đủ ngữ cảnh cho drawer chi tiết. Thiếu auth/DTO/DB/status contract thực chặn end-to-end, không chặn việc viết form/view bằng mock.
