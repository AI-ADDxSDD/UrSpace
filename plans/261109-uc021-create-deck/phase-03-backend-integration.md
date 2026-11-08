---
phase: 3
title: "Backend Integration"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3 Backend Integration

## Overview

Tích hợp form đã thiết kế ở phase 2 với Backend: mock tối thiểu, bàn giao API, nối auth/POST/read, cập nhật danh sách và điều hướng S-03. Bộ 36 tình huống kiểm thử và gate nghiệm thu được tách sang [phase 4](./phase-04-testing-and-verification.md). Đây là kế hoạch chưa triển khai.

## Requirements

### Phân công và dependency triển khai

| Chủ thể | Deliverable khi triển khai | Gate |
|---|---|---|
| Thành viên 4 — Frontend | Modal dùng chung, validation/display errors, tags/IME, state/retry/storage, keyboard/focus, VI/EN, list callback và điều hướng S-03 | Có thể làm bằng mock; cần host/auth API thật cho nghiệm thu |
| Backend phụ trách Deck/auth | POST contract, actor principal, schema/validation server, Title/UserId/Visibility mapping, unique DB, receipt transaction/replay, error envelope, read Deck và list refresh interface | Chặn end-to-end nếu thiếu; không giao FE viết migration |
| Nhóm UC-03.1 | Auto Deck naming/owner/defaults/response; kiểm tra Deck đích; upload operation replay riêng | Chặn tuyên bố tương thích upload hoàn chỉnh, không chặn manual form |
| Nhóm UC-03.6 | Gỡ suy diễn Public→source access khi triển khai; policy nguồn riêng, không tự dựng membership | Không cần citation viewer để tạo Deck; không được tuyên bố source privacy đã được code bảo vệ |
| Nhóm UC-02.6/02.7/02.8 | Nhận DeckId, owner/visibility invariants; không copy personal state; card/concept flow không Document | Điểm bàn giao, chưa triển khai các UC này |

Khi các nhóm triển khai, ghi kết quả integration trong task thực tế; không đổi status pending trong bộ tài liệu này chỉ vì đã hoàn tất review tài liệu.

### Mock tối thiểu cho Frontend

Một fake API tại boundary client là đủ; không cần mock server framework/package, Docker, Redis, Hangfire hay database cho development UI. Mock có hai identity thuộc hai actor, vài Deck owner A/B, key receipt trong memory, callback collection và một transport có thể cố ý bỏ response. Implement sau này, **chưa có mock code trong repository**.

| Mode | Hành vi mock cần có |
|---|---|
| Create | 201 + projection count0 + Location; lưu một Deck và receipt theo owner/key |
| Duplicate | 409 title với error envelope; owner khác cùng title vẫn thành công |
| Validation | 400 field errors, visibility sai/owner extra field không được nhận |
| Auth/permission | 401/403; subject switch, response cũ không áp lên subject mới |
| Latency / unknown | Delay để thử double-submit/close; commit rồi drop response, replay cùng key trả200 cùng ID |
| Retry conflict / delete | Cùng key khác body409 + existing_deck_id; xóa Deck giữ receipt rồi replay410 |
| Availability | 429 + Retry-After, 503, timeout; refresh list/detail lỗi độc lập create |

Mock receipt trong memory chỉ mô phỏng UI; không chứng minh transaction/race/persistence sau restart. FE test nhỏ cần cover validation + state/replay và integration component có keyboard, không snapshot toàn Dashboard. Backend bắt buộc kiểm tra unique/replay thật trên PostgreSQL, không dùng EF in-memory để kết luận về DB constraints.

## Architecture / Interfaces

Nguồn contract duy nhất là [phase 1](./phase-01-requirements-and-deck-contract.md); nguồn hành vi form là [phase 2](./phase-02-create-deck-form-and-state.md). API đang đề xuất: `POST /api/v1/decks`; read S-03 đề xuất `GET /api/v1/decks/{deck_id}`. Không coi upload controller, SSE, AI commit hoặc source streaming là implementation của create Deck.

Backend bàn giao schema DTO/error examples thực, fixture canonicalization/hash UTF-8 v1 và bằng chứng index/receipt atomic trước nối thật. FE kiểm tra response snake_case, enum string và `user_id` cùng subject; không viết adapter nhiều chuẩn wire để che contract lệch. Các field không đúng được sửa tại contract boundary.

## Related Code Files

Không có file ứng dụng hiện tại. Khi triển khai, dùng API/auth client, host S-02/S-03, module form và cơ chế cache/router thực tế; không tạo abstraction hoặc dependency mới chỉ để nối API. Mock đặt cạnh boundary client của feature theo cấu trúc host.

Tài liệu liên quan: [plan](./plan.md), [contract](./phase-01-requirements-and-deck-contract.md), [form](./phase-02-create-deck-form-and-state.md), [kiểm thử và nghiệm thu](./phase-04-testing-and-verification.md), [brainstorm và đối chiếu nguồn](../reports/2026-11-09-uc-02.1-create-deck-brainstorm.md).

## Implementation Steps

1. Dựng fake client nhỏ đúng các mode trên để Frontend làm độc lập; phase 2 có thể đọc trước đặc tả mock này, không cần đợi Backend thật.
2. Nhận DTO/error examples, fixture canonicalization/hash v1 và bằng chứng index/receipt atomic từ Backend; đối chiếu contract phase 1 trước khi nối thật.
3. Nối auth/POST/read qua client của host; gửi cùng key/body khi recovery, giữ owner scope và xử lý đúng các mã lỗi.
4. Nối callback upsert theo DeckId, invalidate/refetch các danh sách owner và điều hướng S-03; giữ lỗi tải danh sách/detail tách khỏi kết quả create.
5. Ghi các handoff UC-03.1/03.6/02.6/02.7/02.8 còn chờ; bàn giao môi trường tích hợp và dữ liệu thử cho phase 4. Không thực thi các UC đó trong UC-02.1.

## Success Criteria

- [ ] FE có thể phát triển độc lập bằng mock nhỏ, không cần queue/AI.
- [ ] Auth/POST/read và list callback đúng contract; Backend đã cung cấp validation, unique DB và receipt atomic để bắt đầu nghiệm thu thật.
- [ ] Success/replay dùng projection server theo ID, cập nhật danh sách và điều hướng đúng; refresh lỗi không POST create lại.
- [ ] Handoff liên quan đã được ghi rõ, không coi upload/source policy đã triển khai.
- [ ] Bộ kiểm thử và gate nghiệm thu chuyển đầy đủ sang phase 4, không đánh dấu pass chỉ vì đã nối API.

## Risk Assessment

Mock không chứng minh bảo mật hoặc DB concurrency. Backend/host chưa tồn tại nên chưa xác nhận API/auth/route/latency thật; thiếu contract hoặc receipt bền vững sẽ chặn tích hợp thật. Upload naming/replay và source privacy vẫn là handoff của các UC tương ứng. Phase 4 kiểm chứng kết quả tích hợp trước nghiệm thu.
