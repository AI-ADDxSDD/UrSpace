---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-02.4. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | Owner edit ACTIVE card | save new front/back | ID/type/options giữ, version tăng; UI phản ánh server |
| AC02 | Card CLOZE/MC có schema hợp lệ hoặc loại chưa được hỗ trợ | sửa text làm mất marker hoặc mâu thuẫn đáp án/choices | Validator theo loại reject400 atomic; schema chưa hỗ trợ thì can_edit_text=false, chỉ đọc; không đổi type/drop options |
| AC03 | Blank/over size/codeindent/XSS/LaTeX | preview/PATCH | Bounds/preserve/sanitize như 023, lỗi giữ raw draft |
| AC04 | Card có states/logs/pins nhiều người | edit front/back | FSRS/Due/reps/log/pins nguyên, không reset tất cả |
| AC05 | Card có shared mnemonic cache | content đổi hoặc no-op | Đổi xóa cache atomic, pin giữ; no-op không regenerate AI |
| AC06 | Card có nhiều user state/log/cache | confirm delete | Xóa các child data theo card; cảnh báo mọi viewer rõ |
| AC07 | Deck chỉ còn1card, Concept có hoặc không có GAP | xóa card cuối | Giữ Concept/edges/mastery/gap; refetch status authoritative C09, chỉ gray khi không GAP; không áp minimum AI |
| AC08 | Non-owner Public hoặc card khác Deck path | PATCH/DELETE | 403/404; không update cross-resource |
| AC09 | Deck archived hoặc card DRAFT/DISCARDED | write qua manual endpoint | Chặn; không auto-restore hoặc leak staging |
| AC10 | Hai editor chung version | save lần lượt | Second 409 giữ draft, không overwrite/bump mù |
| AC11 | Delete commit response mất | retry cùng key | 200 tombstone, không 404 được đoán là success |
| AC12 | Edit commit rồi target bị xóa | replay | 410 terminal, không resurrect hoặc tạo card mới |
| AC13 | Timeout/503 rồi 429/403 hoặc storage fail | save/recover | C04 frozen; storage fail trước gửi không request |
| AC14 | Dirty Cancel/IME/Enter | edit hoặc hủy | Không mất draft, newline giữ, focus restore |
| AC15 | Success, list/detail refresh lỗi | retry tải | Giữ mutation success; không PATCH/DELETE operation mới |
| AC16 | VI/EN/mobile/keyboard/zoom | edit/delete | Danger text/labels/live status/focus/contrast đầy đủ |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.4-edit-delete-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Example .Trim/type fallback trong old service không đủ validation. Schema MC/CLOZE chưa đầy đủ không được âm thầm đổi kiểu hoặc mất fields khi sửa. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
