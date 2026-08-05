import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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

function visibleText(markup) {
  return markup
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const learningPages = [
  resolve(root, "index.html"),
  resolve(root, "architecture.html"),
  ...await listHtmlFiles(pagesRoot),
];

test("每个学习页面都有一张与主题关联的静态图表", async () => {
  assert.equal(learningPages.length, 56);

  for (const file of learningPages) {
    const html = await readFile(file, "utf8");
    const diagrams = [...html.matchAll(
      /<figure class="learning-diagram"[\s\S]*?<\/figure>/g,
    )];
    assert.equal(diagrams.length, 1, `${file} 应且仅应包含一张学习图表`);

    const diagram = diagrams[0][0];
    const expectedKey = relative(root, file)
      .replaceAll("\\", "/")
      .replace(/\.html$/, "");
    assert.match(
      diagram,
      new RegExp(`data-diagram-key="${expectedKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
    );

    const heading = visibleText(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "");
    assert.ok(heading, `${file} 缺少可见 h1`);
    assert.match(
      diagram,
      new RegExp(`aria-label="[^"]*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`),
      `${file} 的图表标签没有关联页面主题`,
    );

    const labelledBy = diagram.match(/aria-labelledby="([^"]+)"/)?.[1];
    assert.ok(labelledBy, `${file} 的图表缺少 aria-labelledby`);
    assert.match(diagram, new RegExp(`<figcaption id="${labelledBy}">`));
    assert.equal(
      [...diagram.matchAll(/class="learning-diagram__node"/g)].length,
      3,
      `${file} 的图表必须有三个核心节点`,
    );
    assert.equal(
      [...diagram.matchAll(/class="learning-diagram__connector"/g)].length,
      2,
      `${file} 的图表必须有两条有向关系`,
    );
    const summary = diagram.match(
      /class="learning-diagram__summary">([\s\S]*?)<\/p>/,
    )?.[1];
    assert.ok(visibleText(summary ?? ""), `${file} 的图表摘要不能为空`);
    assert.match(diagram, /class="learning-diagram__thread"><strong>关键线索<\/strong>/);
  }
});

test("两套页面样式都提供窄屏和打印图表布局", async () => {
  for (const name of ["styles.css", "detail.css"]) {
    const css = await readFile(resolve(root, "assets", name), "utf8");
    assert.match(css, /\.learning-diagram\s*\{/);
    assert.match(css, /\.learning-diagram__flow\s*\{/);
    assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\)/);
    assert.match(
      css,
      /@media\s*\(max-width:\s*700px\)[\s\S]*?\.learning-diagram__flow[\s\S]*?grid-template-columns:\s*1fr/,
    );
    assert.match(
      css,
      /@media print[\s\S]*?\.learning-diagram[\s\S]*?break-inside:\s*avoid/,
    );
  }
});
