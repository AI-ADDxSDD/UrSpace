---
title: "UC-03.2 Real-time Document Progress SSE"
description: "Kế hoạch triển khai chi tiết luồng Server-Sent Events (SSE) theo dõi tiến độ bóc tách tài liệu thời gian thực trong ASP.NET Core (.NET 8) kết hợp Redis Pub/Sub, Initial State Snapshot 2 tầng (Redis + Postgres), xác thực kép Cookie/Query Token, Heartbeat chống proxy timeout và hỗ trợ đa người dùng"
status: pending
priority: P2
branch: "main"
tags: [backend, sse, real-time, csharp, dotnet, redis, pubsub, ai-ingestion]
blockedBy: [261108-uc031-upload-file]
blocks: [261108-uc033-concept-nodes]
created: "2026-11-08T01:23:57.209Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.2 Real-time Document Progress SSE

## Overview

Kế hoạch này hiện thực hóa **UC-03.2 (Theo dõi Tiến độ nền thời gian thực)** thuộc phân hệ Backend AI Pipeline (Thành viên 2).
Hệ thống cung cấp endpoint Server-Sent Events (`GET /api/v1/documents/{id}/progress`) siêu nhẹ, không phụ thuộc thư viện client bên ngoài (frontend dùng native `new EventSource()`). Kết hợp **Redis Pub/Sub** để phân phối sự kiện từ Hangfire Worker sang Web Server, lưu **Snapshot tiến độ 2 tầng** (Redis Cache fallback PostgreSQL) chống lỡ bước đầu, hỗ trợ xác thực kép qua **HttpOnly Cookie hoặc Query Param `?token=`**, phát **Heartbeat 15 giây** chống proxy timeout và phát sự kiện `complete` chứa payload tóm tắt (`deck_id`, `concepts_count`, `flashcards_count`) để bàn giao mượt mà sang UC-03.3 và UC-03.5.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Redis PubSub and Progress Publisher](./phase-01-redis-pubsub-and-progress-publisher.md) | Pending | P2 | `IDocumentProgressPublisher`, Caching snapshot Redis, 4 mốc tiến độ chuẩn hóa (0-100%) |
| 2 | [ASP.NET Core SSE Controller and Heartbeat](./phase-02-asp-net-core-sse-controller-and-heartbeat.md) | Pending | P1 | Endpoint SSE, Auth Cookie/Query Param, Snapshot 2 tầng, Header `X-Accel-Buffering: no`, Ping 15s, Handoff payload `complete` |
| 3 | [Testing and Verification](./phase-03-testing-and-verification.md) | Pending | P2 | Unit tests Publisher, SSE Integration tests, Multi-subscriber concurrency tests, Auth tests |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.2-sse-progress-brainstorm.md`
  - SRS: [Report 3 SRS](../../ref/Report3_Software_Requirement_Specification.md) (d?ng b? [requirements.md](../../ref/requirements.md)) (UC-03.2, S-06)
- **Upstream Plan phụ thuộc**:
  - `plans/261108-uc031-upload-file`: Cung cấp `document_id` và Hangfire Worker kích hoạt tiến trình.
- **Downstream Plans**:
  - `UC-03.3`: Xem & Duyệt Khái niệm AI sinh (kích hoạt sau khi nhận sự kiện `event: complete` từ SSE).
  - `UC-03.5`: Xem & Duyệt Flashcard AI sinh.

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-03.2 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Authentication / Security]** Chuẩn EventSource của trình duyệt không cho phép tùy biến Header Authorization. Bạn muốn xác thực người dùng trên Endpoint SSE bằng cách nào?
   - Options: Hỗ trợ xác thực qua HttpOnly Cookie (đã có từ UC-01.2) HOẶC Query Param (?token=...) | Dùng fetch-event-source | Endpoint Public
   - **Answer:** Hỗ trợ xác thực qua HttpOnly Cookie HOẶC Query Param (?token=...) (Recommended)
   - **Rationale:** Giúp frontend sử dụng 100% native `new EventSource()` của trình duyệt mà không cần cài thêm bất kỳ thư viện npm nào, đồng thời vẫn bảo đảm tính an toàn bảo mật và phân quyền của hệ thống.

2. **[Architecture / Fault Tolerance]** Khi người dùng F5 tải lại trang hoặc rớt mạng lâu rồi kết nối lại, cơ chế khôi phục trạng thái ban đầu (Initial State) sẽ đọc từ đâu?
   - Options: 2 Tầng: Ưu tiên đọc Redis Cache doc:progress:{id} (nhanh <1ms); nếu Redis miss thì fallback truy vấn bảng documents trong PostgreSQL | Chỉ đọc Redis Cache | Chỉ đọc PostgreSQL
   - **Answer:** 2 Tầng: Ưu tiên đọc Redis Cache doc:progress:{id} (nhanh <1ms); nếu Redis miss thì fallback truy vấn bảng documents trong PostgreSQL (Recommended)
   - **Rationale:** Tối ưu hóa tối đa tốc độ phản hồi ($<1\text{ms}$) cho 99% trường hợp thông thường, đồng thời có chốt chặn an toàn (fallback) vào CSDL quan hệ nếu Redis cache bị rụng hoặc hết hạn.

3. **[Data Handoff / Integration]** Khi tiến trình đạt 100%, sự kiện 'event: complete' nên trả về dữ liệu gì cho Frontend?
   - Options: Trả về Tóm tắt (Summary): { document_id, deck_id, concepts_count, flashcards_count, status: "COMPLETED" } | Nhúng toàn bộ danh sách chi tiết Concepts và Flashcards thô
   - **Answer:** Trả về Tóm tắt (Summary): { document_id, deck_id, concepts_count, flashcards_count, status: "COMPLETED" } (Recommended)
   - **Rationale:** Giữ payload của SSE siêu nhẹ, tránh nghẽn luồng socket; Frontend nhận được `deck_id` và các chỉ số tóm tắt sẽ chủ động điều hướng sang màn hình quản lý/duyệt thẻ tương ứng (UC-03.3 & UC-03.5).

#### Confirmed Decisions
- **Auth Strategy**: Cho phép xác thực qua cả HttpOnly Cookie và Query String `?token=<access_token>`.
- **Initial State Recovery**: Cơ chế 2 tầng (Cache-Aside Pattern: Redis $\to$ PostgreSQL fallback).
- **Completion Event Contract**: Trả về lightweight summary kèm `deck_id`, `concepts_count`, `flashcards_count`.
- **Heartbeat & Buffering**: Giữ nguyên phát `: ping\n\n` mỗi 15s và header `X-Accel-Buffering: no`.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ 3 quyết định vào các phase files.
- Không còn điểm mâu thuẫn hay mơ hồ. Kế hoạch sẵn sàng chuyển sang triển khai (Cook).
