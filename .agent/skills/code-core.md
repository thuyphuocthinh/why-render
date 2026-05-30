# SKILL: Phát triển Core & Adapter (Architecture Pattern)

Khi được yêu cầu viết tính năng mới hoặc thêm framework mới cho thư viện, AI cần tuân thủ Design Pattern "Core + Adapter" sau đây:

## 1. Giao Tiếp Qua Hợp Đồng (Contract)
Core và Adapter không gọi trực tiếp các hàm logic của nhau. Mọi adapter PHẢI map dữ liệu framework-specific về một chuẩn chung gọi là `ComponentReport` và gửi cho Core.

```typescript
export interface ComponentReport {
  componentName: string;
  framework: "react" | "vue";
  renderTimeMs: number;
  reason: RenderReason;
  timestamp: number;
}
```

## 2. Trách nhiệm của Adapter (VD: React, Vue)
- Chỉ hook vào lifecycle của framework (vd: `useEffect`, `onUpdated`, `React.Profiler`, `onRenderTriggered`).
- Thu thập raw data (thời gian render, props cũ/mới).
- Format data thành `ComponentReport` và gọi `reportRender(report)`.
- **Tuyệt đối không** chứa logic phân tích (toán học, threshold, burst) bên trong Adapter.

## 3. Trách nhiệm của Core
- Nơi duy nhất chứa các file: `profiler.ts`, `waste.ts`, `math.ts`.
- Nhận `ComponentReport` từ mọi Adapter.
- Xử lý tính toán (ví dụ: `checkRenderThresholds`, `countRenders`).
- Emit Event cho Logger hoặc DevTools UI (không console.log trực tiếp).
