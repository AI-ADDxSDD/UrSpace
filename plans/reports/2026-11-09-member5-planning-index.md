# Thành viên 5 — Chỉ mục Kế hoạch Frontend Learning Experience, Reports & QA

## 1. Kết quả và Phạm vi thực hiện

- **Ngày lập:** 2026-11-09
- **Thành viên phụ trách:** TV5 – Frontend Learning Experience, Reports & QA
- **Branch Git:** `QuiVT`
- **Tổng số Use Case:** 10 Use Case hoàn chỉnh
- **Số lượng tài liệu:** **52 files Markdown** (10 thư mục Use Case, mỗi thư mục 5 file chuẩn + 2 tài liệu tổng hợp và đối chiếu tại `plans/reports/`).

### Hiện trạng thực tế tại Repository:
1. **Frontend Mock:** Đã triển khai hoàn chỉnh 10/10 Use Case với React + TypeScript + Vite, bộ CSS Design System EdTech SaaS Dashboard chuẩn mực, không dùng CSS zoom/scale hack, vượt qua `build` và `eslint` với 0 lỗi.
2. **Unit Tests:** Toàn bộ **49 unit tests** trong `frontend/tests/*.test.mjs` đạt kết quả **100% PASS** (kiểm tra đầy đủ logic thuật toán, định dạng dữ liệu, xử lý biên và dữ liệu rỗng).
3. **Backend Integration:** Đang ở trạng thái **Pending Backend Integration** (chờ các endpoint ASP.NET Core Web API và CSDL SQL Server từ các thành viên phụ trách Backend).
4. **End-to-End Testing & Browser QA:** Đang ở trạng thái **Pending E2E Testing** (cần cấu hình Playwright/Cypress khi có môi trường staging).

---

## 2. Bảng tổng hợp 10 Implementation Plans của TV5

| UC ID | Tên chức năng | Thư mục Kế hoạch | Trạng thái Frontend | Backend Integration | Số AC |
|---|---|---|---|---|---|
| **UC-02.7** | Khám phá & Sao chép Bộ thẻ Công khai | [`261109-uc027-public-deck-marketplace`](../261109-uc027-public-deck-marketplace/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-02.8** | Nhập nhanh Thẻ ghi nhớ (Quick Add) | [`261109-uc028-quick-add-flashcards`](../261109-uc028-quick-add-flashcards/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-04.4** | Bài kiểm tra Mini theo Khái niệm | [`261109-uc044-concept-node-mini-quiz`](../261109-uc044-concept-node-mini-quiz/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-05.2** | Phiên học Gợi nhớ Tích cực (Active Recall) | [`261109-uc052-active-recall-study-session`](../261109-uc052-active-recall-study-session/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-05.7** | Lịch ôn tập sắp tới (Review Schedule) | [`261109-uc057-upcoming-review-schedule`](../261109-uc057-upcoming-review-schedule/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-05.9** | Kết quả & Tổng kết Phiên học | [`261109-uc059-study-session-results`](../261109-uc059-study-session-results/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-06.5** | Báo cáo Thẻ ghi nhớ Sai lệch | [`261109-uc065-report-incorrect-flashcard`](../261109-uc065-report-incorrect-flashcard/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-07.1** | Chuỗi ngày Học tập & Heatmap (Streak) | [`261109-uc071-study-streak`](../261109-uc071-study-streak/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-07.2** | Biểu đồ Đường cong Quên lãng | [`261109-uc072-forgetting-curve`](../261109-uc072-forgetting-curve/plan.md) | Implemented (Mock) | Pending API | 16 |
| **UC-07.3** | Bản đồ Nhiệt Độ Thành thạo Kiến thức | [`261109-uc073-knowledge-mastery`](../261109-uc073-knowledge-mastery/plan.md) | Implemented (Mock) | Pending API | 16 |

> **Tổng cộng:** **160 tình huống kiểm thử Acceptance Criteria (Given/When/Then)** chi tiết, bao phủ đầy đủ các khía cạnh nghiệp vụ, tương tác bàn phím, khả năng tiếp cận (a11y), responsive và xử lý lỗi mạng.

---

## 3. Cấu trúc 5 Phase chuẩn hóa cho từng Use Case

Tất cả 10 kế hoạch của TV5 đều tuân thủ cấu trúc 5 file Markdown chuẩn hóa của repository:
1. `plan.md`: Tổng quan kế hoạch, hợp đồng Use Case (Actor, Preconditions, Flows, Postconditions), bảng Phase và các quyết định thiết kế chốt (Decisions).
2. `phase-01-requirements-and-contract.md`: Truy vết yêu cầu (Requirements R01–R06), bảng đặc tả trường (Fields), Hợp đồng API (Endpoints đề xuất, mẫu JSON, RFC 7807 Error Envelope).
3. `phase-02-interface-and-state.md`: Thiết kế giao diện UI/UX, Component Tree, Bảng trạng thái (State Machine), Xử lý bàn phím (Keyboard shortcuts), Khả năng tiếp cận WCAG AA và Responsive Breakpoints.
4. `phase-03-backend-integration.md`: Tích hợp Backend ASP.NET Core Web API, Mock client hiện tại, Bàn giao với các thành viên khác, Đề xuất lược đồ cơ sở dữ liệu SQL Server.
5. `phase-04-testing-and-verification.md`: 16 kịch bản kiểm thử chi tiết dạng Given/When/Then, Danh mục unit tests đã chạy thực tế, Tiêu chí nghiệm thu (Acceptance Criteria).

---

## 4. Các điểm phân định ranh giới (Touchpoints & Boundaries)

- **Không tự tiện tính FSRS trên Client:** Thuật toán FSRS Retrievability phức tạp thuộc thẩm quyền của Backend và Thành viên 3. Frontend TV5 chỉ ghi nhận đánh giá của người học (Again, Hard, Good, Easy) và gửi về API.
- **Không dựng lại Cây kỹ năng DAG của TV4:** UC-07.3 tập trung vào lưới hiển thị ma trận Concept Nodes phân nhóm theo Chủ đề và Môn học để học viên nắm bắt nhanh mức độ thành thạo, không chồng chéo với Canvas 2D DAG toàn phần của TV4 (UC-04.1).
- **Tính chân thực của Dữ liệu:** Trên Forgetting Curve (UC-07.2), đường lý thuyết Ebbinghaus được ghi chú rõ ràng là mô hình toán học minh họa; nếu người dùng chưa có lượt ôn tập nào thì không tự vẽ giả đường quan sát (Observed).
- **Bảo mật và Danh tính:** Báo cáo thẻ sai lệch (UC-06.5) được gửi nặc danh lên hàng đợi kiểm duyệt để tránh lộ thông tin học viên cho chủ bộ thẻ.
