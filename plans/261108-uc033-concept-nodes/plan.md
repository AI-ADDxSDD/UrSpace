---
title: "UC-03.3 Review and Curate AI ConceptNodes"
description: "Kế hoạch triển khai chi tiết API Xem, Kiểm duyệt, Chỉnh sửa, Thêm mới thủ công, Đổi thứ tự (Reorder) và Xóa có cảnh báo các Khái niệm AI sinh (ConceptNodes) theo mô hình Staging/Draft, phân loại 3 cấp độ (Basic/Intermediate/Advanced), giới hạn 1-50 concepts và Batch Commit/Discard bằng C# (.NET 8) & EF Core"
status: pending
priority: P2
branch: "main"
tags: [backend, concepts, csharp, dotnet, postgresql, ef-core, ai-ingestion]
blockedBy: [261108-uc031-upload-file, 261108-uc032-sse-progress]
blocks: [261108-uc034-dag-tarjan]
created: "2026-11-08T01:37:39.318Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.3 Review and Curate AI ConceptNodes

## Overview

Kế hoạch này hiện thực hóa **UC-03.3 (Xem & Duyệt Khái niệm AI sinh)** thuộc phân hệ Backend AI Pipeline (Thành viên 2).
Hệ thống cung cấp giao diện và bộ API quản lý hạt nhân tri thức `ConceptNodes`:
- Áp dụng mô hình **Staging / Draft State (`status = 'DRAFT'`)** cho phép học viên tự do sửa tên/tóm tắt, đổi cấp độ nhận thức hoặc xóa các khái niệm rác mà không làm bẩn CSDL chính thức.
- Rút gọn phân loại sang **3 cấp độ thực tế: `BASIC` (Cơ bản), `INTERMEDIATE` (Trung bình), `ADVANCED` (Nâng cao)** phục vụ trực tiếp cho thuật toán dò lỗ hổng $A(u)$ của Thành viên 3.
- Hỗ trợ đổi thứ tự kéo thả qua API `PUT /concepts/reorder`.
- Giới hạn an toàn: Tối thiểu 1 khái niệm (chặn commit nếu 0 concepts) và tối đa 50 khái niệm/tài liệu.
- Cơ chế **Cascade Delete an toàn** có API xem trước tác động (`GET /delete-impact`) cảnh báo số lượng flashcards và cạnh DAG bị ảnh hưởng.
- Hỗ trợ thao tác hàng loạt **Commit (`status = 'ACTIVE'`)** hoặc **Discard (Xóa sạch Draft, chuyển Document sang `CANCELLED`)**.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bảng `concepts`, Enum `DifficultyLevel`, `ConceptStatus`, Index và Cascade Foreign Keys |
| 2 | [Concepts CRUD and Impact Service](./phase-02-concepts-crud-and-impact-service.md) | Pending | P1 | Service quản lý CRUD, Reorder API, logic xem trước tác động xóa (`delete-impact`), batch commit & discard |
| 3 | [Concepts API Controller and Authorization](./phase-03-concepts-api-controller-and-authorization.md) | Pending | P1 | RESTful Controller `ConceptsController`, kiểm tra quyền sở hữu Document/Deck, giới hạn 1-50 concepts, DTOs & Validation |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests & Integration tests (`WebApplicationFactory`) kiểm tra CRUD, Reorder, Cascade delete và Commit/Discard |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.3-concept-nodes-brainstorm.md`
  - SRS: [Report 3 SRS](../../ref/Report3_Software_Requirement_Specification.md) (d?ng b? [requirements.md](../../ref/requirements.md)) (UC-03.3, S-06)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc031-upload-file`: Cung cấp `document_id`, `deck_id` và Hangfire Worker.
  - `plans/261108-uc032-sse-progress`: Thông báo `event: complete` báo hiệu tài liệu đã sẵn sàng để duyệt.
- **Downstream Plans**:
  - `UC-03.4`: Chỉnh sửa Cạnh Tiên quyết (DAG) & Giải thuật Tarjan (kết nối các ConceptNodes này với nhau).
  - `UC-03.5`: Duyệt & Chọn lọc Thẻ Flashcard AI sinh (thẻ gắn liền với từng ConceptNode).
  - `UC-03.6`: Đối chiếu Nguồn Tài liệu gốc (dựa vào `source_page` và `source_excerpt`).
  - `UC-04.1 $\to$ UC-04.3`: Dựng Canvas Cây kỹ năng 2D (TV4 vẽ các Node lên React Flow).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-03.3 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Feature / UX]** Về cơ chế sắp xếp thứ tự hiển thị của các khái niệm (order_index), bạn chọn phương án nào?
   - Options: Cung cấp API PUT /concepts/reorder nhận danh sách [{ conceptId, orderIndex }] | Không cần API đổi thứ tự | Fractional Indexing (LexoRank)
   - **Answer:** Cung cấp API PUT /concepts/reorder nhận danh sách [{ conceptId, orderIndex }] để cập nhật thứ tự hàng loạt khi kéo thả trên UI (Recommended)
   - **Rationale:** Cho phép học viên tự do sắp xếp lại trình tự logic của các khái niệm trước khi sinh cạnh đồ thị DAG ở UC-03.4, giúp đồ thị tri thức phản ánh đúng luồng học tập cá nhân.

2. **[Boundary Constraints]** Quy định về số lượng khái niệm tối thiểu và tối đa cho một tài liệu bóc tách là gì?
   - Options: Tối thiểu 1, tối đa 50 concepts | Tối thiểu 1, không giới hạn tối đa
   - **Answer:** Giới hạn: Tối thiểu 1 khái niệm (chặn Commit nếu 0 concepts), tối đa 50 khái niệm/tài liệu (đảm bảo Cây tri thức không bị vỡ/quá tải) (Recommended)
   - **Rationale:** Ngăn chặn việc người dùng xóa sạch concepts rồi bấm Commit tạo bộ thẻ rỗng, đồng thời chặn việc tài liệu quá dài làm phình to đồ thị DAG vượt quá khả năng xử lý mượt mà của Canvas 2D (TV4).

3. **[Lifecycle / Cleanup]** Khi người dùng bấm 'Hủy bỏ' (Discard) không duyệt bộ thẻ nữa, hệ thống sẽ xử lý bản ghi Document và file vật lý như thế nào?
   - Options: Xóa sạch concepts Draft, cập nhật Document.Status = 'CANCELLED', giữ file trên đĩa | Xóa triệt để (Hard Delete)
   - **Answer:** Xóa sạch các concepts Draft, cập nhật Document.Status = 'CANCELLED', giữ lại file trên đĩa để audit log (dọn dẹp định kỳ sau) (Recommended)
   - **Rationale:** Giữ lại audit log cho Admin giám sát (UC-07.5) để biết tỉ lệ hủy bỏ/chấp nhận của học viên đối với tài liệu tải lên, đồng thời dọn sạch CSDL concepts Draft tránh làm rác hệ thống.

#### Confirmed Decisions
- **Reorder API**: Triển khai `PUT /api/v1/documents/{documentId}/concepts/reorder` cập nhật batch trong 1 transaction.
- **Concept Limits**: Chặn Commit nếu số lượng concepts $< 1$, giới hạn tối đa $\le 50$ concepts cho 1 tài liệu.
- **Discard Handling**: Xóa toàn bộ concepts Draft, cập nhật `Document.Status = Cancelled`, bảo toàn audit log.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ 3 quyết định vào các phase files.
- Không còn mâu thuẫn hay điểm nghẽn. Kế hoạch sẵn sàng chuyển sang triển khai (Cook).
