---
title: "UC-05.6 Exam Cram Mode — Ôn thi nước rút"
description: "DRAFT — Member 3: Cho phép learner chọn ngày thi trong 1–30 ngày tới; hệ thống đề xuất kế hoạch ôn ngắn hạn ưu tiên kiến thức yếu và thẻ đến hạn mà không làm hỏng lịch FSRS gốc."
status: pending
priority: P2
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc051-daily-learning-queue, 261109-uc053-fsrs-rating]
blocks: []
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.6 Exam Cram Mode — Ôn thi nước rút

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Cho phép learner chọn ngày thi trong 1–30 ngày tới; hệ thống đề xuất kế hoạch ôn ngắn hạn ưu tiên kiến thức yếu và thẻ đến hạn mà không làm hỏng lịch FSRS gốc.

**Actor:** Learner  
**Dự kiến triển khai:** W3 (23–24/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | POST /api/v1/learning/cram/preview (route đề xuất) |
| Preconditions | Đã xác thực; đã có cards/FSRS state/optional mastery; exam_date trong khoảng local date +1 tới +30 theo SRS BR-08. |
| Main flow | Validate date và limit, scope decks, tính số slots/ngày còn lại, ưu tiên flagged gaps/low mastery/due; trả preview schedule; chỉ persist ExamCramConfig khi activate; không mutate D/S/due trong preview hay activation. Khi learner thực sự chấm thì UC-05.3 update FSRS như bình thường. |
| Exceptions | Ngày thi hôm nay/hết hạn/quá 30 ngày, đổi timezone, nhiều cram config, không đủ slot cho all due cards, suspend, loại thẻ không có mastery, failure in activation. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.6 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.6 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Constrained prioritization + schedule overlay; not a mathematically validated FSRS v4.5 “compression formula” unless the team supplies one. State accurately that the approach is a product heuristic.  
**Database impact:** Proposed ExamCramConfig(user_id,exam_date,timezone,scope_decks,daily_cap,status,created_at); optional ExamCramPlanDay snapshot/version; no mutation to UserCardState due on preview.  
**Application architecture:** CramPlanner pure service; preview and activate API; config repository; time-zone abstraction and deterministic date tests.  
**Principal API proposal:** `POST /api/v1/learning/cram/preview` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Requirements and Safe Scheduling Policy](./phase-01-requirements-and-contract.md) | Pending | P2 | Policy decision record and DTO. |
| 2 | [Cram Planning Engine](./phase-02-domain-and-persistence.md) | Pending | P2 | Pure CramPlanner + scenario tests. |
| 3 | [API, Config and UX Integration](./phase-03-api-and-integration.md) | Pending | P2 | Preview/activate endpoints and Swagger examples. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | Tests and demonstration. |


## Dependencies & Downstream Touchpoints

Member 1 user timezone/daily goal; UC-05.1 queue and UC-05.3 ratings; UC-06.1 gap/mastery; Member5 Exam Cram modal S-09 and review UI.

**Implementation order:** 261109-uc051-daily-learning-queue, 261109-uc053-fsrs-rating → UC-05.6. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** Không có trực tiếp trong bundle này.

## Acceptance Criteria / Definition of Done

- [ ] Chỉ nhận exam date 1–30 ngày tới, tính theo learner timezone.
- [ ] Preview không đổi UserCardState/ReviewLog.
- [ ] Lịch cram có lý do ưu tiên và giới hạn tải/ngày; không suspended/forbidden cards.
- [ ] Activate/re-activate không tạo cấu hình trùng không kiểm soát.
- [ ] Real rating trong cram vẫn chỉ qua FSRS engine, không dùng lịch nén để giả mạo S/D.


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
