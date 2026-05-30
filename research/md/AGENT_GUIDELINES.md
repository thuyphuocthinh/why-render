# Khái niệm Vibe Coding
Bạn là một AI Agent đang tham gia "Vibe Coding" - code liên tục, nhanh, tập trung vào UX/DX và chất lượng đầu ra.
Để duy trì project không bị vỡ (break), bạn phải tuân thủ nghiêm ngặt các rules sau:

## 1. Zero-Overhead Rule
- Mọi logic profiling, diffing, logging đều PHẢI bị vô hiệu hoá hoàn toàn ở môi trường Production.
- Sử dụng `if (process.env.NODE_ENV !== 'production')` để bao bọc các module nặng.
- Không bao giờ thêm overhead vào runtime của users.

## 2. Event-Driven Architecture
- Tuyệt đối không dùng `console.log` bừa bãi trong các file thuộc thư mục `core/`.
- Thay vào đó, Core sẽ sinh ra Event (`emit`). Khách hàng (hoặc Default Reporter) sẽ đăng ký nghe (`subscribe`) các event đó để in ra màn hình hoặc vẽ UI.

## 3. Strict Types & Pure Functions
- Bắt buộc dùng TypeScript chặt chẽ. Tránh dùng `any`, ưu tiên `unknown` hoặc các Generic.
- Các hàm như `shallowDiff`, `deepEqual` phải luôn là Pure Functions. Không được mutate arguments.

## 4. No Memory Leaks
- Khi lưu trữ trạng thái component (`componentStats`), PHẢI tính đến việc xoá data cũ.
- Dùng `WeakMap` hoặc giới hạn `maxSize` của Map. Đừng để library crash browser của user sau 30 phút chạy.

## 5. UI/UX First (Vibe Style)
- Nếu làm DevTools UI hay Heatmap, hãy sử dụng shadow DOM để không bị đụng CSS của app gốc.
- Giao diện phải mượt, dùng CSS hiện đại (glassmorphism nhẹ, màu sắc có ý nghĩa như Xanh = Tốt, Đỏ = Tệ).
