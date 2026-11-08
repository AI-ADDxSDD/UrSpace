---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-02.6 tại S-03, Deck Public read-only. Nhấn Chia sẻ/Copy link hoặc Sao chép về thư viện. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Owner Public: Copy link; Private: hướng dẫn chỉnh visibility qua 022, nút Copy không tự patch.
2. Fork dialog focus Title, giải thích Private và tiến trình bắt đầu mới; ghi sơ lược card/concept counts của snapshot.
3. Show title errors/version source conflict giữ draft, cho tải lại nguồn và review trước operation mới; freezeC 04 sau submit.
4. Success upsert target theo ID và mở /decks/{target_id}; Public source vẫn readonly; response về khi đóng không cướp route.
5. Clipboard denied hiện URL select được+manual copy; không auto gửi link cho ai hoặc dùng service email/ch at.

Hủy Fork form trước gửi không ghi; copy-link lỗi cho copy thủ công; pending Fork theoC 04. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| source_loading/available/unavailable | Check capabilities/source version |
| copy_ready/copied/copy_error | Không mutation publish |
| fork_editing/invalid | Title review |
| forking/uncertain/conflict | Frozen request C04 |
| forked | Upsert/mở target; không sync nguồn |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. Query/read không cần Idempotency-Key; mutation trước network freeze/persist payload/version/key, storage fail không gửi. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-03, Deck Public read-only, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.6-share-fork-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Đọc host có thật rồi reuse form/editor/dialog/drawer/canvas component phù hợp.
2. Dựng UI theo luồng và states trên với mock phase 3.
3. Nối validation/live messages/focus; giữ dữ liệu đúng khi lỗi và chuyển subject.
4. Kiểm tra các AC UI riêng ở phase 4, không triển khai touchpoint ngoài scope.

## Success Criteria

- [ ] Main/cancel/failure/retry đúng contract, dữ liệu người dùng không mất khi lỗi.
- [ ] Response cũ không đè context mới; success không cập nhật hai lần.
- [ ] Bàn phím/IME/focus/VI-EN/responsive theo C11 dùng được.
- [ ] Scope UI không chứa chức năng ngoài UC đã được xác định.

## Risk Assessment

Fork với stale Public preflight có thể lộ content sau thu hồi quyền nếu clone không lock. No copy User State phải khác fresh state; nếu bỏ cả fresh state thì queue không thấy card. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
