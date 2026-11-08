---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State

## Overview

Thiết kế UI UC-04.3 tại S-04 drawer. Click/Enter một Concept từ canvas hoặc HTML node list. Reuse component host; chưa chọn/cài dependency. Contract phase 1 và C01–C12 là ràng buộc.

## Requirements

### Luồng chính, hủy và retry

1. Click/Enter node mở drawer, focus heading/loading status; giữ graph viewport/filter; xác định subject/Deck/concept/request seq.
2. Response đúng context hiển summary, direct list và chuỗi tiên quyết ancestor graph/list accessible.
3. Click ancestor đổi selection nội bộ drawer; hidden filter badge, không tự reset filter hoặc pan; close về origin visible hoặc toolbar.
4. Cards section count/list read-only, errors/retry part riêng; link editor chỉ khi owner và route available.
5. Source CTA theo capability, mở citation sub flow UC036;403 hiển message không đóng drawer, summary không thay thế trích dẫn.

Đóng drawer quay focus origin visible hoặc filter; abort/ignore old reads, không rollback write. Lỗi giữ draft/filter/selection; success dùng ID/projection server, không cộng count mù. Read bị lỗi giữ context để Retry; mutation unknown dùng C04 thay vì báo chắc chưa ghi.

Phân biệt citation Concept và card: Concept AI gốc có thể cho owner xem nguồn dù thẻ thủ công gắn vào không có nguồn. Người dùng chủ động mở ancestor đang bị filter ẩn được giữ drawer với badge; chỉ đóng tự động khi toggle/refetch làm selection đang visible chuyển thành hidden.

### Trạng thái

| State | Hành vi |
|---|---|
| closed/loading | Selected ID/expected version/request seq |
| ready/empty_cards/empty_prereqs | Từng section rõ, không placeholder fake |
| changed/error/denied | 409 refresh graph,404 clear, network Retry |
| source_error | Giữ detail, báo nguồn bị từ chối |
| closing | Abort/ignore late, restore focus |

## Architecture / Interfaces

State local theo subject+Deck+resource; async response dùng abort/sequence kiểm tra context trước áp UI. UC này chỉ đọc, không cần Idempotency-Key hoặc snapshot mutation. C04 chỉ áp dụng khi chuyển sang UC chỉnh sửa có ghi dữ liệu. Subject switch xóa protected state/cache; không áp response account cũ. Success callback và điều hướng đúng luồng trên, refresh lỗi tách mutation success.

Keyboard/a11y: semantic labels, input help/errors và summary focus; dialog/drawer có accessible name, Tab/ShiftTab/Escape/restore, không backdrop làm mất draft. Enter trong textarea xuống dòng, IME không submit/query sớm; tags nếu có flush trước save. Graph có HTML node list và control zoom thay gesture. VI/EN, UTF-8; status có text/icon ngoài màu;320–1280px, zoom200%, mobile keyboard không che focus. C11 là checklist chung, không tự thêm shortcut học tập.

## Related Code Files

Không có file FE hiện tại. Sau scaffold dùng feature module tại S-04 drawer, host controls/locale/renderer/router/cache; không tạo app hoặc generalized state layer trong nhiệm vụ này. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.3-concept-detail-prerequisites-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Đảo nhầm hướng incoming/outgoing sẽ dạy sai tiên quyết; snapshot mix gây cạnh/ancestor giả. Capability không thay server auth, summary không là nguồn trích dẫn. Chưa có UI chạy; mock không phải bằng chứng browser/a11y/performance.
