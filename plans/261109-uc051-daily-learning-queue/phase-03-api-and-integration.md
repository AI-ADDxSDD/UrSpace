---
phase: 3
title: "HTTP and Client Integration"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: HTTP and Client Integration

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.1 plan](./plan.md).

## Overview

Controller đọc user từ JWT; response có group/priority/reason/count, timestamp; kết nối Member5.

**Objective:** Expose queue today.  
**Timebox:** 14–15/11/2026 (W1 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** GET queue + OpenAPI + stub/demo.

## Requirements

### Functional

- Nhận limit optional trong policy.
- Filter per-user và permitted decks.
- Trả [] nếu không có thẻ; không dùng HTTP 404 cho empty queue.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `GET /api/v1/learning/queue/today`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** ASP.NET Core query endpoint; LINQ/EF Core, SQL indexes; pure QueuePolicy; injectable clock; pagination/limit safe guard.
- **Business/algorithm policy:** Deterministic multi-tier selection: eligibility → priority assignment → tier-local sorting → deduplicate → limit. R(t) cho reviewed cards tính tại request hoặc materialized snapshot (quyết định NF-02 cron 00:00 cần team duyệt).
- **Persistence design:** Đọc Deck/Flashcard, ConceptNode/ConceptRelation, UserCardState (due, suspension, S/last_review), UserConceptMastery (M, flag), User daily_goal/target retention; đề xuất indexes due và user/card.
- **Cross-team input:** Member 1: authenticated learner, daily_goal config. Member 2: Concept DAG and AI cards. Member 4: Deck/Flashcard + prerequisite model. Member 3 UC-05.3: due/state. Member 5: dashboard and study UI.

## Proposed Code Location (subject to actual repository layout)

- `src/UrSpace.Application/Learning/DailyLearningQueue/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Nhận** — Nhận limit optional trong policy..
2. **Filter** — Filter per-user và permitted decks..
3. **Trả** — Trả [] nếu không có thẻ; không dùng HTTP 404 cho empty queue..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] S-02 và S-05 tiêu thụ được DTO.


## Test Cases (Given / When / Then)

- **TC-UC05.1-03-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Nhận limit optional trong policy.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.1-03-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Filter per-user và permitted decks.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.1-03-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Trả [] nếu không có thẻ; không dùng HTTP 404 cho empty queue.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `GET /api/v1/learning/queue/today`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 1: authenticated learner, daily_goal config. Member 2: Concept DAG and AI cards. Member 4: Deck/Flashcard + prerequisite model. Member 3 UC-05.3: due/state. Member 5: dashboard and study UI.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
