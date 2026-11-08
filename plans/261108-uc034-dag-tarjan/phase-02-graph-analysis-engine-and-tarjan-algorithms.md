---
phase: 2
title: "Graph Analysis Engine and Tarjan Algorithms"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Graph Analysis Engine and Tarjan Algorithms

<!-- Updated: Validation Session 1 - Thống nhất quy ước hướng mũi tên Xuôi Dòng và hàm tính In-Degree -->

## Overview
Xây dựng module thuần C# (`GraphAnalysisEngine`) cung cấp bộ giải thuật đồ thị hoàn chỉnh: thuật toán Tarjan tìm thành phần liên thông mạnh (SCC) để phát hiện chu trình, kiểm tra tính tiếp cận (Reachability Check) để chặn chu trình thời gian thực, Heuristic cắt cạnh tự động cho AI Ingestion, thuật toán Transitive Reduction làm gọn đồ thị, đếm bậc vào (In-Degree) và Topological Sort sinh thứ tự học.

## Requirements
- **Functional**:
  - `FindCyclesTarjan(nodes, edges)`: Triển khai giải thuật Tarjan phát hiện tất cả các SCC có chu trình trong thời gian $O(V + E)$.
  - `WouldCreateCycle(sourceId, targetId, edges, out cyclePath)`:
    - Quy ước: $source \to target$ (Source là tiên quyết, Target là nâng cao).
    - Kiểm tra xem từ `targetId` đã có đường đi tới `sourceId` hay chưa.
    - Nếu có, trả về danh sách GUID các đỉnh tạo thành vòng lặp `[source, target, ..., source]`.
  - `GetNodeInDegree(nodeId, edges)`: Đếm số lượng điều kiện tiên quyết trực tiếp của một đỉnh để hỗ trợ cảnh báo mềm khi $> 5$.
  - `PruneCycles(nodes, edges)`: Tự động khử chu trình theo Heuristic 2 tầng:
    1. Cắt cạnh đi ngược trang sách (`source.SourcePage > target.SourcePage`).
    2. Cắt cạnh có độ tin cậy (`weight`) thấp nhất.
  - `ApplyTransitiveReduction(nodes, edges)`: Cắt bỏ các cạnh bắc cầu thừa (nếu $A \to B \to C$ thì loại bỏ $A \to C$).
  - `GetTopologicalSort(nodes, edges)`: Trả về danh sách nodes sắp xếp theo thứ tự tô-pô từ nền tảng đến nâng cao; ném ngoại lệ nếu đồ thị chứa chu trình.
- **Non-functional**:
  - Thời gian xử lý cho đồ thị 50 nodes và 80 edges phải $< 1\text{ms}$.
  - Zero-allocation patterns, chạy 100% trong RAM.

## Architecture
- **Engine Độc Lập**:
  - `IGraphAnalysisEngine` và `GraphAnalysisEngine` nằm trong tầng `SmartLearn.Domain` hoặc `SmartLearn.Application.Common`.
  - Hoạt động trên cấu trúc đồ thị danh sách kề (`Dictionary<Guid, List<GraphEdge>>`).

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Common/Interfaces/IGraphAnalysisEngine.cs`
  - `src/SmartLearn.Application/Common/Models/GraphEdge.cs`
  - `src/SmartLearn.Application/Common/Models/GraphNode.cs`
  - `src/SmartLearn.Application/Common/Models/CycleDetectionResult.cs`
  - `src/SmartLearn.Infrastructure/Graph/GraphAnalysisEngine.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký `IGraphAnalysisEngine` singleton)

## Implementation Steps
1. **Triển khai Thuật toán Tarjan (SCC)**:
   - Gán `Index` và `LowLink` cho từng đỉnh.
   - Duyệt qua `StrongConnect` đẩy vào `Stack`.
   - Trả về danh sách SCCs có kích thước $\ge 2$.
2. **Triển khai Reachability Check (Chặn chu trình khi thêm cạnh $u \to v$)**:
   - Chạy BFS từ $v$ tìm đường đến $u$.
   - Sử dụng `Dictionary<Guid, Guid> parentMap` để truy vết đường đi chu trình `cyclePath: [u, v, ..., u]`.
3. **Triển khai Heuristic Cắt Cạnh (PruneCycles)**:
   - Với mỗi chu trình từ Tarjan:
     - Ưu tiên cắt cạnh có `source.SourcePage > target.SourcePage` (độ lệch trang lớn nhất).
     - Nếu không có cạnh ngược trang $\to$ cắt cạnh có `weight` nhỏ nhất.
   - Lặp lại cho đến khi không còn chu trình.
4. **Triển khai Transitive Reduction**:
   - Với mỗi cạnh $u \to v$:
     - Bỏ qua cạnh trực tiếp $u \to v$.
     - Chạy BFS từ $u$, nếu vẫn tới được $v$ thông qua đỉnh trung gian $\to$ Cạnh $u \to v$ là cạnh thừa $\to$ Đánh dấu loại bỏ.
5. **Triển khai Topological Sort (Kahn's Algorithm)**:
   - Dùng mảng `in_degree` (bậc vào) và hàng đợi `Queue<Guid>`.
   - Lần lượt lấy các đỉnh có `in_degree == 0` cho vào kết quả.

## Success Criteria
- [ ] Chạy Tarjan trên đồ thị mẫu có chu trình $\to$ Phát hiện đúng 100% các đỉnh thuộc chu trình trong $< 0.2\text{ms}$.
- [ ] `WouldCreateCycle` trả về `true` kèm mảng đường đi chính xác khi kiểm tra cạnh ngược.
- [ ] `PruneCycles` loại bỏ đúng cạnh ngược trang và cạnh yếu nhất, biến đồ thị có chu trình thành DAG thuần khiết.
- [ ] `ApplyTransitiveReduction` loại bỏ đúng cạnh bắc cầu $A \to C$ khi đã có $A \to B \to C$.

## Risk Assessment
- **Nguy cơ**: Đồ thị có chu trình tự trỏ $A \to A$.
- **Giải pháp**: Kiểm tra $source == target$ ngay từ đầu hàm và loại bỏ trước khi chạy BFS.
