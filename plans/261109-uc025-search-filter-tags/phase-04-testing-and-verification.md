---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-02.5. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | ACTIVE cards có từ khóa front/back | search literal tiếng Việt | Chỉ match đúng scope, không DRAFT/DISCARDED hoặc Deck khác |
| AC02 | q chứa %, _, quote hoặc ký tự regex | GET literal search | Parameterized, không wildcard/injection; q>100 trả HTTP400 |
| AC03 | Nhiều card có created_at trùng; content và viewerD/S không đổi | đọc các trang bằng cursor | Ordering có ID tie-break, không lặp/mất trong điều kiện dữ liệu không đổi; mỗi trang là snapshot riêng |
| AC04 | A và B có D/S khác trên cùng card | gửi cùng query | Kết quả theo viewer, không theo metrics owner |
| AC05 | NEW/no-state, kể cả giá trị S=0 sentinel trong DB | default hoặc unlearned/numeric range | Default/unlearned có card, numeric range loại null; GET không tạo state |
| AC06 | Dmin 0/11/NaN, Snegative/Infinity,min>max,unlearned+range | GET | 400 validation, UI giữ filters |
| AC07 | Deck.tags khác Card.tags | lọc card tag | Chỉ dùng Card.tags, không tự inherit |
| AC08 | Owner tags 0/10/11, blank/trùng/31 scalar | save | C02 đúng, pending tag không rơi, lỗi giữ draft |
| AC09 | Non-owner Public | read/filter rồi PATCH tags | Read allowed; write 403, Private 404; không dữ liệu người khác |
| AC10 | QueryA chậm, QueryB mới | responses đảo thứ tự | Chỉ B hiển thị, reset cursor, không append Acũ |
| AC11 | Content đổi hoặc viewer học ở tab khác giữa hai trang | dùng cursor cũ rồi Refresh | Content đổi=>409 LIST_CHANGED; chỉ D/S đổi không hứa snapshot toàn list, Refresh reset cursor/đọc lại membership mới |
| AC12 | Tag editor version stale | save | 409 giữ tags draft, không overwrite |
| AC13 | Tag commit mất response/retry 429 | recovery | C04 same key, không operation mới |
| AC14 | LogoutA/loginB khi query pending | responseA về muộn | Clear cache đúng subject, không lộ D/S hoặc áp lại listA |
| AC15 | No results/server error/success refresh error | retry/reset/tag update | Giữ query lỗi, Clear filters explicit, tag đổi có thể làm card rời list |
| AC16 | Keyboard/IME/VI-EN/mobile/zoom | search hoặc sửa tag | Labels/ranges/errors/focus/xóa tag dùng được theo C11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.5-search-filter-tags-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Card.tags là schema mới cần Backend; D=Concept Difficulty hoặc no-state=0 sẽ cho kết quả sai. Search/paging mock không chứng minh SQL parameterization. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
