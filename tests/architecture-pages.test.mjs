import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const architectureDirectory = resolve(root, "pages", "architecture");
const expectedNames = [
  "aps.html",
  "eam-cmms.html",
  "edge-gateway.html",
  "erp.html",
  "field-devices.html",
  "historian.html",
  "hmi-andon.html",
  "isa95.html",
  "machine-safety.html",
  "mom-mes.html",
  "ot-security.html",
  "plc.html",
  "plm.html",
  "protocols.html",
  "qms.html",
  "robot-motion.html",
  "scada.html",
  "smart-lock-line.html",
  "test-controller.html",
  "wms.html",
];
const stages = [
  "销售需求",
  "产品与工艺准备",
  "计划排产",
  "物料齐套",
  "生产执行",
  "质量管控",
  "成品入库",
  "发货与追溯",
];

async function assertLocalAcronymTooltipOnly(html, file, expectedSrc) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, `${file} 只能加载一个 tooltip 增强脚本`);
  assert.match(
    scripts[0][1],
    new RegExp(`\\bsrc="${expectedSrc.replaceAll(".", "\\.")}"`),
    `${file} 的 tooltip 脚本路径不正确`,
  );
  assert.equal(scripts[0][2].trim(), "", `${file} 不应包含内联脚本`);
  await assert.doesNotReject(
    access(resolve(dirname(file), expectedSrc)),
    `${file} 的 tooltip 脚本必须是可达本地资源`,
  );
}

test("工业自动化体系包含 20 个独立节点页", async () => {
  const names = (await readdir(architectureDirectory))
    .filter((name) => name.endsWith(".html"))
    .sort();
  assert.deepEqual(names, expectedNames);
});

test("体系总入口链接全部节点并保持静态正文可读", async () => {
  const file = resolve(root, "architecture.html");
  const html = await readFile(file, "utf8");
  const visibleText = html.replace(/<[^>]+>/g, "");
  assert.match(visibleText, /ISA-95 · IT\/OT ARCHITECTURE · 20 NODES/);
  assert.match(visibleText, /ISA-95 的 Level 表达活动和信息边界/);
  assert.match(html, /<abbr title="[A-Za-z][^"]+｜[^"]+">/);
  await assertLocalAcronymTooltipOnly(html, file, "assets/acronym-tooltip.js");
  const links = [...html.matchAll(/href="(pages\/architecture\/[^"]+\.html)"/g)]
    .map((match) => match[1]);
  assert.equal(new Set(links).size, 20);
  for (const link of links) {
    await assert.doesNotReject(access(resolve(root, link)), `缺少节点页 ${link}`);
  }
});

test("节点页具有来源、释义、场景与实现边界", async () => {
  for (const name of expectedNames) {
    const file = resolve(architectureDirectory, name);
    const html = await readFile(file, "utf8");
    assert.match(html, /<html lang="zh-CN">/);
    assert.match(html, /<main id="content" class="content">/);
    assert.match(html, /href="\.\.\/\.\.\/assets\/detail\.css"/);
    assert.match(html, /class="disclaimer"/);
    assert.match(html, /https:\/\//, `${name} 缺少官方或权威来源链接`);
    assert.match(html, /SMART LOCK CASE|智能锁/, `${name} 缺少智能锁场景`);
    assert.match(html, /IMPLEMENTATION|JAVA BOUNDARY|Java/, `${name} 缺少实现边界`);
    assert.match(html, /<abbr title="[A-Za-z][^"]+｜[^"]+">/);
    await assertLocalAcronymTooltipOnly(
      html,
      file,
      "../../assets/acronym-tooltip.js",
    );
  }
});

test("节点页的本地链接和页内锚点均有效", async () => {
  for (const name of expectedNames) {
    const file = resolve(architectureDirectory, name);
    const html = await readFile(file, "utf8");
    const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)]
      .map((match) => match[1]);
    for (const href of hrefs) {
      if (/^https?:\/\//.test(href)) continue;
      if (href.startsWith("#")) {
        assert.match(
          html,
          new RegExp(`\\bid="${href.slice(1)}"`),
          `${name} 包含无效页内锚点 ${href}`,
        );
        continue;
      }
      const [path] = href.split("#");
      await assert.doesNotReject(
        access(resolve(dirname(file), path)),
        `${name} 包含无效本地链接 ${href}`,
      );
    }
  }
});

test("完整 Markdown 底稿包含标准来源、20 节点与固定八阶段", async () => {
  const markdown = await readFile(
    resolve(root, "docs", "industrial-automation-architecture.md"),
    "utf8",
  );
  assert.match(markdown, /ISA-95 \/ IEC 62264/);
  assert.match(markdown, /NIST SP 800-82 Rev\.3/);
  assert.match(markdown, /IEC 61131-3/);
  assert.match(markdown, /ISA\/IEC 62443/);
  assert.match(markdown, /节点 20：智能锁示范线/);
  for (const stage of stages) {
    assert.match(markdown, new RegExp(stage));
  }
});
