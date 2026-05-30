# 1. React Profiler

## 1.1. Profiler là gì?

React Profiler là một công cụ (và cũng là một API component) được cung cấp bởi React dùng để đo lường hiệu suất (performance) render của một ứng dụng React. Nó giúp chúng ta xác định được:

- Component nào đang re-render (cập nhật lại) quá nhiều.
- Chi phí (thời gian) để render các component đó là bao nhiêu.
- Những vùng nào trong ứng dụng bị chậm và cần được tối ưu hoá (ví dụ: áp dụng `React.memo`, `useMemo`, `useCallback`).

Profiler thường được sử dụng dưới 2 dạng:

1. **React DevTools Profiler:** Một tab trong tiện ích mở rộng React Developer Tools trên trình duyệt, cung cấp giao diện trực quan để ghi lại quá trình render (flamegraph, ranked chart,...).
2. **Component `<Profiler>` API:** Một component tích hợp sẵn trong React để đo lường bằng code, cho phép thu thập dữ liệu (thời gian chạy) thông qua hàm callback.

## 1.2. API Component `<Profiler>`

Trong React, bạn có thể bọc (wrap) bất kỳ cây component nào bằng component `<Profiler>` để đo lường lượng thời gian cần thiết để render nhánh cây đó.

```jsx
import React, { Profiler } from "react";

function onRenderCallback(
  id, // id của "<Profiler>" tree vừa mới commit
  phase, // "mount" (lần render đầu tiên) hoặc "update" (re-render)
  actualDuration, // thời gian chuẩn bị để vẽ giao diện (render phase)
  baseDuration, // thời gian ước tính để render toàn bộ subtree nếu không dùng memoization
  startTime, // thời điểm React bắt đầu chuẩn bị cho quá trình render
  commitTime, // thời điểm React tiến hành áp thay đổi lên DOM
  interactions, // tập hợp các interaction (experimental) đã trigger quá trình render
) {
  // Ghi log hoặc gửi số liệu đến hệ thống monitoring
  console.log(`[${id}] Phase: ${phase} | Time: ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="NavigationProfiler" onRender={onRenderCallback}>
      <Navigation />
    </Profiler>
  );
}
```

### Các tham số đo lường trả về từ `onRender` (Callback Arguments)

- `id` (string): Thuộc tính `id` bạn truyền vào component `<Profiler>`. Thuộc tính này rất hữu ích, giúp xác định được callback nào sinh ra log nếu bạn có nhiều Profiler theo dõi nhiều phần trong ứng dụng.
- `phase` ("mount" | "update"): Cho biết component trong nhánh đang được hiển thị lần đầu (`mount`) hay đang thực hiện thay đổi (`update`) do sự kiện thay đổi của props, state hoặc context.
- `actualDuration` (number): Hiển thị thời gian thực tế (tính bằng mili-giây) mà React mất ở đợt cập nhật hiện tại để render `<Profiler>` và các component con.
  - **Ý nghĩa:** Đây là chỉ số quan trọng nhất. Nhánh con (`subtree`) này tốn bao nhiêu tài nguyên. Lý tưởng là giá trị của nó nên giảm đáng kể ở những lần update ban đầu (mounting thường chậm hơn do thực hiện khởi tạo). Bằng cách dùng kỹ thuật memoize, `actualDuration` khi update sẽ xuống rất thấp so với khi mount.
- `baseDuration` (number): Thời gian ước tính (lại tính theo ms) để render hoàn toàn cây component con từ đầu và không tận dụng bất kỳ sự ưu tiên tối ưu / memoization nào trước đó. Bằng cách so sánh `actualDuration` với `baseDuration`, bạn có thể đánh giá xem các kỹ thuật tối ưu hóa (`React.memo`, `useMemo`) đang hiệu quả ra sao.
- `startTime` (number): Dấu thời gian độ trễ cao (high-resolution timestamp), `performance.now()`, khi React bắt đầu tiến trình render đối với cập nhật tương ứng.
- `commitTime` (number): Dấu thời gian khi React chính thức áp dụng thay đổi cập nhật vào thực tế (lên DOM). Callback này được gọi ở Commit phase.

### Lưu ý khi sử dụng Component `<Profiler>`

- Profiler bản thân nó cũng tốn một cấu hình nhất định (chi phí tính toán/overhead) nên React **tắt hẳn chức năng Profiler API component phía mã nguồn của môi trường Production.**
- Nếu dự án thật sự muốn monitor perfomance trên môi trường sản xuất của client (gửi tracking lên Datadog, Sentry v.v..), bạn sẽ cần thay đổi alias của module từ `react-dom` sang `react-dom/profiling` dưới thiết lập webpack / vite / framework.
- Các `<Profiler>` có thể nằm lồng (nested) vào trong các `<Profiler>` khác. Phục vụ chia nhỏ báo cáo để tính ra được đâu là chỗ chậm nhất của component.

## 1.3. Cấu trúc hoạt động: Profiler đo lường quá trình Render ra sao?

Tiến trình cập nhật và render của React chia thành hai pha riêng biệt:

1. **Render phase:** React tính toán và quyết định những gì sẽ thay đổi và cập nhật trên giao diện. Ở pha này, React gọi hàm Component của bạn chạy, rồi so sánh (diff) DOM ảo của hàm trả về với kết quả DOM ảo lần render trước, để tính toán các điểm lệch (Reconciliation).
2. **Commit phase:** React thực sự áp dụng thay đổi đã tính ở (A) đó vào phía giao diện (thay đổi/gắn DOM Elements thật, chạy quá trình `useLayoutEffect`, rồi `useEffect` sau đó tiếp tục).

**Profiler tập trung vào việc đo lường thời gian React tiêu dùng ở pha Render:**

- Khi quá trình yêu cầu 1 lệnh re-render diễn ra trong vùng quản lý của `Profiler` (do click, API gọi về setState...). React đánh lại mốc `startTime` cho đợt update mới.
- React tiến hành thực thi chuỗi component trong Virtual Tree ứng nhánh này (**Render phase**) và tính toán độ tiêu chuẩn để tính `actualDuration`.
- Khi phase Render thành công, đi đến bước chèn sửa DOM kết thúc **Commit phase**, React xác nhận thời gian cuối gọi là `commitTime` và cho chạy hàm callback `onRender`. Các biến đo được dựa trên API trình duyệt `performance.now()` nhằm đếm phần ngàn giây siêu chính xác.

### Ứng dụng thực tiễn: Đo đạc trước khi và sau khi Tối ưu hoá

1. Bạn có 1 danh sách render hàng trăm mặt hàng (Products).
2. Bạn bọc `Profiler` vào list. Callback lấy ra consoler log chỉ số `actualDuration` của `update`.
3. Bạn filter dữ liệu. Render lại trang. Lấy được biến báo chỉ số `actualDuration = 80ms`.
4. Quan sát: Nhận ra React phải build lại tất cả các Product Item mặc dù bản chất ta chỉ bỏ đi một vài sản phẩm do Filter. Các item cũ không bị xóa hoàn toàn không thay đổi trạng thái nhưng vẫn bị function re-trigger chạy lại do List component parent của nó re-render.
5. Giải pháp: Bạn đặt các thẻ sản phẩm trong `RenderProductItem` sử dụng HOC `React.memo(RenderProductItem)`. (Nó sẽ ngăn việc tiếp tục chạy vào tính năng rerender nếu không có bất kỳ cái props nào thay đổi đưa vào).
6. Test lại (Filter trên UI). Kết quả log của profiler `actualDuration = 2ms` ở phase update.
7. Bạn đã tận dụng được công cụ React Profiler một cách hiệu quả để định lượng (quantify) bài toán và đo được kết quả do cải tiến của mình làm ra.
