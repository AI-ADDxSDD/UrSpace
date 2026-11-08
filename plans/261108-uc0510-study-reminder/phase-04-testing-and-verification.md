---
phase: 4
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [phase-03-hangfire-sweep-job-and-restful-controllers]
---

# Phase 4: Testing and Verification

## Overview
Xây dựng bộ kiểm thử tự động toàn diện từ tầng Tác vụ nền (Unit Tests cho Hangfire Sweep Job) đến tầng API Controller (Integration Tests) cho UC-05.10:
- Kiểm thử logic tính toán giờ địa phương theo múi giờ (`TimeZoneInfo`) và lọc học viên đến giờ nhận thông báo.
- Kiểm thử cơ chế chặn spam (Cooldown 20 giờ) và chặn thông báo rác khi học viên không có thẻ đến hạn (`dueCount == 0`).
- Kiểm thử tự động dọn dẹp các subscription Web Push đã hết hạn (`HTTP 410 Gone`).
- Kiểm thử tích hợp các endpoint RESTful quản lý cấu hình thông báo và đăng ký push.

## Test Cases & Scenarios

### 1. Unit Tests (`SmartLearn.Tests.Unit.BackgroundJobs.StudyReminderSweepJobTests`)
- `SweepJob_TimezoneMatching_EnqueuesJob`:
  - Giả lập thời gian hiện tại là `01:00 UTC`.
  - Học viên A cài đặt `ReminderHour = 8`, `Timezone = "Asia/Ho_Chi_Minh"` (UTC+7, tương đương 08:00 AM).
  - Học viên A có 5 thẻ FSRS đến hạn (`DueDate <= UtcNow`).
  - Kỳ vọng: Job client được gọi `Enqueue` đúng 1 lần cho Học viên A.
- `SweepJob_CooldownActive_DoesNotEnqueue`:
  - Học viên B đã nhận thông báo lúc `LastReminderSentAt = now.AddHours(-4)`.
  - Giờ địa phương khớp `ReminderHour = 8`.
  - Kỳ vọng: Bị chặn bởi cơ chế Cooldown 20 giờ, không enqueue job mới.
- `SweepJob_ZeroDueCards_DoesNotEnqueue`:
  - Học viên C khớp giờ nhưng không có thẻ nào đến hạn trong bảng `user_card_states`.
  - Kỳ vọng: Im lặng bỏ qua, không gửi thông báo phiền toái.
- `SendReminderWorker_SubscriptionExpired410_PrunesRecord`:
  - Mock `IWebPushService` trả về `false` (mô phỏng `HTTP 410 Gone`).
  - Worker thực thi gửi thông báo.
  - Kỳ vọng: Bản ghi subscription đó tự động bị xóa khỏi bảng `user_push_subscriptions`.

### 2. Integration Tests (`SmartLearn.Tests.Integration.Controllers.NotificationPreferencesControllerTests`)
- `GetPreferences_ReturnsDefaults_WhenNotConfigured`:
  - User mới đăng nhập gọi `GET /api/v1/notifications/preferences`.
  - Kỳ vọng: HTTP 200 OK với các giá trị mặc định: `EmailEnabled = true`, `WebPushEnabled = true`, `ReminderHour = 8`, `Timezone = "Asia/Ho_Chi_Minh"`.
- `UpdatePreferences_ValidPayload_SavesSuccessfully`:
  - Gửi request `PUT /api/v1/notifications/preferences` đổi giờ sang `7` và tắt email.
  - Kỳ vọng: HTTP 200 OK, CSDL lưu đúng các giá trị mới.
- `SubscribePush_DuplicateEndpoint_DoesNotCreateDuplicateRow`:
  - Gửi cùng một `Endpoint` 2 lần liên tiếp.
  - Kỳ vọng: Bảng `user_push_subscriptions` chỉ chứa đúng 1 bản ghi duy nhất cho cặp (UserId, Endpoint).

## Related Code Files
- Create:
  - `tests/SmartLearn.Tests.Unit/BackgroundJobs/StudyReminderSweepJobTests.cs`
  - `tests/SmartLearn.Tests.Integration/Controllers/NotificationPreferencesControllerTests.cs`

## Implementation Steps

1. **Cài đặt Unit Tests (`StudyReminderSweepJobTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Unit.BackgroundJobs;

   public class StudyReminderSweepJobTests
   {
       [Fact]
       public async Task SweepJob_ZeroDueCards_DoesNotEnqueueJob()
       {
           // Arrange
           using var context = TestDbContextFactory.CreateInMemoryDbContext();
           var jobClientMock = new Mock<IBackgroundJobClient>();
           var sweepJob = new StudyReminderSweepJob(context, jobClientMock.Object, Mock.Of<ILogger<StudyReminderSweepJob>>());

           var userId = Guid.NewGuid();
           var pref = new UserNotificationPreference
           {
               UserId = userId,
               ReminderHour = DateTimeOffset.UtcNow.Hour, // Khớp giờ UTC
               Timezone = "UTC",
               LastReminderSentAt = null
           };
           context.UserNotificationPreferences.Add(pref);
           await context.SaveChangesAsync();

           // Act: Không tạo thẻ FSRS nào đến hạn
           await sweepJob.ExecuteAsync();

           // Assert
           jobClientMock.Verify(x => x.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Never);
       }
   }
   ```

2. **Cài đặt Integration Tests (`NotificationPreferencesControllerTests.cs`)**:
   ```csharp
   namespace SmartLearn.Tests.Integration.Controllers;

   public class NotificationPreferencesControllerTests : IClassFixture<CustomWebApplicationFactory>
   {
       private readonly HttpClient _client;
       private readonly CustomWebApplicationFactory _factory;

       public NotificationPreferencesControllerTests(CustomWebApplicationFactory factory)
       {
           _factory = factory;
           _client = factory.CreateClient();
       }

       [Fact]
       public async Task UpdatePreferences_SavesCustomHours_Success()
       {
           var payload = new UpdatePreferenceRequest(
               EmailEnabled: false,
               WebPushEnabled: true,
               ReminderHour: 6,
               Timezone: "Asia/Tokyo"
           );

           var response = await _client.PutAsJsonAsync("/api/v1/notifications/preferences", payload);
           response.EnsureSuccessStatusCode();

           // Verify GET
           var getResponse = await _client.GetFromJsonAsync<ApiResponse<NotificationPreferenceDto>>("/api/v1/notifications/preferences");
           Assert.NotNull(getResponse?.Data);
           Assert.False(getResponse.Data.EmailEnabled);
           Assert.Equal(6, getResponse.Data.ReminderHour);
           Assert.Equal("Asia/Tokyo", getResponse.Data.Timezone);
       }
   }
   ```

3. **Chạy kiểm thử tự động**:
   - `dotnet test --filter "Category=Notifications"`

## Success Criteria
- [ ] 100% các ca kiểm thử Unit Test và Integration Test vượt qua.
- [ ] Xác nhận không có hiện tượng enqueue trùng lặp hoặc gửi thông báo sai múi giờ.
- [ ] Cơ chế dọn dẹp subscription chết (`410 Gone`) hoạt động an toàn và tin cậy.