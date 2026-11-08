---
phase: 1
title: "Database and Storage Layer"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database and Storage Layer

<!-- Updated: Validation Session 2 - Thêm cột raw_ai_payload JSONB và quan hệ Deck tự sinh -->

## Overview
Thiết kế và triển khai tầng dữ liệu (Entity Framework Core / PostgreSQL) cho thực thể `Document` (bổ sung cột `raw_ai_payload JSONB`), thiết lập quan hệ tự sinh với `Deck` cùng với tầng trừu tượng hóa lưu trữ file `IStorageService` viết bằng C# (triển khai cục bộ qua `LocalStorageService`).

## Requirements
- **Functional**:
  - Tạo bảng `documents` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `deck_id UUID REFERENCES decks(id) ON DELETE SET NULL`
    - `title VARCHAR(255) NOT NULL`
    - `original_name VARCHAR(255) NOT NULL`
    - `file_path VARCHAR(500) NOT NULL`
    - `file_size_bytes BIGINT NOT NULL`
    - `page_count INT NOT NULL DEFAULT 0`
    - `mime_type VARCHAR(100) NOT NULL`
    - `file_hash CHAR(64) NOT NULL`
    - `status VARCHAR(30) NOT NULL DEFAULT 'QUEUED'` -- QUEUED, PROCESSING, COMPLETED, FAILED, WAITING_ORIGINAL
    - `raw_ai_payload JSONB` -- Lưu snapshot nguyên bản Concepts, Cards, DAG do Gemini sinh ra
    - `error_message TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Hỗ trợ lưu trữ file an toàn vào thư mục `storage/uploads/` với tên file được mã hóa GUID để chống Directory Traversal.
  - Vòng đời tệp: Lưu trữ vĩnh viễn trên đĩa để phục vụ UC-03.6 (Highlight trang PDF).
- **Non-functional**:
  - Index `file_hash` để truy vấn kiểm tra trùng lặp tệp dưới $5\text{ms}$.
  - Storage Interface decoupling hoàn toàn với Controllers để sẵn sàng cắm Cloudflare R2 / AWS S3 sau này.

## Architecture
- **CSDL & ORM**: PostgreSQL kết hợp `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Lưu trữ JSONB**: Thuộc tính `RawAiPayload` được ánh xạ sang kiểu `jsonb` trong PostgreSQL để lưu trữ cấu trúc cây tri thức và thẻ gốc mà không làm loãng cấu trúc quan hệ.
- **Storage Pattern (C#)**:
  - `IStorageService`: Interface khai báo `Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken ct)`.
  - `LocalStorageService`: Quản lý ghi stream nhị phân ra đĩa cục bộ qua `FileStream`, cấu trúc thư mục con `storage/uploads/{yyyy}/{MM}/`.

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/Document.cs`
  - `src/SmartLearn.Domain/Enums/DocumentStatus.cs`
  - `src/SmartLearn.Application/Common/Interfaces/IStorageService.cs`
  - `src/SmartLearn.Infrastructure/Storage/LocalStorageService.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/DocumentConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateDocumentsTableWithRawPayload.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs`

## Implementation Steps
1. **Định nghĩa Entity `Document` trong C#**:
   - Khai báo model với các thuộc tính:
     ```csharp
     public class Document
     {
         public Guid Id { get; set; }
         public Guid UserId { get; set; }
         public Guid? DeckId { get; set; }
         public string Title { get; set; } = string.Empty;
         public string OriginalName { get; set; } = string.Empty;
         public string FilePath { get; set; } = string.Empty;
         public long FileSizeBytes { get; set; }
         public int PageCount { get; set; }
         public string MimeType { get; set; } = string.Empty;
         public string FileHash { get; set; } = string.Empty;
         public DocumentStatus Status { get; set; } = DocumentStatus.Queued;
         public string? RawAiPayload { get; set; } // Map to jsonb
         public string? ErrorMessage { get; set; }
         public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
         public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
     }
     ```
2. **Cấu hình Entity Type Configuration (EF Core)**:
   - Ánh xạ bảng `documents`, cột `RawAiPayload` có kiểu cột `.HasColumnType("jsonb")`.
   - Cấu hình index: `.HasIndex(d => d.FileHash)`, `.HasIndex(d => d.UserId)`, `.HasIndex(d => d.Status)`.
   - Sinh migration EF Core: `dotnet ef migrations add CreateDocumentsTableWithRawPayload`.
3. **Xây dựng `IStorageService` Interface**:
   ```csharp
   public interface IStorageService
   {
       Task<string> SaveAsync(Stream fileStream, string originalFileName, string contentType, CancellationToken cancellationToken = default);
       Task<Stream> GetStreamAsync(string relativePath, CancellationToken cancellationToken = default);
       Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
       Task<bool> ExistsAsync(string relativePath, CancellationToken cancellationToken = default);
   }
   ```
4. **Triển khai `LocalStorageService`**:
   - Đọc đường dẫn từ `IConfiguration["Storage:LocalRootPath"]` (mặc định: `storage/uploads`).
   - Tự động tạo thư mục theo năm/tháng.
   - Ghi file qua `FileStream` với `FileMode.CreateNew`, buffer 81920 bytes. Trả về đường dẫn lưu trữ tương đối.

## Success Criteria
- [ ] Chạy migration EF Core thành công, tạo bảng `documents` trên PostgreSQL kèm cột `raw_ai_payload jsonb` và các index.
- [ ] `LocalStorageService` ghi file stream mượt mà, không khóa file, kích thước file lưu trữ khớp 100% file gốc.
- [ ] Unit tests cho `LocalStorageService` bao phủ các kịch bản: ghi stream, lấy stream, kiểm tra file tồn tại và dọn dẹp file.

## Risk Assessment
- **Nguy cơ**: Đường dẫn tệp chứa ký tự độc hại (`../../`).
- **Giải pháp**: Tạo tên tệp mới bằng `Guid.NewGuid().ToString("N") + Path.GetExtension(originalName)`, loại bỏ hoàn toàn tên file từ người dùng khi lưu trên đĩa.
