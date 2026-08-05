const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseAcronymDefinition,
  calculateTooltipPosition,
  initializeAcronymTooltips,
} = require("../assets/acronym-tooltip.js");

test("将静态 title 拆成英文全称和中文释义", () => {
  assert.deepEqual(
    parseAcronymDefinition(
      "Manufacturing Execution System｜制造执行系统",
    ),
    {
      english: "Manufacturing Execution System",
      chinese: "制造执行系统",
    },
  );
  assert.deepEqual(parseAcronymDefinition("Industrial PC"), {
    english: "Industrial PC",
    chinese: "",
  });
});

test("tip 优先居中显示在缩写下方", () => {
  assert.deepEqual(
    calculateTooltipPosition(
      { left: 90, right: 130, top: 20, bottom: 40 },
      { width: 120, height: 50 },
      { width: 240, height: 140 },
    ),
    { left: 50, top: 48 },
  );
});

test("下方空间不足时移到上方并限制在视口边缘", () => {
  assert.deepEqual(
    calculateTooltipPosition(
      { left: 0, right: 20, top: 90, bottom: 110 },
      { width: 100, height: 40 },
      { width: 120, height: 120 },
    ),
    { left: 8, top: 42 },
  );
});

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(name) {
    this.values.add(name);
  }

  remove(name) {
    this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(tagName, rect) {
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.classList = new FakeClassList();
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.textContent = "";
    this.parentElement = null;
    this.rect = rect || { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  }

  append(...children) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(
      (child) => child !== this,
    );
    this.parentElement = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  closest(selector) {
    if (selector === "abbr[data-acronym-definition]") {
      let current = this;
      while (current) {
        if (
          current.tagName === "ABBR"
          && current.dataset.acronymDefinition !== undefined
        ) {
          return current;
        }
        current = current.parentElement;
      }
    }
    return null;
  }

  contains(other) {
    if (other === this) return true;
    return this.children.some((child) => child.contains(other));
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

function createTooltipFixture(options) {
  const abbr = new FakeElement("abbr", options.anchorRect);
  abbr.textContent = options.term;
  abbr.setAttribute("title", options.title);
  const body = new FakeElement("body");
  const listeners = new Map();
  const documentRef = {
    body,
    createElement(tagName) {
      return new FakeElement(tagName, options.tooltipRect);
    },
    querySelectorAll(selector) {
      return selector === "abbr[title]" ? [abbr] : [];
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    listenerCount() {
      return listeners.size;
    },
    emit(type, event) {
      listeners.get(type)?.(event);
    },
  };
  const windowListeners = new Map();
  const windowRef = {
    innerWidth: options.viewport.width,
    innerHeight: options.viewport.height,
    addEventListener(type, listener) {
      if (options.failWindowBinding) {
        throw new Error("window binding failed");
      }
      windowListeners.set(type, listener);
    },
    removeEventListener(type) {
      windowListeners.delete(type);
    },
    listenerCount() {
      return windowListeners.size;
    },
  };

  return { abbr, documentRef, windowRef };
}

test("初始化后悬停显示紧凑释义并在离开或 Escape 时隐藏", () => {
  const fixture = createTooltipFixture({
    term: "MES",
    title: "Manufacturing Execution System｜制造执行系统",
    anchorRect: { left: 90, right: 130, top: 20, bottom: 40 },
    tooltipRect: { width: 120, height: 50 },
    viewport: { width: 240, height: 140 },
  });

  const controller = initializeAcronymTooltips(
    fixture.documentRef,
    fixture.windowRef,
  );

  assert.equal(fixture.abbr.getAttribute("title"), null);
  assert.equal(
    fixture.abbr.dataset.acronymDefinition,
    "Manufacturing Execution System｜制造执行系统",
  );
  assert.equal(
    fixture.abbr.getAttribute("aria-label"),
    "MES：Manufacturing Execution System，制造执行系统",
  );

  fixture.documentRef.emit("pointerover", { target: fixture.abbr });
  assert.equal(controller.tooltip.hidden, false);
  assert.deepEqual(
    controller.tooltip.children.map((child) => child.textContent),
    ["Manufacturing Execution System", "制造执行系统"],
  );
  assert.equal(controller.tooltip.style.left, "50px");
  assert.equal(controller.tooltip.style.top, "48px");

  fixture.documentRef.emit("pointerout", {
    target: fixture.abbr,
    relatedTarget: null,
  });
  assert.equal(controller.tooltip.hidden, true);

  fixture.documentRef.emit("pointerover", { target: fixture.abbr });
  fixture.documentRef.emit("keydown", { key: "Escape" });
  assert.equal(controller.tooltip.hidden, true);
});

test("窗口监听器注册失败时恢复静态释义并清理交互残留", () => {
  const fixture = createTooltipFixture({
    term: "MES",
    title: "Manufacturing Execution System｜制造执行系统",
    anchorRect: { left: 90, right: 130, top: 20, bottom: 40 },
    tooltipRect: { width: 120, height: 50 },
    viewport: { width: 240, height: 140 },
    failWindowBinding: true,
  });

  assert.throws(
    () => initializeAcronymTooltips(fixture.documentRef, fixture.windowRef),
    /window binding failed/,
  );
  assert.equal(
    fixture.abbr.getAttribute("title"),
    "Manufacturing Execution System｜制造执行系统",
  );
  assert.equal(fixture.documentRef.body.children.length, 0);
  assert.equal(fixture.documentRef.listenerCount(), 0);
  assert.equal(fixture.windowRef.listenerCount(), 0);
});
