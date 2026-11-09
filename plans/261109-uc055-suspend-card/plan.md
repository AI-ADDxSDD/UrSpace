---
title: "UC-05.5 Suspend / Unsuspend Card — Tạm ẩn thẻ"
description: "DRAFT — Member 3: Cho phép học viên tạm ẩn một thẻ khỏi lịch ôn của riêng mình mà không xoá nội dung thẻ, lịch sử hoặc chỉ số FSRS."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: []
blocks: [261109-uc051-daily-learning-queue, 261109-uc058-selected-deck-review, 261109-uc056-exam-cram, 261109-uc062-prerequisite-remediation]
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.5 Suspend / Unsuspend Card — Tạm ẩn thẻ

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Cho phép học viên tạm ẩn một thẻ khỏi lịch ôn của riêng mình mà không xoá nội dung thẻ, lịch sử hoặc chỉ số FSRS.

**Actor:** Learner  
**Dự kiến triển khai:** W1 (13/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | PATCH /api/v1/learning/cards/{cardId}/suspension (route đề xuất) |
| Preconditions | Đã xác thực; thẻ có thể học; quyền sở hữu/học được kiểm tra qua Deck. |
| Main flow | Đặt is_suspended theo cặp user_id/card_id và lưu suspended_at/suspension_reason tuỳ contract. Lệnh idempotent; không sửa due, S, D hay ReviewLog. Queue service dùng chung điều kiện exclude suspended. Bỏ suspend không kích hoạt chấm điểm hoặc reset schedule; thẻ quay lại xét due theo dữ liệu cũ. |
| Exceptions | Thẻ mất quyền, deck không tồn tại, user gửi nhiều lần cùng trạng thái, review xảy ra đồng thời với suspend, status chưa có UserCardState cho thẻ mới. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.5 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.5 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Idempotent toggle; authorization-first; centralized eligibility predicate không tạo mỗi nơi một quy tắc.  
**Database impact:** Đề xuất UserCardState.is_suspended BOOLEAN DEFAULT FALSE và suspended_at TIMESTAMPTZ NULL (hoặc bảng UserCardPreference tách riêng nếu cơ chế FSRS không chấp nhận trạng thái cho thẻ mới); unique user/card.  
**Application architecture:** ASP.NET Core PATCH API, EF Core transaction/upsert, service shared eligibility predicate, PostgreSQL index (user_id, card_id).  
**Principal API proposal:** `PATCH /api/v1/learning/cards/{cardId}/suspension` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Contract and Authorization](./phase-01-requirements-and-contract.md) | Pending | P1 | Request/response DTO và test matrix. |
| 2 | [Persistence and Domain Service](./phase-02-domain-and-persistence.md) | Pending | P1 | SuspendService, repository method và migration review. |
| 3 | [Queue Integration](./phase-03-api-and-integration.md) | Pending | P1 | Eligibility predicate và API integration. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | xUnit, fixtures và bug list. |


## Dependencies & Downstream Touchpoints

Member 1: EF entity/migration và auth; Member 4: deck/card ownership; Member 5: UI action + refresh queue.

**Implementation order:** Chưa có predecessor trong 9 UC của Member 3 → UC-05.5. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** UC-05.1, UC-05.8, UC-05.6, UC-06.2.

## Acceptance Criteria / Definition of Done

- [ ] Suspend và unsuspend lặp là idempotent.
- [ ] Thẻ suspend không xuất hiện ở daily queue, selected-deck queue, cram và remediation.
- [ ] Lịch sử, due, D/S trước và sau suspend giữ nguyên.
- [ ] Thẻ suspended của user A không làm thay đổi user B.
- [ ] Thẻ chưa có state vẫn có thể được suspend thông qua user-specific row/upsert an toàn.


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
