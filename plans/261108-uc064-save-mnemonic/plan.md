---
title: "UC-06.4 Save Mnemonic to Card Back"
description: "Kế hoạch triển khai chi tiết API Lưu Mẹo nhớ vào Mặt sau Thẻ (Personalized Mnemonic Pinning), lưu trữ cá nhân hóa trong bảng user_card_states (bảo toàn 100% đáp án gốc của Flashcard), cho phép chỉnh sửa nội dung mẹo nhớ trước khi ghim và hỗ trợ gỡ ghim (Unpin) linh hoạt bằng C# (.NET 8) & EF Core"
status: pending
priority: P1
branch: "main"
tags: [backend, mnemonics, personalization, csharp, dotnet, postgresql, ef-core, fsrs]
blockedBy: [261108-uc063-mnemonic-generator, 261108-uc035-flashcards-curation]
blocks: []
created: "2026-11-08T09:33:24.707Z"
createdBy: "ck:plan"
source: skill
---

# UC-06.4 Save Mnemonic to Card Back

## Overview

Kế hoạch này hiện thực hóa **UC-06.4 (Lưu Mẹo nhớ vào Mặt sau Thẻ)** thuộc phân hệ Hỗ trợ Nhận thức & Lõi FSRS (Thành viên 2 & Thành viên 3).
Tính năng này hoàn thiện mảnh ghép cá nhân hóa nhận thức sau khi AI sinh 3 dạng mẹo nhớ ở UC-06.3:
- **Cá nhân hóa 100% (Bảo toàn Đáp án Gốc)**: Lưu trữ thông tin ghim mẹo nhớ trong thực thể `UserCardState` (`pinned_mnemonic`, `pinned_mnemonic_type`, `pinned_at`) thay vì sửa trường `flashcards.back`. Điều này giải quyết triệt để bài toán: Khi nhiều học viên cùng học chung một Bộ bài do Giảng viên chia sẻ (Shared/Public Deck), mỗi người có thể tự chọn mẹo nhớ riêng (thơ vè, hình ảnh, hoặc ẩn dụ) mà không làm biến dạng đáp án chuẩn học thuật của người khác.
- **Tùy biến Lời văn Linh hoạt (Inline Customization)**: Học viên có thể chỉnh sửa lại từ ngữ của bài thơ hoặc câu chuyện trước khi ghim để tối đa hóa hiệu quả ghi nhớ theo phong cách riêng.
- **Hiển thị Tinh tế trong Phiên Lật thẻ Active Recall (UC-05.2)**: Khi học viên lật mặt sau, giao diện hiển thị đáp án chính thức ở trên, và khung Callout nổi bật chứa mẹo nhớ cá nhân ở dưới kèm huy hiệu phân loại (`[THƠ VÈ]`, `[HÌNH ẢNH]`, `[ẨN DỤ]`).
- **Gỡ ghim Linh hoạt (Unpin)**: Khi học viên đã thuộc làu kiến thức và không cần dùng mẹo nhớ nữa, có thể gọi API `DELETE /pin` để gỡ bỏ.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bổ sung cột `pinned_mnemonic`, `pinned_mnemonic_type`, `pinned_at` vào bảng `user_card_states`, migration PostgreSQL |
| 2 | [Mnemonic Pinning Service and Validation](./phase-02-mnemonic-pinning-service-and-validation.md) | Pending | P1 | Interface `IMnemonicPinningService`, nghiệp vụ ghim mẹo nhớ, tự động khởi tạo state FSRS nếu chưa có, gỡ ghim (Unpin) |
| 3 | [RESTful Controller and DTOs](./phase-03-restful-controller-and-dtos.md) | Pending | P1 | Controller `FlashcardMnemonicPinController`: API `PUT /pin`, `DELETE /pin`, `GET /pin`, DTOs và Swagger Documentation |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests xác thực tính cô lập giữa các học viên học chung bộ thẻ, Integration tests kiểm tra Pin, Edit, Unpin |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-06.4-save-mnemonic-brainstorm.md`
  - SRS: `ref/Report3_Software_Requirement_Specification.md` (UC-06.4, UC-06.3, S-05, S-07)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc035-flashcards-curation`: Cung cấp cấu trúc bảng `user_card_states` và `flashcards`.
  - `plans/261108-uc063-mnemonic-generator`: Cung cấp 3 dạng mẹo nhớ nhận thức (Visual, Rhyme, Analogy).
- **Downstream Plans**:
  - `UC-05.2`: Giao diện Lật thẻ Active Recall (render Callout mẹo nhớ ở mặt sau thẻ).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-06.4 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Study Queue Performance / Latency]** Về cơ chế truyền tải Mẹo nhớ đã ghim vào Giao diện Lật thẻ Active Recall (UC-05.2):
   - Options: Nạp sẵn pinned_mnemonic vào DTO thẻ trong Hàng đợi Học (UC-05.1/05.2) để khi lật mặt sau hiển thị tức thì (zero latency) (Recommended) | Khi lật mặt sau mới gọi API riêng
   - **Answer:** Nạp sẵn `pinned_mnemonic` vào DTO thẻ trong Hàng đợi Học (UC-05.1/05.2) để khi lật mặt sau hiển thị tức thì (zero latency, không cần gọi thêm API phụ) (Recommended)
   - **Rationale:** Giữ vững dòng tập trung cao độ (Flow State) của học viên trong phiên học Active Recall; loại bỏ hoàn toàn độ trễ mạng hoặc màn hình loading giật lag khi lật mặt sau.

2. **[Architecture Simplicity / Scope]** Về việc hỗ trợ Mẹo nhớ mặc định của Tác giả bộ thẻ (Deck Author Default Mnemonic):
   - Options: Chỉ quản lý mẹo cá nhân trên user_card_states để kiến trúc tinh gọn nhất (Recommended) | Bổ sung default_mnemonic vào bảng flashcards
   - **Answer:** Chỉ quản lý mẹo cá nhân trên `user_card_states` để kiến trúc tinh gọn nhất, không làm phức tạp bảng flashcards gốc (Recommended)
   - **Rationale:** Tuân thủ nguyên tắc YAGNI & KISS: Bảng `flashcards` thuần khiết lưu nội dung học thuật chuẩn. Toàn bộ nhu cầu hỗ trợ nhớ là trải nghiệm cá nhân hóa thuộc về `user_card_states`.

3. **[Persistence / Stability]** Về chính sách xử lý Mẹo nhớ đã ghim khi thẻ học được chỉnh sửa nội dung:
   - Options: Giữ nguyên mẹo đã ghim khi sửa thẻ, người học có thể chủ động bấm gỡ hoặc đổi mẹo bất cứ lúc nào (Recommended) | Tự động gỡ ghim khi sửa thẻ
   - **Answer:** Giữ nguyên mẹo đã ghim khi sửa thẻ, người học có thể chủ động bấm gỡ hoặc đổi mẹo bất cứ lúc nào (Recommended)
   - **Rationale:** Người học thường chỉ sửa lỗi chính tả nhỏ hoặc thêm ví dụ ngắn; việc xóa phăng bài thơ hay mẹo nhớ mà họ đã dày công chọn lọc sẽ gây ức chế (Frustration). Học viên hoàn toàn có quyền chủ động bấm nút Unpin khi thấy không còn phù hợp.

#### Confirmed Decisions
- **Eager Loading in Study Queue**: DTO `CardStudyDto` trong UC-05.1/05.2 sẽ bao gồm sẵn `pinned_mnemonic` và `pinned_mnemonic_type`.
- **Pure State Architecture**: Bảng `flashcards` không thêm trường mẹo nhớ; mọi dữ liệu ghim nằm gọn gàng trong `user_card_states`.
- **Learner Autonomy**: Mẹo đã ghim được bảo tồn xuyên suốt, người học hoàn toàn làm chủ việc gỡ bỏ (Unpin) hoặc cập nhật (Pin mới).

#### Whole-Plan Consistency Sweep
- Đã đồng bộ quyết định vào các phase files.
- Toàn bộ 4 phase kỹ thuật nhất quán 100%, sẵn sàng triển khai.
