---
phase: 3
title: "Hangfire Sweep Job and RESTful Controllers"
status: pending
priority: P1
dependencies: [phase-02-web-push-and-email-notification-services]
---

# Phase 3: Hangfire Sweep Job and RESTful Controllers

<!-- Updated: Validation Session 1 - Điều hướng click thông báo về /dashboard và cấu hình worker notifications -->

## Overview
Xây dựng Dịch vụ nền Hangfire và Controller RESTful quản lý cấu hình thông báo:
1. **Hangfire Recurring Job (`StudyReminderSweepJob`)**: Chạy mỗi đầu giờ (`0 * * * *`), quét các học viên có giờ địa phương trùng với `reminder_hour`, chưa nhận thông báo trong 20 giờ qua, và có thẻ đến hạn (`due_date <= UtcNow`). Đẩy từng công việc gửi thông báo vào hàng đợi Hangfire `notifications`.
2. **Worker Hàng đợi (`SendStudyReminderWorker`)**: Xử lý việc gửi Web Push & Email bất đồng bộ, tính toán số ngày Streak và tự động dọn dẹp các subscription bị hết hạn (`HTTP 410 Gone`).
3. **Controller RESTful (`NotificationPreferencesController`)**: Cho phép học viên cập nhật giờ nhận thông báo, bật/tắt Email/Push, và đăng ký `PushSubscription` từ Service Worker trình duyệt.

## Requirements
- **Functional**:
  - `StudyReminderSweepJob.ExecuteAsync`:
    - Lấy thời gian UTC hiện tại `now = DateTimeOffset.UtcNow`.
    - Duyệt qua các cấu hình trong bảng `user_notification_preferences`.
    - Chuyển đổi `now` sang múi giờ địa phương của học viên (`TimeZoneInfo.FindSystemTimeZoneById(pref.Timezone)`).
    - Điều kiện lọc:
      - `localTime.Hour == pref.ReminderHour`.
      - `pref.LastReminderSentAt == null || pref.LastReminderSentAt <= now.AddHours(-20)`.
    - Kiểm tra số thẻ đến hạn: `dueCount = Count(user_card_states WHERE UserId == pref.UserId AND DueDate <= now AND State != 'NEW')`.
    - Nếu `dueCount > 0`:
      - Gọi Hangfire: `BackgroundJob.Enqueue<SendStudyReminderWorker>(w => w.ProcessReminderAsync(pref.UserId, dueCount))`.
      - Cập nhật `pref.LastReminderSentAt = now`.
    - Lưu thay đổi vào CSDL.
  - `SendStudyReminderWorker.ProcessReminderAsync`:
    - Chạy trong Hangfire Queue `[Queue("notifications")]`.
    - Đọc thông tin người dùng, preferences, và danh sách push subscriptions.
    - Kênh Email (nếu `EmailEnabled`): Gửi qua `IEmailReminderService`.
    - Kênh Web Push (nếu `WebPushEnabled`): Lặp qua từng subscription, gửi qua `IWebPushService`. Nếu nhận phản hồi `false` (410 Gone) $\to$ Xóa subscription đó khỏi CSDL.
  - Endpoints của `NotificationPreferencesController`:
    - `GET /api/v1/notifications/preferences`: Trả về DTO cấu hình thông báo.
    - `PUT /api/v1/notifications/preferences`: Cập nhật `EmailEnabled`, `WebPushEnabled`, `ReminderHour` (0-23), `Timezone`.
    - `GET /api/v1/notifications/push/vapid-public-key`: Trả về VAPID Public Key để Frontend Service Worker gọi `registration.pushManager.subscribe()`.
    - `POST /api/v1/notifications/push/subscribe`: Lưu thông tin `endpoint`, `p256dh`, `auth`.
    - `DELETE /api/v1/notifications/push/unsubscribe`: Hủy đăng ký push theo endpoint.
- **Non-functional**:
  - Thời gian quét của Sweep Job: $< 200\text{ms}$ cho 10,000 học viên nhờ chỉ mục `idx_notification_pref_schedule`.
  - Hàng đợi `notifications` chạy độc lập, không làm chậm hàng đợi `ingestion` xử lý tài liệu AI.

## Architecture & Interfaces
- **Namespace**: `SmartLearn.Infrastructure.BackgroundJobs`, `SmartLearn.Api.Controllers`
- **DTOs**: `SmartLearn.Application.DTOs.Notification`

## Related Code Files
- Create:
  - `src/SmartLearn.Infrastructure/BackgroundJobs/StudyReminderSweepJob.cs`
  - `src/SmartLearn.Infrastructure/BackgroundJobs/SendStudyReminderWorker.cs`
  - `src/SmartLearn.Api/Controllers/NotificationPreferencesController.cs`
  - `src/SmartLearn.Application/DTOs/Notification/NotificationPreferenceDto.cs`
  - `src/SmartLearn.Application/DTOs/Notification/SubscribePushRequest.cs`
  - `src/SmartLearn.Application/DTOs/Notification/UpdatePreferenceRequest.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký Recurring Job trong Hangfire dashboard)

## Implementation Steps

1. **Cài đặt `StudyReminderSweepJob`**:
   ```csharp
   namespace SmartLearn.Infrastructure.BackgroundJobs;

   public class StudyReminderSweepJob
   {
       private readonly AppDbContext _dbContext;
       private readonly IBackgroundJobClient _jobClient;
       private readonly ILogger<StudyReminderSweepJob> _logger;

       public StudyReminderSweepJob(
           AppDbContext dbContext,
           IBackgroundJobClient jobClient,
           ILogger<StudyReminderSweepJob> logger)
       {
           _dbContext = dbContext;
           _jobClient = jobClient;
           _logger = logger;
       }

       public async Task ExecuteAsync(CancellationToken ct = default)
       {
           var nowUtc = DateTimeOffset.UtcNow;
           var cooldownThreshold = nowUtc.AddHours(-20);

           // 1. Lấy danh sách cấu hình của các user chưa nhận nhắc nhở trong 20 giờ qua
           var preferences = await _dbContext.UserNotificationPreferences
               .Where(p => p.LastReminderSentAt == null || p.LastReminderSentAt <= cooldownThreshold)
               .ToListAsync(ct);

           int enqueuedCount = 0;

           foreach (var pref in preferences)
           {
               // 2. Chuyển đổi giờ UTC sang giờ địa phương của User
               TimeZoneInfo tz;
               try
               {
                   tz = TimeZoneInfo.FindSystemTimeZoneById(pref.Timezone);
               }
               catch
               {
                   tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
               }

               var localTime = TimeZoneInfo.ConvertTime(nowUtc, tz);

               // 3. Kiểm tra nếu giờ địa phương khớp với giờ cài đặt của user
               if (localTime.Hour == pref.ReminderHour)
               {
                   // 4. Kiểm tra có thẻ đến hạn học trong ngày không
                   var dueCount = await _dbContext.UserCardStates
                       .CountAsync(s => s.UserId == pref.UserId && s.DueDate <= nowUtc && s.State != FSRSCardState.New, ct);

                   if (dueCount > 0)
                   {
                       // 5. Đẩy job gửi thông báo vào Hangfire Queue "notifications"
                       _jobClient.Enqueue<SendStudyReminderWorker>(w => w.ProcessReminderAsync(pref.UserId, dueCount, ct));
                       pref.LastReminderSentAt = nowUtc;
                       pref.UpdatedAt = nowUtc;
                       enqueuedCount++;
                   }
               }
           }

           await _dbContext.SaveChangesAsync(ct);
           _logger.LogInformation("StudyReminderSweepJob finished. Enqueued {Count} reminder jobs.", enqueuedCount);
       }
   }
   ```

2. **Cài đặt `SendStudyReminderWorker`**:
   ```csharp
   namespace SmartLearn.Infrastructure.BackgroundJobs;

   public class SendStudyReminderWorker
   {
       private readonly AppDbContext _dbContext;
       private readonly IWebPushService _webPushService;
       private readonly IEmailReminderService _emailService;
       private readonly ILogger<SendStudyReminderWorker> _logger;

       public SendStudyReminderWorker(
           AppDbContext dbContext,
           IWebPushService webPushService,
           IEmailReminderService emailService,
           ILogger<SendStudyReminderWorker> logger)
       {
           _dbContext = dbContext;
           _webPushService = webPushService;
           _emailService = emailService;
           _logger = logger;
       }

       [Queue("notifications")]
       public async Task ProcessReminderAsync(Guid userId, int dueCount, CancellationToken ct = default)
       {
           var user = await _dbContext.Users.FindAsync(new object[] { userId }, ct);
           var pref = await _dbContext.UserNotificationPreferences.FindAsync(new object[] { userId }, ct);

           if (user == null || pref == null) return;

           var streakDays = 5; // Có thể truy vấn từ bảng user_study_streaks (UC-07.1)
           var title = "SmartLearn - Đã đến giờ ôn tập!";
           var body = $"Hôm nay bạn có {dueCount} thẻ đến hạn ôn tập. Giữ vững chuỗi {streakDays} ngày học nhé!";
           var targetUrl = "/dashboard";

           // 1. Gửi Web Push
           if (pref.WebPushEnabled)
           {
               var subscriptions = await _dbContext.UserPushSubscriptions
                   .Where(s => s.UserId == userId)
                   .ToListAsync(ct);

               var deadSubscriptions = new List<UserPushSubscription>();

               foreach (var sub in subscriptions)
               {
                   var isAlive = await _webPushService.SendNotificationAsync(sub, title, body, targetUrl, ct);
                   if (!isAlive)
                   {
                       deadSubscriptions.Add(sub);
                   }
               }

               if (deadSubscriptions.Count > 0)
               {
                   _dbContext.UserPushSubscriptions.RemoveRange(deadSubscriptions);
                   await _dbContext.SaveChangesAsync(ct);
                   _logger.LogInformation("Pruned {Count} expired push subscriptions for user {UserId}", deadSubscriptions.Count, userId);
               }
           }

           // 2. Gửi Email
           if (pref.EmailEnabled && !string.IsNullOrEmpty(user.Email))
           {
               await _emailService.SendReminderEmailAsync(user.Email, user.FullName, dueCount, streakDays, ct);
           }
       }
   }
   ```

3. **Cài đặt `NotificationPreferencesController`**:
   ```csharp
   namespace SmartLearn.Api.Controllers;

   [ApiController]
   [Route("api/v1/notifications")]
   [Authorize]
   public class NotificationPreferencesController : ControllerBase
   {
       private readonly AppDbContext _dbContext;
       private readonly IConfiguration _config;

       public NotificationPreferencesController(AppDbContext dbContext, IConfiguration config)
       {
           _dbContext = dbContext;
           _config = config;
       }

       private Guid GetCurrentUserId()
       {
           var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
           return Guid.Parse(claim!);
       }

       [HttpGet("preferences")]
       public async Task<IActionResult> GetPreferences(CancellationToken ct)
       {
           var userId = GetCurrentUserId();
           var pref = await _dbContext.UserNotificationPreferences
               .FirstOrDefaultAsync(p => p.UserId == userId, ct);

           if (pref == null)
           {
               pref = new UserNotificationPreference { UserId = userId };
               _dbContext.UserNotificationPreferences.Add(pref);
               await _dbContext.SaveChangesAsync(ct);
           }

           return Ok(ApiResponse<NotificationPreferenceDto>.Ok(new NotificationPreferenceDto(
               pref.EmailEnabled,
               pref.WebPushEnabled,
               pref.ReminderHour,
               pref.Timezone,
               pref.LastReminderSentAt
           )));
       }

       [HttpPut("preferences")]
       public async Task<IActionResult> UpdatePreferences(
           [FromBody] UpdatePreferenceRequest request,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();
           var pref = await _dbContext.UserNotificationPreferences
               .FirstOrDefaultAsync(p => p.UserId == userId, ct);

           if (pref == null)
           {
               pref = new UserNotificationPreference { UserId = userId };
               _dbContext.UserNotificationPreferences.Add(pref);
           }

           pref.EmailEnabled = request.EmailEnabled;
           pref.WebPushEnabled = request.WebPushEnabled;
           pref.ReminderHour = Math.Clamp(request.ReminderHour, 0, 23);
           pref.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "Asia/Ho_Chi_Minh" : request.Timezone;
           pref.UpdatedAt = DateTimeOffset.UtcNow;

           await _dbContext.SaveChangesAsync(ct);
           return Ok(ApiResponse<string>.Ok("Cập nhật cấu hình thông báo thành công."));
       }

       [HttpGet("push/vapid-public-key")]
       public IActionResult GetVapidPublicKey()
       {
           var publicKey = _config["Vapid:PublicKey"];
           return Ok(ApiResponse<string>.Ok(publicKey ?? string.Empty));
       }

       [HttpPost("push/subscribe")]
       public async Task<IActionResult> SubscribePush(
           [FromBody] SubscribePushRequest request,
           CancellationToken ct)
       {
           var userId = GetCurrentUserId();

           var existing = await _dbContext.UserPushSubscriptions
               .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == request.Endpoint, ct);

           if (existing == null)
           {
               var newSub = new UserPushSubscription
               {
                   Id = Guid.NewGuid(),
                   UserId = userId,
                   Endpoint = request.Endpoint,
                   P256dh = request.P256dh,
                   Auth = request.Auth,
                   UserAgent = Request.Headers.UserAgent.ToString(),
                   CreatedAt = DateTimeOffset.UtcNow
               };
               _dbContext.UserPushSubscriptions.Add(newSub);
               await _dbContext.SaveChangesAsync(ct);
           }

           return Ok(ApiResponse<string>.Ok("Đăng ký nhận thông báo đẩy thành công."));
       }
   }
   ```

4. **Đăng ký Hangfire Recurring Job trong `Program.cs`**:
   ```csharp
   RecurringJob.AddOrUpdate<StudyReminderSweepJob>(
       recurringJobId: "study-reminder-hourly-sweep",
       methodCall: job => job.ExecuteAsync(CancellationToken.None),
       cronExpression: "0 * * * *" // Chạy vào phút thứ 0 của mỗi giờ
   );
   ```

## Success Criteria
- [ ] Hangfire Recurring Job `study-reminder-hourly-sweep` đăng ký thành công trên Dashboard.
- [ ] Job quét chuyển đổi chính xác múi giờ địa phương và chỉ enqueue những user có thẻ đến hạn.
- [ ] Tự động dọn dẹp các bản ghi subscription chết (`HTTP 410 Gone`) khỏi bảng `user_push_subscriptions`.
- [ ] Các API quản lý Preferences và Subscribe Web Push phản hồi HTTP 200 OK.