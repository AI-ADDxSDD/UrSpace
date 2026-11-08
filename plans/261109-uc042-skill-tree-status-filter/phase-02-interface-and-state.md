---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-04.2 tại S-04. Bật/tắt các trạng thái Chưa học, Đang học, Đã vững, Hổng. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Toolbar fieldset 4 checkbox label+icon+màu và counts; mặc định all, Reset gần toolbar.
2. Toggle derived view tức thì từ full graph; no fetch mỗi lần; announce số node hiện bằng live polite.
3. Nếu selected node bị ẩn, close drawer, focus checkbox vừa toggle; không mất keyboard focus.
4. No results phân biệt Deck 0 nodes và Filter 0 results; Reset all không pan/zoom.
5. Refetch 041 giữ set filter+viewport, recompute counts/status; nếu quyền mất clear view, không giữ old metrics on screen.

Reset chọn all; rời Deck reset default, không mutation API. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| graph_loading/error | Chờ/Retry qua 041, giữ filter trong Deck |
| all/subset/none | Local Set+derived view |
| selection_hidden | Close drawer+focus filter |
| refreshed | Apply status snapshot mới, giữ viewport/filter |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. UC này chỉ đọc, không cần Idempotency-Key hoặc snapshot mutation. C04 chỉ áp dụng khi chuyển sang UC chỉnh sửa có ghi dữ liệu. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-04, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.2-skill-tree-status-filter-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Lọc khỏi canvas không có nghĩa mất prerequisite. Tạo cạnh A→C để thay node B đang bị ẩn sẽ làm người học hiểu sai DAG; phải giữ đầy đủ ngữ cảnh cho drawer chi tiết. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
