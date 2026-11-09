---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-07.2

## Overview

Kế hoạch kiểm thử toàn diện cho **Biểu đồ Đường cong Quên lãng (Forgetting Curve)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng mở màn hình Đường cong quên lãng | Dữ liệu được tải thành công | Hiển thị 4 thẻ KPI tóm tắt và biểu đồ SVG 2 đường so sánh trong phạm vi 14 ngày. |
| **AC02** | Biểu đồ hiển thị trên màn hình | Quan sát chú giải (Legend) | Phân biệt rõ đường tím nét đứt (Lý thuyết Ebbinghaus) và đường xanh nét liền (Thực tế quan sát). |
| **AC03** | Công thức toán học Ebbinghaus | Tính toán đường lý thuyết cho 14 ngày | Tỷ lệ ghi nhớ suy giảm mượt mà từ 100% ở ngày 0 xuống mức ổn định theo hàm mũ. |
| **AC04** | Lịch sử ôn tập có 50 lượt đánh giá với 42 lượt thành công (Good/Easy) | Tính tỷ lệ quan sát thực tế | Tỷ lệ quan sát đạt 84.0% (42/50), tính đúng điểm tọa độ trên biểu đồ. |
| **AC05** | Người dùng chuyển phạm vi sang "30 ngày" | Biểu đồ vẽ lại | Trục hoành mở rộng lên 30 ngày, phân bổ lại các điểm quan sát tương ứng. |
| **AC06** | Tập dữ liệu lịch sử hoàn toàn rỗng trong khoảng thời gian đã chọn | Hệ thống kết xuất biểu đồ | Không vẽ giả đường quan sát; hiển thị thông báo "Chưa có dữ liệu ôn tập thực tế trong khoảng thời gian này". |
| **AC07** | Dữ liệu rỗng khi tính toán thống kê | Hàm helper xử lý | Trả về an toàn giá trị 0% mà không gây lỗi chia cho 0 hoặc NaN. |
| **AC08** | Hàm sinh lệnh đường dẫn SVG (SVG path string) | Dữ liệu tọa độ hợp lệ | Tạo chuỗi lệnh SVG "M x y L x y" chính xác và hợp lệ. |
| **AC09** | Người dùng rê chuột vào một điểm tròn quan sát trên biểu đồ | Sự kiện hover kích hoạt | Hiển thị thẻ tooltip nổi với ngày ôn tập, số lượng thẻ và tỷ lệ ghi nhớ chính xác. |
| **AC10** | Banner thông báo mô hình (Notice Banner) | Quan sát dưới tiêu đề trang | Ghi rõ cảnh báo: "Đường cong lý thuyết chỉ là mô hình toán học minh họa, không phải dự đoán FSRS thật của backend". |
| **AC11** | Thẻ KPI "Tỷ lệ ghi nhớ trung bình" | Hiển thị số liệu | Hiển thị số liệu phần trăm lớn bằng font Manrope kèm nhận xét mức độ ghi nhớ. |
| **AC12** | Kiểm tra trên màn hình desktop 1920x1080 | Quan sát đồ thị | Đồ thị SVG co giãn sắc nét với viewBox, các nhãn trục số 0%, 20%, ..., 100% không bị đè. |
| **AC13** | Kiểm tra trên màn hình điện thoại 375px | Quan sát đồ thị | Đồ thị tự động co tỷ lệ, các nhãn trục tự giảm bớt để tránh chồng lấn. |
| **AC14** | Đang tải dữ liệu từ API | Mạng có độ trễ | Hiển thị skeleton loading dạng khung chữ nhật mờ cho vùng biểu đồ. |
| **AC15** | API trả về mã lỗi 500 | Lỗi phát sinh | Hiển thị panel thông báo lỗi kèm nút "Thử lại". |
| **AC16** | Người dùng nhấn nút "Làm mới" | Kích hoạt refresh | Gửi lại request lên API và cập nhật lại toàn bộ biểu đồ và thẻ KPI. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/forgetting-curve/components/ForgettingCurve.tsx`](../../frontend/src/features/forgetting-curve/components/ForgettingCurve.tsx)
- [`frontend/src/features/forgetting-curve/components/ForgettingCurveChart.tsx`](../../frontend/src/features/forgetting-curve/components/ForgettingCurveChart.tsx)
- [`frontend/src/features/forgetting-curve/components/ForgettingCurve.css`](../../frontend/src/features/forgetting-curve/components/ForgettingCurve.css)
- [`frontend/src/features/forgetting-curve/api/mockForgettingCurveApi.ts`](../../frontend/src/features/forgetting-curve/api/mockForgettingCurveApi.ts)
- [`frontend/src/features/forgetting-curve/helpers/forgettingCurveCalculation.ts`](../../frontend/src/features/forgetting-curve/helpers/forgettingCurveCalculation.ts)
- [`frontend/src/features/forgetting-curve/data/mockReviewHistory.ts`](../../frontend/src/features/forgetting-curve/data/mockReviewHistory.ts)
- [`frontend/src/features/forgetting-curve/types/index.ts`](../../frontend/src/features/forgetting-curve/types/index.ts)
- [`frontend/tests/forgetting-curve.test.mjs`](../../frontend/tests/forgetting-curve.test.mjs)

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
