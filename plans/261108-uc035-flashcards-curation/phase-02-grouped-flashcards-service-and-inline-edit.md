---
phase: 2
title: "Grouped Flashcards Service and Inline Edit"
status: pending
priority: P1
dependencies: [phase-01-database-entity-and-ef-core-migration]
---

# Phase 2: Grouped Flashcards Service and Inline Edit

<!-- Updated: Validation Session 1 - Mặc định is_selected = false để người học chủ động chọn thẻ -->

## Overview
Xây dựng lớp Service `IFlashcardsService` và `FlashcardsService` đảm nhiệm:
1. **Truy vấn gom nhóm theo từng Khái niệm (Grouped by Concept)**: Sắp xếp theo trình tự sư phạm của tài liệu (thứ tự trang `source_page`), trả về cấu trúc phân cấp giúp học viên duyệt thẻ mạch lạc theo từng chủ đề.
2. **Chỉnh sửa nhanh trực tiếp (Inline Edit)**: Cho phép học viên tinh chỉnh nội dung câu hỏi (`front`), câu trả lời (`back`), hoặc đổi dạng thẻ (`card_type`) mà không làm biến dạng công thức LaTeX / Markdown.
3. **Thêm mới thẻ thủ công (Manual Flashcard Addition)**: Cho phép học viên bổ sung thêm câu hỏi riêng cho bất kỳ Khái niệm nào trước khi chốt nạp.
4. **Xóa/Bỏ chọn thẻ nháp (Draft Card Removal)**: Loại bỏ các thẻ không đạt chất lượng.

## Requirements
- **Functional**:
  - `GetGroupedFlashcardsAsync`:
    - Đầu vào: `documentId`, `status` (mặc định: `DRAFT`), `userId`.
    - Truy vấn danh sách `concepts` thuộc tài liệu, sắp xếp theo `source_page` tăng dần.
    - Truy vấn toàn bộ `flashcards` thuộc tài liệu thỏa mãn `status`.
    - Gom nhóm thẻ theo `concept_id`, trả về DTO phân cấp: Thông tin khái niệm (`id`, `name`, `difficulty_level`, `source_page`) kèm mảng thẻ con.
    - Thống kê tổng số lượng thẻ (`total_cards_count`).
  - `UpdateFlashcardInlineAsync`:
    - Đầu vào: `documentId`, `cardId`, `UpdateFlashcardDto`, `userId`.
    - Xác thực quyền sở hữu (thẻ thuộc tài liệu của `userId`).
    - Validate độ dài chuỗi: `front` (1..5000 ký tự), `back` (1..10000 ký tự).
    - Cập nhật các trường: `Front`, `Back`, `CardType`, `UpdatedAt`.
  - `CreateManualFlashcardAsync`:
    - Đầu vào: `documentId`, `CreateFlashcardDto`, `userId`.
    - Xác thực `concept_id` thuộc tài liệu.
    - Tạo mới `Flashcard` với trạng thái `Status = Draft`.
  - `DeleteDraftCardAsync`:
    - Đầu vào: `documentId`, `cardId`, `userId`.
    - Chỉ cho phép xóa khi thẻ đang ở trạng thái `DRAFT`.
- **Non-functional**:
  - Thời gian truy vấn gom nhóm: $< 15\text{ms}$ cho tài liệu có 50 concepts và 200 thẻ.
  - Sử dụng projection (`Select`) để tránh nạp dữ liệu thừa vào bộ nhớ RAM.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Application.Services.Flashcards`
- **DTOs**: `SmartLearn.Application.DTOs.Flashcards`

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IFlashcardsService.cs`
  - `src/SmartLearn.Application/Services/FlashcardsService.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/FlashcardDto.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/ConceptFlashcardGroupDto.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/GroupedFlashcardsResponseDto.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/CreateFlashcardDto.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/UpdateFlashcardDto.cs`

## Implementation Steps

1. **Định nghĩa các DTOs**:
   ```csharp
   namespace SmartLearn.Application.DTOs.Flashcards;

   public record FlashcardDto(
       Guid Id,
       Guid ConceptId,
       string Front,
       string Back,
       string CardType,
       int SourcePage,
       string? SourceExcerpt,
       string Status,
       bool IsSelected
   );

   public record ConceptFlashcardGroupDto(
       Guid ConceptId,
       string ConceptName,
       string DifficultyLevel,
       int SourcePage,
       List<FlashcardDto> Flashcards
   );

   public record GroupedFlashcardsResponseDto(
       Guid DocumentId,
       int TotalCardsCount,
       List<ConceptFlashcardGroupDto> ConceptGroups
   );

   public record CreateFlashcardDto(
       Guid ConceptId,
       string Front,
       string Back,
       string CardType,
       int SourcePage,
       string? SourceExcerpt
   );

   public record UpdateFlashcardDto(
       string Front,
       string Back,
       string CardType
   );
   ```

2. **Định nghĩa Interface `IFlashcardsService`**:
   ```csharp
   namespace SmartLearn.Application.Interfaces;

   public interface IFlashcardsService
   {
       Task<GroupedFlashcardsResponseDto> GetGroupedFlashcardsAsync(
           Guid documentId,
           FlashcardStatus status,
           Guid userId,
           CancellationToken ct = default);

       Task<FlashcardDto> UpdateFlashcardInlineAsync(
           Guid documentId,
           Guid cardId,
           UpdateFlashcardDto dto,
           Guid userId,
           CancellationToken ct = default);

       Task<FlashcardDto> CreateManualFlashcardAsync(
           Guid documentId,
           CreateFlashcardDto dto,
           Guid userId,
           CancellationToken ct = default);

       Task<bool> DeleteDraftCardAsync(
           Guid documentId,
           Guid cardId,
           Guid userId,
           CancellationToken ct = default);
   }
   ```

3. **Cài đặt Lớp `FlashcardsService`**:
   ```csharp
   namespace SmartLearn.Application.Services;

   public class FlashcardsService : IFlashcardsService
   {
       private readonly AppDbContext _dbContext;
       private readonly ILogger<FlashcardsService> _logger;

       public FlashcardsService(AppDbContext dbContext, ILogger<FlashcardsService> logger)
       {
           _dbContext = dbContext;
           _logger = logger;
       }

       public async Task<GroupedFlashcardsResponseDto> GetGroupedFlashcardsAsync(
           Guid documentId,
           FlashcardStatus status,
           Guid userId,
           CancellationToken ct = default)
       {
           // 1. Kiểm tra tài liệu tồn tại và quyền sở hữu
           var document = await _dbContext.Documents
               .AsNoTracking()
               .FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userId, ct);

           if (document == null)
               throw new KeyNotFoundException($"Document with id {documentId} not found or access denied.");

           // 2. Lấy danh sách Concepts thuộc Document
           var concepts = await _dbContext.Concepts
               .AsNoTracking()
               .Where(c => c.DocumentId == documentId)
               .OrderBy(c => c.SourcePage)
               .ThenBy(c => c.CreatedAt)
               .ToListAsync(ct);

           var conceptIds = concepts.Select(c => c.Id).ToHashSet();

           // 3. Lấy danh sách Flashcards theo Status
           var cards = await _dbContext.Flashcards
               .AsNoTracking()
               .Where(f => f.DeckId == document.DeckId && conceptIds.Contains(f.ConceptId) && f.Status == status)
               .OrderBy(f => f.SourcePage)
               .ThenBy(f => f.CreatedAt)
               .ToListAsync(ct);

           // 4. Gom nhóm thẻ theo Concept
           var cardLookup = cards.ToLookup(c => c.ConceptId);

           var conceptGroups = concepts.Select(c => new ConceptFlashcardGroupDto(
               ConceptId: c.Id,
               ConceptName: c.Name,
               DifficultyLevel: c.DifficultyLevel.ToString(),
               SourcePage: c.SourcePage,
               Flashcards: cardLookup[c.Id].Select(f => new FlashcardDto(
                   f.Id,
                   f.ConceptId,
                   f.Front,
                   f.Back,
                   f.CardType.ToString(),
                   f.SourcePage,
                   f.SourceExcerpt,
                   f.Status.ToString(),
                   IsSelected: false // Mặc định không tick chọn thẻ nào để người học chủ động chọn thẻ
               )).ToList()
           )).ToList();

           return new GroupedFlashcardsResponseDto(
               DocumentId: documentId,
               TotalCardsCount: cards.Count,
               ConceptGroups: conceptGroups
           );
       }

       public async Task<FlashcardDto> UpdateFlashcardInlineAsync(
           Guid documentId,
           Guid cardId,
           UpdateFlashcardDto dto,
           Guid userId,
           CancellationToken ct = default)
       {
           var card = await _dbContext.Flashcards
               .Include(f => f.Deck)
               .FirstOrDefaultAsync(f => f.Id == cardId && f.Deck!.UserId == userId, ct);

           if (card == null)
               throw new KeyNotFoundException($"Flashcard {cardId} not found or access denied.");

           if (string.IsNullOrWhiteSpace(dto.Front) || string.IsNullOrWhiteSpace(dto.Back))
               throw new ArgumentException("Front and Back content cannot be empty.");

           if (Enum.TryParse<CardType>(dto.CardType, true, out var parsedType))
           {
               card.CardType = parsedType;
           }

           card.Front = dto.Front.Trim();
           card.Back = dto.Back.Trim();
           card.UpdatedAt = DateTimeOffset.UtcNow;

           await _dbContext.SaveChangesAsync(ct);

           return new FlashcardDto(
               card.Id,
               card.ConceptId,
               card.Front,
               card.Back,
               card.CardType.ToString(),
               card.SourcePage,
               card.SourceExcerpt,
               card.Status.ToString(),
               IsSelected: true
           );
       }

       public async Task<FlashcardDto> CreateManualFlashcardAsync(
           Guid documentId,
           CreateFlashcardDto dto,
           Guid userId,
           CancellationToken ct = default)
       {
           var document = await _dbContext.Documents
               .FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userId, ct);

           if (document == null)
               throw new KeyNotFoundException($"Document {documentId} not found or access denied.");

           var conceptExists = await _dbContext.Concepts
               .AnyAsync(c => c.Id == dto.ConceptId && c.DocumentId == documentId, ct);

           if (!conceptExists)
               throw new ArgumentException($"Concept {dto.ConceptId} does not belong to Document {documentId}.");

           var cardType = Enum.TryParse<CardType>(dto.CardType, true, out var ctParsed)
               ? ctParsed : CardType.Standard;

           var newCard = new Flashcard
           {
               Id = Guid.NewGuid(),
               DeckId = document.DeckId,
               ConceptId = dto.ConceptId,
               Front = dto.Front.Trim(),
               Back = dto.Back.Trim(),
               CardType = cardType,
               SourcePage = dto.SourcePage,
               SourceExcerpt = dto.SourceExcerpt,
               Status = FlashcardStatus.Draft,
               CreatedAt = DateTimeOffset.UtcNow,
               UpdatedAt = DateTimeOffset.UtcNow
           };

           _dbContext.Flashcards.Add(newCard);
           await _dbContext.SaveChangesAsync(ct);

           return new FlashcardDto(
               newCard.Id,
               newCard.ConceptId,
               newCard.Front,
               newCard.Back,
               newCard.CardType.ToString(),
               newCard.SourcePage,
               newCard.SourceExcerpt,
               newCard.Status.ToString(),
               IsSelected: true
           );
       }

       public async Task<bool> DeleteDraftCardAsync(
           Guid documentId,
           Guid cardId,
           Guid userId,
           CancellationToken ct = default)
       {
           var card = await _dbContext.Flashcards
               .Include(f => f.Deck)
               .FirstOrDefaultAsync(f => f.Id == cardId && f.Deck!.UserId == userId, ct);

           if (card == null)
               throw new KeyNotFoundException($"Flashcard {cardId} not found or access denied.");

           if (card.Status != FlashcardStatus.Draft)
               throw new InvalidOperationException("Only DRAFT flashcards can be deleted directly.");

           _dbContext.Flashcards.Remove(card);
           await _dbContext.SaveChangesAsync(ct);
           return true;
       }
   }
   ```

## Success Criteria
- [ ] Truy vấn gom nhóm trả về đầy đủ các nhóm `ConceptFlashcardGroupDto` theo đúng thứ tự trang của tài liệu.
- [ ] Chỉnh sửa inline chuỗi Markdown hoặc LaTeX (ví dụ `$x = \frac{-b \pm \sqrt{D}}{2a}$`) được lưu chính xác 100% không bị escape lỗi.
- [ ] Thêm mới thẻ thủ công liên kết đúng với `ConceptId` và mang trạng thái `DRAFT`.
- [ ] Không cho phép người dùng lạ can thiệp vào tài liệu/thẻ của người dùng khác (kiểm tra quyền sở hữu).