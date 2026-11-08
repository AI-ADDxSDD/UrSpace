---
phase: 2
title: "Web Push and Email Notification Services"
status: pending
priority: P1
dependencies: [phase-01-database-entity-and-ef-core-migration]
---

# Phase 2: Web Push and Email Notification Services

## Overview
Xây dựng 2 dịch vụ gửi thông báo chuyên biệt:
1. **`IWebPushService`**: Triển khai giao thức W3C Push API và chuẩn VAPID (RFC 8292) bằng thư viện `WebPush-CSharp`, mã hóa payload nhị phân an toàn và gửi tới các Push Service của trình duyệt (Google FCM, Mozilla Autopush, Apple WebPush). Tự động phát hiện và dọn dẹp các endpoint không hợp lệ (`HTTP 410 Gone`).
2. **`IEmailReminderService`**: Tích hợp gửi email thông báo định dạng HTML đẹp mắt qua `FluentEmail`, hiển thị số lượng thẻ đến hạn, số ngày duy trì chuỗi Streak (UC-07.1) và nút kêu gọi hành động (CTA) dẫn thẳng vào phòng học.

## Requirements
- **Functional**:
  - `IWebPushService.SendNotificationAsync`:
    - Đầu vào: `UserPushSubscription sub`, `string title`, `string body`, `string clickUrl`.
    - Tạo đối tượng `PushSubscription` từ `Endpoint`, `P256dh`, `Auth`.
    - Ký thông tin VAPID Details: `Subject: mailto:support@smartlearn.vn`, `PublicKey`, `PrivateKey`.
    - Đóng gói Payload JSON: `{ "title": title, "body": body, "icon": "/icons/icon-192.png", "data": { "url": clickUrl } }`.
    - Bắt lỗi `WebPushException`: Nếu StatusCode là `410 Gone` hoặc `404 Not Found` $\to$ Trả về cờ `isExpired = true` để tầng gọi xóa subscription khỏi CSDL.
  - `IEmailReminderService.SendReminderEmailAsync`:
    - Đầu vào: `string toEmail`, `string learnerName`, `int dueCardsCount`, `int streakDays`.
    - Sinh nội dung email từ template Razor `StudyReminderEmail.cshtml`:
      - Tiêu đề: `[SmartLearn] 🔥 Đã đến giờ ôn tập! Bạn có {dueCardsCount} thẻ đang chờ hôm nay`.
      - Khối thống kê: Số thẻ cần ôn, Chuỗi ngày học liên tục.
      - Nút bấm CTA: *"Mở Hàng Đợi Học Ngay"*.
- **Non-functional**:
  - Tốc độ gửi mỗi request Web Push: $< 300\text{ms}$.
  - Email tuân thủ chuẩn chống spam (SPF, DKIM-ready, có link hủy nhận thông báo ở chân trang).

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Infrastructure.Notifications`
- **Libraries**: `WebPush` (NuGet), `FluentEmail.Core`, `FluentEmail.Smtp`.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Interfaces/IWebPushService.cs`
  - `src/SmartLearn.Infrastructure/Notifications/WebPushService.cs`
  - `src/SmartLearn.Application/Interfaces/IEmailReminderService.cs`
  - `src/SmartLearn.Infrastructure/Notifications/EmailReminderService.cs`
  - `src/SmartLearn.Infrastructure/Notifications/Templates/StudyReminderEmail.cshtml`

## Implementation Steps

1. **Cài đặt `WebPushService`**:
   ```csharp
   namespace SmartLearn.Infrastructure.Notifications;

   public class WebPushService : IWebPushService
   {
       private readonly VapidDetails _vapidDetails;
       private readonly ILogger<WebPushService> _logger;

       public WebPushService(IConfiguration config, ILogger<WebPushService> logger)
       {
           _logger = logger;
           var subject = config["Vapid:Subject"] ?? "mailto:admin@smartlearn.vn";
           var publicKey = config["Vapid:PublicKey"];
           var privateKey = config["Vapid:PrivateKey"];
           _vapidDetails = new VapidDetails(subject, publicKey, privateKey);
       }

       public async Task<bool> SendNotificationAsync(
           UserPushSubscription subscription,
           string title,
           string body,
           string targetUrl,
           CancellationToken ct = default)
       {
           var pushClient = new WebPushClient();
           var sub = new PushSubscription(subscription.Endpoint, subscription.P256dh, subscription.Auth);

           var payload = JsonSerializer.Serialize(new
           {
               title,
               body,
               icon = "/icons/icon-192.png",
               badge = "/icons/badge-72.png",
               data = new { url = targetUrl }
           });

           try
           {
               await pushClient.SendNotificationAsync(sub, payload, _vapidDetails, ct);
               return true; // Gửi thành công
           }
           catch (WebPushException ex) when (ex.StatusCode == HttpStatusCode.Gone || ex.StatusCode == HttpStatusCode.NotFound)
           {
               _logger.LogInformation("Push subscription {SubId} is expired (HTTP {Code}). Flagged for pruning.", subscription.Id, ex.StatusCode);
               return false; // Báo hiệu subscription đã hỏng để caller xóa khỏi CSDL
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Failed to send Web Push to endpoint: {Endpoint}", subscription.Endpoint);
               return true; // Lỗi mạng tạm thời, không xóa subscription
           }
       }
   }
   ```

2. **Cài đặt `EmailReminderService`**:
   ```csharp
   namespace SmartLearn.Infrastructure.Notifications;

   public class EmailReminderService : IEmailReminderService
   {
       private readonly IFluentEmail _fluentEmail;
       private readonly ILogger<EmailReminderService> _logger;

       public EmailReminderService(IFluentEmail fluentEmail, ILogger<EmailReminderService> logger)
       {
           _fluentEmail = fluentEmail;
           _logger = logger;
       }

       public async Task<bool> SendReminderEmailAsync(
           string toEmail,
           string learnerName,
           int dueCardsCount,
           int streakDays,
           CancellationToken ct = default)
       {
           var subject = $"[SmartLearn] 🔥 Đã đến giờ ôn tập! Bạn có {dueCardsCount} thẻ cần học";
           var model = new
           {
               LearnerName = learnerName,
               DueCardsCount = dueCardsCount,
               StreakDays = streakDays,
               ActionUrl = "https://smartlearn.vn/dashboard"
           };

           try
           {
               var response = await _fluentEmail
                   .To(toEmail, learnerName)
                   .Subject(subject)
                   .UsingTemplateFromEmbedded("SmartLearn.Infrastructure.Notifications.Templates.StudyReminderEmail.cshtml", model, GetType().Assembly)
                   .SendAsync(ct);

               return response.Successful;
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Failed to send study reminder email to {Email}", toEmail);
               return false;
           }
       }
   }
   ```

## Success Criteria
- [ ] Gửi Web Push thành công tới trình duyệt nhận payload JSON có tiêu đề và link điều hướng.
- [ ] Bắt được lỗi `HTTP 410 Gone` từ Web Push Service và trả về `false` để kích hoạt dọn dẹp subscription.
- [ ] Email HTML sinh đầy đủ tên học viên, số lượng thẻ và số ngày Streak.