---
title: "UC-07.6 Learning History — Xem lịch sử học tập"
description: "DRAFT — Member 3: Trả về lịch sử phiên học và các ReviewLog cùng thống kê theo thời gian, hỗ trợ filter/phân trang và privacy."
status: pending
priority: P2
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc053-fsrs-rating, 261109-uc054-undo-rating]
blocks: []
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-07.6 Learning History — Xem lịch sử học tập

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Trả về lịch sử phiên học và các ReviewLog cùng thống kê theo thời gian, hỗ trợ filter/phân trang và privacy.

**Actor:** Learner  
**Dự kiến triển khai:** W3 (25–26/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | GET /api/v1/learning/history (route đề xuất) |
| Preconditions | Learner authenticated; ReviewLog ghi có tính audit; StudySession chỉ có khi nhóm chốt entity. |
| Main flow | Read-only API filter from/to (UTC after TZ conversion), deck_id, mode, cursor; joins ReviewLog and StudySession; đánh dấu undone theo UndoEvent; trả review_count, durations, rating distribution và tỷ lệ nhớ ước lượng theo định nghĩa nhóm. Không được đánh đồng FSRS R(t) predicted với tỷ lệ trả lời đúng thực tế. |
| Exceptions | Không có log; invalid date range; unknown deck; user khác; review undone; legacy reviews không session; timezone boundary; pagination across new concurrent writes. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-07.6 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-07.6 không có hàng riêng trong bảng §2.2 của SRS hiện tại; phạm vi lấy từ assignment.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Cursor pagination on (reviewed_at,id); aggregate only effective review events; define actual recall proxy e.g. Again=failed, otherwise recalled, if team approves; FSRS predicted retrievability as separate metric.  
**Database impact:** ReviewLog append-only; optional StudySession/StudySessionItem; UndoEvent; indexes (user_id,reviewed_at,id), (user_id,card_id,reviewed_at); no denormalized stats without data correctness test.  
**Application architecture:** ASP.NET Core GET /learning/history, EF Core projections, cursor & pagination, indexed PostgreSQL queries, xUnit aggregate tests.  
**Principal API proposal:** `GET /api/v1/learning/history` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [History Metrics Contract](./phase-01-requirements-and-contract.md) | Pending | P2 | Metric dictionary, DTO and test expected totals. |
| 2 | [Read Model and Pagination](./phase-02-domain-and-persistence.md) | Pending | P2 | HistoryQueryService and indexes proposal. |
| 3 | [REST API and Dashboard Handoff](./phase-03-api-and-integration.md) | Pending | P2 | GET history + Swagger fixtures. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | Integration tests, example fixtures, benchmark. |


## Dependencies & Downstream Touchpoints

Member 3 UC-05.3 review logs; UC-05.4 undo events; UC-06.2 sessions; Member5 results/statistics; Member1 DB migrations; Member4 Deck names.

**Implementation order:** 261109-uc053-fsrs-rating, 261109-uc054-undo-rating → UC-07.6. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** Không có trực tiếp trong bundle này.

## Acceptance Criteria / Definition of Done

- [ ] Không thể đọc log của học viên khác, kể cả qua session ID/deck ID.
- [ ] Date range/filters và cursor trả kết quả ổn định, không duplicate pagination.
- [ ] Undo có trạng thái effective rõ; raw audit không mất.
- [ ] Các con số tổng quan đối chiếu được với fixture ReviewLog, phân biệt predicted vs observed.
- [ ] Empty history trả cấu trúc hợp lệ và không phát sinh write.


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
