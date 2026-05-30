# Why Render Profiler (v0.1) — Feature Specification

## Overview

**Why Render Profiler** là một thư viện nhỏ giúp developer hiểu:

- Component **re-render khi nào**
- **Tại sao** component re-render
- **Render mất bao lâu**

Thư viện hướng tới việc debug UI performance trong các framework như:

- React
- Vue.js

Version **v0.1 (MVP)** chỉ tập trung vào **3 feature quan trọng nhất**.

---

# Goals của Version 0.1

Mục tiêu của version đầu:

1. Phát hiện component render
2. Xác định **reason của render**
3. Đo **render time**

Không xây dựng UI phức tạp.
Output chủ yếu qua **console logging**.

---

# Feature 1 — Render Detection

## Mục tiêu

Phát hiện mỗi lần component render hoặc update.

Library phải có khả năng:

- Hook vào lifecycle của framework
- Trigger profiler logic mỗi lần render xảy ra

---

## Implementation Strategy

### React

Hook vào lifecycle bằng:

```js
useRef();
useEffect();
```

Flow:

1. Component render
2. Capture props và state
3. Compare với previous values
4. Log render info

---

### Vue

Hook vào lifecycle:

```js
onMounted();
onUpdated();
```

Flow:

1. Component mount
2. Component update
3. Capture reactive state snapshot
4. Compare với previous snapshot

---

## Output Example

```text
[Render] UserCard
time: 2.3ms
```

---

# Feature 2 — Render Reason Detection

## Mục tiêu

Xác định **tại sao component re-render**.

Library cần detect:

- props change
- state change
- reactive change

---

## Implementation Strategy

Thực hiện **shallow diff** giữa:

```
previousProps
nextProps
```

Algorithm đơn giản:

```js
function diffProps(prev, next) {
  const changes = [];

  for (const key in next) {
    if (prev[key] !== next[key]) {
      changes.push(key);
    }
  }

  return changes;
}
```

---

## Output Example

```text
[Render] UserCard
reason:
props.user changed
```

---

## Detailed Diff Example

```text
[Render] ProductItem

reason:
props.price changed

before: 29
after: 39
```

---

# Feature 3 — Render Time Measurement

## Mục tiêu

Đo thời gian render của component.

---

## Implementation

Sử dụng:

```js
performance.now();
```

Hoặc:

```js
performance.mark();
performance.measure();
```

API thuộc:

Performance API

---

## Measurement Flow

```
start timer
component render
stop timer
calculate duration
```

---

## Output Example

```text
[Render] ProductList
time: 5.2ms
```

---

# Feature 4 — Slow Component Detection

## Mục tiêu

Highlight component render chậm.

---

## Default Threshold

```
> 10ms = warning
> 20ms = slow
```

---

## Output Example

```text
⚠ Slow render detected

Component: ProductList
render time: 18.4ms
```

---

# Feature 5 — Render Frequency Tracking

## Mục tiêu

Detect component render quá nhiều lần.

---

## Strategy

Track render count trong window thời gian.

Example:

```
renderCount
timestamp
```

---

## Detection Logic

Ví dụ rule:

```
> 20 renders trong 5 seconds
```

→ trigger warning.

---

## Output Example

```text
⚠ High render frequency

Component: ChatMessage
renders: 42
duration: 5 seconds
```

---

# Logging Format

Console output cần rõ ràng.

Example:

```text
⚡ Render: UserList

reason:
props.users changed

time:
4.2ms
```

---

# API Design (v0.1)

## React

```ts
import { trackRender } from "why-render";

trackRender(App);
```

---

## Vue

```ts
import { trackVueRender } from "why-render";

trackVueRender();
```

---

# Project Structure

```
why-render/

core/
  diff.js
  profiler.js
  logger.js

react/
  trackRender.js

vue/
  trackVueRender.js
```

---

# Scope của v0.1

Version đầu **không bao gồm**:

- DevTools UI
- Chrome extension
- Render tree visualization
- Network analysis

Các feature này có thể phát triển ở **v0.2+**.

---

# Estimated Size

```
core logic: ~200 lines
react adapter: ~80 lines
vue adapter: ~80 lines
```

Total:

```
~350 lines
```

---

# Success Criteria

Version 0.1 được xem là thành công nếu:

- Detect render correctly
- Show render reason
- Measure render time
- Output readable console logs

---

# Future Features (v0.2+)

Possible improvements:

- Render tree visualization
- DevTools panel
- Chrome extension
- Timeline profiler
- Component heatmap

---

# Summary

Version đầu nên tập trung vào **3 vấn đề quan trọng nhất của UI debugging**:

1. **When did it render**
2. **Why did it render**
3. **How long did it take**

Giải quyết tốt 3 câu hỏi này đã đủ tạo ra một tool hữu ích cho developer.
