# Kế hoạch Phase 3: The "Vibe" UI (Floating DevTools & Heatmap)

## 🎯 Mục tiêu
Xây dựng giao diện trực quan cho thư viện `Why-render`. Thay vì chỉ hiển thị trong Console (khô khan), chúng ta sẽ mang đến trải nghiệm "Wow" cho developer với một Floating UI lơ lửng góc màn hình và hiệu ứng Heatmap viền (Paint Flashing) ngay trên DOM.

## 📦 Các module cần phát triển

### 1. Hệ thống Heatmap (Paint Flashing)
- **Cơ chế**: Khi một component bị "Wasted Render" hoặc "Burst Render", bọc nó bằng một hiệu ứng viền chớp tắt.
- **Tính năng**: 
  - Màu sắc cảnh báo (Xanh = Tốt, Vàng = Wasted, Đỏ = Cascade / Xấu).
  - Tự động biến mất (fade out) sau 500ms.
  - Phải tuyệt đối an toàn, không làm hỏng cấu trúc DOM thật của ứng dụng (sử dụng overlay tuyệt đối hoặc SVG).

### 2. Floating DevTools (Giao diện chính)
- **Kiến trúc**:
  - Giao diện dạng Draggable (có thể kéo thả) góc dưới màn hình.
  - Tích hợp nút Toggle thu gọn (Minimize) giống React Query DevTools.
- **Thành phần**:
  - **Dashboard**: Hiển thị tổng quan hệ mét (Total Wasted Time, Top Component gây lãng phí nhất tính theo `ImpactScore`).
  - **Live Feed (Event Stream)**: Hiển thị các luồng render theo thời gian thực (giống terminal log nhưng đẹp hơn).
  - **Component Details**: Click vào một component để xem chi tiết Props/State/Hooks nào vừa thay đổi (`classify`).

### 3. Tích hợp Framework (React/Vue)
- **React**: `<WhyRenderDevTools />` component (Portal ra `document.body`).
- **Vue**: `<WhyRenderDevTools />` component.

## 🛠 Kỹ thuật & Công nghệ
- **Styling**: `TailwindCSS` (Cấu hình nhúng CSS hoặc style động để không conflict với app của user).
- **Animation**: CSS Transition / Keyframes thuần hoặc Framer Motion (nếu bắt buộc dùng React). Ưu tiên Vanilla CSS để nhẹ thư viện.
- **Giao tiếp**: Lắng nghe dữ liệu từ `coreEmitter` (đã xây dựng ở Phase 1).

## 🚀 Các bước thực hiện (Checklist)
- [ ] B1: Thiết lập thư mục `src/ui/` và cấu hình build CSS (Shadow DOM hoặc Scoped CSS để không đụng chạm CSS của User).
- [ ] B2: Code hiệu ứng Overlay Heatmap bằng DOM injection đơn giản.
- [ ] B3: Xây dựng `<DevToolsContainer />` (Smart Component) lắng nghe `coreEmitter`.
- [ ] B4: Xây dựng các `<DumbUI />` (Dashboard, LiveFeed, HeatmapToggle) tuân thủ skill `code-ui.md`.
- [ ] B5: Tích hợp DevTools component vào `src/adapter/react` và `src/adapter/vue`.
