# why-render – Research Topics & Technical Notes

## 1. React Profiler

**React Profiler** là API dùng để đo **performance của component render** trong React.

Nó cho phép đo:

- component render bao lâu
- component render bao nhiêu lần
- render xảy ra khi nào (mount/update)
- render chain trong tree

### Example

```jsx
import { Profiler } from "react";

function onRender(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) {
  console.log({
    component: id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });
}

<Profiler id="App" onRender={onRender}>
  <App />
</Profiler>;
```

### Profiler Metrics

| Metric         | Meaning                       |
| -------------- | ----------------------------- |
| id             | component name                |
| phase          | mount / update                |
| actualDuration | thời gian render thực tế      |
| baseDuration   | render time nếu không có memo |
| startTime      | render start                  |
| commitTime     | DOM commit time               |

---

# 2. Component Render Measurement Metrics

Đây là các metrics cần thiết để đo performance của UI rendering.

## Render Metrics

| Metric           | Meaning                        |
| ---------------- | ------------------------------ |
| render count     | component render bao nhiêu lần |
| render duration  | thời gian render               |
| render reason    | lý do render                   |
| render frequency | tần suất render                |
| render depth     | độ sâu trong component tree    |

---

## Change Metrics

| Metric       | Meaning          |
| ------------ | ---------------- |
| props diff   | props thay đổi   |
| state diff   | state thay đổi   |
| context diff | context thay đổi |

---

## Performance Metrics

| Metric         | Meaning                            |
| -------------- | ---------------------------------- |
| slow render    | render vượt threshold              |
| wasted render  | render nhưng output không đổi      |
| cascade render | parent render kéo theo nhiều child |

---

## Timeline Metrics

| Metric       | Meaning                     |
| ------------ | --------------------------- |
| render order | thứ tự render               |
| render chain | parent → child relationship |
| render batch | group render                |

---

# 3. tsup Library Build & Adapter Architecture

tsup là bundler thường dùng để build TypeScript libraries.

## Project Structure

```
src
 ├ core
 │   └ index.ts
 │
 ├ adapter
 │   ├ react
 │   │   └ index.ts
 │   └ vue
 │       └ index.ts
```

---

## tsup config

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "react/index": "src/adapter/react/index.ts",
    "vue/index": "src/adapter/vue/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
```

---

## Build Output

```
dist
 ├ core
 │   └ index.js
 │
 ├ react
 │   └ index.js
 │
 └ vue
     └ index.js
```

---

## package.json exports

```json
{
  "name": "why-render",
  "exports": {
    ".": "./dist/core/index.js",
    "./react": "./dist/react/index.js",
    "./vue": "./dist/vue/index.js"
  }
}
```

---

## Usage

React adapter

```javascript
import { trackRender } from "why-render/react";
```

Vue adapter

```javascript
import { trackRender } from "why-render/vue";
```

---

# 4. Library Architecture (Recommended)

```
why-render
 ├ core
 │   ├ render-tracker
 │   ├ diff-engine
 │   ├ metrics
 │   ├ timeline
 │
 ├ adapter
 │   ├ react
 │   ├ vue
 │
 ├ visualization
 │   ├ tree
 │   ├ timeline
 │
 └ devtools
```

---

# 5. Core Topics to Research

## JavaScript Runtime

- event loop
- microtask vs macrotask
- performance.now()
- WeakMap
- Proxy
- MutationObserver

---

## React Internals

- fiber architecture
- reconciliation
- render phase
- commit phase
- Profiler API
- hooks lifecycle

---

## Vue Internals

- reactivity system
- dependency tracking
- effect scheduler
- component lifecycle
- virtual DOM diff

---

## Performance Measurement

- performance API
- requestIdleCallback
- frame timing
- flamegraphs

---

## Diff Algorithms

- shallow compare
- deep compare
- object diff
- structural sharing

---

## Tree Algorithms

- tree traversal
- parent-child tracking
- dependency graph
- render tree building

---

## DevTools Architecture

Browser devtools hoạt động theo mô hình:

```
app
 ↓
content script
 ↓
background
 ↓
devtools panel
```

---

## Chrome Extension Topics

- manifest v3
- content script
- background service worker
- devtools panel
- message passing
- runtime communication

---

## Visualization

- render tree visualization
- timeline visualization
- flame charts
- performance heatmaps

---

# 6. Advanced Topics (v6–v7)

## Instrumentation

Hook vào runtime để track behavior của component.

---

## Telemetry

Collect metrics từ production:

- render frequency
- slow components
- UI performance

---

## Devtools Communication

```
application
 ↓
content script
 ↓
background worker
 ↓
devtools panel
```
