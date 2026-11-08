---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [1, 2, 3]
---

# Phase 4: Testing and Verification

<!-- Updated: Validation Session 2 - Bổ sung test kiểm tra số trang/slides, Redis Redlock đồng thời, Auto Deck Creation và Clone từ raw_ai_payload -->

## Overview
Xây dựng bộ kiểm thử tự động toàn diện bằng C# (xUnit, FluentAssertions, Moq, `WebApplicationFactory`) bao phủ toàn bộ luồng tiếp nhận upload tài liệu, kiểm tra giới hạn số trang (PDF $\le 100$, PPTX $\le 80$), Redlock xử lý đồng thời, tự động tạo Deck, và nhân bản độc lập từ `raw_ai_payload`.

## Requirements
- **Functional**:
  - Unit tests cho `FileSignatureValidator`: nhận diện đúng PDF, PPTX và từ chối file giả mạo (EXE, ZIP rỗng).
  - Unit tests cho `PageCountValidator`:
    - File PDF 50 trang $\to$ Hợp lệ.
    - File PDF 105 trang $\to$ Ném ngoại lệ vượt quá giới hạn 100 trang.
    - File PPTX 40 slides $\to$ Hợp lệ.
    - File PPTX 85 slides $\to$ Ném ngoại lệ vượt quá giới hạn 80 slides.
    - File PDF hỏng cấu trúc (corrupted) $\to$ Trả về mã lỗi định dạng hỏng.
  - Unit tests cho `RedisDistributedLockService`: mô phỏng 2 threads cùng acquire lock, thread 2 phải chờ hoặc fail gracefully.
  - Integration tests cho API `POST /api/v1/documents/upload`:
    - Upload khi `deck_id` null $\to$ Tự động tạo Deck mới trong DB với tên chuẩn hóa.
    - Upload đồng thời cùng 1 file từ 2 user $\to$ User 1 enqueue job Hangfire, User 2 nhận trạng thái `WaitingOriginal` cùng SSE stream URL.
    - Upload file đã hoàn tất (`Completed`) $\to$ Trả về HTTP 200, clone dữ liệu từ `raw_ai_payload` vào deck mới.
- **Non-functional**:
  - Code Coverage $\ge 85\%$.
  - Tự động dọn dẹp các file sinh ra trong `storage/test-uploads/` sau khi kết thúc test.

## Architecture
- **Framework**: xUnit, FluentAssertions, Moq, `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`).
- **Test Database**: PostgreSQL test container (hoặc SQLite in-memory) kết hợp In-Memory / Test Redis instance.

## Related Code Files
- Create:
  - `tests/SmartLearn.UnitTests/Security/FileSignatureValidatorTests.cs`
  - `tests/SmartLearn.UnitTests/Security/PageCountValidatorTests.cs`
  - `tests/SmartLearn.UnitTests/Locking/RedisDistributedLockServiceTests.cs`
  - `tests/SmartLearn.UnitTests/Storage/LocalStorageServiceTests.cs`
  - `tests/SmartLearn.IntegrationTests/Controllers/DocumentsControllerUploadTests.cs`
  - `tests/SmartLearn.IntegrationTests/Fixtures/sample-normal.pdf` (50 trang)
  - `tests/SmartLearn.IntegrationTests/Fixtures/sample-oversized-pages.pdf` (120 trang)
  - `tests/SmartLearn.IntegrationTests/Fixtures/sample-normal.pptx` (30 slides)
  - `tests/SmartLearn.IntegrationTests/Fixtures/sample-oversized-slides.pptx` (95 slides)

## Implementation Steps
1. **Tạo Fixture Files**:
   - Dùng script C# sinh nhanh file PDF 50 trang và 120 trang phục vụ test.
   - Tạo file PPTX mẫu 30 slides và 95 slides.
2. **Viết Unit Tests cho `PageCountValidator`**:
   - Assert `PageCountValidator.GetPdfPageCount(stream)` trả về đúng số trang.
   - Assert file vượt 100 trang bị từ chối với message chính xác.
3. **Viết Integration Tests cho Concurrency (Race Condition)**:
   - Dùng `Task.WhenAll` gửi 2 request upload đồng thời với cùng 1 file.
   - Kiểm tra kết quả:
     - Request 1: HTTP 202, tạo job trong Hangfire.
     - Request 2: HTTP 202, status `WaitingOriginal`, KHÔNG tạo thêm job mới trong Hangfire.
4. **Viết Integration Tests cho Tự động tạo Deck**:
   - Gửi request không kèm `deck_id`.
   - Kiểm tra DB: có một record `Deck` mới được tạo với `Title` đúng định dạng, `Visibility = Private`.
5. **Viết Integration Tests cho Fast Clone**:
   - Chuẩn bị record mẫu có `RawAiPayload` chứa 20 Concepts và 50 Flashcards.
   - Gửi upload file trùng $\to$ Kiểm tra thời gian phản hồi $< 100\text{ms}$ và DB của user mới có đủ 20 Concepts và 50 Flashcards.

## Success Criteria
- [ ] Toàn bộ test suite chạy pass 100% qua lệnh `dotnet test`.
- [ ] Code coverage đạt $\ge 85\%$.
- [ ] Không rò rỉ file tạm hoặc lock trong Redis sau khi test xong.

## Risk Assessment
- **Nguy cơ**: Chạy test đồng thời đa luồng có thể gây flaky test nếu Redis connection bị nghẽn.
- **Giải pháp**: Tăng timeout Redlock trong môi trường test lên 15 giây và cô lập Redis test database.
