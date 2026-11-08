---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [1, 2, 3]
---

# Phase 4: Testing and Verification

<!-- Updated: Validation Session 1 - Bổ sung test kiểm thử Reorder, giới hạn 1-50 concepts và kiểm tra audit log khi Discard -->

## Overview
Xây dựng bộ kiểm thử tự động toàn diện bằng C# (xUnit, FluentAssertions, Moq, `WebApplicationFactory`) bao phủ toàn bộ chức năng kiểm duyệt khái niệm: CRUD, sắp xếp thứ tự hàng loạt (Reorder), giới hạn số lượng (1-50 concepts), Cascade Delete và kiểm thử các lệnh Commit / Discard.

## Requirements
- **Functional**:
  - Unit tests cho `ConceptsService`:
    - Reorder: cập nhật chính xác `OrderIndex` của 10 concepts trong 1 transaction.
    - Giới hạn Max: ném ngoại lệ khi tạo concept thứ 51.
    - Giới hạn Min: ném ngoại lệ khi commit danh sách có 0 concepts.
    - Discard: xóa sạch concepts Draft và cập nhật `Document.Status = Cancelled`.
    - Cascade delete: xóa concept làm giảm số lượng flashcards liên kết.
  - Integration tests với `WebApplicationFactory`:
    - `PUT /concepts/reorder`: Trả về HTTP 200 và kiểm tra thứ tự trong DB.
    - `POST /concepts` (concept thứ 51): Trả về HTTP 400.
    - `POST /concepts/commit` (khi 0 concepts): Trả về HTTP 400.
    - `DELETE /concepts/discard`: Trả về HTTP 200, kiểm tra document trong DB mang trạng thái `Cancelled`.
- **Non-functional**:
  - Code Coverage $\ge 85\%$.
  - Mọi bài test kiểm tra DB thực thi độc lập, không làm ảnh hưởng dữ liệu khác.

## Architecture
- **Framework**: xUnit, FluentAssertions, Moq, `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`).
- **Test Database**: PostgreSQL test container hoặc SQLite in-memory test context.

## Related Code Files
- Create:
  - `tests/SmartLearn.UnitTests/Concepts/ConceptsServiceTests.cs`
  - `tests/SmartLearn.IntegrationTests/Controllers/ConceptsControllerTests.cs`
  - `tests/SmartLearn.IntegrationTests/Controllers/ConceptsReorderTests.cs`

## Implementation Steps
1. **Viết Unit Tests cho `ReorderConceptsAsync`**:
   - Seed 5 concepts có thứ tự 0, 1, 2, 3, 4.
   - Gửi yêu cầu đảo ngược thứ tự thành 4, 3, 2, 1, 0.
   - Assert `OrderIndex` trong DB được đảo ngược chính xác.
2. **Viết Unit Tests cho Boundaries (1 - 50 concepts)**:
   - Test thêm concept thứ 51 $\to$ Bị ném ngoại lệ.
   - Test commit khi có 0 concepts $\to$ Bị ném ngoại lệ.
3. **Viết Integration Tests cho Discard Flow**:
   - Seed 1 Document `Status = Queued`, 3 Concepts Draft.
   - Gọi `DELETE /api/v1/documents/{docId}/concepts/discard`.
   - Assert HTTP 200 OK.
   - Kiểm tra DB: không còn concept nào của document này, và `Document.Status == Cancelled`.
4. **Viết Integration Tests cho Reorder API**:
   - Gửi request `PUT /concepts/reorder` có kèm token.
   - Assert HTTP 200 OK và kiểm tra thứ tự sắp xếp trả về ở API GET tiếp theo.

## Success Criteria
- [ ] Toàn bộ test suite chạy pass 100% qua lệnh `dotnet test`.
- [ ] Code coverage đạt $\ge 85\%$.
- [ ] Toàn bộ các kịch bản giới hạn (1-50 concepts), Reorder và Discard hoạt động ổn định.

## Risk Assessment
- **Nguy cơ**: Dữ liệu seed test bị tồn đọng giữa các test cases.
- **Giải pháp**: Sử dụng transaction rollback hoặc xóa dữ liệu test sau mỗi lần chạy (`IAsyncLifetime`).
