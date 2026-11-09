---
title: "UC-05.1 Daily Learning Queue — Hàng đợi ba tầng"
description: "DRAFT — Member 3: Sinh hàng đợi học hôm nay theo ba tầng: gắn cờ lỗ hổng → FSRS đến hạn → khái niệm mới đã mở khoá; tuân thủ limit, privacy và suspension."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc053-fsrs-rating]
blocks: [261109-uc058-selected-deck-review, 261109-uc056-exam-cram, 261109-uc062-prerequisite-remediation]
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.1 Daily Learning Queue — Hàng đợi ba tầng

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Sinh hàng đợi học hôm nay theo ba tầng: gắn cờ lỗ hổng → FSRS đến hạn → khái niệm mới đã mở khoá; tuân thủ limit, privacy và suspension.

**Actor:** Learner  
**Dự kiến triển khai:** W1 (14–15/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | GET /api/v1/learning/queue/today (route đề xuất) |
| Preconditions | User đã xác thực; có bộ thẻ và dữ liệu quyền đọc; UserCardState/ConceptMastery có thể thiếu cho thẻ mới. |
| Main flow | Lấy candidate cards được phép học; bỏ suspended; gán duy nhất tầng ưu tiên cao nhất cho mỗi card; gap ưu tiên 100, due 50, new 10; các due cards sort Retrievability tăng dần theo SRS; new cards chỉ mở nếu mọi direct prerequisites đạt mastery ≥0.85; fill tới limit; trả priority reason, totals, snapshot_at. |
| Exceptions | Không có deck/thẻ; DAG chưa duyệt; mastery thiếu; concept không có prerequisite; due timestamp time zone; quá nhiều gap cards; target daily_goal=10–100 nhưng SRS daily_limit mặc định 30. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.1 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.1 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Deterministic multi-tier selection: eligibility → priority assignment → tier-local sorting → deduplicate → limit. R(t) cho reviewed cards tính tại request hoặc materialized snapshot (quyết định NF-02 cron 00:00 cần team duyệt).  
**Database impact:** Đọc Deck/Flashcard, ConceptNode/ConceptRelation, UserCardState (due, suspension, S/last_review), UserConceptMastery (M, flag), User daily_goal/target retention; đề xuất indexes due và user/card.  
**Application architecture:** ASP.NET Core query endpoint; LINQ/EF Core, SQL indexes; pure QueuePolicy; injectable clock; pagination/limit safe guard.  
**Principal API proposal:** `GET /api/v1/learning/queue/today` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Business Rules and Queue Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Business rules matrix và mock queue response. |
| 2 | [Query and Priority Engine](./phase-02-domain-and-persistence.md) | Pending | P1 | QueueService, repository optimized query và test fixtures. |
| 3 | [HTTP and Client Integration](./phase-03-api-and-integration.md) | Pending | P1 | GET queue + OpenAPI + stub/demo. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | xUnit suite và result sheet. |


## Dependencies & Downstream Touchpoints

Member 1: authenticated learner, daily_goal config. Member 2: Concept DAG and AI cards. Member 4: Deck/Flashcard + prerequisite model. Member 3 UC-05.3: due/state. Member 5: dashboard and study UI.

**Implementation order:** 261109-uc053-fsrs-rating → UC-05.1. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** UC-05.8, UC-05.6, UC-06.2.

## Acceptance Criteria / Definition of Done

- [ ] Một card chỉ xuất hiện một lần và trong tầng ưu tiên cao nhất.
- [ ] Gap cards trước due cards, due trước new; due sort R thấp trước.
- [ ] New concept không được xếp nếu có tiên quyết chưa đạt M ≥ 0.85 (SRS BR-04).
- [ ] Suspended, unauthorized và deleted cards bị loại toàn bộ.
- [ ] Không có dữ liệu trả [] và counts hợp lệ; queue output ổn định với clock fixture.


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
