---
phase: 3
title: "RESTful Controller and DTOs"
status: pending
priority: P1
dependencies: [phase-02-mnemonic-pinning-service-and-validation]
---

# Phase 3: RESTful Controller and DTOs

## Overview
Xây dựng Controller `FlashcardMnemonicPinController` trong tầng API của ASP.NET Core, cung cấp các endpoint RESTful cho Frontend quản lý hành vi Ghim, Gỡ ghim, và Đọc mẹo nhớ cá nhân:
- `PUT /api/v1/flashcards/{cardId}/mnemonic/pin`: Ghim hoặc thay đổi mẹo nhớ.
- `DELETE /api/v1/flashcards/{cardId}/mnemonic/pin`: Gỡ ghim mẹo nhớ.
- `GET /api/v1/flashcards/{cardId}/mnemonic/pin`: Lấy thông tin mẹo nhớ đã ghim.
- Chuẩn hóa mã phản hồi HTTP, tích hợp phân quyền `[Authorize]` và tài liệu hóa Swagger OpenAPI.

## Requirements
- **Functional**:
  - `PUT /api/v1/flashcards/{cardId:guid}/mnemonic/pin`:
    - Header: `Authorization: Bearer <JWT_Token>`.
    - Body: `PinMnemonicDto(MnemonicType, Content)`.
    - Phản hồi: `HTTP 200 OK` kèm `ApiResponse<PinnedMnemonicDto>`.
  - `DELETE /api/v1/flashcards/{cardId:guid}/mnemonic/pin`:
    - Header: `Authorization: Bearer <JWT_Token>`.
    - Phản hồi: `HTTP 204 No Content` khi gỡ thành công hoặc thẻ chưa từng ghim.
  - `GET /api/v1/flashcards/{cardId:guid}/mnemonic/pin`:
    - Header: `Authorization: Bearer <JWT_Token>`.
    - Phản hồi: `HTTP 200 OK` kèm `ApiResponse<PinnedMnemonicDto>`.
  - Xử lý mã lỗi:
    - 400 Bad Request: Nội dung trống hoặc vượt quá 5,000 ký tự.
    - 401 Unauthorized: Thiếu JWT Token.
    - 403 Forbidden: Không có quyền truy cập vào bộ thẻ.
    - 404 Not Found: Thẻ không tồn tại.
- **Non-functional**:
  - Thời gian xử lý: $< 15\text{ms}$.
  - Hỗ trợ Swagger UI schema rõ ràng cho Frontend tích hợp.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Api.Controllers`

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/FlashcardMnemonicPinController.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/DependencyInjection.cs` (Đăng ký `IMnemonicPinningService`)

## Implementation Steps

1. **Cài đặt Controller `FlashcardMnemonicPinController`**:
   ```csharp
   namespace SmartLearn.Api.Controllers;

   [ApiController]
   [Route("api/v1/flashcards/{cardId:guid}/mnemonic/pin")]
   [Authorize]
   public class FlashcardMnemonicPinController : ControllerBase
   {
       private readonly IMnemonicPinningService _pinningService;
       private readonly ILogger<FlashcardMnemonicPinController> _logger;

       public FlashcardMnemonicPinController(
           IMnemonicPinningService pinningService,
           ILogger<FlashcardMnemonicPinController> logger)
       {
           _pinningService = pinningService;
           _logger = logger;
       }

       private Guid GetCurrentUserId()
       {
           var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var userId))
               throw new UnauthorizedAccessException("Người dùng chưa được xác thực danh tính.");
           return userId;
       }

       [HttpGet]
       [ProducesResponseType(typeof(ApiResponse<PinnedMnemonicDto>), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status401Unauthorized)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
       public async Task<IActionResult> GetPinnedMnemonic(
           [FromRoute] Guid cardId,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();
           var result = await _pinningService.GetPinnedMnemonicAsync(cardId, userId, ct);
           return Ok(ApiResponse<PinnedMnemonicDto>.Ok(result));
       }

       [HttpPut]
       [ProducesResponseType(typeof(ApiResponse<PinnedMnemonicDto>), StatusCodes.Status200OK)]
       [ProducesResponseType(StatusCodes.Status400BadRequest)]
       [ProducesResponseType(StatusCodes.Status401Unauthorized)]
       [ProducesResponseType(StatusCodes.Status403Forbidden)]
       [ProducesResponseType(StatusCodes.Status404NotFound)]
       public async Task<IActionResult> PinMnemonic(
           [FromRoute] Guid cardId,
           [FromBody] PinMnemonicDto dto,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();

           try
           {
               var result = await _pinningService.PinMnemonicAsync(cardId, dto, userId, ct);
               return Ok(ApiResponse<PinnedMnemonicDto>.Ok(result));
           }
           catch (ArgumentException ex)
           {
               return BadRequest(ApiResponse<PinnedMnemonicDto>.Fail(ex.Message));
           }
           catch (KeyNotFoundException ex)
           {
               return NotFound(ApiResponse<PinnedMnemonicDto>.Fail(ex.Message));
           }
           catch (UnauthorizedAccessException ex)
           {
               return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<PinnedMnemonicDto>.Fail(ex.Message));
           }
       }

       [HttpDelete]
       [ProducesResponseType(StatusCodes.Status204NoContent)]
       [ProducesResponseType(StatusCodes.Status401Unauthorized)]
       public async Task<IActionResult> UnpinMnemonic(
           [FromRoute] Guid cardId,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();
           await _pinningService.UnpinMnemonicAsync(cardId, userId, ct);
           return NoContent();
       }
   }
   ```

2. **Đăng ký Dịch vụ trong `DependencyInjection.cs`**:
   ```csharp
   services.AddScoped<IMnemonicPinningService, MnemonicPinningService>();
   ```

## Success Criteria
- [ ] Gửi request `PUT /pin` trả về HTTP 200 OK và cập nhật mẹo nhớ thành công.
- [ ] Gửi request `DELETE /pin` trả về HTTP 204 No Content.
- [ ] Swagger tài liệu hóa đầy đủ 3 endpoints kèm DTO mẫu.