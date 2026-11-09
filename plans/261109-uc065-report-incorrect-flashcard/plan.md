---
title: "UC-06.5 Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)"
description: "Kế hoạch Frontend thành viên 5: modal báo cáo nội dung thẻ vi phạm/sai lệch kiến thức với các lý do chuẩn hóa, trường mô tả chi tiết và bảo mật danh tính người báo cáo."
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

# UC-06.5 Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên hoặc Giảng viên (Đã xác thực) |
| **Màn hình / Trigger** | Nhấn nút cờ báo cáo ("Báo cáo thẻ" / Icon cờ) trên Flashcard trong phiên học hoặc trang xem thẻ |
| **Preconditions** | Người dùng đã đăng nhập và đang xem một thẻ ghi nhớ cụ thể trong hệ thống. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Bản ghi báo cáo vi phạm được tạo trong hàng đợi kiểm duyệt (Moderation Queue), người báo cáo nhận được thông báo tiếp nhận thành công. |
| **Cancel postconditions** | Đóng modal báo cáo trước khi nhấn Gửi sẽ hủy bỏ toàn bộ nội dung đã soạn, không lưu lại dữ liệu rác. |
| **Failure postconditions** | Nếu người dùng chưa chọn lý do báo cáo hoặc để trống mô tả quá ngắn, hệ thống chặn gửi và hiển thị lỗi validation tại chỗ. |
| **Out of scope** | Không tự động xóa thẻ bị báo cáo ngay lập tức; việc xử lý thuộc về quản trị viên/chủ bộ thẻ qua Moderation Queue. |

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
- **D01 (5 nhóm lý do báo cáo chuẩn hóa (Radio Cards)):** Gồm: Lỗi chính tả/ngữ pháp (typo_or_grammar), Sai kiến thức thực tế (factually_incorrect), Nội dung không phù hợp (inappropriate_content), Thẻ bị trùng lặp (duplicate_card), và Lý do khác (other).
- **D02 (Trường mô tả chi tiết có bộ đếm ký tự):** Textarea cho phép người dùng mô tả cụ thể lỗi sai (tối đa 500 ký tự), có bộ đếm ký tự trực quan theo thời gian thực.
- **D03 (Bảo mật danh tính người báo cáo (Anonymous Submission)):** Không công khai danh tính người báo cáo cho chủ bộ thẻ để bảo vệ người học khỏi xung đột cá nhân.
- **D04 (Modal gọn gàng, focus trap và đóng bằng phím Escape):** Modal thiết kế tinh tế với nền mờ (blur backdrop), tự động focus vào lựa chọn đầu tiên và đóng bằng phím Esc an toàn.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
