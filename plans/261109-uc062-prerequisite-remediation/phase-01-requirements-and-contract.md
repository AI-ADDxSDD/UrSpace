---
phase: 1
title: "Remediation Selection Rules"
status: pending
priority: P1
dependencies: []
---

# Phase 1: Remediation Selection Rules

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-06.2 plan](./plan.md).

## Overview

Agree gap event → concept → cards, cap and empty-state; align session reporting with Member5.

**Objective:** Chốt core-card selection and session lifecycle.  
**Timebox:** 20–22/11/2026 (W2 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Functional contract and test fixtures.

## Requirements

### Functional

- Define card count cap, topological ordering.
- Define when remediation session is complete.
- Define missing/no eligible cards response.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `POST /api/v1/learning/remediation-sessions`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** RemediationService, StudySession repository, transaction/idempotency; shared QueueEligibility, EF Core/PostgreSQL.
- **Business/algorithm policy:** Prioritize lower-level weak prerequisites with gap score, topo order, stable tie-break, cap cards to avoid overload. Source graph is read-only.
- **Persistence design:** Proposed StudySession(id,user_id,type=REMEDIATION,started_at,status,source_gap_id), StudySessionItem(session_id,card_id,order_no,source_concept_id); Foreign keys per-user; no automatic duplication of Flashcard.
- **Cross-team input:** Member 3 UC-06.1 gap data and UC-05.3 rating. Member 2 DAG. Member 4 flashcard/Deck mapping. Member 5 remediation interface and session lifecycle. Member 1 DB migrations.

## Proposed Code Location (subject to actual repository layout)

- `src/UrSpace.Application/Learning/PrerequisiteRemediation/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Define** — Define card count cap, topological ordering..
2. **Define** — Define when remediation session is complete..
3. **Define** — Define missing/no eligible cards response..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Given gap → expected card IDs clearly documented.


## Test Cases (Given / When / Then)

- **TC-UC06.2-01-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Define card count cap, topological ordering.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC06.2-01-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Define when remediation session is complete.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC06.2-01-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Define missing/no eligible cards response.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `POST /api/v1/learning/remediation-sessions`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 3 UC-06.1 gap data and UC-05.3 rating. Member 2 DAG. Member 4 flashcard/Deck mapping. Member 5 remediation interface and session lifecycle. Member 1 DB migrations.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
