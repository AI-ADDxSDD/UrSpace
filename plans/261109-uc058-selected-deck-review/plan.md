---
title: "UC-05.8 Selected Deck Review — Ôn tập theo bộ thẻ"
description: "DRAFT — Member 3: Lấy danh sách thẻ học/ôn của duy nhất một bộ Deck đã được người dùng chọn, tái sử dụng cùng policy của daily queue."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc051-daily-learning-queue]
blocks: []
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.8 Selected Deck Review — Ôn tập theo bộ thẻ

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Lấy danh sách thẻ học/ôn của duy nhất một bộ Deck đã được người dùng chọn, tái sử dụng cùng policy của daily queue.

**Actor:** Learner  
**Dự kiến triển khai:** W2 (17/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | GET /api/v1/learning/decks/{deckId}/queue (route đề xuất) |
| Preconditions | Learner có quyền xem/học Deck; deck không bị xóa; thẻ tồn tại hoặc trả empty. |
| Main flow | Validate deck ID và permission; thực thi QueryCandidates với deck_id mandatory; dùng queue policy + suspended filter; trả deck metadata, queue items và counts; không tự fork public deck hay cấp ownership. |
| Exceptions | Deck private của người khác, chưa fork, deck rỗng, card thuộc deck khác, deletion race, id mismatch, gap cards thuộc deck khác. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.8 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.8 không có hàng riêng trong bảng §2.2 của SRS hiện tại; phạm vi lấy từ assignment.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Compose filter before final priority/limit, không lọc sau limit vì sẽ thiếu thẻ phù hợp.  
**Database impact:** Deck.visibility, owner_id, Flashcard.deck_id, UserCardState.user_id/card_id; deck access checker dùng chung với Member 4.  
**Application architecture:** DeckScopedQueueService composing QueuePolicy + authorization + PostgreSQL indexed deck_id.  
**Principal API proposal:** `GET /api/v1/learning/decks/{deckId}/queue` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Deck Access and Filter Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Deck permission matrix and DTO. |
| 2 | [Queue Filter Implementation](./phase-02-domain-and-persistence.md) | Pending | P1 | Deck-scoped query and tests. |
| 3 | [API and UI Handoff](./phase-03-api-and-integration.md) | Pending | P1 | HTTP endpoint and examples. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | xUnit and integration evidence. |


## Dependencies & Downstream Touchpoints

Member 4: Deck/card API and permissions; Member 3 UC-05.1: queue engine; Member 1: JWT and access control; Member 5: deck selection UI.

**Implementation order:** 261109-uc051-daily-learning-queue → UC-05.8. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** Không có trực tiếp trong bundle này.

## Acceptance Criteria / Definition of Done

- [ ] Toàn bộ thẻ output có deck_id đúng tham số và quyền truy cập.
- [ ] Private deck của người khác không thể truy xuất.
- [ ] Queue không gồm suspended hoặc duplicate cards.
- [ ] Selected deck có thể empty; response nêu đúng counts.
- [ ] Không sửa FSRS state chỉ do mở trang học.


Ngoài acceptance ở trên, cần có PR review, schema/DTO contract, authorization and negative tests, automated test evidence, benchmark khi có SLA và documentation. Chưa chạy test nên toàn bộ checkbox là **unchecked**.

## Risk Assessment

- **Contract drift:** SRS, plans và assignment có khác biệt. Mitigation: assignment quyết định ownership, mọi giả định kỹ thuật gắn nhãn PROPOSED và được review trước code.
- **Data race/privacy:** cần transaction, unique constraint, user scoping và retry/idempotency cho mutation; chạy concurrent integration tests.
- **Unverified performance:** mục tiêu SRS p95 dưới 200ms cho queue/rating là target, không phải bằng chứng đo; chỉ báo kết quả thực nghiệm sau khi có backend.
- **Integration blockers:** dùng contract + fixture sớm; không chỉnh sửa trái quyền ownership files của thành viên khác.

## Validation Log

### 2026-11-09 — Draft planning review

- Nguồn đã đối chiếu: bảng phân công Member 3; Report3 SRS; cấu trúc Markdown trên GitHub UrSpace.
- Kết quả: 4 phase đang pending; chưa có automated test run, chưa có code, chưa tạo branch hay PR.
- Decision status: đề xuất chờ nhóm xác nhận, không khẳng định người dùng hoặc trưởng nhóm đã phê duyệt.
