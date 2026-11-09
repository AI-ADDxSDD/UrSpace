---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract — UC-07.2

## Overview

Tài liệu này xác định chi tiết phạm vi yêu cầu nghiệp vụ, cấu trúc dữ liệu, và hợp đồng API đề xuất cho **Biểu đồ Đường cong Quên lãng (Forgetting Curve)**.
Mọi định nghĩa endpoint đều tuân thủ chuẩn RESTful, sử dụng mã lỗi Problem Details theo RFC 7807 và đối chiếu với bộ quy chuẩn dùng chung C01–C10.

## Requirements

| ID | Yêu cầu nghiệp vụ | Nguồn / Phân loại | Nghiệm thu Phase 4 |
|---|---|---|---|
| R01 | Tải dữ liệu lịch sử đánh giá thẻ từ mock API / backend theo phạm vi ngày đã chọn | SRS §3.2 + UC-07.2 | AC01, AC02 |
| R02 | Tính toán đường suy giảm lý thuyết Ebbinghaus theo trục thời gian (0 đến N ngày) | Math Model Decision D02 | AC03, AC04 |
| R03 | Tổng hợp tỷ lệ ghi nhớ thực tế (Observed Retention %) từ các điểm dữ liệu lịch sử ôn tập | SRS UC-07.2 | AC05, AC06 |
| R04 | Biểu đồ SVG hai đường với trục hoành (Thời gian - ngày), trục tung (Tỷ lệ ghi nhớ - %), lưới tọa độ và chú giải | Frontend Data Viz | AC07, AC08 |
| R05 | Thanh chọn phạm vi thời gian (7 ngày, 14 ngày, 30 ngày, 60 ngày) và thẻ tóm tắt KPI | UX EdTech SaaS | AC09, AC10, AC11 |
| R06 | Xử lý an toàn trường hợp không có dữ liệu quan sát, loading skeleton và tooltip tương tác | Robustness | AC12, AC13, AC14, AC15, AC16 |

### Field Specification

| Trường dữ liệu | Kiểu dữ liệu | Quy tắc validation / Ràng buộc biên |
|---|---|---|
| `range` | `enum` | "7d" | "14d" | "30d" | "60d", mặc định "14d" |
| `observedPoints` | `RetentionPoint[]` | Mảng các điểm: { dayIndex, retentionRate, reviewCount } |
| `theoreticalCurve` | `RetentionPoint[]` | Mảng các điểm tính theo mô hình Ebbinghaus |

## Architecture / Interfaces

Hệ thống cung cấp các giao diện và endpoint đề xuất (Proposed API) để phục vụ chức năng:

| Endpoint đề xuất | Yêu cầu xác thực | Phản hồi chuẩn / Mã lỗi |
|---|---|---|
| `GET /api/v1/analytics/forgetting-curve?range={7d|14d|30d|60d}` | Bearer User Token | `200 { summary: { average_retention, total_reviews, retention_stability }, history: ReviewHistoryDto[] }` |

### Ví dụ Contract JSON

**Request Payload:**
```json
{
  "range": "14d"
}
```

**Response Payload (200 OK / 201 Created):**
```json
{
  "data": {
    "summary": {
      "average_retention": 84.5,
      "total_reviews": 142,
      "retention_stability_days": 7.2
    },
    "observed_points": [
      {
        "day": 1,
        "retention_percentage": 92,
        "review_count": 25
      },
      {
        "day": 3,
        "retention_percentage": 86.5,
        "review_count": 30
      },
      {
        "day": 7,
        "retention_percentage": 78,
        "review_count": 42
      }
    ],
    "model_notice": "Đường cong lý thuyết chỉ mang tính chất minh họa mô hình Ebbinghaus, không thay thế thuật toán FSRS của Backend."
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
- [`frontend/src/features/forgetting-curve/components/ForgettingCurve.tsx`](../../frontend/src/features/forgetting-curve/components/ForgettingCurve.tsx)
- [`frontend/src/features/forgetting-curve/components/ForgettingCurveChart.tsx`](../../frontend/src/features/forgetting-curve/components/ForgettingCurveChart.tsx)
- [`frontend/src/features/forgetting-curve/components/ForgettingCurve.css`](../../frontend/src/features/forgetting-curve/components/ForgettingCurve.css)
- [`frontend/src/features/forgetting-curve/api/mockForgettingCurveApi.ts`](../../frontend/src/features/forgetting-curve/api/mockForgettingCurveApi.ts)
- [`frontend/src/features/forgetting-curve/helpers/forgettingCurveCalculation.ts`](../../frontend/src/features/forgetting-curve/helpers/forgettingCurveCalculation.ts)
- [`frontend/src/features/forgetting-curve/data/mockReviewHistory.ts`](../../frontend/src/features/forgetting-curve/data/mockReviewHistory.ts)
- [`frontend/src/features/forgetting-curve/types/index.ts`](../../frontend/src/features/forgetting-curve/types/index.ts)
- [`frontend/tests/forgetting-curve.test.mjs`](../../frontend/tests/forgetting-curve.test.mjs)

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
