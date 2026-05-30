// MOCK DOCUMENT CHO TEST TRONG NODEJS CHẠY ĐƯỢC
if (typeof document === "undefined") {
  global.document = {
    createElement: (tag) => {
      const el = { tag, attributes: {}, children: [] };
      el.setAttribute = (k, v) => (el.attributes[k] = v);
      el.addEventListener = () => {};
      el.appendChild = (child) => el.children.push(child);
      return el;
    },
  };
}

// ==========================================
// 1. REACTIVITY SYSTEM (Sử dụng lại hệ thống Phản ứng thu gọn)
// ==========================================
let activeEffect = null;
class Dep {
  constructor() {
    this.subscribers = new Set();
  }
  depend() {
    if (activeEffect) this.subscribers.add(activeEffect);
  }
  notify() {
    this.subscribers.forEach((sub) => sub());
  }
}

const targetMap = new WeakMap();
function getDep(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  return dep;
}

function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      getDep(target, key).depend();
      return target[key];
    },
    set(target, key, value) {
      target[key] = value;
      getDep(target, key).notify();
      return true;
    },
  });
}

function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

// ==========================================
// 2. TẠO VIRTUAL DOM (h function / createElement)
// ==========================================
// Tạo ra cấu trúc Object thay vì viết HTML
function h(tag, props, children) {
  return { tag, props, children };
}

// ==========================================
// 3. RENDER VÀ CẬP NHẬT GIAO DIỆN LÊN REAL DOM
// ==========================================
// Lần đầu gắn vào trang web
function mount(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.tag)); // Tạo thẻ thật và lưu tham chiếu lên vnode

  // Gắn Props
  if (vnode.props) {
    for (const key in vnode.props) {
      el.setAttribute(key, vnode.props[key]);
    }
  }

  // Gắn Children
  if (typeof vnode.children === "string") {
    el.textContent = vnode.children;
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => mount(child, el));
  }

  // Đẩy vào khoang chứa
  container.appendChild(el);
}

// Cập nhật giao diện nếu có thay đổi (Thuật toán Patch/Diff đơn giản)
function patch(n1, n2) {
  // Lấy DOM thật từ vnode cũ chuyển sang vnode mới
  const el = (n2.el = n1.el);

  if (n1.tag === n2.tag) {
    // Nếu cùng Tag, kiểm tra Text bên trong (để code gọn, giả sử children là mảng hoặc string)
    if (typeof n2.children === "string") {
      if (n2.children !== n1.children) {
        console.log(
          `[DOM ĐANG VẼ...]: Đổi text thẻ <${el.tag}> từ "${n1.children}" -> "${n2.children}"`,
        );
        el.textContent = n2.children; // Chỉ sửa Text, không đập bỏ thẻ HTML
      }
    } else {
      // Tình huống cập nhật mảng mảng phức tạp (bỏ qua cho ví dụ ngắn gọn)
      console.log(`[DOM CẬP NHẬT MẢNG... Vòng lặp patch mảng con]`);
    }
  } else {
    // Nếu Đổi Tag (VD: span -> div) => Bỏ cái cũ, ráp cái mới (Phức tạp bỏ qua ở đây)
  }
}

// ==========================================
// 4. KIẾN TRÚC GỘP createApp()
// ==========================================
function createApp(Component) {
  return {
    mount(selector) {
      const isNode =
        typeof document !== "undefined" && document.createElement !== undefined;
      const container = isNode
        ? document.createElement("div")
        : { appendChild: (c) => console.log("Gắn vào ROOT:", c) }; // Mock Root

      let isMounted = false;
      let prevVdom = null;

      // Bọc hàm render của Component bằng Effect để TỰ ĐỘNG Re-render
      effect(() => {
        if (!isMounted) {
          // Lần đầu chạy => Lấy giao diện
          prevVdom = Component.render();
          console.log("\n📦 THU THẬP VDOM LẦN MỘT:", prevVdom);
          // Gắn lên DOM thật
          mount(prevVdom, container);
          isMounted = true;
          console.log("✅ Gắn lên màn hình thành công!");
        } else {
          // Từ lần 2 trở đi (State đổi)
          console.log("\n🚨 STATE THAY ĐỔI! TỰ ĐỘNG CHẠY PATCH QUÁ TRÌNH...");
          const newVdom = Component.render();
          patch(prevVdom, newVdom); // Đè đồ mới lên đồ cũ
          prevVdom = newVdom; // Lưu cũ làm bằng chứng lần sau
        }
      });
    },
  };
}

// ==========================================
// CHẠY THỬ NHƯ VUE THẬT
// ==========================================
const App = {
  // Data là hệ thống Reactive tự động
  data: reactive({
    message: "Vue Xin Chào",
    count: 1,
  }),
  // Render dịch từ Template HTML
  render() {
    return h(
      "div",
      { class: "app" },
      `Nội dung: ${this.data.message} - Lần: ${this.data.count}`,
    );
  },
};

// Start
createApp(App).mount("#app");

// Giả lập Click Button
setInterval(() => {
  App.data.count++; // Tự động trigger Effect render lại!
}, 500);

// Thêm Effect phụ số 2 (Log dữ liệu)
effect(() => {
  console.log(
    `[EFFECT 2]: Á à, tao thấy biến count tự nhiên đổi thành số ${App.data.count} nha!`,
  );
});

// Thêm Effect phụ số 3 (Nhắn báo động)
effect(() => {
  if (App.data.count > 5) {
    console.log(`[EFFECT 3]: Số bự quá 5 rồi, bắn API báo server lẹ!`);
  }
});

/**
reactive state
     ↓
dependency tracking
     ↓
component rerender
     ↓
create new vnode
     ↓
patch(oldVNode, newVNode)
     ↓
update DOM
 */

/**
Rất thú vị vì đối với Vue, bạn Không Cần làm hàm So Sánh Cây DOM mệt nhọc (reconcile diffing) như React. Bạn có 2 cửa ngõ can thiệp cực kỳ tiện:

Cửa ngõ 1: Lifecycle của Component (The Hooks) Bản thân Vue hiểu rất rõ nỗi đau Re-render nên từ bản Vue 3, anh em họ nhà "V" đã đẻ sẵn 2 mảnh Hook "của trời cho" vào nhân thư viện:

onRenderTracked(event): Báo cho bạn chính xác tham chiếu dữ liệu nào gốc đang bị Component này theo dõi.
onRenderTriggered(event): TUYỆT PHẨM LÀ Ở ĐÂY! Khi Component render chớp lên, Hook này báo ra sự kiện chứa nguyên nhân cái gì vừa Trigger. => Why-render chỉ việc làm 1 cái Vue Component Setup Plugin tiêm (inject) 2 cái hook này vào khắp các component. Khi component re-render, bắt cái Event Triggered ra để bắn Log chẩn đoán như Roadmap bạn ghi: "Component Header render lần 2 vì bị thay đổi biến A nè!"
Cửa ngõ 2: The Vue Devtools Global Hook (Cho Profiler xịn) Tương tự React thì Vue cũng phơi bày cái ruột của mình ra cửa sổ Devtools qua biến: __VUE_DEVTOOLS_GLOBAL_HOOK__. Đường ống này có sẵn một loạt sự kiện gọi là emit('perf:start') và emit('perf:end'). => Dựa vào đó bạn móc thẳng lấy mốc thời gian chênh lệch để đo lường con số actualDuration > 16ms chạy cảnh báo đỏ lè cho sếp gõ đầu Team (Như Phase 2.3 trong Docs).

Tới đây là mình đã mổ xẻ rành mạch React vs Vue từ lý thuyết tới thực chiến. Khối kiến thức này đủ để bạn Code mạnh tay vào dự án và tự nhẩm lại luồng của nó. Bạn cảm thấy "nhẹ nhõm" hơn về phần "khoai" mà bạn đề cập trước đó chứ ! 
 */
