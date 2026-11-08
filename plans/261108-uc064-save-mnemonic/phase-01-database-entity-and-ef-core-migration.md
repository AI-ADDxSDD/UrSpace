---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

## Overview
Cập nhật thực thể C# `UserCardState` và cấu hình Fluent API trong Entity Framework Core để mở rộng khả năng cá nhân hóa nhận thức:
- Bổ sung 3 trường: `PinnedMnemonic` (nội dung mẹo nhớ đã chọn hoặc chỉnh sửa), `PinnedMnemonicType` (dạng nhận thức: `Visual`, `Rhyme`, `Analogy`, `Custom`), và `PinnedAt` (thời điểm ghim).
- Tạo Partial Index tối ưu hóa truy vấn các thẻ có mẹo nhớ của người học.
- Đảm bảo tính độc lập tuyệt đối giữa các người học: không can thiệp hay sửa đổi bất kỳ cột nào của bảng gốc `flashcards`.

## Requirements
- **Functional**:
  - Cập nhật bảng `user_card_states` trong PostgreSQL:
    - Thêm cột `pinned_mnemonic TEXT DEFAULT NULL`
    - Thêm cột `pinned_mnemonic_type VARCHAR(30) DEFAULT NULL`
    - Thêm cột `pinned_at TIMESTAMPTZ DEFAULT NULL`
  - Định nghĩa Enum `MnemonicType`:
    - `Visual` (Hình ảnh kỳ dị)
    - `Rhyme` (Thơ vè lục bát/vần điệu)
    - `Analogy` (Ẩn dụ đời thường)
    - `Custom` (Tự học viên biên tập)
  - Chỉ mục tối ưu:
    - Tạo partial index `idx_user_card_states_pinned ON (user_id, card_id) WHERE pinned_mnemonic IS NOT NULL`.
- **Non-functional**:
  - Không làm gián đoạn hay ảnh hưởng đến các trường tính toán FSRS v4.5 (`stability`, `difficulty`, `due_date`, `reps`, `lapses`).
  - Migration áp dụng an toàn trên cơ sở dữ liệu đã có dữ liệu mà không cần downtime.

## Architecture & Domain Model
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Updates**:
  - `SmartLearn.Domain.Enums.MnemonicType`
  - `SmartLearn.Domain.Entities.UserCardState`

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Enums/MnemonicType.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_AddPinnedMnemonicToUserCardStates.cs`
- Modify:
  - `src/SmartLearn.Domain/Entities/UserCardState.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/UserCardStateConfiguration.cs`

## Implementation Steps

1. **Tạo Enum `MnemonicType`**:
   ```csharp
   namespace SmartLearn.Domain.Enums;

   public enum MnemonicType
   {
       Visual,
       Rhyme,
       Analogy,
       Custom
   }
   ```

2. **Cập nhật Entity `UserCardState`**:
   ```csharp
   namespace SmartLearn.Domain.Entities;

   public class UserCardState
   {
       public Guid Id { get; set; }
       public Guid UserId { get; set; }
       public Guid CardId { get; set; }
       public FSRSCardState State { get; set; } = FSRSCardState.New;
       public double Stability { get; set; } = 0.0;
       public double Difficulty { get; set; } = 0.0;
       public int Reps { get; set; } = 0;
       public int Lapses { get; set; } = 0;
       public DateTimeOffset DueDate { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset? LastReview { get; set; }

       // === Mở rộng UC-06.4: Ghim Mẹo nhớ Cá nhân ===
       public string? PinnedMnemonic { get; set; }
       public MnemonicType? PinnedMnemonicType { get; set; }
       public DateTimeOffset? PinnedAt { get; set; }

       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation properties
       public User? User { get; set; }
       public Flashcard? Card { get; set; }
   }
   ```

3. **Cập nhật `UserCardStateConfiguration.cs`**:
   ```csharp
   builder.Property(s => s.PinnedMnemonic)
          .HasColumnType("text")
          .IsRequired(false);

   builder.Property(s => s.PinnedMnemonicType)
          .HasConversion<string>()
          .HasMaxLength(30)
          .IsRequired(false);

   builder.HasIndex(s => new { s.UserId, s.CardId })
          .HasFilter("\"pinned_mnemonic\" IS NOT NULL")
          .HasDatabaseName("idx_user_card_states_pinned");
   ```

4. **Sinh & Chạy Migration**:
   - `dotnet ef migrations add AddPinnedMnemonicToUserCardStates`
   - `dotnet ef database update`

## Success Criteria
- [ ] Migration chạy thành công, thêm 3 cột vào bảng `user_card_states`.
- [ ] Cột `pinned_mnemonic` cho phép lưu trữ văn bản dài (Markdown, thơ vè đa dòng).
- [ ] Partial index `idx_user_card_states_pinned` chỉ đánh chỉ mục trên các bản ghi có ghim mẹo nhớ.