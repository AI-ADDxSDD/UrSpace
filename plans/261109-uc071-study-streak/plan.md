---
title: "UC-07.1 Chuỗi ngày Học tập và Heatmap Hoạt động (Study Streak)"
description: "Kế hoạch Frontend thành viên 5: hiển thị chuỗi ngày học liên tục (Streak), kỷ lục dài nhất, lịch hoạt động dạng Heatmap GitHub với 5 cấp độ tím và chuẩn hóa múi giờ."
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

# UC-07.1 Chuỗi ngày Học tập và Heatmap Hoạt động (Study Streak)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Chuỗi ngày Học tập và Heatmap Hoạt động (Study Streak)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Mở trang Dashboard cá nhân, tab "Tiến độ học tập" hoặc xem widget Streak trên thanh trạng thái |
| **Preconditions** | Học viên có tài khoản và có lịch sử hoàn thành các phiên học (ít nhất 1 thẻ được đánh giá trong ngày). |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Hiển thị chính xác chuỗi ngày học hiện tại, kỷ lục chuỗi ngày dài nhất và ma trận lịch đóng góp/học tập trực quan. |
| **Cancel postconditions** | Chuyển đổi chế độ xem 90 ngày hoặc 365 ngày không làm thay đổi trạng thái học tập. |
| **Failure postconditions** | Nếu người dùng mới chưa học ngày nào, hiển thị chuỗi 0 ngày an toàn và lịch học ở mức 0 không gây lỗi. |
| **Out of scope** | Không tự ý sửa đổi cơ sở dữ liệu lịch sử học tập; thuật toán streak trên client chỉ để phục vụ hiển thị preview. |

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
- **D01 (Quy tắc duy trì chuỗi thông minh (Streak Continuity Rule)):** Chuỗi ngày hiện tại được bảo toàn nếu người dùng đã học hôm qua mặc dù hôm nay chưa học xong; chuỗi chỉ bị đứt (reset về 0) nếu bỏ lỡ 1 ngày trọn vẹn.
- **D02 (Khử trùng lặp nhiều phiên trong cùng một ngày):** Học nhiều phiên hoặc ôn nhiều thẻ trong cùng một ngày chỉ tính là 1 ngày hoạt động duy nhất cho chuỗi ngày liên tục.
- **D03 (Ma trận Heatmap 5 cấp độ sắc thái tím UrSpace):** Từ mức 0 (xám nhạt - không học) đến mức 4 (tím đậm - học rất tích cực trên 50 thẻ/ngày), có nhãn tháng và các thứ trong tuần.
- **D04 (Hỗ trợ hai chế độ xem: 90 ngày và 365 ngày):** Cho phép người học chuyển đổi linh hoạt giữa góc nhìn 3 tháng gần nhất và toàn cảnh 1 năm.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
