# Javascript Runtime (Môi trường thực thi Javascript)

## 1. Giới thiệu tổng quan
Bản thân JavaScript là một ngôn ngữ lập trình **đơn luồng (single-threaded)** và **đồng bộ (synchronous)**. Điều này có nghĩa là tại một thời điểm, JavaScript chỉ có thể thực hiện một tác vụ duy nhất.

Tuy nhiên, trong thực tế, chúng ta vẫn có thể thực hiện các tác vụ bất đồng bộ (gọi API, setTimeout, đọc file) mà không làm "đóng băng" giao diện hay dừng ứng dụng. Điều này là nhờ vào **JavaScript Runtime Environment (Môi trường thực thi JS)**.

Mỗi môi trường chạy JS (như Trình duyệt - Browser hoặc Node.js) sẽ cung cấp một JS Runtime riêng, bổ sung các công cụ bên ngoài để giúp JS có thể hoạt động bất đồng bộ.

---

## 2. Các thành phần chính của JS Runtime

Cấu trúc của JS Runtime ở cả Trình duyệt và Node.js đều có chung các thành phần cốt lõi:

### 2.1. JavaScript Engine (Động cơ V8, SpiderMonkey,...)
Đây là trái tim của Runtime, nơi trực tiếp biên dịch và thực thi mã JS. Bao gồm 2 phần cơ bản:
*   **Memory Heap:** Vùng nhớ rộng lớn không có cấu trúc cụ thể, dùng để cấp phát bộ nhớ động (lưu trữ các objects, references, function definitions).
*   **Call Stack (Ngăn xếp gọi hàm):** Cấu trúc dữ liệu dạng **LIFO** (Last In, First Out - Vào sau ra trước) để ghi lại vị trí đang thực thi trong chương trình. Khi một hàm được gọi, nó được đưa vào trên cùng của Call Stack. Khi hàm chạy xong, nó bị lấy ra khỏi ngăn xếp.

### 2.2. Web APIs (ở Browser) / C++ APIs (ở Node.js)
Đây **không phải** là một phần của ngôn ngữ JavaScript mà là các tính năng do Trình duyệt (hoặc hệ điều hành hỗ trợ cho Node.js) cung cấp.
*   **Browser Web APIs:** `setTimeout`, `DOM manipulation`, `fetch`, `XMLHttpRequest`, `Geolocation`,...
*   **Node.js C++ APIs:** `FileSystem (fs)`, `crypto`, `http`,...

Khi Call Stack chạy đến một hàm gọi API (VD: `setTimeout`), nó sẽ bàn giao lại cho Web API xử lý tiến trình ở background và Call Stack tiếp tục chạy dòng lệnh tiếp theo.

### 2.3. Các Hàng Đợi (Queues)
Nơi lưu trữ các callbacks (hàm gọi lại) sau khi Web APIs đã xử lý xong tác vụ ở background. Các callback xếp hàng tại đây chờ được đẩy vào Call Stack để thực thi.
*   **Microtask Queue (Hàng đợi vi tác vụ):** Có **độ ưu tiên thực thi rất cao**. Chứa các callbacks từ:
    *   `Promises` (`.then()`, `.catch()`, `.finally()`)
    *   `MutationObserver` (Browser)
    *   `process.nextTick()` (Node.js - thậm chí còn ưu tiên hơn cả Promises)
*   **Macrotask Queue / Callback Queue (Hàng đợi tác vụ lớn):** Chứa các callbacks thông thường:
    *   `setTimeout`, `setInterval`
    *   `DOM Events` (Click, Scroll,...)
    *   `I/O operations` (Node.js)

### 2.4. Event Loop (Vòng lặp sự kiện)
Là một cơ chế (vòng lặp vô tận) hoạt động như một "kẻ giám sát" để điều phối code. Nhiệm vụ duy nhất của nó là:
1.  Nhìn vào **Call Stack**, nếu nó đang có tác vụ thì đợi.
2.  Nếu **Call Stack TRỐNG**, nó sẽ nhìn vào **Microtask Queue**. Nếu có task ở đây, nó sẽ đẩy LẦN LƯỢT toàn bộ các tasks trong Microtask Queue vào Call Stack cho đến khi tệp này **hoàn toàn trống**.
3.  Khi **Call Stack** và **Microtask Queue** đều trống, nó chuyển sang nhìn **Macrotask Queue**, lấy task đầu tiên đưa vào Call Stack và thực thi (chỉ lấy từng task một ở mỗi vòng lặp).

---

## 3. Thứ tự xử lý (Quy trình chi tiết)

Một luồng xử lý kinh điển diễn ra như sau:
1.  **Thực thi đồng bộ:** Code được đọc từ trên xuống dưới, các hàm đồng bộ được đẩy vào Call Stack chạy và lấy ra ngay lập tức.
2.  **Đẩy cho API:** Các hàm bất đồng bộ (`setTimeout`, `fetch`) được đẩy vào Web API/Node API để chạy tiến trình ngầm (đếm thời gian, gọi mạng mạng).
3.  **Vào Queue:** Sau khi tiến trình ngầm xong, API đẩy hàm callback tương ứng vào **Microtask Queue** (nếu là Promise) hoặc **Macrotask Queue** (nếu là setTimeout).
4.  **Bơm vào Stack:** **Event Loop** kiểm tra Call Stack. Khi Call Stack trống, ưu tiên giải quyết DỨT ĐIỂM toàn bộ **Microtask Queue**. Sau đó xử lý từng cái một bên **Macrotask Queue**.

---

## 4. Ví dụ trực quan

```javascript
console.log('1. Bắt đầu (Sync)');

setTimeout(() => {
  console.log('2. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise 1 (Microtask)');
}).then(() => {
  console.log('4. Promise 2 (Microtask)');
});

console.log('5. Kết thúc (Sync)');
```

**Quá trình phân tích thực thi:**
1.  `console.log('1. Bắt đầu')` vào Call Stack -> in ra `1. Bắt đầu (Sync)` -> pop khỏi Stack.
2.  Lời gọi `setTimeout` vào Call Stack. Nó nhận ra đây là Web API, nên bàn giao cho Web API xử lý việc đếm ngược 0ms, sau đó Web API đưa callback vào **Macrotask Queue**. `setTimeout` được pop khỏi Stack.
3.  `Promise.resolve().then(...)` vào Call Stack. Callback bên trong `then` được đẩy ngay vào **Microtask Queue**. Hàm `Promise` pop ra khỏi stack.
4.  `console.log('5. Kết thúc')` vào Call Stack -> in ra `5. Kết thúc (Sync)` -> pop khỏi Stack.

*Lúc này Main Thread (Call Stack) đã trống.*

5.  **Event Loop** thức dậy, kiểm tra **Microtask Queue**:
    *   Thấy có `3. Promise 1`, bốc bỏ vào Call Stack -> in ra `3. Promise 1 (Microtask)`.
    *   Sau khi chạy xong block `then` này, nó lại sinh ra `4. Promise 2` và đẩy tiếp `4. Promise 2` vào cuối **Microtask Queue**.
    *   Event Loop vẫn thấy Microtask Queue chưa trống, bốc tiếp `4. Promise 2` bỏ vào Call Stack -> in ra `4. Promise 2 (Microtask)`.
6.  Bây giờ **Microtask Queue** đã trống hoàn toàn. **Event Loop** liếc nhìn **Macrotask Queue**.
    *   Thấy còn `2. setTimeout`, bốc nó vào Call Stack -> in ra `2. setTimeout (Macrotask)`.

**Kết quả in ra màn hình sẽ là:**
```text
1. Bắt đầu (Sync)
5. Kết thúc (Sync)
3. Promise 1 (Microtask)
4. Promise 2 (Microtask)
2. setTimeout (Macrotask)
```
