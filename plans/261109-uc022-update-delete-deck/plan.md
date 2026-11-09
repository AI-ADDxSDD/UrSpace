---
title: "UC-02.2 Cập nhật và Xóa Bộ thẻ"
description: "Kế hoạch Frontend thành viên 4, bốn phase; chưa triển khai ứng dụng."
status: pending
priority: P1
branch: "MaiNN"
tags: [frontend, member4, planning]
blockedBy: []
blocks: []
created: "2026-11-09"
createdBy: "Codex"
source: "user-request"
---

# UC-02.2 Cập nhật và Xóa Bộ thẻ

## Overview

Sửa metadata, archive/restore và hard-delete có xác nhận, bảo toàn quyền và tránh lost update. Phạm vi người dùng xác định ngày 09/11/2026; chỉ lập kế hoạch Frontend, chưa mã ứng dụng. Nguồn chung và các giả định C01–C12 ở [đối chiếu và contract](../reports/2026-11-09-member4-shared-contracts-and-source-review.md); quyết định riêng ở [brainstorm](../reports/2026-11-09-uc-02.2-update-delete-deck-brainstorm.md).

| Mục | Nội dung |
|---|---|
| Actor | Học viên/Giảng viên là owner |
| Màn hình/trigger | S-03, menu bộ thẻ tại S-02 — Chọn Chỉnh sửa, Lưu trữ, Khôi phục hoặc Xóa bộ thẻ. |
| Preconditions | Đã xác thực, Deck tồn tại; owner được đọc archived nhưng chỉ restore/delete lúc archived. |
| Postconditions | Sửa/archive tăng deck_version nguyên tử; delete xóa nội dung/dữ liệu học mọi viewer theo C05, nguồn/file và receipt còn. |
| Hủy/thất bại | Hủy draft/confirm trước gửi không ghi; khi đã gửi chỉ đóng UI và giữ recovery C04. Lỗi giữ dữ liệu và context; chỉ báo kết quả đã xác định theo contract. |
| Ngoài phạm vi | Không xóa tài liệu nguồn, không triển khai queue/AI, không sửa plan cũ. |

## Phases

| Phase | File | Status | Priority | Deliverables |
|---|---|---|---|---|
| 1 | [Requirements and Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Truy vết SRS, fields, request/response/error và giả định |
| 2 | [Interface and State](./phase-02-interface-and-state.md) | Pending | P1 | Luồng UI, form/read states, keyboard/focus, responsive, VI/EN |
| 3 | [Backend Integration](./phase-03-backend-integration.md) | Pending | P1 | Mock tối thiểu, quyền/version, API mapping, UI invalidation, bàn giao |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | 16 Given/When/Then, FE/API/DB/browser gates, chưa thực thi |

Phase 2 dùng mock contract để làm độc lập. Dependency phase 1→2→3→4 là thứ tự triển khai; đọc trước đặc tả mock ở phase 3 không tạo vòng phụ thuộc tài liệu.

## Dependencies & Downstream Touchpoints

Tài liệu: [SRS gốc](../../ref/Report3_Software_Requirement_Specification.docx), bộ [UC021](../261109-uc021-create-deck/plan.md), các nguồn trực tiếp trong brainstorm và C01–C12. Repository chưa có host/API/framework thực; React+TypeScript chỉ là đề xuất từ021, reuse host khi có. Không dựng Spec Kit/knowledge graph rỗng.

blockedBy=[] vì mock cho phép bắt đầu FE; tích hợp thật bị chặn nếu các bàn giao sau chưa có:
- GET/PATCH metadata và owner archive policy; DB unique title shared với 021.
- Delete-impact và cascade transaction mọi-user state/log/mastery/cache; giữ Document/file/receipt.
- Mọi upload/AI writer khóa/version/archive gate để không commit vào Deck vừa archive/delete.

Runtime queue/AI không tự thêm vào UI; mỗi tính năng tham khảo chỉ là touchpoint như C12. Chủ sở hữu Backend/thuật toán cung cấp readmodel/validation/transactions, thành viên 4 phụ trách giao diện và wiring. Không sửa plan khác để giả dependency đã hoàn thành.

## Validation Log

2026-11-09 — **automated agent review**. A requirements_ux, B architecture và C critical_reviewer khảo sát độc lập SRS/plan cũ/021, phản biện trực tiếp một vòng; root tự chốt bằng nguồn, không biểu quyết. Người dùng xác nhận danh sách và yêu cầu 4 phase; không gán xác nhận này cho giả định thiết kế.

### Confirmed Decisions — quyết định người điều phối, chưa triển khai
- Reuse form 021; danger confirm tách edit để không xóa nhầm.
- Archive chặn shared study/Public, owner restore/delete được; title archived vẫn unique.
- Nguồn/file giữ riêng; không gọi DELETE Document hoặc coi 404 là xác nhận xóa.
- Counts và version bind; stale confirm yêu cầu đọc lại, không tự cập nhật version.

Chi tiết C01–C12 là đề xuất mới hoặc inheritance có nhãn; không coi snippet Markdown/điểm audit hoặc pending plan là code/test đã chạy. Review bản đã ghi và kết quả kiểm tra cuối nằm ở [chỉ mục](../reports/2026-11-09-member4-planning-index.md). Implementation status vẫn pending.
