---
phase: 1
title: "Storage and Streaming Layer"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Storage and Streaming Layer

## Overview
Xây dựng lớp dịch vụ lưu trữ và phân phối tệp tin trừu tượng `IFileStorageService` và `LocalFileStorageService` hỗ trợ đọc stream bất đồng bộ (`Stream` có thuộc tính `CanSeek == true`), phục vụ trực tiếp cho cơ chế **HTTP 206 Byte-Range Streaming** của ASP.NET Core:
- Cung cấp luồng stream an toàn, tối ưu hóa kích thước bộ đệm I/O ($64\text{KB}$ buffer) mà không bao giờ nạp toàn bộ tệp tin $25\text{MB}$ vào RAM.
- Nhận diện và quản lý chuẩn MIME type cho cả tài liệu PDF (`application/pdf`) và bài giảng slide PPTX (`application/vnd.openxmlformats-officedocument.presentationml.presentation`).
- Hỗ trợ cơ chế chia sẻ tệp tin đa luồng (`FileShare.Read`) để nhiều người học có thể cùng lúc mở đối chiếu một tài liệu mà không bị khóa I/O (File Lock).

## Requirements
- **Functional**:
  - `GetFileStreamAsync`:
    - Đầu vào: `storagePath` (đường dẫn lưu trữ cục bộ hoặc khóa tệp trên Object Storage).
    - Kiểm tra sự tồn tại của tệp trên đĩa lưu trữ. Nếu tệp không tồn tại, ném `FileNotFoundException`.
    - Mở luồng `FileStream` ở chế độ `FileMode.Open`, `FileAccess.Read`, `FileShare.Read`.
    - Đảm bảo luồng stream hỗ trợ tua phân đoạn byte (`CanSeek == true`), cho phép ASP.NET Core cắt nhỏ byte stream theo header `Range: bytes=start-end`.
  - Quản lý MIME Type:
    - Hàm tiện ích `GetMimeType(DocumentFileType fileType)` trả về đúng chuẩn Content-Type của IANA.
  - Quản lý dung lượng tệp tin:
    - Hàm `GetFileSizeAsync(string storagePath)` trả về dung lượng tệp (`long`) để tính toán header `Content-Range: bytes start-end/total`.
- **Non-functional**:
  - Tiêu thụ bộ nhớ: Không nạp quá $64\text{KB}$ bộ đệm I/O cho mỗi request stream.
  - Xử lý đồng thời (Concurrency): Hỗ trợ $\ge 100$ kết nối stream đồng thời trên cùng một tệp PDF $25\text{MB}$ mà không xảy ra xung đột khóa file.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Infrastructure.Storage`
- **Tương thích**: .NET 8 / C# 12 `System.IO.FileStream`.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IFileStorageService.cs`
  - `src/SmartLearn.Infrastructure/Storage/LocalFileStorageService.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/DependencyInjection.cs` (Đăng ký `IFileStorageService` dạng `Scoped` hoặc `Singleton`)

## Implementation Steps

1. **Định nghĩa Interface `IFileStorageService`**:
   ```csharp
   namespace SmartLearn.Application.Interfaces;

   public interface IFileStorageService
   {
       Task<Stream> GetFileStreamAsync(string storagePath, CancellationToken ct = default);
       Task<long> GetFileSizeAsync(string storagePath, CancellationToken ct = default);
       Task<bool> FileExistsAsync(string storagePath, CancellationToken ct = default);
       string GetMimeType(DocumentFileType fileType);
   }
   ```

2. **Cài đặt Lớp `LocalFileStorageService`**:
   ```csharp
   namespace SmartLearn.Infrastructure.Storage;

   public class LocalFileStorageService : IFileStorageService
   {
       private readonly ILogger<LocalFileStorageService> _logger;
       private const int BufferSize = 65536; // 64 KB buffer

       public LocalFileStorageService(ILogger<LocalFileStorageService> logger)
       {
           _logger = logger;
       }

       public Task<Stream> GetFileStreamAsync(string storagePath, CancellationToken ct = default)
       {
           if (string.IsNullOrWhiteSpace(storagePath))
               throw new ArgumentException("Storage path cannot be null or empty.", nameof(storagePath));

           if (!File.Exists(storagePath))
           {
               _logger.LogWarning("File not found at storage path: {Path}", storagePath);
               throw new FileNotFoundException($"Tài liệu không tồn tại trên hệ thống lưu trữ: {storagePath}");
           }

           // Mở FileStream với FileShare.Read để nhiều thread/request cùng đọc đồng thời
           var stream = new FileStream(
               storagePath,
               FileMode.Open,
               FileAccess.Read,
               FileShare.Read,
               BufferSize,
               FileOptions.Asynchronous | FileOptions.SequentialScan);

           return Task.FromResult<Stream>(stream);
       }

       public Task<long> GetFileSizeAsync(string storagePath, CancellationToken ct = default)
       {
           if (!File.Exists(storagePath))
               throw new FileNotFoundException($"Tài liệu không tồn tại: {storagePath}");

           var fileInfo = new FileInfo(storagePath);
           return Task.FromResult(fileInfo.Length);
       }

       public Task<bool> FileExistsAsync(string storagePath, CancellationToken ct = default)
       {
           return Task.FromResult(File.Exists(storagePath));
       }

       public string GetMimeType(DocumentFileType fileType)
       {
           return fileType switch
           {
               DocumentFileType.Pdf => "application/pdf",
               DocumentFileType.Pptx => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
               _ => "application/octet-stream"
           };
       }
   }
   ```

3. **Đăng ký Dịch vụ trong `DependencyInjection.cs`**:
   ```csharp
   services.AddSingleton<IFileStorageService, LocalFileStorageService>();
   ```

## Success Criteria
- [ ] Luồng `FileStream` mở thành công với thuộc tính `CanSeek == true`, sẵn sàng cho tính năng Range Processing của ASP.NET Core.
- [ ] Trả về đúng MIME type `application/pdf` và `application/vnd.openxmlformats-officedocument.presentationml.presentation`.
- [ ] Nhiều tiến trình đọc cùng 1 file đồng thời không bị lỗi `System.IO.IOException: The process cannot access the file because it is being used by another process`.

## Risk Assessment
- **Nguy cơ**: Tệp tin PDF bị xóa vật lý trên ổ cứng nhưng bản ghi `Document` trong CSDL vẫn tồn tại.
- **Giải pháp**: Hàm `GetFileStreamAsync` kiểm tra `File.Exists` trước khi mở và ném `FileNotFoundException` rõ ràng để Controller chuyển hóa thành mã lỗi HTTP 404 gọn gàng cho client.