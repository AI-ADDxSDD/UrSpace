---
phase: 1
title: "Requirements and Safe Scheduling Policy"
status: pending
priority: P2
dependencies: []
---

# Phase 1: Requirements and Safe Scheduling Policy

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.6 plan](./plan.md).

## Overview

Define exam date at local midnight, daily load, per deck scope, scarce capacity and priority.

**Objective:** Validate 1–30 days and decide non-destructive overlay.  
**Timebox:** 23–24/11/2026 (W3 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Policy decision record and DTO.

## Requirements

### Functional

- Confirm mode is temporary overlay.
- Define day range and time-zone edge cases.
- Define what happens if cards exceed total capacity.

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

- `src/UrSpace.Application/Learning/ExamCram/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Confirm** — Confirm mode is temporary overlay..
2. **Define** — Define day range and time-zone edge cases..
3. **Define** — Define what happens if cards exceed total capacity..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] No claim of guaranteed memory peak or unverified formula.


## Test Cases (Given / When / Then)

- **TC-UC05.6-01-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Confirm mode is temporary overlay.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.6-01-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Define day range and time-zone edge cases.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.6-01-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Define what happens if cards exceed total capacity.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
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
