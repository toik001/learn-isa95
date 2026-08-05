# 英文缩写悬浮释义 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全部 MES 学习页面的已有英文缩写增加即时、紧凑、视口内可见的“英文全称 + 中文释义”悬浮 tip。

**Architecture:** 静态 HTML 继续使用 `<abbr title="英文全称｜中文释义">` 提供无 JavaScript 降级；独立脚本在浏览器中渐进增强这些元素，复用单个 tooltip 节点并负责显示、隐藏和定位。标注脚本负责全站资源接入、既有标注更新及与 `glossary.html` 的数据口径一致性，两份现有 CSS 分别承载首页与详情页的同一视觉契约。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node.js CommonJS/ESM、`node:test`、`node:assert`

## Global Constraints

- tip 只显示英文全称和中文释义，不显示“为什么这样命名”、来源链接或智能锁案例。
- 只增强已有 `<abbr>`，不动态推断未登记缩写。
- 释义以 `glossary.html` 的“英文全称”和“中文”两列为准。
- JavaScript 未加载或初始化失败时，静态 `title` 必须继续可用。
- tooltip 不执行远程请求，不依赖服务端接口或第三方库。
- 保留右上角“英文缩写表”入口与完整词典页面结构。
- 不修改八阶段业务内容、系统边界或术语范围。
- 不覆盖或提交工作区中原有的 `docs/learning-log.md` 修改。

---

## File Map

- Create `assets/acronym-tooltip.js`: 解析 `title`、渐进增强 `<abbr>`、复用 tooltip、处理事件和视口定位。
- Create `tests/acronym-tooltip.test.cjs`: 以真实模块 API 验证解析、上下方选择、边缘夹取、显示和隐藏行为。
- Modify `scripts/annotate-acronyms.mjs`: 校准 6 处释义、更新已有 `<abbr>`、注入正确相对路径的脚本引用。
- Modify `tests/acronym-glossary.test.mjs`: 验证全站脚本可达、每个 `<abbr>` 与词典表格一致、两份样式表满足 tooltip 可见性契约。
- Modify `assets/styles.css`: 首页 tooltip 样式。
- Modify `assets/detail.css`: 架构页与详情页 tooltip 样式。
- Modify `index.html`, `architecture.html`, `pages/**/*.html`: 由标注脚本生成资源引用并同步既有 `title`。

### Task 1: Tooltip 交互内核

**Files:**
- Create: `tests/acronym-tooltip.test.cjs`
- Create: `assets/acronym-tooltip.js`

**Interfaces:**
- Produces: `parseAcronymDefinition(value: unknown): { english: string, chinese: string }`
- Produces: `calculateTooltipPosition(anchorRect, tooltipRect, viewport, gap?, padding?): { left: number, top: number }`
- Produces: `initializeAcronymTooltips(documentRef, windowRef): null | { hide(): void, tooltip: Element }`
- Consumes: DOM elements with `title="英文全称｜中文释义"` and `window.innerWidth` / `window.innerHeight`.

- [ ] **Step 1: Write the failing parsing and positioning tests**

Create `tests/acronym-tooltip.test.cjs` with literal expected values:

```js
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
```

Production mutations caught: removing the Chinese split, always placing below, or omitting horizontal clamping changes the literal results.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/acronym-tooltip.test.cjs
```

Expected: FAIL because `assets/acronym-tooltip.js` does not exist.

- [ ] **Step 3: Implement the minimal parsing and positioning API**

Create `assets/acronym-tooltip.js` as a dependency-free CommonJS/browser module. The pure functions must implement this logic:

```js
function parseAcronymDefinition(value) {
  const [english = "", ...chineseParts] = String(value ?? "").split("｜");
  return {
    english: english.trim(),
    chinese: chineseParts.join("｜").trim(),
  };
}

function calculateTooltipPosition(
  anchorRect,
  tooltipRect,
  viewport,
  gap = 8,
  padding = 8,
) {
  const centeredLeft = (
    anchorRect.left + anchorRect.right - tooltipRect.width
  ) / 2;
  const maxLeft = Math.max(padding, viewport.width - tooltipRect.width - padding);
  const left = Math.min(Math.max(centeredLeft, padding), maxLeft);
  const below = anchorRect.bottom + gap;
  const fitsBelow = below + tooltipRect.height <= viewport.height - padding;
  const above = anchorRect.top - tooltipRect.height - gap;
  return {
    left: Math.round(left),
    top: Math.round(fitsBelow ? below : Math.max(padding, above)),
  };
}
```

Expose these functions through `module.exports`; wrap the module so the browser branch does not run when loaded through CommonJS.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/acronym-tooltip.test.cjs
```

Expected: the three tests PASS.

- [ ] **Step 5: Add a failing real interaction test**

Extend `tests/acronym-tooltip.test.cjs` with small DOM-compatible test doubles supporting `createElement`, `append`, attributes, `classList`, `querySelectorAll`, `addEventListener`, `removeEventListener`, and event dispatch. Use one real `<abbr>` fixture:

```js
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
```

The fixture must assert real state on the tooltip and `<abbr>`; it must not assert listener call counts.

- [ ] **Step 6: Run the interaction test and verify RED**

Run:

```bash
node --test tests/acronym-tooltip.test.cjs
```

Expected: FAIL because `initializeAcronymTooltips` does not yet enhance or display elements.

- [ ] **Step 7: Implement delegated tooltip interaction**

In `assets/acronym-tooltip.js`:

- Return `null` when `documentRef.querySelectorAll("abbr[title]")` is empty.
- Create one `div.acronym-tooltip` with `role="tooltip"`, an English child `.acronym-tooltip__english`, and a Chinese child `.acronym-tooltip__chinese`.
- Before removing each DOM `title`, copy it to `abbr.dataset.acronymDefinition` and set `aria-label` to `缩写：英文全称，中文释义`; omit the Chinese comma segment when Chinese is empty.
- Listen on the document for `pointerover`, `pointerout`, and `keydown` so repeated `<abbr>` elements do not receive individual listeners.
- On `pointerover`, resolve the nearest enhanced `ABBR`, populate both children, unhide the tooltip, add `is-visible`, measure it, and apply `calculateTooltipPosition` using the anchor rect and viewport.
- On `pointerout`, hide only when the pointer leaves the active abbreviation rather than moving within it.
- Hide on Escape, window scroll, and window resize.
- Auto-initialize after `DOMContentLoaded` when the browser loads the script; because HTML uses `defer`, the normal path initializes immediately after parsing.
- Keep the CommonJS branch free of browser DOM reads.

- [ ] **Step 8: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/acronym-tooltip.test.cjs
```

Expected: all tooltip unit and interaction tests PASS with no warnings.

- [ ] **Step 9: Commit the interaction component**

```bash
git add assets/acronym-tooltip.js tests/acronym-tooltip.test.cjs
git commit -m "feat: add acronym tooltip interaction"
```

### Task 2: 全站静态接入与词典口径同步

**Files:**
- Modify: `tests/acronym-glossary.test.mjs`
- Modify: `scripts/annotate-acronyms.mjs`
- Modify: `index.html`
- Modify: `architecture.html`
- Modify: `pages/**/*.html`

**Interfaces:**
- Consumes: browser asset `assets/acronym-tooltip.js` created in Task 1.
- Produces: every learning page references that asset with the correct relative path.
- Produces: every generated `<abbr title>` equals `英文全称｜中文释义` from `glossary.html`.

- [ ] **Step 1: Add a failing full-site asset reachability test**

Inside the existing `所有学习页提供缩写词典入口和静态语义释义` loop in `tests/acronym-glossary.test.mjs`, add:

```js
const expectedScriptHref = relative(root, file).includes("/")
  ? "../../assets/acronym-tooltip.js"
  : "assets/acronym-tooltip.js";
assert.match(
  html,
  new RegExp(
    `<script src="${expectedScriptHref.replaceAll(".", "\\.")}" defer><\\/script>`,
  ),
  `${file} 缺少缩写 tooltip 脚本`,
);
await assert.doesNotReject(
  access(resolve(dirname(file), expectedScriptHref)),
);
```

Production mutation caught: omitting the script or using the top-level path inside `pages/` makes a page fail independently.

- [ ] **Step 2: Run the integration test and verify RED**

Run:

```bash
node --test tests/acronym-glossary.test.mjs
```

Expected: FAIL on the first learning page because no tooltip script reference exists.

- [ ] **Step 3: Inject the tooltip script idempotently**

Add to `scripts/annotate-acronyms.mjs`:

```js
function addTooltipScript(html, file) {
  if (html.includes("acronym-tooltip.js")) return html;
  const src = relative(root, file).includes("/")
    ? "../../assets/acronym-tooltip.js"
    : "assets/acronym-tooltip.js";
  return html.replace(
    /<\/head>/,
    `  <script src="${src}" defer></script>\n</head>`,
  );
}
```

Apply it once in the file-processing pipeline after visible-text annotation, then run:

```bash
node scripts/annotate-acronyms.mjs
node --test tests/acronym-glossary.test.mjs
```

Expected: the asset reachability test PASS and the script reports 56 annotated pages.

- [ ] **Step 4: Add a failing glossary-to-annotation consistency test**

Add this test to `tests/acronym-glossary.test.mjs`:

```js
test("所有静态缩写释义与统一词典的英文和中文两列一致", async () => {
  const glossaryHtml = await readFile(resolve(root, "glossary.html"), "utf8");
  const definitions = new Map(
    [...glossaryHtml.matchAll(
      /<tr><th>([^<]+)<\/th><td>([^<]+)<\/td><td>([^<]+)<\/td>/g,
    )].map((match) => [
      match[1].toLowerCase(),
      `${match[2]}｜${match[3]}`,
    ]),
  );

  for (const file of learningPages) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(
      /<abbr\b[^>]*title="([^"]+)"[^>]*>([^<]+)<\/abbr>/gi,
    )) {
      assert.equal(
        match[1],
        definitions.get(match[2].toLowerCase()),
        `${file} 中 ${match[2]} 的释义未与词典对齐`,
      );
    }
  }
});
```

Production mutation caught: changing either English or Chinese copy in the annotator without changing the glossary makes the affected term fail.

- [ ] **Step 5: Run the consistency test and verify RED**

Run:

```bash
node --test tests/acronym-glossary.test.mjs
```

Expected: FAIL on at least one of `IEC 62264`, `ISA-95`, `MQTT`, `PASS`, `FAIL`, or `ISO` because the existing annotator text differs from the table.

- [ ] **Step 6: Align the six definitions and update existing annotations**

Change the six `acronyms` values in `scripts/annotate-acronyms.mjs` to exactly:

```js
["IEC 62264", "Enterprise-control system integration standard series｜企业—控制系统集成标准系列"],
["ISA-95", "ISA standards committee/series 95｜ISA 第 95 委员会/标准系列"],
["MQTT", "Message Queuing Telemetry Transport｜轻量发布/订阅消息协议"],
["PASS", "English word, not an acronym｜通过"],
["FAIL", "English word, not an acronym｜失败"],
["ISO", "International Organization for Standardization｜国际标准化组织"],
```

Add an HTML-title escaping helper and update existing `abbr` elements before annotating new visible text:

```js
function escapeTitle(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}

function synchronizeExistingAnnotations(html) {
  return html.replace(
    /<abbr\b([^>]*)>([^<]+)<\/abbr>/gi,
    (whole, attributes, term) => {
      const definition = acronyms.get(term);
      if (!definition || !/\btitle="[^"]*"/.test(attributes)) return whole;
      const updated = attributes.replace(
        /\btitle="[^"]*"/,
        `title="${escapeTitle(definition)}"`,
      );
      return `<abbr${updated}>${term}</abbr>`;
    },
  );
}
```

Reuse `escapeTitle` in `annotateVisibleText`. Change the pipeline to synchronize the original HTML first, then add the glossary link, annotate new text, and add the tooltip script. Run:

```bash
node scripts/annotate-acronyms.mjs
node --test tests/acronym-glossary.test.mjs
```

Expected: all glossary tests PASS.

- [ ] **Step 7: Verify the generator is idempotent**

Run the generator a second time:

```bash
node scripts/annotate-acronyms.mjs
git diff --check
```

Expected: the second execution reports the same 56 pages, introduces no duplicate script tags or nested `<abbr>`, and `git diff --check` prints nothing.

- [ ] **Step 8: Commit the static integration**

Review `git diff --stat` and confirm it contains only the annotator, glossary tests, and generated learning HTML. Then commit:

```bash
git add scripts/annotate-acronyms.mjs tests/acronym-glossary.test.mjs index.html architecture.html pages
git commit -m "feat: enable acronym tooltips across learning pages"
```

### Task 3: Tooltip 样式与端到端验证

**Files:**
- Modify: `tests/acronym-glossary.test.mjs`
- Modify: `assets/styles.css`
- Modify: `assets/detail.css`

**Interfaces:**
- Consumes: `.acronym-tooltip`, `.acronym-tooltip__english`, `.acronym-tooltip__chinese`, `.is-visible`, and `[hidden]` emitted by Task 1.
- Produces: identical positioning, visibility, non-blocking pointer, and compact two-line styling contracts on homepage and detail pages.

- [ ] **Step 1: Add a failing CSS behavior-contract test**

Add to `tests/acronym-glossary.test.mjs`:

```js
test("首页和详情页样式都让悬浮释义固定、可隐藏且不截获鼠标", async () => {
  for (const name of ["styles.css", "detail.css"]) {
    const css = await readFile(resolve(root, "assets", name), "utf8");
    const base = css.match(/\.acronym-tooltip\s*\{([^}]*)\}/)?.[1] ?? "";
    const hidden = css.match(
      /\.acronym-tooltip\[hidden\]\s*\{([^}]*)\}/,
    )?.[1] ?? "";
    assert.match(base, /position:\s*fixed/);
    assert.match(base, /pointer-events:\s*none/);
    assert.match(base, /max-width:/);
    assert.match(hidden, /display:\s*none/);
    assert.match(css, /\.acronym-tooltip__english\s*\{/);
    assert.match(css, /\.acronym-tooltip__chinese\s*\{/);
    assert.match(css, /\.acronym-tooltip\.is-visible\s*\{/);
  }
});
```

Production mutations caught: returning the tooltip to document flow, intercepting pointer events, allowing unbounded width, or ignoring `hidden` breaks the visible interaction contract.

- [ ] **Step 2: Run the CSS contract test and verify RED**

Run:

```bash
node --test tests/acronym-glossary.test.mjs
```

Expected: FAIL because neither stylesheet defines `.acronym-tooltip`.

- [ ] **Step 3: Add compact tooltip styles to both stylesheets**

Add the following contract to `assets/styles.css` and `assets/detail.css`, keeping the selectors and behavior identical:

```css
.acronym-tooltip {
  position: fixed;
  z-index: 120;
  width: max-content;
  max-width: min(22rem, calc(100vw - 1rem));
  padding: 0.58rem 0.72rem;
  pointer-events: none;
  color: #fff;
  background: rgb(16 25 34 / 96%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 9px;
  box-shadow: 0 8px 24px rgb(16 25 34 / 24%);
  font-size: 0.8rem;
  line-height: 1.38;
  opacity: 0;
  transform: translateY(-0.2rem);
  transition: opacity 100ms ease, transform 100ms ease;
}

.acronym-tooltip.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.acronym-tooltip[hidden] {
  display: none;
}

.acronym-tooltip__english,
.acronym-tooltip__chinese {
  display: block;
}

.acronym-tooltip__english {
  font-weight: 750;
}

.acronym-tooltip__chinese {
  margin-top: 0.12rem;
  color: rgb(255 255 255 / 72%);
}
```

- [ ] **Step 4: Run focused and full automated verification**

Run:

```bash
node --test tests/acronym-tooltip.test.cjs
node --test tests/acronym-glossary.test.mjs
node --test tests/*.test.*
git diff --check
```

Expected: every command exits 0; all tests PASS; `git diff --check` produces no output.

- [ ] **Step 5: Verify desktop and narrow-screen behavior in a browser**

Serve the repository locally:

```bash
python3 -m http.server 4173 --directory .
```

Inspect `http://127.0.0.1:4173/index.html`, `architecture.html`, and one nested page such as `pages/stages/production-execution.html` at desktop and narrow widths. Confirm:

- hovering `MES`, `ERP`, `ISA-95`, and `SN` displays only English full name plus Chinese;
- the tooltip stays inside the left, right, top, and bottom viewport edges;
- moving off the term, scrolling, resizing, and Escape hide it;
- no delayed native tooltip appears on enhanced pages;
- links and cards remain clickable beneath the tooltip;
- with JavaScript disabled, the source `title` still produces the browser fallback.

- [ ] **Step 6: Commit styles and verification contract**

```bash
git add assets/styles.css assets/detail.css tests/acronym-glossary.test.mjs
git commit -m "style: present compact acronym tooltips"
```

## Final Verification

- [ ] Run `git status --short` and confirm `docs/learning-log.md` remains the only pre-existing unrelated modification.
- [ ] Run `node --test tests/*.test.*` once more and report the exact passing test count.
- [ ] Run `git log -4 --oneline` and confirm the design plus three implementation commits are present.
- [ ] Summarize changed behavior, no-JavaScript fallback, glossary synchronization, browser checks, and the untouched learning-log modification in the handoff.
