# Vibe Coding Roadmap & Plan

## Phase 1: Core Refactoring & Robustness (Foundation)
**Mục tiêu:** Xây dựng core vững chắc, không memory leak, kiến trúc mở.

1. **Sửa lỗi & Tối ưu:**
   - Fix typo (ví dụ `classfiy` -> `classify` trong `diff.ts`).
   - Sửa lỗi Memory Leak: `componentStats` (Map) đang lưu trữ vô hạn. Cần implement cơ chế dọn rác (Garbage Collection), tự xoá log sau `n` phút hoặc giới hạn số lượng record.
2. **Kiến trúc Event-Driven (Pub/Sub):**
   - Không gọi trực tiếp `logWarning`, `console.log` bên trong core.
   - Core chỉ làm nhiệm vụ tính toán và `emit('render', data)`.
   - Tạo các "Reporters" (ConsoleReporter, UIReporter) lắng nghe event và hiển thị.
3. **Zero-overhead trong Production:**
   - Đảm bảo khi `process.env.NODE_ENV === 'production'`, toàn bộ lib trả về no-op (không chạy code), file size build ra cực nhỏ.

## Phase 2: Deep Detection (Tracking thông minh hơn)
**Mục tiêu:** Detect không chỉ Props mà còn State, Context, Hooks.

1. **React Adapter:**
   - Hiện tại `useWhyRender` chỉ check được Props. Cần nghiên cứu cách hook vào React dispatcher hoặc sử dụng Monkey Patching `React.createElement` (giống why-did-you-render) để track toàn bộ State/Context.
   - Track chính xác Hooks thay đổi (Hook 1, Hook 2,...).
2. **Vue Adapter:**
   - Sử dụng `onRenderTracked` và `onRenderTriggered` (API có sẵn của Vue 3) thay vì snapshot manual để có performance và độ chính xác tuyệt đối.

## Phase 3: The "Vibe" UI (Heatmap & DevTools)
**Mục tiêu:** Nhìn vào là thấy "xịn", không chỉ đọc text console.

1. **Floating DevTools:**
   - Tích hợp một UI nhỏ góc màn hình (như React Query DevTools / Vue Query DevTools).
   - Hiển thị danh sách các component bị wasted render theo thứ tự tệ nhất.
2. **Heatmap Overlay:**
   - Khi bật chế độ heatmap, chèn thẻ `div` bọc ngoài các component. Component render nhiều sẽ nháy viền màu đỏ/cam/vàng (như tính năng Paint Flashing của Chrome).

## Phase 4: Đóng gói & Phân phối
1. Cấu hình `tsup` tạo ra các build riêng cho React và Vue để tree-shaking triệt để.
2. Viết Unit Tests coverage > 90% (dùng Vitest/Jest).
