---
phase: 2
title: "Create Deck Form and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Create Deck Form and State

## Overview

Thiết kế trải nghiệm Frontend của thành viên 4 theo [contract phase 1](./phase-01-requirements-and-deck-contract.md). Cùng một form/modal mở từ S-02 và S-03, không nhân đôi validation. Form ngắn nên modal giữ ngữ cảnh và cho hủy quay lại dễ dàng; page riêng bị loại vì phải thêm route và quản lý return path khi chưa có host. Mobile dùng dialog toàn màn hình với cùng state, không viết một form khác.

## Requirements

### Bố cục và dữ liệu

Tiêu đề dialog “Tạo bộ thẻ / Create deck”; thứ tự: Tiêu đề → Mô tả → Danh mục môn học → Nhãn → Quyền riêng tư → Hủy / Tạo bộ thẻ. Required được thể hiện bằng text/accessible property, không chỉ dấu màu. Title có bộ đếm chuẩn hóa theo scalar và helper “3–100 ký tự”; không cắt input theo UTF-16. Placeholder không thay label.

Description là textarea plain text có counter; category là input text, helper “Để trống để dùng Chưa phân loại / Leave blank for Uncategorized”. Tags có input, nút “Thêm nhãn / Add tag”, danh sách tag với nút xóa tên đọc rõ, ví dụ “Xóa nhãn đồ thị / Remove tag đồ thị”. Visibility dùng radio group có legend, mặc định Private:

- “Riêng tư / Private — Chỉ bạn xem và quản lý bộ thẻ.”
- “Công khai / Public — Người dùng khác có thể xem nội dung. Chỉnh sửa bản riêng cần Fork. Tài liệu nguồn không tự được công khai.” / “Others can view the content. Fork to edit a personal copy. Source documents are not automatically public.”

Việc đọc Public trong UC này lấy baseline người dùng đã xác thực, không thêm guest route hoặc chia sẻ link vào form. Không thêm trường owner, enrollment, số thẻ bắt buộc, upload dropzone hoặc nút tạo cây kỹ năng.

### Luồng chính

1. Nhấn trigger ở S-02/S-03. Kiểm tra identity; nếu không còn quyền tạo, hiển thị auth/permission state theo host, không giả đang đăng nhập. Lưu tham chiếu trigger để trả focus.
2. Nếu có frozen operation của **cùng account/tab**, mở trạng thái khôi phục thay vì form trắng. Nếu không có, mở draft mới với title/description/category trống, tags `[]`, Private; focus title.
3. Người dùng nhập. Validate field sau blur và sau submit; field đã lỗi được validate lại khi sửa. Không gọi endpoint kiểm tra trùng tên theo từng phím. Backend là authority duplicate.
4. Submit: nếu IME đang composing thì chưa submit. Flush tag còn đang nhập vào danh sách, validate toàn bộ tags trước khi freeze; tag chỉ có whitespace khi nhấn Add báo rỗng, nhưng input tag trắng lúc Submit được hiểu là không có pending tag. Không bỏ rơi tag chưa nhấn Add. Có lỗi → giữ nguyên dữ liệu, focus error summary có link tới field đầu sai.
5. Form hợp lệ → canonicalize theo phase 1, tạo UUID key bằng platform crypto, đóng băng snapshot gắn subject; ghi sessionStorage thành công **trước** gửi POST. Đặt in-flight guard đồng bộ trước `await` để Enter/double-click không gửi lần hai. Không chỉ dựa disabled button.
6. Gửi qua API client cùng key/body; khóa metadata/submit; trạng thái “Đang tạo bộ thẻ… / Creating deck…”. Cho phép đóng UI theo quy tắc dưới; không coi abort là undo.
7. 201 hoặc 200 replay hợp lệ → kiểm tra response shape/DeckId/user_id tương ứng subject, áp server projection; upsert danh sách theo ID, invalidate/refetch dữ liệu owner ở S-02/S-03, đóng form, điều hướng S-03 `/decks/{deck_id}`; thông báo success một lần cho operation. Không tự cộng thống kê số Deck hoặc số thẻ.
8. S-03 nhận Deck rỗng hiển thị metadata, “Bộ thẻ chưa có thẻ / This deck has no cards yet”. Chỉ liên kết “Thêm thẻ”/“Nhập nhanh”/“Upload tài liệu” khi route tính năng tương ứng đã có; trong mock hiển thị handoff không phải nút giả hoạt động. Không tự kích hoạt các UC này, không cho “Bắt đầu học” với queue trống.

### Hủy, thất bại và thử lại

| Tình huống | Xử lý đã chốt |
|---|---|
| Hủy/Escape khi draft sạch | Đóng, không API, trả focus trigger |
| Hủy/Escape khi dirty và chưa gửi | Hỏi “Bỏ các thay đổi chưa lưu? / Discard unsaved changes?” trong cùng dialog, hai nút “Tiếp tục nhập / Keep editing” và “Bỏ thay đổi / Discard”; focus nút giữ dữ liệu. Không nested modal mới |
| Click backdrop | Không tự đóng; tránh mất dữ liệu. Có nút Hủy/Đóng đọc được |
| Đóng khi submitting/uncertain | Chỉ ẩn dialog và trả focus; giữ request snapshot/in-flight guard. Báo “Yêu cầu có thể vẫn đang xử lý. Mở lại để kiểm tra. / Your request may still be processing. Reopen to check.” Không gọi DELETE hoặc hứa rollback |
| Response về khi modal đã đóng | Vẫn upsert/invalidate đúng account và thông báo kết quả; không tự kéo người dùng khỏi trang họ đang xem. Lần mở lại dùng kết quả đã giải quyết; không gửi lại tạo mới tự động |
| 400/409 title | Nếu là lần đầu và chưa từng unknown: giữ fields/tags, map field_errors, clear pending marker và cho sửa/new key. Nếu đang recovery sau unknown/reload: giữ frozen key/body, không suy ra thao tác cũ chưa commit; báo xung đột contract để Backend kiểm tra theo key |
| 401 | Auth client có thể refresh một lần; giữ frozen key/body và chỉ replay nếu subject vẫn đúng. Nếu cần login, thực hiện qua host. Logout/account switch xóa snapshot theo policy, không gửi draft cũ dưới account mới |
| 403 | Thông báo quyền, giữ nội dung/key trong phiên nếu identity còn đúng; đặc biệt không clear recovery vì attempt trước có thể đã commit; chỉ đóng UI, không loop retry |
| 429 | Giữ frozen snapshot/key/body; hiển thị thời điểm retry theo Retry-After. Chỉ đóng UI, không hủy sang editable/new key vì lần gửi trước có thể đã commit; không gửi trước hạn |
| Network/timeout/abort/5xx/2xx lỗi shape | “Chưa xác định được kết quả. Thử kiểm tra lại để tránh tạo trùng. / The result is unknown. Check again to avoid duplicates.” Khóa body; nút “Kiểm tra lại / Check again” gửi cùng key/body, không key mới |
| 409 key reused | Không sửa payload hoặc tự rotate key. Hiển thị xung đột thao tác và link mở `existing_deck_id` đã scope owner; đọc/refetch trước khi kết thúc recovery. Nếu vẫn không xác định được resource thì giữ recovery state; không gửi create mới mù |
| 410 replay đã xóa | Thông báo terminal “Bộ thẻ của yêu cầu này đã bị xóa. / The deck created by this request was deleted.” Clear snapshot; chỉ khi người dùng chọn tạo thao tác mới mới có key mới |
| Lỗi storage trước POST | Giữ draft trong memory; không request. “Không thể lưu trạng thái tạo bộ thẻ trong phiên này. Kiểm tra quyền lưu trữ của trình duyệt rồi thử lại. / Cannot save this creation request in this session. Check browser storage permissions and try again.” Cho thử lưu/gửi lại sau khi sửa được storage |
| Success nhưng refresh danh sách/route detail lỗi | Create vẫn thành công. Giữ DeckId và projection, báo lỗi tải dữ liệu với nút tải lại; không quay về submit create hoặc báo tạo thất bại |

### Trạng thái form

| State | Dữ liệu cho phép sửa | Chuyển trạng thái |
|---|---|---|
| `editing` | Tất cả metadata | blur/submit validate; cancel; storage thành công → submitting |
| `invalid` | Tất cả metadata, giữ draft | sửa → editing; submit hợp lệ → submitting |
| `submitting` | Không; snapshot frozen | 201/200 → succeeded;410 → deleted;401 → auth_required;403 → forbidden;429 → rate_limited;409 key hoặc400/409 title trong recovery → contract_conflict;400/409 title lần đầu → invalid; unknown → uncertain |
| `uncertain` | Không; đóng UI được | explicit Check again hoặc mở lại recovery → submitting cùng key/body |
| `auth_required` | Không sửa frozen payload | refresh cùng subject → submitting; logout/account switch → clear local operation, refetch khi login |
| `forbidden` | Không sửa frozen payload | Chỉ đóng UI hoặc auth lại; khi quyền được phục hồi, reconcile cùng key, không tự tạo operation khác |
| `rate_limited` | Snapshot frozen; chỉ đóng UI được | retry cùng key sau Retry-After; không chuyển editing/new key từ lỗi quota |
| `contract_conflict` | Không | đọc resource gốc → resolved; nếu lỗi đọc giữ recovery; không retry body khác |
| `succeeded` / `deleted` | Không có form create đang active | Cập nhật UI/terminal; tạo mới chỉ khi có hành động mới có chủ ý |

Visibility của modal (mở/ẩn) độc lập request state. Unmount/đóng UI không được reset operation đang pending. Không thêm state management framework; một component/hook của host đủ cho form và một snapshot pending cho account/tab.

## Architecture / Interfaces

### Snapshot và giới hạn khôi phục D09

Một slot sessionStorage cho account hiện tại, chứa `subject_id`, `idempotency_key`, canonical request body và marker `pending`; không có JWT/refresh token, nội dung tài liệu, toàn bộ danh sách Deck hoặc state học tập. Dữ liệu này là local input không đáng tin: validate cấu trúc/subject trước dùng, backend vẫn validate mọi request. Không render raw HTML từ storage. Snapshot đọc lại sau reload luôn được coi là kết quả chưa rõ; trong memory ghi nhớ việc đã từng unknown để không nhầm rejection của retry với rejection lần đầu.

Ghi pending snapshot trước lần POST đầu; nếu không lưu được thì không gửi. Snapshot frozen qua timeout/reload/modal-close; không ghi đè nó bằng draft khác. Mở lại/reload với cùng subject → hiển thị recovery, gửi lại cùng key/body một lần để nhận 200/201/410; lỗi mạng tiếp tục cần nút Check again. Không retry vô hạn hoặc tạo offline queue. Trước replay, auth subject phải khớp và chỉ có một request in-flight trong tab.

Clear snapshot sau success đã chấp nhận, terminal410, xung đột key đã đọc được kết quả gốc, rejection400/409 title lần đầu chưa có unknown, hoặc logout/account switch. Không có cancel operation ở trạng thái frozen; đóng chỉ ẩn UI. Rejection của retry không cho clear: giữ trạng thái và reconcile theo key. Sau success dùng key của operation để dedupe toast/list update trong phiên. Logout xóa local operation để không lộ metadata cho account sau, **không thu hồi request đã gửi**; response muộn của account trước không cập nhật UI account mới. Login lại phải refetch danh sách owner trước lần tạo tiếp theo. Không hứa phục hồi draft/key qua logout, đóng tab, xóa browser storage hoặc dữ liệu storage hỏng.

Nếu clear snapshot thất bại sau success thì record cũ có thể replay ở lần mở lại; backend vẫn trả cùng ID/410. Giữ resolved marker trong memory để không hiển thị thành công hai lần trong phiên. Với storage hỏng, không tự replay/đoán payload; thông báo không thể phục hồi, refetch danh sách owner rồi cho người dùng chủ động bắt đầu lại. Không claim bảo đảm tự động tìm lại Deck cũ nếu cả key/snapshot đã mất.

### Host integration đề xuất, chưa có file thực

Form nhận identity hiện tại, API client auth, trigger reference, callback `onDeckCreated(serverDeck)` và điều hướng S-03 của host. Không truyền user_id trong payload; subject chỉ dùng scope local state. Callback dùng upsert theo `deck_id`, refresh mọi collection owner liên quan; filter hiện tại vẫn phải được tôn trọng, không ép item mới vào kết quả lọc không phù hợp. Detail nhận response để hiện ngay, sau đó read/refetch kiểm tra quyền thật.

Nếu chưa có host khi triển khai, mock cung cấp hai trigger S-02/S-03, identity Learner/Instructor và collection owner trong memory. Không dựng Dashboard hoàn chỉnh, router tổng quát hoặc API repository wrapper mới chỉ cho form này. [Phase 3](./phase-03-backend-integration.md) định nghĩa mock và điều kiện bàn giao Backend; [phase 4](./phase-04-testing-and-verification.md) định nghĩa kiểm thử và gate nghiệm thu.

### Keyboard, focus và responsive

- Dùng dialog semantic có accessible name/description; `aria-modal` và background inert khi mở. Reuse dialog component của host nếu có; khi chưa có dùng platform dialog, không tự thêm thư viện.
- Khi mở focus title; phục hồi request focus heading/status recovery. Trap Tab/Shift+Tab; radio dùng Arrow keys/Space đúng native semantics. Escape theo luồng cancel; khi đóng restore trigger, nếu trigger unmounted thì focus heading S-02/S-03 còn tồn tại. Success focus heading S-03 mới, không trả focus về màn hình đã rời.
- Error summary focusable, link từng field; input có label/id, `aria-invalid`, `aria-describedby` cho help/error. Thông báo submitting/uncertain/success qua live region không lặp; field error không chỉ toast hoặc màu.
- Enter trong title/category submit khi không composing; Enter textarea xuống dòng; Enter tag input thêm tag và không submit. Nút Add/Remove/Cancel có type button; Submit type submit. Không dùng Space/1–4 của màn hình học làm shortcut trong form.
- Desktop dialog rộng vừa đọc, nội dung có thể scroll; mobile toàn màn hình, một cột; footer không che field/focus khi bàn phím ảo mở. Tags/title dài wrap; không cuộn ngang ở 320px (yêu cầu thiết kế thêm), kiểm tra 375/768/1024/1280px theo SRS và zoom 200%. Focus ring rõ, contrast đáp ứng WCAG 2.1 AA; success/radio/errors có text.
- Nhãn/help/validation/recovery/success có VI và EN. Dữ liệu UTF-8 giữ dấu; đổi locale không reset draft hoặc thay canonical category mặc định. Không thêm shortcut toàn cục chặn nhập tiếng Việt.

## Related Code Files

Không có source FE hiện tại. Các vị trí **đề xuất khi bắt đầu triển khai**, không phải file sẽ ghi trong nhiệm vụ này:

| Vai trò | Vị trí logic / cách xử lý |
|---|---|
| Form/modal và state | Một module `features/decks/CreateDeckDialog` trong cây frontend của host sau khi có scaffold; không chốt đuôi path theo code chưa tồn tại |
| Entry points | S-02 Dashboard, S-03 Deck Workspace của host; gọi cùng form |
| HTTP/auth | API client sẵn có của host; nếu chưa có chỉ một hàm POST dùng platform fetch |
| Text/validation fixtures | Dùng cơ chế locale/test host; không tạo thư viện shared đa runtime |
| Tests/mock | Cạnh feature theo cấu trúc host; mock theo phase 3, bộ scenario chuẩn theo phase 4 |

## Implementation Steps

1. Đọc host khi có mã; reuse modal, button, input, auth, locale, cache/router và conventions thực tế.
2. Làm form theo field rules phase 1; kiểm tra scalar/NFC/White_Space và pending tag/IME bằng fixtures nhỏ.
3. Thêm state/frozen snapshot/storage trước network; guard submit trước await, chặn owner switch.
4. Nối callback update/list/detail và recovery; giữ lỗi refresh tách lỗi create.
5. Kiểm tra keyboard/focus, locale và mobile bằng acceptance phase 4; chưa mở rộng sang import/upload/Fork.

## Success Criteria

- [ ] Hai entry point có cùng defaults/validation và không mất draft do lỗi server.
- [ ] Title/description/category/tags/visibility đúng contract, không silent truncate hoặc bỏ pending tag.
- [ ] Double-click/Enter không thêm request; uncertain giữ nguyên key/body qua reload cùng tab.
- [ ] Cancel/close không hứa rollback; logout/account switch không replay hoặc cập nhật chéo account.
- [ ] Success upsert/refetch đúng một ID; failure refresh không làm tạo lại Deck.
- [ ] Keyboard/focus/VI-EN/responsive đạt AC23–AC25 và AC29–AC31.

## Risk Assessment

Storage metadata có chủ ý chỉ tồn tại trong session tab, xóa logout; mất tab/storage làm mất khả năng tự khôi phục. Backend receipt vẫn ngăn lặp khi còn key nhưng không thay được client đã mất key. Focus/backdrop/IME dễ hỏng nếu tự viết dialog; ưu tiên component host hoặc platform. Contract/framework chưa triển khai là dependency tích hợp thật, không phải bằng chứng form đã chạy.
