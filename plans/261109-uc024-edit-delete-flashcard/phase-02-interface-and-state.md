---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-02.4 tại S-03. Chọn Sửa hoặc Xóa trên một thẻ ACTIVE. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

Trước khi bật editor, kiểm tra can_edit_text. Với schema CLOZE/MC chưa được Backend validate đầy đủ, hiển thị nội dung chỉ đọc và lý do; không đổi sang STANDARD hoặc làm rơi options. Request sửa semantic invalid phải bị từ chối atomic, draft giữ để sửa.
1. Mở editor với snapshot/version mới nhất, label loại thẻ chỉ đọc; preview dùng renderer 023.
2. Source badge Đã chỉnh sửa nếu content đổi; không quảng cáo đáp án đã sửa khớp nguyên văn nguồn.
3. Delete confirm nói tiến trình/log/pin liên quan của mọi người học bị xóa, Concept được giữ; focus Hủy.
4. Edit success upsert card và invalidate graph/queue/cache read, không reset selection/viewport; delete chọn card kế tiếp hoặc empty state, counts refetch.
5. 409 giữ draft và bản latest để review, không tự merge front/back khi không biết ý nghĩa; pending close/replay nhưC04.

Hủy editor/confirm trước gửi không ghi; close khi pending tuân C04. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| loading | Read card/version |
| editing/preview | Dirty raw draft |
| confirm_delete | Hiển thị impact semantic |
| saving/deleting/uncertain | Frozen operation/key |
| conflict | Latest và draft riêng |
| saved/deleted | Upsert/remove theo ID, focus phù hợp |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. Query/read không cần Idempotency-Key; mutation trước network freeze/persist payload/version/key, storage fail không gửi. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-03, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.4-edit-delete-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Example .Trim/type fallback trong old service không đủ validation. Schema MC/CLOZE chưa đầy đủ không được âm thầm đổi kiểu hoặc mất fields khi sửa. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
