const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeText,
  matchesCard,
  parseProgress,
  serializeProgress,
} = require("../assets/app.js");

test("关键词比较忽略大小写与首尾空格", () => {
  assert.equal(normalizeText("  MES 主板  "), "mes 主板");
});

test("卡片同时满足关键词、模块和岗位过滤", () => {
  const card = {
    text: "生产执行 主板烧录 固件绑定",
    modules: ["execution", "traceability"],
    roles: ["operator", "developer"],
  };
  assert.equal(
    matchesCard(card, {
      query: "固件",
      module: "execution",
      role: "developer",
    }),
    true,
  );
  assert.equal(
    matchesCard(card, {
      query: "固件",
      module: "quality",
      role: "developer",
    }),
    false,
  );
});

test("损坏的本地进度安全降级为空集合", () => {
  assert.deepEqual(parseProgress("{bad json"), []);
  assert.deepEqual(parseProgress('["sales","quality","sales"]'), [
    "quality",
    "sales",
  ]);
  assert.equal(
    serializeProgress(["quality", "sales"]),
    '["quality","sales"]',
  );
});
