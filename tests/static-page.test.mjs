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
