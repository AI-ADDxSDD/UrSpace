---
phase: 1
title: "Requirements and Reference Lock"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Requirements and Reference Lock

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.3 plan](./plan.md).

## Overview

Đối chiếu BR-01/BR-02, trạng thái thẻ và target retention; xác định timezone và expected outputs; lựa chọn nguồn tham chiếu FSRS v4.5 và bộ test vectors có version/hash.

**Objective:** Khoá phiên bản thuật toán và contract.  
**Timebox:** 11–12/11/2026 (W1 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Bảng mapping field C# ↔ DB; DTO; scenarios; reference-vector manifest.

## Requirements

### Functional

- Xác định Again=1, Hard=2, Good=3, Easy=4.
- Phân loại New, Learning, Review, Relearning và xử lý first review.
- Thống nhất default r=0.90, override per user và rounding due.
- Định nghĩa idempotency-key và hành vi retry sau timeout.

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

1. **Xác** — Xác định Again=1, Hard=2, Good=3, Easy=4..
2. **Phân** — Phân loại New, Learning, Review, Relearning và xử lý first review..
3. **Thống** — Thống nhất default r=0.90, override per user và rounding due..
4. **Định** — Định nghĩa idempotency-key và hành vi retry sau timeout..

5. Viết focused unit tests để chốt expected results trước khi nối DB/API.
6. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
7. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
8. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] FSRS reference/version pin được ghi; mọi assumption chưa chốt được đánh dấu.
- [ ] Test vectors được chuẩn bị trước khi viết scheduler.


## Test Cases (Given / When / Then)

- **TC-UC05.3-01-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Xác định Again=1, Hard=2, Good=3, Easy=4.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.3-01-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Phân loại New, Learning, Review, Relearning và xử lý first review.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.3-01-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Thống nhất default r=0.90, override per user và rounding due.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
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
