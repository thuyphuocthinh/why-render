# React Internals: Kiến trúc và Cơ chế hoạt động (Deep Dive)

Tài liệu này đi sâu vào cách React hoạt động bên dưới lớp (internal logic), từ việc quản lý các đơn vị công việc (Fiber) đến cách điều phối (Scheduling) và thực thi các bản cập nhật UI.

---

## 1. Tổng quan về React Engine

React không chỉ là một thư viện UI, nó là một hệ thống quản lý trạng thái và đồng bộ hóa UI cực kỳ phức tạp. Hệ thống này được chia thành 2 phần chính:

*   **React Core:** Chứa các logic chung như Hooks (`useState`, `useEffect`), `React.createElement`, và các thuật toán Reconciliation.
*   **Renderer:** Chịu trách nhiệm render "bản vẽ" của React lên môi trường cụ thể (VD: `react-dom` cho Web, `react-native` cho Mobile).

### Triết lý "UI as a Function of State"
Phép toán cốt lõi của React là: `UI = f(State)`. Khi `State` thay đổi, React chạy lại hàm `f` để tìm ra `UI` mới. Tuy nhiên, việc chạy lại toàn bộ ứng dụng là rất tốn kém, vì vậy React sử dụng **Virtual DOM** và **Fiber** để tối ưu hóa quá trình này.

---

## 2. Kiến trúc Fiber (The Heart of React)

Từ phiên bản 16, React đã thay thế Stack Reconciler cũ bằng **Fiber**. Đây là một sự thay đổi mang tính cách mạng, cho phép React thực hiện rendering không lùi bước (non-blocking).

### Fiber Node là gì?
Một **Fiber** là một đối tượng JavaScript đóng vai trò như một "đơn vị công việc" (unit of work). Mỗi thành phần (component), phần tử DOM đều tương ứng với một Fiber node.

Cấu trúc của một Fiber node chứa các thông tin quan trọng:
*   **`type` & `key`:** Định danh cho thành phần.
*   **`stateNode`:** Tham chiếu đến thực thể thực tế (DOM element hoặc class instance).
*   **`child`, `sibling`, `return`:** Các con trỏ (pointers) xây dựng nên cấu trúc cây. Khác với cây DOM thông thường, Fiber sử dụng danh sách liên kết (Linked List) để duyệt cây, cho phép dừng và tiếp tục công việc bất cứ lúc nào.
*   **`memoizedState`:** Nơi lưu trữ state của các Hooks (đóng vai trò như một linked list các hook).
*   **`lanes`:** Biểu thị độ ưu tiên của công việc cần làm trên Fiber này.

### Kỹ thuật Double Buffering
Để tránh hiện tượng UI bị giật hoặc hiển thị không hoàn chỉnh, React duy trì 2 cây Fiber song song:
1.  **Current Tree:** Cây Fiber đang hiển thị trên màn hình hiện tại.
2.  **Work-In-Progress (WIP) Tree:** Cây Fiber đang được xây dựng ngầm trong bộ nhớ dựa trên các state mới.

Sau khi WIP Tree hoàn thành, React chỉ cần tráo đổi (swap) con trỏ gốc để WIP Tree trở thành Current Tree (quá trình này diễn ra đồng bộ ở bước Commit).

---

## 3. Hai giai đoạn của Rendering

Quá trình đưa thay đổi từ state lên UI được chia thành 2 giai đoạn (phase) tách biệt:

### Giai đoạn 1: Render Phase (Asynchronous)
*   **Đặc điểm:** Tạm dừng được (interruptible).
*   **Nhiệm vụ:** React duyệt cây Fiber, tạo ra WIP Tree, so sánh (diffing) để tìm ra các thay đổi cần thiết.
*   **Tính chất:** Đây là giai đoạn tính toán thuần túy (pure). React có thể chạy giai đoạn này nhiều lần, dừng lại để xử lý sự kiện người dùng có độ ưu tiên cao hơn, sau đó tiếp tục hoặc bắt đầu lại nếu state thay đổi giữa chừng.

### Giai đoạn 2: Commit Phase (Synchronous)
*   **Đặc điểm:** Không thể tạm dừng (non-interruptible).
*   **Nhiệm vụ:** Áp dụng các thay đổi đã tính toán ở Render Phase vào DOM thực trực tiếp.
*   **Thực thi:** Các hooks như `useLayoutEffect` và `useEffect` lần lượt được gọi trong giai đoạn này.

---

## 4. Reconciliation và Thuật toán Diffing

Reconciliation là quy trình React so sánh `current` tree và `WIP` tree để quyết định cái gì cần cập nhật.

### Các Heuristics quan trọng:
Để đạt được hiệu năng O(n), React áp đặt 2 quy tắc:
1.  **Khác Component Type:** Nếu 2 phần tử có kiểu khác nhau (VD: `<div>` chuyển thành `<span>`), React sẽ hủy bỏ node cũ và gắn node mới cùng toàn bộ con của nó.
2.  **Keys:** Sử dụng `key` để xác định sự tồn tại của các thành phần trong mảng, giúp giữ lại các state hiện có thay vì tạo mới nhầm.

---

## 5. Scheduler và Lanes (Điều phối và Ưu tiên)

### Scheduler (Bộ điều phối)
Scheduler giống như một "quản lý dự án". Nó sử dụng cơ chế **Time Slicing** để chia nhỏ các tác vụ render lớn thành nhiều mảnh nhỏ. Sau mỗi mảnh (thường khoảng 5ms), Scheduler sẽ kiểm tra xem có sự kiện quan trọng nào từ trình duyệt (click, type) không để nhường quyền điều khiển (yield) cho main thread.

### Lanes (Hệ thống điểm ưu tiên)
Trước đây React dùng `ExpirationTime`, nhưng nay đã chuyển sang **Lanes**.
*   Lanes là các bit 32-bit. Mỗi bit đại diện cho một mức độ ưu tiên (VD: SyncLane, InputContinuousLane, DefaultLane, IdleLane).
*   React sử dụng phép toán bitwise (`&`, `|`) để nhanh chóng kiểm tra xem một Fiber có công việc nào cần xử lý ngay lập tức (high priority) hay có thể gộp (batching) với các tác vụ khác.

---

## 6. Cơ chế thực thi Hooks

Các Hooks (`useState`, `useEffect`, ...) được lưu trữ trong thuộc tính `memoizedState` của Fiber node dưới dạng một **Linked List**.

### Tại sao thứ tự gọi Hooks lại quan trọng?
Mỗi khi component render, React duyệt qua danh sách liên kết này. Nó không biết tên của hook, nó chỉ biết "hook thứ nhất là state này, hook thứ hai là effect kia".
Nếu bạn đặt hook trong câu lệnh `if`, danh sách liên kết sẽ bị lệch thứ tự ở lần render sau, dẫn đến React trả về giá trị sai hoặc gây lỗi.

### Hook Dispatcher
React sử dụng các "Dispatcher" khác nhau tùy theo trạng thái của component:
*   **HooksDispatcherOnMount:** Được dùng khi component render lần đầu (khởi tạo state).
*   **HooksDispatcherOnUpdate:** Được dùng khi component re-render (ngắt kết nối khởi tạo và chỉ lấy giá trị hiện tại).

---

## 7. Concurrent Rendering & Suspense

### Concurrent Rendering
Đây là khả năng của React 18+ cho phép xử lý nhiều phiên bản UI cùng lúc.
*   React có thể chuẩn bị một bản render ngầm (low priority) trong khi vẫn giữ UI hiện tại phản hồi nhanh chóng.
*   `useTransition` cho phép đánh dấu một tác vụ là "không khẩn cấp", giúp React ưu tiên các tương tác mượt mà trước khi hoàn thành việc render nặng nề.

### Suspense Internals
Khi một thành phần "suspends" (đang chờ dữ liệu), nó sẽ "ném" (throw) một Promise lên cho React. React sẽ bắt được Promise này, lưu lại trạng thái hiện tại của Fiber đó và hiển thị phần `fallback`. Khi Promise hoàn thành, React sẽ kích hoạt lại quá trình render cho nhánh đó.

---

## Kết luận
Hiểu rõ về Fiber, Scheduler và hệ thống Lanes giúp lập trình viên giải thích được:
*   Tại sao component bị re-render vô lý?
*   Cách tối ưu Performance bằng `memo`, `useMemo` (thực chất là hỗ trợ React "bail out" - thoát sớm khỏi Render phase của một Fiber).
*   Tại sao `useEffect` lại chạy sau khi UI đã cập nhật?

Tài liệu này là nền tảng quan trọng để làm việc với các công cụ Profiler và hiểu sâu về hiệu năng của ứng dụng React.
