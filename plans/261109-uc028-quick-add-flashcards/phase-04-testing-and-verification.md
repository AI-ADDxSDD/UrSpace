---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-02.8

## Overview

Kế hoạch kiểm thử toàn diện cho **Nhập nhanh Thẻ ghi nhớ (Quick Add Flashcards)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng mở giao diện Nhập nhanh | Xem bố cục trang | Hiển thị textarea nhập văn bản có hướng dẫn cú pháp và thanh chọn ký tự phân tách rõ ràng. |
| **AC02** | Người dùng sao chép 5 hàng dữ liệu từ bảng tính Excel | Dán (Paste) vào vùng soạn thảo | Hệ thống tự động phát hiện định dạng Tab-separated và phân tích thành 5 thẻ tương ứng. |
| **AC03** | Dữ liệu đầu vào sử dụng dấu phẩy phân cách | Người dùng chọn ký tự phân tách là "Dấu phẩy (,)" | Trình phân tích chuyển đổi chính xác các trường thành Mặt trước và Mặt sau. |
| **AC04** | Nội dung trong dấu ngoặc kép có chứa dấu phẩy: "Hello, World" | Phân tích dòng CSV | Dấu phẩy bên trong dấu ngoặc kép không bị tách thành cột mới. |
| **AC05** | Bảng xem trước sau khi phân tích | Hiển thị trên màn hình | Mỗi dòng hiển thị số thứ tự, nội dung mặt trước, mặt sau và trạng thái hợp lệ màu xanh. |
| **AC06** | Người dùng nhập một dòng chỉ có mặt trước mà không có mặt sau | Phân tích cú pháp | Dòng đó được đánh dấu trạng thái Lỗi màu cam/đỏ kèm ghi chú "Thiếu mặt sau". |
| **AC07** | Người dùng nhập một dòng không có mặt trước | Phân tích cú pháp | Dòng đó được đánh dấu Lỗi kèm thông báo "Thiếu mặt trước". |
| **AC08** | Dòng dữ liệu chứa nhiều hơn hai cột dữ liệu | Phân tích cú pháp | Cột thứ ba trở đi được cảnh báo "Thừa cột dữ liệu" hoặc gộp an toàn tùy cấu hình. |
| **AC09** | Văn bản có chứa dấu ngoặc kép mở nhưng không đóng | Phân tích cú pháp | Dòng dữ liệu được cảnh báo "Lỗi đóng dấu ngoặc kép". |
| **AC10** | Dữ liệu nhập có nhiều dòng trống xen kẽ | Thực hiện phân tích | Các dòng trống được tự động bỏ qua mà không tạo thẻ rác. |
| **AC11** | Danh sách xem trước có 4 thẻ hợp lệ và 1 thẻ lỗi | Người dùng nhấn nút "Lưu các thẻ hợp lệ" | Hệ thống chỉ gửi 4 thẻ hợp lệ lên server và giữ lại thẻ lỗi để người dùng sửa. |
| **AC12** | Tất cả các dòng dữ liệu đều bị lỗi hoặc textarea trống | Kiểm tra nút Lưu | Nút "Lưu thẻ" ở trạng thái disabled để tránh thao tác vô hiệu. |
| **AC13** | Người dùng nhấn nút "Lưu thẻ" | API xử lý thành công | Hiển thị thông báo thành công dạng toast/banner với số lượng thẻ đã thêm và làm sạch textarea. |
| **AC14** | Người dùng mới chưa quen với cú pháp | Nhấn nút "Tải dữ liệu mẫu" | Vùng textarea tự động điền 4 cặp thẻ mẫu để người dùng dễ hình dung. |
| **AC15** | Người dùng muốn bắt đầu lại | Nhấn nút "Xóa trắng" | Xóa toàn bộ nội dung trong textarea và làm rỗng bảng xem trước. |
| **AC16** | Bảng xem trước có số lượng lớn thẻ (hơn 50 thẻ) | Cuộn trang trên máy tính và điện thoại | Bảng xem trước có vùng cuộn độc lập, thanh tiêu đề bảng cố định (sticky header). |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/quick-add/components/QuickAddFlashcards.tsx`](../../frontend/src/features/quick-add/components/QuickAddFlashcards.tsx)
- [`frontend/src/features/quick-add/components/QuickAddFlashcards.css`](../../frontend/src/features/quick-add/components/QuickAddFlashcards.css)
- [`frontend/src/features/quick-add/api/mockQuickAddApi.ts`](../../frontend/src/features/quick-add/api/mockQuickAddApi.ts)
- [`frontend/src/features/quick-add/helpers/parseFlashcards.ts`](../../frontend/src/features/quick-add/helpers/parseFlashcards.ts)
- [`frontend/src/features/quick-add/types/index.ts`](../../frontend/src/features/quick-add/types/index.ts)
- [`frontend/tests/quick-add-parser.test.mjs`](../../frontend/tests/quick-add-parser.test.mjs)

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
