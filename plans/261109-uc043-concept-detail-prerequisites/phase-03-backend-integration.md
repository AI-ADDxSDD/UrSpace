---
phase: 3
title: "Backend Integration"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3 Backend Integration

## Overview

Tích hợp UC-04.3 với host/API thật sau phase 2; trước đó FE dùng fake client nhỏ. Backend vẫn là đề xuất; không triển khai service/migration ở nhiệm vụ tài liệu.

## Requirements

### Mock tối thiểu
Root node 0 prereq, chain/diamond ancestors, hidden ancestor, >20 cards, corrupt cycle, stale version, rapidA/Bclick, citation denied.
Mock ở boundary client, không cần mock-server package, database/queue/AI cho làm UI. Mock không chứng minh race/authorization/persistence. Transport mô phỏng delay/network/error chỉ phục vụ UI; write mô phỏng commit rồi mất response khi UC có mutation.

### Backend/nhóm liên quan bàn giao
- Backend detail/direct ancestor closure same Deck/snapshot/version; visited set/cycle error no hang.
- C07 cardlist concept filter và count ACTIVE, metrics viewer, no-store.
- Source capability server+nullable manual provenance; citations reauth ở request thật.

FE: UI/state/validation/context wiring; Backend: principal/readmodel/validation/transaction; thành viên 3: FSRS/mastery/status khi liên quan; nhóm AI/citation: lifecycle/source/version handshake. Không giao FE âm thầm viết lại thuật toán Backend.

## Architecture / Interfaces

Endpoints phase 1; C01–C12 áp tại trust boundary. Callback/cache keyed subject+Deck+query; protected reads private,no-store. Khi có write, replay receipt trước resource/source/version check sau auth. Owner/version/archive recheck trong transaction, no source inference từ Public. Không dùng database in-memory để kết luận constraint thật đã đúng.

## Related Code Files

Chưa có source; tích hợp vào API client/auth, screens S-04 drawer, callback list/detail/graph và DTO/backend project thực sau khi có code. Không tạo wrapper/dependency chỉ để wiring. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.3-concept-detail-prerequisites-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Nối 041 selection/full graph version+042 visibility; request abort/seq subject scope.
2. Detail API+paginated cards riêng, errors không overwrite selected node mới.
3. Source UC036 là optional handoff; thiếu source không chặn detail core, không stream Public mặc định.
4. Bàn giao môi trường, fixtures và phần tích hợp chưa sẵn cho phase 4; không đánh dấu done bằng mock.

## Success Criteria

- [ ] Mock đủ dữ liệu lỗi/biên đặc thù trên để FE làm độc lập.
- [ ] Mapping/request/response, authority và version/retry đúng phase 1.
- [ ] UI invalidation/navigation không biến lỗi read/refresh thành gửi mutation mới.
- [ ] Gate Backend chưa có được nêu đúng; phase 4 có môi trường để kiểm chứng thật.

## Risk Assessment

Đảo nhầm hướng incoming/outgoing sẽ dạy sai tiên quyết; snapshot mix gây cạnh/ancestor giả. Capability không thay server auth, summary không là nguồn trích dẫn. Thiếu auth/DTO/DB/status contract thực chặn end-to-end, không chặn việc viết form/view bằng mock.
