---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-04.4

## Overview

Kế hoạch kiểm thử toàn diện cho **Bài kiểm tra Mini theo Khái niệm (Concept Node Mini-Quiz)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng chọn một Khái niệm có gắn quiz | Khởi tạo bài kiểm tra | Tải thành công ngân hàng 3-5 câu hỏi trắc nghiệm tương ứng với khái niệm đó. |
| **AC02** | Khái niệm chưa có câu hỏi kiểm tra | Mở màn hình quiz | Hiển thị panel thông báo rỗng thân thiện "Chưa có câu hỏi cho khái niệm này" kèm nút quay lại. |
| **AC03** | Bài kiểm tra đang tiến hành | Người dùng quan sát giao diện | Thanh tiến độ hiển thị vị trí câu hỏi hiện tại (ví dụ: 1/3) và tên khái niệm đang kiểm tra. |
| **AC04** | Một câu hỏi hiển thị | Quan sát 4 phương án lựa chọn | Mỗi phương án hiển thị trong một thẻ tương tác riêng biệt có ký hiệu A, B, C, D rõ ràng. |
| **AC05** | Người dùng click vào một phương án lựa chọn | Sự kiện click kích hoạt | Thẻ lựa chọn chuyển sang trạng thái đã chọn (selected) với viền tím nổi bật. |
| **AC06** | Người dùng dùng bàn phím số 1, 2, 3, 4 | Nhấn phím tương ứng | Lựa chọn tương ứng (A, B, C hoặc D) được kích hoạt mà không cần dùng chuột. |
| **AC07** | Người dùng đã chọn một đáp án cho câu hỏi hiện tại | Nhấn nút "Câu tiếp theo" | Hệ thống lưu tạm đáp án và chuyển sang câu hỏi tiếp theo mượt mà. |
| **AC08** | Người dùng đang ở câu hỏi số 2 trở đi | Nhấn nút "Câu trước" | Quay lại câu hỏi trước đó và vẫn giữ nguyên đáp án đã chọn trước đó. |
| **AC09** | Người dùng làm đúng 3 trên 3 câu hỏi | Nộp bài kiểm tra | Hệ thống tính điểm chính xác 100% (3/3 câu đúng). |
| **AC10** | Người dùng làm đúng 2 trên 4 câu hỏi | Nộp bài kiểm tra | Hệ thống tính tỷ lệ chính xác là 50% (2/4 câu đúng). |
| **AC11** | Khái niệm không có câu hỏi nào trong ngân hàng dữ liệu | Tính toán tỷ lệ điểm | Hàm helper trả về an toàn 0% mà không gây lỗi chia cho 0 (division by zero). |
| **AC12** | Bài kiểm tra hoàn thành | Màn hình kết quả hiển thị | Hiển thị huy hiệu kết quả, điểm số, tỷ lệ % và biểu tượng cúp chúc mừng. |
| **AC13** | Màn hình kết quả đang hiển thị | Người dùng nhấn nút "Làm lại bài" | Reset toàn bộ câu trả lời về trạng thái ban đầu và bắt đầu lại từ câu số 1. |
| **AC14** | Màn hình kết quả hiển thị danh sách câu hỏi đã làm | Xem chi tiết từng câu | Chỉ rõ câu nào đã trả lời đúng, câu nào sai kèm giải thích đáp án chuẩn. |
| **AC15** | Mạng bị mất kết nối khi gửi kết quả | API báo lỗi | Hiển thị thông báo lỗi thân thiện và cho phép người dùng bấm gửi lại. |
| **AC16** | Kiểm tra trên màn hình mobile 375px | Làm bài kiểm tra | Các thẻ lựa chọn xếp chồng dọc gọn gàng, nút bấm to bản dễ thao tác chạm. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/concept-quiz/components/ConceptQuiz.tsx`](../../frontend/src/features/concept-quiz/components/ConceptQuiz.tsx)
- [`frontend/src/features/concept-quiz/components/ConceptQuizDemo.tsx`](../../frontend/src/features/concept-quiz/components/ConceptQuizDemo.tsx)
- [`frontend/src/features/concept-quiz/components/ConceptQuiz.css`](../../frontend/src/features/concept-quiz/components/ConceptQuiz.css)
- [`frontend/src/features/concept-quiz/api/mockConceptQuizApi.ts`](../../frontend/src/features/concept-quiz/api/mockConceptQuizApi.ts)
- [`frontend/src/features/concept-quiz/helpers/quizResults.ts`](../../frontend/src/features/concept-quiz/helpers/quizResults.ts)
- [`frontend/src/features/concept-quiz/types/index.ts`](../../frontend/src/features/concept-quiz/types/index.ts)
- [`frontend/tests/concept-quiz.test.mjs`](../../frontend/tests/concept-quiz.test.mjs)

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
