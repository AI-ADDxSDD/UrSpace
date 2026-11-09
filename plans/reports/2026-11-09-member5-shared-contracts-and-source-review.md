# Thành viên 5 — Đối chiếu Nguồn nghiệp vụ và Hợp đồng dùng chung

## 1. Cơ sở Nguồn nghiệp vụ và Rà soát Thực tế

- **Tài liệu nguồn:** Yêu cầu nghiệp vụ hệ thống UrSpace (SmartLearn SRS), các User Stories và bảng tiêu chí nghiệm thu của 10 Use Case phân công cho Thành viên 5.
- **Hiện trạng mã nguồn:** Toàn bộ 10 Use Case đã có mã nguồn hoạt động ở mức Frontend Mock tại thư mục `frontend/src/features/`.
- **Ranh giới:** Tất cả các endpoint Backend được mô tả trong các Plan đều là **Proposed API** (API đề xuất) sẵn sàng tích hợp với backend C# ASP.NET Core Web API trong tương lai.

---

## 2. Các Hợp đồng và Quy chuẩn Dùng chung (Shared Contracts C01 – C10)

### C01: Xác thực và Phân quyền (Authentication & Authorization)
- Tất cả các thao tác thay đổi dữ liệu (Fork deck, Quick add, Record review, Submit quiz, Report card) đều yêu cầu Header `Authorization: Bearer <JWT>`.
- Marketplace (UC-02.7) cho phép Guest xem và tìm kiếm; khi bấm Fork hoặc Học, hệ thống yêu cầu đăng nhập.

### C02: Tiêu chuẩn Hợp đồng API (RESTful & RFC 7807)
- Dữ liệu trao đổi định dạng JSON `snake_case` trên đường truyền mạng; Frontend chuyển đổi sang `camelCase` trong TypeScript.
- Khi có lỗi, Backend trả về Problem Details theo chuẩn RFC 7807:
```json
{
  "type": "https://api.urspace.edu.vn/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Nội dung mặt trước của thẻ ghi nhớ không được để trống.",
  "instance": "/api/v1/decks/d-123/cards/batch",
  "errors": {
    "cards[0].front": ["Mặt trước không được để trống."]
  }
}
```

### C03: Cơ chế Idempotency và Chống trùng lặp (Idempotent Writes)
- Các thao tác ghi hàng loạt như Nhập nhanh thẻ (UC-02.8) và Fork bộ thẻ (UC-02.7) hỗ trợ header `Idempotency-Key` để đảm bảo khi mạng bị timeout hoặc retry thì không bị nhân đôi dữ liệu.

### C04: Chuẩn hóa Múi giờ và Thời gian (Timezone & UTC Integrity)
- Mọi mốc thời gian lưu trữ trong cơ sở dữ liệu và truyền tải qua API đều dùng chuẩn ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).
- Đối với Lịch ôn tập (UC-05.7) và Chuỗi ngày học tập (UC-07.1), Frontend gửi kèm IANA Timezone của người dùng (ví dụ: `Asia/Ho_Chi_Minh`) để Backend tính toán ngày lịch chính xác tại ranh giới nửa đêm địa phương.

### C05: Ranh giới Thuật toán FSRS và Trí tuệ Nhân tạo
- Frontend TUYỆT ĐỐI KHÔNG tự tính toán FSRS Retrievability, Stability, Difficulty hoặc dự đoán đường cong quên lãng bằng mã client.
- Frontend thu thập dữ liệu thô: `card_id`, `rating` (Again/Hard/Good/Easy), `review_time_ms` và gửi về Backend xử lý.
- Đường cong lý thuyết Ebbinghaus trên UC-07.2 được ghi nhận công khai là mô hình minh họa thuần túy.

### C06: Độc lập dữ liệu khi Sao chép (Forking Independence)
- Khi thực hiện Fork một bộ thẻ công khai (UC-02.7), bộ thẻ mới là một thực thể độc lập thuộc quyền sở hữu của người dùng.
- Tiến trình học tập (`UserCardStates`) của người dùng trên bộ thẻ mới bắt đầu từ trạng thái thẻ mới (New), không kế thừa lịch sử của tác giả gốc.

### C07: Bảo mật Thông tin và Báo cáo Kiểm duyệt (Card Reports Moderation)
- Bản ghi báo cáo thẻ (UC-06.5) lưu trữ tách biệt trong bảng `CardReports`.
- Giao diện tác giả bộ thẻ không được để lộ danh tính cá nhân (Email, Họ tên) của người báo cáo để tránh xung đột cá nhân.

### C08: Khả năng Tiếp cận và Trải nghiệm Người dùng (a11y & WCAG AA)
- Bảng màu: Tuân thủ độ tương phản tối thiểu 4.5:1 cho văn bản thông thường và 3:1 cho tiêu đề lớn/nút bấm.
- Hỗ trợ bàn phím đầy đủ: Phím `Space` lật thẻ, phím `1`, `2`, `3`, `4` đánh giá hoặc chọn trắc nghiệm, phím `Escape` đóng modal, phím `Tab` có Focus ring tím rõ nét.
- Thiết kế Responsive thực chất: Hoạt động mượt mà trên Desktop 1920x1080 (không cần cuộn trong phiên học), Laptop 1440/1366px, Tablet 768px, và Mobile 375px.

### C09: Phân định Trách nhiệm với các Thành viên khác
- **Với Thành viên 1 (Auth, User):** Nhận JWT Token và thông tin User Profile để gắn vào các request.
- **Với Thành viên 2 (Deck CRUD, Document, Storage):** Tích hợp việc lưu thẻ từ Quick Add vào Deck; đồng bộ danh sách bộ thẻ khi Fork.
- **Với Thành viên 3 (AI, FSRS Core, Spaced Repetition):** Nhận lịch đến hạn ôn tập và gửi kết quả đánh giá để tính toán chu kỳ lặp lại tiếp theo.
- **Với Thành viên 4 (Concept DAG, Skill Tree Canvas):** Phối hợp điều hướng từ Concept Node sang Mini-Quiz (UC-04.4) và đồng bộ khái niệm vào bản đồ nhiệt độ thành thạo (UC-07.3).

### C10: Trạng thái Nghiệm thu Tài liệu
- Kế hoạch 10 Use Case này được thiết lập dựa trên mã nguồn Frontend hiện hữu và các tiêu chuẩn kiểm thử đã vượt qua 100%.
- Các phần liên quan đến Backend Controller, SQL Server Migration, và Playwright E2E Test được ghi nhận đầy đủ trong phần "Remaining Work / Pending Integration" sẵn sàng cho giai đoạn phát triển tiếp theo.
