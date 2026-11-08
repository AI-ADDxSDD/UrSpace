---
phase: 2
title: "Citation Service and Security"
status: pending
priority: P1
dependencies: [phase-01-storage-and-streaming-layer]
---

# Phase 2: Citation Service and Security

<!-- Updated: Validation Session 1 - Chuẩn hóa khoảng trắng source_excerpt để tối ưu hóa so khớp Text Layer -->

## Overview
Xây dựng lớp Service `IDocumentCitationService` và `DocumentCitationService` đảm nhiệm 2 nhiệm vụ cốt lõi:
1. **Bảo mật & Phân quyền Truy cập Đa tầng (Multi-tier Access Control)**: Chặn đứng nguy cơ rò rỉ dữ liệu tài liệu học tập của học viên. Chỉ cho phép người dùng xem hoặc stream tệp tin khi: (a) là chủ sở hữu tệp (`Document.UserId == currentUserId`), hoặc (b) là người học có quyền truy cập vào Bộ thẻ (`Deck`) chứa tài liệu này.
2. **Truy vấn Dữ liệu Đối chiếu (Citation Metadata Extraction)**: Trích xuất chính xác vị trí số trang (`source_page`) và chuỗi trích dẫn gốc (`source_excerpt`) từ bản ghi `Flashcard` hoặc `ConceptNode`, kết hợp thông tin tổng thể của tài liệu (`totalPages`, `fileName`, `fileType`, `fileHashSha256`).

## Requirements
- **Functional**:
  - `ValidateDocumentAccessAsync`:
    - Đầu vào: `documentId`, `userId`.
    - Truy vấn tệp tài liệu trong bảng `documents`. Nếu không tìm thấy, ném `KeyNotFoundException`.
    - Kiểm tra quyền:
      - Chủ sở hữu: `document.UserId == userId` $\to$ Cho phép.
      - Hoặc kiểm tra bảng liên kết `DeckMembers` / `Enrollments` (nếu bộ thẻ được chia sẻ) $\to$ Cho phép.
      - Ngược lại: Ném `UnauthorizedAccessException("Bạn không có quyền truy cập vào tài liệu này.")`.
  - `GetCitationMetadataAsync`:
    - Đầu vào: `documentId`, `cardId` (tùy chọn), `conceptId` (tùy chọn), `userId`.
    - Gọi `ValidateDocumentAccessAsync` để kiểm tra phân quyền.
    - Trường hợp 1: Có `cardId` $\to$ Truy vấn `flashcards`. Lấy `source_page` và `source_excerpt`. Đảm bảo `card.DeckId == document.DeckId`.
    - Trường hợp 2: Không có `cardId` nhưng có `conceptId` $\to$ Truy vấn `concepts`. Lấy `source_page` và dùng đoạn tóm tắt khái niệm `summary_markdown` làm ngữ cảnh trích dẫn.
    - Trường hợp 3: Cả hai đều null $\to$ Mặc định trả về `source_page = 1` (trang đầu tiên của tài liệu).
    - Chuẩn hóa khoảng trắng và ngắt dòng trong chuỗi trích dẫn (`source_excerpt`) trước khi đóng gói DTO.
    - Trả về DTO `CitationMetadataDto`.
- **Non-functional**:
  - Thời gian xử lý: $< 5\text{ms}$ cho mỗi lượt truy vấn metadata nhờ các chỉ mục `idx_flashcards_deck_status` và khóa chính.
  - Sử dụng `.AsNoTracking()` trong Entity Framework Core để tránh tạo snapshot theo dõi trên DbContext.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Application.Services.Citation`
- **DTOs**: `SmartLearn.Application.DTOs.Citation`

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IDocumentCitationService.cs`
  - `src/SmartLearn.Application/Services/DocumentCitationService.cs`
  - `src/SmartLearn.Application/DTOs/Citation/CitationMetadataDto.cs`

## Implementation Steps

1. **Định nghĩa DTO `CitationMetadataDto`**:
   ```csharp
   namespace SmartLearn.Application.DTOs.Citation;

   public record CitationMetadataDto(
       Guid DocumentId,
       string DocumentName,
       string FileType,
       int SourcePage,
       string? SourceExcerpt,
       string StreamUrl,
       int TotalPages,
       string FileHashSha256
   );
   ```

2. **Định nghĩa Interface `IDocumentCitationService`**:
   ```csharp
   namespace SmartLearn.Application.Interfaces;

   public interface IDocumentCitationService
   {
       Task<Document> ValidateDocumentAccessAsync(
           Guid documentId,
           Guid userId,
           CancellationToken ct = default);

       Task<CitationMetadataDto> GetCitationMetadataAsync(
           Guid documentId,
           Guid? cardId,
           Guid? conceptId,
           Guid userId,
           CancellationToken ct = default);
   }
   ```

3. **Cài đặt Lớp `DocumentCitationService`**:
   ```csharp
   namespace SmartLearn.Application.Services;

   public class DocumentCitationService : IDocumentCitationService
   {
       private readonly AppDbContext _dbContext;
       private readonly ILogger<DocumentCitationService> _logger;

       public DocumentCitationService(AppDbContext dbContext, ILogger<DocumentCitationService> logger)
       {
           _dbContext = dbContext;
           _logger = logger;
       }

       public async Task<Document> ValidateDocumentAccessAsync(
           Guid documentId,
           Guid userId,
           CancellationToken ct = default)
       {
           var document = await _dbContext.Documents
               .AsNoTracking()
               .FirstOrDefaultAsync(d => d.Id == documentId, ct);

           if (document == null)
           {
               _logger.LogWarning("Access denied: Document {DocId} not found.", documentId);
               throw new KeyNotFoundException($"Tài liệu {documentId} không tồn tại.");
           }

           // 1. Kiểm tra nếu là chủ sở hữu tài liệu
           if (document.UserId == userId)
           {
               return document;
           }

           // 2. Kiểm tra nếu người dùng đang học bộ thẻ (Deck) chứa tài liệu này
           var hasDeckAccess = await _dbContext.Decks
               .AsNoTracking()
               .AnyAsync(deck => deck.Id == document.DeckId && (deck.UserId == userId || deck.IsPublic), ct);

           if (hasDeckAccess)
           {
               return document;
           }

           _logger.LogWarning("Unauthorized access attempt: User {UserId} tried to access Document {DocId}.", userId, documentId);
           throw new UnauthorizedAccessException("Bạn không có quyền xem hoặc tải tài liệu này.");
       }

       public async Task<CitationMetadataDto> GetCitationMetadataAsync(
           Guid documentId,
           Guid? cardId,
           Guid? conceptId,
           Guid userId,
           CancellationToken ct = default)
       {
           // 1. Xác thực quyền truy cập
           var document = await ValidateDocumentAccessAsync(documentId, userId, ct);

           int sourcePage = 1;
           string? sourceExcerpt = null;

           // 2. Trích xuất vị trí trang & đoạn trích dẫn theo Card hoặc Concept
           if (cardId.HasValue)
           {
               var card = await _dbContext.Flashcards
                   .AsNoTracking()
                   .FirstOrDefaultAsync(f => f.Id == cardId.Value && f.DeckId == document.DeckId, ct);

               if (card != null)
               {
                   sourcePage = card.SourcePage > 0 ? card.SourcePage : 1;
                   sourceExcerpt = NormalizeWhitespace(card.SourceExcerpt);
               }
           }
           else if (conceptId.HasValue)
           {
               var concept = await _dbContext.Concepts
                   .AsNoTracking()
                   .FirstOrDefaultAsync(c => c.Id == conceptId.Value && c.DocumentId == documentId, ct);

               if (concept != null)
               {
                   sourcePage = concept.SourcePage > 0 ? concept.SourcePage : 1;
                   sourceExcerpt = NormalizeWhitespace(concept.Description);
               }
           }

           // 3. Xây dựng DTO phản hồi
           var streamUrl = $"/api/v1/documents/{document.Id}/stream";

           return new CitationMetadataDto(
               DocumentId: document.Id,
               DocumentName: document.FileName,
               FileType: document.FileType.ToString().ToUpperInvariant(),
               SourcePage: sourcePage,
               SourceExcerpt: sourceExcerpt,
               StreamUrl: streamUrl,
               TotalPages: document.PageCount,
               FileHashSha256: document.FileHashSha256
           );
       }

       private static string? NormalizeWhitespace(string? input)
       {
           if (string.IsNullOrWhiteSpace(input)) return null;
           return System.Text.RegularExpressions.Regex.Replace(input.Trim(), @"\s+", " ");
       }
   }
   ```

## Success Criteria
- [ ] Người dùng không sở hữu tài liệu và không có quyền xem deck $\to$ Bị chặn ngay với `UnauthorizedAccessException`.
- [ ] Truy vấn có `cardId` $\to$ Trả về chính xác `source_page` và `source_excerpt` (đã chuẩn hóa khoảng trắng).
- [ ] Truy vấn có `conceptId` $\to$ Trả về chính xác `source_page` và mô tả của khái niệm.
- [ ] Đường dẫn `StreamUrl` được sinh chuẩn hóa theo định dạng RESTful.

## Risk Assessment
- **Nguy cơ**: Dò quét ID tài liệu (ID Enumeration / Insecure Direct Object References - IDOR).
- **Giải pháp**: Tất cả các hàm nghiệp vụ đều bắt buộc chạy qua `ValidateDocumentAccessAsync` kiểm tra quyền sở hữu hoặc quyền thành viên bộ thẻ trước khi trả về bất kỳ thông tin nào.