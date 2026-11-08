---
title: "UC-04.1 Xem Bản đồ Cây Kỹ năng 2 D"
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

# UC-04.1 Xem Bản đồ Cây Kỹ năng 2 D

## Overview

Hiển thị đầy đủ DAG ACTIVE và trạng thái viewer với zoom/pan mượt, có lối truy cập keyboard. Phạm vi người dùng xác định ngày 09/11/2026; chỉ lập kế hoạch Frontend, chưa mã ứng dụng. Nguồn chung và các giả định C01–C12 ở [đối chiếu và contract](../reports/2026-11-09-member4-shared-contracts-and-source-review.md); quyết định riêng ở [brainstorm](../reports/2026-11-09-uc-04.1-skill-tree-view-brainstorm.md).

| Mục | Nội dung |
|---|---|
| Actor | Học viên/Giảng viên có quyền đọc Deck |
| Màn hình/trigger | S-04 từ S-03 — Mở tab Cây kỹ năng. |
| Preconditions | Đã xác thực, Deck read ab le; graph cung cấp snapshot content và metrics viewer từ Backend. |
| Postconditions | Viewer thấy đồ thị đúng hướng/status; không thay cạnh, thứ tự, FSRS, Document hoặc persisted layout. |
| Hủy/thất bại | Rời tab/Deck abort hoặc ignore read cũ; không mutation cần rollback. Lỗi giữ dữ liệu và context; chỉ báo kết quả đã xác định theo contract. |
| Ngoài phạm vi | Không edge editor/Tarjan/AI, không miniQuiz 04.4, không tạo graph knowledge hoặc cài React Flow ở nhiệm vụ này. |

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
- Graph read endpoint ACTIVE same content tx/version + personal metrics evaluated_at.
- Aggregation display status C09 và invalid graph error không frontend tự chữa.
- Private no-store, no-read-creates, event invalidate sau study/mutation; phase 4 benchmark fixture 300 nodes/edges.

Runtime queue/AI không tự thêm vào UI; mỗi tính năng tham khảo chỉ là touchpoint như C12. Chủ sở hữu Backend/thuật toán cung cấp readmodel/validation/transactions, thành viên 4 phụ trách giao diện và wiring. Không sửa plan khác để giả dependency đã hoàn thành.

## Validation Log

2026-11-09 — **automated agent review**. A requirements_ux, B architecture và C critical_reviewer khảo sát độc lập SRS/plan cũ/021, phản biện trực tiếp một vòng; root tự chốt bằng nguồn, không biểu quyết. Người dùng xác nhận danh sách và yêu cầu 4 phase; không gán xác nhận này cho giả định thiết kế.

### Confirmed Decisions — quyết định người điều phối, chưa triển khai
- React Flow đề xuất theo React host; reuse layout engine đã installed, nếu chưa có dùng deterministic topo-level placement O(V+E) nhỏ, không thêm auto-layout package.
- Node drag chỉ vị trí local, không edit order/edges; refresh content giữ viewport, đổiDeckfit mới.
- GAP>no Reviews gray>all reviewed valid R≥.9 green>learning; M.85 không màu xanh.
- Graph>300 fallback HTML list đầy đủ, canvas chủ động cảnh báo; ≤300 NFR cần benchmark thực.

Chi tiết C01–C12 là đề xuất mới hoặc inheritance có nhãn; không coi snippet Markdown/điểm audit hoặc pending plan là code/test đã chạy. Review bản đã ghi và kết quả kiểm tra cuối nằm ở [chỉ mục](../reports/2026-11-09-member4-planning-index.md). Implementation status vẫn pending.
