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
const stageTerms = [
  ["销售订单", "ATP", "CTP", "产品配置", "订单变更"],
  ["产品版本", "EBOM", "MBOM", "工艺路线", "固件版本"],
  ["MPS", "MRP", "生产工单", "换线", "冻结", "下达"],
  ["备料", "领料", "物料批次", "线边", "替代料", "缺料", "退料"],
  ["派工", "开工", "过站", "绑定", "烧录", "设备采集", "暂停", "返工", "完工"],
  ["IQC", "IPQC", "FQC", "OQC", "首检", "巡检", "功能测试", "不合格", "复验"],
  ["完工交接", "包装", "整锁 SN", "包装箱码", "入库质检", "库位", "库存状态"],
  ["销售出库", "拣配", "复核", "序列号交付", "正向追溯", "反向追溯", "召回", "售后"],
];

const content = await readFile(
  new URL("../docs/mes-domain-map.md", import.meta.url),
  "utf8",
);

function getStageSection(source, index) {
  const start = source.indexOf(`## ${index + 1}. ${stages[index]}`);
  const end = index === stages.length - 1
    ? source.length
    : source.indexOf(`## ${index + 2}. ${stages[index + 1]}`);
  return { start, end, section: source.slice(start, end) };
}

function getDetailSection(stageSection, label) {
  const heading = `### ${label}`;
  const start = stageSection.indexOf(heading);
  assert.ok(start >= 0, `缺少 ${label}`);
  const bodyStart = start + heading.length;
  const next = stageSection.indexOf("\n### ", bodyStart);
  return stageSection.slice(bodyStart, next < 0 ? stageSection.length : next);
}

function countListItems(section, marker) {
  return section
    .split("\n")
    .filter((line) => marker.test(line))
    .length;
}

function assertStageStructure(stageSection, stage, index) {
  assert.match(
    getDetailSection(stageSection, "业务目标"),
    /完成标志/,
    `${stage} 缺少完成标志`,
  );

  const steps = countListItems(
    getDetailSection(stageSection, "业务步骤"),
    /^\d+\. \S/,
  );
  assert.ok(
    steps >= 5 && steps <= 10,
    `${stage} 业务步骤应为 5-10 项，实际 ${steps} 项`,
  );

  const documentRows = getDetailSection(stageSection, "关键单据与字段")
    .split("\n")
    .filter((line) => /^\|.*\|$/.test(line) && !/^\|\s*:?-+/.test(line))
    .slice(1);
  assert.ok(
    documentRows.length >= 4,
    `${stage} 至少需要 4 类关键单据/对象，实际 ${documentRows.length} 类`,
  );

  const stateFlow = getDetailSection(stageSection, "状态流转");
  assert.match(stateFlow, /状态机|状态向量/, `${stage} 缺少状态模型说明`);
  assert.match(stateFlow, /```text[\s\S]*?→[\s\S]*?```/, `${stage} 缺少状态迁移图`);
  assert.ok(
    (stateFlow.match(/→/g) ?? []).length >= 4,
    `${stage} 状态迁移不足，不能表达真实状态机`,
  );

  const example = getDetailSection(stageSection, "智能锁案例");
  assert.match(example, /行业假设示例/, `${stage} 未标明智能锁案例是假设`);

  const boundarySystems = new Set(
    getDetailSection(stageSection, "系统边界").match(
      /\b(?:CRM|ERP|PLM|APS|MES|WMS|QMS|SCADA)\b/g,
    ) ?? [],
  );
  assert.ok(
    boundarySystems.size >= 3,
    `${stage} 系统边界至少需要区分 3 个系统，实际 ${boundarySystems.size} 个`,
  );

  const exception = getDetailSection(stageSection, "异常分支");
  assert.match(exception, /闭环/, `${stage} 未明确异常闭环`);
  assert.ok(
    (exception.match(/→/g) ?? []).length >= 4,
    `${stage} 异常闭环步骤不足`,
  );
  assert.match(
    exception,
    /关闭|结清/,
    `${stage} 异常闭环缺少关闭或结清终点`,
  );

  const metrics = countListItems(
    getDetailSection(stageSection, "关键指标"),
    /^- \S/,
  );
  assert.ok(metrics >= 3, `${stage} 至少需要 3 个关键指标`);

  const mistakes = countListItems(
    getDetailSection(stageSection, "常见误区"),
    /^\d+\. \S/,
  );
  assert.ok(mistakes >= 3, `${stage} 至少需要 3 个常见误区`);

  const concerns = countListItems(
    getDetailSection(stageSection, "Java 全栈开发关注点"),
    /^- \S/,
  );
  assert.ok(concerns >= 3, `${stage} 至少需要 3 个 Java 全栈开发关注点`);

  const questions = countListItems(
    getDetailSection(stageSection, "阶段自测"),
    /^\d+\. \S/,
  );
  assert.ok(questions >= 3, `${stage} 至少需要 3 个阶段自测问题`);

  stageTerms[index].forEach((term) =>
    assert.match(stageSection, new RegExp(term), `${stage} 缺少阶段术语 ${term}`),
  );
}

test("八个阶段都存在且拥有足够正文", () => {
  stages.forEach((stage, index) => {
    const { start, end } = getStageSection(content, index);
    assert.ok(start >= 0, `缺少阶段：${stage}`);
    assert.ok(end - start >= 1500, `${stage} 正文细节不足`);
  });
});

test("每个阶段覆盖统一细节标签", () => {
  stages.forEach((stage, index) => {
    const { section } = getStageSection(content, index);
    detailLabels.forEach((label) =>
      assert.match(section, new RegExp(`### ${label}`), `${stage} 缺少 ${label}`),
    );
  });
});

test("每个阶段包含可执行内容而不是标题与长文本填充", () => {
  stages.forEach((stage, index) => {
    const { section } = getStageSection(content, index);
    assertStageStructure(section, stage, index);
  });
});

test("结构校验能够拒绝用长文本替代可执行步骤", () => {
  const { section } = getStageSection(content, 0);
  const shallowSection = section.replace(
    /### 业务步骤[\s\S]*?(?=\n### 关键单据与字段)/,
    `### 业务步骤\n\n1. 只有一个笼统步骤。${"填充内容".repeat(500)}\n`,
  );
  assert.throws(
    () => assertStageStructure(shallowSection, stages[0], 0),
    /业务步骤应为 5-10 项，实际 1 项/,
  );
});

test("生产完工与最终质量放行使用独立状态", () => {
  const { section } = getStageSection(content, 4);
  const stateFlow = getDetailSection(section, "状态流转");
  assert.match(
    stateFlow,
    /已完工[\s\S]*路线完整[\s\S]*执行数量平衡[\s\S]*无未关闭的执行异常/,
  );
  assert.doesNotMatch(stateFlow, /已完工[^。]*质量可放行/);
  assert.match(stateFlow, /质量状态[^。]*待检\/待放行/);
});

test("成品入库使用包装、物流、质量与账务状态向量", () => {
  const { section } = getStageSection(content, 6);
  const stateFlow = getDetailSection(section, "状态流转");
  ["包装状态", "收货/上架状态", "质量状态", "账务状态"].forEach((dimension) =>
    assert.match(stateFlow, new RegExp(dimension)),
  );
  assert.match(stateFlow, /已上架[\s\S]*待检[\s\S]*待过账/);
});

test("覆盖智能锁数字线程与系统边界", () => {
  [
    "销售订单", "EBOM", "MBOM", "工艺路线", "生产工单", "物料批次",
    "主板", "固件版本", "指纹模组", "整锁 SN", "包装箱码",
    "ERP", "PLM", "MES", "WMS", "QMS",
  ].forEach((term) => assert.match(content, new RegExp(term)));
});

test("生产指标区分工序 FPY 与整路线 RTY", () => {
  const { section } = getStageSection(content, 4);
  const metrics = getDetailSection(section, "关键指标");
  assert.match(metrics, /工序一次通过率 FPY[^。\n]*该工序/);
  assert.match(metrics, /整路线一次通过率 RTY[^。\n]*(?:各工序 FPY|完整路线)/);
  assert.doesNotMatch(metrics, /FPY\s*=\s*无返工一次完成各工序/);
});

test("缺料、重复复验失败和发货重新分配都有返回或终止路径", () => {
  const materialFlow = getDetailSection(
    getStageSection(content, 3).section,
    "状态流转",
  );
  assert.match(
    materialFlow,
    /部分齐套\s*→\s*缺料处理中\/已齐套/,
    "部分齐套必须能够回到缺料处理或进入齐套终点",
  );
  assert.match(
    materialFlow,
    /待重新评审\s*→\s*缺料处理中\/已取消\/已关闭未解决/,
    "未解决缺料必须能够重试、取消或关闭",
  );

  const qualityFlow = getDetailSection(
    getStageSection(content, 5).section,
    "状态流转",
  );
  assert.match(
    qualityFlow,
    /再次不合格\s*→\s*待重新评审\s*→\s*已定处置\/已关闭/,
    "重复复验失败必须回到处置评审或关闭",
  );

  const shippingFlow = getDetailSection(
    getStageSection(content, 7).section,
    "状态流转",
  );
  assert.match(
    shippingFlow,
    /重新分配\s*→\s*待分配\/取消\/已关闭/,
    "发货重新分配必须返回待分配或进入终止状态",
  );
});

test("已分配库存可履行原订单，只有未分配余量可供新订单分配", () => {
  const goal = getDetailSection(
    getStageSection(content, 6).section,
    "业务目标",
  );
  assert.match(goal, /已分配库存[^。]*履行对应订单/);
  assert.match(goal, /未分配[^。]*可供新的销售订单分配/);
  assert.doesNotMatch(goal, /未被分配\/冻结等条件时，库存才可用于销售/);
});
