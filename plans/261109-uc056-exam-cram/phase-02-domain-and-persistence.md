---
phase: 2
title: "Cram Planning Engine"
status: pending
priority: P2
dependencies: [1]
---

# Phase 2: Cram Planning Engine

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.6 plan](./plan.md).

## Overview

Rank weak/gap/due candidates and distribute across remaining days; no permanent FSRS mutation.

**Objective:** Generate constrained plan.  
**Timebox:** 23–24/11/2026 (W3 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Pure CramPlanner + scenario tests.

## Requirements

### Functional

- Compute eligible days and daily slots.
- Dedup across selected deck scope.
- Exclude suspended; preserve baseline due.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `POST /api/v1/learning/cram/preview`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** CramPlanner pure service; preview and activate API; config repository; time-zone abstraction and deterministic date tests.
- **Business/algorithm policy:** Constrained prioritization + schedule overlay; not a mathematically validated FSRS v4.5 “compression formula” unless the team supplies one. State accurately that the approach is a product heuristic.
- **Persistence design:** Proposed ExamCramConfig(user_id,exam_date,timezone,scope_decks,daily_cap,status,created_at); optional ExamCramPlanDay snapshot/version; no mutation to UserCardState due on preview.
- **Cross-team input:** Member 1 user timezone/daily goal; UC-05.1 queue and UC-05.3 ratings; UC-06.1 gap/mastery; Member5 Exam Cram modal S-09 and review UI.

## Proposed Code Location (subject to actual repository layout)

- `src/SmartLearn.Application/Learning/ExamCram/` — domain service, policies, request/response DTOs.
- `src/SmartLearn.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/SmartLearn.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/SmartLearn.UnitTests/Learning/` — deterministic unit cases.
- `tests/SmartLearn.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/SmartLearn.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Compute** — Compute eligible days and daily slots..
2. **Dedup** — Dedup across selected deck scope..
3. **Exclude** — Exclude suspended; preserve baseline due..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Preview reproducible and non-destructive.


## Test Cases (Given / When / Then)

- **TC-UC05.6-02-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Compute eligible days and daily slots.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.6-02-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Dedup across selected deck scope.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.6-02-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Exclude suspended; preserve baseline due.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `POST /api/v1/learning/cram/preview`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 1 user timezone/daily goal; UC-05.1 queue and UC-05.3 ratings; UC-06.1 gap/mastery; Member5 Exam Cram modal S-09 and review UI.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
