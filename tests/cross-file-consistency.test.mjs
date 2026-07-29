import test from "node:test";
import assert from "node:assert/strict";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const assetsDirectory = resolve(repositoryRoot, "assets");
const htmlTagPattern = /<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^"'<>])*)>/gi;
const urlAttributePattern = /(?<![\w:-])(xlink:href|href|src|poster|srcset|imagesrcset|srcdoc|action|formaction|data|ping|cite|background|manifest|codebase|archive|classid|longdesc|usemap)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/gi;
const htmlEntityPattern = /(?:&#(?:\d+|x[\da-f]+);?|&[a-z][\da-z]+;)/i;
const resourcePolicies = new Map([
  ["a:href", "page-or-fragment"],
  ["area:href", "fragment"],
  ["link:href", "asset"],
  ["link:imagesrcset", "srcset"],
  ["script:src", "asset"],
  ["img:src", "asset"],
  ["img:srcset", "srcset"],
  ["img:usemap", "fragment"],
  ["source:src", "asset"],
  ["source:srcset", "srcset"],
  ["video:src", "asset"],
  ["video:poster", "asset"],
  ["audio:src", "asset"],
  ["track:src", "asset"],
  ["iframe:src", "asset"],
  ["embed:src", "asset"],
  ["input:src", "asset"],
  ["input:usemap", "fragment"],
  ["object:data", "asset"],
  ["object:usemap", "fragment"],
  ["use:href", "fragment"],
  ["use:xlink:href", "fragment"],
  ["image:href", "asset"],
  ["image:xlink:href", "asset"],
]);

const files = await Promise.all(
  ["AGENTS.md", "docs/mes-domain-map.md", "index.html"].map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  ),
);
const styles = await readFile(
  new URL("../assets/styles.css", import.meta.url),
  "utf8",
);
const stages = [
  "销售需求", "产品与工艺准备", "计划排产", "物料齐套",
  "生产执行", "质量管控", "成品入库", "发货与追溯",
];

function decodeResourcePath(value) {
  let decoded = value;
  for (let count = 0; count < 4; count += 1) {
    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      assert.fail(`资源路径包含无效编码：${value}`);
    }
    if (next === decoded) return decoded;
    decoded = next;
  }
  assert.fail(`资源路径编码层级过深：${value}`);
}

function normalizeLocalAssetPath(value) {
  const decoded = decodeResourcePath(value);
  const path = decoded.split(/[?#]/, 1)[0];

  assert.ok(path, "本地资源路径不能为空");
  assert.ok(!path.startsWith("//"), `禁止协议相对资源：${value}`);
  assert.ok(
    !/^[a-z][a-z\d+.-]*:/i.test(path),
    `禁止 URL 方案资源：${value}`,
  );
  assert.ok(
    !isAbsolute(path) && !/^[a-z]:[\\/]/i.test(path),
    `资源路径不能使用绝对路径：${value}`,
  );
  assert.ok(!path.includes("\\"), `资源路径不能使用反斜杠：${value}`);
  assert.ok(
    !path.split("/").includes(".."),
    `资源路径不能包含路径穿越：${value}`,
  );
  assert.match(path, /^(?:\.\/)?assets\//, `资源必须位于 assets 目录：${value}`);

  const resolved = resolve(repositoryRoot, path);
  const assetRelative = relative(assetsDirectory, resolved);
  assert.ok(
    assetRelative && !assetRelative.startsWith(`..${sep}`) && assetRelative !== ".." && !isAbsolute(assetRelative),
    `资源解析结果不能超出 assets 目录：${value}`,
  );
  return relative(repositoryRoot, resolved).split(sep).join("/");
}

function normalizeCssAssetPath(value, baseDirectory = assetsDirectory) {
  const decoded = decodeResourcePath(value.trim());
  if (decoded.startsWith("#")) return null;
  const path = decoded.split(/[?#]/, 1)[0];

  assert.ok(path, "CSS 本地资源路径不能为空");
  assert.ok(!path.startsWith("//"), `禁止 CSS 协议相对资源：${value}`);
  assert.ok(
    !/^[a-z][a-z\d+.-]*:/i.test(path),
    `禁止 CSS URL 方案资源：${value}`,
  );
  assert.ok(!isAbsolute(path), `CSS 资源路径不能使用绝对路径：${value}`);
  assert.ok(!path.includes("\\"), `CSS 资源路径不能使用反斜杠：${value}`);
  assert.ok(
    !path.split("/").includes(".."),
    `CSS 资源路径不能包含路径穿越：${value}`,
  );

  const resolved = resolve(baseDirectory, path);
  const assetRelative = relative(assetsDirectory, resolved);
  assert.ok(
    assetRelative && !assetRelative.startsWith(`..${sep}`)
      && assetRelative !== ".." && !isAbsolute(assetRelative),
    `CSS 资源解析结果不能超出 assets 目录：${value}`,
  );
  return relative(repositoryRoot, resolved).split(sep).join("/");
}

function getHtmlAttributeValue(attributes, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const valuePattern = "(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'`=<>]+))";
  const match = attributes.match(
    new RegExp(`(?<![\\w:-])${escapedName}\\s*=\\s*${valuePattern}`, "i"),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? "").trim() : null;
}

function getSrcsetReferences(value) {
  return value
    .split(",")
    .map((entry) => entry.trim().split(/\s+/, 1)[0])
    .filter(Boolean);
}

function collectLocalAssetPaths(html) {
  const paths = [];
  for (const tagMatch of html.matchAll(htmlTagPattern)) {
    const tag = tagMatch[1].toLowerCase();
    const attributes = tagMatch[2];
    if (tag === "meta") {
      const httpEquiv = getHtmlAttributeValue(attributes, "http-equiv");
      if (httpEquiv) {
        assert.doesNotMatch(
          httpEquiv,
          htmlEntityPattern,
          "meta[http-equiv] 禁止使用 HTML 实体编码",
        );
        if (httpEquiv.toLowerCase() === "refresh") {
          assert.fail("不支持 meta refresh 活动 URL");
        }
      }
    }

    for (const attributeMatch of attributes.matchAll(urlAttributePattern)) {
      const attribute = attributeMatch[1].toLowerCase();
      const value = (
        attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? ""
      ).trim();
      assert.doesNotMatch(
        value,
        htmlEntityPattern,
        `${tag}[${attribute}] 禁止使用 HTML 实体编码`,
      );
      const policy = resourcePolicies.get(`${tag}:${attribute}`);
      assert.ok(policy, `不支持 ${tag}[${attribute}] 资源引用`);

      if (policy === "page-or-fragment") {
        if (value.startsWith("#")) {
          assert.match(
            value,
            /^#[a-z][\w:.-]*$/i,
            `${tag}[${attribute}] 页内锚点格式无效`,
          );
        } else {
          const decoded = decodeResourcePath(value);
          assert.ok(!decoded.startsWith("//"), `禁止协议相对链接：${value}`);
          assert.ok(
            !/^[a-z][a-z\d+.-]*:/i.test(decoded),
            `禁止 URL 方案链接：${value}`,
          );
          assert.ok(
            !isAbsolute(decoded) && !decoded.includes("\\"),
            `链接不能使用绝对路径或反斜杠：${value}`,
          );
          assert.ok(
            !decoded.split("/").includes(".."),
            `链接不能包含路径穿越：${value}`,
          );
          assert.match(
            decoded,
            /^(?:(?:architecture|glossary)\.html|pages\/(?:stages|modules|roles|systems|topics)\/[a-z][a-z-]*\.html(?:#[a-z][\w:.-]*)?)$/,
            `${tag}[${attribute}] 仅允许页内锚点、总入口或 pages 下的详情页`,
          );
        }
        continue;
      }

      if (policy === "fragment") {
        assert.match(
          value,
          /^#[a-z][\w:.-]*$/i,
          `${tag}[${attribute}] 仅允许页内锚点`,
        );
        continue;
      }

      const references = policy === "srcset"
        ? getSrcsetReferences(value)
        : [value];
      references.forEach((reference) => {
        paths.push(normalizeLocalAssetPath(reference));
      });
    }

    const inlineStyle = getHtmlAttributeValue(attributes, "style");
    if (inlineStyle) {
      assert.doesNotMatch(
        inlineStyle,
        htmlEntityPattern,
        "内联 CSS 禁止使用 HTML 实体编码",
      );
      paths.push(...collectCssAssetPaths(inlineStyle, repositoryRoot));
    }
  }
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    paths.push(...collectCssAssetPaths(match[1], repositoryRoot));
  }
  const uniquePaths = [...new Set(paths)];
  assert.ok(uniquePaths.length > 0, "至少需要一个本地资源");
  return uniquePaths;
}

function collectCssAssetPaths(source, baseDirectory = assetsDirectory) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /\\/, "禁止 CSS 反斜杠转义");
  assert.doesNotMatch(
    css,
    /(?<![\w-])(?:-webkit-)?image-set\s*\(/i,
    "禁止未纳入资源允许列表的 CSS image-set()",
  );
  const references = [];
  const stringImportPattern = /@import(?![\w-])\s*(?!url\s*\()(?:"([^"]*)"|'([^']*)'|([^\s;]+))/gi;
  const urlPattern = /(?<![\w-])url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi;

  for (const match of css.matchAll(stringImportPattern)) {
    references.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  for (const match of css.matchAll(urlPattern)) {
    references.push(match[1] ?? match[2] ?? match[3] ?? "");
  }

  return [...new Set(references
    .map((reference) => normalizeCssAssetPath(reference, baseDirectory))
    .filter(Boolean))];
}

async function verifyLocalAssets(paths) {
  assert.ok(paths.length > 0, "至少需要一个本地资源");
  const resolvedAssetsDirectory = await realpath(assetsDirectory);
  await Promise.all(paths.map(async (path) => {
    const normalized = normalizeLocalAssetPath(path);
    const resolved = resolve(repositoryRoot, normalized);
    let actualPath;
    try {
      actualPath = await realpath(resolved);
    } catch (error) {
      assert.fail(`${normalized} 不存在或不可读取：${error.code ?? error.message}`);
    }
    const assetRelative = relative(resolvedAssetsDirectory, actualPath);
    assert.ok(
      assetRelative && !assetRelative.startsWith(`..${sep}`) && assetRelative !== ".." && !isAbsolute(assetRelative),
      `${normalized} 解析到 assets 目录之外`,
    );
    const value = await readFile(actualPath, "utf8");
    assert.ok(value.length > 0, `${normalized} 不能为空`);
  }));
}

test("治理、领域文档和页面使用同一组阶段名称", () => {
  files.forEach((content, fileIndex) => {
    stages.forEach((stage) =>
      assert.match(content, new RegExp(stage), `文件 ${fileIndex} 缺少 ${stage}`),
    );
  });
});

test("本地资源提取支持常见属性和引号形式，并拒绝不安全引用", () => {
  const paths = collectLocalAssetPaths(`
    <link href='./assets/styles.css'>
    <script src="assets/app.js"></script>
    <video poster='assets/preview.webp'></video>
    <img srcset="assets/small.webp 1x, ./assets/large.webp 2x">
    <a href="#stage-sales">阶段</a>
  `);

  assert.deepEqual(paths, [
    "assets/styles.css",
    "assets/app.js",
    "assets/preview.webp",
    "assets/small.webp",
    "assets/large.webp",
  ]);
  assert.throws(
    () => collectLocalAssetPaths('<script src="assets/../README.md"></script>'),
    /路径穿越/,
  );
  assert.throws(
    () => collectLocalAssetPaths('<img src="assets/%2e%2e/README.md">'),
    /路径穿越/,
  );
  assert.throws(
    () => collectLocalAssetPaths('<img src="/assets/app.js">'),
    /绝对路径/,
  );
  assert.throws(
    () => collectLocalAssetPaths('<a href="#stage-sales">阶段</a>'),
    /至少需要一个本地资源/,
  );
  [
    '<script src="assets/app.js"></script><script src="//cdn.example.test/app.js"></script>',
    '<script src="assets/app.js"></script><img src="https://example.test/logo.webp">',
    '<script src="assets/app.js"></script><img src="data:image/svg+xml;base64,PHN2Zz4=">',
    '<script src="assets/app.js"></script><a href="mailto:mes@example.test">联系</a>',
    '<script src="assets/app.js"></script><a href=javascript:void(0)>操作</a>',
    '<script src="assets/app.js"></script><a href="assets/app.js">伪装资源链接</a>',
    '<script src="assets/app.js"></script><div src="assets/app.js"></div>',
    '<script src="assets/app.js"></script><img src="//evil.example/a>b">',
  ].forEach((fixture) =>
    assert.throws(
      () => collectLocalAssetPaths(fixture),
      /仅允许|禁止|不支持/,
      `必须拒绝不安全或不符合标签语义的引用：${fixture}`,
    ),
  );
});

test("标签属性允许列表拒绝未授权的活动 URL 属性", () => {
  [
    '<script src="assets/app.js"></script><form action="//evil.example/submit"></form>',
    '<script src="assets/app.js"></script><button formaction="javascript:alert(1)">提交</button>',
    '<script src="assets/app.js"></script><object data="//evil.example/payload"></object>',
    '<script src="assets/app.js"></script><meta http-equiv="refresh" content="0;url=//evil.example">',
    '<script src="assets/app.js"></script><meta http-equiv="ref&#x72;esh" content="0;url=//evil.example">',
    '<script src="assets/app.js"></script><meta http-equiv="ref&#114esh" content="0;url=//evil.example">',
    '<script src="assets/app.js"></script><iframe srcdoc="<img src=\'//evil.example/pixel\'>"></iframe>',
    '<script src="assets/app.js"></script><link href="assets/styles.css" imagesrcset="//evil.example/hero.webp 1x">',
  ].forEach((fixture) =>
    assert.throws(
      () => collectLocalAssetPaths(fixture),
      /仅允许|禁止|不支持/,
      `必须拒绝活动 URL 属性：${fixture}`,
    ),
  );
});

test("HTML 内联 CSS 资源使用同一本地允许列表", () => {
  assert.deepEqual(
    collectLocalAssetPaths(`
      <script src="assets/app.js"></script>
      <div style="background-image: url(assets/grid.svg)"></div>
      <style>.mark { mask-image: url(assets/mark.svg); }</style>
    `),
    ["assets/app.js", "assets/grid.svg", "assets/mark.svg"],
  );
  [
    '<script src="assets/app.js"></script><div style="background:url(//evil.example/pixel)"></div>',
    '<script src="assets/app.js"></script><style>@import"//evil.example/theme.css";</style>',
    String.raw`<script src="assets/app.js"></script><style>.probe { background-image: u\72l(//evil.example/pixel); }</style>`,
    '<script src="assets/app.js"></script><div style="background-image:u&#92;72l(//evil.example/pixel)"></div>',
    '<script src="assets/app.js"></script><style>.probe { background-image: image-set("//evil.example/pixel.webp" 1x); }</style>',
  ].forEach((fixture) =>
    assert.throws(
      () => collectLocalAssetPaths(fixture),
      /禁止|路径穿越/,
      `必须拒绝 HTML 内联 CSS 网络资源：${fixture}`,
    ),
  );
});

test("CSS 资源扫描覆盖 url() 与 @import 并拒绝网络或活动方案", () => {
  assert.deepEqual(
    collectCssAssetPaths(`
      @import "print.css";
      .hero { background-image: url("./images/grid.svg"); }
      @font-face { src: url(fonts/console.woff2) format("woff2"); }
    `),
    [
      "assets/print.css",
      "assets/images/grid.svg",
      "assets/fonts/console.woff2",
    ],
  );
  [
    '@import "//cdn.example.test/theme.css";',
    '@import"//cdn.example.test/no-space.css";',
    '@import url("https://example.test/theme.css");',
    '.hero { background: url(data:image/svg+xml;base64,PHN2Zz4=); }',
    '.hero { background: url(javascript:alert(1)); }',
    '.hero { background: url("../README.md"); }',
    String.raw`.probe { background-image: u\72l(//evil.example/pixel); }`,
    '.probe { background-image: image-set("//evil.example/pixel.webp" 1x); }',
  ].forEach((fixture) =>
    assert.throws(
      () => collectCssAssetPaths(fixture),
      /仅允许|禁止|路径穿越/,
      `必须拒绝不安全 CSS 资源：${fixture}`,
    ),
  );
});

test("本地资源校验拒绝不存在的文件", async () => {
  await assert.rejects(
    () => verifyLocalAssets(["assets/not-found.css"]),
    /不存在或不可读取/,
  );
});

test("所有本地页面资源都存在", async () => {
  await verifyLocalAssets([
    ...collectLocalAssetPaths(files[2]),
    ...collectCssAssetPaths(styles),
  ]);
});

test("使用说明和学习记录约定最终验证与公司确认项", async () => {
  const [readme, log] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/learning-log.md", import.meta.url), "utf8"),
  ]);

  assert.match(readme, /node --check assets\/app\.js && node --test/);
  assert.doesNotMatch(log, /\b\d+\s*项测试/, "学习记录不得固化易失真的测试数量");
  [
    "公司现用 ERP/MES/WMS/QMS/PLM 的产品与集成方式",
    "智能锁型号、BOM 和固件版本规则",
    "生产组织、车间、产线、工位和班次模型",
    "SN、批次、包装箱码与销售出库的真实绑定规则",
    "首检、巡检、功能测试和不合格品处置标准",
  ].forEach((item) => assert.match(log, new RegExp(item)));
});
