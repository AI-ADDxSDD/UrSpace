---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-02.3 tại S-03. Nhấn + Thêm thẻ trong Deck active. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Mở editor tại S-03, focus front; thao tác preview không làm mất raw text hoặc chuyển code indentation.
2. Chọn Concept hiện có hoặc chọn Tạo khái niệm và nhập tên thật; Deck 0 Concept mở chế độ tạo mới rõ ràng.
3. Validate blur/submit, error summary; preview sanitize XSS/LaTeX/code theo C02; không auto-submit khi IME.
4. Save freeze snapshot+version/key C04; success ở lại S-03, chọn thẻ mới và invalidate counts/concepts/tree/queue người dùng; không tự vào phiên học.
5. Hủy dirty hỏi trong editor; Ctrl+Enter chỉ save khi không composing, Enter textarea vẫn newline, Tab/focus không bị code editor giữ vô hạn.

Hủy editor giữ hoặc bỏ draft có xác nhận; khi pending chỉ đóng, không giả rollback. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| loading | Tải Deck/concepts |
| editing/preview/invalid | Raw draft giữ nguyên; preview chỉ render |
| submitting/uncertain | Frozen card+new Concept/key |
| conflict | Giữ draft, review latest Concept/version |
| saved | Upsert card theo ID, trả focus thẻ mới |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. Query/read không cần Idempotency-Key; mutation trước network freeze/persist payload/version/key, storage fail không gửi. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-03, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.3-add-manual-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

FK Concept không nullable nên không thể bỏ select or ở Deck rỗng. Renderer/source schema chưa có mã; test preview không thay validation server. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
