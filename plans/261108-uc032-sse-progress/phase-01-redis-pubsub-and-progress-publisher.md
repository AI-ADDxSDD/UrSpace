---
phase: 1
title: "Redis PubSub and Progress Publisher"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Redis PubSub and Progress Publisher

<!-- Updated: Validation Session 1 - Thêm payload summary cho sự kiện complete và chuẩn hóa 4 mốc -->

## Overview
Xây dựng dịch vụ `IDocumentProgressPublisher` trong C# (.NET 8) cho phép Hangfire Worker cập nhật và phát đi các sự kiện tiến độ qua 4 giai đoạn chuẩn hóa, lưu trữ snapshot trạng thái vào Redis cache và phát sóng (publish) vào Redis Channel tương ứng kèm payload tóm tắt hoàn tất.

## Requirements
- **Functional**:
  - Interface `IDocumentProgressPublisher` định nghĩa phương thức:
    `Task PublishAsync(Guid documentId, int stage, string stageName, int percent, string message, string status = "PROCESSING", object? extraData = null)`.
  - Phân chia 4 giai đoạn chuẩn:
    - Stage 1: Đọc văn bản (0% $\to$ 25%)
    - Stage 2: Trích xuất Concepts (25% $\to$ 50%)
    - Stage 3: Xây dựng DAG Tiên quyết (50% $\to$ 75%)
    - Stage 4: Sinh Flashcards & Hoàn tất (75% $\to$ 100%)
  - Khi hoàn tất (100%): `extraData` chứa `{ concepts_count, flashcards_count, deck_id }`.
  - Lưu tiến độ mới nhất vào Redis key `doc:progress:{documentId}` với TTL 1 giờ.
  - Publish thông điệp JSON vào Redis channel `doc:progress:{documentId}`.
- **Non-functional**:
  - Thao tác ghi cache và publish phải thực hiện bất đồng bộ non-blocking trong $< 2\text{ms}$.
  - Payload JSON chuẩn hóa camelCase nhất quán.

## Architecture
- **Công nghệ**: `StackExchange.Redis` kết nối Redis 7.x.
- **Mô hình**: Publisher trong Producer/Consumer Pattern. Hangfire Worker đóng vai trò Producer phát tín hiệu qua Redis Pub/Sub; các SSE Controller đóng vai trò Consumer lắng nghe.

## Related Code Files
- Create:
  - `src/SmartLearn.Application/Common/Interfaces/IDocumentProgressPublisher.cs`
  - `src/SmartLearn.Application/Common/Models/DocumentProgressMessage.cs`
  - `src/SmartLearn.Infrastructure/Realtime/RedisDocumentProgressPublisher.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký `IDocumentProgressPublisher` vào DI Container)

## Implementation Steps
1. **Định nghĩa DTO `DocumentProgressMessage`**:
   ```csharp
   public record DocumentProgressMessage(
       Guid DocumentId,
       int Stage,
       string StageName,
       int Percent,
       string Message,
       string Status,
       DateTimeOffset Timestamp,
       object? ExtraData = null
   );
   ```
2. **Triển khai `RedisDocumentProgressPublisher`**:
   - Inject `IConnectionMultiplexer`.
   - Hàm `PublishAsync`:
     - Serialize `DocumentProgressMessage` sang JSON.
     - `db.StringSetAsync($"doc:progress:{documentId}", json, TimeSpan.FromHours(1))`.
     - `sub.PublishAsync(RedisChannel.Literal($"doc:progress:{documentId}"), json)`.
3. **Cung cấp Helper Extension Methods**:
   - `PublishStage1Async`: *"Đang đọc cấu trúc tài liệu..."* (25%).
   - `PublishStage2Async`: *"Gemini AI đang phân tích khái niệm..."* (50%).
   - `PublishStage3Async`: *"Đang liên kết đồ thị tri thức DAG..."* (75%).
   - `PublishCompleteAsync`: *"Hoàn tất bộ thẻ"* (100%, status: `COMPLETED`, kèm `deckId`, `conceptsCount`, `flashcardsCount`).
   - `PublishErrorAsync`: Báo lỗi thất bại kèm thông điệp.

## Success Criteria
- [ ] Gọi `PublishAsync` $\to$ Redis key `doc:progress:{id}` có giá trị JSON chính xác.
- [ ] Dùng `redis-cli SUBSCRIBE doc:progress:{id}` $\to$ Nhận được ngay message JSON khi publisher phát sự kiện.
- [ ] Thời gian thực thi mỗi lần publish $< 3\text{ms}$.

## Risk Assessment
- **Nguy cơ**: Redis mất kết nối khiến worker bị treo hoặc văng exception.
- **Giải pháp**: Bọc `try-catch` quanh lệnh publish, ghi log cảnh báo nhưng không làm đứt đoạn tiến trình chính của Hangfire Worker nếu Redis pub/sub tạm thời gián đoạn.
