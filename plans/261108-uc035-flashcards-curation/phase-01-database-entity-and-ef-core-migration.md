---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

## Overview
Thiết kế các thực thể C# `Flashcard` và `UserCardState` (lưu trữ thông số FSRS v4.5), cấu hình Fluent API trong Entity Framework Core với các ràng buộc quan hệ, chỉ mục tối ưu hóa truy vấn và sinh migration PostgreSQL:
- Bảng `flashcards`: Lưu trữ nội dung thẻ học, hỗ trợ 3 loại thẻ nhận thức (`Standard`, `Cloze`, `MultipleChoice`), bảo toàn Markdown/LaTeX, gắn kết với `ConceptNode` và `Deck`, hỗ trợ trạng thái vòng đời (`Draft`, `Active`, `Discarded`).
- Bảng `user_card_states`: Lưu trữ trạng thái thuật toán lặp lại ngắt quãng FSRS v4.5 (`Stability`, `Difficulty`, `State`, `Reps`, `Lapses`, `DueDate`), chuẩn bị sẵn sàng cho Thành viên 3 khởi chạy phiên học hôm nay.

## Requirements
- **Functional**:
  - Tạo bảng `flashcards` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE`
    - `concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE`
    - `front TEXT NOT NULL` -- Nội dung câu hỏi (hỗ trợ Markdown & LaTeX)
    - `back TEXT NOT NULL` -- Nội dung đáp án (hỗ trợ Markdown & LaTeX)
    - `card_type VARCHAR(30) NOT NULL DEFAULT 'STANDARD'` (`STANDARD`, `CLOZE`, `MULTIPLE_CHOICE`)
    - `source_page INT NOT NULL DEFAULT 1`
    - `source_excerpt TEXT` -- Đoạn trích dẫn gốc trong PDF phục vụ đối chiếu UC-03.6
    - `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `ACTIVE`, `DISCARDED`)
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Tạo bảng `user_card_states` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `card_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE`
    - `state VARCHAR(20) NOT NULL DEFAULT 'NEW'` (`NEW`, `LEARNING`, `REVIEW`, `RELEARNING`)
    - `stability DOUBLE PRECISION NOT NULL DEFAULT 0.0` -- Độ ổn định S trong FSRS
    - `difficulty DOUBLE PRECISION NOT NULL DEFAULT 0.0` -- Độ khó D trong FSRS (1.0 -> 10.0)
    - `reps INT NOT NULL DEFAULT 0` -- Số lần đã ôn tập
    - `lapses INT NOT NULL DEFAULT 0` -- Số lần quên (bấm Again)
    - `due_date TIMESTAMPTZ NOT NULL DEFAULT NOW()` -- Ngày đến hạn ôn tập kế tiếp
    - `last_review TIMESTAMPTZ` -- Lần cuối ôn tập (null nếu chưa ôn)
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Ràng buộc CSDL:
    - `CONSTRAINT uq_user_card_state UNIQUE (user_id, card_id)`
  - Chỉ mục tối ưu hóa:
    - `idx_flashcards_concept_status`: `(concept_id, status)`
    - `idx_flashcards_deck_status`: `(deck_id, status)`
    - `idx_user_card_states_due`: `(user_id, due_date, state)`
- **Non-functional**:
  - Tự động xóa thẻ khi `Deck` hoặc `ConceptNode` bị xóa (`ON DELETE CASCADE`).
  - Hỗ trợ lưu trữ chuỗi dài (không giới hạn độ dài `TEXT`) để bảo toàn định dạng Markdown, công thức toán LaTeX và mã nguồn phong phú.

## Architecture
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Modeling**:
  - `SmartLearn.Domain.Entities.Flashcard`
  - `SmartLearn.Domain.Entities.UserCardState`
  - Enums:
    - `CardType` (`Standard`, `Cloze`, `MultipleChoice`)
    - `FlashcardStatus` (`Draft`, `Active`, `Discarded`)
    - `FSRSCardState` (`New`, `Learning`, `Review`, `Relearning`)

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/Flashcard.cs`
  - `src/SmartLearn.Domain/Entities/UserCardState.cs`
  - `src/SmartLearn.Domain/Enums/CardType.cs`
  - `src/SmartLearn.Domain/Enums/FlashcardStatus.cs`
  - `src/SmartLearn.Domain/Enums/FSRSCardState.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/FlashcardConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/UserCardStateConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateFlashcardsAndUserCardStatesTables.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs` (Đăng ký `DbSet<Flashcard>` và `DbSet<UserCardState>`)

## Implementation Steps

1. **Tạo các Enums**:
   ```csharp
   namespace SmartLearn.Domain.Enums;

   public enum CardType
   {
       Standard,        // Q&A truyền thống
       Cloze,           // Điền khuyết {{c1::từ khóa}}
       MultipleChoice   // Trắc nghiệm lựa chọn
   }

   public enum FlashcardStatus
   {
       Draft,           // AI sinh ban đầu, chờ học viên duyệt
       Active,          // Học viên đã tick chọn và nạp vào Deck
       Discarded        // Học viên bỏ tick chọn, giữ lại làm Negative Feedback dataset
   }

   public enum FSRSCardState
   {
       New = 0,         // Thẻ mới chưa học
       Learning = 1,    // Đang trong giai đoạn làm quen bước đầu
       Review = 2,      // Đã vào vòng lặp ôn tập FSRS
       Relearning = 3   // Bị quên, đang học lại
   }
   ```

2. **Tạo Entity `Flashcard`**:
   ```csharp
   namespace SmartLearn.Domain.Entities;

   public class Flashcard
   {
       public Guid Id { get; set; }
       public Guid DeckId { get; set; }
       public Guid ConceptId { get; set; }
       public string Front { get; set; } = string.Empty;
       public string Back { get; set; } = string.Empty;
       public CardType CardType { get; set; } = CardType.Standard;
       public int SourcePage { get; set; } = 1;
       public string? SourceExcerpt { get; set; }
       public FlashcardStatus Status { get; set; } = FlashcardStatus.Draft;
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation properties
       public Deck? Deck { get; set; }
       public ConceptNode? Concept { get; set; }
       public ICollection<UserCardState> UserCardStates { get; set; } = new List<UserCardState>();
   }
   ```

3. **Tạo Entity `UserCardState`**:
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
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation properties
       public User? User { get; set; }
       public Flashcard? Card { get; set; }
   }
   ```

4. **Cấu hình Fluent API EF Core**:
   ```csharp
   namespace SmartLearn.Infrastructure.Data.Configurations;

   public class FlashcardConfiguration : IEntityTypeConfiguration<Flashcard>
   {
       public void Configure(EntityTypeBuilder<Flashcard> builder)
       {
           builder.ToTable("flashcards");
           builder.HasKey(f => f.Id);
           builder.Property(f => f.Front).IsRequired().HasColumnType("text");
           builder.Property(f => f.Back).IsRequired().HasColumnType("text");
           builder.Property(f => f.CardType).HasConversion<string>().HasMaxLength(30);
           builder.Property(f => f.Status).HasConversion<string>().HasMaxLength(20);

           builder.HasOne(f => f.Deck)
                  .WithMany()
                  .HasForeignKey(f => f.DeckId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasOne(f => f.Concept)
                  .WithMany()
                  .HasForeignKey(f => f.ConceptId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasIndex(f => new { f.ConceptId, f.Status })
                  .HasDatabaseName("idx_flashcards_concept_status");

           builder.HasIndex(f => new { f.DeckId, f.Status })
                  .HasDatabaseName("idx_flashcards_deck_status");
       }
   }

   public class UserCardStateConfiguration : IEntityTypeConfiguration<UserCardState>
   {
       public void Configure(EntityTypeBuilder<UserCardState> builder)
       {
           builder.ToTable("user_card_states");
           builder.HasKey(s => s.Id);
           builder.Property(s => s.State).HasConversion<string>().HasMaxLength(20);

           builder.HasOne(s => s.Card)
                  .WithMany(f => f.UserCardStates)
                  .HasForeignKey(s => s.CardId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasIndex(s => new { s.UserId, s.CardId })
                  .IsUnique()
                  .HasDatabaseName("uq_user_card_state");

           builder.HasIndex(s => new { s.UserId, s.DueDate, s.State })
                  .HasDatabaseName("idx_user_card_states_due");
       }
   }
   ```

5. **Sinh Migration và Cập nhật Database**:
   - `dotnet ef migrations add CreateFlashcardsAndUserCardStatesTables`
   - `dotnet ef database update`

## Success Criteria
- [ ] Migration sinh thành công 2 bảng `flashcards` và `user_card_states`.
- [ ] Ràng buộc `uq_user_card_state` ngăn chặn tạo 2 trạng thái FSRS trùng lặp cho cùng 1 cặp (User, Card).
- [ ] Xóa `Deck` hoặc `ConceptNode` $\to$ CSDL tự động cascade delete các thẻ flashcards và bản ghi `user_card_states` tương ứng.

## Risk Assessment
- **Nguy cơ**: Chuỗi công thức toán LaTeX (chứa nhiều `\`, `{`, `}`) bị escape sai khi lưu trữ hoặc chuyển đổi enum.
- **Giải pháp**: Sử dụng cột kiểu `text` thuần túy trong PostgreSQL, không parse/thay đổi ký tự khi lưu vào database.