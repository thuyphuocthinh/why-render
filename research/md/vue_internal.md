# Vue 3 Internals: Kiến trúc và Cơ chế hoạt động (Deep Dive)

Tài liệu này giải thích cách Vue 3 vận hành bên dưới lớp vỏ (under the hood), từ hệ thống Reactivity dựa trên Proxy đến bộ xử lý Virtual DOM thông minh (Compiler-informed).

---

## 1. Hệ thống Reactivity (Bộ não của Vue 3)

Khác với React (Pull-based), Vue 3 sử dụng mô hình **Push-based Reactivity** dựa trên JavaScript Proxy.

### Cơ chế Proxy

Khi bạn khởi tạo `reactive` hoặc `ref`, Vue tạo ra một **Proxy** bao bọc đối tượng gốc. Proxy này chặn hai thao tác chính:

- **track (Getter):** Khi một thuộc tính được truy cập trong quá trình render, Vue ghi lại mối quan hệ phụ thuộc (Dependency Tracking).
- **trigger (Setter):** Khi thuộc tính bị thay đổi, Proxy phát hiện và thông báo cho tất cả subscribers phải chạy lại.

### Đồ thị phụ thuộc (Dependency Graph)

Vue duy trì một bản đồ quan hệ (`targetMap`):

> **Target (Object) -> Key -> Set of Effects**

Điều này cho phép Vue cập nhật rất chính xác (**fine-grained updates**). Nếu chỉ có `user.age` thay đổi, chỉ những thành phần dùng `user.age` mới re-render.

---

## 2. Rendering Pipeline và Compiler Optimizations

### Patch Flags (Bitwise Hints)

Khi biên dịch template, Vue đánh dấu các phần động bằng các "Patch Flags".

- **Ví dụ:** `<div :class="cls">{{ text }}</div>` sẽ được đánh dấu flag `TEXT | CLASS`.
- Khi re-render, Vue nhảy thẳng đến việc cập nhật giá trị `text` và `class`, bỏ qua các thuộc tính tĩnh.

### Static Hoisting

Các phần tử tĩnh được Vue nhấc ra khỏi hàm render và khởi tạo một lần duy nhất, giảm thiểu việc tạo VNode dư thừa.

### Block Trees

Vue chia template thành các "Blocks". Mỗi block chỉ theo dõi các node con động. Khi re-render một block, Vue chỉ duyệt qua danh sách các node động thay vì duyệt toàn bộ cây VDOM.

---

## 3. Scheduler và Batching

Vue không cập nhật DOM ngay lập tức khi bạn thay đổi state.

- **Job Queue:** Các yêu cầu update được đưa vào một hàng đợi.
- **Microtask Flushing:** Vue sử dụng `Promise.resolve().then()` để flush hàng đợi này trong một Microtask duy nhất.
- **Kết quả:** Dù bạn thay đổi state nhiều lần liên tiếp, component chỉ re-render một lần.

---

## 4. Debug Hooks cho Profiling (Dành cho Why-render)

Chỉ hoạt động ở môi trường Development:

- **onRenderTracked(e):** Được gọi khi một thuộc tính reactive được truy cập. `e` chứa thông tin về key và component đang track.
- **onRenderTriggered(e):** Được gọi khi một thay đổi state kích hoạt quá trình render. Đây là **chìa khóa chính** để giải thích nguyên nhân re-render.

---

## 5. getCurrentInstance() - Truy cập Component nội bộ

```ts
import { getCurrentInstance } from "vue";

const instance = getCurrentInstance();
// instance.type.__name  -> Tên component
// instance.uid           -> ID duy nhất
// instance.props         -> Props hiện tại
// instance.setupState    -> State từ setup()
```

---

## 6. So sánh với React Internals

| Đặc điểm                 | React (Fiber)                | Vue 3 (Proxy)             |
| :----------------------- | :--------------------------- | :------------------------ |
| **Cơ chế cập nhật**      | Pull-based (diff VDOM)       | Push-based (Dep Tracking) |
| **Độ mịn (Granularity)** | Toàn bộ component            | Từng thuộc tính           |
| **Tối ưu hóa**           | Thủ công (`memo`, `useMemo`) | Tự động (Compiler)        |
| **Bất đồng bộ**          | Time Slicing                 | Microtask                 |

---

## Kết luận cho dự án Why-render

1.  Tận dụng `onRenderTriggered` để lấy "Lý do re-render".
2.  Truy cập `instance.type.__name` để lấy tên component.
3.  Chuẩn hóa dữ liệu thành `ComponentReport` chung của core.
