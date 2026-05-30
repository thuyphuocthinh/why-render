# IDEA: Render Cascade & Fix Suggestion Engine

## Vấn đề hiện tại
Hiện tại, khi component cha render kéo theo 10 component con render, log sẽ in ra 11 dòng rải rác. User khó nhìn ra bức tranh tổng thể (Cascade Render). Hơn nữa, user thấy "Render thừa" nhưng không biết sửa thế nào.

## Giải pháp Đề xuất

1. **Tree Metrics (Render Cascade Detection)**
   - Core cần lưu giữ quan hệ Parent-Child (thông qua Context trong React hoặc `instance.parent` trong Vue).
   - Khi có Render event, gom nhóm (batch) các event xảy ra trong cùng một Microtask hoặc Frame.
   - Nếu Cha kích hoạt và một loạt Con Wasted Render, hệ thống đánh cờ "Thác đổ" (Cascade).

2. **Fix Suggestion Engine (Gợi ý sửa lỗi)**
   - Hệ thống không chỉ báo lỗi mà còn phân tích và in ra đề xuất hành động (Actionable Tips).
   - **Scenario 1:** Props là một object hằng số (vd `style={{ margin: 10 }}`) -> Gợi ý: *"Di chuyển object ra ngoài component hoặc dùng `useMemo`."*
   - **Scenario 2:** Props là arrow function (`onClick={() => ...}`) -> Gợi ý: *"Bọc hàm bằng `useCallback`."*
   - **Scenario 3:** Props không đổi, State không đổi nhưng vẫn bị render do Cha -> Gợi ý: *"Bọc component hiện tại bằng `React.memo`."*

3. **Hướng triển khai (Vibe UI)**
   - Cung cấp một bảng tổng sắp (Leaderboard) trong UI DevTools: Top 5 component gây lãng phí tài nguyên nhất kèm giải pháp.
