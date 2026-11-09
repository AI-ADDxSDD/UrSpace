---
title: "UC-05.7 Lịch ôn tập sắp tới (Upcoming Review Schedule)"
description: "Kế hoạch Frontend thành viên 5: dự báo khối lượng thẻ đến hạn theo biểu đồ cột 7/14/30 ngày, phân nhóm thẻ quá hạn / hôm nay / tương lai với chuẩn hóa múi giờ."
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

# UC-05.7 Lịch ôn tập sắp tới (Upcoming Review Schedule)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Lịch ôn tập sắp tới (Upcoming Review Schedule)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Chọn mục "Lịch ôn tập" (Review Schedule) từ thanh điều hướng chính hoặc trang thống kê học tập |
| **Preconditions** | Học viên đã có tài khoản và có các thẻ ghi nhớ đang trong chu kỳ lặp lại ngắt quãng (Spaced Repetition). |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Hiển thị dự báo số lượng thẻ cần ôn tập theo các ngày sắp tới, hỗ trợ học viên lên kế hoạch học tập chủ động. |
| **Cancel postconditions** | Thay đổi phạm vi ngày (7/14/30 ngày) không làm thay đổi trạng thái thẻ trên server. |
| **Failure postconditions** | Nếu người dùng chưa có thẻ nào cần học, hiển thị biểu đồ rỗng an toàn với toàn bộ giá trị 0. |
| **Out of scope** | Không tự tính lại thuật toán FSRS trên client; chỉ tổng hợp các thẻ có `due_date` từ backend hoặc mock data. |

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
- **D01 (Phân loại 3 nhóm thẻ trọng tâm (KPI Cards)):** Tách biệt rõ ràng 3 chỉ số: Quá hạn (Overdue), Đến hạn hôm nay (Due Today) và Tổng thẻ tương lai (Future Due).
- **D02 (Hỗ trợ 3 phạm vi dự báo linh hoạt):** Cho phép người học chuyển đổi giữa các khung thời gian: 7 ngày tới, 14 ngày tới và 30 ngày tới.
- **D03 (Chuẩn hóa múi giờ an toàn (Timezone Normalization)):** Sử dụng múi giờ của người dùng để tính toán ngày hôm nay (today) theo UTC midnight, tránh hiện tượng trôi ngày do lệch múi giờ cục bộ.
- **D04 (Biểu đồ cột hiện đại với Tooltip tương tác):** Các cột có đỉnh bo tròn, cột ngày hôm nay được đánh dấu nổi bật bằng màu tím UrSpace, hover hiển thị tooltip chi tiết.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
