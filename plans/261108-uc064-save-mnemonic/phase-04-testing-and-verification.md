---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [phase-03-restful-controller-and-dtos]
---

# Phase 4: Testing and Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện từ Unit Test đến Integration Test cho UC-06.4:
- Kiểm thử tính cô lập cá nhân hóa (Personalization Isolation): Đảm bảo 2 học viên cùng học 1 bộ thẻ chung có thể ghim 2 mẹo nhớ hoàn toàn khác nhau mà không làm thay đổi thẻ gốc.
- Kiểm thử lưu trữ nội dung mẹo nhớ tùy biến (Custom Text Editing).
- Kiểm thử quy trình gỡ ghim (Unpin) và phản hồi trạng thái `is_pinned = false`.

## Test Cases & Scenarios

### 1. Unit Tests (`SmartLearn.Tests.Unit.Services.MnemonicPinningServiceTests`)
- `PinMnemonic_MultipleUsersOnSameCard_MaintainsIsolation`:
  - Khởi tạo 1 thẻ thuộc Bộ thẻ công khai (`IsPublic = true`) với `Back = "Original Answer"`.
  - Học viên A gọi `PinMnemonicAsync` với dạng `RHYME`.
  - Học viên B gọi `PinMnemonicAsync` với dạng `ANALOGY`.
  - Kỳ vọng:
    - `flashcards.Back` vẫn bằng đúng `"Original Answer"`.
    - Trạng thái của Học viên A có `PinnedMnemonicType == MnemonicType.Rhyme`.
    - Trạng thái của Học viên B có `PinnedMnemonicType == MnemonicType.Analogy`.
- `PinMnemonic_CustomEditedText_SavesExactContent`:
  - Học viên chỉnh sửa văn bản với ký hiệu riêng: `"Mẹo: Chú ý 3 bước A -> B -> C"`.
  - Kỳ vọng: CSDL lưu chính xác từng ký tự chuỗi đã chỉnh sửa.
- `UnpinMnemonic_ExistingPinned_ResetsToNull`:
  - Học viên đã ghim mẹo nhớ trước đó.
  - Gọi `UnpinMnemonicAsync`.
  - Kỳ vọng: `PinnedMnemonic` chuyển thành `null`, `PinnedAt` chuyển thành `null`, bản ghi `UserCardState` FSRS không bị xóa.

### 2. Integration Tests (`SmartLearn.Tests.Integration.Controllers.FlashcardMnemonicPinControllerTests`)
- `PinAndGetMnemonic_EndToEndFlow_Success`:
  - Gửi request `PUT /api/v1/flashcards/{cardId}/mnemonic/pin` với body JSON.
  - Kỳ vọng: `HTTP 200 OK`, body trả về `is_pinned: true`.
  - Gửi request `GET /api/v1/flashcards/{cardId}/mnemonic/pin`.
  - Kỳ vọng: `HTTP 200 OK`, nội dung khớp với vừa lưu.
- `UnpinMnemonic_Returns204NoContent`:
  - Gửi request `DELETE /api/v1/flashcards/{cardId}/mnemonic/pin`.
  - Kỳ vọng: `HTTP 204 No Content`.
  - Gửi lại request `GET`: Trả về `is_pinned: false`.

## Related Code Files
- Create:
  - `tests/SmartLearn.Tests.Unit/Services/MnemonicPinningServiceTests.cs`
  - `tests/SmartLearn.Tests.Integration/Controllers/FlashcardMnemonicPinControllerTests.cs`

## Implementation Steps

1. **Cài đặt Unit Tests (`MnemonicPinningServiceTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Unit.Services;

   public class MnemonicPinningServiceTests
   {
       [Fact]
       public async Task PinMnemonic_MultipleUsersOnSameCard_MaintainsCompleteIsolation()
       {
           // Arrange
           using var context = TestDbContextFactory.CreateInMemoryDbContext();
           var service = new MnemonicPinningService(context, Mock.Of<ILogger<MnemonicPinningService>>());

           var instructorId = Guid.NewGuid();
           var studentA = Guid.NewGuid();
           var studentB = Guid.NewGuid();

           var publicDeck = new Deck { Id = Guid.NewGuid(), UserId = instructorId, Name = "OS Course", IsPublic = true };
           var card = new Flashcard { Id = Guid.NewGuid(), DeckId = publicDeck.Id, Front = "Q", Back = "Academic Answer" };

           context.Decks.Add(publicDeck);
           context.Flashcards.Add(card);
           await context.SaveChangesAsync();

           // Act: Student A pins Rhyme, Student B pins Analogy
           await service.PinMnemonicAsync(card.Id, new PinMnemonicDto("RHYME", "Thơ lục bát của A"), studentA);
           await service.PinMnemonicAsync(card.Id, new PinMnemonicDto("ANALOGY", "Ẩn dụ của B"), studentB);

           // Assert
           var cardInDb = await context.Flashcards.FindAsync(card.Id);
           Assert.Equal("Academic Answer", cardInDb!.Back); // Thẻ gốc không bị đổi

           var stateA = await context.UserCardStates.FirstAsync(s => s.UserId == studentA && s.CardId == card.Id);
           var stateB = await context.UserCardStates.FirstAsync(s => s.UserId == studentB && s.CardId == card.Id);

           Assert.Equal("Thơ lục bát của A", stateA.PinnedMnemonic);
           Assert.Equal(MnemonicType.Rhyme, stateA.PinnedMnemonicType);

           Assert.Equal("Ẩn dụ của B", stateB.PinnedMnemonic);
           Assert.Equal(MnemonicType.Analogy, stateB.PinnedMnemonicType);
       }
   }
   ```

2. **Cài đặt Integration Tests (`FlashcardMnemonicPinControllerTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Integration.Controllers;

   public class FlashcardMnemonicPinControllerTests : IClassFixture<CustomWebApplicationFactory>
   {
       private readonly HttpClient _client;
       private readonly CustomWebApplicationFactory _factory;

       public FlashcardMnemonicPinControllerTests(CustomWebApplicationFactory factory)
       {
           _factory = factory;
           _client = factory.CreateClient();
       }

       [Fact]
       public async Task Pin_Get_Unpin_FullLifecycleTest()
       {
           var seedData = await _factory.SeedCardWithUserAsync();

           // 1. PIN
           var pinPayload = new PinMnemonicDto("VISUAL", "Tưởng tượng con rồng xanh...");
           var putResponse = await _client.PutAsJsonAsync($"/api/v1/flashcards/{seedData.CardId}/mnemonic/pin", pinPayload);
           putResponse.EnsureSuccessStatusCode();

           // 2. GET
           var getResponse = await _client.GetFromJsonAsync<ApiResponse<PinnedMnemonicDto>>($"/api/v1/flashcards/{seedData.CardId}/mnemonic/pin");
           Assert.NotNull(getResponse?.Data);
           Assert.True(getResponse.Data.IsPinned);
           Assert.Equal("VISUAL", getResponse.Data.MnemonicType);

           // 3. UNPIN
           var deleteResponse = await _client.DeleteAsync($"/api/v1/flashcards/{seedData.CardId}/mnemonic/pin");
           Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

           // 4. VERIFY AFTER UNPIN
           var verifyResponse = await _client.GetFromJsonAsync<ApiResponse<PinnedMnemonicDto>>($"/api/v1/flashcards/{seedData.CardId}/mnemonic/pin");
           Assert.NotNull(verifyResponse?.Data);
           Assert.False(verifyResponse.Data.IsPinned);
       }
   }
   ```

3. **Chạy kiểm thử tự động**:
   - `dotnet test --filter "Category=MnemonicPin"`

## Success Criteria
- [ ] 100% các ca kiểm thử Unit Test và Integration Test vượt qua.
- [ ] Tính cô lập dữ liệu giữa các học viên trên cùng 1 thẻ được bảo đảm tuyệt đối.
- [ ] Vòng đời Pin $\to$ Get $\to$ Unpin hoạt động trơn tru.