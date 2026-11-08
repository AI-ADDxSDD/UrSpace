---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

## Overview
Thiết kế thực thể C# `FlashcardMnemonic`, cấu hình Entity Type Configuration trong Entity Framework Core với các ràng buộc bảo vệ toàn vẹn dữ liệu: ánh xạ quan hệ $1 - 1$ với `Flashcard`, ràng buộc duy nhất (`UNIQUE`), cấu hình khóa ngoại `ON DELETE CASCADE` và sinh migration PostgreSQL:
- Bảng `flashcard_mnemonics`: Lưu trữ 3 chiều nhận thức (`VisualPrompt`, `RhymePoem`, `ConceptualAnalogy`) kèm phiên bản model AI (`ModelVersion`).
- Đóng vai trò là tầng CSDL Cache bền vững, ngăn ngừa việc gọi lại Gemini API trùng lặp cho cùng một thẻ học.

## Requirements
- **Functional**:
  - Tạo bảng `flashcard_mnemonics` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `card_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE`
    - `visual_prompt TEXT NOT NULL` -- Cảnh tượng tưởng tượng thị giác kỳ dị/hài hước
    - `rhyme_poem TEXT NOT NULL` -- Bài thơ lục bát 2-4 câu hoặc vè vần điệu viết tắt
    - `conceptual_analogy TEXT NOT NULL` -- Câu chuyện ẩn dụ đời thường
    - `model_version VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash'`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Ràng buộc CSDL:
    - `CONSTRAINT uq_flashcard_mnemonic_card UNIQUE (card_id)`
  - Chỉ mục tối ưu hóa:
    - `idx_flashcard_mnemonics_card_id ON (card_id)`
- **Non-functional**:
  - Truy vấn mẹo nhớ từ Cache trong $< 2\text{ms}$.
  - Tự động xóa mẹo nhớ khi thẻ `Flashcard` bị xóa (`ON DELETE CASCADE`).

## Architecture & Domain Model
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Entity**: `SmartLearn.Domain.Entities.FlashcardMnemonic`.

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/FlashcardMnemonic.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/FlashcardMnemonicConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateFlashcardMnemonicsTable.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs` (Đăng ký `DbSet<FlashcardMnemonic> FlashcardMnemonics`)

## Implementation Steps

1. **Tạo Entity `FlashcardMnemonic`**:
   ```csharp
   namespace SmartLearn.Domain.Entities;

   public class FlashcardMnemonic
   {
       public Guid Id { get; set; }
       public Guid CardId { get; set; }
       public string VisualPrompt { get; set; } = string.Empty;
       public string RhymePoem { get; set; } = string.Empty;
       public string ConceptualAnalogy { get; set; } = string.Empty;
       public string ModelVersion { get; set; } = "gemini-1.5-flash";
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation property
       public Flashcard? Card { get; set; }
   }
   ```

2. **Cấu hình Fluent API EF Core (`FlashcardMnemonicConfiguration`)**:
   ```csharp
   namespace SmartLearn.Infrastructure.Data.Configurations;

   public class FlashcardMnemonicConfiguration : IEntityTypeConfiguration<FlashcardMnemonic>
   {
       public void Configure(EntityTypeBuilder<FlashcardMnemonic> builder)
       {
           builder.ToTable("flashcard_mnemonics");
           builder.HasKey(m => m.Id);

           builder.Property(m => m.VisualPrompt).IsRequired().HasColumnType("text");
           builder.Property(m => m.RhymePoem).IsRequired().HasColumnType("text");
           builder.Property(m => m.ConceptualAnalogy).IsRequired().HasColumnType("text");
           builder.Property(m => m.ModelVersion).IsRequired().HasMaxLength(50);

           builder.HasOne(m => m.Card)
                  .WithOne()
                  .HasForeignKey<FlashcardMnemonic>(m => m.CardId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasIndex(m => m.CardId)
                  .IsUnique()
                  .HasDatabaseName("uq_flashcard_mnemonic_card");
       }
   }
   ```

3. **Cập nhật `AppDbContext.cs`**:
   ```csharp
   public DbSet<FlashcardMnemonic> FlashcardMnemonics => Set<FlashcardMnemonic>();
   ```

4. **Sinh & Chạy Migration**:
   - `dotnet ef migrations add CreateFlashcardMnemonicsTable`
   - `dotnet ef database update`

## Success Criteria
- [ ] Migration sinh thành công bảng `flashcard_mnemonics` với ràng buộc `uq_flashcard_mnemonic_card`.
- [ ] Cố tình chèn 2 bản ghi mnemonic cho cùng 1 `card_id` $\to$ CSDL từ chối với Unique Constraint Violation.
- [ ] Xóa thẻ `Flashcard` $\to$ Mẹo nhớ tương ứng tự động bị xóa sạch (`ON DELETE CASCADE`).