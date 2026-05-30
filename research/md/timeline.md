### Phase 1:

- Profiler
- Measurement metrics
- JavaScript Runtime
- Refactor logger

### Phase 2: Deep Dive Internals & Core Diagnostic Engine

Giai đoạn này không chỉ dừng lại ở việc hiểu "hộp đen" mà bắt đầu xây dựng bộ não phân tích cho thư viện.

#### 1. React Internal (The Fiber System)

- **Bước 1: Research Virtual DOM & `createElement`:** Tìm hiểu cách chuyển đổi JSX thành cấu trúc Object JavaScript.
- **Bước 2: Implement "Work Loop":** Nghiên cứu `requestIdleCallback` và viết vòng lặp xử lý unit-of-work không gây block Main Thread.
- **Bước 3: Fiber Architecture:** Xây dựng cây Fiber bằng Linked List (`child`, `sibling`, `return`) để hiểu cách duyệt cây không đồng bộ.
- **Bước 4: Thuật toán Reconciliation:** Tự viết hàm `diff` cơ bản để xác định các tác vụ `PLACEMENT`, `UPDATE`, `DELETION`.

#### 2. Vue Internal (The Reactivity System)

- **Bước 1: Implement `reactive` & `ref`:** Sử dụng `Proxy` và `Reflect` để intercept các thao tác truy cập và chỉnh sửa thuộc tính.
- **Bước 2: Dependency Tracking:** Xây dựng hệ thống `track()` và `trigger()` để quản lý danh sách `Effects` phụ thuộc vào từng Key.
- **Bước 3: Scheduler & Batching:** Sử dụng Microtask (`Promise.resolve()`) để gom nhóm các thay đổi, tránh việc re-render liên tục gây lãng phí tài nguyên.

#### 3. Cơ sở toán học & Lý thuyết phát hiện Render thừa

- **Bước 1: Tính toán Hiệu suất:** Đo `actualDuration` bằng `performance.now()` và so sánh với `baseDuration` để định lượng hiệu quả tối ưu hóa.
- **Bước 2: Thuật toán so sánh Props:** Xây dựng `shallowDiff` để phát hiện các thay đổi tham chiếu (Inline Object, Anonymous Function) dù giá trị bên trong không đổi.
- **Bước 3: Định nghĩa Unnecessary Render:** Thiết lập tiêu chuẩn: Render được coi là thừa nếu Input thay đổi tham chiếu nhưng giá trị thực tế đồng nhất, dẫn đến Virtual DOM output không đổi.

#### 4. Core Diagnostic Engine (Tìm ra lý do & Phân tích lỗi)

4.1 (Hiện tại - đã có):
├─ checkRenderThresholds (T_actual > threshold)
├─ trackRenderFrequency (N(C, Δt) > limit)
└─ shallowDiff (phát hiện props thay đổi)

4.2 (Tiếp theo):
├─ Change Classification (phân loại UNSTABLE_REFERENCE vs VALUE_CHANGE)
├─ Waste Detection (W(r_i), ρ(C), T_wasted)
└─ Memo Efficiency (η)
└─ Check lại tính đúng đắn, sau đó fix + ghép nối cho clean

4.3 (Nâng cao):
├─ Tree Metrics (CascadeDetection, SubtreeCost, RenderDepth)
├─ Health Score & Impact Score

-

#### 5. Fix Suggestion Engine (Gợi ý cách sửa)

- Lỗi Function reference đổi liên tục $\rightarrow$ Gợi ý dùng `useCallback` (React).
- Lỗi Object hằng số bị khởi tạo lại $\rightarrow$ Gợi ý dùng `useMemo` hoặc đưa ra ngoài component.
- Lỗi Render lan truyền từ cha $\rightarrow$ Gợi ý dùng `React.memo` hoặc `v-memo`.
- Khi User bấm vào UserCard, bạn mới hiện ra các con số cơ bản và Lời khuyên:
  "Component này render thừa 10 lần."
  "Lý do: Prop options bị thay đổi Reference."
  Actionable: "Hãy bọc options trong useMemo ở component cha."

---

### Phase 3: Render Tree & Cascade Analysis

Mục tiêu là hình ảnh (custom UI...) hóa mối quan hệ để phát hiện các lỗi mang tính hệ thống (như render dây chuyền).

- **Bước 1: Tree Traversal (Duyệt cây):** Sử dụng DFS/BFS để xây dựng sơ đồ phân cấp từ dữ liệu Fiber (React) hoặc `instance.parent` (Vue).
- **Bước 2: Cascade Render Detection:** Nghiên cứu sự tương quan timestamp giữa cha và con. Nếu cha render dẫn đến một loạt con render lãng phí (wasted), hệ thống sẽ cảnh báo "Hiệu ứng thác đổ".
- **Bước 3: Thuật toán tính độ sâu (Render Depth):** Xác định vị trí component trong cây để tính toán chi phí render tích lũy của từng nhánh.
- **Bước 4: Tổng hợp báo cáo (Summary Report):** Nhóm các lỗi theo component thay vì log rời rạc, hiển thị tổng thời gian bị lãng phí (Total Wasted Time) trên toàn bộ cây.
