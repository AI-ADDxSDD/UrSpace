---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

14 tình huống nghiệm thu UC-04.2. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | Graph 4 status | mở toolbar | All checked, count full graph và legend đúng |
| AC02 | Chọn UNLEARNED và GAP | toggle | OR union đúng, không AND empty |
| AC03 | Uncheck all rồi Reset | filter | None hợp lệ empty state, Reset all không reset viewport |
| AC04 | Chuỗi A→B→C, node B bị ẩn bởi filter | render | Không tạo cạnh A→C giả; chỉ giữ edge có hai đầu visible |
| AC05 | Bộ graph/trạng thái gốc | toggle lặp | Không mutate graph/status/order hoặc POST |
| AC06 | Counts full graph nhiều nhóm | lọc 1 nhóm | Counts cho 4 nhóm không bị đếm trên visible only |
| AC07 | Viewer hoặc snapshot trạng thái thay đổi | refetch | Dùng status Backend của current viewer; không lấy trạng thái owner hoặc dùng M≥.85 làm màu xanh |
| AC08 | Selection đang visible bị toggle/refetch làm ẩn | áp filter hoặc snapshot mới | Đóng drawer, focus control; chủ động mở ancestor vốn hidden ở043 là ngoại lệ và được giữ drawer |
| AC09 | Selected node vẫn còn | toggle khác/đóng drawer | Selection/viewport giữ |
| AC10 | Study đổi status hoặc đổi Deck | refresh/context change | Cùng Deck giữ filter/recompute; Deck khác default all |
| AC11 | Graph 0 node vs filter 0 result | view | Message phân biệt, Reset chỉ giúp khi filter |
| AC12 | Read error hoặc mất quyền truy cập | retry/HTTP403/404 | Không giả empty success; xóa protected data khi quyền mất |
| AC13 | Người dùng keyboard/screen reader/không phân biệt màu | toggle filter | Labels/text/icon/Space/Tab và aria-live count dùng được |
| AC14 | VIEN/mobile zoom/large graph fallback | filter | Controls wrap, list và canvas cùng view; không 60 FPS claim chưa đo |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.2-skill-tree-status-filter-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Chuẩn bị fixture owner/viewer, authorized/denied, empty/bounds/error từ phase 3.
2. Chạy FE/contract checks cho các AC tương ứng; ghi lỗi và sửa tại boundary.
3. Chạy integration/database/browsers thích hợp, phân biệt evidence thật với mock.
4. Chạy lại phần bị ảnh hưởng sau sửa; ghi kết quả, blocker/handoff và giới hạn.
5. Chỉ nghiệm thu triển khai khi các AC của UC đạt và rủi ro quan trọng đã xử lý.

## Success Criteria

- [ ] AC01–AC14 có kết quả thực và evidence khi triển khai.
- [ ] Không còn lỗi quyền/context/dữ liệu cá nhân hoặc replay/lost update chưa xử lý.
- [ ] Keyboard/labels/errors/focus/mobile/VI-EN được kiểm tra thật.
- [ ] Mọi phần chưa kiểm chứng có giới hạn rõ, không thay status pending chỉ vì review tài liệu.

## Risk Assessment

Lọc khỏi canvas không có nghĩa mất prerequisite. Tạo cạnh A→C để thay node B đang bị ẩn sẽ làm người học hiểu sai DAG; phải giữ đầy đủ ngữ cảnh cho drawer chi tiết. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
