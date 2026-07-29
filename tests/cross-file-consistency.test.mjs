import test from "node:test";
import assert from "node:assert/strict";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const assetsDirectory = resolve(repositoryRoot, "assets");
const resourceAttributePattern = /(?<![\w-])(href|src|poster|srcset)\s*=\s*(["'])([\s\S]*?)\2/gi;

const files = await Promise.all(
  ["AGENTS.md", "docs/mes-domain-map.md", "index.html"].map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  ),
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

function isExcludedResourceReference(value) {
  if (/^file:/i.test(value) || /^[a-z]:[\\/]/i.test(value)) return false;
  return value.startsWith("#")
    || value.startsWith("//")
    || /^[a-z][a-z\d+.-]*:/i.test(value);
}

function normalizeLocalAssetPath(value) {
  const decoded = decodeResourcePath(value);
  const path = decoded.split(/[?#]/, 1)[0];

  assert.ok(path, "本地资源路径不能为空");
  assert.ok(
    !isAbsolute(path) && !/^[a-z]:[\\/]/i.test(path) && !/^file:/i.test(path),
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

function getSrcsetReferences(value) {
  if (/^data:/i.test(value.trim())) return [value.trim()];
  return value
    .split(",")
    .map((entry) => entry.trim().split(/\s+/, 1)[0])
    .filter(Boolean);
}

function collectLocalAssetPaths(html) {
  const paths = [];
  for (const match of html.matchAll(resourceAttributePattern)) {
    const [, attribute, , value] = match;
    const references = attribute.toLowerCase() === "srcset"
      ? getSrcsetReferences(value)
      : [value.trim()];
    references.forEach((reference) => {
      if (!isExcludedResourceReference(reference)) {
        paths.push(normalizeLocalAssetPath(reference));
      }
    });
  }
  const uniquePaths = [...new Set(paths)];
  assert.ok(uniquePaths.length > 0, "至少需要一个本地资源");
  return uniquePaths;
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

test("本地资源提取支持常见属性与两种引号，并拒绝不安全引用", () => {
  const paths = collectLocalAssetPaths(`
    <link href='./assets/styles.css'>
    <script src="assets/app.js"></script>
    <video poster='assets/preview.webp'></video>
    <img srcset="assets/small.webp 1x, ./assets/large.webp 2x">
    <a href="#stage-sales">阶段</a>
    <img src="https://example.test/logo.webp">
    <img src="data:image/svg+xml;base64,PHN2Zz4=">
    <a href="mailto:mes@example.test">联系</a>
    <a href="javascript:void(0)">操作</a>
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
});

test("本地资源校验拒绝不存在的文件", async () => {
  await assert.rejects(
    () => verifyLocalAssets(["assets/not-found.css"]),
    /不存在或不可读取/,
  );
});

test("所有本地页面资源都存在", async () => {
  await verifyLocalAssets(collectLocalAssetPaths(files[2]));
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
