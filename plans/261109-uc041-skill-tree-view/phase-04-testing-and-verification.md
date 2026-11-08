---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

16 tình huống nghiệm thu UC-04.1. **Chưa chạy test ứng dụng/API/DB/browser**; nhiệm vụ hiện tại kiểm tra bộ tài liệu.

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
| AC01 | Deck có ACTIVE/DRAFT mixed nodes edges | GET graph | Chỉ ACTIVE cùng Deck, content version khớp, no staging |
| AC02 | EdgeU→V | render | U nềntrướcV, mũi tên đúng; không đảo prerequisites |
| AC03 | Deck 0/1 node và isolated node | open | Empty state hoặc một/isolated node hợp lệ, không AI minimum |
| AC04 | Response dangling/duplicate IDs/cycle | load | GRAPH_INVALID/error, không silent drop/repaired write |
| AC05 | Ready graph | zoom/pan/drag/Fit/Reset | Giới hạn zoom đúng, chỉ viewport local, no POST/PUT |
| AC06 | Viewport đã pan, selected node | refetch hoặc đóng drawer | Viewport không reset; đổiDeckmớifit |
| AC07 | State NEW/reps 0, even state exists | render | UNLEARNED gray, empty Concept gray |
| AC08 | MộtcardR.95 reviewed +card NEW/null | render | LEARNING blue, không aggregate bỏ null cho Green |
| AC09 | All ACTIVE reviewed R≥.9 hoặc GAP flag | render | MASTERED green hoặc GAP red priority; M.85 không đổi threshold |
| AC10 | A/BđọcPublic | GET same graph | Chỉ metrics của viewer, no pin/owner state/source |
| AC11 | Deck private/archive/non owner hoặc logout | open/response về | 404/401 và clear readonly cache, không cross account |
| AC12 | Rthaytheothờigian/study, deck version không đổi | focus/Refresh | Fetch metrics mới private,no-store; không 304 theo chỉ version |
| AC13 | Fixture 300 nodes đa edge | đo zoom/pan trên browser device ghi rõ | Ghi FPS/frame time và target 60 FPS; chưa đo thì chưa pass |
| AC14 | Deck 301+nodes hoặc 50 perDocument nhưng Deck>50 | open | Không cap 50/truncate; list full có cảnh báo ngoài 300 |
| AC15 | Network/503 hoặc chuyển Deck rapid | retry/read responses | GET retry latest context, không ghi hoặc commit state |
| AC16 | Keyboard/HTML list/VIEN/mobile/zoom 200 | navigate graph | Equivalent node access/labels/color+text/focus theoC 11 |

## Related Code Files

Tests chưa tồn tại. Khi có host đặt tests cạnh feature theo convention repo và Backend integration tại project thật; không thêm test framework/package chỉ cho tài liệu. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-04.1-skill-tree-view-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

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

60 FPS chưa đo; renderer/layout engine chưa installed. Không thể suy màu green từM>=.85 hoặc bỏ missingR. >300 ngoài NFR target được hiển thị đầy đủ bằng list. Các AC là kế hoạch chứ không báo cáo pass; gate chưa có mã vẫn còn cho triển khai.
