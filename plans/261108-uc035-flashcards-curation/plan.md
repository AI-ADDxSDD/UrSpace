---
title: "UC-03.5 Review and Select AI Flashcards"
description: "Kế hoạch triển khai chi tiết API Duyệt và Chọn lọc Thẻ Flashcard AI sinh, gom nhóm theo từng Khái niệm (Grouped by Concept), hỗ trợ 3 loại thẻ (Standard, Cloze, MultipleChoice), lưu trữ thẻ bị loại bỏ làm AI Feedback Dataset (status = DISCARDED), và Transaction chốt hạ nguyên tử nạp FSRS v4.5 bằng C# (.NET 8) & EF Core"
status: pending
priority: P1
branch: "main"
tags: [backend, flashcards, csharp, dotnet, postgresql, ef-core, fsrs, ai-ingestion]
blockedBy: [261108-uc034-dag-tarjan]
blocks: [261108-uc036-citation-source, 261108-uc0510-study-reminder, 261108-uc063-mnemonic-generator, 261108-uc064-save-mnemonic]
created: "2026-11-08T08:36:47.073Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.5 Review and Select AI Flashcards

## Overview

Kế hoạch này hiện thực hóa **UC-03.5 (Duyệt & Chọn lọc Thẻ Flashcard AI sinh)** thuộc phân hệ Backend AI Pipeline (Thành viên 2).
Đây là mắt xích chốt hạ khép lại toàn bộ quy trình nạp tài liệu tự động (Ingestion Pipeline) và bàn giao trực tiếp dữ liệu sang Lõi Thuật toán FSRS v4.5 (Thành viên 3) và Trải nghiệm Học Active Recall (Thành viên 5):
- Bố cục hiển thị **Gom nhóm theo từng Khái niệm (Grouped by Concept)** giúp học viên nắm bắt ngữ cảnh bài học trước khi đọc câu hỏi.
- Hỗ trợ **3 loại thẻ chuẩn nhận thức**: `STANDARD` (Q&A), `CLOZE` (Điền khuyết `{{c1::...}}`), `MULTIPLE_CHOICE` (Trắc nghiệm), bảo toàn nguyên vẹn công thức toán học LaTeX và khối mã nguồn.
- Cho phép **Chỉnh sửa nhanh (Inline Edit)** câu hỏi và đáp án trước khi lưu.
- Chiến lược AI Feedback: Các thẻ học viên bỏ chọn được chuyển sang **`status = 'DISCARDED'`** làm tập dữ liệu phản hồi tiêu cực để tinh chỉnh prompt Gemini.
- Thao tác **Chốt Hạ Nguyên Tử (Atomic Final Commit)** trong 1 Database Transaction: Đồng loạt chuyển Flashcards được chọn $\to$ `ACTIVE`, thẻ bỏ chọn $\to$ `DISCARDED`, Concepts $\to$ `ACTIVE`, ConceptRelations $\to$ `ACTIVE`, khởi tạo bảng `UserCardState` FSRS (`State = New`, `Due = UtcNow`) và đánh dấu `Document.Status = 'COMPLETED'`.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bảng `flashcards`, bảng `user_card_states` (FSRS), Enums `CardType`, `FlashcardStatus`, `FSRSCardState`, khóa ngoại Cascade |
| 2 | [Grouped Flashcards Service and Inline Edit](./phase-02-grouped-flashcards-service-and-inline-edit.md) | Pending | P1 | Service truy vấn gom nhóm theo ConceptNode, chỉnh sửa inline, thêm thủ công và đánh dấu Discarded |
| 3 | [Atomic Final Commit and RESTful Controller](./phase-03-atomic-final-commit-and-restful-controller.md) | Pending | P1 | RESTful Controller `FlashcardsController`, API Commit nguyên tử 5 bước trong 1 transaction, DTOs & Validation |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests cho truy vấn gom nhóm, Transaction Commit, Rollback khi lỗi, và Integration tests qua `WebApplicationFactory` |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.5-flashcards-curation-brainstorm.md`
  - SRS: `ref/Report3_Software_Requirement_Specification.md` (UC-03.5, S-06)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc034-dag-tarjan`: Cung cấp cấu trúc đồ thị tri thức DAG đã được khử chu trình.
- **Downstream Plans**:
  - `UC-03.6`: Đối chiếu Nguồn Tài liệu gốc (PDF Highlight dựa vào `source_page` và `source_excerpt`).
  - `UC-05.1`: Khởi tạo Hàng đợi Học hôm nay theo FSRS v4.5 (TV3 bắt trọn các thẻ mới từ `user_card_states`).
  - `UC-05.2`: Giao diện Lật thẻ & Tự kiểm tra Active Recall 3D (TV5).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-03.5 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[UI Default Selection / Cognitive UX]** Về chính sách chọn lọc thẻ mặc định trên giao diện khi người dùng vừa mở trang duyệt thẻ:
   - Options: Mặc định tick chọn TẤT CẢ thẻ AI sinh (is_selected = true) | Mặc định KHÔNG tick chọn thẻ nào (is_selected = false)
   - **Answer:** Mặc định KHÔNG tick chọn thẻ nào (`is_selected = false`), buộc người dùng phải tự tay bấm chọn từng thẻ muốn học
   - **Rationale:** Đây là thiết kế sư phạm chủ động (Active Engagement): Yêu cầu người học phải đọc kỹ từng thẻ và chủ động quyết định nạp thẻ nào, tránh tình trạng lười biếng bấm "Commit All" dẫn đến bộ thẻ bị rác hoặc quá tải thông tin.

2. **[AI Negative Feedback / Data Retention]** Về chính sách lưu trữ các thẻ bị bỏ chọn (Discarded Cards Policy) phục vụ phân tích cải thiện AI:
   - Options: Lưu vĩnh viễn trong CSDL với status = 'DISCARDED' (Recommended) | Lưu trữ có thời hạn (TTL 30-60 ngày)
   - **Answer:** Lưu vĩnh viễn trong CSDL với `status = 'DISCARDED'` làm tập dữ liệu phản hồi âm bản (Negative Feedback Dataset) để phân tích tinh chỉnh prompt Gemini (Recommended)
   - **Rationale:** Dữ liệu thẻ bị loại bỏ là tài sản quý giá để nhóm phát triển làm Direct Preference Optimization (DPO) hoặc tinh chỉnh Prompt Engineering trong các phiên bản sau, giúp AI ngày càng hiểu sâu phong cách học tập của sinh viên.

3. **[FSRS Initial Due Date / Scheduling]** Về thời điểm đến hạn ôn tập đầu tiên của thẻ trong thuật toán FSRS v4.5:
   - Options: DueDate = UtcNow (ngay lập tức) (Recommended) | DueDate = UtcNow + 1 ngày
   - **Answer:** `DueDate = UtcNow` (ngay lập tức) để thẻ mới sẵn sàng xuất hiện ngay trong Hàng đợi Học hôm nay của Thành viên 3 (UC-05.1) (Recommended)
   - **Rationale:** Giúp học viên có thể lập tức chuyển sang chế độ học Active Recall (UC-05.2) ngay sau khi duyệt tài liệu thành công mà không phải chờ sang ngày hôm sau.

#### Confirmed Decisions
- **Default Checkbox**: API trả về `is_selected = false` cho toàn bộ thẻ nháp để học viên chủ động tick chọn thẻ muốn nạp.
- **Negative Feedback Persistence**: Các thẻ không được chọn được lưu vĩnh viễn với `status = 'DISCARDED'`, không xóa cứng.
- **Immediate FSRS Due**: Toàn bộ thẻ Active được khởi tạo `UserCardState` với `DueDate = UtcNow` để nạp ngay vào hàng đợi học hôm nay.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ quyết định `is_selected = false` vào DTOs và Service của Phase 2.
- Kiểm tra tính nhất quán giữa Phase 1, Phase 2, Phase 3 và Phase 4: Toàn bộ API Contract, SQL Migration và Test Cases đều đồng bộ 100%. Kế hoạch UC-03.5 hoàn tất thẩm định và sẵn sàng bàn giao.
