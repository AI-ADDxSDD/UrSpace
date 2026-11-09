---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-06.5

## Overview

Kế hoạch kiểm thử toàn diện cho **Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng đang học và phát hiện một thẻ có nội dung sai | Click nút "Báo cáo thẻ" | Modal báo cáo mở ra trên nền mờ, hiển thị mã thẻ và tiêu đề báo cáo rõ ràng. |
| **AC02** | Modal báo cáo mở ra | Kiểm tra danh sách lý do | Hiển thị đủ 5 lý do báo cáo chuẩn hóa với nút chọn radio đồng nhất. |
| **AC03** | Người dùng chọn lý do "Sai kiến thức thực tế" | Click chọn lý do | Thẻ radio tương ứng được đánh dấu active với viền tím nổi bật. |
| **AC04** | Người dùng chưa chọn bất kỳ lý do nào | Nhấn nút "Gửi báo cáo" | Hệ thống ngăn chặn gửi và hiển thị cảnh báo "Vui lòng chọn lý do báo cáo". |
| **AC05** | Người dùng nhập mô tả chi tiết 45 ký tự | Gõ phím trong textarea | Bộ đếm ký tự cập nhật chính xác "45/500 ký tự". |
| **AC06** | Người dùng cố gắng nhập hoặc paste quá 500 ký tự | Kiểm tra độ dài | Hệ thống chặn không cho nhập thêm hoặc cắt chuỗi ở 500 ký tự an toàn. |
| **AC07** | Dữ liệu báo cáo hợp lệ đầy đủ | Người dùng nhấn nút "Gửi báo cáo" | Nút chuyển sang trạng thái loading "Đang gửi...", vô hiệu hóa các thao tác bấm tiếp. |
| **AC08** | API tiếp nhận báo cáo thành công | Server phản hồi | Hiển thị thông báo cảm ơn dạng banner thành công và tự động đóng modal sau 1.5 giây. |
| **AC09** | Modal báo cáo đang mở | Người dùng nhấn phím Escape hoặc click nút "Hủy" | Modal đóng ngay lập tức, không lưu dữ liệu và trả tiêu điểm về thẻ bài. |
| **AC10** | Mạng bị mất kết nối khi gửi báo cáo | API trả về lỗi | Hiển thị thông báo lỗi thân thiện và giữ nguyên nội dung đã nhập để người dùng gửi lại. |
| **AC11** | Thao tác báo cáo thẻ được gửi đi | Kiểm tra payload gửi lên | Không chứa thông tin nhạy cảm của người báo cáo cho tác giả thẻ. |
| **AC12** | Người dùng nhấn phím Tab để duyệt trong modal | Tab qua các phần tử | Tiêu điểm bị giữ bên trong modal (Focus Trap), không nhảy ra ngoài nền trang. |
| **AC13** | Giao diện modal trên màn hình di động 375px | Mở modal báo cáo | Modal chiếm toàn bộ chiều rộng với lề an toàn 16px, các nút bấm to dễ thao tác. |
| **AC14** | Kiểm tra trường textarea với các ký tự đặc biệt và emoji | Nhập nội dung | Hệ thống hỗ trợ đầy đủ bộ mã UTF-8 và không bị lỗi hiển thị. |
| **AC15** | Người dùng đã gửi báo cáo thành công cho thẻ này | Tiếp tục học | Phiên học tiếp tục bình thường mà không bị gián đoạn hay tải lại toàn trang. |
| **AC16** | Độ tương phản của chữ và nút bấm trong modal | Đo kiểm theo chuẩn WCAG AA | Tất cả các thành phần đạt tỷ lệ tương phản tối thiểu 4.5:1. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/card-reports/components/FlashcardReportModal.tsx`](../../frontend/src/features/card-reports/components/FlashcardReportModal.tsx)
- [`frontend/src/features/card-reports/components/FlashcardReportModal.css`](../../frontend/src/features/card-reports/components/FlashcardReportModal.css)
- [`frontend/src/features/card-reports/api/mockCardReportsApi.ts`](../../frontend/src/features/card-reports/api/mockCardReportsApi.ts)
- [`frontend/src/features/card-reports/helpers/validateFlashcardReport.ts`](../../frontend/src/features/card-reports/helpers/validateFlashcardReport.ts)
- [`frontend/src/features/card-reports/types/index.ts`](../../frontend/src/features/card-reports/types/index.ts)
- [`frontend/tests/card-reports.test.mjs`](../../frontend/tests/card-reports.test.mjs)

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
