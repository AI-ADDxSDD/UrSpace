# Thành viên 4 — Chỉ mục kế hoạch còn lại

## Kết quả và phạm vi

Ngày 2026-11-09. Người dùng xác nhận UC-02.1–02.6 và UC-04.1–04.3 thuộc phần phụ trách. UC-02.1 đã có [bộ 4 phase](../261109-uc021-create-deck/plan.md); lượt này chỉ tạo 8 bộ còn lại, mỗi bộ plan + 4 phase + brainstorm. Tổng **50 file mới** gồm 48 file theo UC, một đối chiếu/contract chung và chỉ mục này. Chỉ lập kế hoạch, không triển khai ứng dụng.

| UC | Nội dung | Kế hoạch 4 phase | Nguồn/quyết định | Số AC |
|---|---|---|---|---|
| UC-02.2 | Cập nhật và Xóa Bộ thẻ | [Plan](../261109-uc022-update-delete-deck/plan.md) | [Brainstorm](./2026-11-09-uc-02.2-update-delete-deck-brainstorm.md) | 16 |
| UC-02.3 | Thêm Thẻ thủ công | [Plan](../261109-uc023-add-manual-flashcard/plan.md) | [Brainstorm](./2026-11-09-uc-02.3-add-manual-flashcard-brainstorm.md) | 16 |
| UC-02.4 | Chỉnh sửa và Xóa Thẻ | [Plan](../261109-uc024-edit-delete-flashcard/plan.md) | [Brainstorm](./2026-11-09-uc-02.4-edit-delete-flashcard-brainstorm.md) | 16 |
| UC-02.5 | Tìm kiếm Lọc và Gắn Tag | [Plan](../261109-uc025-search-filter-tags/plan.md) | [Brainstorm](./2026-11-09-uc-02.5-search-filter-tags-brainstorm.md) | 16 |
| UC-02.6 | Chia sẻ và Sao chép Bộ thẻ | [Plan](../261109-uc026-share-fork-deck/plan.md) | [Brainstorm](./2026-11-09-uc-02.6-share-fork-deck-brainstorm.md) | 16 |
| UC-04.1 | Xem Bản đồ Cây Kỹ năng 2D | [Plan](../261109-uc041-skill-tree-view/plan.md) | [Brainstorm](./2026-11-09-uc-04.1-skill-tree-view-brainstorm.md) | 16 |
| UC-04.2 | Lọc Đồ thị theo Trạng thái | [Plan](../261109-uc042-skill-tree-status-filter/plan.md) | [Brainstorm](./2026-11-09-uc-04.2-skill-tree-status-filter-brainstorm.md) | 14 |
| UC-04.3 | Chi tiết Khái niệm và Tiên quyết | [Plan](../261109-uc043-concept-detail-prerequisites/plan.md) | [Brainstorm](./2026-11-09-uc-04.3-concept-detail-prerequisites-brainstorm.md) | 16 |

Tổng 126 Given/When/Then chưa thực thi. Tất cả frontmatter triển khai pending, blockedBy=[] cho phép FE bắt đầu với mock. Mỗi bộ có dependency phase theo thứ tự 1→2→3→4, không bịa feature upstream đã có.

## Cách đọc và thứ tự làm

Đọc [đối chiếu nguồn và contract C01–C12](./2026-11-09-member4-shared-contracts-and-source-review.md) trước, sau đó plan của từng UC:

1. Phase 1 chốt yêu cầu/contract và truy vết nguồn.
2. Phase 2 thiết kế UI/state/focus/validation.
3. Phase 3 mock, Backend handshake và nối API/host.
4. Phase 4 kiểm thử và nghiệm thu với evidence thật.

Nhóm nội dung: 02.2 quản lý Deck; 02.3 thêm thẻ; 02.4 sửa/xóa; 02.5 search/filter/tag; 02.6 share/Fork. Nhóm graph: 04.1 viewer, 04.2 filter local, 04.3 drawer. UI có thể làm song song bằng mock; end-to-end 04.2/04.3 cần graph host/readmodel 04.1, CRUD/Fork cần auth/DB/receipt và lifecycle gate thật. Không gọi Hangfire/Gemini để làm CRUD thường.

UC-02.7/02.8 và UC-04.4 không có plan mới; chỉ nhắc khi cần phân định integration/out of scope. Không sửa 9 bộ plan cũ hoặc bộ 02.1 trong lượt này.

## Những quyết định quan trọng

- Concept thủ công là input thật hoặc chọn ACTIVE cùng Deck; card + Concept mới + fresh owner state atomic, không Document/placeholder.
- Front/back giữ Markdown/indent/LaTeX; edit giữ FSRS/log/pin, invalidate shared mnemonic; delete ảnh hưởng mọi viewer nhưng giữ nguồn/receipt.
- Card.tags extension tách Deck.tags; D/S và graph status lấy current viewer, read không tạo state.
- Fork snapshot ACTIVE/remap IDs + fresh New state; target Private, không copy progress/pin/file/source; receipt trước source-current checks.
- Màu MASTERED chỉ khi mọi card ACTIVE đã review và R hợp lệ≥.9; M≥.85 chỉ unlock. Graph filter OR/induced, drawer ancestor cùng version.

## Automated review và kiểm tra tài liệu

A requirements_ux, B architecture, C critical_reviewer khảo sát độc lập và phản biện chéo một vòng trước khi ghi; người điều phối chốt và ghi file. C đã đọc đầy đủ 50/50 file mới, sau đó đọc lại các đoạn sửa và xác nhận không còn phát hiện quan trọng. A rà UX/câu chữ phase 2/4 của 025/026/041/042/043; root áp dụng sửa và kiểm tra cấu trúc. Đây là automated agent review; người dùng chỉ xác định scope và 4 phase, không giả phê duyệt thiết kế.

Các phát hiện đã xử lý: validator/capability theo loại card, paging D/S từng trang, node GAP sau xóa card cuối, snapshot mutation tách operation/resource, citation Concept khác manual card, điều hướng ancestor ẩn khác filter-hide, share URL tuyệt đối và mã lỗi chung. Làm rõ UNLEARNED là tổng lượt review trên ACTIVE cards bằng0; học một phần vẫn LEARNING.

Kiểm tra tài liệu: đủ 8 plan + 32 phase + 8 brainstorm + 2 tài liệu tổng hợp; 44 requirement rows và 126 AC, 16 ví dụ JSON hợp lệ, 362 liên kết local tồn tại. Dependencies các phase đúng 1→2→3→4; mọi implementation status pending. Hash SHA-256 của 61 file có sẵn trước lượt này giữ nguyên, bao gồm bộ UC021 và 9 bộ plan cũ. Không có test ứng dụng/API/DB/browser hoặc FPS benchmark; các số trên chỉ là kiểm tra tài liệu.

## Giới hạn triển khai

Repository chưa có mã/frontend/framework/API/database hay test harness. Contract/schema/version/Card.tags/manual source/graph aggregation là đề xuất, cần Backend thực hiện/kiểm chứng. Không test ứng dụng, migration, benchmark, cài package, commit/push trong nhiệm vụ này. Text extraction SRS không thay visual QA nhưng không có artifact DOCX được sửa hoặc bàn giao.
