---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-05.2

## Overview

Kế hoạch kiểm thử toàn diện cho **Phiên học Gợi nhớ Tích cực (Active Recall Study Session)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng chọn học một bộ thẻ có 10 thẻ | Khởi động phiên học | Tải thành công danh sách thẻ, hiển thị thẻ đầu tiên ở mặt trước (câu hỏi). |
| **AC02** | Bộ thẻ không có thẻ nào đến hạn ôn tập | Mở phiên học | Hiển thị màn hình thông báo hoàn thành "Bạn đã ôn tập hết các thẻ hôm nay!" kèm nút quay lại. |
| **AC03** | Thẻ đang ở mặt trước | Người dùng nhấn phím Space hoặc click vào thẻ | Thẻ lật 3D sang mặt sau để lộ câu trả lời và cụm 4 nút đánh giá xuất hiện. |
| **AC04** | Thẻ đang ở mặt sau | Người dùng nhấn lại phím Space | Thẻ lật ngược lại về mặt trước mà không làm mất trạng thái phiên học. |
| **AC05** | Thẻ đang hiển thị mặt sau | Người dùng nhấn phím số 1 | Ghi nhận đánh giá "Again" cho thẻ hiện tại và chuyển sang thẻ tiếp theo. |
| **AC06** | Thẻ đang hiển thị mặt sau | Người dùng nhấn phím số 2, 3 hoặc 4 | Ghi nhận tương ứng "Hard", "Good" hoặc "Easy" và chuyển tiếp. |
| **AC07** | Thẻ đang ở mặt trước (chưa lật) | Người dùng bấm phím 1-4 | Phím tắt bị khóa an toàn để buộc người học phải xem đáp án trước khi tự đánh giá. |
| **AC08** | Bốn nút đánh giá hiển thị trên desktop 1080p | Kiểm tra chiều cao viewport | Flashcard và cả 4 nút hiển thị trọn vẹn không cần cuộn chuột. |
| **AC09** | Người dùng đã đánh giá 3 trên 10 thẻ | Quan sát thanh tiến độ | Thanh tiến độ hiển thị chính xác 30% kèm số lượng thẻ 3/10. |
| **AC10** | Người dùng đánh giá 5 thẻ với các mức Again, Hard, Good, Easy | Hàm tính toán kết quả chạy | Tính chính xác số lượng và tỷ lệ % của từng loại đánh giá. |
| **AC11** | Phiên học chỉ có toàn đánh giá Again | Tổng kết phiên | Nhận diện đúng phiên học cần cải thiện (100% Again) và tỷ lệ thành công 0%. |
| **AC12** | Phiên học chỉ có toàn đánh giá Good hoặc Easy | Tổng kết phiên | Nhận diện đúng phiên học xuất sắc với tỷ lệ ghi nhớ 100%. |
| **AC13** | Người dùng học đến thẻ cuối cùng trong danh sách | Hoàn tất đánh giá thẻ cuối | Tự động chuyển tiếp mượt mà sang màn hình kết quả phiên học (UC-05.9). |
| **AC14** | Phiên học kéo dài 3 phút 25 giây | Định dạng thời gian | Hiển thị chuẩn "03:25" với số 0 đệm đầu cho giây. |
| **AC15** | Người dùng nhấn nút "Tạm dừng / Thoát" | Xác nhận thoát | Lưu lại tiến trình các thẻ đã hoàn thành và quay về trang chủ bộ thẻ. |
| **AC16** | Kiểm tra giao diện trên màn hình di động 375px | Thao tác học | Thẻ tự co giãn tỷ lệ, các nút bấm xếp 2x2 hoặc hàng ngang dễ chạm ngón tay cái. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/study-session/components/StudySession.tsx`](../../frontend/src/features/study-session/components/StudySession.tsx)
- [`frontend/src/features/study-session/components/StudySession.css`](../../frontend/src/features/study-session/components/StudySession.css)
- [`frontend/src/features/study-session/data/mockFlashcards.ts`](../../frontend/src/features/study-session/data/mockFlashcards.ts)
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
