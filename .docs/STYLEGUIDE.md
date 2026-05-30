# STYLEGUIDE

*Hướng dẫn tiêu chuẩn code, cách format, tổ chức code. Mọi đoạn code sinh ra phải chiếu theo file này.*

## 1. TypeScript & Cấu trúc Code
- **Bắt buộc dùng TypeScript chặt chẽ**: Không sử dụng kiểu `any`. Cố gắng define interfaces/types rõ ràng cho mọi input/output. Dùng `unknown` thay cho `any` nếu chưa xác định được kiểu.
- **Pure Functions**: Mọi logic cốt lõi (ví dụ diff, thuật toán tính toán) phải là Pure Functions, không mutate variables bên ngoài, return new state.
- **Tên biến & Hàm**:
  - Biến và hàm dùng `camelCase` (ví dụ `checkRenderThresholds`).
  - React/Vue component dùng `PascalCase` (ví dụ `WhyRenderDevTools`).
  - Constants dùng `UPPER_SNAKE_CASE`.

## 2. Smart Container vs Dumb UI
Trong các tính năng liên quan đến giao diện (DevTools, UI):
- **Smart Container**: Quản lý state, lắng nghe event từ Core, fetch data. Tên file thường có hậu tố hoặc rõ ràng mục đích (vd: `DevToolsContainer.tsx`).
- **Dumb UI**: Chỉ nhận data qua `props` và render giao diện. KHÔNG ĐƯỢC chứa logic tính toán phức tạp. Tên file mô tả component (vd: `HeatmapOverlay.tsx`, `RenderCard.tsx`).

## 3. Styling
- **TailwindCSS**: Bắt buộc sử dụng TailwindCSS cho UI. 
- Tránh viết CSS thuần.
- Giao diện phải mang tính "Vibe": Hiện đại, bóng bẩy (glassmorphism), sử dụng các màu sắc có ý nghĩa UX rõ ràng (Xanh = tốt, Vàng = cảnh báo, Đỏ = chậm/waste).

## 4. Tách biệt Tính Năng (Feature-based)
- Trong thư mục `.docs/idea/`, `.docs/plan/`, `.docs/design/`, mỗi tính năng phải được lưu trữ trong MỘT FILE RIÊNG BIỆT (vd: `plan/heatmap_feature.md`). KHÔNG ĐƯỢC dồn chung tất cả vào 1 file.
