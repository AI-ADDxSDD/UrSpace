---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-07.3

## Overview

Kế hoạch kiểm thử toàn diện cho **Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

## Requirements

### Phạm vi Kiểm thử đã Thực hiện trên Nhánh QuiVT
- **Automated Unit Tests:** Đã viết và chạy thông qua Node.js Test Runner (`node --test tests/*.test.mjs`).
- **Phạm vi kiểm tra:** Thuật toán tính toán, chuẩn hóa dữ liệu, bộ lọc diacritic-tolerant, chuyển đổi thời gian/múi giờ, và xử lý an toàn các tập dữ liệu rỗng (không chia cho 0, không NaN).
- **Kết quả:** **100% Pass** với 0 lỗi.

### Kế hoạch Kiểm thử Tích hợp và E2E (Pending)
- Cần triển khai các kịch bản E2E bằng Playwright trên môi trường staging khi có Backend thực tế.
- Kiểm thử luồng tích hợp với cơ sở dữ liệu thật, kiểm tra race-condition và tính toàn vẹn dữ liệu.

## Architecture / Interfaces

### Kịch bản Nghiệm thu Given / When / Then (16 ACs)

| Mã AC | Điều kiện tiền đề (Given) | Hành động kích hoạt (When) | Kết quả kỳ vọng (Then) |
|---|---|---|---|
| **AC01** | Người dùng mở màn hình Bản đồ độ thành thạo kiến thức | Dữ liệu được tải | Hiển thị 5 thẻ KPI tóm tắt, thanh phân bố 4 màu và lưới các chủ đề khái niệm. |
| **AC02** | Hệ thống có 24 khái niệm thuộc nhiều môn học khác nhau | Tính toán phân bố | Tính chính xác số lượng và tỷ lệ % của từng mức: Chưa học, Cần ôn tập, Đang tiến bộ, Thành thạo. |
| **AC03** | Thanh phân bố đa đoạn (Distribution Bar) | Quan sát trên giao diện | Hiển thị dải màu 4 đoạn nối tiếp nhau tương ứng với tỷ lệ phần trăm của từng cấp độ. |
| **AC04** | Người dùng chọn lọc môn học "Khoa học máy tính" | Áp dụng bộ lọc | Chỉ các nhóm chủ đề và khái niệm thuộc môn "Khoa học máy tính" được hiển thị. |
| **AC05** | Người dùng chọn lọc mức độ "Cần ôn tập" | Áp dụng bộ lọc | Chỉ các khái niệm có mức độ "needs_review" xuất hiện trong danh sách. |
| **AC06** | Người dùng nhập từ khóa tìm kiếm "cay nhi phan" không dấu | Tìm kiếm thực thi | Bộ lọc nhận diện và hiển thị khái niệm "Cây nhị phân tìm kiếm (BST)". |
| **AC07** | Người dùng tìm kiếm với từ khóa không khớp khái niệm nào | Tìm kiếm hoàn tất | Hiển thị thông báo rỗng thân thiện "Không tìm thấy khái niệm phù hợp" kèm nút đặt lại bộ lọc. |
| **AC08** | Mỗi thẻ khái niệm trên lưới (Concept Card) | Quan sát giao diện | Hiển thị tên khái niệm, điểm số %, viền màu biểu trưng cấp độ và số lượng thẻ liên quan. |
| **AC09** | Người dùng click vào một thẻ khái niệm | Click kích hoạt | Modal xem chi tiết khái niệm mở ra với thanh tiến độ, mô tả và gợi ý hành động ôn tập. |
| **AC10** | Modal chi tiết khái niệm đang mở | Người dùng nhấn phím Escape hoặc click nút đóng | Modal đóng an toàn và trả tiêu điểm về thẻ khái niệm đã chọn. |
| **AC11** | Danh sách khái niệm rỗng hoàn toàn | Hàm tính toán phân bố chạy | Xử lý an toàn không gây lỗi chia cho 0, trả về các giá trị 0% mặc định. |
| **AC12** | Ghi chú dưới chân trang (Footnote) | Đọc thông tin chân trang | Ghi chú rõ ràng: "Heatmap hiển thị dạng ma trận theo chủ đề, không thay thế đồ thị DAG toàn phần". |
| **AC13** | Kiểm tra trên màn hình desktop 1920x1080 | Xem lưới ma trận | Lưới thẻ tự động dàn 4-5 cột cân đối, các nhóm chủ đề phân cách rõ ràng. |
| **AC14** | Kiểm tra trên màn hình di động 375px | Xem trên điện thoại | Lưới thẻ co về 1 cột, các dropdown bộ lọc chuyển sang dạng dọc dễ chọn. |
| **AC15** | Đang tải dữ liệu từ mock API | Chờ phản hồi | Hiển thị hiệu ứng skeleton loading trên các thẻ KPI và khối ma trận chủ đề. |
| **AC16** | Người dùng nhấn nút "Làm mới" | Kích hoạt refresh | Tải lại toàn bộ dữ liệu độ thành thạo và cập nhật giao diện tức thì. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx)
- [`frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx`](../../frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx)
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css)
- [`frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts`](../../frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts)
- [`frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts`](../../frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts)
- [`frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts`](../../frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts)
- [`frontend/src/features/knowledge-mastery/types/index.ts`](../../frontend/src/features/knowledge-mastery/types/index.ts)
- [`frontend/tests/knowledge-mastery.test.mjs`](../../frontend/tests/knowledge-mastery.test.mjs)

## Implementation Steps

1. Chạy toàn bộ bộ test suite hiện có để bảo đảm không xảy ra hồi quy mã nguồn:
   ```powershell
   cd frontend; node --test tests/*.test.mjs
   ```
2. Kiểm tra tính tương thích TypeScript và quá trình đóng gói production:
   ```powershell
   cd frontend; npm.cmd run build
   ```
3. Rà soát quy chuẩn mã nguồn với Linter:
   ```powershell
   cd frontend; npm.cmd run lint
   ```
4. Khi có môi trường staging, cấu hình Playwright để tự động hóa 16 kịch bản Given/When/Then trên trình duyệt Chrome/Firefox/WebKit.

## Success Criteria

- [x] Toàn bộ unit tests liên quan đến thuật toán và helper của Use Case đều vượt qua (100% PASS).
- [x] Quá trình `build` và `lint` hoàn thành thành công với 0 cảnh báo và 0 lỗi.
- [x] Đầy đủ 16 kịch bản kiểm thử bao phủ toàn bộ các luồng: Luồng chính, bộ lọc, xử lý lỗi, dữ liệu rỗng, tương tác phím và responsive.
- [x] Không tuyên bố đã test responsive thực tế trên headless browser nếu chưa có công cụ chạy trình duyệt.

## Risk Assessment

- **Thiếu kiểm thử trực quan tự động (Visual Regression):** Do môi trường dòng lệnh không có sẵn trình duyệt headless (Puppeteer/Playwright), kiểm thử giao diện cần được người dùng trực tiếp nghiệm thu trên trình duyệt thật tại `http://localhost:5173`.
