---
title: "UC-06.1 Knowledge Gap Detection — Phát hiện lỗ hổng tri thức"
description: "DRAFT — Member 3: Khi người học chấm Again, truy ngược DAG quan hệ tiên quyết để tìm khái niệm gốc yếu; xếp hạng và gắn cờ cảnh báo riêng cho learner."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc053-fsrs-rating]
blocks: [261109-uc062-prerequisite-remediation, 261109-uc051-daily-learning-queue]
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-06.1 Knowledge Gap Detection — Phát hiện lỗ hổng tri thức

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Khi người học chấm Again, truy ngược DAG quan hệ tiên quyết để tìm khái niệm gốc yếu; xếp hạng và gắn cờ cảnh báo riêng cho learner.

**Actor:** Learner  
**Dự kiến triển khai:** W2 (18–19/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | GET /api/v1/learning/gaps (route đề xuất) |
| Preconditions | Thẻ liên kết một ConceptNode; quan hệ prerequisites là DAG hợp lệ và đã được publish; UserConceptMastery có thể thiếu. |
| Main flow | After committed Again rating, lấy ancestor prerequisite nodes với edge direction đã được chuẩn hoá; tính A(u) = PathStrength × (1 − M(u)) / (Distance+1) theo SRS §3.5.1; đề xuất threshold A≥0.40. SRS BR-05 nêu direct prerequisite R<0.85 gây flag ngay; chưa đồng nhất với A. Chưa gộp hay ưu tiên rule khi chưa được nhóm duyệt. Ghi gap evidence, reason, threshold source và flag per learner; trả list xếp theo score. |
| Exceptions | Graph cycle do dữ liệu sai, thiếu mastery, concept không có tiên quyết, nhiều đường đi tới một ancestor, edge weight ngoài [0,1], cùng Again event được xử lý hai lần, Undo rating, graph updated after review. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-06.1 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-06.1 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Reverse graph traversal BFS/DFS with visited set; path-strength product of edge weights (candidate policy); rank A(u). M(v) and R(t) definitions per concept to be agreed; graph traversal is read-only.  
**Database impact:** ConceptRelation(source_node_id,target_node_id,relation_type,weight), UserConceptMastery(user_id,concept_id,mastery_score,is_flagged_gap,last_evaluated_at), ReviewLog; đề xuất GapDetectionEvent(review_id, concept_id, score, policy_version, path_info).  
**Application architecture:** Pure DAG traversal & GapScorer, PostgreSQL relation fetch batched, event handler, xUnit graph fixtures.  
**Principal API proposal:** `GET /api/v1/learning/gaps` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Rule Reconciliation and Graph Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Decision record, graph direction contract, fixture. |
| 2 | [Reverse Traversal and Scoring](./phase-02-domain-and-persistence.md) | Pending | P1 | GapScorer and graph tests. |
| 3 | [Persistence and Alert Integration](./phase-03-api-and-integration.md) | Pending | P1 | GapEventHandler, GET gaps, alert DTO. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | Graph test suite and handoff. |


## Dependencies & Downstream Touchpoints

Member 2: consistent DAG edge conventions, graph data, cycle validation. Member 3 UC-05.3: committed Again event. Member 4: Concept/Flashcard mappings + node highlight. Member 1: UserConceptMastery schema. Member 5: warning banner.

**Implementation order:** 261109-uc053-fsrs-rating → UC-06.1. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** UC-06.2, UC-05.1.

## Acceptance Criteria / Definition of Done

- [ ] Duyệt đúng hướng prerequisite và dừng an toàn khi DAG bất hợp lệ.
- [ ] Công thức A(u) và score ordering được xác minh bằng fixture độc lập.
- [ ] Không tính/prioritize gap của user khác; cùng event không tạo duplicate alerts.
- [ ] Không tự bịa M/R nếu thiếu data; missing-data policy được chỉ rõ.
- [ ] Undo và graph change có phương án invalidate/recompute đã duyệt.


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
