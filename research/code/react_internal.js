// createElement
// in VDOM, element is not a DOM node
// JSX => Babel transplies to a JS object

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT", // special type for text nodes
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  return {
    type, // "TEXT_ELEMENT", "div", "span"
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
}

// A Fiber tree is like a “linked list” version of the virtual DOM
// fiber node = VDOM node + metadata thông minh, giúp React reconcile incremental, pause/resume, commit chính xác, track state, hooks, priority.
// fiber tree về mặt logic - nhìn nhận nó vẫn là cấu trúc cây - hierrarchy
// nhưng về mặt code thì ứng dụng traverse của linked list
/*
| Metadata          | Mục đích                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `type`            | Biết node là “div”, “p”, hay function/class component               |
| `props`           | Dùng để diff với `alternate.props` → UPDATE hoặc PLACEMENT          |
| `stateNode`       | DOM thật để commit; nếu là class component, lưu instance            |
| `parent`          | Quay lên parent khi duyệt tree step-by-step                         |
| `child`/`sibling` | Cho traversal iteratively (depth-first) → pause/resume dễ           |
| `alternate`       | Trỏ đến fiber cũ → **so sánh incremental**, tránh render lại cả cây |
| `effectTag`       | Đánh dấu node cần làm gì trong commit phase (thêm, sửa, xóa)        |
| `hooks`           | Lưu state, reducer, effect cho function component                   |
| `index`           | Giúp reorder/insert children chính xác                              |

1. Tracking node thay đổi state/props
Nhờ alternate + props + stateNode → biết node nào cần UPDATE
2. Reconciliation incremental
Chỉ diff những node cần thiết, tránh rebuild DOM cả cây
3. Commit phase tách render
Tách: “tính toán fiber tree mới” vs “update DOM thật”
4. Pause / resume rendering
Duyệt fiber node theo depth-first, step-by-step
Mỗi step là unit of work, dùng requestIdleCallback
5. Prioritized update
Fiber cho phép React gán priority → urgent UI trước, low-priority sau
6. Hooks & state management
Fiber lưu state/effect riêng từng function component
*/
const fiber = {
  type: "div",
  props: { children: [] },
  dom: null, // will be real DOM
  parent: null,
  child: null,
  sibling: null,
  alternate: oldFiber,
  effectTag: "PLACEMENT",
  hooks: "",
  indeX: "",
};
// currentTree, workInProgress
let nextUnitOfWork = null;

// Hàm này được trình duyệt gọi khi Main Thread đang "rảnh"
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // Xử lý 1 node Fiber... => trả về node Fiber tiếp theo cần xử lý
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    // Nếu trình duyệt hết thời gian rảnh (< 1ms), nhường quyền cho Browser render/scroll
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop); // Đăng ký cho khung hình tiếp theo
}
requestIdleCallback(workLoop);

// -- Sơ đồ thứ tự duyệt cây (DFS - Depth First Search) --
function performUnitOfWork(fiber) {
  // 1. Gắn DOM node, v.v...

  // 2. Trả về Fiber kế tiếp theo thứ tự:
  // Đi xuống con -> Hết con thì đi qua anh em -> Hết anh em thì quay lên cha tìm anh em của cha
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

// reconciliation
// Rất đơn giản hóa:
function reconcileChildren(wipFiber, elements) {
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  // So sánh type của cũ và mới
  const sameType = oldFiber && element && element.type == oldFiber.type;

  if (sameType) {
    // Giữ nguyên DOM, chỉ cập nhật Props (UPDATE)
    newFiber.effectTag = "UPDATE";
  }
  if (element && !sameType) {
    // Sinh DOM mới hoàn toàn (PLACEMENT)
    newFiber.effectTag = "PLACEMENT";
  }
  if (oldFiber && !sameType) {
    // Xóa DOM cũ (DELETION)
    oldFiber.effectTag = "DELETION";
  }
}
