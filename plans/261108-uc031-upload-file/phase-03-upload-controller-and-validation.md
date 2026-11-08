---
phase: 3
title: "Upload Controller and Validation"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: Upload Controller and Validation

<!-- Updated: Validation Session 2 - Thêm kiểm tra số trang (PDF <= 100, PPTX <= 80), Redis Redlock chống Race Condition, Auto Deck Creation và Fast Clone từ raw_ai_payload -->

## Overview
Xây dựng ASP.NET Core Web API Controller tiếp nhận multipart upload ($\le 25\text{MB}$), bộ lọc xác thực Magic Bytes, kiểm tra nhanh giới hạn số trang (PDF $\le 100$, PPTX $\le 80$), tính toán băm SHA-256 stream, cơ chế Redis Redlock chống race condition, tự động tạo Deck nếu thiếu, và xử lý Deduplication (clone từ `raw_ai_payload` hoặc chia sẻ SSE stream).

## Requirements
- **Functional**:
  - Endpoint: `POST /api/v1/documents/upload`.
  - Nhận form-data: `IFormFile file` (bắt buộc, $\le 26,214,400\text{ bytes}$), `Guid? deckId`, `string? title`.
  - **Giới hạn dung lượng**: Từ chối ngay nếu $> 25\text{MB}$ (HTTP 413).
  - **Xác thực Magic Bytes**: Kiểm tra nhị phân nhận diện PDF (`%PDF-`, hex `25 50 44 46`) và PPTX (`PK..`, hex `50 4B 03 04`).
  - **Giới hạn số trang (Chống DoS Token)**:
    - PDF: Dùng `PdfSharpCore` đọc xref table trong $<5\text{ms}$, chặn cứng $\le 100$ trang.
    - PPTX: Dùng `ZipArchive` đọc file XML `docProps/app.xml` trong $<2\text{ms}$, chặn cứng $\le 80$ slides.
    - Vượt quá $\to$ HTTP 400 Bad Request kèm thông điệp chi tiết.
  - **Tự động sinh Deck**: Nếu `deckId` để trống:
    - Tạo `Deck` mới: `Title` chuẩn hóa từ tên file, `Visibility = Private`, `Category = "Tài liệu tải lên"`.
  - **Cơ chế Redis Redlock chống Race Condition**:
    - Acquire lock `lock:doc_hash:{sha256}` (TTL: 10s).
    - *Trường hợp 1 (`COMPLETED`)*: File đã bóc tách xong trước đó. Hệ thống đọc `raw_ai_payload` và thực hiện fast bulk-insert clone toàn bộ Concepts/Cards sang Deck mới của User B ($<15\text{ms}$). Trả về HTTP 200 OK (`is_deduplicated: true`).
    - *Trường hợp 2 (`PROCESSING`)*: File đang được một User khác upload xử lý trước đó vài giây. Hệ thống tạo record document cho User B trỏ cùng `file_hash` với trạng thái `WAITING_ORIGINAL`. Trả về HTTP 202 kèm chính đường dẫn SSE đang chạy (không gọi Gemini lần 2).
    - *Trường hợp 3 (File mới)*: Lưu file vào `LocalStorageService`, tạo record DB (`Status = Queued`), đẩy job vào Hangfire, nhả lock. Trả về HTTP 202.
- **Non-functional**:
  - Memory: Không load toàn bộ file 25MB vào RAM (streaming I/O).
  - Response time $\le 800\text{ms}$.

## Architecture
- **Validation Pipeline**:
  - `[RequestSizeLimit(26214400)]` trên Controller.
  - `FileSignatureValidator`: Đọc 4 bytes đầu xác thực MIME.
  - `PageCountValidator`: Đọc metadata đếm trang/slides siêu tốc.
  - `StreamHasher`: Tính SHA-256 song song với pipe ghi ra đĩa.
  - `IDistributedLockService`: Quản lý Redis Redlock.

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/DocumentsController.cs`
  - `src/SmartLearn.Application/Documents/Commands/UploadDocument/UploadDocumentCommand.cs`
  - `src/SmartLearn.Application/Documents/Commands/UploadDocument/UploadDocumentCommandHandler.cs`
  - `src/SmartLearn.Application/Documents/DTOs/UploadDocumentResponseDto.cs`
  - `src/SmartLearn.Infrastructure/Security/FileSignatureValidator.cs`
  - `src/SmartLearn.Infrastructure/Security/PageCountValidator.cs`
  - `src/SmartLearn.Infrastructure/Locking/RedisDistributedLockService.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Cấu hình FormOptions & DI services)

## Implementation Steps
1. **Xây dựng `PageCountValidator`**:
   - Đối với PDF:
     ```csharp
     public static int GetPdfPageCount(Stream stream)
     {
         using var doc = PdfReader.Open(stream, PdfDocumentOpenMode.InformationOnly);
         return doc.PageCount;
     }
     ```
   - Đối với PPTX:
     ```csharp
     public static int GetPptxSlideCount(Stream stream)
     {
         using var zip = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
         var entry = zip.GetEntry("docProps/app.xml");
         if (entry == null) return 0;
         using var reader = new StreamReader(entry.Open());
         var xml = XDocument.Load(reader);
         XNamespace ns = "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties";
         var slidesElem = xml.Root?.Element(ns + "Slides");
         return slidesElem != null ? int.Parse(slidesElem.Value) : 0;
     }
     ```
2. **Xây dựng `RedisDistributedLockService`**:
   - Sử dụng `IDatabase.LockTakeAsync($"lock:doc_hash:{hash}", token, TimeSpan.FromSeconds(10))`.
3. **Triển khai Luồng Upload & Deduplication trong Handler**:
   - Bước 1: Validate Magic Bytes & Giới hạn 25MB.
   - Bước 2: Pipe stream tính SHA-256 hash và kiểm tra số trang/slides ($\le 100$ trang, $\le 80$ slides).
   - Bước 3: Nếu `deckId` null $\to$ Tự tạo Deck mới với `Title` chuẩn hóa.
   - Bước 4: Acquire Redlock.
   - Bước 5: Kiểm tra `Documents` table:
     - Nếu đã `Completed`: Đọc `raw_ai_payload`, clone Concepts/Flashcards sang `deckId` mới trong transaction. Trả về HTTP 200.
     - Nếu đang `Processing`: Tạo bản ghi `Status = WaitingOriginal`, trả về HTTP 202 kèm SSE URL của file gốc.
     - Nếu chưa có: Ghi file ra `LocalStorageService`, tạo bản ghi `Status = Queued`, gọi `HangfireDocumentQueueService.EnqueueIngestion`, trả về HTTP 202.
   - Bước 6: Release Redlock.
4. **Xây dựng `DocumentsController`**:
   - Endpoint: `[HttpPost("upload")]` với response DTO chứa `DocumentId`, `DeckId`, `Status`, `IsDeduplicated`, `SseStreamUrl`.

## Success Criteria
- [ ] Upload file PDF 120 trang $\to$ Bị từ chối ngay với HTTP 400 "Vượt quá giới hạn 100 trang".
- [ ] Upload file PPTX 90 slides $\to$ Bị từ chối ngay với HTTP 400 "Vượt quá giới hạn 80 slides".
- [ ] Upload khi không truyền `deck_id` $\to$ Hệ thống tự sinh Deck mới và gán `deck_id` hợp lệ.
- [ ] Hai request upload cùng 1 file đồng thời $\to$ Redlock giữ lại request 2, request 2 nhận chung tiến trình của request 1 mà không tạo job kép.
- [ ] Upload file đã bóc tách xong $\to$ HTTP 200 trong $<100\text{ms}$, nhân bản toàn bộ thẻ từ `raw_ai_payload` sang deck mới.

## Risk Assessment
- **Nguy cơ**: File PDF bị lỗi cấu trúc khiến thư viện `PdfReader` văng Exception.
- **Giải pháp**: Bọc `try-catch` quanh `PageCountValidator`, nếu file bị hỏng cấu trúc (corrupted file) $\to$ Trả về HTTP 400 "File tài liệu bị lỗi hoặc hỏng định dạng".
