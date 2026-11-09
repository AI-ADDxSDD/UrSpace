---
title: "UC-02.7 Khám phá và Sao chép Bộ thẻ Công khai (Public Deck Marketplace)"
description: "Kế hoạch Frontend thành viên 5: khám phá, tìm kiếm, lọc, xem trước chi tiết và sao chép (Fork) bộ thẻ công khai về thư viện cá nhân."
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

# UC-02.7 Khám phá và Sao chép Bộ thẻ Công khai (Public Deck Marketplace)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Khám phá và Sao chép Bộ thẻ Công khai (Public Deck Marketplace)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu SQL Server khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên hoặc Giảng viên (Đã xác thực; Khách chỉ xem/tìm kiếm, bấm Fork yêu cầu đăng nhập) |
| **Màn hình / Trigger** | Chọn tab "Khám phá" (Marketplace) trên thanh điều hướng hoặc truy cập /marketplace |
| **Preconditions** | Hệ thống có các bộ thẻ được đánh dấu Public (Visibility = Public). Người dùng đã xác thực để thực hiện hành động Fork. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Thao tác Fork tạo một bản sao độc lập (Private Deck) trong thư viện của người dùng với trạng thái học tập ban đầu (New cards), giữ nguyên nguồn gốc source_deck_id. |
| **Cancel postconditions** | Đóng modal chi tiết hoặc hủy tìm kiếm không làm thay đổi trạng thái thư viện. |
| **Failure postconditions** | Lỗi mạng hoặc server trả về 409/500 khi Fork thì thông báo lỗi và không tạo dữ liệu rác. |
| **Out of scope** | Không sửa trực tiếp nội dung bộ thẻ công khai gốc của tác giả khác; không quản lý thanh toán/bản quyền trả phí. |

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
- **D01 (Tách biệt Public Marketplace với Thư viện cá nhân):** Marketplace chỉ hiển thị các bộ thẻ có visibility = "Public", không bao giờ lộ thẻ Private của người khác.
- **D02 (Cơ chế Fork tạo Deep Copy độc lập):** Khi Fork, hệ thống tạo bản sao Private Deck mới thuộc sở hữu của người dùng hiện tại, reset UserCardState về New, lưu source_deck_id.
- **D03 (Tìm kiếm không dấu (Diacritic-tolerant)):** Tìm kiếm tiêu đề, mô tả và tags không phân biệt hoa thường và không phân biệt dấu tiếng Việt (ví dụ: "tieng anh" khớp "Tiếng Anh").
- **D04 (Modal xem trước chi tiết (Preview Deck Modal)):** Cho phép người dùng xem thông tin tác giả, tổng số thẻ, danh sách thẻ mẫu và đánh giá trước khi quyết định Fork hoặc Học thử.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
