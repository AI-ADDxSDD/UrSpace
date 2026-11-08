---
phase: 2
title: "Concepts CRUD and Impact Service"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Concepts CRUD and Impact Service

<!-- Updated: Validation Session 1 - Thêm Reorder concepts, kiểm tra giới hạn 1-50 concepts và cập nhật trạng thái Cancelled khi Discard -->

## Overview
Xây dựng tầng Application Service (`IConceptsService` và `ConceptsService`) xử lý toàn bộ logic nghiệp vụ kiểm duyệt khái niệm: truy vấn danh sách Staging, thêm mới thủ công, đổi thứ tự hàng loạt (Reorder), chỉnh sửa nội dung/độ khó, tính toán xem trước tác động khi xóa (`delete-impact`), xóa an toàn và thao tác hàng loạt Commit/Discard kèm giới hạn số lượng.

## Requirements
- **Functional**:
  - `GetDraftConceptsAsync(Guid documentId, Guid userId)`: Truy vấn danh sách concepts có `Status == Draft` sắp xếp theo `OrderIndex`.
  - `CreateManualConceptAsync(Guid documentId, Guid userId, CreateConceptDto dto)`: Thêm một concept mới (chặn nếu tổng concepts $\ge 50$).
  - `ReorderConceptsAsync(Guid documentId, Guid userId, List<ConceptOrderItemDto> items)`: Cập nhật lại `OrderIndex` của toàn bộ concepts trong 1 transaction khi học viên kéo thả trên UI.
  - `UpdateConceptAsync(Guid conceptId, Guid userId, UpdateConceptDto dto)`: Cập nhật tên, tóm tắt, `DifficultyLevel`, `SourcePage`.
  - `GetDeleteImpactAsync(Guid conceptId, Guid userId)`: Đếm số lượng flashcards liên kết và số cạnh DAG (in/out) để trả về cho popup cảnh báo UI.
  - `DeleteConceptAsync(Guid conceptId, Guid userId)`: Xóa concept khỏi CSDL (PostgreSQL tự động cascade delete flashcards và edges).
  - `CommitConceptsAsync(Guid documentId, Guid userId)`:
    - Kiểm tra số lượng concepts: Nếu $< 1$, ném ngoại lệ `InvalidOperationException` (chặn commit bộ thẻ rỗng).
    - Cập nhật toàn bộ concepts của document từ `Draft` $\to$ `Active`.
  - `DiscardConceptsAsync(Guid documentId, Guid userId)`:
    - Xóa sạch toàn bộ các concepts đang ở trạng thái `Draft` của document đó.
    - Cập nhật `Document.Status = DocumentStatus.Cancelled` để lưu audit log.
- **Non-functional**:
  - Kiểm tra quyền sở hữu (Ownership Validation): Đảm bảo người dùng chỉ được thao tác với tài liệu/deck của chính mình.
  - Thao tác Commit, Discard hoặc Reorder thực thi trong 1 Database Transaction nguyên tử ($< 15\text{ms}$).

## Architecture
- **Mô hình CQRS / Service Pattern**:
  - `IConceptsService` định nghĩa hợp đồng nghiệp vụ.
  - `ConceptsService` inject `AppDbContext` thực thi các truy vấn LINQ tối ưu với `AsNoTracking()` cho các thao tác đọc.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Common/Interfaces/IConceptsService.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/ConceptResponseDto.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/CreateConceptDto.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/UpdateConceptDto.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/ConceptOrderItemDto.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/DeleteImpactResponseDto.cs`
  - `src/SmartLearn.Infrastructure/Services/ConceptsService.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký `IConceptsService`)

## Implementation Steps
1. **Triển khai `ReorderConceptsAsync`**:
   ```csharp
   public async Task ReorderConceptsAsync(Guid documentId, Guid userId, List<ConceptOrderItemDto> items, CancellationToken ct)
   {
       await ValidateOwnershipAsync(documentId, userId, ct);
       var conceptIds = items.Select(i => i.ConceptId).ToList();
       var concepts = await _dbContext.Concepts
           .Where(c => c.DocumentId == documentId && conceptIds.Contains(c.Id))
           .ToListAsync(ct);

       foreach (var concept in concepts)
       {
           var orderItem = items.First(i => i.ConceptId == concept.Id);
           concept.OrderIndex = orderItem.OrderIndex;
           concept.UpdatedAt = DateTimeOffset.UtcNow;
       }
       await _dbContext.SaveChangesAsync(ct);
   }
   ```
2. **Triển khai Ràng buộc Giới hạn trong `CreateManualConceptAsync`**:
   - Kiểm tra `int count = await _dbContext.Concepts.CountAsync(c => c.DocumentId == documentId && c.Status == ConceptStatus.Draft)`.
   - Nếu `count >= 50` $\to$ Ném `InvalidOperationException("Số lượng khái niệm tối đa cho một tài liệu là 50.")`.
3. **Triển khai `CommitConceptsAsync` có Chốt chặn Rỗng**:
   - Kiểm tra số lượng: nếu $= 0 \to$ Ném `InvalidOperationException("Bộ thẻ cần có ít nhất 1 khái niệm để hoàn tất.")`.
   - Cập nhật `Status = Active`.
4. **Triển khai `DiscardConceptsAsync`**:
   - Xóa sạch các concepts có `DocumentId == documentId && Status == Draft`.
   - Tìm `Document` và gán `document.Status = DocumentStatus.Cancelled`.
   - `await _dbContext.SaveChangesAsync()`.

## Success Criteria
- [ ] API Reorder cập nhật chính xác thứ tự của toàn bộ concepts chỉ trong 1 request.
- [ ] Tạo concept thứ 51 bị chặn với thông báo lỗi rõ ràng.
- [ ] Commit khi có 0 concepts bị chặn với HTTP 400.
- [ ] Discard dọn sạch concepts Draft và cập nhật `Document.Status = Cancelled`.

## Risk Assessment
- **Nguy cơ**: Reorder gửi lên các `conceptId` không thuộc cùng 1 `documentId`.
- **Giải pháp**: Validate chặt chẽ: `concept.DocumentId == documentId`, bỏ qua các ID ngoại lai.
