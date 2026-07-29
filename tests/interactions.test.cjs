const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const {
  normalizeText,
  matchesCard,
  parseProgress,
  serializeProgress,
  initializeBrowser,
} = require("../assets/app.js");
const appSource = readFileSync(require.resolve("../assets/app.js"), "utf8");

class FakeClassList {
  constructor(values = []) {
    this.values = new Set(values);
  }

  toggle(name, force) {
    if (force) {
      this.values.add(name);
    } else {
      this.values.delete(name);
    }
  }

  remove(name) {
    this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(options = {}) {
    this.tagName = options.tagName || "DIV";
    this.textContent = options.textContent || "";
    this.dataset = options.dataset || {};
    this.value = options.value || "";
    this.checked = Boolean(options.checked);
    this.open = Boolean(options.open);
    this.classList = new FakeClassList(options.classes);
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.parentElement = null;
    this.closestCard = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type) {
    (this.listeners.get(type) || []).forEach((listener) => listener());
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    if (selector === "span") {
      return this.children.find((child) => child.tagName === "SPAN") || null;
    }
    return null;
  }

  closest(selector) {
    return selector === ".stage-card" ? this.closestCard : null;
  }

  append(...children) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }
}

function createCard(text, modules, roles) {
  return new FakeElement({
    textContent: text,
    dataset: { modules, roles },
    classes: ["stage-card"],
  });
}

function createToggle(stage, card) {
  const toggle = new FakeElement({
    tagName: "INPUT",
    dataset: { stageProgress: stage },
  });
  const label = new FakeElement({ tagName: "LABEL" });
  const labelText = new FakeElement({
    tagName: "SPAN",
    textContent: "标记学完",
  });

  toggle.closestCard = card;
  label.append(toggle, labelText);
  return { toggle, labelText };
}

function createBrowserFixture(options = {}) {
  const cards = [
    createCard(
      "生产执行 主板烧录 固件绑定",
      "mes device",
      "operator developer",
    ),
    createCard("质量管控 检验放行", "mes qms", "quality developer"),
  ];
  const search = new FakeElement({ value: "" });
  const moduleFilter = new FakeElement({ value: "all" });
  const roleFilter = new FakeElement({ value: "all" });
  const processView = new FakeElement({
    dataset: { view: "process" },
    classes: ["view-button", "is-active"],
  });
  const moduleView = new FakeElement({
    dataset: { view: "module" },
    classes: ["view-button"],
  });
  const roleView = new FakeElement({
    dataset: { view: "role" },
    classes: ["view-button"],
  });
  processView.setAttribute("aria-pressed", "true");
  moduleView.setAttribute("aria-pressed", "false");
  roleView.setAttribute("aria-pressed", "false");
  const salesProgress = createToggle("sales", cards[0]);
  const qualityProgress = createToggle("quality", cards[1]);
  const progressToggles = [salesProgress.toggle, qualityProgress.toggle];
  const progressValue = new FakeElement({ textContent: "0 / 2" });
  const viewHint = new FakeElement({ textContent: "默认提示" });
  const details = [
    new FakeElement({ tagName: "DETAILS" }),
    new FakeElement({ tagName: "DETAILS" }),
  ];
  const stageHeading = new FakeElement();
  const root = new FakeElement({ tagName: "HTML" });
  const selectorMap = new Map([
    ["#stage-search", search],
    ["#module-filter", moduleFilter],
    ["#role-filter", roleFilter],
    [".section-heading--stages > p", viewHint],
    ["#progress-summary .progress-summary__value", progressValue],
    [".section-heading--stages", stageHeading],
  ]);
  const viewButtons = [processView, moduleView, roleView];
  const documentRef = {
    documentElement: root,
    querySelector(selector) {
      return options.missingOptional ? null : selectorMap.get(selector) || null;
    },
    querySelectorAll(selector) {
      if (selector === ".stage-card") {
        return cards;
      }
      if (selector === ".stage-card.is-filtered") {
        return cards.filter((card) => card.classList.contains("is-filtered"));
      }
      if (options.missingOptional) {
        return [];
      }
      if (selector === ".view-button[data-view]") {
        return viewButtons;
      }
      if (selector === ".progress-toggle[data-stage-progress]") {
        return progressToggles;
      }
      if (selector === ".stage-card details") {
        return details;
      }
      return [];
    },
    createElement(tagName) {
      return new FakeElement({ tagName: tagName.toUpperCase() });
    },
  };
  const windowRef = {
    localStorage: options.storage || {
      getItem() {
        return null;
      },
      setItem() {},
    },
  };

  if (options.failViewBinding) {
    processView.addEventListener = () => {
      throw new Error("view binding failed");
    };
  }

  return {
    cards,
    search,
    moduleFilter,
    roleFilter,
    viewButtons,
    viewHint,
    progressToggles,
    progressLabels: [salesProgress.labelText, qualityProgress.labelText],
    progressValue,
    details,
    stageHeading,
    root,
    documentRef,
    windowRef,
  };
}

test("关键词比较忽略大小写与首尾空格", () => {
  assert.equal(normalizeText("  MES 主板  "), "mes 主板");
});

test("卡片同时满足关键词、模块和岗位过滤", () => {
  const card = {
    text: "生产执行 主板烧录 固件绑定",
    modules: ["execution", "traceability"],
    roles: ["operator", "developer"],
  };
  assert.equal(
    matchesCard(card, {
      query: "固件",
      module: "execution",
      role: "developer",
    }),
    true,
  );
  assert.equal(
    matchesCard(card, {
      query: "固件",
      module: "quality",
      role: "developer",
    }),
    false,
  );
});

test("损坏的本地进度安全降级为空集合", () => {
  assert.deepEqual(parseProgress("{bad json"), []);
  assert.deepEqual(parseProgress('["sales","quality","sales"]'), [
    "quality",
    "sales",
  ]);
  assert.equal(
    serializeProgress(["quality", "sales"]),
    '["quality","sales"]',
  );
});

test("缺少可选 DOM 元素时正文卡片保持可见", () => {
  const fixture = createBrowserFixture({ missingOptional: true });

  assert.doesNotThrow(() => {
    initializeBrowser(fixture.documentRef, fixture.windowRef);
  });
  assert.equal(
    fixture.cards.some((card) => card.classList.contains("is-filtered")),
    false,
  );
});

test("本地进度读取异常时初始化安全降级", () => {
  const fixture = createBrowserFixture({
    storage: {
      getItem() {
        throw new Error("storage blocked");
      },
      setItem() {},
    },
  });

  assert.doesNotThrow(() => {
    initializeBrowser(fixture.documentRef, fixture.windowRef);
  });
  assert.equal(fixture.progressValue.textContent, "0 / 2");
});

test("本地进度写入异常不阻断当前页面完成态", () => {
  const fixture = createBrowserFixture({
    storage: {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error("storage full");
      },
    },
  });

  initializeBrowser(fixture.documentRef, fixture.windowRef);
  fixture.progressToggles[0].checked = true;
  assert.doesNotThrow(() => {
    fixture.progressToggles[0].emit("change");
  });
  assert.equal(fixture.cards[0].classList.contains("is-complete"), true);
  assert.equal(fixture.progressLabels[0].textContent, "已学完");
  assert.equal(fixture.progressValue.textContent, "1 / 2");
});

test("损坏的已存进度不会破坏浏览器初始化", () => {
  const fixture = createBrowserFixture({
    storage: {
      getItem() {
        return "{bad json";
      },
      setItem() {},
    },
  });

  assert.doesNotThrow(() => {
    initializeBrowser(fixture.documentRef, fixture.windowRef);
  });
  assert.deepEqual(
    fixture.progressToggles.map((toggle) => toggle.checked),
    [false, false],
  );
  assert.equal(fixture.progressValue.textContent, "0 / 2");
});

test("组合筛选后重置会移除全部隐藏状态", () => {
  const fixture = createBrowserFixture();

  initializeBrowser(fixture.documentRef, fixture.windowRef);
  fixture.search.value = "固件";
  fixture.moduleFilter.value = "mes";
  fixture.roleFilter.value = "operator";
  fixture.search.emit("input");
  assert.deepEqual(
    fixture.cards.map((card) => card.classList.contains("is-filtered")),
    [false, true],
  );

  fixture.search.value = "";
  fixture.moduleFilter.value = "all";
  fixture.roleFilter.value = "all";
  fixture.moduleFilter.emit("change");
  assert.deepEqual(
    fixture.cards.map((card) => card.classList.contains("is-filtered")),
    [false, false],
  );
});

test("视角按钮同步按压状态、页面提示和根视角", () => {
  const fixture = createBrowserFixture();

  initializeBrowser(fixture.documentRef, fixture.windowRef);
  fixture.viewButtons[2].emit("click");
  assert.deepEqual(
    fixture.viewButtons.map((button) => button.getAttribute("aria-pressed")),
    ["false", "false", "true"],
  );
  assert.deepEqual(
    fixture.viewButtons.map((button) => button.classList.contains("is-active")),
    [false, false, true],
  );
  assert.equal(
    fixture.viewHint.textContent,
    "岗位视角：使用参与岗位筛选定位职责、交接和开发关注点。",
  );
  assert.equal(fixture.root.dataset.learningView, "role");
});

test("恢复及切换进度会同步存储、卡片、标签和计数", () => {
  const writes = [];
  const fixture = createBrowserFixture({
    storage: {
      getItem() {
        return '["quality"]';
      },
      setItem(key, value) {
        writes.push([key, value]);
      },
    },
  });

  initializeBrowser(fixture.documentRef, fixture.windowRef);
  assert.deepEqual(
    fixture.progressToggles.map((toggle) => toggle.checked),
    [false, true],
  );
  assert.deepEqual(
    fixture.cards.map((card) => card.classList.contains("is-complete")),
    [false, true],
  );
  assert.deepEqual(
    fixture.progressLabels.map((label) => label.textContent),
    ["标记学完", "已学完"],
  );
  assert.equal(fixture.progressValue.textContent, "1 / 2");

  fixture.progressToggles[0].checked = true;
  fixture.progressToggles[0].emit("change");
  assert.deepEqual(writes, [[
    "mes-learning-progress-v1",
    '["quality","sales"]',
  ]]);
  assert.equal(fixture.cards[0].classList.contains("is-complete"), true);
  assert.equal(fixture.progressLabels[0].textContent, "已学完");
  assert.equal(fixture.progressValue.textContent, "2 / 2");
});

test("生成的展开和收起控件操作全部原生详情", () => {
  const fixture = createBrowserFixture();

  initializeBrowser(fixture.documentRef, fixture.windowRef);
  const actions = fixture.stageHeading.children[0];
  assert.deepEqual(
    actions.children.map((button) => button.textContent),
    ["展开全部", "收起全部"],
  );

  actions.children[0].emit("click");
  assert.deepEqual(fixture.details.map((detail) => detail.open), [true, true]);
  actions.children[1].emit("click");
  assert.deepEqual(fixture.details.map((detail) => detail.open), [false, false]);
});

test("初始化中途失败会清理已有的筛选隐藏态", () => {
  const fixture = createBrowserFixture({ failViewBinding: true });
  fixture.moduleFilter.value = "missing-module";

  assert.doesNotThrow(() => {
    initializeBrowser(fixture.documentRef, fixture.windowRef);
  });
  assert.deepEqual(
    fixture.cards.map((card) => card.classList.contains("is-filtered")),
    [false, false],
  );
});

test("CommonJS 导出后不会读取浏览器 DOM", () => {
  const context = { module: { exports: {} } };
  Object.defineProperty(context, "document", {
    get() {
      throw new Error("browser code ran under CommonJS");
    },
  });

  assert.doesNotThrow(() => {
    vm.runInNewContext(appSource, context);
  });
  assert.equal(typeof context.module.exports.initializeBrowser, "function");
});

test("浏览器直接加载脚本会自动初始化交互", () => {
  const fixture = createBrowserFixture();

  vm.runInNewContext(appSource, {
    document: {
      ...fixture.documentRef,
      readyState: "complete",
    },
    window: fixture.windowRef,
  });
  assert.equal(fixture.progressValue.textContent, "0 / 2");
  assert.deepEqual(
    fixture.stageHeading.children[0].children.map(
      (button) => button.textContent,
    ),
    ["展开全部", "收起全部"],
  );
});
