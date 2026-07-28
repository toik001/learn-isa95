# 智能锁 MES 学习助手初始化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 初始化一套面向智能锁离散制造企业的 MES 全流程学习助手，并通过可直接打开的静态 HTML 学习地图展示完整知识。

**Architecture:** 以 `docs/mes-domain-map.md` 作为完整领域知识源，以 `index.html` 提供八阶段端到端学习入口；CSS 和原生 JavaScript 分别负责响应式呈现与本地交互。使用 Node.js 内置测试能力校验文件契约、流程细节、页面结构、交互纯函数和跨文件术语一致性，不引入运行时依赖或构建工具。

**Tech Stack:** Markdown、HTML5、CSS3、原生 JavaScript、Node.js 内置 `node:test`

## Global Constraints

- 内容面向智能锁离散制造与销售企业。
- 主流程固定为：销售需求、产品与工艺准备、计划排产、物料齐套、生产执行、质量管控、成品入库、发货与追溯。
- 每个阶段必须覆盖业务目标、触发条件、前置条件、完成标志、岗位、5–10 个步骤、单据字段、状态、数据关系、系统边界、智能锁案例、异常、指标、误区、开发关注点和自测。
- 页面必须可直接打开，不依赖网络资源、第三方包或构建工具。
- 页面必须支持流程/模块/岗位视角、关键词筛选、详情展开、学习完成标记及 `localStorage` 进度保存。
- 不把未经确认的公司专有流程、字段或接口写成事实。
- `docs/learning-log.md` 记录分析依据、明确假设和内容决策，不记录模型私有逐步思维链。

---

## File Map

- `AGENTS.md`：约束后续学习助手的身份、场景、工作流、内容深度和交付格式。
- `README.md`：项目入口、文件说明、使用与验证说明。
- `docs/learning-log.md`：记录本次初始化的问题、依据、假设、结论和后续学习议题。
- `docs/mes-domain-map.md`：完整的八阶段 MES 领域知识正文。
- `index.html`：语义化静态学习驾驶舱及八阶段页面内容。
- `assets/styles.css`：工业控制台视觉、响应式布局、焦点与动效降级。
- `assets/app.js`：筛选、视角切换、折叠和本地进度逻辑。
- `tests/project-structure.test.mjs`：项目治理文件契约测试。
- `tests/domain-content.test.mjs`：领域文档深度与术语测试。
- `tests/static-page.test.mjs`：HTML/CSS 结构、可访问性和资源路径测试。
- `tests/interactions.test.cjs`：交互纯函数和安全本地存储测试。
- `tests/cross-file-consistency.test.mjs`：八阶段名称跨文件一致性测试。

---

### Task 1: 项目治理与学习记录

**Files:**

- Create: `tests/project-structure.test.mjs`
- Create: `AGENTS.md`
- Create: `README.md`
- Create: `docs/learning-log.md`

**Interfaces:**

- Consumes: 已确认设计 `docs/superpowers/specs/2026-07-28-mes-learning-assistant-design.md`
- Produces: 后续内容必须遵循的八阶段名称、学习助手行为规范和维护流程

- [ ] **Step 1: 编写失败的项目结构测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("学习助手治理文件定义公司场景与交付约束", async () => {
  const agents = await read("AGENTS.md");
  assert.match(agents, /智能锁离散制造与销售/);
  assert.match(agents, /Java 全栈开发/);
  assert.match(agents, /docs\/learning-log\.md/);
  assert.match(agents, /静态 HTML/);
  assert.match(agents, /不得记录.*私有.*思维链/);
});

test("README 与学习记录提供清晰入口", async () => {
  const [readme, log] = await Promise.all([
    read("README.md"),
    read("docs/learning-log.md"),
  ]);
  assert.match(readme, /index\.html/);
  assert.match(readme, /node --test/);
  assert.match(log, /2026-07-28/);
  assert.match(log, /智能锁/);
  assert.match(log, /待确认/);
});
```

- [ ] **Step 2: 运行测试并确认因文件缺失而失败**

Run: `node --test tests/project-structure.test.mjs`

Expected: FAIL，错误中包含 `ENOENT` 和 `AGENTS.md`。

- [ ] **Step 3: 创建治理文件**

`AGENTS.md` 必须使用以下一级结构：

```markdown
# MES 学习助手
## 项目定位
## 学习目标
## 企业与产品场景
## 固定端到端主线
## 助手工作方式
## 内容深度标准
## 记录与产出规则
## 事实、假设与来源
## Java 全栈关注点
## 质量检查
```

其中明确默认中文、智能锁案例、先全局后局部、四层解释法（业务/数据/系统/实现）、更新学习记录后再同步领域文档和静态 HTML，以及不记录模型私有逐步思维链。

`README.md` 说明直接打开 `index.html`、可选本地静态服务、运行 `node --test` 的方法及目录职责。

`docs/learning-log.md` 记录 2026-07-28 初始化条目，包含：

```markdown
### 学习问题
如何为智能锁离散制造与销售场景建立 MES 端到端知识地图？

### 已知背景
- 学习者岗位：Java 全栈开发
- 企业场景：智能锁离散制造与销售

### 分析依据与明确假设
- 首版采用行业通用流程，不代表公司已经采用相同单据、字段和审批。
- MES 为中心，并解释 ERP、PLM、WMS、QMS 与设备系统边界。

### 内容决策
- 使用八阶段端到端数字主线。
- 每阶段使用统一细节模板。
- Markdown 保存完整知识，静态 HTML 提供学习入口。

### 验证与待确认
- 验证八阶段名称、页面交互和跨文件一致性。
- 待确认公司真实组织、系统清单、编码规则、工艺路线和质量标准。
```

- [ ] **Step 4: 运行项目结构测试**

Run: `node --test tests/project-structure.test.mjs`

Expected: PASS，2 个测试全部通过。

- [ ] **Step 5: 提交项目治理文件**

```bash
git add AGENTS.md README.md docs/learning-log.md tests/project-structure.test.mjs
git commit -m "docs: initialize MES learning assistant"
```

---

### Task 2: 八阶段 MES 领域知识

**Files:**

- Create: `tests/domain-content.test.mjs`
- Create: `docs/mes-domain-map.md`

**Interfaces:**

- Consumes: `AGENTS.md` 中的八阶段名称和统一细节标准
- Produces: 页面正文使用的业务术语、数字线程、系统边界和智能锁案例

- [ ] **Step 1: 编写失败的领域内容测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const stages = [
  "销售需求", "产品与工艺准备", "计划排产", "物料齐套",
  "生产执行", "质量管控", "成品入库", "发货与追溯",
];
const detailLabels = [
  "业务目标", "触发与前置", "参与岗位", "业务步骤", "关键单据与字段",
  "状态流转", "数据关系", "系统边界", "智能锁案例", "异常分支",
  "关键指标", "常见误区", "Java 全栈开发关注点", "阶段自测",
];

const content = await readFile(
  new URL("../docs/mes-domain-map.md", import.meta.url),
  "utf8",
);

test("八个阶段都存在且拥有足够正文", () => {
  stages.forEach((stage, index) => {
    const start = content.indexOf(`## ${index + 1}. ${stage}`);
    const end = index === stages.length - 1
      ? content.length
      : content.indexOf(`## ${index + 2}. ${stages[index + 1]}`);
    assert.ok(start >= 0, `缺少阶段：${stage}`);
    assert.ok(end - start >= 1500, `${stage} 正文细节不足`);
  });
});

test("每个阶段覆盖统一细节标签", () => {
  stages.forEach((stage, index) => {
    const start = content.indexOf(`## ${index + 1}. ${stage}`);
    const end = index === stages.length - 1
      ? content.length
      : content.indexOf(`## ${index + 2}. ${stages[index + 1]}`);
    const section = content.slice(start, end);
    detailLabels.forEach((label) =>
      assert.match(section, new RegExp(`### ${label}`), `${stage} 缺少 ${label}`),
    );
  });
});

test("覆盖智能锁数字线程与系统边界", () => {
  [
    "销售订单", "EBOM", "MBOM", "工艺路线", "生产工单", "物料批次",
    "主板", "固件版本", "指纹模组", "整锁 SN", "包装箱码",
    "ERP", "PLM", "MES", "WMS", "QMS",
  ].forEach((term) => assert.match(content, new RegExp(term)));
});
```

- [ ] **Step 2: 运行测试并确认领域文档缺失**

Run: `node --test tests/domain-content.test.mjs`

Expected: FAIL，错误中包含 `ENOENT` 和 `docs/mes-domain-map.md`。

- [ ] **Step 3: 编写完整领域文档**

文档先说明端到端总览、系统职责表和智能锁数字线程，再依次编写八个阶段。每阶段严格使用以下标题：

```markdown
## N. 阶段名称
### 业务目标
### 触发与前置
### 参与岗位
### 业务步骤
### 关键单据与字段
### 状态流转
### 数据关系
### 系统边界
### 智能锁案例
### 异常分支
### 关键指标
### 常见误区
### Java 全栈开发关注点
### 阶段自测
```

八阶段的关键内容分别为：

1. 销售需求：预测与订单、ATP/CTP、产品配置、交期承诺、订单变更。
2. 产品与工艺准备：产品版本、EBOM 到 MBOM、工艺路线、工位参数、检验方案、固件受控。
3. 计划排产：MPS/MRP 输入、工单拆分、产能与换线约束、冻结与下达。
4. 物料齐套：备料、领料、批次、线边仓、替代料、缺料与退料。
5. 生产执行：派工、开工、过站、装配绑定、烧录、设备采集、暂停、返工与完工。
6. 质量管控：IQC/IPQC/FQC/OQC、首检、巡检、功能测试、不合格评审、返工复验。
7. 成品入库：完工交接、包装、SN 与箱码绑定、入库质检、库位与库存状态。
8. 发货与追溯：销售出库、拣配复核、序列号交付、正反向追溯、召回与售后分析。

每阶段至少给出一个状态机示例、一个异常处理闭环、一个智能锁实例、三个指标、三个开发关注点和三个自测问题。

- [ ] **Step 4: 运行领域内容测试**

Run: `node --test tests/domain-content.test.mjs`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 5: 提交领域知识**

```bash
git add docs/mes-domain-map.md tests/domain-content.test.mjs
git commit -m "docs: add smart lock MES domain map"
```

---

### Task 3: 静态学习页面

**Files:**

- Create: `tests/static-page.test.mjs`
- Create: `index.html`
- Create: `assets/styles.css`

**Interfaces:**

- Consumes: `docs/mes-domain-map.md` 的八阶段顺序、术语、案例和系统边界
- Produces: `assets/app.js` 使用的 `data-stage`、`data-modules`、`data-roles`、`.stage-card`、`.view-button` 和 `.progress-toggle` DOM 契约

- [ ] **Step 1: 编写失败的静态页面测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(
  new URL("../assets/styles.css", import.meta.url),
  "utf8",
);
const stages = [
  "sales", "engineering", "planning", "material",
  "execution", "quality", "warehouse", "traceability",
];

test("页面具有语义结构和本地资源", () => {
  assert.match(html, /<html[^>]+lang="zh-CN"/);
  assert.match(html, /<main/);
  assert.match(html, /assets\/styles\.css/);
  assert.match(html, /assets\/app\.js/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("八阶段卡片提供交互数据契约", () => {
  stages.forEach((stage) => {
    assert.match(html, new RegExp(`data-stage="${stage}"`));
  });
  assert.equal((html.match(/class="[^"]*stage-card/g) ?? []).length, 8);
  assert.equal((html.match(/class="[^"]*progress-toggle/g) ?? []).length, 8);
  assert.match(html, /data-modules=/);
  assert.match(html, /data-roles=/);
});

test("样式覆盖响应式与无障碍状态", () => {
  assert.match(css, /:root/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.is-complete/);
  assert.match(css, /\.is-filtered/);
});
```

- [ ] **Step 2: 运行测试并确认页面或样式缺失**

Run: `node --test tests/static-page.test.mjs`

Expected: FAIL，错误包含 `ENOENT` 和 `index.html`。

- [ ] **Step 3: 创建语义化 HTML**

`index.html` 包含：

```html
<header class="hero">企业场景、学习目标、系统边界摘要</header>
<nav class="view-switcher" aria-label="知识地图视角">流程、模块、岗位按钮</nav>
<section class="toolbar">搜索框、模块筛选、岗位筛选、进度摘要</section>
<main id="learning-map">
  <section class="process-track">八阶段跳转导航</section>
  <section class="stage-list">八个详细 stage-card</section>
  <section class="digital-thread">智能锁数字线程</section>
  <section class="system-boundary">六类系统职责表</section>
</main>
```

每个 `.stage-card` 使用稳定英文 `data-stage`，同时提供中文标题、阶段摘要、岗位/单据/状态/系统边界/异常/指标/开发关注点/自测等可见内容。详情使用原生 `<details>`，保证 JavaScript 关闭时仍可阅读。所有按钮具有明确文字，搜索框有 `<label>`。

- [ ] **Step 4: 创建工业控制台响应式样式**

`assets/styles.css` 使用以下设计令牌并实现桌面横向流程、移动端纵向卡片、打印样式和可访问焦点：

```css
:root {
  --ink-950: #101922;
  --ink-800: #1d2a36;
  --steel-600: #526473;
  --paper: #f5f1e8;
  --surface: #fffdf8;
  --line: #d8d2c7;
  --accent: #e7672e;
  --success: #247a58;
  --warning: #b87917;
  --radius: 18px;
  --shadow: 0 18px 50px rgb(16 25 34 / 10%);
}
```

布局不得隐藏核心正文；`.is-filtered` 仅在用户主动筛选时隐藏不匹配卡片；`.is-complete` 清晰显示完成态；`@media (prefers-reduced-motion: reduce)` 禁止非必要动画。

- [ ] **Step 5: 运行静态页面测试**

Run: `node --test tests/static-page.test.mjs`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 6: 提交静态页面**

```bash
git add index.html assets/styles.css tests/static-page.test.mjs
git commit -m "feat: add MES learning map page"
```

---

### Task 4: 筛选、视角与学习进度交互

**Files:**

- Create: `tests/interactions.test.cjs`
- Create: `assets/app.js`

**Interfaces:**

- Consumes: Task 3 的 DOM 数据契约
- Produces: `normalizeText(value)`、`matchesCard(card, filters)`、`parseProgress(raw)`、`serializeProgress(values)`，供浏览器初始化和 Node 测试共同使用

- [ ] **Step 1: 编写失败的交互纯函数测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeText,
  matchesCard,
  parseProgress,
  serializeProgress,
} = require("../assets/app.js");

test("关键词比较忽略大小写与首尾空格", () => {
  assert.equal(normalizeText("  MES 主板  "), "mes 主板");
});

test("卡片同时满足关键词、模块和岗位过滤", () => {
  const card = {
    text: "生产执行 主板烧录 固件绑定",
    modules: ["execution", "traceability"],
    roles: ["operator", "developer"],
  };
  assert.equal(matchesCard(card, {
    query: "固件", module: "execution", role: "developer",
  }), true);
  assert.equal(matchesCard(card, {
    query: "固件", module: "quality", role: "developer",
  }), false);
});

test("损坏的本地进度安全降级为空集合", () => {
  assert.deepEqual(parseProgress("{bad json"), []);
  assert.deepEqual(parseProgress('["sales","quality","sales"]'), [
    "quality", "sales",
  ]);
  assert.equal(serializeProgress(["quality", "sales"]), '["quality","sales"]');
});
```

- [ ] **Step 2: 运行测试并确认模块缺失**

Run: `node --test tests/interactions.test.cjs`

Expected: FAIL，错误包含 `Cannot find module '../assets/app.js'`。

- [ ] **Step 3: 实现纯函数与浏览器初始化**

`assets/app.js` 使用 IIFE，顶部定义并在 CommonJS 环境导出四个纯函数：

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeText,
    matchesCard,
    parseProgress,
    serializeProgress,
  };
}
```

浏览器初始化必须：

- 读取 `.stage-card` 并缓存文字、模块与岗位索引。
- 监听搜索框和两个选择器，组合计算匹配结果。
- 监听三种视角按钮，更新 `aria-pressed` 和页面提示。
- 监听 `.progress-toggle`，同步按钮文字、卡片 `.is-complete` 和进度计数。
- 使用键名 `mes-learning-progress-v1` 读写 `localStorage`。
- 捕获本地存储不可用、JSON 损坏及 DOM 元素缺失，不阻断正文阅读。
- 提供“展开全部”和“收起全部”操作。

- [ ] **Step 4: 运行交互测试和语法检查**

Run: `node --check assets/app.js && node --test tests/interactions.test.cjs`

Expected: 两条命令退出码均为 0，3 个测试全部通过。

- [ ] **Step 5: 提交页面交互**

```bash
git add assets/app.js tests/interactions.test.cjs
git commit -m "feat: add local MES learning interactions"
```

---

### Task 5: 跨文件一致性与最终验证

**Files:**

- Create: `tests/cross-file-consistency.test.mjs`
- Modify: `README.md`
- Modify: `docs/learning-log.md`

**Interfaces:**

- Consumes: 所有治理、领域和页面文件
- Produces: 一条可重复执行的最终验证命令和初始化验收记录

- [ ] **Step 1: 编写跨文件一致性测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = await Promise.all(
  ["AGENTS.md", "docs/mes-domain-map.md", "index.html"].map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  ),
);
const stages = [
  "销售需求", "产品与工艺准备", "计划排产", "物料齐套",
  "生产执行", "质量管控", "成品入库", "发货与追溯",
];

test("治理、领域文档和页面使用同一组阶段名称", () => {
  files.forEach((content, fileIndex) => {
    stages.forEach((stage) =>
      assert.match(content, new RegExp(stage), `文件 ${fileIndex} 缺少 ${stage}`),
    );
  });
});

test("所有本地页面资源都存在", async () => {
  const html = files[2];
  const paths = [...html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)]
    .map((match) => match[1]);
  await Promise.all(paths.map(async (path) => {
    const value = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.ok(value.length > 0, `${path} 不能为空`);
  }));
});
```

- [ ] **Step 2: 运行完整测试集**

Run: `node --check assets/app.js && node --test`

Expected: JavaScript 语法检查通过，所有测试通过且无跳过项。

- [ ] **Step 3: 更新使用说明与学习记录**

在 `README.md` 写明最终验证命令；在 `docs/learning-log.md` 的初始化条目下追加实际验证结果、已实现能力和以下下一步核对清单：

```markdown
- 公司现用 ERP/MES/WMS/QMS/PLM 的产品与集成方式
- 智能锁型号、BOM 和固件版本规则
- 生产组织、车间、产线、工位和班次模型
- SN、批次、包装箱码与销售出库的真实绑定规则
- 首检、巡检、功能测试和不合格品处置标准
```

- [ ] **Step 4: 进行静态交付检查**

Run: `git diff --check && git status --short`

Expected: `git diff --check` 无输出；`git status --short` 只显示本任务计划中的待提交文件。

- [ ] **Step 5: 再次运行最终验证并提交**

Run: `node --check assets/app.js && node --test`

Expected: 所有测试继续通过。

```bash
git add README.md docs/learning-log.md tests/cross-file-consistency.test.mjs
git commit -m "test: verify MES learning assistant"
```
