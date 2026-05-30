# HIẾN PHÁP AI AGENT (VIBE CODING)

Bạn là một AI Agent đang tham gia "Vibe Coding" cho dự án **Why-render**.
Mọi hành động sinh code, thiết kế kiến trúc hay sửa lỗi đều phải TUÂN THỦ NGHIÊM NGẶT các quy tắc bất di bất dịch dưới đây:

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
- **Zero-Overhead trong Production**: Mọi logic profiling, diffing, logging đều PHẢI bị vô hiệu hoá hoàn toàn ở môi trường Production (dùng `process.env.NODE_ENV !== 'production'`). Không bao giờ làm chậm app của user.
- **TypeScript Strict Mode**: Không sử dụng kiểu `any`. Bắt buộc dùng Typescript chặt chẽ. Ưu tiên `unknown` hoặc `Generic`.
- **Event-Driven Core**: Tuyệt đối không dùng `console.log` bừa bãi trong thư mục `core/`. Core chỉ sinh ra Event (`emit`). Client/Reporter sẽ `subscribe` để xử lý.
- **No Memory Leaks**: Mọi trạng thái được lưu trữ phải có cơ chế Garbage Collection (tự dọn dẹp) hoặc dùng `WeakMap`.

## 2. Kiến trúc & Tổ chức Code
- **Chỉ có Frontend / Library**: Dự án này không có Backend.
- **Mô hình Component**: Tuân thủ triệt để nguyên tắc **Smart Container vs Dumb UI**.
  - *Smart Container*: Chỉ xử lý logic, event, state, fetch data, gọi hook.
  - *Dumb UI*: Chỉ nhận `props` và render giao diện, không chứa business logic phức tạp.
- **Styling**: Bắt buộc sử dụng **TailwindCSS** cho các phần giao diện DevTools/UI của thư viện. CSS viết gọn gàng, hỗ trợ tốt Dark/Light mode và có UI/UX hiện đại (vibe).

## 3. Quản Lý Trí Nhớ (Memory System)
AI phải luôn thao tác với thư mục `.docs/` như não bộ của mình:
- **Ngắn hạn**: `.docs/idea/`, `.docs/plan/`, `.docs/design/` (Phân tích, chia nhỏ task. Mỗi tính năng 1 file, không ghi chung).
- **Trung hạn (RAM)**: Cập nhật `.docs/FEATURE_DONE.md` NGAY LẬP TỨC sau khi hoàn thành một feature (Ví dụ: "Đã tạo component X, fix lỗi Y").
- **Vĩnh viễn (SSD)**: `.docs/ARCHITECTURE.md` và `.docs/STYLEGUIDE.md`. Mọi dòng code sinh ra phải đối chiếu với 2 file này. AI phải chủ động cập nhật chúng khi có kiến trúc/rule mới được thống nhất.

## 4. Skills (Chiêu thức)
Kho tàng chiêu thức nằm trong `.agent/skills/`. AI hãy chủ động tham khảo khi được user yêu cầu dùng lệnh tương ứng.
