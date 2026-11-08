---
title: "UC-05.10 Study Reminders and Background Notification Service"
description: "Kế hoạch triển khai chi tiết Dịch vụ Nền Nhắc nhở Ôn tập (Background Study Reminder Service) quét thẻ đến hạn theo Múi giờ địa phương bằng Hangfire Recurring Job, hỗ trợ Đa kênh (W3C VAPID Web Push + FluentEmail), chống Spam tối đa 1 lần/ngày và API Quản lý Cài đặt cá nhân bằng C# (.NET 8) & EF Core"
status: pending
priority: P1
branch: "main"
tags: [backend, hangfire, redis, notifications, web-push, vapid, email, csharp, dotnet, postgresql]
blockedBy: [261108-uc035-flashcards-curation]
blocks: []
created: "2026-11-08T09:22:50.820Z"
createdBy: "ck:plan"
source: skill
---

# UC-05.10 Study Reminders and Background Notification Service

## Overview

Kế hoạch này hiện thực hóa **UC-05.10 (Nhận Nhắc nhở Ôn tập)** và chỉ tiêu phi chức năng **NF-05** thuộc phân hệ Lõi Thuật toán FSRS v4.5 & Hàng đợi nền (Thành viên 3 kết hợp Thành viên 1 & 2).
Hệ thống giải quyết triệt để "Hội chứng Khủng hoảng Nợ Thẻ" (Study Debt Bankruptcy) bằng cách đồng hành và nhắc nhở học viên học đúng ngày thẻ đến hạn:
- **Dịch vụ nền Quét theo Múi giờ địa phương (Timezone-Aware Hourly Sweep)**: Tận dụng cụm **Hangfire + Redis** đã dựng từ UC-03.1, kích hoạt Recurring Job mỗi đầu giờ (`0 * * * *`). Hệ thống tự động quy đổi giờ hiện tại theo múi giờ cá nhân (`TimeZoneInfo`, mặc định: `08:00 AM Asia/Ho_Chi_Minh`) để gửi thông báo đúng nhịp sinh hoạt buổi sáng, chia đều tải gửi trong ngày.
- **Kênh Phân phối Đa nền tảng (Multi-Channel Delivery)**:
  1. `Web Push API`: Tuân thủ chuẩn IETF RFC 8292 (VAPID) qua thư viện `WebPush` C#, gửi thông báo đẩy trực tiếp tới desktop/mobile ngay cả khi đóng tab website.
  2. `Email Notification`: Gửi email tóm tắt số thẻ đến hạn kèm số ngày duy trì chuỗi học tập liên tục (**Streak** - UC-07.1) qua `FluentEmail`.
- **Cơ chế Chống Spam & Giữ Sạch CSDL**:
  - Giới hạn cứng: Mỗi học viên chỉ nhận **tối đa 1 thông báo/ngày** (`last_reminder_sent_at` cách ít nhất 20 tiếng).
  - Tự động bỏ qua (Silent suppression) khi học viên không có thẻ nào đến hạn (`due_count == 0`).
  - Tự động dọn dẹp các subscription Web Push bị lỗi `HTTP 410 Gone` hoặc `404 Not Found`.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Database Entity and EF Core Migration](./phase-01-database-entity-and-ef-core-migration.md) | Pending | P2 | Bảng `user_notification_preferences`, bảng `user_push_subscriptions`, chỉ mục tối ưu, migration PostgreSQL |
| 2 | [Web Push and Email Notification Services](./phase-02-web-push-and-email-notification-services.md) | Pending | P1 | Interface `IWebPushSender`, `IEmailReminderSender`, sinh VAPID keys, cấu hình FluentEmail HTML Razor template |
| 3 | [Hangfire Sweep Job and RESTful Controllers](./phase-03-hangfire-sweep-job-and-restful-controllers.md) | Pending | P1 | Hangfire `StudyReminderSweepJob`, worker xử lý hàng đợi `notifications`, Controller quản lý cài đặt và đăng ký push |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests cho logic chuyển đổi múi giờ và đếm thẻ đến hạn, Integration tests kiểm tra API và dọn dẹp 410 Gone |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-05.10-study-reminder-brainstorm.md`
  - SRS: `ref/Report3_Software_Requirement_Specification.md` (UC-05.10, NF-05, UC-01.5, UC-07.1)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc031-upload-file`: Cụm hạ tầng Hangfire và Redis.
  - `plans/261108-uc035-flashcards-curation`: Bảng `user_card_states` với chỉ mục `idx_user_card_states_due`.
- **Downstream Plans**:
  - `UC-05.1`: Khởi tạo Hàng đợi Học hôm nay (khi học viên click vào thông báo sẽ mở thẳng vào hàng đợi học).
  - `UC-07.1`: Chuỗi ngày học liên tục (Streak).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-05.10 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Hangfire Deployment Model]** Về mô hình triển khai Hangfire Worker cho hàng đợi thông báo (notifications queue):
   - Options: Chạy worker 'notifications' trong cùng host API nhưng giới hạn WorkerCount = 2 (Recommended) | Tách riêng thành một .NET Worker Service độc lập
   - **Answer:** Chạy worker 'notifications' trong cùng host API nhưng giới hạn `WorkerCount = 2` để tiết kiệm tài nguyên máy chủ đồ án (Recommended)
   - **Rationale:** Giúp tiết kiệm chi phí RAM và giảm thiểu độ phức tạp khi deploy (chỉ cần 1 container API duy nhất), trong khi vẫn đảm bảo giới hạn luồng I/O không làm ảnh hưởng đến các request RESTful chính.

2. **[Web Push Navigation Target]** Về đường dẫn điều hướng khi người học click vào thông báo Web Push:
   - Options: Mở thẳng vào Hàng đợi Học hôm nay (/study) | Mở vào trang Dashboard tổng quan (/dashboard)
   - **Answer:** Mở vào trang Dashboard tổng quan (`/dashboard`) để người học xem biểu đồ tiến độ trước
   - **Rationale:** Tạo trải nghiệm tổng thể tốt hơn: Người học nhìn thấy bức tranh toàn cảnh (chuỗi ngày Streak, biểu đồ nhiệt, số thẻ cần hoàn thành) trước khi bấm nút bắt đầu phiên học tập trung.

3. **[Email Service Infrastructure]** Về hạ tầng dịch vụ gửi Email thông báo:
   - Options: Cấu hình SMTP tiêu chuẩn (Recommended) | Sử dụng SendGrid REST API SDK độc quyền
   - **Answer:** Cấu hình SMTP tiêu chuẩn (dễ dàng dùng Mailtrap/Gmail lúc dev và chuyển sang SendGrid/SES lúc production) (Recommended)
   - **Rationale:** Tính tương thích và chuyển đổi cao (Portability), không bị phụ thuộc vào một nhà cung cấp bên thứ ba duy nhất (Vendor Lock-in).

#### Confirmed Decisions
- **Worker Concurrency**: Cấu hình Hangfire Server với `Queues = new[] { "default", "notifications" }` và `WorkerCount = 2` cho queue thông báo.
- **Click URL Target**: Web Push Payload và Email CTA trỏ tới `/dashboard`.
- **Standard SMTP**: Cấu hình qua `FluentEmail.Smtp` đọc thông số từ `appsettings.json`.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ `targetUrl = "/dashboard"` vào Phase 2 và Phase 3.
- Toàn bộ 4 phase kỹ thuật nhất quán 100%, sẵn sàng triển khai.
