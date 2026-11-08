---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-02.5 tại S-03. Nhập từ khóa, chọn D/S/tags hoặc chỉnh nhãn thẻ. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Search+filter ở S-03, input q có label; D và S có min/max trợ giúp, tag chips và Reset.
2. Query đổi reset cursor, debounce và abort/sequence id để latest wins; IME composing chưa query; pagination không append query cũ.
3. Loading giữ query; no results có Clear filters, error có Retry không reset; chủ động reload từ đầu khi LIST_CHANGED.
4. Owner tag popover/dialog flush pending tag; non-owner chỉ thấy tags đọc; update success refetch query vì thẻ có thể không còn match.
5. Giữ selected card bằng ID nếu còn hiện, nếu bị filter loại focus lên list heading; URL query chỉ chứa filters hợp lệ, không user_id/token.

Clear filters là local/query read; hủy tag draft không ghi; pending tag save theoC 04. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

D/S có thể thay đổi khi học/undo ở tab khác dù content version không đổi. Danh sách dùng snapshot từng trang; Refresh reset cursor và đọc lại, không hứa membership toàn bộ trang đã được đóng băng.

### Trạng thái

| State | Hành vi |
|---|---|
| idle/loading | Query hiện tại+request seq |
| results/empty/error | Giữ filter khi error; Reset khi user chọn |
| tag_editing/invalid | Draft tags riêng |
| tag_saving/uncertain/conflict | C04 frozen/version |
| tag_saved | Refetch latest query; không ép card không match vào list |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. Query/read không cần Idempotency-Key; mutation trước network freeze/persist payload/version/key, storage fail không gửi. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-03, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.5-search-filter-tags-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Card.tags là schema mới cần Backend; D=Concept Difficulty hoặc no-state=0 sẽ cho kết quả sai. Search/paging mock không chứng minh SQL parameterization. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
