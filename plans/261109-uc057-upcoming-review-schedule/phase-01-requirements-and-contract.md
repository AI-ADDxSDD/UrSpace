---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-05.7

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Lịch ôn tập sắp tới (Upcoming Review Schedule)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải dữ liệu danh sách thẻ đến hạn từ mock API / backend theo khoảng thời gian | SRS §3.2 + UC-05.7 | AC01, AC02 |
| R02 | Bốn thẻ KPI tóm tắt: Tổng thẻ cần ôn, Quá hạn, Đến hạn hôm nay, và Dự kiến tuần này | UX Dashboard Standard | AC03, AC04 |
| R03 | Thanh điều khiển chọn phạm vi thời gian: 7 ngày, 14 ngày, 30 ngày | SRS UC-05.7 | AC05, AC06 |
| R04 | Biểu đồ cột trực quan hiển thị số lượng thẻ theo từng ngày với nhãn thứ/ngày tháng | Frontend Data Viz | AC07, AC08 |
| R05 | Xử lý chuẩn hóa múi giờ và khử trùng lặp thẻ ghi nhớ một cách nhất quán | Timezone Integrity | AC09, AC10, AC11 |
| R06 | Xử lý an toàn các tập dữ liệu rỗng, dữ liệu ngoài phạm vi và trạng thái loading | Robustness | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `range` | `enum` | "7d" | "14d" | "30d", mặc định "14d" |
| `timezone` | `string` | Tùy chọn, IANA timezone string (ví dụ: "Asia/Ho_Chi_Minh") |
| `buckets` | `ReviewDayBucket[]` | Mảng các ngày: { dateString, dayLabel, count, isToday, isOverdue } |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/study/schedule?range={7d|14d|30d}&timezone={tz}` | Bearer User Token | `200 { summary: { total_due, overdue_count, today_count }, buckets: ReviewDayBucket[] }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "range": "14d",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "summary": {
      "total_cards_in_range": 85,
      "overdue_count": 12,
      "due_today_count": 18,
      "daily_average": 6.1
    },
    "buckets": [
      {
        "date": "2026-11-09",
        "label": "T2 09/11",
        "count": 18,
        "is_today": true
      },
      {
        "date": "2026-11-10",
        "label": "T3 10/11",
        "count": 14,
        "is_today": false
      },
      {
        "date": "2026-11-11",
        "label": "T4 11/11",
        "count": 8,
        "is_today": false
      }
    ]
  }
}
```

### Chuẩn hóa Xử lý Lỗi (RFC 7807 Problem Details)
Khi có lỗi phát sinh (dữ liệu không hợp lệ, không tìm thấy, xung đột hoặc lỗi máy chủ), Backend trả về phản hồi định dạng chuẩn:
```json
{
  "type": "https://api.urspace.edu.vn/errors/invalid-request",
  "title": "Yêu cầu không hợp lệ",
  "status": 400,
  "detail": "Dữ liệu gửi lên không vượt qua các quy tắc kiểm tra tính hợp lệ.",
  "instance": "/api/v1/resource/endpoint",
  "code": "VALIDATION_FAILED"
}
```

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 1:
- [`frontend/src/features/review-schedule/components/ReviewSchedule.tsx`](../../frontend/src/features/review-schedule/components/ReviewSchedule.tsx)
- [`frontend/src/features/review-schedule/components/ReviewSchedule.css`](../../frontend/src/features/review-schedule/components/ReviewSchedule.css)
- [`frontend/src/features/review-schedule/api/mockReviewScheduleApi.ts`](../../frontend/src/features/review-schedule/api/mockReviewScheduleApi.ts)
- [`frontend/src/features/review-schedule/helpers/aggregateReviewSchedule.ts`](../../frontend/src/features/review-schedule/helpers/aggregateReviewSchedule.ts)
- [`frontend/src/features/review-schedule/data/mockReviewDueCards.ts`](../../frontend/src/features/review-schedule/data/mockReviewDueCards.ts)
- [`frontend/src/features/review-schedule/types/index.ts`](../../frontend/src/features/review-schedule/types/index.ts)
- [`frontend/tests/review-schedule.test.mjs`](../../frontend/tests/review-schedule.test.mjs)

## Implementation Steps

1. Rà soát danh sách trường và đối chiếu kiểu dữ liệu TypeScript trong `types/index.ts`.
2. Kiểm tra tính tương thích giữa DTO của mock API và hợp đồng đề xuất cho Backend C# ASP.NET Core.
3. Đồng bộ hóa mã lỗi và thông báo thân thiện với người dùng cả tiếng Việt và tiếng Anh.
4. Chuyển giao các ràng buộc kiểm thử sang Phase 4 để làm căn cứ viết unit test.

## Success Criteria

- [x] Đầy đủ các trường dữ liệu được định nghĩa kiểu rõ ràng trong TypeScript.
- [x] Có ví dụ JSON request và response hợp lệ, dễ đọc.
- [x] Quy định mã lỗi rõ ràng theo chuẩn RFC 7807, không trả về lỗi thô 500.
- [x] Truy vết 100% từ Requirements (R01–R06) sang Acceptance Criteria (AC01–AC16).

## Risk Assessment

- **Rủi ro lệch pha hợp đồng:** Backend có thể dùng quy ước đặt tên khác (`PascalCase` trong C#). Giải pháp: Frontend dùng `camelCase` và cấu hình serializer JSON chuyển đổi `snake_case` thống nhất ở tầng API gateway.
