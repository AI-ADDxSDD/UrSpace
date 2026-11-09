---
title: "UC-05.3 FSRS Rating — Chấm điểm ghi nhớ"
description: "DRAFT — Member 3: Nhận đúng một rating Again/Hard/Good/Easy (1–4) cho một thẻ; cập nhật trạng thái FSRS v4.5 cho đúng học viên và ghi lịch sử ôn tập trong một giao dịch an toàn."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: []
blocks: [261109-uc051-daily-learning-queue, 261109-uc054-undo-rating, 261109-uc061-knowledge-gap, 261109-uc076-learning-history]
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.3 FSRS Rating — Chấm điểm ghi nhớ

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Nhận đúng một rating Again/Hard/Good/Easy (1–4) cho một thẻ; cập nhật trạng thái FSRS v4.5 cho đúng học viên và ghi lịch sử ôn tập trong một giao dịch an toàn.

**Actor:** Learner  
**Dự kiến triển khai:** W1 (11–12/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | POST /api/v1/learning/reviews (route đề xuất) |
| Preconditions | Đã xác thực; thẻ tồn tại và học viên có quyền học; có cấu hình target retention r (mặc định 0.90 theo SRS BR-02); lịch học ở trạng thái có thể chấm. |
| Main flow | Validate rating nguyên 1–4, card ID và quyền; nhận idempotency_key cho mỗi hành động bấm nút; khóa có kiểm soát bản ghi (user_id,card_id) hoặc optimistic concurrency; đọc previous state; gọi FsrsSchedulerAdapter được khóa version 4.5 và parameter set đã được kiểm thử; ghi UserCardState và ReviewLog cùng transaction; trả previous/next due, state, interval, review_id. Không nhận user_id từ body làm nguồn phân quyền. |
| Exceptions | Rating ngoài 1–4; user không có quyền; thẻ bị xóa/suspend giữa lúc gửi; double-click cùng request ID; hai lần review khác nhau đồng thời; mất kết nối sau khi DB commit; tham số target-retention bị cấu hình sai. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.3 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.3 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** FSRS v4.5, dùng official/reproducible reference vectors đã được xác minh; không trộn công thức hay weight của version khác. Tính Retrievability theo đúng phiên bản được chọn; time zone và today boundary được xác định riêng.  
**Database impact:** UserCardState composite unique (user_id, card_id), stability, difficulty, reps, lapses, state, due, last_review_at, version; ReviewLog append-only với user_id, card_id, rating, elapsed_days, scheduled_days, duration_ms, reviewed_at, request_id, snapshot_before. Cột thêm là đề xuất cần Member 1 duyệt.  
**Application architecture:** ASP.NET Core controller + pure FsrsSchedulerAdapter + ReviewService + EF Core/PostgreSQL transaction + xUnit golden tests; API DTOs typed; DI, clock abstraction.  
**Principal API proposal:** `POST /api/v1/learning/reviews` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Requirements and Reference Lock](./phase-01-requirements-and-contract.md) | Pending | P1 | Bảng mapping field C# ↔ DB; DTO; scenarios; reference-vector manifest. |
| 2 | [FSRS Engine and Persistence](./phase-02-domain-and-persistence.md) | Pending | P1 | FsrsSchedulerAdapter, ReviewService, StateRepository, schema delta draft. |
| 3 | [API Integration and Downstream Events](./phase-03-api-and-integration.md) | Pending | P1 | POST review API + OpenAPI + integration contract với Member 5. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | xUnit suite, test matrix, fixture, trace evidence. |


## Dependencies & Downstream Touchpoints

Member 1: UserCardState/ReviewLog schema, JWT claims, target_retention config và migration policy. Member 4: Flashcard/Deck IDs và access policy. Member 5: 4 nút rating, session_id, client request ID.

**Implementation order:** Chưa có predecessor trong 9 UC của Member 3 → UC-05.3. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** UC-05.1, UC-05.4, UC-06.1, UC-07.6.

## Acceptance Criteria / Definition of Done

- [ ] Chỉ chấp nhận rating 1–4 theo SRS BR-01; kết quả sai bị từ chối có error_code thống nhất.
- [ ] Một idempotency_key gửi lặp không tạo 2 ReviewLog và không lên lịch hai lần.
- [ ] Cập nhật state và thêm review log là atomic; rollback đồng thời nếu một bước thất bại.
- [ ] Các test vectors FSRS v4.5 được so sánh với nguồn reference đã pin version, bao gồm New/Learning/Review/Relearning.
- [ ] Hai học viên cùng học một thẻ không chia sẻ state; trả đúng due và metadata cho client.


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
