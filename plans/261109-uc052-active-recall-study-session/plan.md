---
title: "UC-05.2 Phiên học Gợi nhớ Tích cực (Active Recall Study Session)"
description: "Kế hoạch Frontend thành viên 5: trải nghiệm lật thẻ 3D, đánh giá độ nhớ với 4 mức (Again/Hard/Good/Easy), điều khiển bằng bàn phím và tối ưu bố cục không cuộn."
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

# UC-05.2 Phiên học Gợi nhớ Tích cực (Active Recall Study Session)

## Overview

Thành viên 5 (Frontend Learning Experience, Reports & QA) chịu trách nhiệm xây dựng giao diện, trải nghiệm người dùng và kiểm thử cho **Phiên học Gợi nhớ Tích cực (Active Recall Study Session)**.

Hiện trạng thực tế trên nhánh `QuiVT`:
- **Giao diện Frontend Mock:** Đã triển khai đầy đủ mã nguồn TypeScript, React components và CSS Design System chuẩn SaaS EdTech tại `frontend/src/features/`.
- **Kiểm thử Unit Tests:** Đã hoàn thành bộ unit tests thuật toán tại `frontend/tests/` với kết quả pass 100%.
- **Tích hợp Backend:** Đang ở trạng thái **Pending Backend Integration**, sẵn sàng kết nối với API ASP.NET Core Web API và cơ sở dữ liệu PostgreSQL 16 khi hệ thống backend hoàn thiện.

Nguồn nghiệp vụ tham chiếu: Yêu cầu phân công Use Case TV5, tài liệu kiến trúc UrSpace, và các hợp đồng dùng chung C01–C10 tại [Đối chiếu Hợp đồng chung](../reports/2026-11-09-member5-shared-contracts-and-source-review.md).

### Use Case Contract

| Mục | Nội dung |
|---|---|
| **Actor** | Học viên (Đã xác thực) |
| **Màn hình / Trigger** | Nhấn nút "Bắt đầu học" từ Dashboard, Không gian Bộ thẻ hoặc Lịch ôn tập |
| **Preconditions** | Bộ thẻ có ít nhất 1 thẻ ghi nhớ đến hạn ôn tập hoặc thẻ mới cần học. |
| **Main flow** | Người dùng mở giao diện → Hệ thống tải dữ liệu từ mock/API → Hiển thị trực quan theo design system → Người dùng tương tác (tìm kiếm, đánh giá, kiểm tra, thao tác phím tắt) → Hệ thống xử lý dữ liệu và phản hồi kết quả mượt mà. |
| **Success postconditions** | Lưu lịch sử đánh giá từng thẻ trong phiên học, ghi nhận độ trễ (latency ms) và chuyển sang màn hình kết quả UC-05.9 khi hoàn thành. |
| **Cancel postconditions** | Người dùng có thể tạm dừng hoặc thoát phiên học; tiến trình các thẻ đã hoàn thành được bảo toàn. |
| **Failure postconditions** | Nếu bộ thẻ rỗng không có thẻ đến hạn, hiển thị màn hình chúc mừng "Đã hoàn thành hết bài học hôm nay". |
| **Out of scope** | Không tự ý tính toán lại công thức FSRS Retrievability hoặc cập nhật bảng UserCardStates trực tiếp trên client; dữ liệu gửi về backend xử lý. |

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
- **D01 (Hiệu ứng lật thẻ 3D chân thực (3D Flip Animation)):** Sử dụng CSS 3D transform (perspective: 1000px, transform-style: preserve-3d) mang lại cảm giác lật thẻ mượt mà.
- **D02 (Tối ưu bố cục màn hình chuẩn 1080p (No-scroll Layout)):** Cố định chiều cao flashcard 350px, giảm lề dọc không cần thiết để cả thẻ bài và 4 nút đánh giá luôn hiển thị đầy đủ trong tầm mắt.
- **D03 (Hệ thống phím tắt chuyên nghiệp):** Phím Space: Lật mặt sau / mặt trước; Phím 1, 2, 3, 4: Đánh giá tương ứng Again, Hard, Good, Easy; Phím Enter: Bắt đầu hoặc tiếp tục.
- **D04 (Bốn nút đánh giá với sắc thái màu pastel phân biệt):** Again (đỏ nhạt), Hard (vàng cam), Good (tím UrSpace), Easy (xanh ngọc lơ), kèm nhãn phím tắt trực quan.

### Hiện trạng triển khai tại nhánh QuiVT
- **Frontend Source Code:** Hoàn thành (Implemented Frontend Mock).
- **Automated Unit Tests:** 100% Pass (Node test runner).
- **Backend & Database:** Pending Integration.
