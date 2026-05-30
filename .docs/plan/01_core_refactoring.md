# PLAN: Phase 1 - Core Refactoring & Robustness

**Mục tiêu:** Nâng cấp bản v0.1 thành một core vững chắc, tuân thủ kiến trúc Core + Adapter (như trong `unified_strategy.md`), fix memory leak và đưa vào mô hình Event-Driven.

## Các Task Kỹ Thuật (To-Do)

1. **Chuẩn hoá Interface `ComponentReport`**
   - File: `src/core/types.ts`
   - Định nghĩa rõ `RenderReason` (props, state, hooks, parent).

2. **Refactor `src/core/profiler.ts`**
   - Gỡ bỏ mọi `console.log` và `logWarning`.
   - Chuyển thành Pub/Sub (Sử dụng Event Emitter đơn giản hoặc `mitt`).
   - Xử lý Memory Leak: Giới hạn mảng `renders` của mỗi component (ví dụ max 50 records) hoặc dùng cơ chế time-based eviction.

3. **Refactor React Adapter (`useWhyRender` / `trackRender`)**
   - Đảm bảo nó gom dữ liệu chuẩn thành `ComponentReport` và truyền vào `reportRender` của Core.
   - Thêm cờ `if (process.env.NODE_ENV !== 'production')` bao bọc toàn bộ code để đảm bảo Zero-overhead khi build prod.

4. **Refactor Logger**
   - Tách logic `console.log` thành một module riêng (ví dụ `ConsoleReporter`) chuyên subscribe vào các event của Core và in ra màn hình. Mặc định sẽ bật reporter này.
