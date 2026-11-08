---
phase: 3
title: "Testing and Verification"
status: pending
priority: P2
dependencies: [1, 2]
---

# Phase 3: Testing and Verification

<!-- Updated: Validation Session 1 - Bổ sung test xác thực kép Query/Cookie và fallback Snapshot 2 tầng -->

## Overview
Xây dựng bộ kiểm thử tự động toàn diện bằng C# (xUnit, FluentAssertions, Moq, `WebApplicationFactory`) bao phủ dịch vụ `RedisDocumentProgressPublisher`, kiểm thử luồng truyền stream SSE trong ASP.NET Core, kiểm tra xác thực qua Query/Cookie, tính năng Initial Snapshot 2 tầng (Redis $\to$ Postgres), Heartbeat 15 giây, sự kiện đóng kết nối và khả năng phục vụ đồng thời nhiều người nghe.

## Requirements
- **Functional**:
  - Unit tests cho `RedisDocumentProgressPublisher`: kiểm tra định dạng JSON, lưu cache Redis và phát tin nhắn vào đúng Redis channel.
  - Integration tests cho SSE Endpoint:
    - Xác thực thành công khi truyền token qua `?token=<jwt>` hoặc Cookie.
    - Từ chối HTTP 401 khi không có token hoặc token hết hạn.
    - Nhận ngay Initial Snapshot từ Redis khi vừa mở kết nối.
    - Fallback đọc CSDL PostgreSQL khi Redis cache bị rỗng (ví dụ sau khi F5 trang lâu ngày).
    - Nhận sự kiện `event: complete` kèm `deck_id`, `concepts_count`, `flashcards_count` khi hoàn tất.
    - Nhận sự kiện `event: error` khi tác vụ báo lỗi.
    - Nhận dòng `: ping\n\n` định kỳ khi luồng im lặng.
  - Multi-subscriber test: Mở 3 kết nối đồng thời (User A, User B WaitingOriginal, Tab 2) đến cùng 1 `document_id`, khi publisher phát 1 event $\to$ cả 3 kết nối đều nhận được cùng 1 nội dung.
- **Non-functional**:
  - Code Coverage $\ge 85\%$.
  - Không rò rỉ socket hoặc subscription Redis sau khi chạy test.

## Architecture
- **Framework kiểm thử**: xUnit, FluentAssertions, Moq, `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`).
- **Mô phỏng Redis**: In-memory Redis test instance hoặc Docker container test.

## Related Code Files
- Create:
  - `tests/SmartLearn.UnitTests/Realtime/RedisDocumentProgressPublisherTests.cs`
  - `tests/SmartLearn.IntegrationTests/Controllers/DocumentProgressControllerSseTests.cs`
  - `tests/SmartLearn.IntegrationTests/Security/SseAuthenticationTests.cs`

## Implementation Steps
1. **Viết Unit Tests cho `RedisDocumentProgressPublisher`**:
   - Mock `IDatabase` và `ISubscriber`.
   - Verify `StringSetAsync` và `PublishAsync` được gọi chính xác với TTL 1 giờ.
2. **Viết Integration Tests cho Xác thực SSE**:
   - Gửi request không token $\to$ Assert HTTP 401.
   - Gửi request kèm `?token={validJwt}` $\to$ Assert HTTP 200 kèm header `text/event-stream`.
   - Gửi request kèm Cookie `access_token={validJwt}` $\to$ Assert HTTP 200.
3. **Viết Integration Tests cho Snapshot 2 Tầng**:
   - Kịch bản 1 (Redis Hit): Tạo cache trong Redis $\to$ Client kết nối nhận ngay data từ Redis trong $<2\text{ms}$.
   - Kịch bản 2 (Redis Miss, Postgres Fallback): Xóa cache Redis, tạo record `Document` trong DB với status `Completed` $\to$ Client kết nối nhận ngay `event: complete` từ DB.
4. **Viết Test cho Multi-Subscribers**:
   - Mở 3 StreamReader đồng thời qua `Task.WhenAll`.
   - Publish sự kiện Stage 2 (50%) $\to$ Cả 3 StreamReader cùng đọc được JSON 50%.
5. **Kiểm thử Ngắt kết nối sớm (Client Disconnect / Abort)**:
   - Client chủ động hủy `CancellationToken` $\to$ Server ghi nhận `UnsubscribeAsync` thành công, không văng unhandled exception.

## Success Criteria
- [ ] Toàn bộ test suite chạy pass 100% qua lệnh `dotnet test`.
- [ ] Code coverage đạt $\ge 85\%$.
- [ ] Các kịch bản xác thực và fallback 2 tầng hoạt động tin cậy.

## Risk Assessment
- **Nguy cơ**: Test SSE stream bị treo vĩnh viễn nếu server không đóng luồng.
- **Giải pháp**: Thiết lập `CancellationTokenSource` với timeout tối đa 5 giây cho mỗi bài test integration stream.
