import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const categories = {
  stages: 8,
  modules: 7,
  roles: 8,
  systems: 6,
  topics: 5,
};
const stageNames = [
  "销售需求",
  "产品与工艺准备",
  "计划排产",
  "物料齐套",
  "生产执行",
  "质量管控",
  "成品入库",
  "发货与追溯",
];

async function detailFiles() {
  const result = [];
  for (const [category, expectedCount] of Object.entries(categories)) {
    const directory = resolve(root, "pages", category);
    const names = (await readdir(directory))
      .filter((name) => name.endsWith(".html"))
      .sort();
    assert.equal(
      names.length,
      expectedCount,
      `${category} 应有 ${expectedCount} 个独立详情页`,
    );
    result.push(...names.map((name) => resolve(directory, name)));
  }
  return result;
}

test("首页链接到全部独立知识分类", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.match(html, /每个入口都有独立详情页/);
  assert.match(html, /pages\/stages\/sales-demand\.html/);
  assert.match(html, /pages\/modules\/work-order\.html/);
  assert.match(html, /pages\/roles\/developer\.html/);
  assert.match(html, /pages\/systems\/mes\.html/);
  assert.match(html, /pages\/topics\/digital-thread\.html/);
  const pageLinks = [...html.matchAll(/\bhref="(pages\/[^"]+\.html)"/g)]
    .map((match) => match[1]);
  for (const pageLink of pageLinks) {
    await assert.doesNotReject(
      access(resolve(root, pageLink)),
      `首页包含无效详情页链接 ${pageLink}`,
    );
  }
});

test("34 个详情页均可独立阅读并使用本地样式", async () => {
  const files = await detailFiles();
  assert.equal(files.length, 34);
  for (const file of files) {
    const html = await readFile(file, "utf8");
    assert.match(html, /<html lang="zh-CN">/);
    assert.match(html, /<main id="content" class="content">/);
    assert.match(html, /href="\.\.\/\.\.\/assets\/detail\.css"/);
    assert.match(html, /class="disclaimer"/);
    assert.doesNotMatch(html, /<script\b/i, `${file} 的核心内容不应依赖 JavaScript`);
    assert.doesNotMatch(html, /https?:\/\//, `${file} 不应依赖外部资源`);
  }
});

test("详情页内部相对链接均指向存在文件或本页锚点", async () => {
  const files = await detailFiles();
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)]
      .map((match) => match[1]);
    for (const href of hrefs) {
      if (href.startsWith("#")) {
        assert.match(
          html,
          new RegExp(`\\bid="${href.slice(1)}"`),
          `${file} 包含无效页内锚点 ${href}`,
        );
        continue;
      }
      const [path] = href.split("#");
      await assert.doesNotReject(
        access(resolve(dirname(file), path)),
        `${file} 包含无效链接 ${href}`,
      );
    }
  }
});

test("八阶段名称在阶段详情页完整出现且顺序一致", async () => {
  const stageDir = resolve(root, "pages", "stages");
  const names = [
    "sales-demand.html",
    "engineering-preparation.html",
    "planning.html",
    "material-kitting.html",
    "production-execution.html",
    "quality-control.html",
    "finished-goods.html",
    "shipping-traceability.html",
  ];
  for (const [index, name] of names.entries()) {
    const html = await readFile(resolve(stageDir, name), "utf8");
    assert.match(html, new RegExp(`<h1>${stageNames[index]}</h1>`));
    assert.match(html, /LAYER 01 · BUSINESS/);
    assert.match(html, /LAYER 02 · DATA/);
    assert.match(html, /LAYER 03 · SYSTEM/);
    assert.match(html, /LAYER 04 · IMPLEMENTATION/);
    assert.match(html, /自测与延伸阅读/);
  }
});
