// processMarkdown v0.4.0：CommonMark 嵌套围栏语义
// 防「课件里展示组件示例被误提取」——原单正则会被无语言包裹层击穿
const { test } = require('node:test');
const assert = require('node:assert');
const renderer = require('../template/components/renderer.js');

const QUIZ_JSON = '{"id":"q1","question":"示例题","type":"single","options":[{"id":"a","text":"1"},{"id":"b","text":"2"}],"correct":["b"]}';
const QUIZ_BLOCK = '```quiz\n' + QUIZ_JSON + '\n```';

test('顶层组件块正常提取', () => {
  const { md, components } = renderer.processMarkdown('前文\n' + QUIZ_BLOCK + '\n后文');
  assert.strictEqual(components.length, 1);
  assert.ok(md.includes('<!--SC-COMPONENT-0-->'));
  assert.ok(!md.includes('"question"'), '组件 JSON 应从 md 中移除');
  assert.ok(md.includes('前文') && md.includes('后文'));
});

test('≥4 反引号包裹层保护内部示例（无语言名）', () => {
  const src = '## 示例\n\n````\n' + QUIZ_BLOCK + '\n````\n';
  const { md, components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 0, '包裹层内的 quiz 不应被提取');
  assert.ok(md.includes('```quiz'), '示例文本应原样保留');
});

test('≥4 反引号包裹层带语言名（markdown）同样保护', () => {
  const src = '````markdown\n' + QUIZ_BLOCK + '\n````\n';
  const { md, components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 0);
  assert.ok(md.includes('```quiz'));
});

test('组件围栏 ≥4 反引号视为示例层（不提取）', () => {
  const src = '````quiz\n' + QUIZ_JSON + '\n````\n';
  const { components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 0);
});

test('多个组件按序提取，编号对齐', () => {
  const src = QUIZ_BLOCK + '\n\n```callout\n{"type":"tip","content":"hi"}\n```\n\n' + QUIZ_BLOCK + '\n';
  const { md, components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 3);
  assert.ok(md.includes('<!--SC-COMPONENT-0-->') && md.includes('<!--SC-COMPONENT-2-->'));
});

test('普通代码块（含 info 参数）逐字节透传', () => {
  const src = '```js console.log(1)\nconst a = 1;\n```\n';
  const { md, components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 0);
  assert.strictEqual(md, src, '非组件围栏应原样保留（含 info 参数）');
});

test('组件围栏未闭合 → throw 自描述错误（带行号）', () => {
  assert.throws(
    () => renderer.processMarkdown('前文\n```quiz\n{"id":"q1"}\n'),
    /组件 "quiz"（第 2 行起）缺少闭合围栏/
  );
});

test('单行风格组件（```hero {"json"}）兼容', () => {
  const src = '```hero {"title":"T"}\n```\n';
  const { components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 1);
});

test('quiz-track 数组模式仍走 renderTrack', () => {
  const src = '```quiz-track\n[' + QUIZ_JSON + ']\n```\n';
  const { components } = renderer.processMarkdown(src);
  assert.strictEqual(components.length, 1);
  assert.ok(components[0].includes('quiz-carousel'), '应产出 carousel 结构');
});

test('外层闭合围栏更长时正确匹配（CommonMark 闭合 ≥ 开启）', () => {
  const src = '```js\nconst s = "```";\n`````\n后文\n';
  const { md } = renderer.processMarkdown(src);
  assert.ok(md.includes('后文'), '超长闭合围栏应被消费，不吞掉后续内容');
});
