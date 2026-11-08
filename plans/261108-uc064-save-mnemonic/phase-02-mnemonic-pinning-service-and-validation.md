---
phase: 2
title: "Mnemonic Pinning Service and Validation"
status: pending
priority: P1
dependencies: [phase-01-database-entity-and-ef-core-migration]
---

# Phase 2: Mnemonic Pinning Service and Validation

## Overview
Xây dựng Service `IMnemonicPinningService` và `MnemonicPinningService` đảm nhiệm toàn bộ nghiệp vụ Ghim (Pin), Gỡ ghim (Unpin), và Truy vấn mẹo nhớ cá nhân:
- Kiểm tra tính hợp lệ của nội dung mẹo nhớ (tối đa 5,000 ký tự, không được để trống).
- Tự động khởi tạo bản ghi `UserCardState` mặc định nếu người học lần đầu tương tác với thẻ trong một bộ thẻ công khai.
- Cập nhật an toàn trường `PinnedMnemonic` và `PinnedMnemonicType` trên bản ghi FSRS cá nhân của người học mà không làm ảnh hưởng đến thẻ gốc `Flashcard`.

## Requirements
- **Functional**:
  - `PinMnemonicAsync`:
    - Đầu vào: `cardId`, `PinMnemonicDto`, `userId`.
    - Kiểm tra thẻ `Flashcard` tồn tại và người dùng có quyền truy cập vào Bộ thẻ (`Deck.UserId == userId || Deck.IsPublic`).
    - Validate dữ liệu đầu vào:
      - `Content`: không rỗng, độ dài từ 1 đến 5,000 ký tự.
      - `MnemonicType`: thuộc một trong các giá trị `VISUAL`, `RHYME`, `ANALOGY`, `CUSTOM`.
    - Tìm bản ghi `user_card_states` theo `(userId, cardId)`.
      - Nếu chưa có: Tự động khởi tạo bản ghi mới với `State = FSRSCardState.New`, `DueDate = UtcNow`.
    - Gán `PinnedMnemonic = dto.Content.Trim()`, `PinnedMnemonicType = parsedType`, `PinnedAt = UtcNow`, `UpdatedAt = UtcNow`.
    - Lưu CSDL và trả về DTO `PinnedMnemonicDto`.
  - `UnpinMnemonicAsync`:
    - Đầu vào: `cardId`, `userId`.
    - Tìm bản ghi `user_card_states`. Nếu không tìm thấy hoặc chưa từng ghim mẹo nhớ $\to$ Trả về `false`.
    - Gán `PinnedMnemonic = null`, `PinnedMnemonicType = null`, `PinnedAt = null`, `UpdatedAt = UtcNow`.
    - Lưu CSDL và trả về `true`.
  - `GetPinnedMnemonicAsync`:
    - Đầu vào: `cardId`, `userId`.
    - Truy vấn nhanh và trả về `PinnedMnemonicDto` (hoặc thông báo `is_pinned = false`).
- **Non-functional**:
  - Tốc độ thực thi: $< 3\text{ms}$ nhờ truy vấn trực tiếp trên khóa chính hoặc unique index `(user_id, card_id)`.
  - Tính toàn vẹn: Không làm thay đổi bất kỳ trường FSRS nào khác (`stability`, `difficulty`, `due_date`).

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Application.Services.Mnemonics`
- **DTOs**: `SmartLearn.Application.DTOs.Mnemonic`

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IMnemonicPinningService.cs`
  - `src/SmartLearn.Application/Services/MnemonicPinningService.cs`
  - `src/SmartLearn.Application/DTOs/Mnemonic/PinMnemonicDto.cs`
  - `src/SmartLearn.Application/DTOs/Mnemonic/PinnedMnemonicDto.cs`

## Implementation Steps

1. **Định nghĩa các DTOs**:
   ```csharp
   namespace SmartLearn.Application.DTOs.Mnemonic;

   public record PinMnemonicDto(
       string MnemonicType,
       string Content
   );

   public record PinnedMnemonicDto(
       Guid CardId,
       bool IsPinned,
       string? MnemonicType,
       string? PinnedMnemonic,
       DateTimeOffset? PinnedAt
   );
   ```

2. **Định nghĩa Interface `IMnemonicPinningService`**:
   ```csharp
   namespace SmartLearn.Application.Interfaces;

   public interface IMnemonicPinningService
   {
       Task<PinnedMnemonicDto> PinMnemonicAsync(
           Guid cardId,
           PinMnemonicDto dto,
           Guid userId,
           CancellationToken ct = default);

       Task<bool> UnpinMnemonicAsync(
           Guid cardId,
           Guid userId,
           CancellationToken ct = default);

       Task<PinnedMnemonicDto> GetPinnedMnemonicAsync(
           Guid cardId,
           Guid userId,
           CancellationToken ct = default);
   }
   ```

3. **Cài đặt Lớp `MnemonicPinningService`**:
   ```csharp
   namespace SmartLearn.Application.Services;

   public class MnemonicPinningService : IMnemonicPinningService
   {
       private readonly AppDbContext _dbContext;
       private readonly ILogger<MnemonicPinningService> _logger;

       public MnemonicPinningService(AppDbContext dbContext, ILogger<MnemonicPinningService> logger)
       {
           _dbContext = dbContext;
           _logger = logger;
       }

       public async Task<PinnedMnemonicDto> PinMnemonicAsync(
           Guid cardId,
           PinMnemonicDto dto,
           Guid userId,
           CancellationToken ct = default)
       {
           // 1. Kiểm tra nội dung đầu vào
           if (string.IsNullOrWhiteSpace(dto.Content))
               throw new ArgumentException("Nội dung mẹo nhớ không được để trống.");

           if (dto.Content.Length > 5000)
               throw new ArgumentException("Nội dung mẹo nhớ không được vượt quá 5,000 ký tự.");

           var mnemonicType = Enum.TryParse<MnemonicType>(dto.MnemonicType, true, out var parsedType)
               ? parsedType : MnemonicType.Custom;

           // 2. Xác thực thẻ và quyền truy cập
           var card = await _dbContext.Flashcards
               .Include(f => f.Deck)
               .FirstOrDefaultAsync(f => f.Id == cardId, ct);

           if (card == null)
               throw new KeyNotFoundException($"Thẻ {cardId} không tồn tại.");

           if (card.Deck!.UserId != userId && !card.Deck.IsPublic)
               throw new UnauthorizedAccessException("Bạn không có quyền truy cập vào bộ thẻ này.");

           // 3. Tìm hoặc tạo mới UserCardState cho người học
           var state = await _dbContext.UserCardStates
               .FirstOrDefaultAsync(s => s.UserId == userId && s.CardId == cardId, ct);

           var now = DateTimeOffset.UtcNow;
           if (state == null)
           {
               state = new UserCardState
               {
                   Id = Guid.NewGuid(),
                   UserId = userId,
                   CardId = cardId,
                   State = FSRSCardState.New,
                   Stability = 0.0,
                   Difficulty = 0.0,
                   DueDate = now,
                   CreatedAt = now,
                   UpdatedAt = now
               };
               _dbContext.UserCardStates.Add(state);
           }

           // 4. Cập nhật trường mẹo nhớ đã ghim
           state.PinnedMnemonic = dto.Content.Trim();
           state.PinnedMnemonicType = mnemonicType;
           state.PinnedAt = now;
           state.UpdatedAt = now;

           await _dbContext.SaveChangesAsync(ct);
           _logger.LogInformation("User {UserId} pinned {Type} mnemonic for Card {CardId}.", userId, mnemonicType, cardId);

           return new PinnedMnemonicDto(
               CardId: cardId,
               IsPinned: true,
               MnemonicType: state.PinnedMnemonicType.ToString(),
               PinnedMnemonic: state.PinnedMnemonic,
               PinnedAt: state.PinnedAt
           );
       }

       public async Task<bool> UnpinMnemonicAsync(
           Guid cardId,
           Guid userId,
           CancellationToken ct = default)
       {
           var state = await _dbContext.UserCardStates
               .FirstOrDefaultAsync(s => s.UserId == userId && s.CardId == cardId, ct);

           if (state == null || state.PinnedMnemonic == null)
               return false;

           state.PinnedMnemonic = null;
           state.PinnedMnemonicType = null;
           state.PinnedAt = null;
           state.UpdatedAt = DateTimeOffset.UtcNow;

           await _dbContext.SaveChangesAsync(ct);
           _logger.LogInformation("User {UserId} unpinned mnemonic for Card {CardId}.", userId, cardId);
           return true;
       }

       public async Task<PinnedMnemonicDto> GetPinnedMnemonicAsync(
           Guid cardId,
           Guid userId,
           CancellationToken ct = default)
       {
           var state = await _dbContext.UserCardStates
               .AsNoTracking()
               .FirstOrDefaultAsync(s => s.UserId == userId && s.CardId == cardId, ct);

           if (state == null || state.PinnedMnemonic == null)
           {
               return new PinnedMnemonicDto(
                   CardId: cardId,
                   IsPinned: false,
                   MnemonicType: null,
                   PinnedMnemonic: null,
                   PinnedAt: null
               );
           }

           return new PinnedMnemonicDto(
               CardId: cardId,
               IsPinned: true,
               MnemonicType: state.PinnedMnemonicType.ToString(),
               PinnedMnemonic: state.PinnedMnemonic,
               PinnedAt: state.PinnedAt
           );
       }
   }
   ```

## Success Criteria
- [ ] Ghim mẹo nhớ thành công, cập nhật đúng `pinned_mnemonic` và `pinned_mnemonic_type` trên `user_card_states`.
- [ ] Tự động tạo bản ghi `UserCardState` mới nếu chưa có.
- [ ] Gỡ ghim thành công đưa các trường về `null` mà không xóa bản ghi FSRS.