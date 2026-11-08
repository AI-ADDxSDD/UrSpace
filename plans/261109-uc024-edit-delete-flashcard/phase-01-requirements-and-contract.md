---
phase: 1
title: "Requirements and Contract"
status: pending
priority: P1
dependencies: []
---

# Phase 1 Requirements and Contract

## Overview

Chốt phạm vi UC-02.4: Sửa front/back an toàn và xóa thẻ có xác nhận, giữ đúng lifecycle học cá nhân. API/schema/route đều là **đề xuất chưa có mã**, dùng [contract chung C01–C12](../reports/2026-11-09-member4-shared-contracts-and-source-review.md) làm nguồn quy tắc shared, không tạo convention thứ hai.

## Requirements

| ID | Yêu cầu | Nguồn/phân loại | Nghiệm thu phase 4 |
|---|---|---|---|
| R01 | Edit front/back preserve renderer/text rules, giữ loại thẻ | SRS FE 01+C02/C06 | AC01, AC02, AC03 |
| R02 | Không reset FSRS/log/pin; invalidate cache khi text đổi | UC063/064 decisions | AC04, AC05 |
| R03 | Xóa card cascade mọi-user state/log/cache, giữ Concept/DAG | SRS02.4+C05 | AC06, AC07 |
| R04 | Owner và card/Deck path đúng, version conflict | C01/C03 | AC08, AC09, AC10 |
| R05 | Retry/delete tombstone, giữ draft và UI updates | C04/C11 | AC11, AC12, AC13, AC14, AC15, AC16 |

### Field specification

| Field/control | Validation/default/giới hạn |
|---|---|
| front/back | C02 bounds/preserve; PATCH front/back, không card_type |
| card_type/structured content | Read-only; Backend validate toàn bộ result theo loại, không chỉ nonempty/length. CLOZE/MC invalid bị400 CARD_TYPE_VALIDATION_ERROR, atomic rollback |
| can_edit_text | Capability từ Backend; schema/type chưa được hỗ trợ thì false, editor chỉ đọc có lý do; bypass409 UNSUPPORTED_CARD_SCHEMA |
| is_content_edited | Server true khi front/back thực sự đổi; source anchor gốc không nhận từ client |
| expected_deck_version | integer≥1; bắt buộc PATCH/DELETE |
| delete confirm | Cảnh báo state/log/pin mọi viewer bị xóa; không xóa Concept |

Thông báo VI/EN đề xuất dùng mã ổn định: “Dữ liệu chưa hợp lệ / Invalid input”, “Dữ liệu đã thay đổi, hãy xem lại / Content changed, review before saving”, “Chưa xác định kết quả, kiểm tra lại / Result unknown, check again”; lỗi field cụ thể theo giới hạn trên. Required/permission không chỉ toast; error envelope giữ timestamp/error_code/user_message.

## Architecture / Interfaces

| Endpoint hoặc local interface | Request/quyền | Response/lỗi |
|---|---|---|
| GET /api/v1/decks/{id}/flashcards/{card_id} | Auth read, owner khi edit | 200 card raw data+deck_version+capabilities |
| PATCH /api/v1/decks/{id}/flashcards/{card_id} | front/back,expected_deck_version,key | 200 current card projection; type/state preserved |
| DELETE /api/v1/decks/{id}/flashcards/{card_id}?expected_deck_version=7 | Owner/key | 200 {deleted_card_id,deleted:true,deck_version}; replay tombstone |

### Ví dụ contract
Các ID deck-a/card-a/c1 dưới đây là **alias minh họa**, request thật dùng UUID.

Request hoặc read context:
```json
{
  "expected_deck_version": 7,
  "front": "Đạo hàm của x²?",
  "back": "$$2x$$"
}
```

Response hoặc local projection:
```json
{
  "data": {
    "card_id": "card-a",
    "deck_id": "deck-a",
    "deck_version": 8,
    "card_type": "STANDARD",
    "is_content_edited": true
  }
}
```

C01 identity/visibility; C02 validation; C03 version; C04 receipt/retry cho write; C07 cache/query viewer; C09/C10 graph snapshot. Success201 create/200 replay hoặc read; errors C11. Không tự gán owner/status/citation bằng client. 400 validation,401auth,403write-denied,404masked,409version/query/graph/key,410deleted-result,429Retry-After,5xxunknown phải phân biệt; endpoint cụ thể ở bảng. Read retry không ghi server; write recovery phải giữ frozen snapshot sau lỗi attempt.

## Related Code Files

Chưa có source để sửa. Vị trí logic khi triển khai: S-03, module feature UC-02.4, auth/API client, locale/renderer/cache của host; backend DTO/readmodel/transaction tương ứng. Đường dẫn source và package chỉ được chốt khi có scaffold; không bịa file đã tồn tại. Tài liệu: [plan](./plan.md), [contract](./phase-01-requirements-and-contract.md), [UI/state](./phase-02-interface-and-state.md), [tích hợp](./phase-03-backend-integration.md), [kiểm thử](./phase-04-testing-and-verification.md), [brainstorm](../reports/2026-11-09-uc-02.4-edit-delete-flashcard-brainstorm.md), [contract dùng chung](../reports/2026-11-09-member4-shared-contracts-and-source-review.md).

## Implementation Steps

1. Đối chiếu host/schema thật với bảng fields và C01–C12; ghi mapping snake_case/C# rõ.
2. Dùng source table trong brainstorm phân biệt SRS/plan/example/giả định mới.
3. Backend bàn giao validation/readmodel/atomicity theo phase 3; FE làm mock không chờ runtime.
4. Chuyển trace R→AC sang phase 4, giữ error/version/privacy contract nhất quán.

## Success Criteria

- [ ] Mọi R có nguồn và AC; những giới hạn chưa SRS được ghi Cxx/decision.
- [ ] Request/response thực đáp ứng authority owner/viewer, version và shared rule khi triển khai.
- [ ] Không áp nhầm AI lifecycle/minimum/placeholder hoặc source permission rộng hơn.
- [ ] Boundary mismatch được sửa, không thêm wire adapters che giấu hai chuẩn.

## Risk Assessment

Example .Trim/type fallback trong old service không đủ validation. Schema MC/CLOZE chưa đầy đủ không được âm thầm đổi kiểu hoặc mất fields khi sửa. Không thể xác nhận API hoặc validation thực khi chưa có mã.
