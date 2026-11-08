---
phase: 3
title: "RESTful Controller and Integration"
status: pending
priority: P1
dependencies: [phase-02-gemini-client-and-mnemonic-service]
---

# Phase 3: RESTful Controller and Integration

## Overview
Xây dựng Controller `FlashcardMnemonicsController` cung cấp API RESTful cho Frontend, quản lý xác thực danh tính người dùng và cấu hình Dependency Injection với chính sách chịu lỗi Polly (Polly Retry Policy) khi giao tiếp với Google Gemini API:
- Endpoint: `GET /api/v1/flashcards/{cardId}/mnemonic`.
- Cơ chế kích hoạt: Hỗ trợ cả việc lấy từ Cache tức thì hoặc ép buộc sinh lại qua query parameter `?forceRegenerate=true`.
- Chuẩn hóa mã phản hồi HTTP và xử lý lỗi chuyên biệt (401 Unauthorized, 403 Forbidden, 404 NotFound, 503/429 AI Service Unavailable).

## Requirements
- **Functional**:
  - `GET /api/v1/flashcards/{cardId:guid}/mnemonic`:
    - Header: `Authorization: Bearer <JWT_Token>`.
    - Query string: `forceRegenerate: bool = false`.
    - Lấy `userId` từ token JWT.
    - Gọi `IFlashcardMnemonicService.GetOrGenerateMnemonicAsync`.
    - Phản hồi: `HTTP 200 OK` kèm bọc chuẩn `ApiResponse<MnemonicDto>`.
  - Xử lý ngoại lệ chuẩn hóa:
    - `KeyNotFoundException` $\to$ `HTTP 404 Not Found`.
    - `UnauthorizedAccessException` $\to$ `HTTP 403 Forbidden`.
    - `InvalidOperationException` (do Gemini Rate Limit) $\to$ `HTTP 503 Service Unavailable` hoặc `HTTP 429 Too Many Requests` với message rõ ràng.
- **Non-functional**:
  - Thiết lập HTTP Timeout cho Gemini Client là 15 giây.
  - Cấu hình Polly Retry 2 lần với Exponential Backoff (1s, 2s) đối với các mã lỗi mạng tạm thời (500, 502, 503, 504).

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Api.Controllers`
- **DI Registration**: `SmartLearn.Infrastructure.DependencyInjection`

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/FlashcardMnemonicsController.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/DependencyInjection.cs` (Đăng ký HttpClient + Polly cho `GeminiMnemonicClient`)

## Implementation Steps

1. **Cài đặt Controller `FlashcardMnemonicsController`**:
   ```csharp
   namespace SmartLearn.Api.Controllers;

   [ApiController]
   [Route("api/v1/flashcards/{cardId:guid}/mnemonic")]
   [Authorize]
   public class FlashcardMnemonicsController : ControllerBase
   {
       private readonly IFlashcardMnemonicService _mnemonicService;
       private readonly ILogger<FlashcardMnemonicsController> _logger;

       public FlashcardMnemonicsController(
           IFlashcardMnemonicService mnemonicService,
           ILogger<FlashcardMnemonicsController> logger)
       {
           _mnemonicService = mnemonicService;
           _logger = logger;
       }

       private Guid GetCurrentUserId()
       {
           var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
               throw new UnauthorizedAccessException("Người dùng chưa được xác thực hợp lệ.");
           return userId;
       }

       [HttpGet]
       [ProducesResponseType(typeof(ApiResponse<MnemonicDto>), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status401Unauthorized)]
       [ProducesResponseType(StatusCodes.Status403Forbidden)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
       [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
       public async Task<IActionResult> GetMnemonic(
           [FromRoute] Guid cardId,
           [FromQuery] bool forceRegenerate = false,
           CancellationToken ct = default)
       {
           var userId = GetCurrentUserId();

           try
           {
               var result = await _mnemonicService.GetOrGenerateMnemonicAsync(cardId, forceRegenerate, userId, ct);
               return Ok(ApiResponse<MnemonicDto>.Ok(result));
           }
           catch (KeyNotFoundException ex)
           {
               return NotFound(ApiResponse<MnemonicDto>.Fail(ex.Message));
           }
           catch (UnauthorizedAccessException ex)
           {
               return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<MnemonicDto>.Fail(ex.Message));
           }
           catch (InvalidOperationException ex)
           {
               _logger.LogWarning(ex, "Mnemonic generation issue for Card {CardId}", cardId);
               return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<MnemonicDto>.Fail(ex.Message));
           }
       }
   }
   ```

2. **Cấu hình HttpClient & Polly trong `DependencyInjection.cs`**:
   ```csharp
   services.AddHttpClient<IGeminiMnemonicClient, GeminiMnemonicClient>(client =>
   {
       client.Timeout = TimeSpan.FromSeconds(15);
   })
   .AddTransientHttpErrorPolicy(policy => policy.WaitAndRetryAsync(
       retryCount: 2,
       sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
   ));

   services.AddScoped<IFlashcardMnemonicService, FlashcardMnemonicService>();
   ```

## Success Criteria
- [ ] Gửi request `GET /api/v1/flashcards/{cardId}/mnemonic` trả về HTTP 200 kèm 3 dạng mẹo nhớ.
- [ ] Trả về đúng HTTP 403 khi học viên lạ cố tình xem mẹo nhớ của một bộ thẻ private người khác sở hữu.
- [ ] Tự động retry tối đa 2 lần khi gặp lỗi mạng chập chờn với Gemini API trước khi báo lỗi.