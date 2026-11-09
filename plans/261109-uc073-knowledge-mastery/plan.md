---
title: "UC-07.3 Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)"
description: "Kế hoạch Frontend thành viên 5: hiển thị mức độ thành thạo kiến thức theo các Concept Nodes dạng lưới phân nhóm theo môn học/chủ đề với 4 cấp độ và modal chi tiết."
status: pending
priority: P1
branch: "QuiVT"
tags: [frontend, member5, planning, learning-experience]
blockedBy: []
blocks: []
created: "2026-11-09"
createdBy: "QuiVT"
source: "user-request"
---

# UC-07.3 Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Chọn mục "Độ thành thạo" (Knowledge Mastery) từ thanh điều hướng chính hoặc trang Cây kỹ năng |
| **Preconditions** | Hệ thống có danh mục các Khái niệm (Concept Nodes) được phân bổ theo Môn học và Chủ đề. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Hiển thị tổng quan phân bố mức độ thành thạo, cho phép tìm kiếm, lọc theo môn học/trạng thái và mở modal xem chi tiết từng khái niệm. |
| **Cancel postconditions** | Đóng modal chi tiết hoặc hủy lọc không làm thay đổi dữ liệu. |
| **Failure postconditions** | Nếu chưa có khái niệm nào trong chủ đề được chọn, hiển thị trạng thái rỗng thân thiện kèm nút xóa bộ lọc. |
| **Out of scope** | Không tự tính toán lại FSRS Retrievability hoặc tự ý cập nhật bảng UserConceptMasteries trên database; ngưỡng phần trăm demo chờ backend xác nhận. |

## Phases

| Phase | File | Status | Priority | Deliverables |
|---|---|---|---|---|
| 1 | [Requirements and Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Truy vết yêu cầu, đặc tả trường, contract API đề xuất, mã lỗi RFC 7807 |
| 2 | [Interface and State](./phase-02-interface-and-state.md) | Pending | P1 | Luồng UI/UX, Component tree, State machine, Phím tắt, Responsive, a11y |
| 3 | [Backend Integration](./phase-03-backend-integration.md) | Pending | P1 | Mock API hiện hữu, đặc tả tích hợp ASP.NET Core, DTO, lược đồ PostgreSQL 16 |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | 16 kịch bản Given/When/Then, unit tests thực tế, tiêu chí nghiệm thu |

Thứ tự thực hiện tuần tự từ Phase 1 đến Phase 4. Giao diện Frontend hiện đã chạy độc lập với mock client ở Phase 3; khi Backend sẵn sàng sẽ chuyển đổi sang API endpoint chính thức.

## Dependencies & Downstream Touchpoints

- **Thành viên 1 (Auth & Users):** Cung cấp thông tin phiên đăng nhập, JWT bearer token và định danh người dùng.
- **Thành viên 2 (Deck & Document Management):** Đồng bộ cấu trúc bộ thẻ, danh mục môn học và số lượng thẻ ghi nhớ.
- **Thành viên 3 (AI Generation & FSRS Engine):** Tiếp nhận dữ liệu đánh giá học tập để tính toán khoảng cách lặp lại ngắt quãng (Spaced Repetition); cung cấp ngày đến hạn ôn tập.
- **Thành viên 4 (Concept DAG & Skill Tree):** Phối hợp điều hướng giữa Cây kỹ năng 2D và bài kiểm tra mini (UC-04.4); chia sẻ mã định danh ConceptNode ID cho bản đồ thành thạo (UC-07.3).

## Validation Log

### Confirmed Decisions — Các quyết định kỹ thuật đã chốt
- **D01 (Phân nhóm theo Môn học và Chủ đề (Topic Grouping)):** Không dựng lại toàn bộ đồ thị DAG phức tạp; hiển thị trực quan dạng lưới ma trận các Concept Nodes phân nhóm theo Chủ đề.
- **D02 (Bốn cấp độ thành thạo chuẩn hóa):** Chưa học (Unlearned - Xám), Cần ôn tập (Needs Review - Hổ phách), Đang tiến bộ (In Progress - Xanh dương), và Thành thạo (Mastered - Xanh lá).
- **D03 (Thanh phân bố đa đoạn (Distribution Bar)):** Thanh tiến độ thể hiện trực quan tỷ lệ % của 4 cấp độ thành thạo trên toàn bộ kho khái niệm.
- **D04 (Modal xem chi tiết Khái niệm (Concept Detail Modal)):** Click vào thẻ khái niệm mở modal xem định nghĩa, thanh tiến độ điểm số, môn học/chủ đề, số lượng thẻ liên quan và hành động gợi ý.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
