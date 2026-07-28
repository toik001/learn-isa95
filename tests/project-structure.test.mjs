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
