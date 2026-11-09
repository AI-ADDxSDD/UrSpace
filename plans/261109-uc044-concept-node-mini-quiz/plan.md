---
title: "UC-04.4 Bài kiểm tra Mini theo Khái niệm (Concept Node Mini-Quiz)"
description: "Kế hoạch Frontend thành viên 5: trải nghiệm làm bài trắc nghiệm mini (3-5 câu hỏi) gắn với từng Khái niệm (Concept Node) để củng cố kiến thức tức thì."
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

# UC-04.4 Bài kiểm tra Mini theo Khái niệm (Concept Node Mini-Quiz)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Bài kiểm tra Mini theo Khái niệm (Concept Node Mini-Quiz)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Nhấn nút "Kiểm tra nhanh" từ Chi tiết Khái niệm (Concept Detail Drawer) hoặc Cây kỹ năng (Skill Tree) |
| **Preconditions** | Khái niệm (Concept Node) tồn tại trong hệ thống và có ngân hàng câu hỏi trắc nghiệm đính kèm. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Lưu kết quả kiểm tra tạm thời, hiển thị điểm số, tỷ lệ chính xác và giải thích đáp án; không tự tiện ghi đè UserConceptMasteries của Backend. |
| **Cancel postconditions** | Người dùng có thể thoát bài kiểm tra bất kỳ lúc nào; câu trả lời dở dang không được tính vào lịch sử. |
| **Failure postconditions** | Nếu khái niệm chưa có câu hỏi, hiển thị thông báo rỗng thân thiện thay vì màn hình trắng. |
| **Out of scope** | Không tự động sinh câu hỏi bằng AI trong phiên chạy thực; không tính toán lại toàn bộ thuật toán DAG Masteries trên client. |

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
- **D01 (Ngân hàng câu hỏi gắn với Concept Node ID):** Mỗi khái niệm có 3 đến 5 câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) với 1 đáp án đúng duy nhất.
- **D02 (Thẻ lựa chọn tương tác hiện đại (Interactive Option Cards)):** Các lựa chọn thiết kế dạng thẻ nổi, có hiệu ứng hover nhấc nhẹ, hiển thị huy hiệu ký tự A/B/C/D rõ ràng.
- **D03 (Phản hồi kết quả sinh động):** Khi nộp bài hoặc chọn câu, màu sắc phản hồi trực quan: xanh lá cho đáp án đúng, đỏ san hô cho đáp án sai kèm giải thích.
- **D04 (Bảng tổng kết điểm số chuyên nghiệp):** Màn hình hoàn thành hiển thị tỷ lệ % chính xác, số câu đúng/tổng số câu, đánh giá mức độ hiểu biết và nút làm lại bài.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
