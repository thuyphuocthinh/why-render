# Cơ sở Toán học & Metrics đánh giá cho Why-render

Tài liệu này xây dựng nền tảng **toán học chặt chẽ** cho thư viện why-render, từ các công thức cơ bản đến các chỉ số tổng hợp phức tạp dùng để phát hiện, phân loại và định lượng các lần render không cần thiết.

---

## 1. Mô hình hóa Render — Các khái niệm nền tảng

### 1.1. Hàm Render thuần khiết (Pure Render Function)

Một component lý tưởng hoạt động như một **hàm thuần khiết** (pure function):

```
V = R(props, state, context)
```

| Ký hiệu   | Ý nghĩa                                       |
| :-------- | :-------------------------------------------- |
| `R`       | Hàm render của component                      |
| `props`   | Input từ component cha                        |
| `state`   | Trạng thái nội bộ                             |
| `context` | Giá trị từ Context/Provider                   |
| `V`       | Virtual DOM output (cấu trúc mô tả giao diện) |

**Tính chất:** Nếu input không thay đổi về mặt **giá trị** (value equality), output `V` phải luôn giống nhau:

```
∀ (p₁, s₁, c₁), (p₂, s₂, c₂):
  deepEqual(p₁, p₂) ∧ deepEqual(s₁, s₂) ∧ deepEqual(c₁, c₂)
  ⟹ R(p₁, s₁, c₁) ≡ R(p₂, s₂, c₂)
```

### 1.2. Phân biệt Reference Equality vs Value Equality

Đây là **gốc rễ** của hầu hết các lỗi render thừa trong cả React và Vue:

```
referenceEqual(a, b) ⟺ (a === b)                   // So sánh con trỏ bộ nhớ
valueEqual(a, b)     ⟺ deepEqual(a, b)              // So sánh giá trị thực tế
shallowEqual(a, b)   ⟺ ∀ key ∈ keys(a) ∪ keys(b):
                          a[key] === b[key]           // So sánh tham chiếu tầng 1
```

**Điểm mấu chốt:**

React sử dụng `shallowEqual` (qua `Object.is`) để quyết định re-render. Khi:

```
shallowEqual(prevProps, nextProps) = false
  nhưng valueEqual(prevProps, nextProps) = true
```

⟹ Đây chính là **Unnecessary Render** (render thừa).

---

## 2. Định nghĩa chính xác: Unnecessary Render

### 2.1. Định nghĩa hình thức

Cho một lần render thứ `i` của component `C`, gọi:

- `I_i = (props_i, state_i, context_i)` — Input tại lần render thứ `i`
- `V_i = R(I_i)` — Virtual DOM output tại lần render thứ `i`

**Render thứ `i` là unnecessary khi thỏa mãn một trong hai điều kiện:**

```
Điều kiện 1 (Input-based):
  valueEqual(I_i, I_{i-1}) = true
  ∧ referenceEqual(I_i, I_{i-1}) = false

Điều kiện 2 (Output-based):
  V_i ≡ V_{i-1}    (Virtual DOM output hoàn toàn giống nhau)
```

### 2.2. Phân loại nguyên nhân

Từ định nghĩa trên, ta phân loại được 4 nguyên nhân chính:

| Loại                   | Điều kiện phát hiện                                                     | Ví dụ                                       |
| :--------------------- | :---------------------------------------------------------------------- | :------------------------------------------ |
| **Unstable Reference** | `props[k] !== prevProps[k]` nhưng `deepEqual(props[k], prevProps[k])`   | Inline object `{ a: 1 }` tạo mới mỗi render |
| **Unstable Callback**  | `typeof props[k] === 'function'` và `props[k] !== prevProps[k]`         | Arrow function `() => {}` inline            |
| **Context Spillover**  | Context value thay đổi reference nhưng component không dùng phần đã đổi | Provider re-render toàn bộ consumer         |
| **Parent Cascade**     | Component cha render → kéo con render dù con không nhận input mới       | Thiếu `React.memo` hoặc `v-memo`            |

---

## 3. Metrics cốt lõi (Core Metrics)

### 3.1. Nhóm Thời gian (Duration Metrics)

#### a) Actual Duration — `T_actual`

Thời gian thực tế để hoàn thành render phase:

```
T_actual = t_commitStart - t_renderStart
```

Đo bằng `performance.now()` với độ phân giải microsecond.

#### b) Base Duration — `T_base`

Thời gian render ước tính **không có bất kỳ memoization nào** (worst case):

```
T_base = Σ (thời gian render của mỗi node trong subtree, bỏ qua memo)
```

Giá trị này do React Profiler API cung cấp trực tiếp.

#### c) Memoization Efficiency Ratio — `η` (eta)

Đo lường **hiệu quả tối ưu hóa** memo:

```
η = 1 - (T_actual / T_base)

Với:
  η ∈ [0, 1]
  η = 0  → memo không có tác dụng (render toàn bộ)
  η = 1  → memo hoàn hảo (không render gì thêm)
  η < 0  → memo overhead > benefit (xảy ra khi cây nhỏ)
```

**Ngưỡng đánh giá:**

| `η` value       | Đánh giá                       |
| :-------------- | :----------------------------- |
| `η ≥ 0.7`       | ✅ Memoization hiệu quả tốt    |
| `0.3 ≤ η < 0.7` | ⚠️ Cần xem xét thêm            |
| `η < 0.3`       | 🔴 Hầu như không có tối ưu hóa |

#### d) Commit Delay — `T_delay`

Thời gian chờ từ khi render xong đến khi commit lên DOM:

```
T_delay = t_commit - (t_renderStart + T_actual)
```

`T_delay` lớn chỉ ra **main thread bị nghẽn** bởi các tác vụ khác.

### 3.2. Nhóm Tần suất (Frequency Metrics)

#### a) Render Count — `N(C, Δt)`

Số lần render của component `C` trong khoảng thời gian `Δt`:

```
N(C, Δt) = |{ r_i : r_i.component = C ∧ r_i.timestamp ∈ [t, t + Δt] }|
```

#### b) Render Frequency — `f(C)`

Tần suất render trung bình (renders/second):

```
f(C) = N(C, Δt) / Δt
```

#### c) Render Burst Detection

Phát hiện "cụm render" – nhiều render dồn dập trong thời gian ngắn:

```
Burst detected khi:
  ∃ khoảng [t, t + w] sao cho N(C, w) > B_threshold

Với:
  w = burst window (mặc định 1000ms)
  B_threshold = ngưỡng burst (mặc định 10 renders)
```

**Thuật toán Sliding Window:**

```
function detectBursts(timestamps[], window, threshold):
  bursts = []
  for i = 0 to len(timestamps) - 1:
    j = i
    while j < len(timestamps) AND timestamps[j] - timestamps[i] < window:
      j++
    if (j - i) > threshold:
      bursts.push({ start: timestamps[i], count: j - i })
      i = j  // skip past this burst
  return bursts
```

### 3.3. Nhóm Phát hiện Render thừa (Waste Detection Metrics)

#### a) Wasted Render — `W(C)`

Một render được đánh dấu là **wasted** khi:

```
W(r_i) = {
  1  nếu propsDiff(r_i) = ∅ ∧ stateDiff(r_i) = ∅ ∧ contextDiff(r_i) = ∅
  1  nếu ∀ d ∈ propsDiff(r_i): valueEqual(d.prev, d.next) = true
  0  otherwise
}
```

#### b) Waste Ratio — `ρ` (rho)

Tỉ lệ render lãng phí trên tổng render:

```
ρ(C) = Σ W(r_i) / N(C, Δt)

Với:
  ρ ∈ [0, 1]
  ρ = 0     → không có render thừa
  ρ > 0.5   → hơn nửa số render là lãng phí → cần tối ưu ngay
```

#### c) Wasted Time — `T_wasted`

Tổng thời gian CPU bị lãng phí cho render thừa:

```
T_wasted(C) = Σ { T_actual(r_i) : W(r_i) = 1 }

T_wasted_total = Σ T_wasted(C) cho mọi component C trong cây
```

**Đây là metric quan trọng nhất** để chứng minh giá trị tối ưu hóa cho stakeholders.

---

## 4. Metrics cây component (Tree Metrics)

### 4.1. Render Depth — `d(C)`

Vị trí của component trong cây, tính từ root:

```
d(C) = {
  0                   nếu C là root
  d(parent(C)) + 1    otherwise
}
```

Component ở tầng sâu hơn thường có **render cost tích lũy** cao hơn nếu bị cascade.

### 4.2. Cascade Render Detection

Hiệu ứng "thác đổ" — parent render kéo theo hàng loạt con render lãng phí:

```
Cascade(P) = { C ∈ children(P) :
  W(r_C) = 1 ∧ |t_render(C) - t_render(P)| < ε }

Với ε = ngưỡng thời gian tương quan (mặc định 50ms)
```

#### Cascade Cost — Chi phí lan truyền

```
CascadeCost(P) = Σ { T_actual(C) : C ∈ Cascade(P) }
```

#### Cascade Depth — Độ sâu lan truyền

```
CascadeDepth(P) = max { d(C) - d(P) : C ∈ Cascade*(P) }

Với Cascade*(P) là bao đóng bắc cầu (transitive closure):
  Cascade*(P) = Cascade(P) ∪ ⋃{ Cascade*(C) : C ∈ Cascade(P) }
```

### 4.3. Subtree Render Cost

Chi phí render tích lũy của toàn bộ nhánh con:

```
SubtreeCost(C) = T_actual(C) + Σ { SubtreeCost(child) : child ∈ children(C) }
```

### 4.4. Impact Score — Điểm ảnh hưởng

Cho phép **xếp hạng** component nào cần tối ưu trước:

```
ImpactScore(C) = ρ(C) × T_wasted(C) × (1 + |Cascade(C)| / K)

Với K = hằng số chuẩn hóa (mặc định = 10)
```

Component có `ImpactScore` cao nhất là ứng viên **ưu tiên tối ưu hóa**.

---

## 5. Thuật toán Diff — So sánh phát hiện thay đổi

### 5.1. Shallow Diff Algorithm

Đang được implement trong `src/core/diff.ts`:

```
function shallowDiff(prev, next):
  changes = []
  allKeys = keys(prev) ∪ keys(next)

  for key in allKeys:
    if NOT Object.is(prev[key], next[key]):
      changes.push({ key, prev: prev[key], next: next[key] })

  return changes
```

**Độ phức tạp:** `O(|keys|)` — rất nhanh, phù hợp cho hot path.

### 5.2. Change Classification

Sau khi thu được danh sách `changes`, cần **phân loại** từng thay đổi:

```
classify(change):
  p = change.prev
  n = change.next

  if typeof(p) ≠ typeof(n):
    return "TYPE_CHANGE"                          // Type thay đổi hoàn toàn

  if typeof(p) = "function":
    if p.toString() === n.toString():
      return "UNSTABLE_CALLBACK"                  // Cùng logic nhưng khác reference
    else:
      return "CALLBACK_CHANGE"                    // Logic thực sự thay đổi

  if typeof(p) = "object" AND p ≠ null:
    if deepEqual(p, n):
      return "UNSTABLE_REFERENCE"                 // Object mới nhưng giá trị giống
    else:
      return "VALUE_CHANGE"                       // Object thực sự thay đổi

  return "PRIMITIVE_CHANGE"                       // Giá trị nguyên thủy thay đổi
```

### 5.3. Deep Equal với Early Exit

Để phân biệt **unstable reference** vs **value change** hiệu quả:

```
function deepEqual(a, b, maxDepth = 5, currentDepth = 0):
  // Base cases
  if Object.is(a, b): return true
  if currentDepth > maxDepth: return false         // Giới hạn độ sâu tránh vòng lặp
  if typeof(a) ≠ typeof(b): return false
  if a = null OR b = null: return false

  // Array comparison
  if isArray(a):
    if a.length ≠ b.length: return false           // Early exit nhanh
    return ∀ i ∈ [0, a.length): deepEqual(a[i], b[i], maxDepth, currentDepth + 1)

  // Object comparison
  keysA = keys(a), keysB = keys(b)
  if |keysA| ≠ |keysB|: return false               // Early exit nhanh
  return ∀ k ∈ keysA: k ∈ keysB ∧ deepEqual(a[k], b[k], maxDepth, currentDepth + 1)
```

**Chú ý:** Giới hạn `maxDepth` là cần thiết để tránh:

- Circular references
- Overhead performance trên object lớn
- Chỉ nên dùng deep compare cho chẩn đoán, KHÔNG dùng cho production render path

---

## 6. Metrics tổng hợp (Aggregated Metrics)

### 6.1. Component Health Score

Điểm "sức khỏe" tổng hợp của một component, thang 0-100:

```
HealthScore(C) = 100 - Σ penalties

Penalties:
  - WastePenalty    = min(40, ρ(C) × 40)              // Tối đa -40 điểm nếu toàn bộ render là thừa
  - SpeedPenalty    = min(30, (T_avg / T_budget) × 30) // Tối đa -30 nếu vượt frame budget
  - FreqPenalty     = min(20, (f(C) / f_max) × 20)     // Tối đa -20 nếu render quá nhiều
  - CascadePenalty  = min(10, |Cascade(C)| / 5 × 10)   // Tối đa -10 nếu gây cascade

Với:
  T_budget = 16.67ms (giữ frame rate 60fps)
  f_max = 20 renders/second
```

| Score    | Đánh giá                 |
| :------- | :----------------------- |
| `90-100` | 🟢 Xuất sắc              |
| `70-89`  | 🟡 Tốt, có thể cải thiện |
| `50-69`  | 🟠 Cần chú ý             |
| `< 50`   | 🔴 Cần tối ưu ngay       |

### 6.2. Application Render Efficiency — `E_app`

Metric tổng thể cho toàn bộ ứng dụng:

```
E_app = 1 - (T_wasted_total / T_render_total)

Với:
  T_render_total = Σ T_actual(r_i) cho mọi render r_i
  T_wasted_total = Σ { T_actual(r_i) : W(r_i) = 1 }

  E_app ∈ [0, 1]
  E_app = 1   → hoàn hảo, không có render thừa
  E_app < 0.5 → hơn nửa thời gian render bị lãng phí
```

### 6.3. Frame Budget Compliance — `FBC`

Tỉ lệ render nằm trong ngân sách frame (16.67ms cho 60fps):

```
FBC = |{ r_i : T_actual(r_i) ≤ T_budget }| / |{ r_i }|

  FBC = 1.0 → mọi render đều nằm trong budget
  FBC < 0.9 → có > 10% render gây frame drop → ảnh hưởng UX
```

---

## 7. Ngưỡng cảnh báo (Threshold System)

### 7.1. Bảng ngưỡng mặc định

| Metric                     | Threshold       | Severity   | Giải thích                    |
| :------------------------- | :-------------- | :--------- | :---------------------------- |
| `T_actual` (single render) | > 16ms          | ⚠️ Warning | Vượt frame budget 60fps       |
| `T_actual` (single render) | > 50ms          | 🔴 Error   | Có thể gây jank rõ ràng       |
| `f(C)` (frequency)         | > 4 renders/sec | ⚠️ Warning | Render quá thường xuyên       |
| `N(C, 5s)` (count/window)  | > 20            | 🔴 Error   | Render dồn dập bất thường     |
| `ρ(C)` (waste ratio)       | > 0.3           | ⚠️ Warning | 30%+ render là thừa           |
| `ρ(C)` (waste ratio)       | > 0.7           | 🔴 Error   | 70%+ render là thừa           |
| `CascadeDepth`             | > 3 levels      | ⚠️ Warning | Cascade lan quá sâu           |
| `T_wasted` (acc. wasted)   | > 100ms / 5s    | 🔴 Error   | Tích lũy lãng phí CPU đáng kể |

### 7.2. Adaptive Thresholds

Ngưỡng có thể tự điều chỉnh dựa trên bối cảnh thiết bị:

```
T_budget(device) = {
  16.67ms   nếu targetFps = 60
  8.33ms    nếu targetFps = 120 (high-refresh-rate display)
  33.33ms   nếu targetFps = 30 (low-end device)
}

// Điều chỉnh ngưỡng dựa trên hardware concurrency
adjustedThreshold = baseThreshold × (navigator.hardwareConcurrency / 4)
```

---

## 8. Ánh xạ Metrics → Fix Suggestions

### 8.1. Bảng quy tắc gợi ý

| Detection                                            | Root Cause            | React Fix                      | Vue Fix                                |
| :--------------------------------------------------- | :-------------------- | :----------------------------- | :------------------------------------- |
| `classify(change) = UNSTABLE_CALLBACK`               | Inline function       | `useCallback(fn, deps)`        | Khai báo method trong `<script setup>` |
| `classify(change) = UNSTABLE_REFERENCE`              | Inline object/array   | `useMemo(() => obj, deps)`     | `computed(() => obj)`                  |
| `W(r_i) = 1` và trigger từ parent                    | Parent cascade        | `React.memo(Component)`        | `v-memo` hoặc tách component           |
| Context thay đổi nhưng component không dùng phần đổi | Context spillover     | Tách Context / `useMemo` value | `provide` với computed                 |
| `f(C) > threshold` với nhiều state updates           | Missing batching      | Kiểm tra `flushSync` thừa      | Kiểm tra `nextTick` usage              |
| `T_actual > T_budget` AND `η < 0.3`                  | Heavy render, no memo | `React.memo` + `useMemo`       | `computed` + `v-once`                  |

### 8.2. Confidence Score cho gợi ý

Mỗi gợi ý kèm theo **điểm tin cậy** để user biết mức độ chắc chắn:

```
Confidence(suggestion) = f(matchStrength, frequency, impactEstimate)

Với:
  matchStrength ∈ [0,1]   — Mức độ khớp pattern phát hiện
  frequency ∈ [0,1]       — Tần suất xảy ra (càng nhiều càng tin cậy)
  impactEstimate ∈ [0,1]  — Ước tính cải thiện performance

Confidence = 0.5 × matchStrength + 0.3 × frequency + 0.2 × impactEstimate
```

---

## 9. Ứng dụng vào Implementation

### 9.1. Mapping với codebase hiện tại

| Công thức / Metric         | File implement                                     | Status     |
| :------------------------- | :------------------------------------------------- | :--------- |
| `T_actual`, slow detection | `src/core/profiler.ts` — `checkRenderThresholds()` | ✅ Done    |
| `N(C, Δt)`, frequency      | `src/core/profiler.ts` — `trackRenderFrequency()`  | ✅ Done    |
| Shallow Diff               | `src/core/diff.ts` — `shallowDiff()`               | ✅ Done    |
| `η` (memo efficiency)      | Chưa implement                                     | 📋 Planned |
| `ρ` (waste ratio)          | Chưa implement                                     | 📋 Planned |
| `T_wasted`                 | Chưa implement                                     | 📋 Planned |
| Change Classification      | Chưa implement                                     | 📋 Planned |
| Cascade Detection          | Chưa implement                                     | 📋 Planned |
| Health Score               | Chưa implement                                     | 📋 Planned |
| Impact Score               | Chưa implement                                     | 📋 Planned |
| Fix Suggestions            | Chưa implement                                     | 📋 Planned |

### 9.2. Thứ tự implement đề xuất

```
Phase 1 (Hiện tại - đã có):
  ├─ checkRenderThresholds (T_actual > threshold)
  ├─ trackRenderFrequency (N(C, Δt) > limit)
  └─ shallowDiff (phát hiện props thay đổi)

Phase 2 (Tiếp theo):
  ├─ Change Classification (phân loại UNSTABLE_REFERENCE vs VALUE_CHANGE)
  ├─ Waste Detection (W(r_i), ρ(C), T_wasted)
  └─ Memo Efficiency (η)

Phase 3 (Nâng cao):
  ├─ Tree Metrics (CascadeDetection, SubtreeCost, RenderDepth)
  ├─ Health Score & Impact Score
  └─ Fix Suggestion Engine với Confidence Score
```

---

## 10. Tóm tắt: Top 10 Metrics quan trọng nhất

| #   | Metric                    | Công thức                                 | Tại sao quan trọng                        |
| :-- | :------------------------ | :---------------------------------------- | :---------------------------------------- |
| 1   | **Wasted Time**           | `Σ T_actual(r_i) khi W(r_i) = 1`          | Con số duy nhất chứng minh ROI tối ưu hóa |
| 2   | **Waste Ratio**           | `ρ = wasted_renders / total_renders`      | Tỉ lệ phần trăm render vô ích             |
| 3   | **Memo Efficiency**       | `η = 1 - T_actual / T_base`               | Đánh giá hiệu quả memoization             |
| 4   | **Render Frequency**      | `f = N(C, Δt) / Δt`                       | Phát hiện component render quá nhiều      |
| 5   | **Frame Compliance**      | `FBC = renders_in_budget / total_renders` | Đảm bảo 60fps UX mượt mà                  |
| 6   | **Impact Score**          | `ρ × T_wasted × (1 + \|Cascade\| / K)`    | Xếp hạng ưu tiên tối ưu                   |
| 7   | **Cascade Cost**          | `Σ T_actual(C) cho C ∈ Cascade(P)`        | Chi phí hiệu ứng thác đổ                  |
| 8   | **Health Score**          | `100 - penalties`                         | Đánh giá tổng thể component               |
| 9   | **App Efficiency**        | `E = 1 - T_wasted_total / T_render_total` | Chỉ số sức khỏe toàn ứng dụng             |
| 10  | **Change Classification** | `classify(change) → type`                 | Xác định chính xác nguyên nhân gốc rễ     |
