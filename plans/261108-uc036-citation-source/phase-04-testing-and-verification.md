---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [phase-03-restful-controller-and-caching]
---

# Phase 4: Testing and Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện từ tầng Service (Unit Tests) đến tầng API Controller (Integration Tests) cho tính năng Đối chiếu Nguồn Tài liệu gốc (UC-03.6):
- Kiểm thử logic phân quyền bảo mật: Xác thực quyền chủ sở hữu tài liệu và quyền truy cập bộ thẻ.
- Kiểm thử độ chính xác của metadata trích dẫn (`source_page`, `source_excerpt`).
- Kiểm thử truyền tải giao thức web: HTTP 206 Partial Content (Byte-Range Request), HTTP 304 Not Modified (ETag Caching), và xử lý ngắt kết nối an toàn.

## Test Cases & Scenarios

### 1. Unit Tests (`SmartLearn.Tests.Unit.Services.DocumentCitationServiceTests`)
- `ValidateAccess_OwnerUser_ShouldGrantAccess`:
  - Khởi tạo Document với `UserId = userA`.
  - Gọi xác thực với `userId = userA`.
  - Kỳ vọng: Thành công, trả về thực thể `Document`.
- `ValidateAccess_UnrelatedUser_ShouldThrowUnauthorizedAccessException`:
  - Khởi tạo Document thuộc `userA` và Bộ thẻ riêng tư (`IsPublic = false`).
  - Gọi xác thực với `userId = userB`.
  - Kỳ vọng: Ném `UnauthorizedAccessException` từ chối truy cập.
- `GetCitationMetadata_WithCardId_ReturnsAccuratePageAndExcerpt`:
  - Gắn thẻ Flashcard có `SourcePage = 18` và `SourceExcerpt = "Thuật toán Banker..."`.
  - Gọi `GetCitationMetadataAsync` với `cardId`.
  - Kỳ vọng: DTO trả về có `SourcePage == 18` và đúng nội dung trích dẫn.

### 2. Integration Tests (`SmartLearn.Tests.Integration.Controllers.DocumentCitationControllerTests`)
- `StreamDocument_WithByteRangeHeader_Returns206PartialContent`:
  - Chuẩn bị tệp PDF mẫu có dung lượng $1\text{MB}$ trên ổ đĩa thử nghiệm.
  - Gửi request `GET /api/v1/documents/{docId}/stream` kèm header `Range: bytes=0-1023`.
  - Kỳ vọng:
    - Status code `206 Partial Content`.
    - Header `Accept-Ranges: bytes`.
    - Header `Content-Range: bytes 0-1023/1048576`.
    - Content-Length bằng đúng $1024$.
    - Payload nhị phân nhận về khớp chính xác 1024 bytes đầu của file.
- `StreamDocument_WithMatchingETag_Returns304NotModified`:
  - Gửi request `GET /api/v1/documents/{docId}/stream` kèm header `If-None-Match: "\"{fileHashSha256}\""`.
  - Kỳ vọng: Status code `304 Not Modified`, body rỗng, tiết kiệm $100\%$ băng thông.
- `StreamDocument_UnauthorizedUser_Returns403Forbidden`:
  - Đăng nhập tài khoản User B không có quyền xem tài liệu của User A.
  - Gửi request stream tệp.
  - Kỳ vọng: HTTP `403 Forbidden` hoặc `401 Unauthorized`.

## Related Code Files
- Create:
  - `tests/SmartLearn.Tests.Unit/Services/DocumentCitationServiceTests.cs`
  - `tests/SmartLearn.Tests.Integration/Controllers/DocumentCitationControllerTests.cs`

## Implementation Steps

1. **Cài đặt Unit Tests (`DocumentCitationServiceTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Unit.Services;

   public class DocumentCitationServiceTests
   {
       [Fact]
       public async Task ValidateAccess_UnrelatedUser_ThrowsUnauthorizedException()
       {
           // Arrange
           using var context = TestDbContextFactory.CreateInMemoryDbContext();
           var service = new DocumentCitationService(context, Mock.Of<ILogger<DocumentCitationService>>());

           var ownerId = Guid.NewGuid();
           var strangerId = Guid.NewGuid();

           var deck = new Deck { Id = Guid.NewGuid(), UserId = ownerId, Name = "Private Deck", IsPublic = false };
           var doc = new Document { Id = Guid.NewGuid(), UserId = ownerId, DeckId = deck.Id, FileName = "test.pdf" };

           context.Decks.Add(deck);
           context.Documents.Add(doc);
           await context.SaveChangesAsync();

           // Act & Assert
           await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
               service.ValidateDocumentAccessAsync(doc.Id, strangerId));
       }
   }
   ```

2. **Cài đặt Integration Tests (`DocumentCitationControllerTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Integration.Controllers;

   public class DocumentCitationControllerTests : IClassFixture<CustomWebApplicationFactory>
   {
       private readonly HttpClient _client;
       private readonly CustomWebApplicationFactory _factory;

       public DocumentCitationControllerTests(CustomWebApplicationFactory factory)
       {
           _factory = factory;
           _client = factory.CreateClient();
       }

       [Fact]
       public async Task StreamDocument_WithByteRange_Returns206AndExactChunkSize()
       {
           // Arrange: Seed document và file vật lý giả lập 500KB
           var seedDoc = await _factory.SeedSamplePdfDocumentAsync(sizeInBytes: 512000);

           var request = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/documents/{seedDoc.Id}/stream");
           request.Headers.Range = new RangeHeaderValue(0, 1023); // Lấy 1024 bytes đầu

           // Act
           var response = await _client.SendAsync(request);

           // Assert
           Assert.Equal(HttpStatusCode.PartialContent, response.StatusCode);
           Assert.Equal("bytes", response.Headers.AcceptRanges.ToString());
           Assert.NotNull(response.Content.Headers.ContentRange);
           Assert.Equal(1024, response.Content.Headers.ContentLength);

           var bytes = await response.Content.ReadAsByteArrayAsync();
           Assert.Equal(1024, bytes.Length);
       }

       [Fact]
       public async Task StreamDocument_WithMatchingETag_Returns304NotModified()
       {
           // Arrange
           var seedDoc = await _factory.SeedSamplePdfDocumentAsync(sizeInBytes: 100000);

           var request = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/documents/{seedDoc.Id}/stream");
           request.Headers.IfNoneMatch.Add(new EntityTagHeaderValue($"\"{seedDoc.FileHashSha256}\""));

           // Act
           var response = await _client.SendAsync(request);

           // Assert
           Assert.Equal(HttpStatusCode.NotModified, response.StatusCode);
       }
   }
   ```

3. **Chạy kiểm thử tự động**:
   - `dotnet test --filter "Category=Citation"`

## Success Criteria
- [ ] 100% các ca kiểm thử Unit Test và Integration Test vượt qua.
- [ ] Giao thức HTTP 206 Partial Content và Range Request hoạt động chính xác với các phân đoạn byte ngẫu nhiên.
- [ ] Cơ chế bảo mật và ETag Cache được xác thực nghiêm ngặt.