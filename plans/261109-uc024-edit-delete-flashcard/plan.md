---
title: "UC-02.4 Chỉnh sửa và Xóa Thẻ"
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

# UC-02.4 Chỉnh sửa và Xóa Thẻ

## Overview

Sửa front/back an toàn và xóa thẻ có xác nhận, giữ đúng lifecycle học cá nhân. Phạm vi người dùng xác định ngày 09/11/2026; chỉ lập kế hoạch Frontend, chưa mã ứng dụng. Nguồn chung và các giả định C01–C12 ở [đối chiếu và contract](../reports/2026-11-09-member4-shared-contracts-and-source-review.md); quyết định riêng ở [brainstorm](../reports/2026-11-09-uc-02.4-edit-delete-flashcard-brainstorm.md).

| Mục | Nội dung |
|---|---|
| Actor | Học viên/Giảng viên là owner |
| Màn hình/trigger | S-03 — Chọn Sửa hoặc Xóa trên một thẻ ACTIVE. |
| Preconditions | Card ACTIVE thuộc Deck active của owner; đọc current card và deck_version. |
| Postconditions | Edit giữ card ID/type/state/log/pin, invalidates shared mnemonic nếu content đổi; delete cascade card data nhưng giữ Concept/edges. |
| Hủy/thất bại | Hủy editor/confirm trước gửi không ghi; close khi pending tuân C04. Lỗi giữ dữ liệu và context; chỉ báo kết quả đã xác định theo contract. |
| Ngoài phạm vi | Không đổi loại thẻ, không edit DRAFT/DISCARDED, không reset FSRS hoặc xóa Concept theo card. |

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
- Atomic edit+cache invalidation, preserve state/log/pin/type/structured payload.
- Hard-delete card cascade mọi-user child data nhưng không concept/edge; active-only authorization.
- Deck aggregate version mọi writer, receipt edit/delete và is_content_edited source badge.

Runtime queue/AI không tự thêm vào UI; mỗi tính năng tham khảo chỉ là touchpoint như C12. Chủ sở hữu Backend/thuật toán cung cấp readmodel/validation/transactions, thành viên 4 phụ trách giao diện và wiring. Không sửa plan khác để giả dependency đã hoàn thành.

## Validation Log

2026-11-09 — **automated agent review**. A requirements_ux, B architecture và C critical_reviewer khảo sát độc lập SRS/plan cũ/021, phản biện trực tiếp một vòng; root tự chốt bằng nguồn, không biểu quyết. Người dùng xác nhận danh sách và yêu cầu 4 phase; không gán xác nhận này cho giả định thiết kế.

### Confirmed Decisions — quyết định người điều phối, chưa triển khai
- Reuse editor 023; chỉ front/back writable để không đổi type/semantic fields ngoài yêu cầu.
- Cache invalidate atomic khi content đổi, no-op edit không gọi AI; pins/log/state giữ.
- Delete last card vẫn giữ Concept/DAG hợp lệ, chuyển display status theo viewer khi refetch.
- Delete request receipt riêng operation, absent sau success replay thành công.

Chi tiết C01–C12 là đề xuất mới hoặc inheritance có nhãn; không coi snippet Markdown/điểm audit hoặc pending plan là code/test đã chạy. Review bản đã ghi và kết quả kiểm tra cuối nằm ở [chỉ mục](../reports/2026-11-09-member4-planning-index.md). Implementation status vẫn pending.
