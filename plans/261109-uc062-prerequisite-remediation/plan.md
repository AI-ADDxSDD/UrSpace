---
title: "UC-06.2 Prerequisite Remediation — Phiên học bù tiên quyết"
description: "DRAFT — Member 3: Tạo phiên học ngắn gồm flashcards thuộc các khái niệm tiên quyết bị đánh dấu gap; sau khi học phải được chấm bằng FSRS thông thường."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc061-knowledge-gap]
blocks: [261109-uc076-learning-history]
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-06.2 Prerequisite Remediation — Phiên học bù tiên quyết

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Tạo phiên học ngắn gồm flashcards thuộc các khái niệm tiên quyết bị đánh dấu gap; sau khi học phải được chấm bằng FSRS thông thường.

**Actor:** Learner  
**Dự kiến triển khai:** W2 (20–22/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | POST /api/v1/learning/remediation-sessions (route đề xuất) |
| Preconditions | Có gap flag có thể truy vết; có ConceptNode/Flashcard dùng được; user có quyền học Deck liên quan. |
| Main flow | Nhận concept_id hoặc gap_event_id; xác thực learner và gap; chọn prerequisite foundations theo score, topo order nếu cần; lấy core cards thuộc các concept; filter suspended/forbidden; deduplicate; limit; tạo StudySession kiểu REMEDIATION có session items snapshot; không tự coi hoàn thành khi chỉ mở phiên. |
| Exceptions | Gap đã xử lý, không có card cho gap, cards thuộc deck private khác, nhiều gaps trùng thẻ, session tạo hai lần khi retry, concurrent graph update. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-06.2 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-06.2 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Prioritize lower-level weak prerequisites with gap score, topo order, stable tie-break, cap cards to avoid overload. Source graph is read-only.  
**Database impact:** Proposed StudySession(id,user_id,type=REMEDIATION,started_at,status,source_gap_id), StudySessionItem(session_id,card_id,order_no,source_concept_id); Foreign keys per-user; no automatic duplication of Flashcard.  
**Application architecture:** RemediationService, StudySession repository, transaction/idempotency; shared QueueEligibility, EF Core/PostgreSQL.  
**Principal API proposal:** `POST /api/v1/learning/remediation-sessions` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Remediation Selection Rules](./phase-01-requirements-and-contract.md) | Pending | P1 | Functional contract and test fixtures. |
| 2 | [Selection Algorithm](./phase-02-domain-and-persistence.md) | Pending | P1 | RemediationSelector + tests. |
| 3 | [Session Persistence and API](./phase-03-api-and-integration.md) | Pending | P1 | POST remediation sessions + DTOs. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | Integration suite and walkthrough. |


## Dependencies & Downstream Touchpoints

Member 3 UC-06.1 gap data and UC-05.3 rating. Member 2 DAG. Member 4 flashcard/Deck mapping. Member 5 remediation interface and session lifecycle. Member 1 DB migrations.

**Implementation order:** 261109-uc061-knowledge-gap → UC-06.2. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** UC-07.6.

## Acceptance Criteria / Definition of Done

- [ ] Session cards đến từ concepts phù hợp gap và có traceable reasons.
- [ ] Không có duplicate/suspended/forbidden cards.
- [ ] Một action retry không tạo 2 session; empty-gap trả hướng dẫn thay thế, không sinh fake cards.
- [ ] Rating trong session được ghi bình thường qua UC-05.3.
- [ ] StudySession và ReviewLog liên hệ nhất quán để UC-07.6 truy vấn.


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
