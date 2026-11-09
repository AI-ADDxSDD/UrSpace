---
phase: 3
title: "Backend Integration"
status: pending
priority: P1
dependencies: [1, 2]
---

# Phase 3 Backend Integration — UC-06.5

## Overview

Đặc tả kế hoạch tích hợp giữa Frontend React/TypeScript và Backend C# ASP.NET Core Web API cùng hệ quản trị cơ sở dữ liệu Microsoft SQL Server cho **Báo cáo Thẻ ghi nhớ Sai lệch (Report Incorrect Flashcard)**.

Hiện tại, Frontend đã triển khai hoàn thiện tầng **Mock API Client** độc lập trong thư mục `api/`, cho phép người dùng trải nghiệm đầy đủ chức năng với dữ liệu giả lập thực tế, độ trễ mạng nhân tạo và xử lý lỗi ngẫu nhiên.

## Requirements

### Mock API Tối thiểu Đã Triển khai
- Cung cấp dữ liệu mẫu phong phú trong thư mục `data/`.
- Hàm loader giả lập độ trễ mạng `setTimeout(..., 200 - 400ms)` để kiểm thử trạng thái loading.
- Tự động chuẩn hóa dữ liệu đầu ra phù hợp với DTO đã thiết kế, không gây lỗi runtime trên UI.

### Bàn giao Kỹ thuật từ Đội ngũ Backend
1. **Controller API:** Xây dựng ASP.NET Core Controller tương ứng với các route RESTful được định nghĩa trong Phase 1.
2. **DTO & Model Validation:** Triển khai các Data Transfer Objects với FluentValidation hoặc DataAnnotations tương ứng với bảng đặc tả trường dữ liệu.
3. **Xác thực & Ủy quyền:** Xác thực JWT token, lấy User ID từ ClaimsPrincipal và kiểm tra quyền sở hữu tài nguyên (owner authorization).
4. **Cơ sở dữ liệu:** Tạo bảng và Migration trong SQL Server với khóa chính UUID (`uniqueidentifier`), khóa ngoại và chỉ mục (indexes) tối ưu hóa truy vấn.

## Architecture / Interfaces

### Hợp đồng DTO Đề xuất cho ASP.NET Core Web API

**C# Controller Endpoint Signature:**
```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UC065Controller : ControllerBase
{
    // GET /api/v1/...
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync([FromQuery] QueryParamsDto query)
    {
        // Implementation provided by Backend team
        return Ok();
    }

    // POST /api/v1/...
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SubmitAsync([FromBody] SubmitPayloadDto payload)
    {
        // Implementation provided by Backend team
        return Created("", null);
    }
}
```

### Đề xuất Lược đồ Cơ sở Dữ liệu Microsoft SQL Server

```sql
-- Bảng lưu trữ liên quan đến UC-06.5
CREATE TABLE dbo.UC065_Records (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    UpdatedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    IsActive BIT NOT NULL DEFAULT 1,
    -- Các trường nghiệp vụ chi tiết
    DataPayload NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
    
    CONSTRAINT FK_UC065_Users FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id)
);

CREATE INDEX IX_UC065_UserId_CreatedAt 
ON dbo.UC065_Records(UserId, CreatedAt DESC);
```

## Related Code Files

Các file mã nguồn thực tế tại nhánh `QuiVT` liên quan trực tiếp đến Phase 3:
- [`frontend/src/features/card-reports/components/FlashcardReportModal.tsx`](../../frontend/src/features/card-reports/components/FlashcardReportModal.tsx)
- [`frontend/src/features/card-reports/components/FlashcardReportModal.css`](../../frontend/src/features/card-reports/components/FlashcardReportModal.css)
- [`frontend/src/features/card-reports/api/mockCardReportsApi.ts`](../../frontend/src/features/card-reports/api/mockCardReportsApi.ts)
- [`frontend/src/features/card-reports/helpers/validateFlashcardReport.ts`](../../frontend/src/features/card-reports/helpers/validateFlashcardReport.ts)
- [`frontend/src/features/card-reports/types/index.ts`](../../frontend/src/features/card-reports/types/index.ts)
- [`frontend/tests/card-reports.test.mjs`](../../frontend/tests/card-reports.test.mjs)

## Implementation Steps

1. Duy trì mock API độc lập để phục vụ demo và phát triển giao diện không bị gián đoạn.
2. Viết tài liệu OpenAPI / Swagger mô tả chính xác hợp đồng DTO để bàn giao cho lập trình viên Backend.
3. Khi Backend hoàn thành, thay thế hàm gọi API trong file `api/mock...Api.ts` bằng client gọi HTTP thật (`fetch` hoặc `axios`) qua biến môi trường `VITE_API_BASE_URL`.
4. Bổ sung interceptor tự động đính kèm Bearer JWT Token vào Header của các request.

## Success Criteria

- [x] Mock API hoạt động độc lập và ổn định 100%, không phụ thuộc backend.
- [x] DTO phía Frontend tương thích hoàn toàn với kiến trúc C# ASP.NET Core.
- [x] Có đề xuất lược đồ SQL Server rõ ràng, có khóa ngoại và chỉ mục tìm kiếm.
- [x] Kế hoạch chuyển đổi từ Mock sang Real API rõ ràng, chỉ cần đổi cấu hình mà không phải sửa logic component.

## Risk Assessment

- **Độ trễ mạng thực tế:** Mock API phản hồi sau 250ms; mạng thực tế có thể chậm hơn hoặc timeout. Đã chuẩn bị sẵn cơ chế AbortController và thông báo timeout thân thiện.
