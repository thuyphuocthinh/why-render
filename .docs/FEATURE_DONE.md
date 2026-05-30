# NHẬT KÝ TÍNH NĂNG (FEATURE_DONE)

*Vai trò: Bộ nhớ RAM. Sau khi code xong một tính năng, AI phải tự động log lại vào đây để duy trì bộ nhớ ngắn/trung hạn.*

## Hoàn thành ở phiên bản gốc (v0.1)
- [x] Tạo `src/core/diff.ts`: Hỗ trợ `shallowDiff` và `deepEqual` cơ bản.
- [x] Tạo `src/core/profiler.ts`: Theo dõi thời gian render, tần suất render (burst detection).
- [x] Tạo React adapter (`useWhyRender` và `<withWhyRender>` HOC).
- [x] Setup cơ bản Vue adapter.

## Các tính năng Vibe Coding (Đã hoàn thành)
- [x] **Phase 1: Core Refactoring & Robustness**
  - Chuyển đổi thành kiến trúc Event-Driven (Pub/Sub) sử dụng `coreEmitter`.
  - Định nghĩa chuẩn hợp đồng `ComponentReport` và `RenderReason`.
  - Ngăn ngừa Memory Leak: Giới hạn lưu trữ tối đa `MAX_RECORDS_PER_COMPONENT` = 50 cho mỗi component.
  - Phân tách Logger thành `ConsoleReporter`.
  - Tối ưu Zero-overhead: Bọc toàn bộ các hook/adapter bằng `process.env.NODE_ENV !== 'production'`.
