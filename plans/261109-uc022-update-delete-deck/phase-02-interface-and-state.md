---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-02.2 tại S-03, menu bộ thẻ tại S-02. Chọn Chỉnh sửa, Lưu trữ, Khôi phục hoặc Xóa bộ thẻ. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Mở editor tải latest metadata/version; giữ draft riêng khi 409, hiện diff/giá trị server để người dùng quyết định.
2. Archive confirm nói rõ ngừng Public/học nhưng giữ tiến trình; restore là nút riêng.
3. Delete-impact xong mới bật confirm; text cảnh báo mất thẻ, log, tiến trình và pin mọi người học, nguồn còn; focus mặc định Hủy.
4. Success edit upsert/invalidate owner list/detail/tree; archive về danh sách active và thông báo; delete rời detail về /decks, refetch counts, không tự cộng/trừ.
5. Response success sau đóng modal chỉ cập nhật đúng account; không ép chuyển route khác người dùng đang xem.

Hủy draft/confirm trước gửi không ghi; khi đã gửi chỉ đóng UI và giữ recovery C04. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

### Trạng thái

| State | Hành vi |
|---|---|
| loading | Chờ GET/impact, chưa cho submit |
| editing/invalid | Giữ draft; errors inline+summary |
| confirming | Counts+version; Hủy an toàn |
| submitting/uncertain | Freeze/key; đóng chỉ ẩn |
| conflict | Giữ draft/confirm, đọc latest để review |
| succeeded/deleted | Upsert hoặc rời resource; receipt delete không resurrect |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. Query/read không cần Idempotency-Key; mutation trước network freeze/persist payload/version/key, storage fail không gửi. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-03, menu bộ thẻ tại S-02, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.2-update-delete-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Hard-delete ảnh hưởng mọi người học là nghiệp vụ SRS, cần confirm rõ. File nguồn vẫn còn; queue/worker coordination chưa có mã là gate thật. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
