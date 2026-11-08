---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-04.1 tại S-04 từ S-03. Mở tab Cây kỹ năng. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Mở tab hiện loading/heading, GET graph; invalid snapshot không silent prune, báo lỗi và Reload.
2. Layout topological level, hướng mũi tên nền→nâng cao, legend text+icon; node focus/click mở 043.
3. Toolbar Zoom In/Out/Fit/Reset có label; wheel/touch pan không khóa cuộn trang, nút keyboard thay gesture.
4. Empty graph nói chưa có Concept, link thêm thẻ/upload khi route có; loading/error/no access tách rõ.
5. HTML node list đồng bộ selection/status, key Enter mở detail; giữ viewport qua refetch/invalidation và quay lại từ drawer.

Rời tab/Deck abort hoặc ignore read cũ; không mutation cần rollback. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| loading | Deck/subject/request seq |
| ready/empty | ACTIVE graph hoặc no Concept |
| invalid/error/denied | Không prune/fake graph; Retry read |
| selected | Selection ID, viewport local |
| large_graph | List đầy đủ, optional canvas warning |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. UC này chỉ đọc, không cần Idempotency-Key hoặc snapshot mutation. C04 chỉ áp dụng khi chuyển sang UC chỉnh sửa có ghi dữ liệu. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-04 từ S-03, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.1-skill-tree-view-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

60 FPS chưa đo; renderer/layout engine chưa installed. Không thể suy màu green từM>=.85 hoặc bỏ missingR. >300 ngoài NFR target được hiển thị đầy đủ bằng list. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
