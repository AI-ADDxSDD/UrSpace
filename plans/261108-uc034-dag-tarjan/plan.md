---
title: "UC-03.4 Edit Prerequisite Edges and Tarjan Cycle Breaking"
description: "Kế hoạch triển khai chi tiết API Chỉnh sửa Cạnh Tiên quyết (DAG) giữa các Khái niệm, tích hợp Giải thuật Tarjan khử chu trình, Heuristic cắt cạnh xuôi trang, Transitive Reduction làm gọn đồ thị, quy ước mũi tên Xuôi Dòng (Source = Nền tảng -> Target = Nâng cao) và Chặn chu trình thời gian thực bằng C# (.NET 8) & EF Core"
status: pending
priority: P1
branch: "main"
tags: [backend, graph, dag, tarjan, csharp, dotnet, postgresql, ef-core, ai-ingestion]
blockedBy: [261108-uc033-concept-nodes]
blocks: [261108-uc035-flashcards-curation]
created: "2026-11-08T02:01:07.745Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.4 Edit Prerequisite Edges and Tarjan Cycle Breaking

## Overview

Kế hoạch này hiện thực hóa **UC-03.4 (Chỉnh sửa Cạnh Tiên quyết & Giải thuật Tarjan)** thuộc phân hệ Backend AI Pipeline (Thành viên 2).
Hệ thống thiết lập mạng lưới quan hệ nhân quả (`PREREQUISITE_OF`) giữa các `ConceptNodes`, đảm bảo đồ thị tri thức **100% là Đồ thị có hướng không chu trình (DAG)**:
- Thống nhất quy ước mũi tên **Xuôi Dòng (Downstream Flow)**: $U \to V$ nghĩa là *"Khái niệm $U$ là kiến thức nền tảng cần học trước để mở khóa khái niệm nâng cao $V$"* (`SourceNodeId` = Nền tảng, `TargetNodeId` = Nâng cao).
- Ngăn chặn triệt để nguy cơ vòng lặp vô tận (Infinite Loop) trong giải thuật sắp xếp học tô-pô (Topological Sort) và thuật toán dò lỗ hổng $A(u)$ của Thành viên 3.
- Cơ chế **Chặn chu trình thời gian thực (Real-time Cycle Prevention)**: Khi người dùng nối cạnh $U \to V$, backend kiểm tra tính tiếp cận trong RAM ($<0.5\text{ms}$). Nếu tạo chu trình, từ chối ngay với HTTP 400 kèm mảng `cycle_path`.
- Cảnh báo mềm khi một khái niệm có $> 5$ tiên quyết trực tiếp để tránh quá tải nhận thức trên Cây kỹ năng 2D (TV4).
- Giải thuật **Tarjan (SCC)** tự động phát hiện và cắt cạnh yếu nhất / ngược trang khi AI sinh ban đầu.
- Giải thuật **Transitive Reduction** tự động loại bỏ các cạnh bắc cầu thừa, giữ Cây kỹ năng 2D (TV4) tinh gọn và thoáng mắt.
- Đồng bộ vòng đời 100%: Cạnh quan hệ tự động chuyển sang `ACTIVE` cùng lúc với Concepts khi người dùng bấm Commit ở UC-03.5.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bảng `concept_relations`, constraints `CHECK (source <> target)`, `UNIQUE`, khóa ngoại Cascade |
| 2 | [Graph Analysis Engine and Tarjan Algorithms](./phase-02-graph-analysis-engine-and-tarjan-algorithms.md) | Pending | P1 | Module C# thuần: Tarjan SCC, Reachability cycle check, Pruning Heuristic, Transitive Reduction, Topological Sort |
| 3 | [Relations Service and RESTful Controller](./phase-03-relations-service-and-restful-controller.md) | Pending | P1 | RESTful Controller `ConceptRelationsController`, Real-time cycle rejection (HTTP 400 + path), Soft warning $>5$ in-degree, `validate-dag` API |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests cho giải thuật đồ thị, Integration tests cho API phát hiện chu trình, cảnh báo in-degree và cắt cạnh bắc cầu |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.4-dag-tarjan-brainstorm.md`
  - SRS: [Report 3 SRS](../../ref/Report3_Software_Requirement_Specification.md) (d?ng b? [requirements.md](../../ref/requirements.md)) (UC-03.4, S-06, NF-03)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc033-concept-nodes`: Cung cấp danh sách `ConceptNodes` làm các đỉnh của đồ thị.
- **Downstream Plans**:
  - `UC-03.5`: Duyệt & Chọn lọc Thẻ Flashcard AI sinh.
  - `UC-04.1 $\to$ UC-04.3`: Dựng Canvas Cây kỹ năng 2D (TV4 vẽ các cạnh nối trên React Flow theo quy ước Xuôi dòng).
  - `UC-05.1`: Thuật toán phân bổ Hàng đợi học 3 tầng theo thứ tự Tô-pô (TV3).
  - `UC-06.1`: Dò ngược đồ thị tính chỉ số nghi vấn lỗ hổng tri thức $A(u)$ (TV3 duyệt từ Target ngược về Source).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-03.4 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Mathematical Convention / Architecture]** Về quy ước hướng mũi tên liên kết PREREQUISITE_OF giữa 2 khái niệm (SourceNode -> TargetNode), bạn chọn chuẩn nào để đồng bộ giữa các thành viên?
   - Options: Quy ước Xuôi Dòng (Downstream Flow): U -> V nghĩa là 'U là tiên quyết cần học trước để mở khóa V' | Quy ước Ngược Dòng: V -> U
   - **Answer:** Quy ước Xuôi Dòng (Downstream Flow): U -> V nghĩa là 'U là tiên quyết cần học trước để mở khóa V' (Source = Nền tảng, Target = Nâng cao) (Recommended)
   - **Rationale:** Đây là quy ước chuẩn tự nhiên của Cây kỹ năng (Skill Tree / Tech Tree trong game và giáo dục). Mũi tên chỉ hướng tiến bộ của người học (từ dễ đến khó), giúp TV4 vẽ đồ thị React Flow trực quan và TV3 chạy Topological Sort xuôi chiều cực kỳ thuận tiện.

2. **[Cognitive / UI Boundaries]** Về giới hạn số lượng điều kiện tiên quyết tối đa cho 1 khái niệm (In-Degree Limit):
   - Options: Giới hạn mềm: Cảnh báo trên giao diện nếu 1 khái niệm có > 5 điều kiện tiên quyết trực tiếp | Giới hạn cứng (HTTP 400) | Không giới hạn
   - **Answer:** Giới hạn mềm: Cảnh báo trên giao diện nếu 1 khái niệm có > 5 điều kiện tiên quyết trực tiếp (để tránh rối đồ thị), nhưng không chặn cứng ở Backend (Recommended)
   - **Rationale:** Giúp giao diện hiển thị badge/toast cảnh báo người dùng khi đồ thị có nguy cơ quá tải nhận thức ("Cognitive Overload"), đồng thời vẫn bảo đảm tính linh hoạt cho những môn học chuyên sâu có nhiều điều kiện tiên quyết phức tạp.

3. **[Lifecycle / Data Consistency]** Về cơ chế Commit/Discard của các cạnh quan hệ (ConceptRelations):
   - Options: Đồng bộ 100% với Document/Concept | Quản lý độc lập
   - **Answer:** Đồng bộ 100% với Document/Concept: Khi bấm Commit ở UC-03.5 thì toàn bộ cạnh Draft tự động chuyển sang ACTIVE trong cùng 1 transaction (Recommended)
   - **Rationale:** Đảm bảo tính nguyên tử (Atomicity): Khái niệm và Cạnh quan hệ sinh ra cùng nhau thì sẽ được nạp vào CSDL chính thức cùng nhau, loại bỏ hoàn toàn nguy cơ Node đã Active nhưng Cạnh vẫn còn Draft.

#### Confirmed Decisions
- **Arrow Direction**: Thống nhất 100% quy ước $U \to V$ (`SourceNodeId` = Nền tảng, `TargetNodeId` = Nâng cao cần mở khóa).
- **Soft Warning**: Backend trả về trường `warning: "EXCESSIVE_PREREQUISITES"` nếu In-Degree $> 5$.
- **Unified Commit**: Cạnh quan hệ Draft được chuyển sang `Active` trong cùng 1 transaction khi gọi Commit ở UC-03.5.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ quy ước và quyết định vào các phase files.
- Không còn mâu thuẫn hay điểm nghẽn. Kế hoạch sẵn sàng chuyển sang triển khai (Cook).
