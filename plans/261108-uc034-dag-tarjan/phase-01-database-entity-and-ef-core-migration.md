---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

<!-- Updated: Validation Session 1 - Thống nhất quy ước hướng mũi tên Source = Nền tảng, Target = Nâng cao và đồng bộ trạng thái Draft/Active -->

## Overview
Thiết kế thực thể C# `ConceptRelation`, cấu hình Entity Type Configuration trong Entity Framework Core với các ràng buộc bảo vệ đồ thị ở tầng CSDL: quy ước rõ ràng `SourceNodeId` là điều kiện tiên quyết cần học trước của `TargetNodeId`, chặn cạnh tự trỏ (`CHECK (source_node_id <> target_node_id)`), chống trùng lặp cạnh (`UNIQUE`), cấu hình khóa ngoại `ON DELETE CASCADE` ở cả hai đầu và sinh migration PostgreSQL.

## Requirements
- **Functional**:
  - Tạo bảng `concept_relations` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE`
    - `source_node_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE` -- Khái niệm nền tảng (học trước)
    - `target_node_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE` -- Khái niệm nâng cao (học sau)
    - `relation_type VARCHAR(30) NOT NULL DEFAULT 'PREREQUISITE_OF'` (`PREREQUISITE_OF`, `PART_OF`, `RELATED_TO`)
    - `weight DOUBLE PRECISION NOT NULL DEFAULT 1.0` (Độ tin cậy của AI từ 0.0 đến 1.0)
    - `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `ACTIVE`)
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Ràng buộc CSDL:
    - `CONSTRAINT chk_no_self_loop CHECK (source_node_id <> target_node_id)`
    - `CONSTRAINT uq_concept_relation UNIQUE (source_node_id, target_node_id)`
  - Chỉ mục:
    - `idx_concept_relations_source`: `(source_node_id)`
    - `idx_concept_relations_target`: `(target_node_id)`
    - `idx_concept_relations_deck_status`: `(deck_id, status)`
- **Non-functional**:
  - Truy vấn toàn bộ tập cạnh của một document/deck trong $< 1\text{ms}$.
  - Tự động xóa cạnh khi một trong hai đỉnh bị xóa mà không cần code dọn dẹp thủ công.

## Architecture
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Modeling**:
  - Khai báo Entity `ConceptRelation` trong namespace `SmartLearn.Domain.Entities`.
  - Khai báo Enum `RelationType` (`PrerequisiteOf`, `PartOf`, `RelatedTo`).

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/ConceptRelation.cs`
  - `src/SmartLearn.Domain/Enums/RelationType.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/ConceptRelationConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateConceptRelationsTable.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs` (Khai báo `DbSet<ConceptRelation> ConceptRelations`)

## Implementation Steps
1. **Tạo Enum `RelationType`**:
   ```csharp
   public enum RelationType
   {
       PrerequisiteOf,
       PartOf,
       RelatedTo
   }
   ```
2. **Tạo Entity `ConceptRelation`**:
   ```csharp
   public class ConceptRelation
   {
       public Guid Id { get; set; }
       public Guid DeckId { get; set; }
       public Guid SourceNodeId { get; set; } // Khái niệm nền tảng cần học trước
       public Guid TargetNodeId { get; set; } // Khái niệm nâng cao mở khóa sau
       public RelationType RelationType { get; set; } = RelationType.PrerequisiteOf;
       public double Weight { get; set; } = 1.0;
       public ConceptStatus Status { get; set; } = ConceptStatus.Draft;
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
       
       // Navigation properties
       public ConceptNode? SourceNode { get; set; }
       public ConceptNode? TargetNode { get; set; }
   }
   ```
3. **Cấu hình Fluent API EF Core (`ConceptRelationConfiguration`)**:
   - Ánh xạ bảng `concept_relations`.
   - Cấu hình Unique Index: `.HasIndex(r => new { r.SourceNodeId, r.TargetNodeId }).IsUnique()`.
   - Cấu hình Check Constraint: `.ToTable(t => t.HasCheckConstraint("chk_no_self_loop", "\"source_node_id\" <> \"target_node_id\""))`.
   - Khóa ngoại `SourceNode`: `.HasOne(r => r.SourceNode).WithMany().HasForeignKey(r => r.SourceNodeId).OnDelete(DeleteBehavior.Cascade)`.
   - Khóa ngoại `TargetNode`: `.HasOne(r => r.TargetNode).WithMany().HasForeignKey(r => r.TargetNodeId).OnDelete(DeleteBehavior.Cascade)`.
4. **Sinh & Áp dụng Migration**:
   - `dotnet ef migrations add CreateConceptRelationsTable`.
   - `dotnet ef database update`.

## Success Criteria
- [ ] Migration chạy thành công, tạo bảng `concept_relations` kèm Check Constraint và Unique Index.
- [ ] Thêm thử 1 bản ghi có `source_node_id == target_node_id` $\to$ CSDL từ chối ngay với Check Constraint Violation.
- [ ] Xóa 1 concept $\to$ Toàn bộ các cạnh nối liên quan ở bảng `concept_relations` tự động bị xóa theo.

## Risk Assessment
- **Nguy cơ**: Entity Framework Core bị lỗi Multiple Cascade Paths trong SQL Server (nếu đổi DB sau này).
- **Giải pháp**: PostgreSQL hỗ trợ hoàn hảo nhiều đường cascade delete trên cùng 1 bảng; nếu chuyển sang SQL Server thì cấu hình 1 đầu `ClientCascade`.
