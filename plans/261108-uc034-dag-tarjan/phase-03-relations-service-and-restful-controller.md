---
phase: 3
title: "Relations Service and RESTful Controller"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: Relations Service and RESTful Controller

<!-- Updated: Validation Session 1 - Thêm cảnh báo mềm khi In-Degree > 5 và đồng bộ Commit/Discard với Document -->

## Overview
Xây dựng tầng Application Service (`IConceptRelationsService`) và RESTful Controller `ConceptRelationsController` trong ASP.NET Core (.NET 8): hỗ trợ lấy danh sách quan hệ, thêm cạnh có cơ chế chặn chu trình thời gian thực (trả về HTTP 400 + `cycle_path`), trả về cảnh báo mềm khi một node có $> 5$ tiên quyết, xóa cạnh, chạy tối giản bắc cầu thủ công và API kiểm tra tính toàn vẹn của đồ thị (`validate-dag`).

## Requirements
- **Functional**:
  - `GET /api/v1/documents/{documentId}/relations`: Lấy danh sách các cạnh quan hệ (hỗ trợ lọc `status=DRAFT`).
  - `POST /api/v1/documents/{documentId}/relations`:
    - Thêm cạnh mới $U \to V$ ($U$ = Tiên quyết, $V$ = Mở khóa).
    - Gọi `IGraphAnalysisEngine.WouldCreateCycle`:
      - Nếu tạo chu trình $\to$ Trả về `HTTP 400 Bad Request` kèm mã lỗi `CYCLE_DETECTED`, danh sách node names tạo thành chu trình.
      - Nếu không tạo chu trình:
        - Đếm số lượng bậc vào hiện tại của $V$: nếu $> 5 \to$ Trả về `HTTP 201 Created` kèm trường `warning: "EXCESSIVE_PREREQUISITES"` để UI hiển thị badge/toast cảnh báo.
        - Lưu vào CSDL với `Status = Draft`.
  - `DELETE /api/v1/documents/{documentId}/relations/{id}`: Xóa một cạnh quan hệ.
  - `POST /api/v1/documents/{documentId}/relations/transitive-reduction`: Chạy rút gọn bắc cầu, xóa các cạnh thừa khỏi CSDL và trả về danh sách cạnh đã bị lược bỏ.
  - `GET /api/v1/documents/{documentId}/relations/validate-dag`: Kiểm tra đồ thị hiện tại có phải DAG hợp lệ không và trả về thứ tự học Topological Sort.
- **Non-functional**:
  - Yêu cầu xác thực JWT `[Authorize]`.
  - Kiểm tra quyền sở hữu Document/Deck trước khi thao tác.
  - Phản hồi nhanh $< 50\text{ms}$.

## Architecture
- **Controller & Service Layer**:
  - `ConceptRelationsController` inject `IConceptRelationsService`.
  - `ConceptRelationsService` phối hợp giữa `AppDbContext` (lấy dữ liệu đồ thị) và `IGraphAnalysisEngine` (tính toán giải thuật trong RAM).

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Common/Interfaces/IConceptRelationsService.cs`
  - `src/SmartLearn.Application/Relations/DTOs/ConceptRelationResponseDto.cs`
  - `src/SmartLearn.Application/Relations/DTOs/CreateRelationRequestDto.cs`
  - `src/SmartLearn.Application/Relations/DTOs/CycleErrorResponseDto.cs`
  - `src/SmartLearn.Application/Relations/DTOs/DagValidationResponseDto.cs`
  - `src/SmartLearn.Application/Relations/Validators/CreateRelationValidator.cs`
  - `src/SmartLearn.Infrastructure/Services/ConceptRelationsService.cs`
  - `src/SmartLearn.Api/Controllers/ConceptRelationsController.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký `IConceptRelationsService`)

## Implementation Steps
1. **Viết `CreateRelationValidator`**:
   - Kiểm tra `SourceNodeId != TargetNodeId`.
   - Kiểm tra `RelationType` hợp lệ.
2. **Triển khai `CreateRelationAsync` trong Service**:
   - Truy vấn tập cạnh hiện tại của Document.
   - Gọi `WouldCreateCycle`: nếu true $\to$ throw `CycleDetectedException`.
   - Kiểm tra In-Degree của `TargetNodeId`: nếu sau khi thêm $> 5 \to$ đánh dấu cảnh báo mềm.
   - Insert vào DB với `Status = Draft`.
3. **Triển khai `ValidateDagAsync`**:
   - Lấy toàn bộ nodes và edges.
   - Gọi `_graphEngine.GetTopologicalSort`.
   - Trả về DTO `{ IsValidDag = true, NodesCount, EdgesCount, TopologicalOrder }`.
4. **Xây dựng `ConceptRelationsController`**:
   - Định tuyến route: `[Route("api/v1/documents/{documentId:guid}/relations")]`.
   - Bắt `CycleDetectedException` và trả về `HTTP 400 Bad Request` kèm format `CycleErrorResponseDto`.

## Success Criteria
- [ ] Thêm cạnh hợp lệ $\to$ HTTP 201 Created.
- [ ] Thêm cạnh có In-Degree $> 5 \to$ HTTP 201 kèm trường `warning` cảnh báo.
- [ ] Thêm cạnh gây chu trình $\to$ HTTP 400 kèm mảng `cycle_path` liệt kê đúng thứ tự các đỉnh tạo thành vòng lặp.
- [ ] Gọi `GET /validate-dag` $\to$ HTTP 200 trả về thứ tự học tô-pô chuẩn xác.
- [ ] Gọi `POST /transitive-reduction` $\to$ Xóa thành công các cạnh bắc cầu thừa khỏi CSDL.

## Risk Assessment
- **Nguy cơ**: Hai request thêm cạnh đồng thời tạo thành chu trình chéo (Race Condition).
- **Giải pháp**: Bọc thao tác thêm cạnh trong Database Transaction với Isolation Level `RepeatableRead` hoặc dùng Semaphore lock theo `deckId`.
