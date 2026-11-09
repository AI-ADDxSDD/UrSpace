---
phase: 3
title: "API Integration and Downstream Events"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: API Integration and Downstream Events

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.3 plan](./plan.md).

## Overview

Xác thực principal, validate request, trả typed response; kết nối event/outbox hoặc một after-commit signal an toàn cho knowledge gap/mnemonic; không gọi AI trong transaction.

**Objective:** Expose rating endpoint, kiểm soát replay và phát tín hiệu.  
**Timebox:** 11–12/11/2026 (W1 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** POST review API + OpenAPI + integration contract với Member 5.

## Requirements

### Functional

- Nhận rating, card_id, session_id?, duration_ms?, request_id.
- Tạo/cập nhật state, trả review_id, due_at, interval, D/S/R estimate.
- Chống request lặp bằng unique (user_id, request_id).
- Chỉ phát downstream message sau commit, không phát 2 lần.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `POST /api/v1/learning/reviews`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** ASP.NET Core controller + pure FsrsSchedulerAdapter + ReviewService + EF Core/PostgreSQL transaction + xUnit golden tests; API DTOs typed; DI, clock abstraction.
- **Business/algorithm policy:** FSRS v4.5, dùng official/reproducible reference vectors đã được xác minh; không trộn công thức hay weight của version khác. Tính Retrievability theo đúng phiên bản được chọn; time zone và today boundary được xác định riêng.
- **Persistence design:** UserCardState composite unique (user_id, card_id), stability, difficulty, reps, lapses, state, due, last_review_at, version; ReviewLog append-only với user_id, card_id, rating, elapsed_days, scheduled_days, duration_ms, reviewed_at, request_id, snapshot_before. Cột thêm là đề xuất cần Member 1 duyệt.
- **Cross-team input:** Member 1: UserCardState/ReviewLog schema, JWT claims, target_retention config và migration policy. Member 4: Flashcard/Deck IDs và access policy. Member 5: 4 nút rating, session_id, client request ID.

## Proposed Code Location (subject to actual repository layout)

- `src/UrSpace.Application/Learning/FsrsRating/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Nhận** — Nhận rating, card_id, session_id?, duration_ms?, request_id..
2. **Tạo/cập** — Tạo/cập nhật state, trả review_id, due_at, interval, D/S/R estimate..
3. **Chống** — Chống request lặp bằng unique (user_id, request_id)..
4. **Chỉ** — Chỉ phát downstream message sau commit, không phát 2 lần..

5. Viết focused unit tests để chốt expected results trước khi nối DB/API.
6. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
7. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
8. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Thành viên 5 dùng được payload cho 4 nút rating.
- [ ] Lỗi quyền và replay kiểm thử được qua WebApplicationFactory.


## Test Cases (Given / When / Then)

- **TC-UC05.3-03-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Nhận rating, card_id, session_id?, duration_ms?, request_id.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.3-03-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Tạo/cập nhật state, trả review_id, due_at, interval, D/S/R estimate.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.3-03-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Chống request lặp bằng unique (user_id, request_id).”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `POST /api/v1/learning/reviews`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 1: UserCardState/ReviewLog schema, JWT claims, target_retention config và migration policy. Member 4: Flashcard/Deck IDs và access policy. Member 5: 4 nút rating, session_id, client request ID.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
