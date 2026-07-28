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
