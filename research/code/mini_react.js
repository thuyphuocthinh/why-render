// MOCK DOCUMENT CHO MÔI TRƯỜNG NODEJS
if (typeof document === "undefined") {
  global.document = {
    createElement: (type) => ({ tagName: type, type: "DOM_NODE" }),
    createTextNode: (text) => ({ nodeValue: text, type: "TEXT_NODE" }),
  };
}

// ==========================================
// BƯỚC 1: VIRTUAL DOM & CREATE ELEMENT
// ==========================================
// Hàm chuyển đổi JSX thành Object (Virtual DOM)
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(
        (child) =>
          typeof child === "object"
            ? child // Đã là object (nested element)
            : createTextElement(child), // Chuỗi text
      ),
    },
  };
}

// Helper quản lý TextNode
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// ==========================================
// BƯỚC 2 & 3: FIBER & WORK LOOP (THE ENGINE)
// ==========================================
let nextUnitOfWork = null;
let currentRoot = null; // Cây Fiber hiện tại đang hiển thị trên màn hình
let wipRoot = null; // Cây Fiber nháp (Work in progress) đang được build

// (Giả lập requestIdleCallback cho Môi trường Node.js)
const requestIdleCallbackPolyfill =
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback
    : (callback) => setTimeout(() => callback({ timeRemaining: () => 1 }), 1);

// Vòng lặp chia nhỏ công việc để không làm đơ Main Thread (Mượt mà / Concurrent Mode)
function workLoop(deadline) {
  let shouldYield = false;
  // Vòng lặp: Miễn là CÒN VIỆC (nextUnitOfWork) và TRÌNH DUYỆT RẢNH (!shouldYield)
  while (nextUnitOfWork && !shouldYield) {
    // Thực thi 1 node Fiber và nhận lại Node Fiber tiếp theo để duyệt
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // Hết số ms rảnh thì nhường trình duyệt
  }

  // Khi xử lý xong 1 VÒNG ĐỜI (hết cây chờ cập nhật), ta Commit (đẩy) toàn bộ thay đổi lên DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // Chạy tiếp nếu còn việc hoặc còn wipRoot
  if (nextUnitOfWork || wipRoot) {
    requestIdleCallbackPolyfill(workLoop);
  }
}

// Bắt đầu nhịp tim đập đầu tiên của Engine
requestIdleCallbackPolyfill(workLoop);

// Xử lý một Component (React Node)
function performUnitOfWork(fiber) {
  // 1. Tạo node Thực thể DOM (Nếu là lần đầu render chưa có thẻ HTML)
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  // 2. Chạy thuật toán Reconcile (So sánh Node Cũ và Mới để lên kế hoạch thay đổi)
  reconcileChildren(fiber, elements);

  // 3. Phép duyệt mảng LINKED LIST (DFS - TÌM NODE KẾ TIẾP):
  // Ưu tiên 1: Đi cắm đầu xuống Con trái nhất
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    // Ưu tiên 2: Đi sang Anh Em (Sibling) cùng cấp
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // Ưu tiên 3: Hết Anh Em rồi thì lùi về Cha, tìm Anh Em của Cha tiếp...
    nextFiber = nextFiber.parent;
  }
}

// ==========================================
// BƯỚC 4: THUẬT TOÁN RECONCILIATION
// ==========================================
// So sánh giữa cây Fiber CŨ đang hiển thị (alternate) & mảng Children MỚI
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child; // Node con của phiên bản hiển thị cũ
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // Có cùng thẻ div, p, h1... không?
    const sameType = oldFiber && element && element.type === oldFiber.type;

    // UPDATE: type giống hệt, cấu trúc giữ nguyên, chỉ đổi Props (như class, id, text...)
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom, // Tái sử dụng Element có sẵn trên trình duyệt (Cốt lõi tối ưu hiệu năng)
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    // PLACEMENT: Có node ảo mới, khác bọt hoàn toàn => Thêm cái mới vào màn hình
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // Sẽ được sinh DOM thật trong bước performUnitOfWork sau
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    // DELETION: Không có node ảo mới nhưng có con cũ rớt lại => Xóa con cũ đi
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      // Bỏ qua Array deletions cho ví dụ đơn giản
    }

    // Tiến con trỏ cũ qua node lân cận
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // Kết Nối Linked-List
    if (index === 0) {
      wipFiber.child = newFiber; // Gắn con Trưởng
    } else if (element) {
      prevSibling.sibling = newFiber; // Gắn Anh Em kề vai sát cánh
    }

    prevSibling = newFiber;
    index++;
  }
}

function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // Lần đầu tiên chạy (Mount) thì chưa có đồ cũ => Tạo mới Object
    // workInProgress = createFiber(...);
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // Render lần 2 trở đi => Đã có đồ cũ chứa "Data kề kề trước"
    // TIẾN HÀNH RESET / CHÉP ĐÈ TỪ CURRENT SANG ĐỂ CÂN BẰNG LẠI THỜI GIAN
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;

    // ĐẤY! Bê State chuẩn từ Current hiện tại qua nè!
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    //... (copy các thuộc tính khác)
  }

  return workInProgress;
}

// ==========================================
// BƯỚC 5: TẠO VÀ GẮN VÀO REAL DOM
// ==========================================
// Dịch từ Fiber Virtual DOM Object -> thẻ HTML thật
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // Thêm Attributes
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

// Bóp Cò: Đẩy đồng loạt tất cả bản thiết kế (wipRoot) lên giao diện người dùng
function commitRoot() {
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

// Hàm đệ quy gắn vào giao diện tùy theo Tag Phân Loại
function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;

  // Fake DOM trong Nodejs ko có appendChild nên phòng hờ lệnh này
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null &&
    domParent.appendChild
  ) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    // (Bỏ qua viết hàm updateNode ở đây cho đơn giản)
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// ==========================================
// HÀM KHỞI CHẠY ROOT
// ==========================================
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  // Nạp ngòi nổ: WorkLoop sẽ chụp lấy ngòi (WipRoot) và bắt đầu phân chia xử lý
  nextUnitOfWork = wipRoot;
}

// ==========================================
// CHẠY THỬ LÊN
// ==========================================

// Mock Root Container do ta chạy trong Node.js thay vì Browser
const ROOT_MOCK = {
  appendChild: (node) =>
    console.log(
      "🟢 [DOM ACTION]: appended node =>",
      node.nodeName || node.tagName || node,
    ),
};
const container =
  typeof document !== "undefined" ? document.getElementById("root") : ROOT_MOCK;

// Xây dựng JSX (Bằng Javascript thuần)
const App = createElement(
  "div",
  { id: "app-container", style: "background: #eee; padding: 10px;" },
  createElement("h1", null, "Hello Mini React!"),
  createElement(
    "p",
    null,
    "Tôi đã dựng thành công WorkLoop & Fiber Architecture.",
  ),
  createElement("hr", null),
  createElement(
    "strong",
    null,
    "Tại sao cái này quan trọng với project Why-render?",
  ),
  createElement(
    "div",
    null,
    "=> Khi bạn nắm được WorkLoop và Fiber (có lưu '.alternate' và '.props' cũ kế thừa), bạn có thể chặn ngay khúc Reconcile để xem 'Props cũ' KHÁC GÌ 'Props mới' mà React lại xếp nó vào tác vụ UPDATE thừa thãi!!",
  ),
);

console.log("🚧 Đang tiến hành tạo luồng DOM...");
console.log("📦 Dữ liệu Virtual DOM thô ban đầu của thẻ App:");
console.log(JSON.stringify(App, null, 2));

// Kích Hoạt
render(App, container);

console.log("\n✅ Mã giả React đã setup xong. Fiber Engine đang chạy nền...");

module.exports = { createElement, render };

/*

Mình đã tạo xong file `mini_react.js` chứa toàn bộ code mô phỏng bản chất của Fiber Architecture. 

Để dễ hiểu, bạn hãy tưởng tượng React như một **xưởng lắp ráp xe hơi**. Dưới đây là toàn bộ luồng chạy (Execution Flow) được thực thi trong file `mini_react.js` từ khi bạn viết code đến khi nó hiển thị lên màn hình:

### 1. Khởi tạo Bản Lắp Ráp (JSX $\rightarrow$ Virtual DOM)
*Nhà thiết kế vẽ bản thiết kế.*
*   Bắt đầu từ cái file gốc của bạn, thay vì viết HTML, bạn bắt React biến cấu trúc JSX lại thông qua các lệnh `createElement(...)`.
*   Nó sẽ chạy từ trong ra ngoài để đẻ ra một đống JavaScript Object đơn thuần lồng vào nhau chứa thông tin về `type` (thẻ div, h1, text...) và `props` (thuộc tính, children).
*   **Kết quả:** Biến `App` lúc này chỉ là một object json "vô hồn", hoàn toàn chưa đụng gì đến giao diện trên màn hình cả.

### 2. Phát lệnh Render (`render(element, container)`)
*Giao bản thiết kế cho Quản đốc xưởng tĩnh.*
*   Bạn gọi hàm `render(App, rootContainer)`. Ở đây, React tiến hành thiết lập **Fiber Nháp (Work In Progress Root - `wipRoot`)**.
*   Fiber Nháp này đóng vai trò là "Công việc đầu tiên cần làm", bọc lấy cái thẻ cha (`container`) và lấy cục `App` ở bước 1 gán làm **"đứa con đầu lòng"** (`props.children = [App]`).
*   Nó giương cờ hiệu: `nextUnitOfWork = wipRoot` (Công việc tiếp theo là ráp cái root này).

### 3. Vòng quay Không Ngừng Nghỉ (The Work Loop)
*Dây chuyền lắp ráp bắt đầu hoạt động bất cứ khi nào dư điện (Browser Idle).*
*   Hàm `workLoop` vốn dĩ đang chạy dưới nền qua cái phễu `requestIdleCallback` (báo hiệu lúc trình duyệt đang rảnh).
*   Đột nhiên nó thấy `nextUnitOfWork` không còn rỗng nữa (vì ở bước 2 vừa nạp ngòi).
*   Nó sẽ lôi cái Root Fiber đó ra và quăng vào lò xử lý: `performUnitOfWork()`.

### 4. Quá Trình Nhai Node (Perform Unit Of Work + Reconcile)
*Thợ máy cầm bản thiết kế, lấy phụ tùng và phân tích.*
Hàm `performUnitOfWork` làm đúng 3 việc cực kỳ quan trọng cho mỗi một Node thẻ (VD thẻ `<h1>`):
1.  **Tạo phụ tùng:** Hàm `createDom()` sẽ tạo thẻ `<h1>` bằng `document.createElement("h1")`, nhưng CẦM TRÊN TAY CHỨ CHƯA GẮN VÀO TRANG WEB.
2.  **Khám xét đám con (Reconciliation):** Nó nhìn vào tệp `children` của thẻ `<h1>` (trường hợp này là chuỗi text "Hello"). Nó đối chiếu với cây hiển thị cũ để ra quyết định:
    *   *À chưa có gì à? Đánh dấu thằng con này chữ `PLACEMENT` (Cần Bơm Vào).*
    *   *À có rồi mà đổi màu à? Kế thừa lại Element cũ, đánh chữ `UPDATE` (Cần Cập Nhật).*
3.  **Đi tìm công việc kế tiếp (Linked List Traversal):** Khác biệt của Fiber nằm ở đây! Sau khi xét xong mảng con thành các Fiber Node liên kết chặt nhau, nó quyết định đứa tiếp theo bị "lên thớt" là ai:
    *   Đi xuống đứa con đầu tiên (Child).
    *   *Nếu không có Child?* Đi qua thằng em họ (Sibling).
    *   *Nếu không có Sibling?* Tìm đường lui ngược lên Cha (`parent`) => qua Thằng Em Của Cha.
  $\rightarrow$ Cứ thế WorkLoop đi xuống đi lên, không đệ quy, không bị kẹt lặp vô hạn. Hết thời gian thì tạm dừng cho chuột/bàn phím cuộn trên màn hình, khung hình sau lại dịch tiếp.

### 5. Gắn Toàn Bộ Lên Màn Hình (The Commit Phase)
*Các bộ phận đã lắp rải rác xong, dùng máy cẩu ụp vào xe trong 1 cái chớp mắt.*
*   Sau một lúc miệt mài gặm từng Node ở Bước 4, rốt cục thì Workloop lùi mãi lùi mãi bật cả ra ngoài cái Root. Tức là `nextUnitOfWork = null` (Hết việc để làm).
*   Chính là lệnh chốt chặn cực kì quyền lực trong luồng Workloop: `if (!nextUnitOfWork && wipRoot) { commitRoot(); }`
*   **`commitRoot` chạy:** Lúc này nó mới dùng 1 lần đệ quy duy nhất rất nhanh quét lại cấu trúc nháp. Thằng nào có thẻ tag `PLACEMENT`, gọi `appendChild` gắn thẳng lên DOM của trình duyệt hiển thị cái xoạch. 
*   **Hoàn tất:** `wipRoot` rỗng, chờ lần User ấn "set State" tiếp theo!

> **💡 Tại sao Why-Render cần mô hình này:** Bạn có thể thấy toàn bộ trí tuệ nhân tạo phát hiện Render Thừa của bạn sẽ phải móc nối ngay vào cái chỗ hàm **`reconcileChildren`**. Nếu ở đấy mà `sameType = true`, `effectTag = UPDATE` nhưng khi so sánh Props nó không khác một li (ngoại trừ cái Reference) => Boom! Render phế thải, Wasted Render nằm ở đây chứ đâu!
*/

/*
Khi bạn nhấn một cái nút và kích hoạt hàm `setState` (hoặc `useState` setter), React không chạy đi cập nhật thẳng vào giao diện ngay lập tức. Đây chính xác là lúc cỗ máy Fiber (mà chúng ta đang dựng trong `mini_react.js`) gầm rú để khởi động lại vòng lặp. 

Hãy đi theo luồng chạy chi tiết của 1 lệnh `setState(count + 1)` từ lúc ấn nút cho đến lúc số trên màn hình thay đổi nhé:

### Bước 1: Ném "Đơn hàng" vào hàng đợi (Enqueue Update)
Khi bạn gọi `setState(newVal)`:
* React sẽ **không bẻ lái** đi render ngay. Thay vào đó, nó đóng gói cái `newVal` này thành một Đơn đặt hàng (Update object).
* Nó tìm đến cái **Fiber Node** của chính cái Component chứa `setState` đó và nhét Đơn hàng này vào hàng đợi gọi là **`updateQueue`** trên Fiber đó.
*(Lưu ý: Nếu bạn gọi `setState` 3 lần liên tục trong 1 hàm, nó chỉ nhét 3 đơn hàng vào `updateQueue` thôi chứ chưa làm gì cả - đây gọi là Batching).*

### Bước 2: Báo động lây lan lên đỉnh (Schedule & Mark Path)
* React bắt đầu lần mò theo sợi dây **`fiber.parent`** chạy ngược từ Component của bạn lên đến tận đỉnh `Root`.
* Trên đường đi lên, nó vẽ các mũi tên chỉ đường (trong React gọi là cờ `childLanes`). Nó báo cho WorkLoop biết: *"Ê, ở nhánh này có biến nhé, lát nữa duyệt cây nhớ rẽ vào nhánh này!"*.
* Lên đến Root, nó đánh thức Workloop bằng cách set lại cái biến ngòi nổ: `wipRoot = currentRoot` và `nextUnitOfWork = wipRoot`.

### Bước 3: Vòng lặp tỉnh giấc (WorkLoop Resume & Bailout)
Trình duyệt rảnh rỗi, `WorkLoop` thấy `nextUnitOfWork` có việc bèn bắt đầu nhai cây từ đỉnh (Root) đi xuống:
* **Chiến thuật "Né việc" (Bailout):** Với những Component nằm ở nhánh khác, hoặc là mớ Component cha/anh em không liên quan, React thấy Props y nguyên + State y nguyên + Không có cờ báo động $\rightarrow$ **Cắt! Không gọi lại hàm Component đó.** Trực tiếp lấy luôn kết quả từ cây Current đắp sang nhánh WIP. Bỏ dở không đi sâu xuống nhánh đó nữa (Tối ưu cực khủng của React nằm ở đây).
* **Đến đúng ổ bệnh (Component gọi setState):** React thấy `updateQueue` ở đây có đơn hàng. Nó sẽ lấy State nãy (Ví dụ: `1`), cộng/trừ/xét theo Đơn đặt hàng để tính ra State mới (`2`). 

### Bước 4: Gọi lại Hàm & Chạy Reconcile (Render Phase)
Nút thắt quan trọng nhất chính là đây:
* Sau khi tính được State = 2. React CHẠY LẠI toán bộ logic bên trong Function Component của bạn với đầu vào `State = 2` này.
* Component chạy xong sẽ **return ra một cục JSX (Virtual DOM mới).**
* Vòng lặp quăng cục JSX mới tinh này vào cái máy ép **`reconcileChildren()`** (Mà ta đã code). Máy ép sẽ so mặt cái JSX mới với cái Con Cũ (`fiber.alternate.child`).
* *Máy ép la lên:* "À! Props id giống, div giống hệt... Ơ nhưng thẻ text bên trong từ chữ '1' thành chữ '2' nè!". Máy ép liền đóng dấu cái rụp **cờ `UPDATE`** lên trán cái Text Node đó.

### Bước 5: Giao Hàng & Đổi Thân Xác (Commit Phase & Swap)
* WorkLoop duyệt xong, `nextUnitOfWork` lại quay về rỗng `null`. Khởi động cỗ máy `commitRoot()`.
* Cỗ máy lùng gõ toàn bộ nhánh cây WIP, chỗ nào lòi ra cái dấu cờ `UPDATE`, nó móc vào DOM thật: `dom.nodeValue = "2"`. Ngay lúc này, **Mắt người dùng thấy số 1 nhảy thành số 2 trên giao diện.**
* Swap thân xác cuối cùng: `currentRoot = wipRoot`. WIP trở thành vua mới, WIP cũ lùi vào bóng tối đón chờ `setState` lần sau.

---
**Tóm tắt sự kỳ diệu:** 
Việc gọi `setState` bản chất chỉ là hành động **lặng lẽ nhét 1 tờ giấy vào túi** của Fiber Node, rồi đánh thức "bác bảo vệ" (WorkLoop) ở cổng Root. Bác bảo vệ sẽ tự thân vận động sục sạo, tái sử dụng cành lành lặn, nhổ bỏ cành sâu bệnh, vẽ cây nháp mới, thay rễ đổi thân trong thời gian rảnh rỗi mà không làm trình duyệt bị giật (freeze UI). Mọi thứ đều được lên lịch mượt mà!
*/

/*
Cascade, đo đạc TimeDuration), con đường tốt nhất là Tầng 2 (Bám vào Global Hook lấy thông tin Fiber Tree ngầm) 
kết hợp với hàm shallowDiff.

Cứ mỗi một chu kỳ commitRoot là bạn kéo cây đó về, nhét vào Engine phân tích của bạn, rồi trả ra Summary. 
Không block Main Thread, không làm chết ứng dụng của Dev! Bạn thấy hướng đi này thế nào?

*/
