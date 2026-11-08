---
phase: 3
title: "Concepts API Controller and Authorization"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: Concepts API Controller and Authorization

<!-- Updated: Validation Session 1 - Thêm Endpoint PUT /concepts/reorder và kiểm soát lỗi nghiệp vụ giới hạn -->

## Overview
Xây dựng RESTful Controller `ConceptsController` trong ASP.NET Core (.NET 8), phân quyền bằng JWT Bearer Token, kiểm tra tính hợp lệ của DTO (FluentValidation), bổ sung route Reorder thứ tự khái niệm và ánh xạ các mã lỗi HTTP chuẩn mực.

## Requirements
- **Functional**:
  - `GET /api/v1/documents/{documentId}/concepts`: Trả về danh sách concepts (lọc theo query `status=DRAFT`, sắp xếp theo `order_index`).
  - `POST /api/v1/documents/{documentId}/concepts`: Thêm concept thủ công (giới hạn tối đa 50).
  - `PUT /api/v1/documents/{documentId}/concepts/reorder`: Cập nhật thứ tự hàng loạt khi kéo thả trên UI.
  - `PUT /api/v1/documents/{documentId}/concepts/{conceptId}`: Chỉnh sửa concept.
  - `GET /api/v1/documents/{documentId}/concepts/{conceptId}/delete-impact`: Xem trước tác động khi xóa.
  - `DELETE /api/v1/documents/{documentId}/concepts/{conceptId}`: Xóa concept.
  - `POST /api/v1/documents/{documentId}/concepts/commit`: Xác nhận nạp vào Cây tri thức (`Draft` $\to$ `Active`, yêu cầu tối thiểu 1 concept).
  - `DELETE /api/v1/documents/{documentId}/concepts/discard`: Hủy bỏ các khái niệm Draft, chuyển Document sang `Cancelled`.
- **Non-functional**:
  - Yêu cầu xác thực `[Authorize]` trên toàn bộ Controller.
  - Trả về mã lỗi chuẩn RESTful:
    - `400 Bad Request`: Dữ liệu không hợp lệ, vượt quá 50 concepts, hoặc commit khi có 0 concepts.
    - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
    - `403 Forbidden`: Truy cập tài liệu không thuộc quyền sở hữu của mình.
    - `404 Not Found`: Không tìm thấy `documentId` hoặc `conceptId`.

## Architecture
- **ASP.NET Core Controller**:
  - `[Authorize]`, `[ApiController]`, `[Route("api/v1/documents/{documentId:guid}/concepts")]`.
  - Trích xuất `userId` từ `User.FindFirst(ClaimTypes.NameIdentifier)`.
- **Validation**:
  - FluentValidation cho `ReorderConceptsDto`: Mảng items không rỗng, mỗi item có `ConceptId` hợp lệ và `OrderIndex >= 0`.

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/ConceptsController.cs`
  - `src/SmartLearn.Application/Concepts/DTOs/ReorderConceptsRequestDto.cs`
  - `src/SmartLearn.Application/Concepts/Validators/ReorderConceptsValidator.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký FluentValidation)

## Implementation Steps
1. **Viết `ReorderConceptsValidator`**:
   ```csharp
   public class ReorderConceptsValidator : AbstractValidator<ReorderConceptsRequestDto>
   {
       public ReorderConceptsValidator()
       {
           RuleFor(x => x.Items).NotEmpty().WithMessage("Danh sách sắp xếp không được để trống.");
           RuleForEach(x => x.Items).ChildRules(item =>
           {
               item.RuleFor(i => i.ConceptId).NotEmpty();
               item.RuleFor(i => i.OrderIndex).GreaterThanOrEqualTo(0);
           });
       }
   }
   ```
2. **Khai báo Action Reorder trong `ConceptsController`**:
   ```csharp
   [HttpPut("reorder")]
   public async Task<IActionResult> ReorderConcepts(
       [FromRoute] Guid documentId,
       [FromBody] ReorderConceptsRequestDto dto,
       CancellationToken ct)
   {
       var userId = GetCurrentUserId();
       await _conceptsService.ReorderConceptsAsync(documentId, userId, dto.Items, ct);
       return Ok(new { success = true, message = "Cập nhật thứ tự các khái niệm thành công." });
   }
   ```
3. **Triển khai Action Commit & Discard**:
   - `[HttpPost("commit")]`: Bắt ngoại lệ nếu $< 1$ concept $\to$ trả về HTTP 400.
   - `[HttpDelete("discard")]`: Thực hiện dọn dẹp và cập nhật trạng thái `Cancelled`.

## Success Criteria
- [ ] Gửi PUT `reorder` với danh sách thứ tự mới $\to$ Nhận về HTTP 200, kiểm tra DB thứ tự được cập nhật đúng.
- [ ] Thêm concept thứ 51 $\to$ Nhận về HTTP 400 "Số lượng khái niệm tối đa cho một tài liệu là 50".
- [ ] Xóa sạch concepts rồi bấm Commit $\to$ Nhận về HTTP 400 "Bộ thẻ cần có ít nhất 1 khái niệm để hoàn tất".
- [ ] Bấm Discard $\to$ Nhận về HTTP 200, Document chuyển sang `Cancelled`.

## Risk Assessment
- **Nguy cơ**: Kéo thả trên UI gửi liên tục các request reorder gây nghẽn network.
- **Giải pháp**: Frontend debounce thao tác kéo thả (chỉ gửi request khi người dùng thả chuột kết thúc chuỗi kéo thả).
