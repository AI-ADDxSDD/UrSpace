---
phase: 2
title: "Hangfire Queue and Worker Setup"
status: pending
priority: P2
dependencies: [1]
---

# Phase 2: Hangfire Queue and Worker Setup

<!-- Updated: Validation Session 2 - Thay thế BullMQ bằng Hangfire .NET thuần + Hangfire Dashboard cho Admin -->

## Overview
Cấu hình hệ thống hàng đợi nền **Hangfire** trong ASP.NET Core kết hợp lưu trữ Redis/PostgreSQL (`Hangfire.Redis.StackExchange`), cấu hình Hangfire Dashboard tại `/hangfire` (giải quyết trực tiếp **UC-07.5: Giám sát hàng đợi của Admin**), định nghĩa tác vụ nền bóc tách `DocumentIngestionJob` với chính sách retry tự động.

## Requirements
- **Functional**:
  - Tích hợp package `Hangfire.AspNetCore` và `Hangfire.Redis.StackExchange`.
  - Cấu hình Hangfire Server xử lý background jobs độc lập.
  - Xây dựng `IDocumentQueueService` để enqueue job với phương thức:
    `string EnqueueIngestion(Guid documentId, Guid userId, Guid deckId, string filePath, string originalName, string mimeType, long fileSize, string fileHash)`.
  - Kích hoạt Hangfire Dashboard tại `/hangfire` có phân quyền Admin (RBAC) để thỏa mãn UC-07.5.
- **Non-functional**:
  - Không lưu binary/base64 trong Job arguments (chỉ lưu `filePath` và metadata).
  - Tự động Retry: Sử dụng attribute `[AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 5, 10, 20 })]`.
  - Type-safe 100% trong hệ sinh thái C# .NET 8, loại bỏ hoàn toàn nguy cơ lệch schema Lua script so với BullMQ.

## Architecture
- **Hạ tầng**: Redis 7.x kết hợp `Hangfire.Redis.StackExchange`.
- **Hangfire Storage**: Lưu trữ state của jobs (Enqueued, Processing, Succeeded, Failed) trực tiếp trong Redis.
- **Admin Dashboard**: Giao diện trực quan tích hợp sẵn hỗ trợ Admin xem trạng thái hàng đợi, số job đang chờ, retry thủ công các job bị lỗi.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Common/Interfaces/IDocumentQueueService.cs`
  - `src/SmartLearn.Infrastructure/Queue/HangfireDocumentQueueService.cs`
  - `src/SmartLearn.Infrastructure/Queue/Jobs/DocumentIngestionJob.cs`
  - `src/SmartLearn.Api/Filters/HangfireAuthorizationFilter.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Cấu hình `AddHangfire`, `AddHangfireServer`, `UseHangfireDashboard`)
  - `src/SmartLearn.Api/appsettings.json` (Cấu hình chuỗi kết nối Redis cho Hangfire)

## Implementation Steps
1. **Cài đặt Packages**:
   - `Hangfire.AspNetCore`
   - `Hangfire.Redis.StackExchange`
2. **Cấu hình Hangfire trong `Program.cs`**:
   ```csharp
   builder.Services.AddHangfire(config => config
       .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
       .UseSimpleAssemblyNameTypeSerializer()
       .UseRecommendedSerializerSettings()
       .UseRedisStorage(builder.Configuration.GetConnectionString("Redis")));

   builder.Services.AddHangfireServer(options =>
   {
       options.WorkerCount = Environment.ProcessorCount * 2;
       options.Queues = new[] { "document-ingestion", "default" };
   });
   ```
3. **Triển khai `DocumentIngestionJob`**:
   ```csharp
   public class DocumentIngestionJob
   {
       [Queue("document-ingestion")]
       [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 5, 10, 20 })]
       public async Task ExecuteAsync(Guid documentId, CancellationToken cancellationToken)
       {
           // Worker logic bóc tách tài liệu (sẽ được implement chi tiết ở UC-03.3 & UC-03.5)
       }
   }
   ```
4. **Triển khai `HangfireDocumentQueueService`**:
   - Sử dụng `IBackgroundJobClient.Enqueue<DocumentIngestionJob>(job => job.ExecuteAsync(documentId, CancellationToken.None))`.
5. **Cấu hình Dashboard Filter (`HangfireAuthorizationFilter`)**:
   - Kiểm tra quyền Admin dựa trên JWT Claim `role == "Admin"` hoặc session để bảo vệ cổng `/hangfire`.

## Success Criteria
- [ ] Khởi động ứng dụng, truy cập `/hangfire` hiển thị dashboard giám sát hàng đợi hoàn chỉnh.
- [ ] Gọi `IDocumentQueueService.EnqueueIngestion` $\to$ Job xuất hiện trong queue `document-ingestion` trên Dashboard.
- [ ] RAM Redis cho mỗi job tiêu thụ $< 1\text{KB}$.

## Risk Assessment
- **Nguy cơ**: Người dùng không có quyền Admin truy cập vào Dashboard quản lý job.
- **Giải pháp**: Viết `HangfireAuthorizationFilter` kiểm tra chặt chẽ token và quyền `Admin` trước khi cấp phép render trang `/hangfire`.
