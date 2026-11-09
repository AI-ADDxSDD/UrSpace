---
phase: 4
title: "Testing and Verification"
status: pending
priority: P1
dependencies: [1, 2, 3]
---

# Phase 4 Testing and Verification — UC-02.7

## Overview

Kế hoạch kiểm thử toàn diện cho **Khám phá và Sao chép Bộ thẻ Công khai (Public Deck Marketplace)**, bao gồm 16 kịch bản kiểm thử nghiệm thu chi tiết dạng **Given / When / Then (AC01–AC16)**, báo cáo kết quả unit tests đã chạy thực tế trên nhánh `QuiVT`, và kế hoạch kiểm thử tự động E2E trong tương lai.

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
| **AC01** | Người dùng truy cập màn hình Marketplace | Dữ liệu được tải | Hiển thị danh sách card bộ thẻ công khai dạng lưới cân đối với hình đại diện, tiêu đề, tags và số lượng thẻ. |
| **AC02** | Danh sách bộ thẻ hiển thị trên các kích thước màn hình khác nhau | Kiểm tra responsive 1920px, 1440px, 768px, 375px | Lưới tự động co giãn từ 1 cột (mobile) đến 3-4 cột (desktop) không tràn ngang. |
| **AC03** | Người dùng nhập từ khóa "tieng viet" không dấu | Kích hoạt tìm kiếm | Bộ lọc nhận diện và trả về các bộ thẻ có chứa "Tiếng Việt" trong tiêu đề, mô tả hoặc tags. |
| **AC04** | Người dùng nhập từ khóa không khớp với bất kỳ bộ thẻ nào | Tìm kiếm thực thi | Hiển thị trạng thái rỗng (Empty State) với gợi ý thay đổi từ khóa hoặc xóa bộ lọc. |
| **AC05** | Người dùng chọn môn học "Ngoại ngữ" | Áp dụng bộ lọc | Chỉ các bộ thẻ thuộc môn "Ngoại ngữ" được hiển thị trong danh sách. |
| **AC06** | Người dùng chọn sắp xếp theo "Phổ biến nhất" | Dữ liệu được sắp xếp | Các bộ thẻ có fork_count cao nhất được ưu tiên hiển thị đầu tiên. |
| **AC07** | Người dùng click vào một card bộ thẻ | Sự kiện click kích hoạt | Modal xem trước chi tiết mở ra, hiển thị đầy đủ thông tin mô tả, tác giả và danh sách thẻ mẫu. |
| **AC08** | Modal xem trước đang mở | Người dùng nhấn phím Escape hoặc click nút đóng | Modal đóng lại an toàn, tiêu điểm quay về card đã click trước đó. |
| **AC09** | Người dùng đã đăng nhập nhấn nút "Sao chép bộ thẻ (Fork)" | Yêu cầu được gửi lên backend/mock | Hiển thị trạng thái đang sao chép, sau khi hoàn thành thông báo thành công và chuyển hướng về thư viện cá nhân. |
| **AC10** | Người dùng chưa đăng nhập (Guest) nhấn nút Fork | Kiểm tra quyền người dùng | Hiển thị thông báo yêu cầu đăng nhập trước khi có thể sao chép bộ thẻ. |
| **AC11** | Hành động Fork thành công | Kiểm tra bộ thẻ mới tạo | Bộ thẻ mới có visibility = Private, thuộc quyền sở hữu của user, giữ nguyên thẻ nhưng reset tiến trình học tập. |
| **AC12** | Danh sách bộ thẻ có nhiều hơn 12 mục | Xem thanh phân trang | Các nút phân trang hiển thị số trang chính xác và cho phép chuyển trang mượt mà. |
| **AC13** | Mạng bị gián đoạn hoặc API trả về lỗi 500 | Tải danh sách thất bại | Hiển thị panel thông báo lỗi kèm nút "Thử lại" thân thiện. |
| **AC14** | Trạng thái đang tải dữ liệu | Mạng có độ trễ | Hiển thị skeleton loading dạng lưới thẻ để giảm thiểu giật cục giao diện. |
| **AC15** | Người dùng nhấn nút "Đặt lại bộ lọc" | Kích hoạt reset | Xóa toàn bộ từ khóa tìm kiếm và đưa các dropdown về giá trị mặc định "all". |
| **AC16** | Kiểm tra khả năng tiếp cận (Accessibility) | Duyệt bằng bàn phím Tab và Screen Reader | Tất cả các card, nút bấm, bộ lọc đều có aria-label và viền focus rõ ràng theo chuẩn WCAG AA. |

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 4:
- [`frontend/src/features/public-decks/components/PublicDeckMarketplace.tsx`](../../frontend/src/features/public-decks/components/PublicDeckMarketplace.tsx)
- [`frontend/src/features/public-decks/components/PublicDeckMarketplace.css`](../../frontend/src/features/public-decks/components/PublicDeckMarketplace.css)
- [`frontend/src/features/public-decks/api/mockPublicDecksApi.ts`](../../frontend/src/features/public-decks/api/mockPublicDecksApi.ts)
- [`frontend/src/features/public-decks/helpers/publicDeckFilters.ts`](../../frontend/src/features/public-decks/helpers/publicDeckFilters.ts)
- [`frontend/src/features/public-decks/types/index.ts`](../../frontend/src/features/public-decks/types/index.ts)
- [`frontend/tests/public-decks.test.mjs`](../../frontend/tests/public-decks.test.mjs)

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
