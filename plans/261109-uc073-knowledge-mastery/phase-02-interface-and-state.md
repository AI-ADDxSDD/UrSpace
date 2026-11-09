---
phase: 2
title: "Interface and State"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2 Interface and State — UC-07.3

## Overview

Đặc tả thiết kế giao diện người dùng, máy trạng thái (State Machine), hành vi tương tác bàn phím, khả năng tiếp cận (Accessibility - a11y) và bố cục thích ứng (Responsive) cho **Bản đồ Nhiệt Độ Thành thạo Kiến thức (Knowledge Mastery Heatmap)**.

Giao diện được xây dựng tuân thủ hệ thống Design System **UrSpace Modern EdTech SaaS Dashboard** với tông màu tím lavender (`#6D5CE7`) và nền sáng sạch (`#F8F9FD`).

## Requirements

### Luồng chính, Hủy bỏ và Thử lại (Main, Cancel & Retry Flow)
1. **Khởi tạo và Tải dữ liệu:** Khi component được mount, trạng thái chuyển sang `loading`. Giao diện hiển thị Skeleton loading mềm mại để tránh giật khung hình.
2. **Hiển thị dữ liệu:** Khi API trả về kết quả hợp lệ, chuyển sang `ready` và kết xuất các thành phần tương ứng.
3. **Xử lý tập rỗng (Empty State):** Nếu không có dữ liệu phù hợp (không có kết quả tìm kiếm, không có thẻ đến hạn), hiển thị panel thông báo rỗng thân thiện kèm nút hành động khắc phục (ví dụ: "Đặt lại bộ lọc", "Quay lại").
4. **Xử lý sự cố mạng (Error State):** Khi API thất bại, chuyển sang `error`, hiển thị thông điệp dễ hiểu và nút "Thử lại" (Retry).
5. **Thao tác hủy an toàn:** Mọi dialog hoặc modal hỗ trợ đóng bằng nút X, click ngoài backdrop hoặc phím `Escape` mà không làm thay đổi dữ liệu trên máy chủ.

### Bảng Trạng thái Giao diện (State Machine)

| Trạng thái | Điều kiện kích hoạt | Hành vi giao diện người dùng |
|---|---|---|
| `loading` | Component mount hoặc chuyển bộ lọc | Hiển thị Skeleton animation pulse, vô hiệu hóa các nút bấm |
| `ready` | Dữ liệu tải về thành công | Hiển thị đầy đủ các thẻ KPI, lưới nội dung và các nút tương tác |
| `empty` | Dữ liệu rỗng hoặc không khớp bộ lọc | Hiển thị minh họa rỗng, hướng dẫn người dùng hành động tiếp theo |
| `error` | Mất mạng hoặc API trả về mã lỗi 4xx/5xx | Hiển thị cảnh báo lỗi màu đỏ san hô và nút bấm thử lại |
| `submitting` | Người dùng nhấn nút gửi (Lưu/Fork/Báo cáo) | Hiển thị spinner trên nút, khóa form tránh gửi trùng lặp |

## Architecture / Interfaces

### Cấu trúc Component và Quản lý State
- Sử dụng React Functional Components với React Hooks (`useState`, `useMemo`, `useEffect`, `useCallback`).
- Trạng thái cục bộ được phân chia rõ ràng: `loadState` (loading/error/ready), `filterState` (từ khóa, danh mục, phạm vi), và `selectedItemState` (modal chi tiết).
- Không lạm dụng global state đối với các trạng thái tạm thời của màn hình; giữ trạng thái độc lập để tối ưu hiệu năng render.

### Tương tác Bàn phím và Khả năng Tiếp cận (a11y)
- **Phím `Tab` / `Shift+Tab`:** Di chuyển tiêu điểm tuần tự qua tất cả các thành phần tương tác (nút bấm, dropdown, thẻ card).
- **Focus Ring:** Sử dụng `--urspace-focus-ring: 0 0 0 3px rgba(109, 92, 231, 0.2)` sắc nét và dễ nhận biết.
- **Modal Focus Trap:** Khi mở modal, tiêu điểm được giữ an toàn bên trong modal và tự động đóng khi nhấn phím `Escape`.
- **Nhãn ngữ nghĩa (Semantic HTML & ARIA):** Sử dụng các thẻ chuẩn (`<main>`, `<section>`, `<article>`, `<button>`), bổ sung `aria-label`, `aria-live="polite"` cho các thông báo động.

### Đáp ứng Đa thiết bị (Responsive Design)
- **Desktop chuẩn (1920x1080 & 1440px):** Khai thác tối đa chiều rộng vùng làm việc (`max-width: 1360px`), bố cục 3-4 cột cân đối, các khối điều khiển và nội dung học tập hiển thị trong tầm mắt không cần cuộn trang.
- **Tablet (768px - 1024px):** Lưới tự động co về 2 cột, thanh công cụ tìm kiếm tự động xuống dòng linh hoạt.
- **Mobile (375px - 580px):** Lưới chuyển thành 1 cột, các nút bấm mở rộng full-width, thanh tab và biểu đồ hỗ trợ cuộn ngang êm ái, đảm bảo chiều cao tối thiểu cho nút bấm từ 42px trở lên để chạm dễ dàng.

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 2:
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.tsx)
- [`frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx`](../../frontend/src/features/knowledge-mastery/components/ConceptDetailModal.tsx)
- [`frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css`](../../frontend/src/features/knowledge-mastery/components/KnowledgeMastery.css)
- [`frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts`](../../frontend/src/features/knowledge-mastery/api/mockKnowledgeMasteryApi.ts)
- [`frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts`](../../frontend/src/features/knowledge-mastery/helpers/knowledgeMasteryHelpers.ts)
- [`frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts`](../../frontend/src/features/knowledge-mastery/data/mockKnowledgeMastery.ts)
- [`frontend/src/features/knowledge-mastery/types/index.ts`](../../frontend/src/features/knowledge-mastery/types/index.ts)
- [`frontend/tests/knowledge-mastery.test.mjs`](../../frontend/tests/knowledge-mastery.test.mjs)

## Implementation Steps

1. Xây dựng cấu trúc JSX và phân tách thành phần nhỏ dễ tái sử dụng.
2. Áp dụng bảng biến CSS (`index.css`, `App.css`) đồng nhất phong cách Modern EdTech SaaS.
3. Tích hợp các xử lý phím tắt và khả năng truy cập theo chuẩn WCAG AA.
4. Kiểm thử hiển thị trên các kích thước màn hình responsive thực tế.

## Success Criteria

- [x] Giao diện đạt độ thẩm mỹ cao, màu sắc và typography Manrope/DM Sans rõ ràng.
- [x] Không sử dụng CSS zoom hoặc transform: scale() để phóng to giả tạo.
- [x] Đáp ứng đầy đủ 4 trạng thái: Loading, Ready, Empty, Error.
- [x] Bàn phím Tab, Space, Enter, Escape hoạt động chính xác.

## Risk Assessment

- **Hiện tượng tràn ngang trên mobile:** Đã được kiểm soát bằng `box-sizing: border-box`, `overflow-x: hidden` cho container chính và `overflow-x: auto` có thanh cuộn tùy chỉnh cho bảng/biểu đồ.
