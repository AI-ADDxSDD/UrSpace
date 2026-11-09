---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-07.1

## Overview

Kế hoạch kiểm thử toàn diện cho **Chuỗi ngày Học tập và Heatmap Hoạt động (Study Streak)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng có lịch sử học 7 ngày liên tiếp đến hôm nay | Tải màn hình Study Streak | Hiển thị thẻ KPI Ngọn lửa với chuỗi 7 ngày và huy hiệu "Đang hoạt động". |
| **AC02** | Người dùng đã học hôm qua nhưng hôm nay chưa học | Kiểm tra chuỗi hiện tại | Hệ thống vẫn giữ nguyên chuỗi 7 ngày và hiển thị lời nhắc "Học ngay hôm nay để giữ chuỗi!". |
| **AC03** | Người dùng bỏ lỡ 1 ngày trọn vẹn (hôm qua không học) | Kiểm tra chuỗi hiện tại | Chuỗi ngày hiện tại reset về 0, nhưng kỷ lục dài nhất trong quá khứ vẫn được giữ nguyên. |
| **AC04** | Người dùng học nhiều phiên với tổng cộng 4 lần trong cùng 1 ngày | Tính chuỗi học tập | Chỉ tính là 1 ngày hoạt động duy nhất, không nhân khống chuỗi ngày. |
| **AC05** | Dữ liệu đầu vào có các dòng ngày bị trùng lặp | Xử lý tổng hợp | Khử trùng lặp và tính tổng số thẻ đã học chính xác mà không cộng dồn ngày. |
| **AC06** | Chuỗi ngày học kéo dài qua ranh giới năm cũ và năm mới (31/12 sang 01/01) | Tính toán chuỗi liên tiếp | Nhận diện đúng tính liên tục qua năm mới và xử lý chính xác cả năm nhuận (29/02). |
| **AC07** | Người dùng chuyển sang chế độ xem "365 ngày" | Heatmap kết xuất lại | Hiển thị đầy đủ ma trận 52 tuần của cả năm kèm các nhãn tháng. |
| **AC08** | Người dùng rê chuột vào một ô ngày trên Heatmap | Hover kích hoạt | Hiển thị tooltip nổi thể hiện ngày tháng và số lượng thẻ đã học (ví dụ: "Ngày 08/11/2026: 25 thẻ"). |
| **AC09** | Người dùng ở múi giờ khác GMT (ví dụ: UTC+7) | Xác định ngày hôm nay | Dùng múi giờ của tài khoản để tính ngày hôm nay theo ngày lịch địa phương chính xác. |
| **AC10** | Người dùng mới tạo tài khoản chưa có phiên học nào | Tải dữ liệu | Hiển thị chuỗi 0 ngày an toàn, ma trận heatmap toàn ô màu xám, không có lỗi runtime. |
| **AC11** | Chú giải mức độ hoạt động (Legend) | Quan sát giao diện | Hiển thị 5 ô màu từ ít (xám) đến nhiều (tím đậm) kèm nhãn "Ít hơn" và "Nhiều hơn". |
| **AC12** | Kiểm tra responsive trên màn hình 1920x1080 | Hiển thị Heatmap | Bố cục rộng rãi, các ô vuông kích thước 15px sắc nét, lề cân đối. |
| **AC13** | Kiểm tra responsive trên màn hình điện thoại 375px | Hiển thị Heatmap | Ma trận lịch có vùng cuộn ngang mượt mà, không bị tràn màn hình. |
| **AC14** | API đang tải dữ liệu | Đang chờ mạng | Hiển thị skeleton loading cho 3 thẻ KPI và lưới lịch học. |
| **AC15** | API trả về lỗi gián đoạn mạng | Báo lỗi | Hiển thị panel thông báo lỗi với nút "Thử lại" thân thiện. |
| **AC16** | Kiểm tra chuẩn tiếp cận WCAG AA | Đo độ tương phản | Tất cả các con số chuỗi và nhãn phụ đều có độ tương phản tối thiểu 4.5:1. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/study-streak/components/StudyStreak.tsx`](../../frontend/src/features/study-streak/components/StudyStreak.tsx)
- [`frontend/src/features/study-streak/components/StudyStreak.css`](../../frontend/src/features/study-streak/components/StudyStreak.css)
- [`frontend/src/features/study-streak/api/mockStudyStreakApi.ts`](../../frontend/src/features/study-streak/api/mockStudyStreakApi.ts)
- [`frontend/src/features/study-streak/helpers/studyStreakCalendar.ts`](../../frontend/src/features/study-streak/helpers/studyStreakCalendar.ts)
- [`frontend/src/features/study-streak/data/mockStudyActivity.ts`](../../frontend/src/features/study-streak/data/mockStudyActivity.ts)
- [`frontend/src/features/study-streak/types/index.ts`](../../frontend/src/features/study-streak/types/index.ts)
- [`frontend/tests/study-streak.test.mjs`](../../frontend/tests/study-streak.test.mjs)

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
