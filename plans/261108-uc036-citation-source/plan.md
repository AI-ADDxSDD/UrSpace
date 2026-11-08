---
title: "UC-03.6 Source Citation and PDF Verification"
description: "Kế hoạch triển khai chi tiết API Đối chiếu Nguồn Tài liệu gốc (PDF/PPTX), hỗ trợ truyền tải HTTP 206 Partial Content (Byte-Range Streaming), trả về chính xác số trang/slide nguồn (source_page) và đoạn trích dẫn (source_excerpt) để bôi vàng text layer trên PDF.js, kết hợp phân quyền đa tầng và ETag caching bằng C# (.NET 8 ASP.NET Core)"
status: pending
priority: P1
branch: "main"
tags: [backend, pdf, streaming, http-206, citation, security, csharp, dotnet, postgresql]
blockedBy: [261108-uc035-flashcards-curation]
blocks: []
created: "2026-11-08T09:00:29.136Z"
createdBy: "ck:plan"
source: skill
---

# UC-03.6 Source Citation and PDF Verification

## Overview

Kế hoạch này hiện thực hóa **UC-03.6 (Đối chiếu Nội dung với Tài liệu gốc)** thuộc phân hệ Backend AI Pipeline (Thành viên 2).
Đây là mắt xích bảo vệ niềm tin nhận thức của người học, loại bỏ hoàn toàn "Hội chứng hoài nghi AI ảo giác" (AI Hallucination):
- **Truyền tải phân đoạn chuẩn công nghiệp (HTTP 206 Partial Content)**: Sử dụng cơ chế Byte-Range Streaming của ASP.NET Core thông qua `FileStreamResult(..., enableRangeProcessing: true)`. Trình duyệt và thư viện PDF.js chỉ tải phân đoạn byte của trang cần xem (khoảng $200\text{KB} - 500\text{KB}$) thay vì tải toàn bộ file $25\text{MB}$, đưa thời gian mở tài liệu về $< 300\text{ms}$ và tiêu thụ RAM server tiệm cận $0$.
- **Trích xuất nguồn chính xác**: API trả về `source_page` (hoặc số thứ tự slide PPTX) và đoạn trích dẫn gốc `source_excerpt` ($\ge 20$ từ theo luật `BR-12`), cho phép Frontend tự động nhảy trang (`#page=X`) và highlight vàng đoạn văn bản trên Text Layer.
- **Bảo mật & Phân quyền Đa tầng**: Chỉ chủ sở hữu tài liệu (`Owner`) hoặc học viên đang học bộ thẻ được chia sẻ mới có quyền stream file. Ngăn chặn tuyệt đối việc dò quét tải lậu tài liệu từ máy chủ.
- **Bộ đệm thông minh (ETag & Cache-Control)**: Hỗ trợ ETag (`sha256_hash`) và HTTP 304 Not Modified giúp giảm thiểu tối đa băng thông khi học viên mở đối chiếu nhiều lần trong phiên học.

## Phases

| Phase | Name | Status | Priority | Deliverables |
|-------|------|--------|----------|--------------|
| 1 | [Storage and Streaming Layer](./phase-01-storage-and-streaming-layer.md) | Pending | P2 | Interface `IFileStorageService` hỗ trợ đọc `Stream`, cấu hình FileStreamResult với `EnableRangeProcessing = true`, quản lý MIME type PDF/PPTX |
| 2 | [Citation Service and Security](./phase-02-citation-service-and-security.md) | Pending | P1 | Interface `IDocumentCitationService` truy vấn metadata trích dẫn từ `Flashcards` hoặc `Concepts`, xác thực quyền sở hữu `Document` và quyền truy cập `Deck` |
| 3 | [RESTful Controller and Caching](./phase-03-restful-controller-and-caching.md) | Pending | P1 | Controller `DocumentCitationController`: API `GET citation` và API `GET stream` hỗ trợ HTTP 206, ETag, Cache-Control Private |
| 4 | [Testing and Verification](./phase-04-testing-and-verification.md) | Pending | P2 | xUnit Unit tests cho logic xác thực quyền và trích xuất excerpt, Integration tests kiểm tra HTTP 206 Byte-Range Request và bảo mật 403 Forbidden |

## Dependencies & Downstream Touchpoints

- **Tài liệu đặc tả liên quan**:
  - Báo cáo brainstorm: `plans/reports/2026-11-08-uc-03.6-citation-source-brainstorm.md`
  - SRS: `ref/Report3_Software_Requirement_Specification.md` (UC-03.6, BR-12, S-05)
- **Upstream Plans phụ thuộc**:
  - `plans/261108-uc031-upload-file`: Lưu trữ file và mã hóa SHA-256.
  - `plans/261108-uc033-concept-nodes`: Lưu trữ `source_page` của các Khái niệm.
  - `plans/261108-uc035-flashcards-curation`: Lưu trữ `source_page` và `source_excerpt` của Flashcards.
- **Downstream Plans**:
  - `UC-04.3`: Xem Chi tiết Khái niệm trên Cây kỹ năng 2D (TV4 mở modal citation).
  - `UC-05.2`: Giao diện Lật thẻ & Tự kiểm tra Active Recall (TV5 bấm nút đối chiếu khi lật mặt sau).

---

## Validation Log

### Session 1 — 2026-11-08
**Trigger:** Thẩm định kế hoạch triển khai UC-03.6 (/ck:plan validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Range Request Policy / Streaming]** Về cơ chế phân đoạn Byte-Range khi stream file PDF:
   - Options: Để client/trình duyệt tự do yêu cầu kích thước range theo chuẩn HTTP RFC 7233 (thường từ 64KB - 512KB tùy tốc độ mạng) (Recommended) | Áp đặt giới hạn trần cứng
   - **Answer:** Để client/trình duyệt tự do yêu cầu kích thước range theo chuẩn HTTP RFC 7233 (thường từ 64KB - 512KB tùy tốc độ mạng) (Recommended)
   - **Rationale:** Tuân thủ chuẩn RFC 7233 giúp trình duyệt web hiện đại và các thư viện chuyên dụng như PDF.js tự động tối ưu hóa kích cỡ chunk dựa trên độ trễ mạng thực tế của người dùng, mang lại trải nghiệm mở file mượt mà nhất mà không cần can thiệp gượng ép ở backend.

2. **[Text Layer Matching / Highlight]** Về thuật toán so khớp đoạn trích dẫn (`source_excerpt`) trên Text Layer của PDF.js:
   - Options: Chuẩn hóa khoảng trắng (bỏ qua ký tự xuống dòng thừa, khoảng trắng kép) trước khi tìm kiếm bôi vàng trên Text Layer (Recommended) | So khớp chính xác tuyệt đối 100%
   - **Answer:** Chuẩn hóa khoảng trắng (bỏ qua ký tự xuống dòng thừa, khoảng trắng kép) trước khi tìm kiếm bôi vàng trên Text Layer để highlight chính xác ngay cả khi PDF bị ngắt dòng (Recommended)
   - **Rationale:** Các file PDF thường chứa ngắt dòng mềm hoặc khoảng trắng bất thường do căn lề (justification). Chuẩn hóa khoảng trắng đảm bảo việc bôi vàng trên Text Layer hoạt động ổn định và chính xác 100%, không bị lỗi miss highlight.

3. **[PPTX Presentation Viewer / Scope]** Về giải pháp hiển thị đối chiếu đối với file bài giảng slide PPTX:
   - Options: Trả về số thứ tự slide kèm đoạn trích dẫn (Frontend hiển thị khung trích dẫn có badge "Slide #X" kèm nút tải slide gốc) (Recommended) | Bổ sung bước convert toàn bộ slide PPTX sang PDF/ảnh lúc upload
   - **Answer:** Trả về số thứ tự slide kèm đoạn trích dẫn (Frontend hiển thị khung trích dẫn có badge "Slide #X" kèm nút tải slide gốc) (Recommended)
   - **Rationale:** Tiết kiệm tối đa tài nguyên tính toán (CPU/RAM) của máy chủ xử lý nền, tránh phải cài đặt các bộ chuyển đổi nặng nề như LibreOffice vào container, đồng thời vẫn đáp ứng hoàn hảo mục đích đối chiếu nguồn của học viên.

#### Confirmed Decisions
- **Standard RFC 7233 Range Handling**: Hỗ trợ phân đoạn byte tự nhiên của trình duyệt qua `FileStreamResult.EnableRangeProcessing = true`.
- **Whitespace Normalization**: Chuỗi trích dẫn `source_excerpt` được chuẩn hóa khoảng trắng để frontend highlight Text Layer không bị trượt khi có ngắt dòng.
- **Lightweight PPTX Citation**: Đối với PPTX, hệ thống trả về số thứ tự slide và trích dẫn văn bản, không tốn tài nguyên render ảnh/PDF server-side.

#### Whole-Plan Consistency Sweep
- Đã đồng bộ toàn bộ quy ước và quyết định vào các phase files.
- Kế hoạch hoàn tất thẩm định, không có xung đột kỹ thuật, sẵn sàng chuyển giao.
