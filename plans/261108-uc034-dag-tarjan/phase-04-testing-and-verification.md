---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [1, 2, 3]
---

# Phase 4: Testing and Verification

<!-- Updated: Validation Session 1 - Bổ sung test kiểm thử cảnh báo In-Degree > 5 và kiểm thử đồng bộ trạng thái Active khi Commit -->

## Overview
Xây dựng bộ kiểm thử tự động toàn diện bằng C# (xUnit, FluentAssertions, Moq, `WebApplicationFactory`) bao phủ toàn bộ các thuật toán đồ thị của `GraphAnalysisEngine` (Tarjan SCC, Reachability, Cycle Pruning, Transitive Reduction, Topological Sort) và kiểm thử tích hợp End-to-End API phát hiện/chặn chu trình, cảnh báo mềm bậc vào và các ràng buộc CSDL.

## Requirements
- **Functional**:
  - Unit tests cho `GraphAnalysisEngine`:
    - Đồ thị DAG chuẩn $\to$ Tarjan trả về 0 SCCs.
    - Đồ thị có chu trình đơn $A \to B \to A \to$ Phát hiện đúng 1 SCC gồm $\{A, B\}$.
    - Đồ thị có chu trình phức $A \to B \to C \to D \to B \to$ Phát hiện đúng SCC $\{B, C, D\}$.
    - `WouldCreateCycle` trả về `true` và đúng `cyclePath` khi kiểm tra cạnh đóng vòng lặp.
    - `PruneCycles` cắt đúng cạnh ngược trang sách trước; nếu cùng chiều thì cắt đúng cạnh có trọng số nhỏ nhất.
    - `ApplyTransitiveReduction` loại bỏ đúng cạnh $A \to C$ khi đã có $A \to B$ và $B \to C$.
    - `GetTopologicalSort` trả về thứ tự topo hợp lệ trên DAG.
  - Integration tests với `WebApplicationFactory`:
    - Thêm cạnh hợp lệ $\to$ HTTP 201 Created.
    - Thêm cạnh thứ 6 trỏ vào cùng 1 node $\to$ HTTP 201 Created kèm trường `warning: "EXCESSIVE_PREREQUISITES"`.
    - Thêm cạnh gây chu trình $\to$ HTTP 400 Bad Request kèm mã lỗi `CYCLE_DETECTED` và `cycle_path`.
    - Thêm cạnh tự trỏ $A \to A \to$ Bị chặn ngay từ tầng validator.
    - Gọi API `/validate-dag` $\to$ Trả về `IsValidDag = true`.
- **Non-functional**:
  - Code Coverage $\ge 85\%$.
  - Tốc độ chạy test unit cho giải thuật đồ thị $< 10\text{ms}$ cho 20 kịch bản test.

## Architecture
- **Framework**: xUnit, FluentAssertions, `WebApplicationFactory`.
- **Test Fixtures**: Chuẩn bị các cấu trúc đồ thị toán học mẫu: DAG đường thẳng, DAG hình kim cương (Diamond), đồ thị chu trình đơn, đồ thị chu trình lồng nhau, đồ thị có cạnh ngược trang.

## Related Code Files
- Create:
  - `tests/SmartLearn.UnitTests/Graph/GraphAnalysisEngineTarjanTests.cs`
  - `tests/SmartLearn.UnitTests/Graph/GraphAnalysisEnginePruningTests.cs`
  - `tests/SmartLearn.UnitTests/Graph/GraphAnalysisEngineTransitiveReductionTests.cs`
  - `tests/SmartLearn.IntegrationTests/Controllers/ConceptRelationsControllerTests.cs`

## Implementation Steps
1. **Viết Unit Tests cho Tarjan & Reachability Check**:
   - Khởi tạo các đồ thị mẫu bằng code.
   - Assert `FindStronglyConnectedComponents` trả về đúng danh sách đỉnh chu trình.
   - Assert `WouldCreateCycle` truy vết chính xác chuỗi `cyclePath`.
2. **Viết Unit Tests cho Heuristic Cắt Cạnh (Pruning)**:
   - Tạo chu trình gồm:
     - Cạnh $A \to B$ (Trang 5 $\to$ Trang 10, weight 0.9).
     - Cạnh $B \to C$ (Trang 10 $\to$ Trang 15, weight 0.8).
     - Cạnh $C \to A$ (Trang 15 $\to$ Trang 5 - ngược trang, weight 0.95).
   - Assert: Cạnh $C \to A$ bị cắt vì đi ngược trang sách, dù nó có weight cao nhất!
3. **Viết Unit Tests cho Transitive Reduction**:
   - Tạo tam giác $A \to B, B \to C, A \to C$.
   - Assert: Cạnh $A \to C$ bị loại bỏ, chỉ còn lại $A \to B$ và $B \to C$.
4. **Viết Integration Tests cho Controller API**:
   - Seed dữ liệu 3 concepts $A, B, C$.
   - Thêm cạnh $A \to B$ (HTTP 201).
   - Thêm cạnh $B \to C$ (HTTP 201).
   - Thêm cạnh $C \to A$ $\to$ Assert HTTP 400, kiểm tra JSON body có `error_code == "CYCLE_DETECTED"`.
   - Thêm 6 cạnh trỏ vào cùng 1 node $\to$ Assert HTTP 201 có chứa `warning`.

## Success Criteria
- [ ] Toàn bộ test suite chạy pass 100% qua lệnh `dotnet test`.
- [ ] Code coverage đạt $\ge 85\%$.
- [ ] Thuật toán Tarjan và Heuristic cắt cạnh xử lý chính xác 100% các cấu trúc đồ thị phức tạp.

## Risk Assessment
- **Nguy cơ**: Test đồ thị lớn bị treo nếu thuật toán bị lỗi đệ quy.
- **Giải pháp**: Mọi hàm test đều gắn timeout tối đa 2 giây (`[Fact(Timeout = 2000)]`).
