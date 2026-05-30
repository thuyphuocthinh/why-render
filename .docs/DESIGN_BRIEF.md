# TỔNG QUAN THIẾT KẾ (DESIGN BRIEF)

*Nơi chứa ý tưởng tổng quan hoặc yêu cầu gốc của dự án. Từ đây AI sẽ phân tích ra các kế hoạch kỹ thuật lưu ở `.docs/plan/`.*

## Mục tiêu Dự Án: Why-render
Xây dựng một thư viện (như `why-did-you-render`) giúp developer debug UI performance trong React và Vue:
1. Xác định khi nào Component re-render.
2. Tại sao nó lại re-render (so sánh Props/State/Context).
3. Đo thời gian render và cảnh báo render quá mức (Wasted Renders).

## Tầm Nhìn "Vibe Coding"
- Thư viện phải hoạt động mượt mà, zero-overhead khi lên production.
- UI (DevTools/Overlay) phải rất "vibe": Đẹp, xịn xò, dễ nhìn, hiển thị dạng Heatmap hoặc bảng panel bằng TailwindCSS.
- Cấu trúc module hoá cao, chia tách rõ Core (logic) và Adapter (framework).
