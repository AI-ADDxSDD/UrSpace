---
phase: 2
title: "Gemini Client and Mnemonic Service"
status: pending
priority: P1
dependencies: [phase-01-database-entity-and-ef-core-migration]
---

# Phase 2: Gemini Client and Mnemonic Service

## Overview
Xây dựng 2 thành phần cốt lõi:
1. **`IGeminiMnemonicClient`**: Tích hợp trực tiếp với Google Gemini API (`gemini-1.5-flash`), cấu hình **Structured JSON Output Schema** ép buộc AI trả về đúng 3 trường dữ liệu nhận thức (`visual`, `rhyme`, `analogy`) bằng Tiếng Việt, kết hợp chính sách Retry với Polly khi gặp nghẽn mạng hoặc quá tải tạm thời.
2. **`IFlashcardMnemonicService`**: Quản lý vòng đời mẹo nhớ, thực thi chiến lược kiểm tra Cache trước khi gọi AI, lưu trữ kết quả vào PostgreSQL và xử lý cờ ép buộc sinh lại (`forceRegenerate`).

## Requirements
- **Functional**:
  - `GenerateMnemonicAsync` (Gemini Client):
    - Đầu vào: `front` (câu hỏi), `back` (đáp án), `conceptName` (chuyên đề liên quan).
    - Tạo System Prompt chuyên gia tâm lý nhận thức và yêu cầu định dạng JSON.
    - Cấu hình request body:
      - Model: `gemini-1.5-flash`.
      - `generationConfig.responseMimeType = "application/json"`.
      - `generationConfig.responseSchema`: Bắt buộc chứa 3 thuộc tính `visual`, `rhyme`, `analogy`.
      - `temperature = 0.7` (đủ sáng tạo cho thơ vè và hình ảnh nhưng vẫn bám sát câu hỏi).
    - Parse chuỗi JSON trả về thành record `MnemonicRawResponse`.
  - `GetOrGenerateMnemonicAsync` (Mnemonic Service):
    - Đầu vào: `cardId`, `forceRegenerate`, `userId`.
    - Xác thực quyền truy cập: Kiểm tra thẻ tồn tại và thuộc Bộ thẻ (`Deck`) mà người dùng có quyền xem.
    - Kiểm tra Cache CSDL:
      - Nếu `forceRegenerate == false` và bản ghi trong `flashcard_mnemonics` đã tồn tại $\to$ Trả về ngay lập tức với cờ `is_cached = true`.
    - Nếu chưa có (hoặc force):
      - Gọi Gemini Client sinh mẹo nhớ mới.
      - Thực hiện Upsert (nếu đã có bản ghi cũ thì Update, chưa có thì Insert) vào `flashcard_mnemonics`.
      - Trả về DTO `MnemonicDto` với `is_cached = false`.
- **Non-functional**:
  - Cache Hit: Thời gian phản hồi $< 5\text{ms}$.
  - Cache Miss: Thời gian gọi Gemini và lưu DB $< 2\text{s}$.
  - Xử lý lỗi Rate Limit (HTTP 429): Ném `GeminiRateLimitException` kèm thông báo thân thiện.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Application.Services.Mnemonics`, `SmartLearn.Infrastructure.External.Gemini`
- **DTOs**: `SmartLearn.Application.DTOs.Mnemonic`

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IGeminiMnemonicClient.cs`
  - `src/SmartLearn.Infrastructure/External/Gemini/GeminiMnemonicClient.cs`
  - `src/SmartLearn.Application/Interfaces/IFlashcardMnemonicService.cs`
  - `src/SmartLearn.Application/Services/FlashcardMnemonicService.cs`
  - `src/SmartLearn.Application/DTOs/Mnemonic/MnemonicDto.cs`

## Implementation Steps

1. **Định nghĩa DTOs**:
   ```csharp
   namespace SmartLearn.Application.DTOs.Mnemonic;

   public record MnemonicRawResponse(
       string Visual,
       string Rhyme,
       string Analogy
   );

   public record MnemonicDto(
       Guid CardId,
       bool IsCached,
       string Visual,
       string Rhyme,
       string Analogy,
       DateTimeOffset UpdatedAt
   );
   ```

2. **Cài đặt `GeminiMnemonicClient`**:
   ```csharp
   namespace SmartLearn.Infrastructure.External.Gemini;

   public class GeminiMnemonicClient : IGeminiMnemonicClient
   {
       private readonly HttpClient _httpClient;
       private readonly IConfiguration _config;
       private readonly ILogger<GeminiMnemonicClient> _logger;

       public GeminiMnemonicClient(HttpClient httpClient, IConfiguration config, ILogger<GeminiMnemonicClient> logger)
       {
           _httpClient = httpClient;
           _config = config;
           _logger = logger;
       }

       public async Task<MnemonicRawResponse> GenerateMnemonicAsync(
           string front,
           string back,
           string conceptName,
           CancellationToken ct = default)
       {
           var apiKey = _config["Gemini:ApiKey"];
           var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

           var systemInstruction = @"Bạn là chuyên gia tâm lý học nhận thức và nghệ nhân sáng tạo mẹo nhớ.
Tạo 3 móc neo nhận thức độc đáo bằng TIẾNG VIỆT:
1. visual: Cảnh tượng tưởng tượng kỳ dị, hài hước kết nối câu hỏi và đáp án (Dual Coding Theory).
2. rhyme: Bài thơ ngắn 2-4 câu lục bát hoặc vè vui nhộn gieo vần bắt tai (Acoustic Chunking).
3. analogy: Câu chuyện ẩn dụ đời thường bình dị giải thích cặn kẽ bản chất khái niệm.";

           var prompt = $"Khái niệm: {conceptName}\nCâu hỏi: {front}\nĐáp án: {back}";

           var requestBody = new
           {
               system_instruction = new { parts = new[] { new { text = systemInstruction } } },
               contents = new[] { new { parts = new[] { new { text = prompt } } } },
               generationConfig = new
               {
                   responseMimeType = "application/json",
                   responseSchema = new
                   {
                       type = "OBJECT",
                       properties = new
                       {
                           visual = new { type = "STRING", description = "Hình ảnh kỳ dị tưởng tượng trong 5 giây" },
                           rhyme = new { type = "STRING", description = "Bài thơ lục bát hoặc vè vần điệu 2-4 câu" },
                           analogy = new { type = "STRING", description = "Ẩn dụ so sánh đời thường" }
                       },
                       required = new[] { "visual", "rhyme", "analogy" }
                   },
                   temperature = 0.7
               }
           };

           var response = await _httpClient.PostAsJsonAsync(endpoint, requestBody, ct);

           if (response.StatusCode == HttpStatusCode.TooManyRequests)
           {
               _logger.LogWarning("Gemini API Rate Limit hit when generating mnemonic.");
               throw new InvalidOperationException("Hệ thống AI đang bận do nhiều yêu cầu cùng lúc. Vui lòng thử lại sau 1 phút.");
           }

           response.EnsureSuccessStatusCode();

           var jsonString = await response.Content.ReadAsStringAsync(ct);
           using var doc = JsonDocument.Parse(jsonString);
           var contentText = doc.RootElement
               .GetProperty("candidates")[0]
               .GetProperty("content")
               .GetProperty("parts")[0]
               .GetProperty("text")
               .GetString();

           var result = JsonSerializer.Deserialize<MnemonicRawResponse>(contentText!, new JsonSerializerOptions
           {
               PropertyNameCaseInsensitive = true
           });

           return result ?? throw new InvalidOperationException("Không thể đọc định dạng phản hồi từ Gemini.");
       }
   }
   ```

3. **Cài đặt Lớp `FlashcardMnemonicService`**:
   ```csharp
   namespace SmartLearn.Application.Services;

   public class FlashcardMnemonicService : IFlashcardMnemonicService
   {
       private readonly AppDbContext _dbContext;
       private readonly IGeminiMnemonicClient _geminiClient;
       private readonly ILogger<FlashcardMnemonicService> _logger;

       public FlashcardMnemonicService(
           AppDbContext dbContext,
           IGeminiMnemonicClient geminiClient,
           ILogger<FlashcardMnemonicService> logger)
       {
           _dbContext = dbContext;
           _geminiClient = geminiClient;
           _logger = logger;
       }

       public async Task<MnemonicDto> GetOrGenerateMnemonicAsync(
           Guid cardId,
           bool forceRegenerate,
           Guid userId,
           CancellationToken ct = default)
       {
           // 1. Xác thực thẻ và quyền truy cập
           var card = await _dbContext.Flashcards
               .Include(f => f.Concept)
               .Include(f => f.Deck)
               .FirstOrDefaultAsync(f => f.Id == cardId, ct);

           if (card == null)
               throw new KeyNotFoundException($"Thẻ {cardId} không tồn tại.");

           if (card.Deck!.UserId != userId && !card.Deck.IsPublic)
               throw new UnauthorizedAccessException("Bạn không có quyền xem mẹo nhớ của bộ thẻ này.");

           // 2. Kiểm tra Cache nếu không yêu cầu ép buộc sinh lại
           if (!forceRegenerate)
           {
               var cached = await _dbContext.FlashcardMnemonics
                   .AsNoTracking()
                   .FirstOrDefaultAsync(m => m.CardId == cardId, ct);

               if (cached != null)
               {
                   return new MnemonicDto(
                       CardId: cardId,
                       IsCached: true,
                       Visual: cached.VisualPrompt,
                       Rhyme: cached.RhymePoem,
                       Analogy: cached.ConceptualAnalogy,
                       UpdatedAt: cached.UpdatedAt
                   );
               }
           }

           // 3. Cache Miss hoặc forceRegenerate: Gọi Gemini 1.5 Flash
           var conceptName = card.Concept?.Name ?? "Kiến thức tổng hợp";
           var aiResponse = await _geminiClient.GenerateMnemonicAsync(card.Front, card.Back, conceptName, ct);

           // 4. Lưu Cache vào CSDL (Upsert)
           var existing = await _dbContext.FlashcardMnemonics
               .FirstOrDefaultAsync(m => m.CardId == cardId, ct);

           var now = DateTimeOffset.UtcNow;
           if (existing == null)
           {
               existing = new FlashcardMnemonic
               {
                   Id = Guid.NewGuid(),
                   CardId = cardId,
                   VisualPrompt = aiResponse.Visual,
                   RhymePoem = aiResponse.Rhyme,
                   ConceptualAnalogy = aiResponse.Analogy,
                   ModelVersion = "gemini-1.5-flash",
                   CreatedAt = now,
                   UpdatedAt = now
               };
               _dbContext.FlashcardMnemonics.Add(existing);
           }
           else
           {
               existing.VisualPrompt = aiResponse.Visual;
               existing.RhymePoem = aiResponse.Rhyme;
               existing.ConceptualAnalogy = aiResponse.Analogy;
               existing.UpdatedAt = now;
           }

           await _dbContext.SaveChangesAsync(ct);

           return new MnemonicDto(
               CardId: cardId,
               IsCached: false,
               Visual: existing.VisualPrompt,
               Rhyme: existing.RhymePoem,
               Analogy: existing.ConceptualAnalogy,
               UpdatedAt: existing.UpdatedAt
           );
       }
   }
   ```

## Success Criteria
- [ ] Gemini API được gọi thành công và trả về JSON chuẩn xác 3 trường `visual`, `rhyme`, `analogy`.
- [ ] Lần gọi thứ 2 cho cùng 1 thẻ (với `forceRegenerate = false`) $\to$ Trả về kết quả từ Cache trong $< 5\text{ms}$, không gọi Gemini.
- [ ] Khi gửi `forceRegenerate = true` $\to$ AI sinh lại bộ mẹo mới và cập nhật thành công vào CSDL.