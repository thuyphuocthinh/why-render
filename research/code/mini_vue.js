// ==========================================
// CƠ SỞ DỮ LIỆU LƯU TRỮ SỰ PHỤ THUỘC (DEPENDENCY TRACKING)
// ==========================================
// Cấu trúc phân tầng: TargetMap( Object => Map( Key => Set( Effects ) ) )
const targetMap = new WeakMap();

// Biến toàn cục lưu "Hàm (Effect) nào đang chạy lúc này?" 
let activeEffect = null;

// ==========================================
// BƯỚC 1: REACTIVE & PROXY (TẠO MẠNG LƯỚI NHỆN)
// ==========================================
function reactive(target) {
  return new Proxy(target, {
    // KHI CÓ NGƯỜI ĐỌC DỮ LIỆU (VD: text = state.name)
    get(target, key, receiver) {
      track(target, key); // 🕵️ GHI SỔ: Ai đang đọc thằng này thế?
      return Reflect.get(target, key, receiver);
    },

    // KHI CÓ NGƯỜI SỬA DỮ LIỆU (VD: state.name = "John")
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      
      // Khác mới báo động, giống thì thôi đỡ tốn công
      if (oldValue !== value) {
        trigger(target, key); // 🚨 BÁO ĐỘNG: Thằng này bị sửa rồi, lôi sổ ra gọi hết lên!
      }
      return result;
    }
  });
}

// ==========================================
// BƯỚC 2: TRACK & TRIGGER (THÔNG BÁO)
// ==========================================
function track(target, key) {
  if (!activeEffect) return;

  // Lấy danh sách hiệu ứng nợ của cái Két Sắt (Target Object)
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // Lấy mảng Set chứa các con nợ của từng cái Ổ Khóa (Key)
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // Viết tên con nợ (activeEffect - hàm render) vào Map
  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    // Gọi từng thằng dậy nhưng không chạy ngay mà vứt vào Lịch Trình (Scheduler)
    dep.forEach((effectFn) => {
      queueJob(effectFn);
    });
  }
}

// Đóng gói hàm Render lại thành "Effect" để cấp giấy thông hành (activeEffect)
function effect(fn) {
  const effectWrapper = () => {
    activeEffect = effectWrapper; // Cấp quyền
    fn();                         // Chạy hàm render (bắt đầu quẹt cái get() của Proxy)
    activeEffect = null;          // Thu hồi quyền
  };
  effectWrapper(); // Kích nổ lần đầu
}

// ==========================================
// BƯỚC 3: SCHEDULER & BATCHING (GOM CỤC TRÁNH SPAM RENDER)
// ==========================================
const queue = new Set();
let isFlushing = false;

// Đẩy Công Việc (Re-render) vào hàng đợi vi mô (Microtask)
function queueJob(job) {
  queue.add(job); // Set tự động loại thẻ trùng lặp!!! (Đỉnh cao Batching)
  
  if (!isFlushing) {
    isFlushing = true;
    Promise.resolve().then(flushJobs); 
  }
}

function flushJobs() {
  for (const job of queue) {
    job(); 
  }
  queue.clear();
  isFlushing = false;
}

// ==========================================
// CHẠY THỬ VUE-REACTIVITY
// ==========================================

console.log("---- BẮT ĐẦU VÍ DỤ VUE REACTIVITY ----\n");

const state = reactive({
  count: 0,
  text: "Hello Vue!"
});

let renderCount = 0;

// Hàm này như là Template của Vue (.vue file) - Gắn Effect
effect(() => {
  renderCount++;
  console.log(`[Vue Render Lần ${renderCount}]: => Text: "${state.text}" | Count: ${state.count}`);
});

console.log(`\n⏳ Spam Update State Count liên tục 10 lần...`);
for (let i = 0; i < 10; i++) {
  state.count++; 
}

console.log(`✅ Kết thúc luồng Sync Script. Nhường quyền cho Promise Microtask (Event Loop)..\n`);
