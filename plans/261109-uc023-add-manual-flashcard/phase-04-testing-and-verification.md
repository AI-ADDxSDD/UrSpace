---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-02.3. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

## Requirements

- FE test nhỏ cho validation và transition/context có rủi ro, không snapshot lại toàn app.
- Contract/authorization/integration với Backend thật; DB race/receipt/rollback khi có mutation.
- Browser keyboard/screen reader/responsive/VI-EN; graph NFR đo trên fixture/device ghi rõ.
- Không dùng fake client để tuyên bố bảo mật, atomicity hoặc FPS đạt.

## Architecture / Interfaces

Dùng contract phase 1, UI phase 2 và fixtures/gate phase 3; C01–C12 giữ semantics xuyên UC. Read không tạo state; mutate test không được ngầm đổi owner hoặc reset personal data. Các touchpoint chưa triển khai ghi handoff, không pass giả.

### Given / When / Then

| ID | Given | When | Then |
|---|---|---|---|
| AC01 | Owner Deck active có Concept | save card hợp lệ | 201 ACTIVE STANDARD đúng Concept, raw front/back giữ, UI chọn card mới |
| AC02 | Code có 4 space indentation, TAB, LaTeX backslash, decomposed Unicode | preview rồi save/read | Nội dung được giữ, chỉ CRLF→LF; không title trim/NFC làm đổi code |
| AC03 | HTML/script/unsafe URL hoặc ảnh ngoài trong Markdown | preview/list/detail | Sanitize, không script hay tự fetch ảnh ngoài; raw vẫn text |
| AC04 | Front/back blank hoặc 5000/5001,10000/10001 scalar | submit/bypass FE | Required/bounds đúng, Unicode scalar không UTF 16 |
| AC05 | Deck 0 Concept | nhập new_concept.name và save | Tạo Concept thật ACTIVE doc null+card/state cùng transaction, không AI |
| AC06 | Concept ID khác Deck hoặc DRAFT | POST | 400/404 theo authorization, không card/state |
| AC07 | Thiếu cả hai hoặc gửi cả concept_id và new_concept; name 0/255/256 | POST | Exactly-one và bounds; lỗi giữ draft |
| AC08 | Card mới vừa tạo | đọc queue/graph | Owner state NEW/reps 0/DueNow; node chưa học, không state tác giả khác |
| AC09 | Failure sau insert Concept/card trước state | transaction rollback | Không Concept/card/state dở, receipt không riêng lẻ |
| AC10 | Non-owner Public, Guest, Deck archived | POST trực tiếp | 403/401/409 DECK_ARCHIVED; không auto restore |
| AC11 | Owner khác vừa sửa Deck | save version cũ | 409 giữ draft; không tự bump rồi overwrite |
| AC12 | Double-click/Enter và network delay | save | Một operation in-flight và đúng một card/Concept |
| AC13 | Commit rồi drop response, reload/retry 429 | reconcile | Cùng key/body, replay same ID; target deleted 410, không create đôi |
| AC14 | Draft dirty, storage fail hoặc Cancel | save/hủy | Storage fail không POST; cancel trước gửi không side effect; focus đúng |
| AC15 | Success nhưng refresh list lỗi | reload list | Không tạo lại card; upsert ID/dedup, lưu success riêng |
| AC16 | VI/EN, IME, mobile/zoom, keyboard | soạn/preview/lỗi | Text are as newline, focus/error summary/labels theo C11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.3-add-manual-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Chuẩn bị fixture owner/viewer, authorized/denied, empty/bounds/error từ phase 3.
2. Chạy FE/contract checks cho các AC tương ứng; ghi lỗi và sửa tại boundary.
3. Chạy integration/database/browsers thích hợp, phân biệt evidence thật với mock.
4. Chạy lại phần bị ảnh hưởng sau sửa; ghi kết quả, blocker/handoff và giới hạn.
5. Chỉ nghiệm thu triển khai khi các AC của UC đạt và rủi ro quan trọng đã xử lý.

## Success Criteria

- [ ] AC01–AC16 có kết quả thực và evidence khi triển khai.
- [ ] Không còn lỗi quyền/context/dữ liệu cá nhân hoặc replay/lost update chưa xử lý.
- [ ] Keyboard/labels/errors/focus/mobile/VI-EN được kiểm tra thật.
- [ ] Mọi phần chưa kiểm chứng có giới hạn rõ, không thay status pending chỉ vì review tài liệu.

## Risk Assessment

FK Concept không nullable nên không thể bỏ select or ở Deck rỗng. Renderer/source schema chưa có mã; test preview không thay validation server. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
