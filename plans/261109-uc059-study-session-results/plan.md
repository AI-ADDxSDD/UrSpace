---
title: "UC-05.9 Kết quả và Tổng kết Phiên học (Study Session Results)"
description: "Kế hoạch Frontend thành viên 5: bảng tổng kết phiên học dạng SaaS dashboard với 4 số liệu KPI, biểu đồ phân bố đánh giá và lời khuyên tiếp theo."
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

# UC-05.9 Kết quả và Tổng kết Phiên học (Study Session Results)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Kết quả và Tổng kết Phiên học (Study Session Results)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu SQL Server khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Tự động kích hoạt khi học viên hoàn thành thẻ ghi nhớ cuối cùng trong phiên học UC-05.2 |
| **Preconditions** | Học viên vừa hoàn thành ít nhất 1 thẻ ghi nhớ trong phiên học Active Recall. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Lưu bản tóm tắt phiên học, cập nhật thành tích cá nhân và hiển thị các hành động tiếp theo (Học lại, Về bộ thẻ). |
| **Cancel postconditions** | Người học có thể đóng màn hình kết quả bất kỳ lúc nào để quay lại danh sách bộ thẻ. |
| **Failure postconditions** | Nếu phiên học không có thẻ nào được đánh giá, hiển thị thông báo phiên học rỗng thay vì lỗi chia cho 0. |
| **Out of scope** | Không tự tính điểm thưởng Gamification hoặc xếp hạng Leaderboard trong phạm vi UC này. |

## Phases

| Phase | File | Status | Priority | Deliverables |
|---|---|---|---|---|
| 1 | [Requirements and Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Truy vết yêu cầu, đặc tả trường, contract API đề xuất, mã lỗi RFC 7807 |
| 2 | [Interface and State](./phase-02-interface-and-state.md) | Pending | P1 | Luồng UI/UX, Component tree, State machine, Phím tắt, Responsive, a11y |
| 3 | [Backend Integration](./phase-03-backend-integration.md) | Pending | P1 | Mock API hiện hữu, đặc tả tích hợp ASP.NET Core, DTO, lược đồ SQL Server |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | 16 kịch bản Given/When/Then, unit tests thực tế, tiêu chí nghiệm thu |

Thứ tự thực hiện tuần tự từ Phase 1 đến Phase 4. Giao diện Frontend hiện đã chạy độc lập với mock client ở Phase 3; khi Backend sẵn sàng sẽ chuyển đổi sang API endpoint chính thức.

## Dependencies & Downstream Touchpoints

- **Thành viên 1 (Auth & Users):** Cung cấp thông tin phiên đăng nhập, JWT bearer token và định danh người dùng.
- **Thành viên 2 (Deck & Document Management):** Đồng bộ cấu trúc bộ thẻ, danh mục môn học và số lượng thẻ ghi nhớ.
- **Thành viên 3 (AI Generation & FSRS Engine):** Tiếp nhận dữ liệu đánh giá học tập để tính toán khoảng cách lặp lại ngắt quãng (Spaced Repetition); cung cấp ngày đến hạn ôn tập.
- **Thành viên 4 (Concept DAG & Skill Tree):** Phối hợp điều hướng giữa Cây kỹ năng 2D và bài kiểm tra mini (UC-04.4); chia sẻ mã định danh ConceptNode ID cho bản đồ thành thạo (UC-07.3).

## Validation Log

### Confirmed Decisions — Các quyết định kỹ thuật đã chốt
- **D01 (Thiết kế Dashboard kết quả như SaaS Analytics):** Bố cục gồm 4 thẻ KPI nổi bật: Tổng số thẻ, Tỷ lệ thành công, Thời gian học và Tốc độ ôn tập trung bình.
- **D02 (Thanh phân bố kết quả trực quan (Rating Breakdown Bar)):** Thanh tiến độ đa đoạn thể hiện tỷ lệ % của 4 mức đánh giá: Again (đỏ), Hard (vàng), Good (tím), Easy (xanh lá).
- **D03 (Thông điệp khuyến khích và hướng dẫn thông minh):** Dựa trên tỷ lệ ghi nhớ, hiển thị lời nhận xét phù hợp: Xuất sắc (≥85%), Khá tốt (≥70%), hoặc Cần ôn tập lại (<70%).
- **D04 (Nút hành động nhanh (Action Buttons)):** Nút "Học lại các thẻ chưa nhớ" (Again cards) và nút "Quay về Bộ thẻ" được bố trí thuận tiện cho người học.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
