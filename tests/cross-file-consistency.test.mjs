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

test("使用说明和学习记录约定最终验证与公司确认项", async () => {
  const [readme, log] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/learning-log.md", import.meta.url), "utf8"),
  ]);

  assert.match(readme, /node --check assets\/app\.js && node --test/);
  [
    "公司现用 ERP/MES/WMS/QMS/PLM 的产品与集成方式",
    "智能锁型号、BOM 和固件版本规则",
    "生产组织、车间、产线、工位和班次模型",
    "SN、批次、包装箱码与销售出库的真实绑定规则",
    "首检、巡检、功能测试和不合格品处置标准",
  ].forEach((item) => assert.match(log, new RegExp(item)));
});
