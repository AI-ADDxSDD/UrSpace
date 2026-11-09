---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4: Testing and Verification

> **Status: PENDING — PLAN ONLY.** Deliverables are expected, not verified. Owner: Member 3; parent: [UC-06.1 plan](./plan.md).

## Overview

Unit/integration/negative tests.

**Objective:** Kiểm tra regression và graph edge cases.  
**Timebox:** 18–19/11/2026 (W2 — proposed); mỗi phase là phân rã kỹ thuật, không nhất thiết tương đương một ngày riêng.  
**Expected output:** Graph test suite and handoff.

## Requirements

### Functional

- Test direct/indirect prerequisite, 2 paths to same node, no ancestors, missing mastery.
- Test duplicate Again, undo and malformed cycle.
- Check graph direction against member2 examples.

### Non-functional and invariants

- Quyền truy cập: dùng principal từ xác thực server; không tin `user_id` đến từ client; kiểm tra Deck/Flashcard ownership trước thao tác.
- Tính nhất quán: các mutation phải transactional khi liên quan nhiều bản ghi; read-only endpoints không tạo state hoặc log ngoài ý muốn.
- Dữ liệu cá nhân: state FSRS, gap, session, history được tách theo learner, không để public deck làm lộ trạng thái học riêng.
- Audit: sử dụng log/event khi thay đổi lịch học; không sửa/ẩn history không có policy.
- Phiên bản: ghi rõ algorithm/version, schema version, API version và các quyết định chưa phê duyệt.
- Hiệu năng: nếu phase tác động queue/review thì hướng tới SRS P95 <200ms; phải đo và ghi dataset/hardware thay vì cam kết chưa chứng minh.

## Architecture

- **Controller/API contract:** `GET /api/v1/learning/gaps`; tên route/JSON naming dự kiến và phải khớp OpenAPI của nhóm.
- **Service boundary:** Pure DAG traversal & GapScorer, PostgreSQL relation fetch batched, event handler, xUnit graph fixtures.
- **Business/algorithm policy:** Reverse graph traversal BFS/DFS with visited set; path-strength product of edge weights (candidate policy); rank A(u). M(v) and R(t) definitions per concept to be agreed; graph traversal is read-only.
- **Persistence design:** ConceptRelation(source_node_id,target_node_id,relation_type,weight), UserConceptMastery(user_id,concept_id,mastery_score,is_flagged_gap,last_evaluated_at), ReviewLog; đề xuất GapDetectionEvent(review_id, concept_id, score, policy_version, path_info).
- **Cross-team input:** Member 2: consistent DAG edge conventions, graph data, cycle validation. Member 3 UC-05.3: committed Again event. Member 4: Concept/Flashcard mappings + node highlight. Member 1: UserConceptMastery schema. Member 5: warning banner.

## Proposed Code Location (subject to actual repository layout)

- `src/SmartLearn.Application/Learning/KnowledgeGap/` — domain service, policies, request/response DTOs.
- `src/SmartLearn.Api/Controllers/LearningController.cs` — HTTP facade/validation.
- `src/SmartLearn.Infrastructure/Persistence/` — EF repository, mapping, approved migrations.
- `tests/SmartLearn.UnitTests/Learning/` — deterministic unit cases.
- `tests/SmartLearn.IntegrationTests/Learning/` — PostgreSQL integration and authentication tests.

Các đường dẫn `src/SmartLearn.*` chỉ là **đề xuất**, không khẳng định repository đã có cấu trúc đó. Cần map với cấu trúc thật do nhóm khởi tạo.

## Implementation Steps

1. **Test** — Test direct/indirect prerequisite, 2 paths to same node, no ancestors, missing mastery..
2. **Test** — Test duplicate Again, undo and malformed cycle..
3. **Check** — Check graph direction against member2 examples..

4. Viết focused unit tests để chốt expected results trước khi nối DB/API.
5. Trao đổi contract với các thành viên liên quan; chỉ sửa schema chung bằng PR được review.
6. Đưa happy-path, rejection-path, retry/concurrency-path vào integration test; ghi test commands và kết quả.
7. Cập nhật `plan.md` status chỉ khi có bằng chứng thực thi, không mark done từ kế hoạch.

## Success Criteria

- [ ] Stable scores and deterministic alert set.


## Test Cases (Given / When / Then)

- **TC-UC06.1-04-1**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Test direct/indirect prerequisite, 2 paths to same node, no ancestors, missing mastery.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC06.1-04-2**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Test duplicate Again, undo and malformed cycle.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **TC-UC06.1-04-3**: Given dữ liệu fixture hợp lệ và quyền phù hợp; When thực hiện bước “Check graph direction against member2 examples.”; Then đầu ra/thay đổi DB khớp đúng acceptance, không sửa state của user khác.
- **Negative case:** Given user không có quyền, thẻ/Deck không tồn tại hoặc giá trị đầu vào sai; When gọi `GET /api/v1/learning/gaps`; Then trả lỗi thống nhất, không có side effect.
- **Concurrency/replay case:** Given cùng thao tác được retry hoặc hai thao tác tranh chấp; When chạy đồng thời; Then trạng thái cuối được quyết định theo transaction/concurrency policy, không có update/log nhân đôi.

## Risks and Mitigations

- **R1 — Chưa chốt contract:** Đừng tự tuyên bố route/DTO, DB, metric, thuật toán là approved; dựng mock để unblock và xin review.
- **R2 — Referential integrity & privacy:** Foreign keys, user scope, indexes và negative tests trước khi tích hợp.
- **R3 — Thiếu nguồn tham chiếu thuật toán:** Dùng version-specific test fixtures; kết quả chưa có reference không ghi là verified.

## Dependencies / Handoff

Member 2: consistent DAG edge conventions, graph data, cycle validation. Member 3 UC-05.3: committed Again event. Member 4: Concept/Flashcard mappings + node highlight. Member 1: UserConceptMastery schema. Member 5: warning banner.

## Evidence to attach upon implementation

- Commit/PR URL và reviewer.
- Command `dotnet test` + console output + fixture summary.
- OpenAPI example và HTTP response captures (masked sensitive data).
- DB migration/rollback result và benchmark nếu liên quan.
