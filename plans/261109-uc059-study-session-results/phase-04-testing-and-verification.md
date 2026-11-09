---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-05.9

## Overview

Kế hoạch kiểm thử toàn diện cho **Kết quả và Tổng kết Phiên học (Study Session Results)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng vừa học xong thẻ cuối cùng của phiên học | Chuyển sang màn hình kết quả | Hiển thị màn hình tổng kết với lời chúc mừng và thông tin bộ thẻ. |
| **AC02** | Phiên học hoàn thành 10 thẻ trong 3 phút 20 giây | Kiểm tra thẻ KPI thời gian | Hiển thị định dạng chuẩn "03:20" và tốc độ trung bình "20 giây/thẻ". |
| **AC03** | Trong 10 thẻ có 5 thẻ Good và 3 thẻ Easy | Tính tỷ lệ ghi nhớ thành công | Tỷ lệ thành công đạt 80% ((5+3)/10). |
| **AC04** | Thanh phân bố đánh giá (Rating Breakdown) | Quan sát giao diện | Hiển thị dải màu trực quan tương ứng với tỷ lệ Again, Hard, Good, Easy. |
| **AC05** | Người học có 100% thẻ được đánh giá Again | Tính toán thống kê | Tỷ lệ thành công là 0%, hiển thị lời khuyên "Cần ôn tập lại kỹ hơn" mà không có lỗi. |
| **AC06** | Người học có 100% thẻ được đánh giá Easy | Tính toán thống kê | Tỷ lệ thành công là 100%, hiển thị thông điệp "Xuất sắc! Bạn đã nắm rất vững". |
| **AC07** | Người dùng bấm nút "Học lại các thẻ chưa nhớ" | Kích hoạt phiên học bù | Hệ thống lọc ra danh sách các thẻ có đánh giá Again và bắt đầu phiên học mới. |
| **AC08** | Người dùng bấm nút "Quay về Bộ thẻ" | Kích hoạt điều hướng | Điều hướng trở về màn hình chi tiết bộ thẻ (S-03). |
| **AC09** | Kiểm tra responsive trên màn hình 1920x1080 | Màn hình tổng kết hiển thị | Bố cục 4 thẻ KPI dàn hàng ngang cân đối, biểu đồ phân bố to rõ. |
| **AC10** | Kiểm tra responsive trên màn hình điện thoại 375px | Màn hình tổng kết hiển thị | 4 thẻ KPI chuyển thành lưới 2x2 hoặc 1 cột, các nút bấm full width dễ bấm. |
| **AC11** | Dữ liệu đầu vào bị rỗng do phiên học bị hủy sớm | Hàm thống kê chạy | Trả về dữ liệu rỗng an toàn với giá trị mặc định 0 thay vì NaN. |
| **AC12** | Một thẻ được người dùng đánh giá nhiều lần do học lặp | Thống kê kết quả | Mỗi thẻ chỉ được tính một lần theo đánh giá cuối cùng để số liệu chuẩn xác. |
| **AC13** | Thẻ kết quả hiển thị các huy hiệu thành tích | Học viên đạt mốc chuỗi học | Hiển thị huy hiệu ngọn lửa chúc mừng chuỗi ngày học tập được cộng dồn. |
| **AC14** | Người dùng nhấn phím Enter trên bàn phím | Phím tắt kích hoạt | Kích hoạt nút hành động chính "Tiếp tục" hoặc "Học lại". |
| **AC15** | Trạng thái đang lưu kết quả lên server | Mạng có độ trễ | Nút bấm hiển thị trạng thái loading spinner ngăn chặn bấm đúp. |
| **AC16** | Độ tương phản màu chữ trên nền kết quả | Kiểm tra chuẩn WCAG AA | Tất cả các chỉ số và nhãn phụ đều có tỷ lệ tương phản tối thiểu 4.5:1. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/study-session/components/StudySessionResult.tsx`](../../frontend/src/features/study-session/components/StudySessionResult.tsx)
- [`frontend/src/features/study-session/components/StudySession.css`](../../frontend/src/features/study-session/components/StudySession.css)
- [`frontend/src/features/study-session/helpers/sessionStats.ts`](../../frontend/src/features/study-session/helpers/sessionStats.ts)
- [`frontend/src/features/study-session/types/flashcard.ts`](../../frontend/src/features/study-session/types/flashcard.ts)
- [`frontend/tests/study-session-statistics.test.mjs`](../../frontend/tests/study-session-statistics.test.mjs)

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
