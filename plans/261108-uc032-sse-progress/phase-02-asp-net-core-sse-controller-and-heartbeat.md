---
phase: 2
title: "ASP.NET Core SSE Controller and Heartbeat"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: ASP.NET Core SSE Controller and Heartbeat

<!-- Updated: Validation Session 1 - Hỗ trợ xác thực kép Cookie/Query Param, Snapshot 2 tầng (Redis -> Postgres) và payload tóm tắt complete -->

## Overview
Xây dựng Controller endpoint `GET /api/v1/documents/{id}/progress` hỗ trợ giao thức Server-Sent Events (SSE) trong ASP.NET Core (.NET 8), hỗ trợ xác thực kép qua HttpOnly Cookie hoặc Query Param `?token=`, gửi ngay snapshot tiến độ ban đầu 2 tầng (Redis $\to$ Postgres), cầu nối kênh Pub/Sub qua `System.Threading.Channels`, phát Heartbeat định kỳ 15 giây chống proxy timeout, và bắn sự kiện `complete` chứa payload tóm tắt chuyển tiếp.

## Requirements
- **Functional**:
  - Endpoint: `GET /api/v1/documents/{id:guid}/progress`.
  - **Cơ chế xác thực (Auth)**:
    - Kiểm tra Bearer Token từ Header `Authorization` (nếu có).
    - Hoặc đọc từ **HttpOnly Cookie** `access_token` (được cấp từ UC-01.2).
    - Hoặc đọc từ **Query Parameter** `?token=<jwt_access_token>`.
    - Cho phép native `EventSource` của trình duyệt kết nối mượt mà không cần polyfill.
  - **Response Headers bắt buộc**:
    - `Content-Type: text/event-stream`
    - `Cache-Control: no-cache`
    - `Connection: keep-alive`
    - `X-Accel-Buffering: no` (tắt buffering Nginx/Cloudflare)
  - **Initial Snapshot 2 Tầng (Khôi phục trạng thái khi F5/Reconnect)**:
    - Tầng 1: Đọc nhanh từ Redis `doc:progress:{id}` ($<1\text{ms}$).
    - Tầng 2 (Fallback): Nếu Redis rỗng, truy vấn PostgreSQL bảng `documents`:
      - Nếu `status == 'COMPLETED'`: Bắn ngay `event: complete` kèm summary và đóng kết nối.
      - Nếu `status == 'FAILED'`: Bắn ngay `event: error` và đóng kết nối.
      - Nếu `status == 'QUEUED'`: Bắn sự kiện 0% "Đang chờ worker tiếp nhận".
  - **Kênh lắng nghe thời gian thực**: Subscribe Redis channel `doc:progress:{id}` và pipe dữ liệu liên tục xuống client.
  - **Heartbeat / Ping**: Nếu sau 15 giây không có message nào mới, tự động gửi `: ping\n\n` để giữ socket sống.
  - **Đóng kết nối chuẩn W3C**:
    - Khi nhận trạng thái `COMPLETED` $\to$ Bắn:
      ```
      event: complete
      data: {"document_id":"...","deck_id":"...","concepts_count":15,"flashcards_count":45,"status":"COMPLETED"}
      ```
      Sau đó đóng kết nối ngay để client gọi `eventSource.close()`.
    - Khi nhận trạng thái `FAILED` $\to$ Bắn `event: error\ndata: {"error_message":"..."}\n\n` rồi đóng kết nối.
- **Non-functional**:
  - Không chiếm dụng ThreadPool (Async I/O non-blocking).
  - Hỗ trợ đồng thời hàng trăm clients lắng nghe cùng lúc qua Redis Pub/Sub.

## Architecture
- **ASP.NET Core Controller & Authentication Middleware**:
  - Middleware / Action Filter trích xuất token từ Query String hoặc Cookie và gán vào `ClaimsPrincipal` nếu Header rỗng.
  - Sử dụng `System.Threading.Channels.Channel.CreateUnbounded<string>()` làm buffer trung gian giữa Redis Pub/Sub callback và HTTP Response stream.

## Related Code Files
- Create:
  - `src/SmartLearn.Api/Controllers/DocumentProgressController.cs`
  - `src/SmartLearn.Api/Filters/QueryTokenAuthenticationFilter.cs`
- Modify:
  - `src/SmartLearn.Api/Program.cs` (Đăng ký authentication filter)

## Implementation Steps
1. **Xây dựng `QueryTokenAuthenticationFilter`**:
   - Trích xuất token từ `context.Request.Query["token"]` hoặc Cookie nếu Header `Authorization` không có.
   - Xác thực token qua `JwtSecurityTokenHandler` và gán `HttpContext.User`.
2. **Thiết lập Response Headers**:
   - Gán `text/event-stream`, `no-cache`, `X-Accel-Buffering: no`, gọi `Response.Body.FlushAsync()`.
3. **Triển khai Phục Hồi Snapshot 2 Tầng**:
   - Kiểm tra Redis key `doc:progress:{id}`.
   - Nếu không có, query `_dbContext.Documents.FindAsync(id)`.
   - Ghi dữ liệu ban đầu ra client và kiểm tra trạng thái kết thúc sớm.
4. **Cấu hình `Channel<string>` & Redis Subscription**:
   - Tạo Channel không giới hạn.
   - Đăng ký `sub.SubscribeAsync(channel, (ch, msg) => channel.Writer.TryWrite(msg))`.
5. **Vòng lặp Stream kèm Heartbeat Ping (15s)**:
   - Sử dụng `Task.WhenAny(channel.Reader.WaitToReadAsync(), Task.Delay(15000))` để phát ping định kỳ hoặc đẩy message mới xuống client.
6. **Xử lý ngắt kết nối an toàn**:
   - Khi client abort hoặc nhận sự kiện kết thúc $\to$ `await sub.UnsubscribeAsync(channel)`.

## Success Criteria
- [ ] Trình duyệt mở `new EventSource('/api/v1/documents/{id}/progress?token=...')` kết nối thành công, không bị lỗi 401.
- [ ] Client F5 trang khi tác vụ đã xong $\to$ Nhận ngay `event: complete` từ snapshot tầng 2 (Postgres) trong $<10\text{ms}$.
- [ ] Dòng comment `: ping\n\n` được phát đều đặn mỗi 15 giây khi không có event mới.
- [ ] Khi hoàn tất, nhận được payload summary chứa `deck_id` và stream tự động đóng sạch sẽ.

## Risk Assessment
- **Nguy cơ**: Query token bị lộ trong log của reverse proxy.
- **Giải pháp**: Ưu tiên HttpOnly Cookie cho client web; chỉ dùng Query param làm fallback và cấu hình proxy không log query string của endpoint `/progress`.
