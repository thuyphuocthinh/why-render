# NHẬT KÝ TÍNH NĂNG (FEATURE_DONE)

*Vai trò: Bộ nhớ RAM. Sau khi code xong một tính năng, AI phải tự động log lại vào đây để duy trì bộ nhớ ngắn/trung hạn.*

## Các tính năng Vibe Coding (Đã hoàn thành)
- [x] **Phase 1: Core Refactoring & Robustness**
  - Chuyển đổi thành kiến trúc Event-Driven (Pub/Sub) sử dụng `coreEmitter`.
  - Định nghĩa chuẩn hợp đồng `ComponentReport` và `RenderReason`.
  - Ngăn ngừa Memory Leak: Giới hạn lưu trữ tối đa `MAX_RECORDS_PER_COMPONENT` = 50 cho mỗi component.
  - Phân tách Logger thành `ConsoleReporter`.
  - Tối ưu Zero-overhead: Bọc toàn bộ các hook/adapter bằng `process.env.NODE_ENV !== 'production'`.

- [x] **Phase 2: Deep Diagnostic (Bắt bệnh React/Vue)**
  - Tích hợp `baseDurationMs` từ React Profiler API.
  - Tích hợp `onRenderTriggered` vào Vue Adapter để bắt Dep thay đổi.
  - Math Metrics: Tính toán $\eta$ (Memoization Efficiency) và $\rho$ (Waste Ratio).
  - Tích hợp logic `classify` hiển thị loại tham chiếu bị đổi ([VALUE_CHANGE], [UNSTABLE_REFERENCE]).

- [x] **Phase 3: The "Vibe" UI (Floating DevTools & Heatmap)**
  - Cấu hình Vanilla CSS injection tự động (không đụng chạm Tailwind/CSS của user nhưng vẫn giữ phong cách Glassmorphism xịn xò).
  - Xây dựng hệ thống Heatmap (Paint Flashing) overlay lên DOM qua `src/ui/heatmap.ts`. (Đã hook thẳng vào Vue).
  - Xây dựng `<WhyRenderDevTools />` (React Component) đóng vai trò là Floating DevTools có thể kéo thả (draggable), minimize/maximize, hiển thị tổng quan điểm Wasted Time và luồng Live Feed Render Report cực kỳ "Vibe".
