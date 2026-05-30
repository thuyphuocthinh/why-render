# Chiến lược Profiling thống nhất: React + Vue 3

Tài liệu này định nghĩa kiến trúc tổng thể của **Why-render** với mô hình **Core + Adapters**, hỗ trợ song song cả React và Vue 3.

---

## 1. Tổng quan Kiến trúc

```
+----------------------------------+
|        User Application          |
+----------------------------------+
|  React Adapter  |   Vue Adapter  |
+----------------------------------+
|         Core Profiler            |
|   (core/profiler.ts, types.ts)   |
+----------------------------------+
```

- **Core:** Là framework-agnostic (không phụ thuộc framework).
- **Adapters:** Là các module nhỏ, tách biệt, có nhiệm vụ thu thập dữ liệu thô từ từng framework và chuyển đổi về định dạng chung mà Core yêu cầu.

---

## 2. Core Interface (Framework-Agnostic)

Đây là "hợp đồng" (contract) mà mọi Adapter bắt buộc phải tuân thủ:

```ts
// src/core/types.ts

export interface ComponentReport {
  /** Tên component */
  componentName: string;
  /** Framework phát sinh report này */
  framework: "react" | "vue";
  /** Thời gian render (ms) */
  renderTimeMs: number;
  /** Lý do re-render */
  reason: RenderReason;
  /** Timestamp */
  timestamp: number;
}

export type RenderReason =
  | { type: "props"; changedProps: string[] }
  | { type: "state"; changedKey: string; oldValue: unknown; newValue: unknown }
  | { type: "hooks" }
  | { type: "parent" }
  | { type: "unknown" };
```

Core Profiler nhận `ComponentReport` và thực hiện các kiểm tra (ngưỡng chậm, tần suất):

```ts
// src/core/profiler.ts
export function reportRender(report: ComponentReport): void {
  checkRenderThresholds(report.componentName, report.renderTimeMs);
  trackRenderFrequency(report.componentName);
  // Có thể log, emit event, gửi lên dashboard, v.v.
}
```

---

## 3. React Adapter

React Adapter sử dụng Profiler API của React và kỹ thuật truy cập Fiber nội bộ để phân tích.

### Phương pháp 1: Dùng React.Profiler (Đơn giản)

```tsx
// src/adapters/react/ReactProfilerAdapter.tsx
import React from "react";
import { reportRender } from "../../core/profiler";

export function withProfiler<T extends object>(
  WrappedComponent: React.ComponentType<T>,
) {
  const name = WrappedComponent.displayName || WrappedComponent.name;

  return function ProfiledComponent(props: T) {
    return (
      <React.Profiler
        id={name}
        onRender={(_id, phase, actualDuration) => {
          reportRender({
            componentName: name,
            framework: "react",
            renderTimeMs: actualDuration,
            reason: { type: phase === "mount" ? "unknown" : "unknown" },
            timestamp: Date.now(),
          });
        }}
      >
        <WrappedComponent {...props} />
      </React.Profiler>
    );
  };
}
```

---

## 4. Vue Adapter

Vue Adapter tận dụng các Lifecycle Hooks và hệ thống Debug của Vue 3 để thu thập dữ liệu cực kỳ chi tiết.

```ts
// src/adapters/vue/useWhyRender.ts
import {
  onBeforeUpdate,
  onUpdated,
  onRenderTriggered,
  getCurrentInstance,
} from "vue";
import { reportRender } from "../../core/profiler";
import type { ComponentReport } from "../../core/types";

export function useWhyRender() {
  const instance = getCurrentInstance();
  const componentName =
    instance?.type?.__name ?? instance?.type?.name ?? "Unknown";
  let startTime = 0;
  let triggerReason: ComponentReport["reason"] = { type: "unknown" };

  // Bắt lý do re-render từ hệ thống Reactivity
  onRenderTriggered((e) => {
    triggerReason = {
      type: "state",
      changedKey: String(e.key),
      oldValue: e.oldValue,
      newValue: e.newValue,
    };
  });

  onBeforeUpdate(() => {
    startTime = performance.now();
  });

  onUpdated(() => {
    const duration = performance.now() - startTime;
    reportRender({
      componentName,
      framework: "vue",
      renderTimeMs: duration,
      reason: triggerReason,
      timestamp: Date.now(),
    });
    // Reset lý do cho lần render tiếp theo
    triggerReason = { type: "unknown" };
  });
}
```

---

## 5. So sánh các Adapter

| Đặc điểm              | React Adapter            | Vue Adapter               |
| :-------------------- | :----------------------- | :------------------------ |
| **Nguồn dữ liệu**     | `React.Profiler` / Fiber | `onRenderTriggered`       |
| **Lấy tên component** | `displayName` / `name`   | `instance.type.__name`    |
| **Lý do re-render**   | So sánh props thủ công   | `DebuggerEvent` (Tự động) |
| **Độ chính xác**      | Trung bình               | Cao                       |
| **Chỉ chạy ở Dev?**   | Không                    | Có (`onRenderTriggered`)  |

---

## 6. Cấu trúc thư mục đề xuất

```text
src/
  core/
    types.ts          # Định nghĩa ComponentReport, RenderReason
    profiler.ts       # Logic checkThresholds, trackFrequency
    logger.ts         # Ghi log ra console/file
    config.ts         # Cấu hình ngưỡng cảnh báo
  adapters/
    react/
      withProfiler.tsx  # HOC wrapper cho React
      useWhyRender.ts   # Hook cho React
    vue/
      useWhyRender.ts   # Composable cho Vue
  index.ts              # Entry point chính, xuất bản public API
```

---

## Kết luận

Mô hình **Core + Adapters** mang lại 3 lợi ích lớn:

1.  **Tái sử dụng:** Logic cốt lõi (xử lý ngưỡng chậm, tần suất) chỉ cần viết một lần.
2.  **Độc lập:** Mỗi Adapter tập trung duy nhất vào việc "dịch" ngôn ngữ của framework sang chuẩn `ComponentReport`.
3.  **Khả năng mở rộng:** Dễ dàng hỗ trợ thêm các framework khác (Svelte, Solid, Angular) trong tương lai chỉ bằng cách thêm adapter mới mà không cần sửa code ở Core.

Bạn có muốn mình đi sâu vào chi tiết cách triển khai **`checkRenderThresholds`** ở phần Core không?
