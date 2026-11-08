---
phase: 1
title: "Requirements and Deck Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Deck Contract

## Overview

Chốt contract để Frontend có thể làm với mock và bàn giao Backend một bộ invariant dùng chung. Đây là kế hoạch, chưa tồn tại entity Deck, endpoint, DTO hoặc cấu hình serializer trong repository. SRS là yêu cầu gốc; quyết định plan cũ vẫn là thiết kế; code trong Markdown chỉ là ví dụ; D01–D12 trong [plan](./plan.md) là quyết định/giả định của kế hoạch này.

## Requirements

### Truy vết yêu cầu

Các paragraph SRS dưới đây là chỉ số **zero-based** của `//w:body//w:p` trong `word/document.xml`, không phải số trang Word. Section là locator chính; không suy diễn số trang từ text extraction.

| ID | Yêu cầu / nguồn | Thiết kế đáp ứng | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | SRS §2.2 UC-02.1 ¶163–166: Học viên/Giảng viên | Actor gate ở FE và BE; auth principal | AC01, AC15 |
| R02 | SRS §3.2.1 ¶448: mở từ S-02/S-03 | Cùng modal, cùng defaults, hai trigger | AC01, AC23 |
| R03 | SRS §3.2.1 ¶449 và Deck ¶426: đủ metadata | Title, description, category, tags, visibility | AC01–AC12 |
| R04 | SRS §3.2.1 ¶451: title 3–100 | Chuẩn hóa trước đo; scalar count D03 | AC03–AC05 |
| R05 | SRS §3.2.1 ¶450: không trùng trong tài khoản | Unique DB `(user_id, normalized_title)` | AC06, AC16 |
| R06 | SRS §3.2.1 ¶451: ≤10 tags | Chặn 11, validate pending tag | AC07–AC09 |
| R07 | SRS Deck ¶426 + yêu cầu hiện tại: owner đăng nhập | Chỉ server gán `UserId` | AC15–AC17 |
| R08 | SRS Public/Private + BR-10 ¶543, security ¶515 + yêu cầu hiện tại | Người khác chỉ đọc Public; không công khai source | AC02, AC17, AC18 |
| R09 | SRS §3.2.1/3.2.2 ¶450–455 + yêu cầu hiện tại | Cho container rỗng; không gọi AI commit | AC01, AC19 |
| R10 | SRS §4.1 ¶496, §4.2.1 ¶503, §5.2 ¶546–547 | Responsive, WCAG 2.1 AA, VI/EN, UTF-8 | AC05, AC23–AC25 |
| R11 | Yêu cầu hiện tại: submit nhiều lần/lost response | Frozen request + receipt owner-scoped | AC20–AC22, AC26–AC30 |
| R12 | Yêu cầu hiện tại: điều hướng/list update | Server ID authoritative, upsert/refetch | AC01, AC22, AC31 |
| R13 | Yêu cầu hiện tại: chỉ điểm tích hợp 02.6/02.7/02.8/03.1 | Handoff bên dưới; không import/Fork/upload trong form | AC18, AC19, AC32 |
| R14 | SRS §5.2 ¶548 | Error JSON đủ timestamp/error_code/user_message | AC10, AC14, AC27 |

### Field specification — contract v1 đề xuất

| JSON / UI | Bắt buộc / mặc định | Quy tắc server và client | Thông báo VI / EN |
|---|---|---|---|
| `title` / Tiêu đề | Có; rỗng khi mở | Normalize one-line bên dưới; 3–100 scalar; unique theo owner; giữ dấu; không tự đổi tên thủ công | “Tiêu đề phải có từ 3 đến 100 ký tự.” / “Title must be 3–100 characters.”; trùng: “Bạn đã có bộ thẻ cùng tiêu đề.” / “You already have a deck with this title.” |
| `description` / Mô tả | Không; `""` | NFC, CRLF/CR→LF, trim bằng tập White_Space đã chốt; giữ paragraph/khoảng trắng nội bộ; ≤2.000 scalar; plain text | “Mô tả tối đa 2.000 ký tự.” / “Description must be at most 2,000 characters.” |
| `category` / Danh mục môn học | Không; UI trống | Text tự nhập; one-line normalize; ≤100; blank lưu `"Chưa phân loại"` bất kể locale; UI có thể dịch nhãn mặc định. Không dựng taxonomy, dropdown/API mới | “Danh mục tối đa 100 ký tự.” / “Category must be at most 100 characters.” |
| `tags` / Nhãn | Không; `[]` | Mảng ≤10 phần tử; mỗi phần tử sau one-line normalize 1–30 scalar; không trùng theo khóa invariant server; không âm thầm loại/truncate tag | “Tối đa 10 nhãn, mỗi nhãn 1–30 ký tự.” / “Use at most 10 tags, each 1–30 characters.”; “Nhãn đã tồn tại.” / “This tag already exists.” |
| `visibility` / Quyền riêng tư | UI chọn `Private` | Chỉ chuỗi chính xác `Public` hoặc `Private`, backend bắt buộc field; không nhận boolean/int/giá trị lạ | “Chọn Công khai hoặc Riêng tư.” / “Choose Public or Private.” |

Chỉ title/visibility là required trong payload nghiệp vụ; description/category/tags được phép bỏ và canonicalize về `""`, `"Chưa phân loại"`, `[]`. Gửi `null`, sai kiểu hoặc extra field như `user_id`, `owner_id`, `deck_id`, `name`, `is_public` → 400, không mass assignment. Title rỗng dùng MSG-08 từ SRS: “Trường thông tin này là bắt buộc, không được để trống.” / “This field is required.” Phần còn lại là thông báo mới đề xuất, không bịa mã MSG đã có.

### Chuẩn hóa và so sánh tên D03

1. Kiểm tra chuỗi Unicode hợp lệ; từ chối unpaired surrogate. Tất cả text dùng NFC.
2. One-line: thay mỗi chuỗi liên tiếp thuộc **Unicode White_Space cố định** bằng U+0020, bỏ U+0020 ở đầu/cuối. Tập dùng chung: U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A, U+2028, U+2029, U+202F, U+205F, U+3000. Không mặc định JS `trim/\s` và .NET xử lý giống nhau. U+FEFF không thuộc tập; không âm thầm xóa nó.
3. Từ chối C0/C1 control còn lại sau chuẩn hóa. Description cho phép LF và TAB, không cho control khác. Không cho HTML chạy; mọi metadata render bằng text escaping, không `innerHTML`. Không cần Markdown editor cho metadata.
4. Độ dài là **Unicode scalar value sau NFC**, không phải UTF-16 `.length` và không phải grapheme cluster. FE đếm code point, BE đếm rune; bộ đếm dùng cùng fixtures. Emoji ghép nhiều scalar có thể được đếm nhiều; ghi help text phù hợp, không để native `maxlength=100` UTF-16 cắt sai title.
5. Server tính `normalized_title = NFC(canonical_title.ToUpperInvariant())` theo .NET, lưu khóa so sánh ordinal/deterministic trong PostgreSQL; không dùng collation bỏ dấu, không bỏ dấu tiếng Việt, không fuzzy-match/homoglyph. FE không tự quyết trùng theo JS upper/lower; server 409 là nguồn quyết định. Tag duplicate dùng cùng phép tạo khóa ở backend.
6. Unique `(user_id, normalized_title)` áp lên mọi Deck còn tồn tại của owner, mọi visibility và mọi đường tạo (manual/upload/Fork sau này). Không chỉ `AnyAsync` trước insert. Vi phạm unique đúng constraint này ánh xạ 409; lỗi DB khác không giả làm trùng tên. Xóa vĩnh viễn Deck giải phóng tên nhưng không xóa receipt thao tác cũ.

FE có thể chặn tag trùng hoàn toàn sau normalize; các trường hợp case Unicode do backend phân xử. Canonicalization **v1** và hashing bên dưới phải giữ ổn định khi triển khai; đổi thuật toán/runtimes làm đổi mapping là migration contract và dữ liệu khóa, không chỉ đổi UI.

## Architecture / Interfaces

### Chọn công nghệ và vocabulary

Backend .NET/ASP.NET Core + EF Core/PostgreSQL và Hangfire là quyết định trong Validation Log các plan cũ, **chưa có mã triển khai**. Kế hoạch FE đề xuất React + TypeScript vì form có state và phần cây kỹ năng đã nhắc React Flow; đây không phải hệ quả bắt buộc từ .NET. Không thêm Next.js, state library, form library hay dependency mới cho UC này. Nếu host được xây trước phase 2, tái sử dụng component/client/router thực tế của host, giữ contract và UX đã chốt.

| Khái niệm | JSON đề xuất | C# / persistence bàn giao |
|---|---|---|
| Định danh Deck | `deck_id` | `Deck.Id`; response upload C# `DeckId` ánh xạ rõ ra `deck_id` |
| Tiêu đề | `title` | `Deck.Title` / `decks.title`; không thêm `Name` alias làm nguồn thứ hai |
| Chủ sở hữu | `user_id` chỉ response | `Deck.UserId` / `decks.user_id`; gán từ auth |
| Công khai | `visibility: Public/Private` | `Deck.Visibility`; ví dụ `IsPublic` phải chuyển đổi tại boundary nếu backend khác, không giữ hai nguồn |
| Thống kê nội dung | `concepts_count`, `flashcards_count` | Số nội dung ACTIVE; manual create bằng 0; replay có thể đã khác 0 |

Snake_case là lựa chọn **mới**, được hỗ trợ bởi SRS naming và narrative các plan, chưa phải convention serializer đã có. Backend phải mapping DTO tường minh hoặc cấu hình và kiểm thử serialization; không giả định PascalCase tự ra snake_case. Không đổi toàn bộ serializer các UC khác trong nhiệm vụ này.

### POST tạo Deck — tất cả là đề xuất

`POST /api/v1/decks`, HTTPS, `Content-Type: application/json`, `Authorization: Bearer <access_token>`, `Idempotency-Key: <UUID v4>`, `Accept-Language: vi` hoặc `en`. Token chỉ ở auth client/in-memory; refresh HttpOnly theo SRS, không query string/sessionStorage. Sử dụng client auth của host khi có; không tự thiết kế thêm hệ auth cookie cho POST này.

```json
{
  "title": "Cấu trúc dữ liệu",
  "description": "Ôn tập học kỳ 7",
  "category": "Khoa học máy tính",
  "tags": ["cây", "đồ thị"],
  "visibility": "Private"
}
```

Tạo lần đầu → **201 Created**, `Location: /api/v1/decks/8c2c1d39-1f70-4c27-9f5c-03f2ab1fd021`, JSON:

```json
{
  "data": {
    "deck_id": "8c2c1d39-1f70-4c27-9f5c-03f2ab1fd021",
    "user_id": "cb9d2e91-1211-4e87-94e0-0df16a991234",
    "title": "Cấu trúc dữ liệu",
    "description": "Ôn tập học kỳ 7",
    "category": "Khoa học máy tính",
    "tags": ["cây", "đồ thị"],
    "visibility": "Private",
    "concepts_count": 0,
    "flashcards_count": 0,
    "created_at": "2026-11-09T03:00:00Z"
  }
}
```

UUID/timestamp trong ví dụ là dữ liệu minh họa, không phải kết quả đã tạo. `created_at` do server gán UTC ISO-8601. Replay hợp lệ → **200 OK**, cùng `deck_id` và Location, trả **projection hiện tại** của Deck; metadata/count có thể đã thay đổi sau tạo. FE phải dùng response, không ghi đè bằng draft cũ. Không cần thêm boolean `success` hoặc message để FE xác định thành công; envelope `data` là đề xuất riêng có ghi rõ, các ví dụ cũ chưa tạo chuẩn success thống nhất.

S-03 cần `GET /api/v1/decks/{deck_id}` trả cùng projection tối thiểu và kiểm tra owner/Public theo policy. Đây là **read contract đề xuất để bàn giao host**, không tuyên bố endpoint đã tồn tại, không mở rộng UC thành xây toàn bộ màn hình chi tiết/danh sách. Read Private của non-owner hoặc ID không tồn tại dùng 404 để không lộ dữ liệu; owner/Public content lookup không được trả đường dẫn file/stream nguồn. Danh sách S-02/S-03 phải có hook refresh; API phân trang/tìm kiếm riêng không thiết kế ở đây.

### Error contract

Giữ đủ 3 field bắt buộc của SRS §5.2. `field_errors` và `existing_deck_id` là extension mới; message theo locale, code ổn định; FE dựa code, không parse chuỗi. Các key lỗi dùng JSON snake_case, `tags` chứa message gắn index khi cần.

```json
{
  "timestamp": "2026-11-09T03:00:00Z",
  "error_code": "DECK_TITLE_EXISTS",
  "user_message": "Bạn đã có bộ thẻ cùng tiêu đề.",
  "field_errors": {"title": ["Bạn đã có bộ thẻ cùng tiêu đề."]}
}
```

| HTTP / error_code | Nghĩa / bảo đảm | Hành vi FE |
|---|---|---|
| 400 `VALIDATION_ERROR` | Field/kiểu/extra field sai; thiếu hoặc sai UUID header; lần request này không ghi Deck | Chỉ lần đầu chưa unknown mới cho sửa/new key; recovery giữ frozen và xử lý contract conflict theo đoạn dưới |
| 401 `AUTHENTICATION_REQUIRED` | Chưa xác thực/token hết hạn trước xử lý | Giữ snapshot, auth refresh tối đa một lần cho cùng subject; retry cùng key/body; login account khác không replay |
| 403 `DECK_CREATE_FORBIDDEN` | Actor không được tạo; lần request này không ghi Deck, không phủ định kết quả lần trước | Giữ nội dung/key, thông báo không có quyền; nếu đang recovery thì không clear snapshot hoặc rotate key; không retry tự động |
| 409 `DECK_TITLE_EXISTS` | Khác thao tác đã có cùng owner/title; request này không tạo Deck | Lỗi title; chỉ lần đầu chưa unknown mới cho sửa/new key; recovery giữ frozen và kiểm tra contract theo đoạn dưới |
| 409 `IDEMPOTENCY_KEY_REUSED` | Receipt cùng owner/key đã gắn payload khác; có thể đã tạo Deck trước | Không rotate key rồi gửi mù. Response kèm `existing_deck_id` của receipt owner; mở/đọc Deck đó hoặc báo đã xóa; chỉ bắt đầu thao tác khác khi người dùng chủ động |
| 410 `DECK_CREATION_RESULT_DELETED` | Replay thao tác đã thành công nhưng Deck sau đó bị xóa | Terminal; xóa pending snapshot, thông báo đã xóa; không tự tạo lại |
| 429 `RATE_LIMITED` | Lần request này bị từ chối trước transaction; có `Retry-After`; thao tác trước có thể đã commit | Giữ snapshot frozen/key/body, retry cùng key sau hạn; chỉ đóng UI, không hủy sang edit/key mới; không thêm offline queue |
| 500/503 `SERVER_ERROR` / `SERVICE_UNAVAILABLE` | Không dùng mã này làm bằng chứng chưa commit | Chuyển uncertain, giữ key/body để retry an toàn |
| Timeout, network, abort, 2xx body không hợp lệ, lỗi ngoài contract | Chưa biết server đã commit chưa | Uncertain; không báo chắc chắn “tạo thất bại”, không tạo key mới |

Không trả stack trace, SQL, token hoặc tên Deck của owner khác trong lỗi. Không áp SLA 200ms của study queue/review sang create Deck; chưa có đo đạc hiệu năng cho endpoint này.

Phân biệt **attempt** với **operation**: sau timeout/reload/unknown, một 400/401/403/429 hoặc409 title ở lần retry không tự chứng minh toàn thao tác chưa từng thành công. Không clear pending/cho sửa payload chỉ vì attempt mới bị chặn. Giữ frozen request để reconcile; nếu400/409 title vẫn xuất hiện thay vì receipt200/410 trong recovery, coi là xung đột contract cần Backend kiểm tra theo key, không tự tạo key mới. Chỉ first-attempt rejection khi chưa có attempt unknown mới cho sửa/new key theo bảng. Replay receipt nên đứng trước quota tạo mới khi auth cho phép; rate limiter ngoài handler vẫn có thể chặn retry nên FE phải giữ trạng thái.

### Owner, atomicity và lost response D08

Backend phải kiểm tra tại trust boundary, kể cả FE đã validate:

1. Xác thực actor/account; lấy `user_id` từ principal hợp lệ, không từ body/route tự khai. Scope mọi receipt bằng owner này; cùng key của hai user không đọc kết quả của nhau.
2. Validate key và schema, tạo canonical payload v1: chuẩn hóa theo field rules; điền default; serialize **mảng cố định** `[title, description, category, tags, visibility]` bằng JSON UTF-8 compact, encoder xuất ký tự Unicode hợp lệ trực tiếp, chỉ escape theo JSON; tags giữ thứ tự, không sort; hash SHA-256. Không hash request JSON thô hoặc localized labels. Đặc tả bytes/fixtures do backend phát hành trước tích hợp; FE chỉ giữ snapshot, không cần tính hash. Canonicalization/hash v1 của receipt phải giữ bất biến qua nâng cấp.
3. Lookup receipt `(user_id, idempotency_key)` **trước kiểm tra trùng tên**. Receipt trùng hash → đọc Deck theo `original_deck_id` và owner, trả 200 current projection; Deck không còn → 410. Khác hash → 409 `IDEMPOTENCY_KEY_REUSED` + ID gốc đã scope owner. Không dựa title để suy ra receipt.
4. Nếu chưa có receipt, validate nghiệp vụ và insert Deck + receipt trong **một transaction**. Receipt tối thiểu: `user_id`, `idempotency_key`, `canonical_hash`, `original_deck_id`, `created_at`; unique `(user_id, idempotency_key)` và Deck unique `(user_id, normalized_title)`. Không lưu thêm payload/response, không Redis lock/job cho create Deck.
5. Race cùng key/body: một transaction thắng; transaction còn lại rollback rồi đọc lại receipt đã commit, trả replay. Race hai key khác nhau cùng title: một Deck, request thua 409 title. Nếu cùng-key race nổ unique title trước receipt constraint, sau rollback vẫn kiểm tra lại receipt trước khi kết luận title conflict. DB lỗi chưa xác định/lock timeout trả 503, retry cùng key.
6. Không commit receipt khi transaction Deck rollback. Receipt giữ tới khi account bị xóa, **không TTL**, không FK cascade/SET NULL theo Deck; `original_deck_id` giữ nguyên sau UC-02.2 delete để trả 410. Có thể FK user cascade theo vòng đời account. Không hứa khôi phục sau xóa account hoặc mất snapshot client.

Receipt là chi phí backend cần thiết cho bài toán lost response và delete/replay đã xác định, không phải yêu cầu thêm nền tảng idempotency tổng quát. Nếu backend chỉ có title unique mà chưa có receipt, FE vẫn làm mock được nhưng **chưa đạt gate reliability để nghiệm thu thật**.

### Handoff UC-03.1 và các luồng tạo khác

Giữ quyết định Validation Session 2 của [UC-03.1](../261108-uc031-upload-file/plan.md): không truyền DeckId thì auto create, Private, category `"Tài liệu tải lên"`, response trả DeckId. Không dùng brainstorm BullMQ cũ để thay Hangfire. Đề xuất bổ sung, chưa sửa plan cũ:

1. Lấy basename tên file (không dùng path), bỏ extension cuối, thay `_` bằng space, áp one-line NFC/White_Space. Loại control không hợp lệ khỏi **tên sinh tự động**, không sửa thầm title người dùng nhập. Nếu còn <3 scalar, dùng `"Tài liệu tải lên"`.
2. Nếu dài >100, cắt theo scalar, trim lại, giữ tối đa100. Đây là xử lý tên **tự sinh**, không phải validation manual cho phép truncate.
3. Thử tên gốc; khi trùng owner, tạo `stem + " (2)"`, rồi `(3)`…; cắt/trim stem để **cả suffix ≤100** và vẫn ≥3. Tối đa 10 candidate (gốc, 2…10) để không loop vô hạn; mỗi lần dựa unique DB, không chỉ preflight. Hết lượt → lỗi đề xuất `409 UPLOAD_DECK_TITLE_CONFLICT`, hướng dẫn tạo/chọn Deck trước rồi upload lại. Không để lại Deck/Document rỗng do thất bại tạo tên.
4. Owner từ principal cho cả manual và auto; upload truyền DeckId có sẵn phải kiểm tra **quyền sửa của owner**, Public không đủ quyền gắn tài liệu vào Deck người khác. Không ép manual category thành “Tài liệu tải lên”; đây là default theo nguồn tạo, không khác luật dữ liệu.
5. Mọi response upload (200 clone/202 queued/waiting) dùng DeckId của người gửi, không lộ ID/nguồn của owner khác. C# `DeckId` ↔ wire `deck_id` phải có mapping/test; form `deckId` đang ghi trong phase cũ là điểm cần bàn giao mapping multipart, không giả định đã đổi thành snake_case.
6. UC-03.1 phải có cơ chế replay riêng cho **toàn bộ thao tác upload** để retry không tạo thêm Deck/job. Receipt của POST Deck không tự bảo vệ POST upload. File-hash lock/dedup AI không thay idempotency theo thao tác. Đây là handoff ngoài phạm vi UC-02.1, không claim đã giải quyết upload reliability.

UC-02.6 Fork sau này cũng phải dùng cùng owner/title unique và quyết định xử lý collision riêng; không copy UserCardState/mẹo cá nhân. UC-02.8 cần quy tắc gắn/tạo Concept và add card độc lập vì API mẫu UC-03.5 theo document không dùng được trực tiếp cho Deck thủ công không Document; ghi rõ khoảng trống này, không tạo Document giả để né.

Public chỉ công khai metadata/nội dung được phép đọc; không kế thừa `deck.IsPublic` trong UC-03.6 để stream nguồn. Khi chưa có policy chia sẻ nguồn độc lập, baseline source **owner-only**. Chưa triển khai membership/enrollment hoặc thay đổi policy citation cũ trong nhiệm vụ này.

## Related Code Files

**Không có file mã nguồn hiện tại để sửa.** Các đường dẫn `src/SmartLearn.*` trong plan cũ là dự kiến, chưa tồn tại. Phase này chỉ bàn giao DTO/invariant/replay và fixture cho Backend; không tạo entity/migration hoặc lớp API ở nhiệm vụ lập kế hoạch. File liên quan thật: [plan](./plan.md), [phase 2](./phase-02-create-deck-form-and-state.md), [phase 3 tích hợp](./phase-03-backend-integration.md), [phase 4 nghiệm thu](./phase-04-testing-and-verification.md), [bảng nguồn](../reports/2026-11-09-uc-02.1-create-deck-brainstorm.md).

## Implementation Steps

1. Khi triển khai, đối chiếu host/API thực tế với contract v1 trước khi tạo DTO; ghi mapping nếu khác wire format, không thêm hai chuẩn song song.
2. Chia sẻ fixtures Unicode/normalization, input/output/error examples với FE/BE; backend là authority duplicate và hash.
3. Backend cung cấp principal, validation, unique DB và receipt atomic theo yêu cầu trên; frontend dùng đúng payload và key.
4. Gửi handoff UC-03.1/03.6/02.6/02.8 theo ranh giới đã nêu khi các nhóm bắt đầu tích hợp; không chỉnh các plan cũ trong nhiệm vụ này.

## Success Criteria

- [ ] R01–R14 có nơi thực hiện và AC tương ứng.
- [ ] Mapping title/owner/visibility và request/response/errors được kiểm chứng qua API thật khi có mã.
- [ ] FE/BE dùng cùng fixtures scalar/NFC/White_Space; unique theo owner giữ dấu.
- [ ] Backend chứng minh race/replay/rollback trên PostgreSQL thật, không chỉ mock hoặc EF in-memory.
- [ ] Không áp AI commit vào manual create; không tạo source permission/membership ngầm.

## Risk Assessment

Rủi ro lớn nhất là backend triển khai ví dụ cũ `Name/IsPublic` hoặc chỉ preflight unique. Phase 3 yêu cầu bàn giao mapping và DB constraints thật; phase 4 kiểm chứng chúng trong nghiệm thu. Receipt cần giữ sau xóa Deck và canonicalization v1 ổn định; đổi thuật toán phải di trú. Giới hạn metadata/category/route là giả định được chốt, có thể cần điều chỉnh có chủ ý khi host xuất hiện; không coi đó là yêu cầu SRS nguyên văn.
