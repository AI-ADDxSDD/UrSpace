---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-04.3. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

## Requirements

- FE test nhỏ cho validation và transition/context có rủi ro, không snapshot lại toàn app.
- Contract/authorization/integration với Backend thật; DB race/receipt/rollback khi có mutation.
- Browser keyboard/screen reader/responsive/VI-EN; graph NFR đo trên fixture/device ghi rõ.
- Không dùng fake client để tuyên bố bảo mật, atomicity hoặc FPS đạt.

## Architecture / Interfaces

Dùng contract phase 1, UI phase 2 và fixtures/gate phase 3; C01–C12 giữ semantics xuyên UC. Read không tạo state; mutate test không được ngầm đổi owner hoặc reset personal data. Các touchpoint chưa triển khai ghi handoff, không pass giả.

### Given / When / Then

| ID | Given | When | Then |
|---|---|---|---|
| AC01 | Node ACTIVE same Deck | click/Enter | Drawer đúng summary/heading/cardcount, graph viewport filter giữ |
| AC02 | Concept khác Deck/private/archived non owner/Guest | GET direct | 404/401, không leak content |
| AC03 | Summary HTML/XSS/LaTeX/code | render | Sanitize/textpreserveC 02, không unsafe html/remote image |
| AC04 | U→Vdirect vàV→W | mởV/W | Direct incoming đúng, transitive ancestor label rõ không đảo edge |
| AC05 | Root 0 prereq và diamond ancestor | open | Empty state hoặc unique nodes/edges, không duplicated/hang |
| AC06 | Response cycle/dangling hoặc version mixed | detail | GRAPH_INVALID/GRAPH_CHANGED, refresh không ghép edges bản cũ |
| AC07 | Có ACTIVE/DRAFT/DISCARDED cards | list/paging | Count và items ACTIVE only, đúng Concept Deck |
| AC08 | Cards>20 và version đổi giữa trang | next cursor | Paging stable;409 refresh detail/graph, không stale snapshot |
| AC09 | A/Bmetrics/no-state | detail/list | ViewerD/S/M/Rriêng/null đúng, no-state creation |
| AC10 | Concept AI gốc có nguồn và related manual card; Concept mới thủ công/Fork không nguồn | owner hoặc Public viewer mở drawer | Concept AI owner đủ quyền có thể can_view_source=true; manual card luôn false riêng. Manual/Fork Concept và Public non-owner không tự có nguồn |
| AC11 | Source capability true nhưng quyền bị thu hồi | open Source→403 | Giữ detail, báo lỗi nguồn riêng; summary không giả excerpt |
| AC12 | ClickA chậm rồiclickB hoặc đổi Deck/subject | responses đảo thứ tự | ChỉB/context mới vào DOM, abort/ignore stale |
| AC13 | Ancestor đang hidden hoặc selection visible bị filter ẩn | chủ động mở ancestor hoặc toggle/refetch | Mở hidden ancestor giữ drawer+badge; toggle/refetch làm selection visible→hidden mới đóng. Không reset filter/viewport, focus đúng |
| AC14 | Network error/cardlist partial error | Retry | Giữ selection/context, section retry đúng không đổi summary sang node cũ |
| AC15 | Rời drawer lúc đang load | close | Không effect ghi, không late focus/reopen |
| AC16 | VIEN/keyboard/HTML list/mobile zoom | xem detail/ancestors | Accessible labels/heading/close focus/no horizontal overflow C11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.3-concept-detail-prerequisites-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Chuẩn bị fixture owner/viewer, authorized/denied, empty/bounds/error từ phase 3.
2. Chạy FE/contract checks cho các AC tương ứng; ghi lỗi và sửa tại boundary.
3. Chạy integration/database/browsers thích hợp, phân biệt evidence thật với mock.
4. Chạy lại phần bị ảnh hưởng sau sửa; ghi kết quả, blocker/handoff và giới hạn.
5. Chỉ nghiệm thu triển khai khi các AC của UC đạt và rủi ro quan trọng đã xử lý.

## Success Criteria

- [ ] AC01–AC16 có kết quả thực và evidence khi triển khai.
- [ ] Không còn lỗi quyền/context/dữ liệu cá nhân hoặc replay/lost update chưa xử lý.
- [ ] Keyboard/labels/errors/focus/mobile/VI-EN được kiểm tra thật.
- [ ] Mọi phần chưa kiểm chứng có giới hạn rõ, không thay status pending chỉ vì review tài liệu.

## Risk Assessment

Đảo nhầm hướng incoming/outgoing sẽ dạy sai tiên quyết; snapshot mix gây cạnh/ancestor giả. Capability không thay server auth, summary không là nguồn trích dẫn. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
