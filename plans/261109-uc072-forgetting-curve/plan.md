---
title: "UC-07.2 Biểu đồ Đường cong Quên lãng (Forgetting Curve)"
description: "Kế hoạch Frontend thành viên 5: biểu đồ trực quan hóa tốc độ suy giảm trí nhớ so sánh giữa Đường cong lý thuyết Ebbinghaus và Dữ liệu quan sát thực tế từ lịch sử ôn tập."
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

# UC-07.2 Biểu đồ Đường cong Quên lãng (Forgetting Curve)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Biểu đồ Đường cong Quên lãng (Forgetting Curve)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu SQL Server khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Mở tab "Đường cong quên lãng" (Forgetting Curve) từ trang Phân tích học tập hoặc Chi tiết Tiến độ |
| **Preconditions** | Học viên có lịch sử ôn tập thẻ ghi nhớ với các mốc thời gian và kết quả đánh giá thực tế. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Biểu đồ SVG kết xuất trực quan đường cong lý thuyết và các điểm ghi nhớ quan sát thực tế theo khoảng thời gian được chọn. |
| **Cancel postconditions** | Thay đổi phạm vi thời gian (7/14/30/60 ngày) không làm thay đổi dữ liệu gốc. |
| **Failure postconditions** | Nếu chưa có dữ liệu ôn tập thực tế trong phạm vi đã chọn, hệ thống KHÔNG vẽ giả đường quan sát và hiển thị thông báo rõ ràng. |
| **Out of scope** | Đường lý thuyết chỉ là mô hình toán học minh họa Ebbinghaus; KHÔNG tự nhận đây là dự đoán của thuật toán FSRS của backend. |

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
- **D01 (Tách biệt rõ ràng 2 đường trên biểu đồ):** Đường lý thuyết Ebbinghaus nét đứt màu tím nhạt minh họa; Đường quan sát thực tế (Observed Retention) nét liền màu xanh ngọc bích dựa trên dữ liệu thật.
- **D02 (Công thức toán học minh họa Ebbinghaus):** Sử dụng mô hình hàm mũ suy giảm R = exp(-t / S) với hệ số độ bền S minh họa, kèm ghi chú rõ ràng đây không phải FSRS.
- **D03 (Nguyên tắc bảo toàn tính chân thực của dữ liệu):** Không có dữ liệu quan sát thì không vẽ giả đường Observed. Khi tập dữ liệu rỗng, hiển thị trạng thái Empty State trung thực.
- **D04 (Biểu đồ SVG thuần túy, responsive không dùng thư viện ngoài):** Tự tính toán tọa độ SVG (path, circle, grid lines) đảm bảo nhẹ, tải nhanh, không phụ thuộc thư viện chart nặng nề.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
