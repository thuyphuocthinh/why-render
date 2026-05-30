# SKILL: Tính toán Metrics & Toán học (Math Metrics)

Khi viết code xử lý phân tích trong `src/core/math.ts` hoặc tính toán điểm số cho thư viện `Why-render`, AI PHẢI tuân thủ các định nghĩa toán học và công thức sau.

## 1. Metrics Thời Gian & Memoization (Duration Metrics)

- **Actual Duration (`T_actual`)**: Thời gian render thực tế (thu được từ Profiler API hoặc `performance.now()`).
- **Base Duration (`T_base`)**: Thời gian render ước tính nếu KHÔNG CÓ memoization (`React.memo`, `useMemo`).
- **Memoization Efficiency (`η`)**:
  $$ \eta = 1 - \frac{T_{actual}}{T_{base}} $$
  - $\eta \ge 0.7$: Memoization cực tốt.
  - $\eta < 0.3$: Memoization vô dụng, cần xem lại.

## 2. Metrics Tần Suất (Frequency Metrics)

- **Render Count (`N`)**: `N(C, \Delta t)` là số lần render trong khoảng thời gian $\Delta t$.
- **Render Frequency (`f`)**: $f(C) = \frac{N(C, \Delta t)}{\Delta t}$ (đơn vị: renders/giây). Cảnh báo nếu $f > 10$.
- **Burst Detection**: Thuật toán Sliding Window (Cửa sổ trượt).
  - Mặc định: Window `w = 1000ms`, Threshold `B_{threshold} = 10`.
  - Nếu số lần render trong cửa sổ `w` vượt ngưỡng $\rightarrow$ Detected Burst.

## 3. Metrics Lãng Phí (Waste Detection)

Đây là nhóm metrics cốt lõi để biết component render có thực sự cần thiết hay không.

- **Wasted Render (`W(r_i)`)**: Bằng 1 (Wasted) nếu Props đổi Reference NHƯNG giống Value (Deep Equal). Hoặc Props/State/Context không đổi nhưng Component vẫn bị render (do Parent).
- **Waste Ratio (`\rho`)**: Tỉ lệ render lãng phí.
  $$ \rho(C) = \frac{\sum W(r_i)}{N(C, \Delta t)} $$
- **Wasted Time (`T_{wasted}`)**: Lượng CPU bị lãng phí. Rất quan trọng để chứng minh ROI.
  $$ T_{wasted}(C) = \sum \{ T_{actual}(r_i) : W(r_i) = 1 \} $$

## 4. Metrics Cây & Điểm Số (Tree & Scoring)

- **Cascade Detection**: Phát hiện "thác đổ" khi Cha render kéo theo Con bị *Wasted Render*.
  $$ Cascade(P) = \{ C \in children(P) : W(r_C) = 1 \text{ VÀ } |t_{render}(C) - t_{render}(P)| < \epsilon \} $$
  *(Khuyến nghị $\epsilon = 50ms$)*

- **Impact Score (Tuyệt đối quan trọng)**:
  Công thức xếp hạng component nào cần tối ưu trước. Bản chất là phép NHÂN để khuếch đại (Trọng số tác động $\times$ Thiệt hại $\times$ Mức độ lan truyền).
  $$ ImpactScore(C) = \rho(C) \times T_{wasted}(C) \times \left(1 + \frac{|Cascade(C)|}{K}\right) $$
  *(Khuyến nghị hằng số chuẩn hoá $K = 10$)*

---
**💡 Action Rule cho AI:** 
Tuyệt đối KHÔNG ĐƯỢC dùng phép CỘNG (+) cho `ImpactScore`. Các yếu tố $(\rho, T, Cascade)$ phụ thuộc và khuếch đại lẫn nhau. Phải dùng phép NHÂN (*) để ra hệ số.
