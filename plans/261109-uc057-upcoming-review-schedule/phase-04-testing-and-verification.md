---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-05.7

## Overview

Kế hoạch kiểm thử toàn diện cho **Lịch ôn tập sắp tới (Upcoming Review Schedule)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng mở màn hình Lịch ôn tập | Dữ liệu được tải | Hiển thị tổng quan các thẻ KPI và biểu đồ cột ôn tập 14 ngày mặc định. |
| **AC02** | Hệ thống có các thẻ quá hạn ôn tập từ những ngày trước | Tính toán thống kê | Đếm chính xác số thẻ quá hạn và hiển thị huy hiệu cảnh báo màu hổ phách. |
| **AC03** | Có 18 thẻ đến hạn ôn tập đúng vào ngày hôm nay | Kiểm tra thẻ KPI "Đến hạn hôm nay" | Thẻ KPI hiển thị số 18 và cột ngày hôm nay trên biểu đồ được tô màu tím nổi bật. |
| **AC04** | Người dùng chuyển phạm vi sang "7 ngày" | Biểu đồ vẽ lại | Hiển thị chính xác 7 cột tương ứng với 7 ngày liên tiếp tính từ ngày hôm nay. |
| **AC05** | Người dùng chuyển phạm vi sang "30 ngày" | Biểu đồ vẽ lại | Hiển thị 30 cột tương ứng, tự động thu hẹp bề rộng cột để vừa khít container. |
| **AC06** | Một số ngày trong phạm vi không có thẻ nào đến hạn | Tổng hợp dữ liệu | Hệ thống vẫn giữ nguyên cột ngày đó với giá trị count = 0, không bị mất ngày. |
| **AC07** | Dữ liệu đầu vào có các thẻ bị lặp lại cùng Card ID | Xử lý tổng hợp | Hệ thống khử trùng lặp và chỉ đếm mỗi thẻ một lần theo lượt đến hạn sớm nhất. |
| **AC08** | Múi giờ của người dùng ở gần ranh giới nửa đêm (23:55) | Chuyển đổi ngày | Chuẩn hóa an toàn theo ngày lịch của tài khoản, không bị trôi sang ngày hôm sau. |
| **AC09** | Người dùng mới chưa có bất kỳ thẻ ghi nhớ nào | Tải lịch ôn tập | Trả về an toàn các bucket có giá trị 0 mà không gây crash ứng dụng. |
| **AC10** | Người dùng rê chuột (hover) lên một cột trên biểu đồ | Sự kiện mouseover kích hoạt | Hiển thị tooltip nổi thể hiện ngày chính xác và số lượng thẻ cần ôn. |
| **AC11** | Biểu đồ hiển thị trên màn hình máy tính 1920x1080 | Kiểm tra giao diện | Biểu đồ chiếm chiều rộng hợp lý, nhãn ngày tháng rõ ràng không bị đè chữ. |
| **AC12** | Biểu đồ hiển thị trên màn hình di động 375px | Kiểm tra giao diện mobile | Biểu đồ có thanh cuộn ngang mượt mà hoặc tự động gộp nhãn ngày để tránh chen chúc. |
| **AC13** | API đang tải dữ liệu | Kiểm tra trạng thái chờ | Hiển thị hiệu ứng skeleton pulse trên các thẻ KPI và vùng biểu đồ. |
| **AC14** | API trả về lỗi mạng | Xảy ra lỗi | Hiển thị thông báo lỗi rõ ràng kèm nút "Làm mới dữ liệu". |
| **AC15** | Người dùng nhấn nút "Làm mới" | Kích hoạt reload | Tải lại dữ liệu mới nhất từ server và cập nhật biểu đồ. |
| **AC16** | Duyệt bằng bàn phím và Screen Reader | Tab qua các nút chọn phạm vi và cột | Tất cả các điều khiển đều có focus-ring rõ ràng và mô tả aria-label đầy đủ. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/review-schedule/components/ReviewSchedule.tsx`](../../frontend/src/features/review-schedule/components/ReviewSchedule.tsx)
- [`frontend/src/features/review-schedule/components/ReviewSchedule.css`](../../frontend/src/features/review-schedule/components/ReviewSchedule.css)
- [`frontend/src/features/review-schedule/api/mockReviewScheduleApi.ts`](../../frontend/src/features/review-schedule/api/mockReviewScheduleApi.ts)
- [`frontend/src/features/review-schedule/helpers/aggregateReviewSchedule.ts`](../../frontend/src/features/review-schedule/helpers/aggregateReviewSchedule.ts)
- [`frontend/src/features/review-schedule/data/mockReviewDueCards.ts`](../../frontend/src/features/review-schedule/data/mockReviewDueCards.ts)
- [`frontend/src/features/review-schedule/types/index.ts`](../../frontend/src/features/review-schedule/types/index.ts)
- [`frontend/tests/review-schedule.test.mjs`](../../frontend/tests/review-schedule.test.mjs)

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
