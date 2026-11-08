---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [phase-03-restful-controller-and-integration]
---

# Phase 4: Testing and Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện từ Unit Test đến Integration Test cho UC-06.3:
- Kiểm thử logic hoạt động của bộ đệm CSDL (Cache Hit vs Cache Miss vs Force Regenerate).
- Kiểm thử tích hợp với Google Gemini API Client (giả lập response JSON chuẩn xác 3 trường).
- Kiểm thử phân quyền truy cập và các tình huống ngoại lệ (Card Not Found, Rate Limit, Private Deck Forbidden).

## Test Cases & Scenarios

### 1. Unit Tests (`SmartLearn.Tests.Unit.Services.FlashcardMnemonicServiceTests`)
- `GetMnemonic_CacheMiss_CallsGeminiAndSavesToDb`:
  - Thẻ chưa từng có mẹo nhớ trong CSDL.
  - Mock Gemini Client trả về 3 chuỗi `visual`, `rhyme`, `analogy`.
  - Kỳ vọng: Service gọi đúng hàm `GenerateMnemonicAsync` 1 lần, lưu bản ghi mới vào `flashcard_mnemonics`, trả về DTO có `IsCached == false`.
- `GetMnemonic_CacheHit_ReturnsFromDbWithoutCallingGemini`:
  - Thẻ đã có bản ghi trong `flashcard_mnemonics`.
  - Gọi với `forceRegenerate = false`.
  - Kỳ vọng: Service trả về kết quả ngay lập tức từ CSDL, `IsCached == true`, `Mock<IGeminiMnemonicClient>` xác nhận không bị gọi (`Times.Never`).
- `GetMnemonic_ForceRegenerate_UpdatesExistingRecord`:
  - Thẻ đã có bản ghi trong `flashcard_mnemonics`.
  - Gọi với `forceRegenerate = true`.
  - Kỳ vọng: Service gọi lại Gemini Client, cập nhật bản ghi cũ trong DB với nội dung mới, trả về `IsCached == false`.
- `GetMnemonic_UnrelatedUserOnPrivateDeck_ThrowsUnauthorized`:
  - Gọi với user không sở hữu bộ thẻ riêng tư.
  - Kỳ vọng: Ném `UnauthorizedAccessException`.

### 2. Integration Tests (`SmartLearn.Tests.Integration.Controllers.FlashcardMnemonicsControllerTests`)
- `GetMnemonic_ValidCard_Returns200WithStructuredData`:
  - Gửi request `GET /api/v1/flashcards/{validCardId}/mnemonic`.
  - Kỳ vọng: Status code `200 OK`, body chứa đủ `visual`, `rhyme`, `analogy`.
- `GetMnemonic_InvalidCardId_Returns404NotFound`:
  - Gửi request với GUID ngẫu nhiên không tồn tại.
  - Kỳ vọng: Status code `404 Not Found`.

## Related Code Files
- Create:
  - `tests/SmartLearn.Tests.Unit/Services/FlashcardMnemonicServiceTests.cs`
  - `tests/SmartLearn.Tests.Integration/Controllers/FlashcardMnemonicsControllerTests.cs`

## Implementation Steps

1. **Cài đặt Unit Tests (`FlashcardMnemonicServiceTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Unit.Services;

   public class FlashcardMnemonicServiceTests
   {
       [Fact]
       public async Task GetMnemonic_CacheHit_ReturnsFromDbWithoutCallingGemini()
       {
           // Arrange
           using var context = TestDbContextFactory.CreateInMemoryDbContext();
           var geminiMock = new Mock<IGeminiMnemonicClient>();
           var service = new FlashcardMnemonicService(context, geminiMock.Object, Mock.Of<ILogger<FlashcardMnemonicService>>());

           var userId = Guid.NewGuid();
           var deck = new Deck { Id = Guid.NewGuid(), UserId = userId, Name = "Deck A", IsPublic = true };
           var card = new Flashcard { Id = Guid.NewGuid(), DeckId = deck.Id, Front = "Q", Back = "A" };
           var cachedMnemonic = new FlashcardMnemonic
           {
               Id = Guid.NewGuid(),
               CardId = card.Id,
               VisualPrompt = "Cached Visual",
               RhymePoem = "Cached Rhyme",
               ConceptualAnalogy = "Cached Analogy"
           };

           context.Decks.Add(deck);
           context.Flashcards.Add(card);
           context.FlashcardMnemonics.Add(cachedMnemonic);
           await context.SaveChangesAsync();

           // Act
           var result = await service.GetOrGenerateMnemonicAsync(card.Id, forceRegenerate: false, userId);

           // Assert
           Assert.NotNull(result);
           Assert.True(result.IsCached);
           Assert.Equal("Cached Visual", result.Visual);
           geminiMock.Verify(c => c.GenerateMnemonicAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
       }
   }
   ```

2. **Cài đặt Integration Tests (`FlashcardMnemonicsControllerTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Integration.Controllers;

   public class FlashcardMnemonicsControllerTests : IClassFixture<CustomWebApplicationFactory>
   {
       private readonly HttpClient _client;
       private readonly CustomWebApplicationFactory _factory;

       public FlashcardMnemonicsControllerTests(CustomWebApplicationFactory factory)
       {
           _factory = factory;
           _client = factory.CreateClient();
       }

       [Fact]
       public async Task GetMnemonic_ExistingCard_ReturnsOk()
       {
           var seedData = await _factory.SeedCardWithMnemonicAsync();

           var response = await _client.GetAsync($"/api/v1/flashcards/{seedData.CardId}/mnemonic");

           response.EnsureSuccessStatusCode();
           var result = await response.Content.ReadFromJsonAsync<ApiResponse<MnemonicDto>>();

           Assert.NotNull(result?.Data);
           Assert.NotEmpty(result.Data.Visual);
           Assert.NotEmpty(result.Data.Rhyme);
           Assert.NotEmpty(result.Data.Analogy);
       }
   }
   ```

3. **Chạy kiểm thử tự động**:
   - `dotnet test --filter "Category=Mnemonics"`

## Success Criteria
- [ ] 100% các ca kiểm thử Unit Test và Integration Test vượt qua.
- [ ] Cơ chế Cache Hit được chứng minh bỏ qua hoàn toàn việc gọi Gemini Client.
- [ ] Tính năng `forceRegenerate` hoạt động chính xác khi cập nhật bản ghi cũ.