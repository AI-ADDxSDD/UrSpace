---
phase: 3
title: "REST API and Dashboard Handoff"
status: pending
priority: P2
dependencies: [1, 2]
---

# Phase 3: REST API and Dashboard Handoff

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-07.6 plan](./plan.md).

## Overview

Typed response; member5 chart consumption.

**Objective:** Expose history and trends.  
**Timebox:** 25–26/11/2026 (W3 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** GET history + Swagger fixtures.

## Requirements

### Functional

- Filters from/to, deck_id, session_type, cursor.
- Return count and duration/ratings with unit and metric source.
- Return honest empty state.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `GET /api/v1/learning/history`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** ASP.NET Core GET /learning/history, EF Core projections, cursor & pagination, indexed PostgreSQL queries, xUnit aggregate tests.
- **Business/algorithm policy:** Cursor pagination on (reviewed_at,id); aggregate only effective review events; define actual recall proxy e.g. Again=failed, otherwise recalled, if team approves; FSRS predicted retrievability as separate metric.
- **Persistence design:** ReviewLog append-only; optional StudySession/StudySessionItem; UndoEvent; indexes (user_id,reviewed_at,id), (user_id,card_id,reviewed_at); no denormalized stats without data correctness test.
- **Cross-team input:** Member 3 UC-05.3 review logs; UC-05.4 undo events; UC-06.2 sessions; Member5 results/statistics; Member1 DB migrations; Member4 Deck names.

## Proposed Code Location (subject to actual repository layout)

- `src/UrSpace.Application/Learning/LearningHistory/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Filters** — Filters from/to, deck_id, session_type, cursor..
2. **Return** — Return count and duration/ratings with unit and metric source..
3. **Return** — Return honest empty state..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Member5 dashboard can render without guessing definitions.


## Test Cases (Given / When / Then)

- **TC-UC07.6-03-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Filters from/to, deck_id, session_type, cursor.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC07.6-03-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Return count and duration/ratings with unit and metric source.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC07.6-03-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Return honest empty state.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `GET /api/v1/learning/history`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 3 UC-05.3 review logs; UC-05.4 undo events; UC-06.2 sessions; Member5 results/statistics; Member1 DB migrations; Member4 Deck names.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
