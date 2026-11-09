---
title: "UC-02.8 Nhập nhanh Thẻ ghi nhớ (Quick Add Flashcards)"
description: "Kế hoạch Frontend thành viên 5: soạn thảo và nhập nhanh hàng loạt thẻ ghi nhớ qua văn bản, CSV, TSV (Excel/Sheets) với bảng kiểm tra dữ liệu trực quan."
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

# UC-02.8 Nhập nhanh Thẻ ghi nhớ (Quick Add Flashcards)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Nhập nhanh Thẻ ghi nhớ (Quick Add Flashcards)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên hoặc Giảng viên (Chủ sở hữu bộ thẻ) |
| **Màn hình / Trigger** | Chọn chức năng "Nhập nhanh" (Quick Add) trong Không gian Bộ thẻ hoặc trang quản lý thẻ |
| **Preconditions** | Người dùng đã đăng nhập và đang ở trong một Bộ thẻ cụ thể mà họ có quyền chỉnh sửa. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Các thẻ hợp lệ được lưu hàng loạt vào bộ thẻ trong cơ sở dữ liệu, hiển thị thông báo số lượng thẻ đã thêm thành công. |
| **Cancel postconditions** | Hủy bỏ trước khi nhấn Lưu sẽ không ghi bất kỳ thẻ nào vào cơ sở dữ liệu. |
| **Failure postconditions** | Nếu có dòng dữ liệu lỗi, hệ thống hiển thị cảnh báo chi tiết từng dòng và ngăn chặn việc lưu thẻ rỗng. |
| **Out of scope** | Không tự động nhận diện ngôn ngữ bằng AI; không tạo thẻ đảo ngược tự động trong phạm vi UC này. |

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
- **D01 (Hỗ trợ đa định dạng phân tách (Delimiter)):** Tự động nhận diện Tab (sao chép từ Excel/Google Sheets), Comma (CSV chuẩn hỗ trợ dấu ngoặc kép), Dấu chấm phẩy (;), và Dấu gạch nối (-).
- **D02 (Bảng xem trước trực quan (Live Table Preview)):** Chuyển đổi dữ liệu thô từ textarea thành bảng xem trước hai cột Mặt trước / Mặt sau với huy hiệu trạng thái Hợp lệ / Lỗi cho từng dòng.
- **D03 (Bảo toàn dấu phẩy và xuống dòng trong ngoặc kép):** Trình phân tích CSV tuân thủ chuẩn RFC 4180, cho phép chứa dấu phẩy và ngắt dòng bên trong chuỗi có dấu ngoặc kép ("...").
- **D04 (Bỏ qua dòng trống và lọc khoảng trắng thừa):** Các dòng chỉ chứa khoảng trắng hoặc ký tự xuống dòng tự động được bỏ qua mà không báo lỗi giả.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
