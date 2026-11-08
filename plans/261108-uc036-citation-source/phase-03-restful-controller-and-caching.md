---
phase: 3
title: "RESTful Controller and Caching"
status: pending
priority: P1
dependencies: [phase-02-citation-service-and-security]
---

# Phase 3: RESTful Controller and Caching

## Overview
Xây dựng Controller `DocumentCitationController` trong tầng API của ASP.NET Core, triển khai đầy đủ các tiêu chuẩn giao thức web hiện đại (RFC 7233) để phân phối tệp tin học tập lớn ($25\text{MB}$):
- **Cơ chế Byte-Range Streaming (HTTP 206 Partial Content)**: Thông qua `FileStreamResult` kết hợp `EnableRangeProcessing = true`, cho phép trình duyệt hoặc thư viện PDF.js tải từng phần trang tệp theo yêu cầu.
- **Cơ chế Caching thông minh (ETag & Cache-Control)**: Tận dụng mã băm SHA-256 (`FileHashSha256`) đã tính sẵn từ lúc upload ở UC-03.1 để gán ETag, hỗ trợ phản hồi HTTP 304 Not Modified khi tệp không thay đổi.
- **Quản lý Vòng đời Stream (Stream Lifecycle & Cancellation)**: Tự động đóng luồng tệp tin khi client ngắt kết nối hoặc hoàn thành lượt tải, không rò rỉ File Handle trên hệ điều hành.

## Requirements
- **Functional**:
  - `GET /api/v1/documents/{documentId}/citation`:
    - Headers: `Authorization: Bearer <token>` (hoặc Cookie xác thực).
    - Query Params: `cardId: Guid?`, `conceptId: Guid?`.
    - Trả về: `HTTP 200 OK` kèm `CitationMetadataDto`.
  - `GET /api/v1/documents/{documentId}/stream`:
    - Headers: `Authorization: Bearer <token>` (hoặc Cookie xác thực), `Range: bytes=start-end` (tùy chọn), `If-None-Match` (tùy chọn).
    - Xác thực: Kiểm tra quyền truy cập thông qua `ValidateDocumentAccessAsync`.
    - Mở luồng stream từ `IFileStorageService`.
    - Phản hồi:
      - Khi có header `Range`: Trả về `HTTP 206 Partial Content` kèm các header:
        - `Accept-Ranges: bytes`
        - `Content-Range: bytes start-end/total`
        - `Content-Length: chunk_size`
        - `Content-Type: application/pdf` (hoặc PPTX)
        - `ETag: "{sha256_hash}"`
      - Khi client gửi `If-None-Match: "{sha256_hash}"` khớp với ETag: ASP.NET Core tự động ngắt và trả về `HTTP 304 Not Modified` (body rỗng).
      - Khi không có header `Range`: Trả về `HTTP 200 OK` stream toàn bộ tệp.
- **Non-functional**:
  - Tốc độ phản hồi chunk range: $< 20\text{ms}$.
  - Chống rò rỉ File Descriptor: Quản lý Stream bằng `FileStreamResult` của framework để tự động giải phóng tài nguyên khi hoàn tất hoặc client ngắt kết nối (`HttpContext.RequestAborted`).

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Api.Controllers`
- **Framework Core**: `Microsoft.AspNetCore.Mvc.FileStreamResult`, `Microsoft.Net.Http.Headers.EntityTagHeaderValue`.

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/DocumentCitationController.cs`

## Implementation Steps

1. **Cài đặt Controller `DocumentCitationController`**:
   ```csharp
   namespace SmartLearn.Api.Controllers;

   [ApiController]
   [Route("api/v1/documents/{documentId:guid}")]
   [Authorize]
   public class DocumentCitationController : ControllerBase
   {
       private readonly IDocumentCitationService _citationService;
       private readonly IFileStorageService _storageService;
       private readonly ILogger<DocumentCitationController> _logger;

       public DocumentCitationController(
           IDocumentCitationService citationService,
           IFileStorageService storageService,
           ILogger<DocumentCitationController> logger)
       {
           _citationService = citationService;
           _storageService = storageService;
           _logger = logger;
       }

       private Guid GetCurrentUserId()
       {
           var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
               throw new UnauthorizedAccessException("Người dùng chưa được xác thực danh tính.");
           return userId;
       }

       [HttpGet("citation")]
       [ProducesResponseType(typeof(ApiResponse<CitationMetadataDto>), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status401Unauthorized)]
       [ProducesResponseType(StatusCodes.Status403Forbidden)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
       public async Task<IActionResult> GetCitationMetadata(
           [FromRoute] Guid documentId,
           [FromQuery] Guid? cardId,
           [FromQuery] Guid? conceptId,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();
           var metadata = await _citationService.GetCitationMetadataAsync(documentId, cardId, conceptId, userId, ct);
           return Ok(ApiResponse<CitationMetadataDto>.Ok(metadata));
       }

       [HttpGet("stream")]
       [ProducesResponseType(StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status206PartialContent)]
       [ProducesResponseType(StatusCodes.Status304NotModified)]
       [ProducesResponseType(StatusCodes.Status403Forbidden)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
       public async Task<IActionResult> StreamDocument(
           [FromRoute] Guid documentId,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();

           // 1. Xác thực phân quyền truy cập tài liệu
           var document = await _citationService.ValidateDocumentAccessAsync(documentId, userId, ct);

           // 2. Mở FileStream từ tầng lưu trữ
           var stream = await _storageService.GetFileStreamAsync(document.StoragePath, ct);
           var mimeType = _storageService.GetMimeType(document.FileType);

           // 3. Thiết lập Header Caching
           var etag = new EntityTagHeaderValue($"\"{document.FileHashSha256}\"");
           Response.Headers.CacheControl = "private, max-age=86400"; // Cache trong 24 giờ trên client

           // 4. Trả về FileStreamResult hỗ trợ Byte-Range Processing
           return new FileStreamResult(stream, mimeType)
           {
               EnableRangeProcessing = true, // Kích hoạt xử lý HTTP 206 Partial Content tự động
               EntityTag = etag,
               LastModified = document.UpdatedAt
           };
       }
   }
   ```

## Success Criteria
- [ ] Gửi request kèm header `Range: bytes=0-1023` $\to$ Nhận phản hồi HTTP `206 Partial Content` với đúng 1024 bytes và header `Content-Range`.
- [ ] Gửi request kèm header `If-None-Match` bằng đúng giá trị ETag $\to$ Nhận phản hồi HTTP `304 Not Modified` ngay lập tức.
- [ ] Client truy cập `GET /citation` nhận đầy đủ thông tin `source_page`, `source_excerpt`, và `stream_url`.
- [ ] Header `Cache-Control: private, max-age=86400` được đính kèm chuẩn xác trong response.

## Risk Assessment
- **Nguy cơ**: Client ngắt kết nối đột ngột (Abort) khi đang stream file $25\text{MB}$ khiến thread server bị treo hoặc ném ngoại lệ không xử lý được.
- **Giải pháp**: Framework ASP.NET Core tự động liên kết `HttpContext.RequestAborted` với luồng đọc; `FileStreamResult` sẽ chủ động đóng luồng tệp tin một cách an toàn mà không ném lỗi unhandled ra ngoài console.