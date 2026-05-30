# SKILL: Vibe UI Coding

Khi AI được yêu cầu viết giao diện (UI) cho DevTools của thư viện, bắt buộc phải tuân thủ các quy chuẩn sau đây để tạo ra trải nghiệm "Wow" (Vibe).

## 1. Kiến trúc: Smart Container & Dumb UI
- **Smart Container**: Quản lý state, lắng nghe `coreEmitter`, và truyền `props` xuống. Tuyệt đối KHÔNG chứa CSS lộn xộn.
- **Dumb UI**: Chỉ nhận data và hiển thị. Bắt buộc dùng TypeScript chặt chẽ cho `props`.

## 2. Tiêu chuẩn Styling "Vibe"
- BẮT BUỘC sử dụng **TailwindCSS** (hoặc cách viết tương tự nếu cấu hình nội bộ).
- Giao diện phải mang cảm giác của "Công cụ Hacker/Cyberpunk" kết hợp "Sự tinh tế của Apple":
  - **Glassmorphism**: Nền đen nhám hơi trong suốt (`bg-black/80 backdrop-blur-md`).
  - **Shadows**: Dùng bóng mờ có màu (`shadow-lg shadow-cyan-500/20`).
  - **Borders**: Viền gradient hoặc viền tinh tế mờ (`border border-white/10`).
  - **Micro-animations**: Mọi nút bấm, hover đều phải có hiệu ứng (`transition-all duration-200 active:scale-95`).

## 3. Hệ màu (Color Palette)
Không dùng màu gốc nhàm chán. Hãy dùng hệ màu neon/pastel cao cấp:
- Xanh cảnh báo (Success): `#10b981` (Emerald 500) hoặc `#0ea5e9` (Sky 500).
- Vàng cảnh báo (Warning): `#f59e0b` (Amber 500) - Cho Wasted Render.
- Đỏ khẩn cấp (Critical): `#f43f5e` (Rose 500) - Cho Cascade hoặc Leak.
- Nền (Background): `#0f172a` (Slate 900) với độ trong suốt.

## 4. Cách ly CSS (CSS Isolation)
DevTools của thư viện **tuyệt đối không được làm vỡ layout của ứng dụng gốc**.
- Khi render UI, phải render bên trong `Shadow DOM` hoặc dùng namespace cực mạnh (VD: `.why-render-devtools-root`).
- Không set CSS toàn cục (Global CSS) ảnh hưởng ra ngoài.

## 5. Ví dụ mã mẫu (Dumb UI)
```tsx
export function HeatmapBadge({ score, isWasted }: { score: number, isWasted: boolean }) {
  return (
    <div className={`
      inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold font-mono
      transition-all duration-300 ease-in-out
      ${isWasted ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                 : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}
      border backdrop-blur-sm
    `}>
      {score}%
    </div>
  )
}
```
*Lưu ý: Mọi component UI AI sinh ra đều phải ngầu và bóng bẩy như ví dụ trên.*
