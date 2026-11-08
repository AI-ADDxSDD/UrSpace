---
title: "UC-02.6 Chia sẻ và Sao chép Bộ thẻ"
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

# UC-02.6 Chia sẻ và Sao chép Bộ thẻ

## Overview

Chia sẻ link Public có kiểm soát và tạo bản Fork Private độc lập, không sao chép tiến trình hoặc nguồn. Phạm vi người dùng xác định ngày 09/11/2026; chỉ lập kế hoạch Frontend, chưa mã ứng dụng. Nguồn chung và các giả định C01–C12 ở [đối chiếu và contract](../reports/2026-11-09-member4-shared-contracts-and-source-review.md); quyết định riêng ở [brainstorm](../reports/2026-11-09-uc-02.6-share-fork-deck-brainstorm.md).

| Mục | Nội dung |
|---|---|
| Actor | Học viên/Giảng viên đã xác thực; Public viewer được Fork |
| Màn hình/trigger | S-03, Deck Public read-only — Nhấn Chia sẻ/Copy link hoặc Sao chép về thư viện. |
| Preconditions | Nguồn Public không archived để share/Fork; owner Private phải chủ động đổi Public qua 022 trước share. |
| Postconditions | Link chỉ tới Deck, không source; Fork có IDs/remapped graph riêng và fresh owner state, Private/title unique, nguồn độc lập. |
| Hủy/thất bại | Hủy Fork form trước gửi không ghi; copy-link lỗi cho copy thủ công; pending Fork theoC 04. Lỗi giữ dữ liệu và context; chỉ báo kết quả đã xác định theo contract. |
| Ngoài phạm vi | Không privateinvite/membership/enrollment, không đồng bộ Fork, không discovery 02.7/import 02.8. |

## Phases

| Phase | File | Status | Priority | Deliverables |
|---|---|---|---|---|
| 1 | [Requirements and Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Truy vết SRS, fields, request/response/error và giả định |
| 2 | [Interface and State](./phase-02-interface-and-state.md) | Pending | P1 | Luồng UI, form/read states, keyboard/focus, responsive, VI/EN |
| 3 | [Backend Integration](./phase-03-backend-integration.md) | Pending | P1 | Mock tối thiểu, quyền/version, API mapping, UI invalidation, bàn giao |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | 16 Given/When/Then, FE/API/DB/browser gates, chưa thực thi |

Phase 2 dùng mock contract để làm độc lập. Dependency phase 1→2→3→4 là thứ tự triển khai; đọc trước đặc tả mock ở phase 3 không tạo vòng phụ thuộc tài liệu.

## Dependencies & Downstream Touchpoints

Tài liệu: [SRS gốc](../../../Report3_Software_Requirement_Specification.docx), bộ [UC021](../261109-uc021-create-deck/plan.md), các nguồn trực tiếp trong brainstorm và C01–C12. Repository chưa có host/API/framework thực; React+TypeScript chỉ là đề xuất từ021, reuse host khi có. Không dựng Spec Kit/knowledge graph rỗng.

blockedBy=[] vì mock cho phép bắt đầu FE; tích hợp thật bị chặn nếu các bàn giao sau chưa có:
- Serializable snapshot clone locks source version/visibility/archive with writer coordination.
- Fresh IDs remap FK; active only; fresh owner states và drop source/personal data.
- Title unique per owner, receipt keep after delete, source changing không làm replay tạo lại fork.

Runtime queue/AI không tự thêm vào UI; mỗi tính năng tham khảo chỉ là touchpoint như C12. Chủ sở hữu Backend/thuật toán cung cấp readmodel/validation/transactions, thành viên 4 phụ trách giao diện và wiring. Không sửa plan khác để giả dependency đã hoàn thành.

## Validation Log

2026-11-09 — **automated agent review**. A requirements_ux, B architecture và C critical_reviewer khảo sát độc lập SRS/plan cũ/021, phản biện trực tiếp một vòng; root tự chốt bằng nguồn, không biểu quyết. Người dùng xác nhận danh sách và yêu cầu 4 phase; không gán xác nhận này cho giả định thiết kế.

### Confirmed Decisions — quyết định người điều phối, chưa triển khai
- Target Private cố định, title explicit; không tựPublication hoặc Tự suffix.
- Không copy source IDs/anchors hoặc state; fresh owner NEW/DueNow để queue đọc được cards.
- Source check+snapshot clone cùng tx; version đổi ngăn clone partial, replay lookup receipt trước source current checks.
- Source private/delete sau Fork không thu hồi target độc lập; không hứa thu hồi bytes đã Public.

Chi tiết C01–C12 là đề xuất mới hoặc inheritance có nhãn; không coi snippet Markdown/điểm audit hoặc pending plan là code/test đã chạy. Review bản đã ghi và kết quả kiểm tra cuối nằm ở [chỉ mục](../reports/2026-11-09-member4-planning-index.md). Implementation status vẫn pending.
