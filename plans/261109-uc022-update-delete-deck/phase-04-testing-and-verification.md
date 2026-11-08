---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-02.2. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | Owner có Deck active | sửa title/metadata hợp lệ | 200 version+1, metadata round-trip, danh sách/detail cập nhật |
| AC02 | Title 2/3/100/101 hoặc trùng owner, tags 10/11 | PATCH | Rules 021 đúng FE/BE, không silent truncate; unique DB chặn race |
| AC03 | B là non-owner Public hoặc Guest | PATCH/archive/delete trực tiếp | 403/401; Private/non-owner 404; không side effect |
| AC04 | Deck active có cards/logs | archive | Dữ liệu giữ; Public/study/cardwrites bị chặn, owner vẫn đọc/restore/delete |
| AC05 | Deck archived | restore hoặc thử sửa nội dung | Restore có chủ ý thành công; edit khác bị chặn, không auto-restore |
| AC06 | Owner mở delete confirm | đọc impact rồi hủy hoặc title confirm sai | Không DELETE; counts/cảnh báo mọi-user data và source retained được đọc |
| AC07 | Deck có shared states/logs/pins/cache và Document | hard-delete | Cascade mọi user; giữ file/Document detach+receipt; không orphan |
| AC08 | Version đổi sau editor/impact | gửi write với version cũ | 409, giữ draft/confirm, không overwrite hoặc tự bump version |
| AC09 | Hai owner requests cùng version | PATCH đồng thời | Một thắng, một 409; không lost update |
| AC10 | Delete đã commit mất response | retry cùng key | 200 tombstone thành công, không 404 suy đoán hoặc tạo lại |
| AC11 | Failure giữa cascade transaction | retry sau rollback | Không xóa dở; receipt không commit riêng; lần sau đúng một effect |
| AC12 | Mạng timeout/503 rồi retry 429/403 | đóng/mở recovery | Giữ frozen snapshot, không key mới; reconcile theo C04 |
| AC13 | Form dirty | Escape rồi Keep editing/Discard | Giữ/bỏ đúng lựa chọn, focus về trigger; backdrop không làm mất dữ liệu |
| AC14 | Mutation success, refresh list lỗi | retry tải danh sách | Giữ success, không PATCH/DELETE lại bằng key mới |
| AC15 | Pending A rồi login B | response A về | Không cập nhật hoặc replay dưới B; refetch đúng subject |
| AC16 | VI/EN, keyboard, mobile/zoom | edit/archive/delete | Labels/errors/confirm/focus/contrast/responsive đạt C11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.2-update-delete-deck-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

Hard-delete ảnh hưởng mọi người học là nghiệp vụ SRS, cần confirm rõ. File nguồn vẫn còn; queue/worker coordination chưa có mã là gate thật. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
