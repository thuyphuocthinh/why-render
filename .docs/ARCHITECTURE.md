# KIẾN TRÚC DỰ ÁN (ARCHITECTURE)

*Lưu trữ cấu trúc, luồng dữ liệu, và các quyết định kiến trúc cốt lõi. Mọi code mới phải tuân theo tài liệu này.*

## 1. Tổng Quan Kiến Trúc (Core + Adapters)
Dự án sử dụng mô hình **Framework-Agnostic Core** kết hợp với **Framework-Specific Adapters**.
- `src/core/`: Nơi chứa bộ não (Engine). Xử lý toán học, tính toán threshold, lưu trữ memory và phát Event (Pub/Sub). KHÔNG phụ thuộc vào React hay Vue. KHÔNG chứa side effect (như console.log).
- `src/adapter/`: Nơi chứa các bindings (React, Vue). Chịu trách nhiệm hook vào lifecycle của framework, thu thập raw data và format về chuẩn chung của Core.

## 2. Hợp Đồng Dữ Liệu (The Contract)
Tất cả các Adapter khi gọi Core phải truyền dữ liệu dưới dạng `ComponentReport`:

```typescript
export interface ComponentReport {
  componentName: string;
  framework: "react" | "vue";
  renderTimeMs: number;
  reason: RenderReason;
  timestamp: number;
}
```

## 3. Luồng Dữ Liệu (Data Flow)
1. **Adapter Phase**: React/Vue Adapter hook vào framework lifecycle.
2. **Normalize Phase**: Adapter gom dữ liệu (tên, thời gian, props thay đổi) thành `ComponentReport`.
3. **Core Phase**: Gọi `reportRender(report)`. Core sẽ tính toán Wasted Render, Burst Render, lưu vào bộ nhớ ngắn hạn.
4. **Emit Phase**: Core `emit` một Event.
5. **Reporter Phase**: `ConsoleReporter` hoặc `UIReporter` (DevTools) bắt Event và hiển thị ra cho user.

## 4. Kiến trúc Giao diện (The "Vibe" UI)
- Sử dụng **Shadow DOM** để tiêm UI vào trang của user mà không bị xung đột CSS.
- UI được chia theo kiến trúc **Smart Container** (lắng nghe Core Events, xử lý state) và **Dumb UI** (các component hiển thị bằng TailwindCSS thuần tuý).
