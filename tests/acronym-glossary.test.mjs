import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesRoot = resolve(root, "pages");

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(path));
    } else if (entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

const learningPages = [
  resolve(root, "index.html"),
  resolve(root, "architecture.html"),
  ...await listHtmlFiles(pagesRoot),
];

test("统一词典解释英文全称、中文含义和命名原因", async () => {
  const html = await readFile(resolve(root, "glossary.html"), "utf8");
  const entries = [...html.matchAll(/<tr><th>[^<]+<\/th><td>/g)];
  assert.equal(entries.length, 95);
  assert.match(html, /ISO 不是首字母缩写/);
  assert.match(html, /最初是 OLE for Process Control/);
  assert.match(html, /现代模型是 Broker 发布\/订阅/);
  assert.match(html, /Modbus（协议专名）/);
  assert.match(html, /为什么这样命名/);
  assert.doesNotMatch(html, /<script\b/i);
});

test("所有学习页提供缩写词典入口和静态语义释义", async () => {
  assert.equal(learningPages.length, 56);
  for (const file of learningPages) {
    const html = await readFile(file, "utf8");
    const expectedHref = relative(root, file).includes("/")
      ? "../../glossary.html"
      : "glossary.html";
    assert.match(
      html,
      new RegExp(`class="acronym-help" href="${expectedHref.replace(".", "\\.")}"`),
      `${file} 缺少统一词典入口`,
    );
    assert.match(html, /<abbr title="[A-Za-z][^"]+｜[^"]+">[^<]+<\/abbr>/);
    for (const match of html.matchAll(/<abbr\b[^>]*>([\s\S]*?)<\/abbr>/gi)) {
      assert.doesNotMatch(match[1], /<abbr\b/i, `${file} 出现嵌套 abbr`);
    }
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
    await assert.doesNotReject(access(resolve(dirname(file), expectedHref)));
  }
});

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

test("高频行业缩写不再以无解释裸文本出现在正文", async () => {
  const highFrequency = [
    "MES", "ERP", "PLM", "WMS", "QMS", "MOM", "APS", "SCADA",
    "PLC", "HMI", "OT", "SN", "BOM", "EBOM", "MBOM", "NCR", "CAPA",
    "WIP", "OPC", "MQTT",
  ];
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(?:${highFrequency.join("|")})(?![A-Za-z0-9])`,
  );
  for (const file of learningPages) {
    const html = await readFile(file, "utf8");
    const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
    const withoutExplainedTerms = body
      .replace(/<abbr\b[^>]*>[\s\S]*?<\/abbr>/gi, "")
      .replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(
      withoutExplainedTerms,
      pattern,
      `${file} 仍存在没有英文全称的高频缩写`,
    );
  }
});

test("两份核心 Markdown 文档都能进入完整缩写词典", async () => {
  for (const name of [
    "mes-domain-map.md",
    "industrial-automation-architecture.md",
  ]) {
    const markdown = await readFile(resolve(root, "docs", name), "utf8");
    assert.match(markdown, /\[MES 与工业自动化英文缩写词典\]\(acronym-glossary\.md\)/);
  }
  const glossary = await readFile(
    resolve(root, "docs", "acronym-glossary.md"),
    "utf8",
  );
  assert.match(glossary, /英文全称/);
  assert.match(glossary, /为什么这样命名/);
  assert.match(glossary, /智能锁场景速查/);
});

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
