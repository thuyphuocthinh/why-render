# PLAN: Phase 2 - Deep Diagnostic Engine (React Fiber & Vue Reactivity)

**Mục tiêu:** Nâng cấp khả năng "bắt bệnh" thay vì chỉ đo thời gian. Khai thác sâu vào cơ chế render của 2 framework.

## Các Task Kỹ Thuật (To-Do)

1. **React Internal Hooking**
   - Vượt qua rào cản của `shallowDiff` props.
   - Tìm cách lấy được State và Hooks thay đổi bằng cách chọc vào Fiber tree (hoặc monkey-patch `React.createElement` giống why-did-you-render gốc).
   - Phân loại rõ ràng sự thay đổi: `UNSTABLE_REFERENCE` (cùng giá trị nhưng khác con trỏ) vs `VALUE_CHANGE` (thay đổi giá trị thực).

2. **Vue Reactivity Integration**
   - Thay vì dùng lifecycle hooks thông thường, implement `onRenderTriggered` và `onRenderTracked` để bắt chính xác Dep (Dependency) nào báo hiệu update.
   - Lấy chính xác `key`, `oldValue`, `newValue` từ reactivity system.

3. **Toán học & Wasted Render**
   - Implement các công thức tính toán từ `timeline.md`:
     - Wasted Render = Input đổi Reference nhưng Output (DOM) không đổi.
     - Tính Total Wasted Time ($T_{wasted}$).
     - Tính Memoization Efficiency ($\eta = 1 - (T_{actual} / T_{base})$).
