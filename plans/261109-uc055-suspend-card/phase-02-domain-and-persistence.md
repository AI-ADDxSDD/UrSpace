---
phase: 2
title: "Persistence and Domain Service"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Persistence and Domain Service

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.5 plan](./plan.md).

## Overview

Đề xuất migration, viết update theo cặp user/card, hỗ trợ state chưa tồn tại theo contract.

**Objective:** Thêm field preference và service.  
**Timebox:** 13/11/2026 (W1 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** SuspendService, repository method và migration review.

## Requirements

### Functional

- Thêm unique constraint + default.
- Thực thi PATCH idempotent, validate access.
- Không xoá ReviewLog hoặc reset due/D/S.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `PATCH /api/v1/learning/cards/{cardId}/suspension`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** ASP.NET Core PATCH API, EF Core transaction/upsert, service shared eligibility predicate, PostgreSQL index (user_id, card_id).
- **Business/algorithm policy:** Idempotent toggle; authorization-first; centralized eligibility predicate không tạo mỗi nơi một quy tắc.
- **Persistence design:** Đề xuất UserCardState.is_suspended BOOLEAN DEFAULT FALSE và suspended_at TIMESTAMPTZ NULL (hoặc bảng UserCardPreference tách riêng nếu cơ chế FSRS không chấp nhận trạng thái cho thẻ mới); unique user/card.
- **Cross-team input:** Member 1: EF entity/migration và auth; Member 4: deck/card ownership; Member 5: UI action + refresh queue.

## Proposed Code Location (subject to actual repository layout)

- `src/UrSpace.Application/Learning/SuspendCard/` — domain service, policies, request/response DTOs.
- `src/UrSpace.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/UrSpace.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/UrSpace.UnitTests/Learning/` — deterministic unit cases.
- `tests/UrSpace.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/UrSpace.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Thêm** — Thêm unique constraint + default..
2. **Thực** — Thực thi PATCH idempotent, validate access..
3. **Không** — Không xoá ReviewLog hoặc reset due/D/S..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Bật/tắt thành công; row thuộc đúng user.


## Test Cases (Given / When / Then)

- **TC-UC05.5-02-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Thêm unique constraint + default.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.5-02-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Thực thi PATCH idempotent, validate access.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.5-02-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Không xoá ReviewLog hoặc reset due/D/S.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `PATCH /api/v1/learning/cards/{cardId}/suspension`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 1: EF entity/migration và auth; Member 4: deck/card ownership; Member 5: UI action + refresh queue.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
