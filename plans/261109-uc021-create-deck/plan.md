---
title: "UC-02.1 Tạo Bộ thẻ mới"
description: "Kế hoạch Frontend cho thành viên 4: form tạo Deck, contract đề xuất, validation, khôi phục yêu cầu và tích hợp xuyên UC; chưa triển khai ứng dụng."
status: pending
priority: P1
branch: "MaiNN"
tags: [frontend, deck-management, ux, api-contract, planning]
blockedBy: []
blocks: []
created: "2026-11-09"
createdBy: "Codex"
source: "user-request"
---

# UC-02.1 Tạo Bộ thẻ mới

## Overview

Thành viên 4 xây dựng trải nghiệm tạo Bộ thẻ cho Học viên và Giảng viên từ Dashboard S-02 hoặc Không gian Bộ thẻ S-03. Bộ tài liệu này chỉ lập kế hoạch; mọi phase triển khai vẫn **pending**. Repository tại thời điểm khảo sát chỉ có `.gitignore` và `plans/`, chưa có mã nguồn, API, frontend framework, cấu hình build/test hay dependency ứng dụng. Branch thực tế là `MaiNN`; working tree sạch trước nhiệm vụ.

Không tìm thấy `AGENTS.md` tại workspace, các thư mục cha đã kiểm tra từ `D:/` tới repository, hoặc bên trong repository. Không có `.specify`, artifacts Spec Kit hay knowledge graph Understand Anything; không khởi tạo thêm bộ spec hoặc graph. Đã áp dụng Ponytail full và đọc hướng dẫn Documents để trích yêu cầu từ DOCX; không tạo hay sửa DOCX.

**Nguồn nghiệp vụ:** [SRS gốc](../../ref/Report3_Software_Requirement_Specification.docx), §2.2 UC-02.1, §3.1.5 Deck, §3.2.1 FE-01, §3.1.2 S-02/S-03, BR-10 và §5.2. DOCX đang dùng tên SmartLearn; UrSpace là tên repository/nhiệm vụ hiện tại. Không đổi tên SRS. Đường dẫn `ref/Report3_Software_Requirement_Specification.md` trong các plan cũ không tồn tại trong checkout; `.gitignore` có bỏ qua `ref/` nhưng không chứng minh có file đó.

**Kết quả đã chốt:** một modal dùng chung tại hai điểm mở, mobile hiển thị toàn màn hình; form gồm tiêu đề, mô tả, danh mục môn học, tags và Public/Private. Tạo Deck thủ công được phép có **0 thẻ, 0 khái niệm**. Không tạo Document, Concept, Flashcard, UserCardState, enrollment hoặc job AI giả. Tên duy nhất theo owner; backend lấy owner từ principal đã xác thực và chặn race bằng unique constraint. Contract, route và công nghệ frontend bên dưới đều là **đề xuất chưa triển khai**, không phải khả năng có sẵn của hệ thống.

### Use case contract

| Mục | Nội dung |
|---|---|
| Actor | Học viên hoặc Giảng viên; không tự cấp quyền tạo cho Guest/Admin chỉ vì Admin có quyền vào S-03 |
| Trigger | Nhấn “+ Tạo Bộ thẻ” tại S-02 hoặc S-03 |
| Preconditions | Tài khoản đang hoạt động, đã xác thực, thuộc actor được phép; có thể mở và điền form khi backend chưa sẵn sàng qua mock |
| Main flow | Mở modal → nhập metadata → chọn visibility → validate → lưu snapshot yêu cầu → POST → nhận DeckId → cập nhật danh sách → mở S-03 của Deck mới |
| Success postconditions | Chính xác một Deck cho thao tác; owner là người gửi đã xác thực; metadata hợp lệ; chưa có dữ liệu học tập con |
| Cancel postconditions | Hủy trước gửi không ghi server; đóng khi request đang gửi/chưa rõ kết quả chỉ đóng UI, không được coi là rollback |
| Failure postconditions | Rejection chỉ nói về lần request bị từ chối; nếu từng mất kết quả thì auth/quota/validation của lần retry không chứng minh thao tác trước chưa commit. Giữ key/payload tới khi reconcile được kết quả |
| Out of scope | Soạn/import thẻ, upload, khám phá Public, chia sẻ/Fork, cây kỹ năng, sửa/xóa Deck, AI, FSRS, membership, offline queue |

## Phases

| Phase | Name | Status | Priority | Deliverables |
|---|---|---|---|---|
| 1 | [Requirements and Deck Contract](./phase-01-requirements-and-deck-contract.md) | Pending | P1 | Truy vết yêu cầu, field rules, contract request/response/errors, owner/unique/replay, bàn giao upload |
| 2 | [Create Deck Form and State](./phase-02-create-deck-form-and-state.md) | Pending | P1 | Modal S-02/S-03, validation, state, keyboard/focus, responsive, phục hồi yêu cầu |
| 3 | [Backend Integration](./phase-03-backend-integration.md) | Pending | P1 | Mock tối thiểu, FE/BE handoff, nối auth/API, cập nhật danh sách và điều hướng S-03 |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P1 | 36 tình huống Given/When/Then, kiểm tra FE/API/DB, accessibility và gate nghiệm thu |

Phase 2 có thể làm với mock sau khi đọc contract phase 1 và đặc tả mock trong phase 3. Phase 3 nối backend thật khi các điều kiện bàn giao đạt; phase 4 kiểm thử và nghiệm thu kết quả. Các checklist là việc **sẽ làm**, không phải kết quả test đã chạy.

## Dependencies & Downstream Touchpoints

### Phân biệt dependency

| Loại | Phụ thuộc | Cách tiến hành / gate |
|---|---|---|
| Tài liệu/contract | SRS, yêu cầu hiện tại, quyết định tương thích từ 9 plan đã đọc | Đã khảo sát; không cần đợi các UC đó triển khai mới làm form |
| Triển khai FE độc lập | Host S-02/S-03, identity và client API chưa có mã | Dùng host/mock nhỏ trong môi trường triển khai sau này; không dựng ứng dụng trong nhiệm vụ này |
| Tích hợp thật | Auth principal + POST Deck + unique/replay bền vững + đọc Deck cho S-03 + hook refresh danh sách | Chặn **nghiệm thu end-to-end**, không chặn thiết kế/form dùng mock |
| Không phụ thuộc runtime | Hangfire, Redis, Gemini, SSE, DAG, FSRS, citation viewer | Không gọi khi tạo Deck thủ công |

`blockedBy: []` vì không có plan đã tồn tại nào chặn việc bắt đầu UC-02.1 với mock. Không khai báo mọi UC tham khảo là dependency triển khai; phần backend chưa tồn tại được liệt kê thành gate trong phase 3, không bịa tên plan upstream.

### Tích hợp xuyên UC

| UC | Quyết định tương thích / yêu cầu bàn giao |
|---|---|
| [UC-03.1](../261108-uc031-upload-file/plan.md) | Kế thừa Private, category “Tài liệu tải lên”, DeckId trong response. Dùng chung quy tắc title/owner/visibility; bổ sung xử lý tên file ngắn/dài/trùng và kiểm tra quyền Deck có sẵn theo phase 1. Upload vẫn do UC-03.1 chịu trách nhiệm |
| [UC-03.2](../261108-uc032-sse-progress/plan.md) | Đọc để kiểm tra handoff DeckId; manual create không mở SSE, không truyền token qua URL |
| [UC-03.3](../261108-uc033-concept-nodes/plan.md) | Concept liên kết Deck; Document có thể vắng mặt. Giữ ownership; điều kiện commit ≥1 concept chỉ áp cho kết quả AI theo document |
| [UC-03.4](../261108-uc034-dag-tarjan/plan.md) | Không tạo DAG/node placeholder cho Deck rỗng; không thay quyết định cạnh/commit |
| [UC-03.5](../261108-uc035-flashcards-curation/plan.md) | ≥1 selected card chỉ là điều kiện AI commit. Create Deck không khởi tạo UserCardState hoặc đánh dấu Document Completed |
| [UC-03.6](../261108-uc036-citation-source/plan.md) | Public Deck không tự công khai PDF/PPTX, stream URL hoặc nguồn. Handoff xung đột ví dụ `deck.IsPublic`; không thêm DeckMembers/Enrollments |
| [UC-05.10](../261108-uc0510-study-reminder/plan.md) | Deck rỗng không tạo thẻ due/nhắc học; notification route `/dashboard` không quyết định đích sau tạo Deck |
| [UC-06.3](../261108-uc063-mnemonic-generator/plan.md), [UC-06.4](../261108-uc064-save-mnemonic/plan.md) | Nội dung dùng chung tách state/mẹo cá nhân; tạo Deck không sinh/copy state hoặc mnemonic |
| UC-02.6 | SRS BR-10: Public chỉ đọc với người khác; Fork phải tạo owner/title riêng, không sao chép state học tập cá nhân; chưa triển khai Fork |
| UC-02.7 | Yêu cầu bổ sung từ người dùng, không nằm trong danh mục SRS đang có: discovery dùng visibility, không làm lộ Private hoặc source; không xây trang khám phá trong UC này |
| UC-02.8 | Yêu cầu bổ sung từ người dùng: import/preview/edit nhận DeckId container đã tạo; luồng thẻ/concept riêng, không ép có card ngay khi tạo |

## Validation Log

### Session 1 — 2026-11-09 — Automated agent review

**Nguồn xác nhận:** yêu cầu hiện tại và tài liệu được đối chiếu. Đây là **automated agent review**, không phải người dùng đã xác nhận thiết kế. Không có câu hỏi/câu trả lời giả của người dùng.

**Khảo sát trước thiết kế:** người điều phối và ba agent thực tế `requirements_ux` (A), `architecture` (B), `critical_reviewer` (C) khảo sát độc lập. Đã đọc 9 `plan.md`, Validation Log/Confirmed Decisions, các phase trực tiếp UC-03.1/03.3/03.5/03.6/06.4, SRS OOXML và audit. Báo cáo audit được kiểm chứng bằng phase chi tiết; điểm số và các câu “100%/production-ready” không được dùng làm bằng chứng kiểm thử. Bảng đối chiếu và bằng chứng ở [brainstorm](../reports/2026-11-09-uc-02.1-create-deck-brainstorm.md).

**Vòng phản biện 1:** A/B/C phản biện trực tiếp về retry, Unicode, Public/source, tag đang nhập và receipt sau xóa Deck. Dừng sau một vòng vì các bất đồng quan trọng đã có bằng chứng và phương án tối thiểu. Người điều phối quyết định, không biểu quyết.

### Confirmed Decisions — người điều phối chốt bằng chứng, chưa phải triển khai

| ID | Quyết định cuối | Phân loại / giới hạn |
|---|---|---|
| D01 | Modal dùng chung; mobile toàn màn hình | Giả định UX; giữ ngữ cảnh hai điểm mở, không thêm route tạo riêng |
| D02 | Manual mặc định Private; được chọn Public | Giả định mặc định dựa UC-03.1 Session 2; Public không cho người khác sửa hoặc đọc nguồn |
| D03 | NFC + tập White_Space cố định; đếm Unicode scalar; unique theo owner với khóa `ToUpperInvariant` ở backend, giữ dấu | Giả định chuẩn hóa; không dùng JS case conversion làm căn cứ trùng tên; canonicalization v1 cố định |
| D04 | Category text tùy chọn, blank → “Chưa phân loại”; mô tả tùy chọn | Giả định vì chưa có taxonomy/API danh mục; upload giữ category riêng “Tài liệu tải lên” |
| D05 | Description ≤2.000, category ≤100, mỗi tag 1–30; tối đa 10 tags, không trùng theo khóa server | Các giới hạn thêm là giả định; 10 tags là SRS. Không silent truncate dữ liệu thủ công |
| D06 | Success mở `/decks/{deck_id}` (S-03); update danh sách bằng ID rồi refetch | Route là đề xuất; không nhảy thẳng sang học hoặc cây rỗng |
| D07 | JSON snake_case; C# `Title/UserId/Visibility`; đề xuất React + TypeScript cho FE | Chưa có serializer/framework thật; .NET không bắt buộc framework FE. Không cài package ở nhiệm vụ này |
| D08 | `Idempotency-Key` + receipt riêng cho create Deck, lưu cùng transaction, không TTL, giữ tới xóa account | Giả định reliability; receipt còn sau xóa Deck để replay trả 410, không tái tạo ngầm; không xây framework idempotency tổng quát |
| D09 | Snapshot frozen theo account/tab trong sessionStorage trước POST; không gửi nếu lưu thất bại | Giả định phục hồi qua reload trong tab; xóa logout nên không hứa khôi phục draft xuyên logout/đóng tab |
| D10 | Cho phép Deck rỗng; không tạo object giả hay áp AI commit minimum | Kết luận thiết kế từ tách FE-01 create/add card, được yêu cầu hiện tại nhấn mạnh |
| D11 | Upload dùng cùng invariant, sinh tên có fallback/truncate/suffix và retry giới hạn | Bàn giao đề xuất cho UC-03.1; không âm thầm coi plan cũ đã hỗ trợ |
| D12 | Public đọc nội dung với người dùng khác đã xác thực; nguồn mặc định owner-only khi chưa có policy chia sẻ riêng | Giả định audience tối thiểu theo ma trận S-03; quyền Guest discovery để UC-02.7 xác định ngoài phạm vi này |

Phase 1 là nguồn duy nhất cho chi tiết field/API; phase 2 cho state/UX; phase 3 cho tích hợp và handoff; phase 4 cho kiểm thử và acceptance. Không có phương án song song chưa chốt.

### Written-artifact review — bản ban đầu 3 phase

Agent C đã đọc đủ năm file đã ghi, báo một phát hiện nghiêm trọng:429/403 ở lần retry không chứng minh operation trước chưa commit. Người điều phối đã sửa contract, trạng thái form, quy tắc clear snapshot, postconditions và AC14/AC35; C đọc lại và xác nhận phát hiện đã được xử lý, không còn phát hiện trọng yếu. Hai hàng lỗi400/409 title cũng đã thêm điều kiện first-attempt chưa unknown ngay tại bảng để không hiểu sai khi đọc riêng.

Người điều phối đã đọc lại toàn bộ năm file, đối chiếu plan/phase/contract/AC và chạy kiểm tra cấu trúc: **58 liên kết local tồn tại,3 ví dụ JSON parse được,14 requirement IDs,12 decision IDs và36 acceptance IDs đầy đủ**; frontmatter của plan và3 phase đều pending, code fences cân bằng. `git diff --exit-code` xác nhận không sửa file đã được theo dõi; chỉ có năm file mới đúng phạm vi. Không có phát hiện nghiêm trọng còn bị chặn trong **bộ tài liệu**; tích hợp ứng dụng thật vẫn phụ thuộc Backend/host chưa tồn tại như đã ghi.

**Không có test ứng dụng, migration hay benchmark được chạy trong nhiệm vụ lập kế hoạch.**

### Session 2 — 2026-11-09 — Tách thành 4 phase theo yêu cầu người dùng

Người dùng yêu cầu chia thành 4 phase. Người điều phối tách phase 3 cũ: tích hợp Backend giữ ở phase 3, toàn bộ 36 tình huống và gate nghiệm thu chuyển nguyên vẹn sang phase 4. Cập nhật tên file, liên kết, bảng Phases và dependencies; các quyết định D01–D12 và yêu cầu R01–R14 không đổi. Plan và cả 4 phase vẫn pending. Phần review 5 file/58 liên kết ở trên là lịch sử bản 3 phase, không phải kết quả kiểm tra bản mới; kết quả sau tách được ghi trong báo cáo brainstorm.
