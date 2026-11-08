---
phase: 1
title: "Database Entity and EF Core Migration"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Database Entity and EF Core Migration

## Overview
Thiết kế các thực thể C# `UserNotificationPreference` và `UserPushSubscription`, cấu hình Fluent API trong Entity Framework Core với các ràng buộc duy nhất, quan hệ khóa ngoại `ON DELETE CASCADE` và chỉ mục tối ưu hóa cho tác vụ quét nền Hangfire:
- Bảng `user_notification_preferences`: Lưu trữ cấu hình bật/tắt Email, Web Push, giờ nhắc nhở (`reminder_hour`), múi giờ (`timezone`), và mốc thời gian gửi gần nhất (`last_reminder_sent_at`).
- Bảng `user_push_subscriptions`: Lưu trữ thông tin đăng ký Web Push theo chuẩn W3C Push API (`endpoint`, `p256dh`, `auth`) của các thiết bị trình duyệt mà học viên đã đăng nhập.

## Requirements
- **Functional**:
  - Tạo bảng `user_notification_preferences` trong PostgreSQL:
    - `user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`
    - `email_enabled BOOLEAN NOT NULL DEFAULT TRUE`
    - `web_push_enabled BOOLEAN NOT NULL DEFAULT TRUE`
    - `reminder_hour INT NOT NULL DEFAULT 8` -- Giờ nhắc nhở trong ngày (0 - 23)
    - `timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh'`
    - `last_reminder_sent_at TIMESTAMPTZ`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Tạo bảng `user_push_subscriptions` trong PostgreSQL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    - `endpoint TEXT NOT NULL`
    - `p256dh TEXT NOT NULL`
    - `auth TEXT NOT NULL`
    - `user_agent TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - Ràng buộc CSDL:
    - `CONSTRAINT uq_user_push_endpoint UNIQUE (user_id, endpoint)`
  - Chỉ mục tối ưu hóa:
    - `idx_notification_pref_schedule ON (reminder_hour, timezone)`
- **Non-functional**:
  - Truy vấn danh sách học viên cần gửi thông báo trong khung giờ hiện tại: $< 5\text{ms}$.
  - Tự động xóa sạch cấu hình và subscription khi tài khoản `User` bị xóa (`ON DELETE CASCADE`).

## Architecture & Interfaces
- **CSDL & ORM**: PostgreSQL 16 + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Domain Entities**:
  - `SmartLearn.Domain.Entities.UserNotificationPreference`
  - `SmartLearn.Domain.Entities.UserPushSubscription`

## Related Code Files
- Create:
  - `src/SmartLearn.Domain/Entities/UserNotificationPreference.cs`
  - `src/SmartLearn.Domain/Entities/UserPushSubscription.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/UserNotificationPreferenceConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Configurations/UserPushSubscriptionConfiguration.cs`
  - `src/SmartLearn.Infrastructure/Data/Migrations/YYYYMMDD_CreateNotificationTables.cs`
- Modify:
  - `src/SmartLearn.Infrastructure/Data/AppDbContext.cs` (Đăng ký `DbSet<UserNotificationPreference>` và `DbSet<UserPushSubscription>`)

## Implementation Steps

1. **Tạo Entity `UserNotificationPreference`**:
   ```csharp
   namespace SmartLearn.Domain.Entities;

   public class UserNotificationPreference
   {
       public Guid UserId { get; set; }
       public bool EmailEnabled { get; set; } = true;
       public bool WebPushEnabled { get; set; } = true;
       public int ReminderHour { get; set; } = 8;
       public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
       public DateTimeOffset? LastReminderSentAt { get; set; }
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
       public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation property
       public User? User { get; set; }
   }
   ```

2. **Tạo Entity `UserPushSubscription`**:
   ```csharp
   namespace SmartLearn.Domain.Entities;

   public class UserPushSubscription
   {
       public Guid Id { get; set; }
       public Guid UserId { get; set; }
       public string Endpoint { get; set; } = string.Empty;
       public string P256dh { get; set; } = string.Empty;
       public string Auth { get; set; } = string.Empty;
       public string? UserAgent { get; set; }
       public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

       // Navigation property
       public User? User { get; set; }
   }
   ```

3. **Cấu hình Fluent API EF Core**:
   ```csharp
   namespace SmartLearn.Infrastructure.Data.Configurations;

   public class UserNotificationPreferenceConfiguration : IEntityTypeConfiguration<UserNotificationPreference>
   {
       public void Configure(EntityTypeBuilder<UserNotificationPreference> builder)
       {
           builder.ToTable("user_notification_preferences");
           builder.HasKey(p => p.UserId);

           builder.Property(p => p.Timezone).IsRequired().HasMaxLength(50);

           builder.HasOne(p => p.User)
                  .WithOne()
                  .HasForeignKey<UserNotificationPreference>(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasIndex(p => new { p.ReminderHour, p.Timezone })
                  .HasDatabaseName("idx_notification_pref_schedule");
       }
   }

   public class UserPushSubscriptionConfiguration : IEntityTypeConfiguration<UserPushSubscription>
   {
       public void Configure(EntityTypeBuilder<UserPushSubscription> builder)
       {
           builder.ToTable("user_push_subscriptions");
           builder.HasKey(s => s.Id);

           builder.Property(s => s.Endpoint).IsRequired();
           builder.Property(s => s.P256dh).IsRequired();
           builder.Property(s => s.Auth).IsRequired();

           builder.HasOne(s => s.User)
                  .WithMany()
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

           builder.HasIndex(s => new { s.UserId, s.Endpoint })
                  .IsUnique()
                  .HasDatabaseName("uq_user_push_endpoint");
       }
   }
   ```

4. **Cập nhật `AppDbContext.cs` & Chạy Migration**:
   - Thêm `DbSet<UserNotificationPreference> UserNotificationPreferences` và `DbSet<UserPushSubscription> UserPushSubscriptions`.
   - `dotnet ef migrations add CreateNotificationTables`.
   - `dotnet ef database update`.

## Success Criteria
- [ ] Migration sinh thành công 2 bảng `user_notification_preferences` và `user_push_subscriptions`.
- [ ] Ràng buộc `uq_user_push_endpoint` ngăn chặn việc lưu 2 endpoint trùng lặp trên cùng 1 tài khoản.
- [ ] Chỉ mục `idx_notification_pref_schedule` hoạt động chính xác khi quét theo giờ và múi giờ.