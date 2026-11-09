---
phase: 3
title: "API and Derived Data Reconciliation"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3: API and Derived Data Reconciliation

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.4 plan](./plan.md).

## Overview

Expose endpoint, retry behavior, invalidate queue/history, reconcile mastery/gap.

**Objective:** Cập nhật client và downstream projections.  
**Timebox:** 16/11/2026 (W2 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Undo API và event contract.

## Requirements

### Functional

- Idempotent replay với request ID.
- Invalidate queue and history cache.
- Recompute/compensate gap flags theo quyết định nhóm.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `POST /api/v1/learning/reviews/{reviewId}/undo`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** Transactional UndoService, EF Core concurrency token, append-only UndoEvent, OpenAPI error codes.
- **Business/algorithm policy:** Conditional revert latest eligible event; transaction + version compare; recompute derived mastery/gap from effective history or emit compensating event (pending team decision).
- **Persistence design:** ReviewLog immutable + before_state snapshot; UndoEvent (review_id, actor_user_id, created_at, idempotency_key) append-only; UserCardState.version. Không sửa raw ReviewLog nếu yêu cầu immutable; tính trạng thái effective bằng phép loại review undone.
- **Cross-team input:** Member 3 UC-05.3 cung cấp log, snapshot, version. Member 1 hỗ trợ transaction/concurrency; Member 5 nút Undo và history presentation; Member 2 mnemonic downstream nếu có event Again đã phát.

## Proposed Code Location (subject to actual repository layout)

- `src/SmartLearn.Application/Learning/UndoRating/` — domain service, policies, request/response DTOs.
- `src/SmartLearn.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/SmartLearn.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/SmartLearn.UnitTests/Learning/` — deterministic unit cases.
- `tests/SmartLearn.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/SmartLearn.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Idempotent** — Idempotent replay với request ID..
2. **Invalidate** — Invalidate queue and history cache..
3. **Recompute/compensate** — Recompute/compensate gap flags theo quyết định nhóm..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] UI nhận restored state và reason rõ ràng.


## Test Cases (Given / When / Then)

- **TC-UC05.4-03-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Idempotent replay với request ID.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.4-03-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Invalidate queue and history cache.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.4-03-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Recompute/compensate gap flags theo quyết định nhóm.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `POST /api/v1/learning/reviews/{reviewId}/undo`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 3 UC-05.3 cung cấp log, snapshot, version. Member 1 hỗ trợ transaction/concurrency; Member 5 nút Undo và history presentation; Member 2 mnemonic downstream nếu có event Again đã phát.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
