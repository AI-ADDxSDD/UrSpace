# Thành viên 4 — Đối chiếu nguồn và contract dùng chung

## Phạm vi và hiện trạng

Ngày 2026-11-09, người dùng xác định danh sách gồm UC-02.1–02.6 và UC-04.1–04.3. UC-02.1 đã có bộ 4 phase; nhiệm vụ này lập kế hoạch cho **8 UC còn lại**, chưa viết mã ứng dụng. UC-02.7/02.8/04.4 không có bộ plan mới. Tất cả status triển khai vẫn pending. Người dùng đã xác định phạm vi và số phase, chưa xác nhận các giả định thiết kế dưới đây.

Repository chỉ có tài liệu, không source/scaffold/API/serializer/test runner. Branch MaiNN. Không tìm thấy AGENTS.md áp dụng, .specify hoặc knowledge graph; không khởi tạo thêm. Các đường dẫn src/SmartLearn.* trong plan cũ là dự kiến. SRS thật là [DOCX gốc](../../../Report3_Software_Requirement_Specification.docx); bản ref/Report3_Software_Requirement_Specification.md không tồn tại. Đã đọc skill Ponytail full; Documents dùng để đọc SRS OOXML, không tạo/sửa DOCX. Không cài package, migration, app test, commit/push hoặc sửa plan cũ, kể cả UC-02.1.

## Bảng đối chiếu trước thiết kế

SRS paragraph là chỉ số zero-based //w:body//w:p, không phải số trang. Nhãn SRS = yêu cầu gốc; Plan = quyết định thiết kế; Example = code minh họa; Cxx = giả định/contract mới; hiện trạng = file thật.

| Nguồn/file/section | Quyết định/bằng chứng | Ảnh hưởng | Kế thừa/điều chỉnh |
|---|---|---|---|
| SRS §2.2 ¶167–186 | UC02.2–6: sửa/archive/delete Deck, editor Markdown/LaTeX/Code, card CRUD, search D/S/tags, Public/Fork | 5 UC nội dung | Kế thừa; không biến thành CRUD Backend thuần |
| SRS §2.2 ¶207–218, §3.3.3 ¶464–466 | 2D DAG, trạng thái màu, detail/prerequisites | UC04.1–3 | Kế thừa; frontend không tính FSRS |
| SRS §3.1.5 ¶426–444; §3.2.2 ¶455 | Deck title/user_id; card phải link Concept, state cá nhân | Owner, manual card, graph | Kế thừa; Card.tags/source/version là extension mới |
| SRS BR10 ¶543, §4.2.4 ¶514–515 | Public read-only, Fork để sửa; private source row access | Shared content khác quyền ghi/nguồn | Kế thừa; không thêm enrollment |
| SRS §4.1/§4.2.1/§5.2 | Responsive, WCAG2.1AA, VI/EN, UTF-8, errors timestamp/error_code/user_message | Mọi phase | Bắt buộc, không chỉ happy path |
| SRS §4.2.3 ¶512, BR04 ¶531 | 60FPS tới300concepts; M≥.85 mở khóa | Graph NFR khác màu R≥.9 | Không thay threshold hoặc coi đã benchmark |
| [UC021 contract](../261109-uc021-create-deck/phase-01-requirements-and-deck-contract.md) | Title/owner/visibility, scalar bounds, retry/receipt, Deck rỗng | Shared metadata, delete receipt | Kế thừa; không sửa bộ021, extension được bàn giao |
| [UC031 plan](../261108-uc031-upload-file/plan.md), Validation2; [storage phase](../261108-uc031-upload-file/phase-01-database-and-storage-layer.md) | .NET/EF/PostgreSQL; Hangfire thay BullMQ; Document.deck_id SET NULL, file giữ lâu dài | Delete không xóa nguồn; no AI runtime cho manual | Kế thừa Validation mới; version/archive gate phải bàn giao upload/worker |
| [UC032 plan](../261108-uc032-sse-progress/plan.md), Confirmed Decisions | Completion summary deck_id | Invalidate graph/cards sau commit | Điểm tích hợp; không mở SSE trong CRUD thường |
| [UC033 schema](../261108-uc033-concept-nodes/phase-01-database-entity-and-ef-core-migration.md), ownership/commit [plan](../261108-uc033-concept-nodes/plan.md) | Concept.deck_id bắt buộc, document nullable; ≥1 khi AI commit, ≤50/document | Manual concept độc lập; Deck graph có thể300 | Không áp minimum/cap50 lên toàn Deck |
| [UC034 plan](../261108-uc034-dag-tarjan/plan.md), Confirmed Decisions | U→V nền tảng→nâng cao; ACTIVE edges cùng AI commit | Viewer/ancestors/Fork remap | Kế thừa; không xây editor cạnh hoặc chạy Tarjan trong FE |
| [UC035 schema](../261108-uc035-flashcards-curation/phase-01-database-entity-and-ef-core-migration.md); [service](../261108-uc035-flashcards-curation/phase-02-grouped-flashcards-service-and-inline-edit.md) | FK Deck/Concept; front1..5000/back1..10000; ví dụ manual theo Document/DRAFT và .Trim | Manual ACTIVE khác AI draft; giữ indentation | Kế thừa bounds; Example .Trim không thắng yêu cầu Markdown; cần API deck-scoped |
| [UC036 phase2](../261108-uc036-citation-source/phase-02-citation-service-and-security.md) | Prose owner/authorized learner nhưng example cho deck.IsPublic stream | Public không mặc nhiên source | Không kế thừa sample rộng quyền; nguồn owner-only baseline |
| [UC0510 plan](../261108-uc0510-study-reminder/plan.md) | Notification dựa due UserCardState | Archive loại study/reminder, fresh states khi Fork | Handoff gate mới; không gọi job ở UI |
| [UC063 plan](../261108-uc063-mnemonic-generator/plan.md), Confirmed Decisions | Invalidate shared cache khi Front/Back đổi | Edit card atomic cache invalidation | Kế thừa; no AI regenerate tự động |
| [UC064 plan](../261108-uc064-save-mnemonic/plan.md), Confirmed Decisions | Pin cá nhân giữ khi sửa, không ghi flashcards.back | Edit/Fork/delete khác lifecycle | Giữ pins khi edit; no copy pins khi Fork; cascade khi delete |
| [Audit cũ](./2026-11-08-cross-plan-consistency-and-feasibility-audit.md) | Điểm cao/100%/production-ready | Không phải test evidence | Đã kiểm tra lại phase; Name/Title, source, schema gaps vẫn có |

Cả 9 plan cũ đã được khảo sát ở nhiệm vụ UC021 và đọc đối chiếu lại các đoạn liên quan; A/B/C khảo sát độc lập trong lượt này. Không xem pending là feature triển khai. Frontend React+TypeScript vẫn là đề xuất từ UC021, .NET không bắt buộc React. Reuse host/editor/cache/auth/locale khi có; không cài package hoặc tạo abstraction trước.

## C01 — Identity, vocabulary và quyền đọc

JSON snake_case, C# Title/UserId/Visibility, UUID; không dùng Name/IsPublic làm nguồn thứ hai. Owner chỉ từ principal JWT hợp lệ. Guest401; actor ghi chỉ Learner/Instructor. Tài nguyên ngoài Deck path, Private/non-owner hoặc Deck archived/non-owner trả404; thiếu quyền ghi trên Public có thể403 nhưng không lộ Private. Public cho authenticated viewer đọc **ACTIVE content**; DRAFT/DISCARDED không vào search/graph/Fork/detail. Không tạo membership.

Nguồn Document/file có quyền riêng: Public/clone không cấp stream nguồn. Citation UI chỉ theo capability đã xác thực; server nguồn vẫn kiểm tra ở mọi request. Source owner-only khi chưa có policy riêng. Không trả file_path/raw_ai_payload/URL/token hoặc pins/state của tác giả trong public DTO.

## C02 — Metadata, card text và tags

Deck metadata kế thừa UC021: title3–100 scalar sau NFC/White_Space, unique(user_id,normalized_title) theo invariant backend giữ dấu, description≤2000/category≤100/tags≤10×30; Private mặc định khi Fork; category free-text. Khóa unique tính cả archived. Front/back non-whitespace, lần lượt≤5000/10000 Unicode scalar; **giữ nguyên Unicode, leading spaces, indentation, TAB và Markdown/LaTeX/Code**, chỉ normalize CRLF/CR→LF đã chốt. Không NFC/trim/gộp whitespace như title; reject unpaired surrogate/control ngoài TAB/LF. Preview/render sanitize, raw text vẫn round-trip. Không raw HTML/scripts/unsafe links/remote image tự tải; preview hiển thị placeholder ảnh ngoài để tránh tiết lộ IP từ metadata không tin cậy.

Card.tags là **extension mới** text-array, mặc định[], tách Deck.tags, không tự inherit. Tag normalization/duplicate/10×30 giống UC021; owner mới được sửa. Concept.name mới1–255scalar, NFC/one-line như title, không whitespace-only; summary mới rỗng, difficulty BASIC, order cuối; không áp unique tên Concept chưa có yêu cầu.

## C03 — Version và concurrency

Đề xuất Deck.deck_version nguyên dương, khởi tạo1. Mọi thay đổi shared metadata/archive/card/tag/concept/edge, AI final commit, upload attach/content commit tăng version trong cùng transaction; read/study/pin cá nhân không tăng. GET Deck phải trả deck_version; POST021 cũ không bắt buộc đổi response vì editor luôn GET trước ghi. Writer gửi expected_deck_version nguyên dương, stale409 VERSION_CONFLICT; giữ draft, đọc latest để người dùng xem lại, không tự bump version và overwrite. Delete-impact/counts gắn version, confirm cũ không được xóa nội dung mới âm thầm.

Version và archive/ownership checks phải cùng transaction/lock với mutation; lock/serializable retry conflict trả503 có thể kiểm tra lại, không preflight-only. Đây là **yêu cầu bàn giao mới** cho writer AI cũ, chưa chứng minh old plans đã hỗ trợ. Cache validators cho dữ liệu cá nhân không được chỉ dựa deck_version.

## C04 — Frozen mutation, receipt và retry

Mọi mutation trong 8 UC gửi Idempotency-Key UUIDv4, scope theo (subject,operation,target_resource,key). Canonical fingerprint chứa operation/resource, payload và expected version, giữ ổn định; backend authority, không hash localized strings. Reuse thiết kế receipt của021 nếu backend phù hợp, không yêu cầu framework middleware tổng quát. Receipt commit nguyên tử cùng effect; unique scope ở DB, race cùng key chỉ một effect. Giữ theo vòng đời account, không cascade khi Deck/card bị xóa; không TTL tự hết giữa recovery.

Sau auth/subject isolation, lookup receipt **trước** kiểm tra current resource/source/version. Create card/Fork replay200 cùng ID/projection hiện tại; target đã xóa thì410 kết thúc, không resurrect. Edit/tag/archive replay200 ghi rõ operation đã áp dụng và trả current resource; target sau đó xóa thì410. **Delete replay200 trả tombstone thành công**, resource absent không biến thành lỗi. Không dựa title hoặc404 để đoán kết quả delete. Khác payload cùng key409 IDEMPOTENCY_KEY_REUSED, có result_resource_id scope đúng user để reconcile.

Frontend freeze final payload/version/key, persist snapshot sessionStorage **trước** request. Khóa lưu trữ phải gồm subject + operation + resource (tab được sessionStorage cô lập); một mutation mới không được ghi đè snapshot unknown của UC/resource khác. Mỗi slot có in-flight guard riêng; logout xóa mọi slot của subject. Nếu lưu snapshot thất bại thì không gửi, giữ draft. Guard in-flight trước await, không chỉ disable. Timeout/abort/5xx/2xx malformed/reload là unknown; retry cùng snapshot/key, không edit/new key. 400/403/409/429 của retry không phủ định commit trước, giữ recovery; rate Retry-After chỉ lùi thời điểm, không rollback. First-attempt validation/version rejection chưa unknown mới cho sửa và operation mới. Modal close chỉ ẩn UI; response muộn cập nhật đúng account, không cướp route. Logout/account switch xóa local snapshot, response cũ không cập nhật account mới; không hứa khôi phục xuyên logout/tab/storage loss. Sau login refetch owner library.

## C05 — Archive và hard delete

Archive là flag is_archived riêng, không Deck.Status AI. Owner đọc/restore/hard-delete; không sửa nội dung khác lúc archived. Public read/share/Fork/study/reminder bị chặn cho mọi viewer; dữ liệu/state/log còn nguyên. Restore là hành động rõ, không auto-restore để ghi. Đây là giả định chi tiết hóa SRS archive. UI phải nói rõ thu hồi truy cập/học của người khác.

Hard delete Deck theo SRS xóa Concept/relations/cards, **state/review logs/mastery/pins/cache của mọi người học** gắn nội dung đó. ReviewLog immutable với thao tác thường không phủ định explicit cascade-delete. Document.deck_id detach SET NULL, giữ Document/file/raw payload theo lifecycle upload và owner-only; không xóa nguồn, không phát ngôn “xóa mọi dữ liệu”. Receipt giữ nguyên. Backend điều phối job/AI commit để không ghi vào Deck deleted/archived; không auto tạo lại Deck. Xóa card cascade state/log/pin/cache liên quan nhưng không xóa Concept/DAG; Concept0card vẫn hợp lệ.

## C06 — Manual card và provenance

POST deck-scoped nhận concept_id ACTIVE cùng Deck **XOR** new_concept{name} do người dùng nhập. Không cần Document/AI. Tạo Concept thật (nếu có), card ACTIVE STANDARD và owner state NEW/reps0/DueNow trong một transaction, unique(user_id,card_id); rollback toàn bộ khi lỗi. Không tạo Concept giả ở Deck create; chỉ tạo theo input lúc thêm thẻ.

Source extension mới: card.source_document_id/page/excerpt nullable; manual card luôn null, kể cả chọn Concept AI. Concept thủ công cũng không có source. Không giả trang1 từ default cũ; handoff migration/backfill AI provenance đúng nguồn trước tích hợp citation. Card edit giữ card_type/structured fields hiện tại, không chuyển MC/CLOZE sang STANDARD; bản này không tạo MCQ editor. Backend phải validate toàn bộ kết quả theo schema của loại thẻ, gồm marker CLOZE hợp lệ và quan hệ đáp án/choices của MC. GET trả can_edit_text; loại/schema chưa được Backend hỗ trợ trả false và UI chỉ đọc với lý do. Bypass capability bị409 UNSUPPORTED_CARD_SCHEMA; nội dung làm loại thẻ sai semantic bị400 CARD_TYPE_VALIDATION_ERROR, rollback cả cache/version. Không fallback/drop structured fields để lưu cho qua. Lưu is_content_edited khi front/back đổi để source anchor còn được đánh dấu đã chỉnh sửa. Invalidate shared mnemonic cache trong cùng transaction; giữ mọi FSRS/review/pin cá nhân khi edit; không nối pin vào back.

## C07 — Read/search cá nhân

D (1..10), S (>=0) là UserCardState của current viewer, không Concept difficulty_level/owner metrics. NEW/reps0/no-state trả null D/S cho UI “Chưa học”, không giả số0 đã đo. Read không tạo state. Numeric filters loại null; filter chưa học là lựa chọn riêng; mặc định không filter vẫn thấy card mới. Giữ S-filter theo SRS ¶182 dù danh sách người dùng chỉ nhấn D.

Search literal keyword front/back (không regex), q≤100scalar, không bỏ dấu mặc định; parameterized query và escape %/_. Tags card OR giữa tags được chọn; keyword AND các nhóm range/tags. Range finite D1..10, S≥0, min≤max; invalid400. Pagination opaque next_cursor, page_size20/max100, ordering created_at DESC + card_id; query đổi reset cursor. Mỗi trang là snapshot tại thời điểm đọc, không hứa đóng băng membership D/S xuyên nhiều trang. Thứ tự/cursor ổn định khi content và dữ liệu viewer không đổi; deck_version đổi giữa trang trả409 LIST_CHANGED để refresh từ đầu. Nếu viewer học/undo ở tab khác làm D/S đổi mà deck_version giữ nguyên, membership giữa trang có thể đổi; UI Refresh phải reset cursor và đọc lại từ đầu. Không bịa viewer revision hoặc coi content version là snapshot FSRS. Race response latest query wins; debounce300ms là giả định UX, không search endpoint mỗi phím khi IME composing.

GET có D/S/R/M, graph/detail/cardlist: Cache-Control private,no-store; mọi cache local keyed subject+Deck+query. Refetch mount/focus/explicit refresh và sau mutation/study của chính người xem; không timer/polling mới. Không dùng content version trả304 cho trạng thái R đổi theo thời gian.

## C08 — Fork

Copy link chỉ URL HTTPS tuyệt đối trên trusted app origin, trỏ /decks/{id} khi Public và không archived; Private yêu cầu owner chủ động đổi visibility qua022, không tự công khai. Clipboard fail có URL để chọn/copy, không mời user/membership.

POST /api/v1/decks/{source_id}/fork body title,expected_source_version; target Private, description/category/Deck.tags kế thừa snapshot, card tags giữ. Kiểm tra Public/notArchived/source version và clone trong cùng transaction serializable/lock tương thích với source mutation; source đổi trước snapshot được chấp nhận thì409/404, không partial target. Clone **ACTIVE** Concept/cards/internal edges với IDs mới/remap FK và giữ direction/order/difficulty. Empty Public Deck có thể Fork. Tạo state NEW/DueNow cho owner đích, không copy D/S/reps/log/mastery/pin/cache. Drop Document/file/raw payload/source anchors của bản sao.

Title do người dùng nhập, theo021/DB unique, không tự suffix manual. Clone độc lập: nguồn private/delete sau success không thu hồi target đã Fork hoặc bytes đã gửi. Receipt lookup trước source-current checks giúp replay vẫn thành công; target deleted thì410. Không delta-sync/quota/AI ngoài scope.

## C09 — Graph, trạng thái và filter

GET /api/v1/decks/{id}/graph trả deck_version,evaluated_at,nodes ACTIVE và edges ACTIVE cùng snapshot; IDs cùng Deck, không dangling/cycle. U→V nghĩa U tiên quyết của V, chuẩn034. Manual Concept có thể không edge; zero graph empty state. FE chỉ viewport zoom/pan/node drag vị trí trong memory, không sửa quan hệ/order/FSRS hoặc lưu layout. Đề xuất dùng React Flow nếu host chọn React; dependency chưa installed và không cài ở nhiệm vụ này.

Backend thành viên 3 cung cấp status theo current viewer: GAP nếu flag; nếu tổng số lượt review của viewer trên tập card ACTIVE bằng0 (hoặc tập rỗng) thì UNLEARNED; MASTERED chỉ khi tập ACTIVEcard không rỗng và **mọi card có state đã review, R hữu hạn hợp lệ[0,1] và≥.9**; còn lại LEARNING. Không SQL aggregate bỏ qua null rồi cho xanh. Color: gray/blue/green/red kèm label/icon. Quy tắc gộp này là **giả định mới/gate Backend**, không claim SRS đã định nghĩa aggregation. M≥.85 dùng unlockqueue riêng; FE không tính R/M.

Mục tiêu SRS:60FPS zoom/pan tới300Concepts; phải đo trên browser/device cấu hình được ghi, chưa có benchmark. ≤50 là perDocument AI, không cap Deck. >300 hiển thị cảnh báo và HTML list đầy đủ có phân trang local; canvas chỉ mở chủ động với cảnh báo giới hạn, không silent truncate hoặc hứa60FPS ngoài target.

Filter042 là local OR checkbox bốn status, default all; none hiện empty-filter. Render induced subgraph: chỉ edge có hai đầu visible, không tạo cạnh bắc cầu. Giữ full graph trong memory cho ancestor detail, filter không mutate dữ liệu/status/DAG. Giữ viewport khi filter/refetch; selected node đang hiển thị bị ẩn bởi toggle/refetch thì đóng drawer, focus filter; có HTML list keyboard thay thế canvas. Ngoại lệ: người dùng chủ động mở ancestor vốn đang bị filter ẩn vẫn được xem drawer với badge; không dùng effect chung “selected không visible thì đóng” để phá luồng điều hướng này.

## C10 — Concept drawer

GET /decks/{id}/concepts/{concept_id}?expected_deck_version=v, đọc cùng snapshot content version của graph; mismatch409 GRAPH_CHANGED → refresh graph, không ghép edges từ snapshot cũ. Response summary, direct_prerequisites, ancestor_nodes+ancestor_edges (chuỗi bắc cầu có visited-set, theo PREREQUISITE_OF), card_count ACTIVE, viewer status/metrics và can_view_source. card list dùng C07 có concept_id, cùng version, phân trang. Summary không tự biến thành excerpt nguồn. Quyền citation của Concept dựa provenance của chính Concept: Concept AI gốc còn nguồn và owner đủ quyền có thể can_view_source=true dù có related card thủ công. Card thủ công vẫn source=null riêng, kể cả gắn Concept AI. Concept mới thủ công/Fork Concept không nguồn thì false; Public viewer không được suy quyền nguồn.

Drawer desktop/mobile fullscreen, click ancestor đổi selection nội bộ, không reset filter/viewport; node hidden có badge. Abort/ignore late response theo subject/Deck/concept/version. Đóng focus node còn visible hoặc filter. Citation chỉ khi can_view_source; server nguồn403 thì giữ detail và báo riêng. Không edit edges/concepts/cards trong drawer; link editor chỉ khi quyền/route đã có.

## C11 — HTTP và giao diện dùng chung

Success {data:...}, collection {data:{items,next_cursor,deck_version}}. Error luôn timestamp,error_code,user_message; field_errors thêm khi cần. 400 VALIDATION_ERROR;401 AUTHENTICATION_REQUIRED;403 WRITE_FORBIDDEN;404 RESOURCE_NOT_FOUND;409 VERSION_CONFLICT/GRAPH_CHANGED/GRAPH_INVALID/DECK_ARCHIVED/UNSUPPORTED_CARD_SCHEMA/LIST_CHANGED/DECK_TITLE_EXISTS/IDEMPOTENCY_KEY_REUSED;400 CARD_TYPE_VALIDATION_ERROR;410 RESULT_DELETED;429 RATE_LIMITED+Retry-After;500/503 SERVER_ERROR/SERVICE_UNAVAILABLE. Không parse localized message, không stack/SQL/token. API/route/schema tất cả **đề xuất**; C# serializer mapping cần test thật.

Mọi form/dialog: VI/EN, labels/help/errors, dirty-cancel giữ dữ liệu, error summary focus, live status, IME, Tab/ShiftTab/Escape/restore focus, 320/375/768/1024/1280px và zoom200%, WCAG2.1AA. Danger confirm đọc rõ impact; không dựa màu. Reuse host, platform controls; không tạo editor rich-text framework hoặc trạng thái app toàn cục chưa cần. Markdown/LaTeX/code renderer reuse nếu đã có, dependency quyết định khi triển khai sau khảo sát host.

## C12 — Phụ thuộc và review

blockedBy của mỗi plan là[] vì FE làm bằng mock được. Điều kiện triển khai thật ghi trong phase3/4; không biến mọi UC tham khảo thành blocker. Có4phase:1req/contract,2UI/state,3Backend integration,4testing. Graph filter/detail mock độc lập nhưng end-to-end cần041 host+API; manual/Fork cần actualDB/receipt; delete cần lifecycle worker coordination. Không triển khai các dependency đó trong nhiệm vụ tài liệu.

A requirements_ux, B architecture, C critical_reviewer khảo sát độc lập và phản biện trực tiếp một vòng. Root chốt bằng bằng chứng; không số phiếu, không giả user chấp thuận. Bất đồng đã sửa: placeholder Concept→input Concept thật; trim Markdown→preserve; missingR→không xanh; no-copy-state Fork→fresh New states; delete replay khác create410; archived ngoại lệ restore/delete; scope8 bỏ miniQuiz/import/discovery. Xem Validation Log từng plan và [chỉ mục](./2026-11-09-member4-planning-index.md) cho review bản đã ghi và kiểm tra tài liệu thực tế.
