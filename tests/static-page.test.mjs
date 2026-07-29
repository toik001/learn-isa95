import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(
  new URL("../assets/styles.css", import.meta.url),
  "utf8",
);

const stages = [
  {
    key: "sales",
    modules: ["erp", "mes", "plm"],
    roles: ["sales", "planner", "engineer", "warehouse", "quality"],
    trigger: ["客户下单", "销售订单变更"],
    prerequisite: ["客户/渠道", "产品型号", "配置规则"],
    relationship: ["订单行", "生产工单", "需求分配"],
    fields: ["订单号", "行号", "配置", "承诺日期"],
  },
  {
    key: "engineering",
    modules: ["plm", "erp", "mes", "qms", "device"],
    roles: ["engineer", "quality", "operator"],
    trigger: ["新产品导入", "工程变更"],
    prerequisite: ["物料编码", "工作中心", "人员技能"],
    relationship: ["EBOM 行", "MBOM 行", "工单快照"],
    fields: ["版本", "状态", "生效范围", "来源关系"],
  },
  {
    key: "planning",
    modules: ["erp", "mes", "wms", "qms", "device"],
    roles: ["planner", "engineer", "warehouse", "operator", "quality"],
    trigger: ["销售订单", "预测补库"],
    prerequisite: ["MBOM", "工作中心日历", "库存与在制"],
    relationship: ["MPS", "生产工单", "需求分配"],
    fields: ["来源需求", "产品版本", "数量", "资源"],
  },
  {
    key: "material",
    modules: ["wms", "erp", "mes", "qms", "plm"],
    roles: ["planner", "warehouse", "operator", "quality", "engineer"],
    trigger: ["已下达", "拉动信号"],
    prerequisite: ["MBOM", "库存状态", "替代组"],
    relationship: ["物料需求", "库存批次", "多对多"],
    fields: ["工单", "批次", "容器", "数量"],
  },
  {
    key: "execution",
    modules: ["mes", "device", "qms", "erp", "plm"],
    roles: ["operator", "engineer", "quality", "warehouse"],
    trigger: ["已下达", "开工条件"],
    prerequisite: ["人员资质", "设备校准", "SN 编码"],
    relationship: ["生产工单", "多个整锁 SN", "过站记录"],
    fields: ["人员", "设备", "时间", "版本"],
  },
  {
    key: "quality",
    modules: ["qms", "mes", "wms", "erp", "device"],
    roles: ["quality", "operator", "engineer", "warehouse", "planner"],
    trigger: ["采购到货", "末工序完工"],
    prerequisite: ["检验方案", "抽样标准", "量具校准"],
    relationship: ["检验任务", "触发来源", "NCR"],
    fields: ["样本/SN", "实测值", "规格版本", "批准人"],
  },
  {
    key: "warehouse",
    modules: ["mes", "wms", "erp", "qms"],
    roles: ["operator", "warehouse", "quality", "planner", "sales"],
    trigger: ["末工序完工", "质量放行"],
    prerequisite: ["包装规范", "箱码", "目标仓库"],
    relationship: ["多个 SN", "箱码", "入库单"],
    fields: ["版本", "数量", "库位", "状态"],
  },
  {
    key: "traceability",
    modules: ["erp", "wms", "mes", "qms"],
    roles: ["sales", "warehouse", "quality", "engineer", "planner", "operator"],
    trigger: ["发货通知", "供应商质量通知"],
    prerequisite: ["合格可用库存", "箱码", "制造谱系"],
    relationship: ["出库单", "多个箱码", "客户/渠道"],
    fields: ["订单号/行", "客户", "箱码", "SN"],
  },
];

function getAttribute(attributes, name) {
  return attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function tokens(value) {
  return value.trim().split(/\s+/).sort();
}

function getStageCards() {
  return [...html.matchAll(/<article\b(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/article>/g)]
    .filter(({ groups }) => /\bclass="[^"]*\bstage-card\b[^"]*"/.test(groups.attrs))
    .map(({ groups }) => ({
      attrs: groups.attrs,
      body: groups.body,
      key: getAttribute(groups.attrs, "data-stage"),
    }));
}

function getSectionElement(cardBody, heading) {
  const match = cardBody.match(
    new RegExp(
      `<section(?<attributes>[^>]*)>\\s*<h4>${heading}</h4>(?<content>[\\s\\S]*?)</section>`,
    ),
  );
  assert.ok(match, `缺少 ${heading} 内容块`);
  return match.groups;
}

function getSection(cardBody, heading) {
  return getSectionElement(cardBody, heading).content;
}

function visibleText(markup) {
  return markup
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/gi, " ")
    .replace(/[\s\u00a0\u200b-\u200d\u2060\ufeff]+/g, " ")
    .trim();
}

function getVisibleSectionText(cardBody, heading) {
  const { attributes, content } = getSectionElement(cardBody, heading);
  assert.doesNotMatch(
    attributes,
    /(?:^|\s)hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+))?(?=\s|$)/i,
    `${heading} 内容块不可使用 hidden`,
  );
  assert.doesNotMatch(
    attributes,
    /\baria-hidden\s*=\s*(?:"true"|'true'|true)(?=\s|$)/i,
    `${heading} 内容块不可使用 aria-hidden="true"`,
  );

  const styleMatch = attributes.match(
    /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/i,
  );
  const inlineStyle = styleMatch?.[1] ?? styleMatch?.[2] ?? styleMatch?.[3] ?? "";
  assert.doesNotMatch(
    inlineStyle,
    /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:!important)?\s*(?:;|$)/i,
    `${heading} 内容块不可使用隐藏样式`,
  );

  const text = visibleText(content);
  assert.ok(text, `${heading} 必须包含非空可见文本`);
  return text;
}

function getCssBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.ok(markerIndex >= 0, `CSS 缺少 ${marker}`);
  const openIndex = source.indexOf("{", markerIndex);
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openIndex + 1, index);
  }
  assert.fail(`${marker} 大括号未闭合`);
}

function getCssDeclarations(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
  assert.ok(body, `CSS 缺少 ${selector} 规则`);
  return new Map(
    body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(":");
        assert.ok(separator > 0, `${selector} 包含无效声明 ${declaration}`);
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function parseHex(hex) {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

function relativeLuminance(hex) {
  const channels = parseHex(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
}

test("页面具有语义结构和本地资源", () => {
  assert.match(html, /<html[^>]+lang="zh-CN"/);
  assert.match(html, /<main/);
  assert.match(html, /assets\/styles\.css/);
  assert.match(html, /assets\/app\.js/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("八阶段卡片按顺序提供精确交互数据契约", () => {
  const cards = getStageCards();
  assert.equal(cards.length, stages.length);
  assert.deepEqual(cards.map(({ key }) => key), stages.map(({ key }) => key));

  cards.forEach((card, index) => {
    const expected = stages[index];
    assert.equal(getAttribute(card.attrs, "id"), `stage-${expected.key}`);
    assert.deepEqual(
      tokens(getAttribute(card.attrs, "data-modules")),
      [...expected.modules].sort(),
      `${expected.key} 模块元数据不匹配可见内容`,
    );
    assert.deepEqual(
      tokens(getAttribute(card.attrs, "data-roles")),
      [...expected.roles].sort(),
      `${expected.key} 岗位元数据不匹配可见内容`,
    );
    assert.match(
      card.body,
      new RegExp(
        `<input[^>]+class="[^"]*progress-toggle[^"]*"[^>]+data-stage-progress="${expected.key}"`,
      ),
      `${expected.key} 学习进度键不匹配`,
    );
    assert.match(
      html,
      new RegExp(`<a href="#stage-${expected.key}"`),
      `${expected.key} 缺少内部跳转锚点`,
    );
  });
});

test("每个阶段保留可执行的完整学习结构", () => {
  const cards = getStageCards();

  cards.forEach((card, index) => {
    const expected = stages[index];
    assert.match(card.body, /业务目标\s*\/\s*完成标志/);
    const goal = card.body.match(
      /<p class="stage-summary">([\s\S]*?)<\/p>/,
    )?.[1];
    assert.ok(goal, `${expected.key} 缺少业务目标正文`);
    assert.match(goal, /完成标志/, `${expected.key} 缺少完成标志`);

    const trigger = getSection(card.body, "触发");
    const prerequisite = getSection(card.body, "前置条件");
    const relationship = getSection(card.body, "数据关系");
    expected.trigger.forEach((term) =>
      assert.match(trigger, new RegExp(term), `${expected.key} 触发缺少 ${term}`),
    );
    expected.prerequisite.forEach((term) =>
      assert.match(
        prerequisite,
        new RegExp(term),
        `${expected.key} 前置条件缺少 ${term}`,
      ),
    );
    expected.relationship.forEach((term) =>
      assert.match(
        relationship,
        new RegExp(term),
        `${expected.key} 数据关系缺少 ${term}`,
      ),
    );

    const steps = card.body.match(
      /<ol class="step-list">([\s\S]*?)<\/ol>/,
    )?.[1];
    assert.ok(steps, `${expected.key} 缺少业务步骤`);
    const stepCount = (steps.match(/<li>/g) ?? []).length;
    assert.ok(
      stepCount >= 5 && stepCount <= 10,
      `${expected.key} 业务步骤应为 5–10 项，实际 ${stepCount} 项`,
    );

    const documents = getSection(card.body, "关键单据与字段");
    expected.fields.forEach((term) =>
      assert.match(
        documents,
        new RegExp(term),
        `${expected.key} 单据字段缺少 ${term}`,
      ),
    );

    assert.match(
      card.body,
      /<h4>(?:参考状态机|正交状态向量)<\/h4>/,
      `${expected.key} 缺少状态模型`,
    );
    assert.ok(
      getVisibleSectionText(card.body, "关键岗位"),
      `${expected.key} 关键岗位必须可见且非空`,
    );
    [
      "系统边界",
      "典型异常",
      "指标",
      "常见误区",
      "实现关注点",
      "自测",
    ]
      .forEach((heading) =>
        assert.ok(
          getSection(card.body, heading).trim().length > 0,
          `${expected.key} ${heading} 不能为空`,
        ),
      );
    assert.match(
      card.body,
      /<aside class="example-box">[\s\S]*?<span>智能锁案例<\/span>[\s\S]*?<p>[\s\S]+?<\/p>/,
      `${expected.key} 缺少智能锁案例`,
    );
    assert.match(
      card.body,
      /<summary>Java 开发关注点与阶段自测<\/summary>/,
      `${expected.key} 缺少 Java 开发关注点`,
    );
  });
});

test("样式覆盖响应式、状态与可访问颜色", () => {
  assert.match(css, /:root/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.stage-card\.is-complete/);
  assert.match(css, /\.stage-card\.is-filtered/);
  assert.match(css, /--accent:\s*#e7672e/);

  const accentText = css.match(/--accent-text:\s*(#[0-9a-f]{6})/i)?.[1];
  assert.ok(accentText, "缺少可访问的深色强调文本令牌");
  ["#f5f1e8", "#fffdf8", "#ffffff"].forEach((background) =>
    assert.ok(
      contrastRatio(accentText, background) >= 4.5,
      `${accentText} 与 ${background} 的对比度不足 4.5:1`,
    ),
  );
  assert.doesNotMatch(
    css,
    /^\s*color:\s*var\(--accent\);\s*$/m,
    "小号文字不可直接使用对比度不足的 --accent",
  );
  [".section-kicker", ".stage-system", ".step-list li::before"].forEach(
    (selector) =>
      assert.match(
        css,
        new RegExp(
          `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{[^}]*color:\\s*var\\(--accent-text\\)`,
        ),
        `${selector} 应使用 --accent-text`,
      ),
  );
  assert.match(
    css,
    /\.system-code\s*\{[^}]*color:\s*#fff;[^}]*background:\s*var\(--accent-text\)/,
  );
});

test("打印样式展开详情并让系统表适配纵向纸张", () => {
  const printCss = getCssBlock(css, "@media print");
  const detailContent = getCssDeclarations(
    printCss,
    ".detail-stack details > *:not(summary)",
  );
  assert.equal(
    detailContent.get("display"),
    "block",
    "打印时必须显式展开 details 正文",
  );
  assert.match(
    printCss,
    /\.table-wrap\s*\{[^}]*overflow:\s*visible;/,
    "打印时表格容器不应横向裁切",
  );
  assert.match(
    printCss,
    /table\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/,
    "打印表格必须取消 770px 最小宽度",
  );
  assert.match(
    printCss,
    /th,\s*td\s*\{[^}]*overflow-wrap:\s*anywhere;/,
    "打印单元格需要允许长标识换行",
  );
});
