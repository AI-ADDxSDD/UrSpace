---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [phase-03-atomic-final-commit-and-restful-controller]
---

# Phase 4: Testing and Verification

## Overview
Xây dựng bộ kiểm thử toàn diện từ Unit Test đến Integration Test cho UC-03.5:
- Kiểm thử logic truy vấn gom nhóm theo Khái niệm và phân cấp DTO.
- Kiểm thử bảo toàn nguyên vẹn chuỗi Markdown và công thức toán học LaTeX khi Inline Edit.
- Kiểm thử tính nguyên tử của Transaction Commit: Phân loại đúng `ACTIVE` / `DISCARDED`, kích hoạt `concepts` / `concept_relations`, sinh đầy đủ `user_card_states` cho FSRS, và rollback 100% khi xảy ra lỗi.

## Test Cases & Scenarios

### 1. Unit Tests (`SmartLearn.Tests.Unit.Services.FlashcardsServiceTests`)
- `GetGroupedFlashcards_ShouldGroupCorrectlyByConceptOrder`:
  - Giả lập 3 Concepts thuộc 1 Document với `SourcePage` lần lượt là 2, 5, 8.
  - Giả lập 6 Flashcards Draft phân bổ cho các Concepts.
  - Kỳ vọng: Kết quả trả về gồm 3 nhóm Concept theo đúng thứ tự trang, mỗi nhóm chứa đúng các thẻ con tương ứng, `TotalCardsCount == 6`.
- `UpdateFlashcardInline_ShouldPreserveLaTeXFormulas`:
  - Cập nhật thẻ với câu hỏi chứa: `Cho hàm số $f(x) = \int_{0}^{x} \frac{\sin t}{t} dt$`.
  - Cập nhật đáp án chứa: `$$\lim_{x \to 0} \frac{f(x)}{x} = 1$$`.
  - Kỳ vọng: Nội dung được lưu trữ chính xác từng ký tự, không bị escape hay nuốt dấu gạch chéo `\`.
- `CommitFlashcards_EmptySelection_ShouldThrowInvalidOperationException`:
  - Gọi commit với danh sách `SelectedCardIds` rỗng.
  - Kỳ vọng: Service ném `InvalidOperationException` từ chối thực hiện.

### 2. Integration Tests (`SmartLearn.Tests.Integration.Controllers.FlashcardsControllerTests`)
- `GetFlashcards_ReturnsGroupedStructure_Success`:
  - Gửi request `GET /api/v1/documents/{documentId}/flashcards?status=DRAFT`.
  - Kỳ vọng: HTTP 200 OK kèm payload phân cấp `concept_groups`.
- `CommitFlashcards_FullAtomicWorkflow_Success`:
  - Thiết lập DB: 1 Document trạng thái `PROCESSING`, 4 Concepts, 3 ConceptRelations, 10 Flashcards `DRAFT`.
  - Gửi `POST /api/v1/documents/{documentId}/flashcards/commit` với 7 IDs được chọn (3 thẻ bị bỏ chọn).
  - Kỳ vọng:
    - HTTP 200 OK.
    - CSDL: Đúng 7 thẻ có `status = 'ACTIVE'`, đúng 3 thẻ có `status = 'DISCARDED'`.
    - CSDL: Toàn bộ 4 concepts có `status = 'ACTIVE'`.
    - CSDL: Toàn bộ 3 concept_relations có `status = 'ACTIVE'`.
    - CSDL: Bảng `user_card_states` có đúng 7 bản ghi cho `UserId`, tất cả đều có `State = 'NEW'` và `DueDate <= UtcNow`.
    - CSDL: `documents` có `status = 'COMPLETED'`.
- `CommitFlashcards_RollbackOnFailure_PreservesOriginalState`:
  - Kích hoạt lỗi giả lập (hoặc gửi ID thẻ lạ không tồn tại trong DB).
  - Kỳ vọng: Transaction bị Rollback 100%, trạng thái các thẻ, concepts, relations và document vẫn giữ nguyên ở `DRAFT` / `PROCESSING`, không sinh bản ghi mồ côi nào trong `user_card_states`.

## Related Code Files
- Create:
  - `tests/SmartLearn.Tests.Unit/Services/FlashcardsServiceTests.cs`
  - `tests/SmartLearn.Tests.Integration/Controllers/FlashcardsControllerTests.cs`

## Implementation Steps

1. **Cài đặt Unit Tests (`FlashcardsServiceTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Unit.Services;

   public class FlashcardsServiceTests
   {
       [Fact]
       public async Task UpdateFlashcardInline_ShouldPreserveLaTeXFormulas()
       {
           // Arrange
           using var context = TestDbContextFactory.CreateInMemoryDbContext();
           var service = new FlashcardsService(context, Mock.Of<ILogger<FlashcardsService>>());

           var userId = Guid.NewGuid();
           var deck = new Deck { Id = Guid.NewGuid(), UserId = userId, Name = "Test Deck" };
           context.Decks.Add(deck);

           var card = new Flashcard
           {
               Id = Guid.NewGuid(),
               DeckId = deck.Id,
               ConceptId = Guid.NewGuid(),
               Front = "Old Question",
               Back = "Old Answer",
               Status = FlashcardStatus.Draft
           };
           context.Flashcards.Add(card);
           await context.SaveChangesAsync();

           var latexFront = @"Tính đạo hàm của $f(x) = \ln(x^2 + 1)$?";
           var latexBack = @"$$f'(x) = \frac{2x}{x^2 + 1}$$";

           var dto = new UpdateFlashcardDto(latexFront, latexBack, "STANDARD");

           // Act
           var result = await service.UpdateFlashcardInlineAsync(Guid.NewGuid(), card.Id, dto, userId);

           // Assert
           Assert.Equal(latexFront, result.Front);
           Assert.Equal(latexBack, result.Back);
       }
   }
   ```

2. **Cài đặt Integration Tests (`FlashcardsControllerTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Integration.Controllers;

   public class FlashcardsControllerTests : IClassFixture<CustomWebApplicationFactory>
   {
       private readonly HttpClient _client;
       private readonly CustomWebApplicationFactory _factory;

       public FlashcardsControllerTests(CustomWebApplicationFactory factory)
       {
           _factory = factory;
           _client = factory.CreateClient();
       }

       [Fact]
       public async Task CommitFlashcards_AtomicExecution_VerifiesAllTablesUpdated()
       {
           // 1. Seed Database với Document, Concepts, Relations và 10 Draft Flashcards
           var seedData = await _factory.SeedDraftDocumentWithCardsAsync(totalCards: 10);
           var selectedIds = seedData.Cards.Take(7).Select(c => c.Id).ToList();

           // 2. Gửi request commit 7 thẻ
           var response = await _client.PostAsJsonAsync(
               $"/api/v1/documents/{seedData.DocumentId}/flashcards/commit",
               new CommitFlashcardsRequest(selectedIds));

           // 3. Verify Response
           response.EnsureSuccessStatusCode();
           var body = await response.Content.ReadFromJsonAsync<CommitFlashcardsResponse>();
           Assert.NotNull(body);
           Assert.True(body.Success);
           Assert.Equal(7, body.Data.ActiveCardsCount);
           Assert.Equal(3, body.Data.DiscardedCardsCount);

           // 4. Verify Database State
           using var scope = _factory.Services.CreateScope();
           var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

           var activeCardsCount = await db.Flashcards.CountAsync(f => f.DeckId == seedData.DeckId && f.Status == FlashcardStatus.Active);
           var discardedCardsCount = await db.Flashcards.CountAsync(f => f.DeckId == seedData.DeckId && f.Status == FlashcardStatus.Discarded);
           var fsrsStatesCount = await db.UserCardStates.CountAsync(s => s.UserId == seedData.UserId);
           var docStatus = (await db.Documents.FindAsync(seedData.DocumentId))?.Status;

           Assert.Equal(7, activeCardsCount);
           Assert.Equal(3, discardedCardsCount);
           Assert.Equal(7, fsrsStatesCount);
           Assert.Equal(DocumentStatus.Completed, docStatus);
       }
   }
   ```

3. **Chạy kiểm thử tự động**:
   - `dotnet test --filter "Category=Flashcards"`

## Success Criteria
- [ ] 100% các ca kiểm thử Unit Test và Integration Test vượt qua.
- [ ] Xác nhận không có rò rỉ dữ liệu hoặc trạng thái không nhất quán khi commit hàng loạt.
- [ ] Độ phủ kiểm thử cho phân hệ Flashcard curation đạt $\ge 85\%$.