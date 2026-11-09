---
phase: 2
title: "Queue Filter Implementation"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Queue Filter Implementation

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-05.8 plan](./plan.md).

## Overview

Extend QueueCandidateQuery chứ không sao chép QueueService.

**Objective:** Áp deck filter trước limit.  
**Timebox:** 17/11/2026 (W2 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Deck-scoped query and tests.

## Requirements

### Functional

- Filter deck_id tại DB.
- Apply suspension/priority and prerequisite checks.
- Prevent cross-deck recommendations during selected mode.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `GET /api/v1/learning/decks/{deckId}/queue`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** DeckScopedQueueService composing QueuePolicy + authorization + PostgreSQL indexed deck_id.
- **Business/algorithm policy:** Compose filter before final priority/limit, không lọc sau limit vì sẽ thiếu thẻ phù hợp.
- **Persistence design:** Deck.visibility, owner_id, Flashcard.deck_id, UserCardState.user_id/card_id; deck access checker dùng chung với Member 4.
- **Cross-team input:** Member 4: Deck/card API and permissions; Member 3 UC-05.1: queue engine; Member 1: JWT and access control; Member 5: deck selection UI.

## Proposed Code Location (subject to actual repository layout)

- `src/SmartLearn.Application/Learning/SelectedDeckReview/` — domain service, policies, request/response DTOs.
- `src/SmartLearn.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/SmartLearn.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/SmartLearn.UnitTests/Learning/` — deterministic unit cases.
- `tests/SmartLearn.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/SmartLearn.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Filter** — Filter deck_id tại DB..
2. **Apply** — Apply suspension/priority and prerequisite checks..
3. **Prevent** — Prevent cross-deck recommendations during selected mode..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Một card ngoài deck không xuất hiện.


## Test Cases (Given / When / Then)

- **TC-UC05.8-02-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Filter deck_id tại DB.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.8-02-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Apply suspension/priority and prerequisite checks.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC05.8-02-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Prevent cross-deck recommendations during selected mode.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `GET /api/v1/learning/decks/{deckId}/queue`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 4: Deck/card API and permissions; Member 3 UC-05.1: queue engine; Member 1: JWT and access control; Member 5: deck selection UI.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
