---
title: "UC-05.4 Undo Rating — Hoàn tác lượt chấm"
description: "DRAFT — Member 3: Khôi phục trạng thái FSRS trước lượt review cuối cùng đủ điều kiện; bảo toàn audit và không làm sai dữ liệu downstream."
status: pending
priority: P1
branch: "PROPOSED/member3-plans (not created)"
tags: [backend, member3, csharp, dotnet, postgresql, fsrs, learning-orchestration, planning]
blockedBy: [261109-uc053-fsrs-rating]
blocks: []
created: "2026-11-09"
createdBy: "ChatGPT — draft for review"
source: "member3-assignment + SRS + repository-plan-format"
---

# UC-05.4 Undo Rating — Hoàn tác lượt chấm

> **DRAFT / PENDING** — Đây là kế hoạch, không phải code hoặc test đã hoàn thành. Các route, DTO, class, migration và dates là **proposed**, chờ nhóm phê duyệt. `blockedBy` thể hiện dependency triển khai, không ngăn việc soạn tài liệu hoặc mock trước.

## Overview

Khôi phục trạng thái FSRS trước lượt review cuối cùng đủ điều kiện; bảo toàn audit và không làm sai dữ liệu downstream.

**Actor:** Learner  
**Dự kiến triển khai:** W2 (16/11/2026) theo lịch 3 tuần đề xuất 09–29/11/2026.  
**Phạm vi sở hữu:** Backend service/API/algorithm and tests; frontend thuộc Member 5 và quản lý Deck/Graph thuộc Member 4/2.

### Use Case Contract

| Item | Description |
|---|---|
| Trigger | POST /api/v1/learning/reviews/{reviewId}/undo (route đề xuất) |
| Preconditions | ReviewLog thuộc learner, không bị undo; là latest applicable review của thẻ theo ordering/version. |
| Main flow | Phân quyền và lock state; xác minh review nằm ở cuối chuỗi thay đổi không có rating sau; đọc snapshot_before; tạo UndoEvent append-only; restore UserCardState atomically; xử lý downstream gap/learning metrics bằng recomputation hoặc compensating events theo hợp đồng. |
| Exceptions | Review đã undo, review không phải cuối, unknown reviewId, concurrent rating, thiếu snapshot, async gap flag đã áp dụng, client retry, transaction failure. |
| Success | Đúng các acceptance criteria nêu dưới đây; dữ liệu user khác không bị ảnh hưởng. |
| Out of scope | Không thiết kế lại JWT, toàn bộ Deck UI, Gemini pipeline, admin portal hoặc backend chung của thành viên khác. |

### Source Traceability

- **Assignment:** mục Thành viên 3, UC-05.4 trong bảng phân công nhóm (source of ownership).
- **SRS:** Report 3 (SmartLearn), mô tả entities tại §3.1.5; FSRS §3.4; Knowledge Gap §3.5; Non-functional §4.2; Business Rules §5.1. Riêng UC-05.4 có/được liên hệ trong mô tả chức năng SRS.
- **GitHub plan format:** plan.md + phase-NN Markdown tương tự các UC-03.1/03.2 và UC-02.1/04.1 của nhóm. Không suy ra các plan khác đã triển khai.

## Technical Approach (PROPOSED)

**Stack:** C# ASP.NET Core Web API (.NET 8 hoặc 9, cần xác nhận), EF Core + PostgreSQL, OpenAPI/Swagger; xUnit + PostgreSQL integration tests. Pure services tách khỏi controller, injectable clock, người dùng xác thực từ JWT.  
**Algorithm:** Conditional revert latest eligible event; transaction + version compare; recompute derived mastery/gap from effective history or emit compensating event (pending team decision).  
**Database impact:** ReviewLog immutable + before_state snapshot; UndoEvent (review_id, actor_user_id, created_at, idempotency_key) append-only; UserCardState.version. Không sửa raw ReviewLog nếu yêu cầu immutable; tính trạng thái effective bằng phép loại review undone.  
**Application architecture:** Transactional UndoService, EF Core concurrency token, append-only UndoEvent, OpenAPI error codes.  
**Principal API proposal:** `POST /api/v1/learning/reviews/{reviewId}/undo` (versioning, naming, DTO/error contract cần cả nhóm thống nhất).

**Shared invariants:** user/card state luôn theo từng learner; không đọc dữ liệu riêng của người khác; timestamps lưu UTC, UI định nghĩa local day bằng timezone learner; idempotency/concurrency khi có mutation; audit events được giữ lại. API errors theo envelope SRS §5.2 gồm `timestamp`, `error_code`, `user_message`.

## Phases

| Phase | Name | Status | Priority | Deliverable |
|---|---|---|---|---|
| 1 | [Undo Semantics and Audit Contract](./phase-01-requirements-and-contract.md) | Pending | P1 | Transition matrix + edge cases. |
| 2 | [Transactional Restore](./phase-02-domain-and-persistence.md) | Pending | P1 | UndoService và migration draft. |
| 3 | [API and Derived Data Reconciliation](./phase-03-api-and-integration.md) | Pending | P1 | Undo API và event contract. |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | Test suite và evidence. |


## Dependencies & Downstream Touchpoints

Member 3 UC-05.3 cung cấp log, snapshot, version. Member 1 hỗ trợ transaction/concurrency; Member 5 nút Undo và history presentation; Member 2 mnemonic downstream nếu có event Again đã phát.

**Implementation order:** 261109-uc053-fsrs-rating → UC-05.4. Dependencies bên ngoài là handoff data/contracts, không phải cớ để phát triển ra ngoài phạm vi. Có thể dùng mock/fixture trước khi implementation upstream sẵn sàng.

**Downstream within Member 3:** Không có trực tiếp trong bundle này.

## Acceptance Criteria / Definition of Done

- [ ] State sau undo giống snapshot trước lượt review (bao gồm D/S/due/reps/lapses/state).
- [ ] Review audit vẫn xem được với dấu undone; không xoá lịch sử thô.
- [ ] Undo lặp không tạo tác động thứ hai; undo non-latest bị từ chối.
- [ ] Rating đồng thời không gây lost update.
- [ ] Các flags/metrics chịu ảnh hưởng được tái tính theo rule đã duyệt.


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
