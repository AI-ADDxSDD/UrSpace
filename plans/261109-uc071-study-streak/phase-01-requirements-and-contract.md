---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-07.1

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Chuỗi ngày Học tập và Heatmap Hoạt động (Study Streak)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải dữ liệu lịch sử hoạt động hàng ngày từ backend/mock API có kèm thông tin múi giờ | SRS §3.2 + UC-07.1 | AC01, AC02 |
| R02 | Ba thẻ KPI nổi bật: Chuỗi ngày hiện tại (Ngọn lửa), Kỷ lục chuỗi (Cúp), và Tổng ngày hoạt động (Lịch) | UX EdTech SaaS | AC03, AC04 |
| R03 | Heatmap lịch hoạt động phong cách GitHub với 5 cấp độ tím, căn chỉnh theo thứ trong tuần | SRS UC-07.1 | AC05, AC06 |
| R04 | Thanh chuyển đổi chế độ xem: 90 ngày (mặc định) và 365 ngày (toàn năm) | UX Decision D04 | AC07, AC08 |
| R05 | Xử lý chuẩn hóa múi giờ người dùng, chuyển giao năm mới và năm nhuận an toàn | Timezone Integrity | AC09, AC10, AC11 |
| R06 | Tooltip chi tiết khi hover từng ô ngày và xử lý an toàn dữ liệu rỗng | Frontend Robustness | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `currentStreak` | `number` | Số ngày học liên tiếp hiện tại (>= 0) |
| `longestStreak` | `number` | Kỷ lục chuỗi ngày dài nhất từng đạt được (>= currentStreak) |
| `totalActiveDays` | `number` | Tổng số ngày duy nhất có ít nhất 1 phiên học |
| `range` | `enum` | "90d" | "365d", mặc định "90d" |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/analytics/study-streak?timezone={tz}` | Bearer User Token | `200 { current_streak, longest_streak, total_active_days, activities: DailyActivityDto[] }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "range": "90d"
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "current_streak": 7,
    "longest_streak": 21,
    "total_active_days": 45,
    "today_completed": true,
    "activities": [
      {
        "date": "2026-11-09",
        "review_count": 32,
        "level": 3
      },
      {
        "date": "2026-11-08",
        "review_count": 15,
        "level": 2
      },
      {
        "date": "2026-11-07",
        "review_count": 60,
        "level": 4
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
- [`frontend/src/features/study-streak/components/StudyStreak.tsx`](../../frontend/src/features/study-streak/components/StudyStreak.tsx)
- [`frontend/src/features/study-streak/components/StudyStreak.css`](../../frontend/src/features/study-streak/components/StudyStreak.css)
- [`frontend/src/features/study-streak/api/mockStudyStreakApi.ts`](../../frontend/src/features/study-streak/api/mockStudyStreakApi.ts)
- [`frontend/src/features/study-streak/helpers/studyStreakCalendar.ts`](../../frontend/src/features/study-streak/helpers/studyStreakCalendar.ts)
- [`frontend/src/features/study-streak/data/mockStudyActivity.ts`](../../frontend/src/features/study-streak/data/mockStudyActivity.ts)
- [`frontend/src/features/study-streak/types/index.ts`](../../frontend/src/features/study-streak/types/index.ts)
- [`frontend/tests/study-streak.test.mjs`](../../frontend/tests/study-streak.test.mjs)

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
