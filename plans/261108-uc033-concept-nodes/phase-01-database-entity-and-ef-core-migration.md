---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

<!-- Updated: Validation Session 1 - Cập nhật ràng buộc order_index và index cho reordering -->

## Overview
Thiết kế thực thể C# `ConceptNode`, định nghĩa các Enums phân loại (`DifficultyLevel`, `ConceptStatus`), cấu hình Entity Type Configuration trong Entity Framework Core với khóa ngoại `ON DELETE CASCADE` và sinh migration PostgreSQL.

## Requirements
- **Functional**:
  - Tạo bảng `concepts` trong CSDL PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE`
    - `document_id UUID REFERENCES documents(id) ON DELETE SET NULL`
    - `name VARCHAR(255) NOT NULL`
    - `summary TEXT NOT NULL`
    - `difficulty_level VARCHAR(20) NOT NULL DEFAULT 'BASIC'` (`BASIC`, `INTERMEDIATE`, `ADVANCED`)
    - `source_page INT NOT NULL DEFAULT 1`
    - `source_excerpt TEXT` -- Trích dẫn gốc 1-2 câu trong tài liệu
    - `order_index INT NOT NULL DEFAULT 0`
    - `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `ACTIVE`)
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Tạo chỉ mục:
    - `idx_concepts_document_status`: `(document_id, status)`
    - `idx_concepts_deck_status`: `(deck_id, status)`
    - `idx_concepts_order_index`: `(document_id, order_index)` -- Hỗ trợ sắp xếp thứ tự và reorder
- **Non-functional**:
  - Truy vấn danh sách concepts có sắp xếp theo `order_index` phản hồi dưới $2\text{ms}$.
  - Ràng buộc khóa ngoại Cascade đảm bảo toàn vẹn dữ liệu ở tầng CSDL.

## Architecture
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Modeling**:
  - Khai báo Entity `ConceptNode` trong namespace `SmartLearn.Domain.Entities`.
  - Khai báo Enums `DifficultyLevel` (`Basic`, `Intermediate`, `Advanced`) và `ConceptStatus` (`Draft`, `Active`).

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/ConceptNode.cs`
  - `src/SmartLearn.Domain/Enums/DifficultyLevel.cs`
  - `src/SmartLearn.Domain/Enums/ConceptStatus.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/ConceptNodeConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateConceptsTable.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs` (Khai báo `DbSet<ConceptNode> Concepts`)

## Implementation Steps
1. **Tạo Enums Domain**:
   ```csharp
   public enum DifficultyLevel { Basic, Intermediate, Advanced }
   public enum ConceptStatus { Draft, Active }
   ```
2. **Tạo Entity `ConceptNode`**:
   ```csharp
   public class ConceptNode
   {
       public Guid Id { get; set; }
       public Guid DeckId { get; set; }
       public Guid? DocumentId { get; set; }
       public string Name { get; set; } = string.Empty;
       public string Summary { get; set; } = string.Empty;
       public DifficultyLevel DifficultyLevel { get; set; } = DifficultyLevel.Basic;
       public int SourcePage { get; set; } = 1;
       public string? SourceExcerpt { get; set; }
       public int OrderIndex { get; set; }
       public ConceptStatus Status { get; set; } = ConceptStatus.Draft;
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
   }
   ```
3. **Cấu hình Fluent API EF Core (`ConceptNodeConfiguration`)**:
   - Ánh xạ bảng `concepts`.
   - Chuyển đổi Enum sang String `.HasConversion<string>()`.
   - Cấu hình khóa ngoại: `HasOne<Deck>().WithMany().HasForeignKey(c => c.DeckId).OnDelete(DeleteBehavior.Cascade)`.
   - Cấu hình khóa ngoại: `HasOne<Document>().WithMany().HasForeignKey(c => c.DocumentId).OnDelete(DeleteBehavior.SetNull)`.
   - Cấu hình Indexes: `HasIndex(c => new { c.DocumentId, c.Status })`, `HasIndex(c => new { c.DocumentId, c.OrderIndex })`.
4. **Sinh & Áp dụng Migration**:
   - `dotnet ef migrations add CreateConceptsTable`.
   - `dotnet ef database update`.

## Success Criteria
- [ ] Migration chạy thành công, tạo bảng `concepts` trên PostgreSQL kèm các index và foreign keys.
- [ ] Thêm thử 1 bản ghi `ConceptNode` với `Status = Draft` và đọc lại kiểm tra enum string conversion hoạt động chính xác.

## Risk Assessment
- **Nguy cơ**: Tên khái niệm quá dài vượt quá 255 ký tự do AI trích xuất cả câu dài.
- **Giải pháp**: Giới hạn tối đa 255 ký tự, nếu AI sinh dài hơn sẽ tự động cắt ngắn hoặc ném validation error.
