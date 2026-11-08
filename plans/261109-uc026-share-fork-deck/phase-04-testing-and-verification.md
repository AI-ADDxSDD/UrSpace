---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-02.6. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | Owner của Public Deck không archived | Copy link | URL HTTPS tuyệt đối đúng app origin dùng được ngoài trang; không token/file, không Backend write |
| AC02 | Source Private/archived | share hoặc Fork | Không auto Public; hướng 022, denied 404/409; không membership |
| AC03 | Clipboard permission denied | Copy link | URL select manual copy, dữ liệu không gửi người khác |
| AC04 | Public ACTIVE graph/cards | Fork | New IDs và FK map đúng, direction order/type/tags giữ; target độc lập |
| AC05 | Nguồn có DRAFT/DISCARDED/pending AI | Fork | Chỉ ACTIVE, không staging/negative feedback |
| AC06 | PublicDeck 0 card/0 concept | Fork | Cho empty container, không minimum AI/copy fake objects |
| AC07 | Title 2/3/100/101 hoặc trùng owner | Fork | Rules 021, DB unique; manual title không silent rename |
| AC08 | Source author khác requester | Fork | Owner caller, Private, copy canonical metadata không accept forged owner |
| AC09 | Source cóD/S/log/pin/mastery/cache | Fork | Không copy; target owner fresh NEW/DueNow, không shared pin |
| AC10 | Source có Document/sourceanchors | Fork/read target | Null provenance, không clone files/raw payload/stream rights |
| AC11 | Source version/visibility/archive đổi trước clone commit | Fork race | Không partial target,409/404; tx check cùng snapshot |
| AC12 | Fork success rồi source private/delete | read/replay target | Target independent, receipt resolves cùng target không cần public source hiện tại |
| AC13 | Double click hoặc response mất/retry 429 | Fork/reconcile | Một effect, same key; no duplicate target/state |
| AC14 | Target Fork bị xóa sau success | replay old key | 410, không resurrect; source 404 không được create key mới tự động |
| AC15 | Draft cancel hoặc success list refresh fail | hủy/tải lại | Hủy trước submit không write; refresh fail giữ success/targetID |
| AC16 | VI/EN/keyboard/mobile/zoom | share/Fork/error | Focus/labels/readonly/explanation/fallback theoC 11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.6-share-fork-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Fork với stale Public preflight có thể lộ content sau thu hồi quyền nếu clone không lock. No copy User State phải khác fresh state; nếu bỏ cả fresh state thì queue không thấy card. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
