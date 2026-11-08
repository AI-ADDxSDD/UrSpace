---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification

## Overview

Kiểm thử và nghiệm thu UC-02.1 sau khi có form và môi trường tích hợp của phase 3. Giữ nguyên 36 tình huống Given/When/Then đã chốt: thành công, validation, ownership, concurrency, lost response, cập nhật UI và accessibility. Đây là **test plan chưa thực thi**; nhiệm vụ hiện tại chỉ kiểm tra tài liệu Markdown.

## Requirements

- Kiểm tra FE bằng test nhỏ cho validation/state/replay và component có keyboard; tránh snapshot toàn Dashboard.
- Kiểm tra API serialization/error envelope và ownership ở trust boundary.
- Kiểm chứng unique/receipt/race/rollback bằng PostgreSQL thật, không dùng mock hoặc EF in-memory làm bằng chứng.
- Kiểm tra thủ công keyboard/focus/screen reader, VI/EN, responsive và zoom.
- Phân biệt AC thuộc UC-02.1 với AC18/AC32 là handoff source/upload tương lai; ghi rõ phần chưa triển khai, không pass giả.

## Architecture / Interfaces

Nguồn contract là [phase 1](./phase-01-requirements-and-deck-contract.md), hành vi form là [phase 2](./phase-02-create-deck-form-and-state.md), mock và điều kiện bàn giao Backend là [phase 3](./phase-03-backend-integration.md). Phase 4 dùng môi trường/API và dữ liệu thử được bàn giao; không định nghĩa thêm contract hoặc tạo project test khi repository chưa có source.

### Acceptance Given / When / Then

| ID / trách nhiệm | Given | When | Then |
|---|---|---|---|
| AC01 FE+BE | Learner hoặc Instructor đã xác thực; mở S-02 rồi lặp riêng từ S-03 | Nhập title hợp lệ, để optional trống và submit | Một Deck owner hiện tại, category Chưa phân loại, Private, count0; không Document/Concept/Flashcard/state; UI mở S-03 đúng ID |
| AC02 FE+BE | Form mới Private | Chọn Public rồi tạo; tạo riêng một Deck Private | Response/lists giữ đúng visibility; non-owner không được sửa Public, Private không lộ trong read/discovery |
| AC03 FE+BE | Title lần lượt rỗng/whitespace/2/3/100/101 scalar sau normalize | Submit từng trường hợp | Rỗng/2/101 bị chặn;3/100 hợp lệ; không cắt thầm; backend cũng từ chối nếu bypass FE |
| AC04 FE+BE | Title có đầu/cuối/nhiều space, TAB/newline/NBSP/U+3000; fixture U+FEFF | Normalize/submit | White_Space đã chốt gộp/trim; FEFF được giữ và tính scalar, không xử lý ngầm khác FE/BE; NFC precomposed/decomposed cùng canonical title |
| AC05 FE+BE | 3 và 100 scalar có emoji ngoài BMP, chữ Việt và dấu tổ hợp | Validate, round-trip JSON và render | Đếm scalar sau NFC, không UTF-16; UTF-8 giữ dữ liệu; không dùng native maxlength cắt sai |
| AC06 BE | Owner A có “Đại số”; owner B chưa có | A tạo “  ĐẠI   SỐ ”, B tạo cùng canonical title; A tạo “Dai so” | A nhận409 không side effect; B được tạo; tên mất dấu là khác khóa. Thêm fixture runtime cho case mapping invariant, không dùng JS làm authority |
| AC07 FE+BE | Lần lượt có 0/10/11 tags | Submit | 0/10 hợp lệ;11 bị chặn cả FE/BE; không silent drop tag thứ11 |
| AC08 FE+BE | Tag 0/1/30/31 scalar, whitespace-only, canonical duplicate/case duplicate | Add/submit, gồm request bypass FE | Tag rỗng/31/trùng bị từ chối;1/30 hợp lệ; server phân xử Unicode duplicate; lỗi vẫn giữ text để sửa |
| AC09 FE | Có9 hoặc10 tags và một tag chưa Add | Bấm submit; lặp với Enter khi IME composing | Pending tag được flush trước freeze;9+1 hợp lệ,10+1 lỗi; IME không submit hoặc làm mất input |
| AC10 FE+BE | Description 2000/2001; category100/101; optional bị bỏ/null/sai kiểu | Submit từng trường hợp | Biên hợp lệ được giữ; quá biên/null/sai kiểu400; optional bị bỏ nhận default; error envelope đủ3 field SRS và field_errors |
| AC11 FE+BE | Visibility thiếu, null, “public”, “Unknown”, true hoặc1 | Bypass radio gửi request | 400, không Deck/receipt thành công; chỉ Public/Private chính xác hợp lệ |
| AC12 FE+BE | Metadata chứa `<script>`, HTML, quote, emoji, newline; control không hợp lệ hoặc unpaired surrogate | Submit và hiển thị ở form/list/detail | Text hợp lệ render escaped, không chạy script; newline mô tả giữ; control/surrogate bị reject; không Markdown editor thực thi HTML |
| AC13 FE | Draft dirty/chưa gửi | Hủy/Escape, chọn Keep editing rồi Discard | Không network; giữ hoặc bỏ đúng lựa chọn; backdrop không tự đóng; focus về trigger |
| AC14 FE | Đã nhập đầy đủ; lần gửi đầu chưa có unknown, và một case riêng retry sau unknown | Backend trả400/409 title | Lần đầu giữ metadata/tags, field error, cho sửa/new key; case recovery giữ frozen key/body và báo contract conflict, không coi rejection mới phủ định thao tác cũ |
| AC15 BE+FE | Guest/token hết hạn hoặc Admin-only account | Gọi POST trực tiếp hoặc mở form | 401 với Guest/expired;403 actor không phù hợp; không Deck; FE giữ request cần reauth, không loop refresh |
| AC16 BE | Hai request khác key cùng owner/canonical title chạy đồng thời | Insert thật vào PostgreSQL | Chính xác một Deck, một success receipt; request thua409 title; preflight không phải chốt duy nhất |
| AC17 BE | A/B hoặc forged user_id/owner_id trong body; cùng key dùng bởi A và B | POST/replay/read | Body owner extra400; owner luôn principal; receipt scope user; A không đọc/replay/chỉnh Deck Private B |
| AC18 BE/integration | Public Deck có source Document thuộc A, B đọc Public hoặc Fork sau này | B xin stream nguồn hoặc sửa shared content | Public không tự cấp source/write; baseline source owner-only; không membership được tạo. Đây là gate policy khi tích hợp UC036, chưa có code để test hiện tại |
| AC19 FE+BE | Manual Deck0 cards/concepts; các AI endpoints cần≥1 | Tạo rồi mở detail | Tạo thành công, không gọi AI commit/SSE/FSRS/DAG, không auto thêm placeholder; không cho study queue giả |
| AC20 FE | Transport delay; form hợp lệ | Double-click, Enter lặp, đóng/mở modal lúc in-flight | Một request in-flight trong tab; metadata frozen; giữ snapshot; không thông báo rollback |
| AC21 BE | Cùng owner/key và canonical payload, request chạy đồng thời hoặc replay sau restart server | Gửi lặp | Một Deck/receipt; replay200 cùng ID; đọc receipt trước title conflict, kể cả unique title nổ trước unique key |
| AC22 FE+BE | Server đã commit nhưng response bị mất; snapshot vẫn có | Check again hoặc reload cùng tab/account rồi recovery | Cùng key/body;200 cùng ID, không Deck thứ2; upsert/toast theo operation, không cộng count hai lần |
| AC23 FE | Modal từ S-02/S-03, field invalid, radio/tags/textarea | Dùng chỉ keyboard Tab/Shift+Tab/Enter/Escape/Arrow/Space | Focus trap/restore đúng; Enter tags không submit, textarea xuống dòng; error summary/link/label/aria đọc được; không phím tắt học can thiệp |
| AC24 FE | 320/375/768/1024/1280px, zoom200%, title/tags dài, bàn phím mobile | Mở/điền/submit lỗi | Không horizontal scroll hoặc footer che field; focus visible, nội dung wrap/scroll; contrast/text trạng thái đạt AA |
| AC25 FE | VI và EN, draft tiếng Việt/emoji đang nhập | Đổi locale và nhận success/network/field/auth error | Đủ labels/help/messages hai ngôn ngữ; không reset draft; category default canonical không đổi theo locale |
| AC26 BE | Receipt key đã gắn payload X | Gửi cùng key nhưng canonical body Y | 409 IDEMPOTENCY_KEY_REUSED + original ID của đúng owner; không mutate Deck/create mới; FE không tự rotate |
| AC27 FE+BE | Request trả500/503, timeout/abort; hoặc2xx body không hợp lệ | Thử lại | Uncertain giữ snapshot/key; không suy “chưa tạo”; error server hợp contract không lộ SQL/stack/token; không retry vô hạn |
| AC28 BE | Crash trước commit hoặc sau commit/trước response | Restart và replay cùng key | Trước commit: không Deck/receipt dở, retry tạo một; sau commit: replay200 cùng ID. Unique/receipt durable được test thật |
| AC29 FE | sessionStorage setItem thất bại trước POST; hoặc snapshot hỏng | Submit hoặc mở recovery | Storage fail không network, giữ draft và lỗi actionable; snapshot hỏng không tự gửi, refetch list rồi cho thao tác mới có chủ ý; không hứa phục hồi key mất |
| AC30 FE | Pending request A; logout/account switch B hoặc tab đóng | Response A đến muộn / login lại | Không cập nhật/replay A dưới B; clear local metadata logout; login refetch owner list; không claim recovery xuyên logout/tab close |
| AC31 FE | Create đã201/200, list đang filter hoặc refresh/detail fetch lỗi | Cập nhật UI / chuyển trang | Upsert đúng ID, filter được tôn trọng, invalidate các list owner; báo lỗi tải lại riêng, giữ success/DeckId, không POST lại |
| AC32 UC031 handoff | File basename “a.pdf”, tên>100, trùng owner, hoặc hai upload trùng candidate | Auto create trong UC031 sau khi được triển khai | Fallback/cắt scalar/suffix≤100 + DB retry tối đa10; hết lượt409 hướng dẫn chọn Deck trước; không orphan. Defaults Private/upload category, response DeckId của requester; deck đích non-owner bị chặn |
| AC33 BE+FE | Receipt còn, Deck sau tạo đã sửa metadata/thêm thẻ | Replay đúng request gốc | 200 cùng ID với projection/count hiện tại, FE dùng server data; không ghi đè bằng frozen body |
| AC34 BE+FE | Deck đã bị xóa sau success, receipt vẫn còn | Replay request cũ | 410, không resurrect; clear pending; chỉ new operation có chủ ý mới có thể tạo Deck khác |
| AC35 FE+BE | POST đã commit nhưng mất response; retry bị limiter429 trước receipt lookup, hoặc403 vì quyền thay đổi | Đóng/mở recovery, retry trước/sau Retry-After hoặc sau phục hồi quyền | Không suy operation chưa tạo, không cho edit/new key; chỉ đóng UI; retry cùng key/body khi được phép, cuối cùng200 cùng ID, không Deck thứ2. Lần đầu429 cũng giữ key/body |
| AC36 FE | Modal bị đóng khi pending và người dùng sang trang khác | Response201/200 về | Upsert/invalidate đúng account và báo kết quả; không tự chuyển route ngoài ý định; mở lại không tạo lại thao tác đã xong |

AC18/AC32 là kiểm thử tích hợp/handoff tương lai, không mở scope phase này thành triển khai source stream/upload. UC-02.7/02.8 là yêu cầu bổ sung từ prompt; không gán chúng vào danh mục UC của SRS hiện tại.

### Gate nghiệm thu thực tế

- [ ] FE component test nhỏ: field bounds/NFC/scalar/White_Space, tags+IME, frozen state/double submit, storage fail, auth switch, list success tách refresh error.
- [ ] API serialization tests: snake_case, enum string, error envelope; owner injection bị chặn.
- [ ] Backend integration trên PostgreSQL thật: hai title race, same-key race, crash/restart, receipt không mất theo Deck delete và hash v1 ổn định.
- [ ] Manual browser check keyboard/screen reader, responsive/zoom và VI/EN; không chỉ static screenshot.
- [ ] Nối auth/POST/read/list thật; không claim mock chứng minh bảo mật, atomicity hoặc source permission.
- [ ] Ghi rõ UC031/036 handoff còn chưa triển khai nếu các nhóm chưa nhận/hoàn thành; không đánh dấu các UC đó done theo tài liệu này.

## Related Code Files

Không có file ứng dụng/test hiện tại. Sau khi có scaffold, test đặt cạnh module form theo conventions host, backend test tại test project thực của nhóm Backend. Không tạo test project/package chỉ để “chạy test” trên một repository chỉ có tài liệu.

Tài liệu liên quan: [plan](./plan.md), [contract](./phase-01-requirements-and-deck-contract.md), [form](./phase-02-create-deck-form-and-state.md), [tích hợp Backend](./phase-03-backend-integration.md), [brainstorm và đối chiếu nguồn](../reports/2026-11-09-uc-02.1-create-deck-brainstorm.md).

## Implementation Steps

1. Nhận mock/API thật, identity, dữ liệu Deck và kết quả bàn giao từ phase 3; phân loại scenario FE, BE và handoff trước khi chạy.
2. Chạy kiểm tra FE tối thiểu theo AC: validation, tag/IME, state/recovery, storage fail và account switch.
3. Chạy API/DB checks cho serialization, quyền, trùng tên đồng thời, same-key race, crash/restart, rollback và replay sau xóa.
4. Chạy kiểm tra luồng tích hợp: lost response, retry bị429/403, list/detail refresh lỗi, cập nhật UI một lần và điều hướng đúng.
5. Kiểm tra keyboard/focus/screen reader, VI/EN, responsive/zoom; sửa lỗi tại boundary gây ra rồi chạy lại phần bị ảnh hưởng.
6. Ghi kết quả thực và handoff còn chờ; chỉ đánh dấu nghiệm thu hoàn tất khi các gate UC-02.1 đạt, không dùng kết quả mock thay bằng chứng thật.

## Success Criteria

- [ ] AC01–AC36 có kết quả thực hoặc đánh dấu handoff chưa triển khai đúng trách nhiệm, không dùng pass giả.
- [ ] Manual create hoạt động không cần upload/AI, giữ invariant cùng các luồng tạo khác.
- [ ] Không lỗi nghiêm trọng về owner, duplicate, replay/resurrection, source privacy hoặc mất dữ liệu form chưa xử lý.
- [ ] Hạn chế sessionStorage và thiếu mã/backend thật được công khai khi bàn giao.

## Risk Assessment

Mock không kiểm chứng DB concurrency; unit test normalize ở JS không chứng minh .NET invariant mapping. Source privacy UC-03.6 và auto-create UC-03.1 chỉ mới được bàn giao bằng tài liệu, chưa được sửa. Không có API/host hiện tại nên chưa thể chạy kiểm thử ứng dụng; đây là giới hạn triển khai, không chặn hoàn tất bộ kế hoạch.
