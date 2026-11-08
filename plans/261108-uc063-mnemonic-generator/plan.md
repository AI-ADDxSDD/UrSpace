---
title: "UC-06.3 AI Cognitive Mnemonic Generator"
description: "Kế hoạch triển khai chi tiết API Yêu cầu AI sinh Mẹo nhớ Nhận thức (Cognitive Mnemonic Generator) sử dụng Google Gemini 1.5 Flash với Structured JSON Output (3 dạng: Hình ảnh kỳ dị, Thơ vè lục bát/viết tắt, Ẩn dụ đời thường), lưu trữ Cache cấp độ Thẻ (flashcard_mnemonics) giúp tiết kiệm 90% chi phí API và kích hoạt thủ công On-demand bằng C# (.NET 8) & EF Core"
status: pending
priority: P1
branch: "main"
tags: [backend, ai, gemini, mnemonics, csharp, dotnet, postgresql, ef-core, cognitive-science]
blockedBy: [261108-uc035-flashcards-curation]
blocks: [261108-uc064-save-mnemonic]
created: "2026-11-08T09:16:02.755Z"
createdBy: "ck:plan"
source: skill
---

# UC-06.3 AI Cognitive Mnemonic Generator

## Overview

Kế hoạch này hiện thực hóa **UC-06.3 (Yêu cầu AI sinh Mẹo nhớ - Mnemonic)** thuộc phân hệ Hỗ trợ Nhận thức & AI Pipeline (Thành viên 2 kết hợp Thành viên 3).
Tính năng này đóng vai trò "cứu cánh nhận thức" (Cognitive Lifeline) cho người học khi gặp các câu hỏi hóc búa hoặc các thẻ học bị quên nhiều lần (Leech Cards, `lapses >= 3` theo `BR-06`):
- **3 Trụ Cột Nhận Thức Khoa Học**:
  1. `visual`: Hình ảnh thị giác kỳ dị, bất ngờ hoặc hài hước (ứng dụng Thuyết mã hóa kép của Paivio).
  2. `rhyme`: Bài thơ ngắn 2-4 câu (lục bát, vè vui nhộn) hoặc từ viết tắt gieo vần dễ nhớ (Acoustic Chunking).
  3. `analogy`: Câu chuyện ẩn dụ đời thường bình dị (Conceptual Metaphor) giải thích cặn kẽ bản chất khái niệm.
- **Tốc độ & Ổn định Định dạng**: Sử dụng mô hình `gemini-1.5-flash` với cấu hình **Structured JSON Output Schema**, trả về dữ liệu chuẩn xác trong $\sim 1\text{s}$, không bao giờ bị lỗi format.
- **Tiết kiệm $\ge 90\%$ Chi phí Token qua Cache CSDL (`flashcard_mnemonics`)**: Mỗi thẻ học chỉ sinh mẹo nhớ 1 lần duy nhất; mọi học viên học chung bộ thẻ sẽ được tái sử dụng tức thì ($< 5\text{ms}$) với chi phí token bằng $0\text{đ}$.
- **Trải nghiệm Học tập Tĩnh lặng (Distraction-Free UX)**: Kích hoạt thủ công qua icon cây gậy phép trên mặt sau thẻ (On-demand), không tự động hiện popup gây gián đoạn mạch ôn tập.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bảng `flashcard_mnemonics`, constraint `UNIQUE(card_id)`, khóa ngoại Cascade, chỉ mục tối ưu |
| 2 | [Gemini Client and Mnemonic Service](./phase-02-gemini-client-and-mnemonic-service.md) | Pending | P1 | Client gọi Gemini 1.5 Flash với Structured Output JSON Schema, Service quản lý cache và hỗ trợ `forceRegenerate` |
| 3 | [RESTful Controller and Integration](./phase-03-restful-controller-and-integration.md) | Pending | P1 | Controller `FlashcardMnemonicsController`, API `GET /api/v1/flashcards/{cardId}/mnemonic`, xác thực quyền truy cập |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests với mock Gemini Client, Integration tests kiểm tra Cache hit/miss, Rate limit fallback |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-06.3-mnemonic-generator-brainstorm.md`
  - SRS: `ref/Report3_Software_Requirement_Specification.md` (UC-06.3, BR-06, S-07)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc035-flashcards-curation`: Cung cấp cấu trúc dữ liệu bảng `flashcards` và `user_card_states`.
- **Downstream Plans**:
  - `UC-06.4`: Lưu Mẹo nhớ vào Mặt sau Thẻ (cho phép học viên ghim mẹo nhớ ưng ý vào thẻ).
  - `UC-05.2`: Giao diện Lật thẻ Active Recall (hiển thị nút kích hoạt mẹo nhớ khi lật mặt sau).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-06.3 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[AI Model Choice / Latency]** Về mô hình Gemini ưu tiên sử dụng để sinh Mẹo nhớ nhận thức:
   - Options: gemini-1.5-flash (~1s latency, chi phí siêu rẻ) (Recommended) | gemini-1.5-pro (~3-4s latency)
   - **Answer:** `gemini-1.5-flash`: Tốc độ phản hồi cực nhanh (~1s), chi phí siêu rẻ, rất phù hợp cho ứng dụng thời gian thực (Recommended)
   - **Rationale:** Người học đang trong phiên lật thẻ Active Recall cần phản hồi tức thì để không bị ngắt mạch tư duy. Gemini 1.5 Flash đáp ứng hoàn hảo tiêu chí tốc độ và chất lượng Structured Output JSON.

2. **[Language / Bilingual Support]** Về ngôn ngữ của mẹo nhớ sinh ra:
   - Options: Luôn sinh mẹo nhớ bằng TIẾNG VIỆT (Recommended) | Tự động theo ngôn ngữ của thẻ
   - **Answer:** Luôn sinh mẹo nhớ bằng TIẾNG VIỆT (kể cả khi thẻ học thuật ngữ Tiếng Anh) để tạo móc neo văn hóa và đời sống gần gũi nhất với sinh viên Việt Nam (Recommended)
   - **Rationale:** Mẹo nhớ hoạt động hiệu quả nhất khi chạm vào các bối cảnh đời sống, văn hóa quen thuộc (ví dụ ví von với chợ búa, giao thông Việt Nam hoặc vần điệu thơ lục bát). Kể cả môn học là IT hay Tiếng Anh, mẹo giải thích bằng Tiếng Việt giúp não bộ ghi nhớ sâu hơn.

3. **[Cache Invalidation Policy]** Về chính sách làm mới Cache khi thẻ bị sửa nội dung (Front/Back):
   - Options: Tự động xóa mẹo nhớ cũ trong Cache khi thẻ được cập nhật nội dung (Recommended) | Giữ nguyên mẹo nhớ cũ
   - **Answer:** Tự động xóa mẹo nhớ cũ trong Cache khi thẻ được cập nhật nội dung (Front/Back) để lần sau bấm sẽ sinh lại mẹo nhớ chuẩn xác với câu hỏi mới (Recommended)
   - **Rationale:** Tránh tình trạng rác ngữ nghĩa (Stale Mnemonic): Khi người dùng sửa câu hỏi hoặc đáp án thì mẹo nhớ cũ không còn khớp nữa. Việc tự động xóa bản ghi trong `flashcard_mnemonics` đảm bảo tính toàn vẹn tri thức.

#### Confirmed Decisions
- **AI Model**: Cố định sử dụng `gemini-1.5-flash` với Structured JSON Schema.
- **Vietnamese Mnemonics**: System Instruction bắt buộc AI sáng tạo mẹo nhớ bằng Tiếng Việt thân thuộc.
- **Automatic Invalidation**: Khi `FlashcardsService.UpdateFlashcardInlineAsync` được gọi, hệ thống tự động xóa bản ghi `FlashcardMnemonic` liên quan nếu có.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ quy ước và quyết định vào các phase files.
- Kế hoạch hoàn tất thẩm định, sẵn sàng bàn giao triển khai.
