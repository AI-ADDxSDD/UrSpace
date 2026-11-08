---
phase: 3
title: "Atomic Final Commit and RESTful Controller"
status: pending
priority: P1
dependencies: [phase-02-grouped-flashcards-service-and-inline-edit]
---

# Phase 3: Atomic Final Commit and RESTful Controller

## Overview
Xây dựng Controller `FlashcardsController` cung cấp các API RESTful theo chuẩn ASP.NET Core và thực thi nghiệp vụ cốt lõi quan trọng nhất của phân hệ Ingestion: **Chốt Hạ Nguyên Tử (Atomic Final Commit)** trong 1 Database Transaction duy nhất:
1. Chuyển đổi trạng thái Flashcards: Thẻ được chọn $\to$ `ACTIVE`, thẻ bỏ chọn $\to$ `DISCARDED` (bảo tồn cho DPO AI Dataset).
2. Kích hoạt toàn bộ `concepts` và `concept_relations` của tài liệu sang `ACTIVE`.
3. Khởi tạo hàng loạt (Bulk Insert) bản ghi trạng thái FSRS v4.5 (`user_card_states`) với `State = New` và `DueDate = UtcNow`.
4. Đánh dấu `Document.Status = 'COMPLETED'`, bàn giao sẵn sàng cho các phân hệ học tập tiếp theo.

## Requirements
- **Functional**:
  - `GET /api/v1/documents/{documentId}/flashcards`:
    - Query params: `status` (mặc định: `DRAFT`).
    - Trả về danh sách thẻ gom nhóm theo từng Khái niệm.
  - `PUT /api/v1/documents/{documentId}/flashcards/{cardId}`:
    - Chỉnh sửa nội dung `front`, `back`, `card_type`.
  - `POST /api/v1/documents/{documentId}/flashcards`:
    - Tạo mới thẻ thủ công gắn với 1 `concept_id`.
  - `DELETE /api/v1/documents/{documentId}/flashcards/{cardId}`:
    - Xóa thẻ nháp khỏi hệ thống.
  - `POST /api/v1/documents/{documentId}/flashcards/commit`:
    - Body: `selected_card_ids: List<Guid>`.
    - Điều kiện tiên quyết: Danh sách `selected_card_ids` không được rỗng ($\ge 1$ thẻ) để tránh nạp bộ thẻ trống rỗng.
    - Quy trình Transaction 5 bước:
      1. Khởi tạo `using var transaction = await _dbContext.Database.BeginTransactionAsync(ct)`.
      2. Cập nhật các thẻ được chọn $\to$ `status = FlashcardStatus.Active`.
      3. Cập nhật các thẻ Draft còn lại không nằm trong danh sách $\to$ `status = FlashcardStatus.Discarded`.
      4. Cập nhật toàn bộ `concepts` và `concept_relations` thuộc tài liệu $\to$ `status = ConceptStatus.Active`.
      5. Tạo mới các bản ghi `UserCardState` tương ứng với toàn bộ thẻ Active:
         - `UserId = currentUserId`
         - `CardId = card.Id`
         - `State = FSRSCardState.New`
         - `Stability = 0.0`, `Difficulty = 0.0`
         - `Reps = 0`, `Lapses = 0`
         - `DueDate = DateTimeOffset.UtcNow`
      6. Cập nhật `Document.Status = DocumentStatus.Completed`.
      7. `await transaction.CommitAsync(ct)`.
- **Non-functional**:
  - Tính toàn vẹn ACID: Bất kỳ bước nào gặp sự cố (ví dụ lỗi DB, deadlock, vi phạm ràng buộc), toàn bộ transaction sẽ Rollback 100%, bảo đảm không có tình trạng "thẻ đã Active nhưng FSRS chưa khởi tạo".
  - Thời gian thực thi Transaction Commit: $< 100\text{ms}$ cho tập 50 concepts và 150 thẻ.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/DTOs/Flashcards/CommitFlashcardsRequest.cs`
  - `src/SmartLearn.Application/DTOs/Flashcards/CommitFlashcardsResponse.cs`
  - `src/SmartLearn.Api/Controllers/FlashcardsController.cs`
- Modify:
  - `src/SmartLearn.Application/Interfaces/IFlashcardsService.cs` (Bổ sung `CommitFlashcardsAsync`)
  - `src/SmartLearn.Application/Services/FlashcardsService.cs` (Cài đặt `CommitFlashcardsAsync`)

## Implementation Steps

1. **Định nghĩa Request / Response DTOs cho Commit**:
   ```csharp
   namespace SmartLearn.Application.DTOs.Flashcards;

   public record CommitFlashcardsRequest(
       List<Guid> SelectedCardIds
   );

   public record CommitFlashcardsResponse(
       bool Success,
       string Message,
       CommitDataDto Data
   );

   public record CommitDataDto(
       Guid DeckId,
       int ActiveCardsCount,
       int DiscardedCardsCount,
       int ConceptsCount,
       bool FsrsReady
   );
   ```

2. **Cài đặt Nghiệp vụ Atomic Commit trong `FlashcardsService`**:
   ```csharp
   public async Task<CommitFlashcardsResponse> CommitFlashcardsAsync(
       Guid documentId,
       CommitFlashcardsRequest request,
       Guid userId,
       CancellationToken ct = default)
   {
       if (request.SelectedCardIds == null || request.SelectedCardIds.Count == 0)
       {
           throw new InvalidOperationException("Vui lòng chọn ít nhất 1 thẻ flashcard để nạp vào bộ học.");
       }

       var selectedSet = request.SelectedCardIds.ToHashSet();

       // 1. Kiểm tra tài liệu và quyền sở hữu
       var document = await _dbContext.Documents
           .FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userId, ct);

       if (document == null)
           throw new KeyNotFoundException($"Tài liệu {documentId} không tồn tại hoặc bạn không có quyền truy cập.");

       if (document.Status == DocumentStatus.Completed)
           throw new InvalidOperationException("Tài liệu này đã được duyệt và nạp vào bộ học trước đó.");

       // 2. Bắt đầu Transaction nguyên tử
       await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

       try
       {
           // Lấy tất cả concepts thuộc tài liệu
           var concepts = await _dbContext.Concepts
               .Where(c => c.DocumentId == documentId)
               .ToListAsync(ct);

           var conceptIds = concepts.Select(c => c.Id).ToList();

           // Lấy toàn bộ thẻ draft thuộc document
           var draftCards = await _dbContext.Flashcards
               .Where(f => f.DeckId == document.DeckId && conceptIds.Contains(f.ConceptId) && f.Status == FlashcardStatus.Draft)
               .ToListAsync(ct);

           int activeCount = 0;
           int discardedCount = 0;
           var userCardStatesToInsert = new List<UserCardState>();
           var now = DateTimeOffset.UtcNow;

           // Bước 1 & 2: Phân loại Active và Discarded
           foreach (var card in draftCards)
           {
               if (selectedSet.Contains(card.Id))
               {
                   card.Status = FlashcardStatus.Active;
                   card.UpdatedAt = now;
                   activeCount++;

                   // Bước 4: Tạo UserCardState FSRS ban đầu
                   userCardStatesToInsert.Add(new UserCardState
                   {
                       Id = Guid.NewGuid(),
                       UserId = userId,
                       CardId = card.Id,
                       State = FSRSCardState.New,
                       Stability = 0.0,
                       Difficulty = 0.0,
                       Reps = 0,
                       Lapses = 0,
                       DueDate = now,
                       LastReview = null,
                       CreatedAt = now,
                       UpdatedAt = now
                   });
               }
               else
               {
                   card.Status = FlashcardStatus.Discarded; // Bảo tồn phục vụ Negative Feedback dataset
                   card.UpdatedAt = now;
                   discardedCount++;
               }
           }

           // Bước 3: Kích hoạt toàn bộ Concepts
           foreach (var concept in concepts)
           {
               concept.Status = ConceptStatus.Active;
               concept.UpdatedAt = now;
           }

           // Kích hoạt toàn bộ ConceptRelations thuộc deck
           var relations = await _dbContext.ConceptRelations
               .Where(r => r.DeckId == document.DeckId && r.Status == ConceptStatus.Draft)
               .ToListAsync(ct);

           foreach (var relation in relations)
           {
               relation.Status = ConceptStatus.Active;
               relation.UpdatedAt = now;
           }

           // Bước 4: Bulk Insert UserCardStates
           if (userCardStatesToInsert.Count > 0)
           {
               await _dbContext.UserCardStates.AddRangeAsync(userCardStatesToInsert, ct);
           }

           // Bước 5: Cập nhật trạng thái Document
           document.Status = DocumentStatus.Completed;
           document.UpdatedAt = now;

           await _dbContext.SaveChangesAsync(ct);
           await transaction.CommitAsync(ct);

           _logger.LogInformation("Successfully committed Document {DocId}: {Active} active cards, {Discarded} discarded, {Concepts} concepts, {Fsrs} FSRS states created.",
               documentId, activeCount, discardedCount, concepts.Count, userCardStatesToInsert.Count);

           return new CommitFlashcardsResponse(
               Success: true,
               Message: $"Đã nạp thành công {activeCount} flashcards vào Bộ thẻ. Hệ thống đã sẵn sàng cho phiên học đầu tiên!",
               Data: new CommitDataDto(
                   DeckId: document.DeckId,
                   ActiveCardsCount: activeCount,
                   DiscardedCardsCount: discardedCount,
                   ConceptsCount: concepts.Count,
                   FsrsReady: true
               )
           );
       }
       catch (Exception ex)
       {
           await transaction.RollbackAsync(ct);
           _logger.LogError(ex, "Transaction rollback occurred while committing flashcards for Document {DocId}.", documentId);
           throw;
       }
   }
   ```

3. **Cài đặt Controller `FlashcardsController`**:
   ```csharp
   namespace SmartLearn.Api.Controllers;

   [ApiController]
   [Route("api/v1/documents/{documentId:guid}/flashcards")]
   [Authorize]
   public class FlashcardsController : ControllerBase
   {
       private readonly IFlashcardsService _flashcardsService;

       public FlashcardsController(IFlashcardsService flashcardsService)
       {
           _flashcardsService = flashcardsService;
       }

       private Guid GetCurrentUserId()
       {
           var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
               throw new UnauthorizedAccessException("Người dùng chưa được xác thực hợp lệ.");
           return userId;
       }

       [HttpGet]
       [ProducesResponseType(typeof(ApiResponse<GroupedFlashcardsResponseDto>), StatusCodes.Status200OK)]
       public async Task<IActionResult> GetFlashcards(
           [FromRoute] Guid documentId,
           [FromQuery] FlashcardStatus status = FlashcardStatus.Draft,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();
           var result = await _flashcardsService.GetGroupedFlashcardsAsync(documentId, status, userId, ct);
           return Ok(ApiResponse<GroupedFlashcardsResponseDto>.Ok(result));
       }

       [HttpPut("{cardId:guid}")]
       [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), StatusCodes.Status200OK)]
       public async Task<IActionResult> UpdateFlashcardInline(
           [FromRoute] Guid documentId,
           [FromRoute] Guid cardId,
           [FromBody] UpdateFlashcardDto dto,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();
           var updated = await _flashcardsService.UpdateFlashcardInlineAsync(documentId, cardId, dto, userId, ct);
           return Ok(ApiResponse<FlashcardDto>.Ok(updated));
       }

       [HttpPost]
       [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), StatusCodes.Status201Created)]
       public async Task<IActionResult> CreateManualFlashcard(
           [FromRoute] Guid documentId,
           [FromBody] CreateFlashcardDto dto,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();
           var created = await _flashcardsService.CreateManualFlashcardAsync(documentId, dto, userId, ct);
           return CreatedAtAction(nameof(GetFlashcards), new { documentId }, ApiResponse<FlashcardDto>.Ok(created));
       }

       [HttpDelete("{cardId:guid}")]
       [ProducesResponseType(StatusCodes.Status204NoContent)]
       public async Task<IActionResult> DeleteDraftCard(
           [FromRoute] Guid documentId,
           [FromRoute] Guid cardId,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();
           await _flashcardsService.DeleteDraftCardAsync(documentId, cardId, userId, ct);
           return NoContent();
       }

       [HttpPost("commit")]
       [ProducesResponseType(typeof(CommitFlashcardsResponse), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status400BadRequest)]
       public async Task<IActionResult> CommitFlashcards(
           [FromRoute] Guid documentId,
           [FromBody] CommitFlashcardsRequest request,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();
           var response = await _flashcardsService.CommitFlashcardsAsync(documentId, request, userId, ct);
           return Ok(response);
       }
   }
   ```

## Success Criteria
- [ ] API `POST commit` cập nhật chính xác các thẻ được chọn $\to$ `ACTIVE`, thẻ không được chọn $\to$ `DISCARDED`.
- [ ] Bảng `user_card_states` được chèn đầy đủ bản ghi FSRS khởi tạo (`State = New`, `Due = UtcNow`) cho từng thẻ `ACTIVE`.
- [ ] Toàn bộ `concepts` và `concept_relations` của tài liệu chuyển sang `ACTIVE`.
- [ ] Trạng thái `documents` chuyển thành `COMPLETED`.
- [ ] Bất kỳ ngoại lệ nào phát sinh đều dẫn đến Rollback transaction đầy đủ.