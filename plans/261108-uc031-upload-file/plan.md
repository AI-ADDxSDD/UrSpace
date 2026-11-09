---
title: "UC-03.1 Document Upload and Ingestion Queue"
description: "Kế hoạch triển khai chi tiết API tiếp nhận tài liệu PDF/PPTX (<= 25MB, <= 100 trang/80 slides), xác thực Magic Bytes, tính toán SHA-256 deduplication kèm Redis Redlock, tự động tạo Deck, lưu trữ trừu tượng và đưa job vào Hangfire + Redis bằng C# (.NET 8 / ASP.NET Core)"
status: pending
priority: P2
branch: "main"
tags: [backend, upload, csharp, dotnet, hangfire, redis, postgresql, ai-ingestion]
blockedBy: []
blocks: [261108-uc032-sse-progress]
created: "2026-11-08T00:54:15.129Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.1 Document Upload and Ingestion Queue

## Overview

Kế hoạch này hiện thực hóa **UC-03.1 (Upload File tài liệu học tập)** bằng nền tảng **C# / ASP.NET Core (.NET 8/9)** kết nối PostgreSQL và hàng đợi **Hangfire + Redis** (thay thế hoàn hảo BullMQ trong hệ sinh thái .NET).
Hệ thống cung cấp endpoint tiếp nhận tài liệu PDF/PPTX ($\le 25\text{MB}$, $\le 100$ trang / $80$ slides), ngăn chặn triệt để lỗ hổng giả mạo file qua Magic Bytes, chống DoS "bom trang", loại bỏ lãng phí token AI bằng cơ chế File Deduplication (SHA-256) kèm Redis Redlock chống race condition, nhân bản dữ liệu an toàn từ `raw_ai_payload`, tự động sinh Deck khi học viên để trống, bọc lớp lưu trữ qua `IStorageService` và phân phối tác vụ nền vào Hangfire Dashboard.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database and Storage Layer](./phase-01-database-and-storage-layer.md) | Pending | P2 | PostgreSQL `documents` schema (kèm `raw_ai_payload JSONB`), EF Core migration, `IStorageService` & `LocalStorageService` (C#) |
| 2 | [Hangfire Queue and Worker Setup](./phase-02-bullmq-queue-and-worker-setup.md) | Pending | P2 | Hangfire + Redis storage setup, Dashboard UI (`/hangfire` cho Admin UC-07.5), retry & backoff policy |
| 3 | [Upload Controller and Validation](./phase-03-upload-controller-and-validation.md) | Pending | P1 | ASP.NET Core Controller, 25MB limit, kiểm tra số trang (PDF $\le 100$, PPTX $\le 80$), Magic bytes, SHA-256 + Redis Redlock, Auto Create Deck, Clone từ `raw_ai_payload` |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit tests (magic bytes, page counter, hashing, storage), WebApplicationFactory integration tests |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.1-upload-file-brainstorm.md`
  - SRS: [Report 3 SRS](../../ref/Report3_Software_Requirement_Specification.md) (d?ng b? [requirements.md](../../ref/requirements.md)) (UC-03.1, S-06, NF-01, UC-07.5)
- **Downstream Phases phụ thuộc vào output của UC-03.1**:
  - `UC-03.2`: Server-Sent Events (SSE) theo dõi % tiến độ bóc tách job từ Hangfire.
  - `UC-03.3` & `UC-03.5`: Hangfire Worker đọc file từ `file_path` để đưa vào Gemini RAG bóc tách Concepts và Flashcards, lưu bản gốc vào `raw_ai_payload`.
  - `UC-03.6`: Đối chiếu trích dẫn và highlight trên file PDF gốc (file được lưu vĩnh viễn trên đĩa).
  - `UC-07.5`: Cổng Admin giám sát hàng đợi sử dụng trực tiếp Hangfire Dashboard.

---

## Validation Log

### Session 1 — 2026-11-08
- Xác định tech stack chính: C# (.NET 8/9, ASP.NET Core Web API, EF Core).
- Chiến lược Deduplication: Clone dữ liệu độc lập cho user mới.
- Vòng đời tệp: Lưu trữ vĩnh viễn trên local disk phục vụ highlight PDF (UC-03.6).
- Slide parsing: Bóc tách cấu trúc theo từng slide index kèm Speaker Notes.

### Session 2 — 2026-11-08 (Giải quyết 5 Điểm Lấn cấn Kỹ thuật)
**Trigger:** Phản biện chi tiết các góc khuất kiến trúc và rủi ro vận hành thực chiến.
**5 Quyết định bổ sung:**

1. **[Queue Engine]** Sử dụng **Hangfire (.NET)** kết hợp `Hangfire.Redis.StackExchange` để thay thế hoàn toàn BullMQ:
   - Thuần 100% C# .NET, không lo lệch schema Lua script như khi gọi BullMQ của Node.js.
   - Tích hợp sẵn Web Dashboard tại `/hangfire` giúp thỏa mãn luôn tính năng **UC-07.5 (Giám sát hàng đợi của Admin)** mà không cần viết thêm code.
2. **[Concurrency / Race Condition]** Xử lý đồng thời upload cùng 1 file bằng **Redis Redlock (`lock:doc_hash:{sha256}`)**:
   - Nếu file đang `PROCESSING`: User 2 được liên kết vào cùng `file_hash` với trạng thái `WAITING_ORIGINAL`, dùng chung link SSE theo dõi tiến độ, tuyệt đối không gọi Gemini lần 2.
3. **[Deduplication Privacy & Fast Clone]** Bảo mật dữ liệu cá nhân qua `raw_ai_payload`:
   - Thêm cột `raw_ai_payload JSONB` trong bảng `documents` lưu bản thô do Gemini sinh.
   - Khi User B upload file trùng, hệ thống clone từ `raw_ai_payload` bằng SQL bulk insert ($<15\text{ms}$), không copy bản cá nhân của User A.
4. **[DoS Defense / Page Bomb]** Bổ sung giới hạn số trang đọc nhanh từ metadata:
   - **PDF**: Dùng `PdfSharpCore` đọc xref table trong $<5\text{ms}$, chặn cứng $\le 100$ trang.
   - **PPTX**: Dùng `ZipArchive` đọc nhanh `docProps/app.xml` trong $<2\text{ms}$, chặn cứng $\le 80$ slides.
   - Vượt quá $\to$ HTTP 400 Bad Request kèm thông điệp hướng dẫn chia nhỏ tài liệu.
5. **[Auto Create Deck]** Tự động sinh Deck nếu `deck_id` rỗng:
   - Title: Chuẩn hóa từ tên file gốc (bỏ extension, thay `_` bằng space).
   - Visibility: `Private`.
   - Category: `"Tài liệu tải lên"`.
   - Trả về `deck_id` trong HTTP response để Frontend cập nhật ngay.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ 5 giải pháp vào cả 4 Phase files.
- Loại bỏ hoàn toàn rủi ro lệch schema BullMQ, giải quyết triệt để race condition và bảo vệ quota Gemini khỏi tấn công DoS trang.
