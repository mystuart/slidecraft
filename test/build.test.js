// build.js 校验逻辑测试
// injectSectionIds（h2 id 注入）+ collectKatexErrors（公式错误收集）
// 这些是 strict 模式（架构债 #4）和 KaTeX 报告（架构债 #3）的核心，回归会破坏教学链路。
const test = require('node:test');
const assert = require('node:assert/strict');
const { injectSectionIds, collectKatexErrors } = require('../build.js');

// ============================================================
// injectSectionIds（给 h2 加 section-N id，返回注入数）
// ============================================================
test('injectSectionIds 给 h2 加顺序 id', () => {
  const { html, count } = injectSectionIds('<h2>甲</h2><p>x</p><h2>乙</h2>');
  assert.equal(count, 2);
  assert.ok(html.includes('<h2 id="section-1">甲</h2>'));
  assert.ok(html.includes('<h2 id="section-2">乙</h2>'));
});

test('injectSectionIds 不动非 h2 标题', () => {
  const { html, count } = injectSectionIds('<h3>小节</h3><h2>章</h2>');
  assert.equal(count, 1);
  assert.ok(!html.includes('id="section-1">小节'));
  assert.ok(html.includes('id="section-1">章'));
});

test('injectSectionIds 空 HTML 返回 0', () => {
  const { html, count } = injectSectionIds('');
  assert.equal(count, 0);
  assert.equal(html, '');
});

test('injectSectionIds 去掉 h2 内层标签做 title', () => {
  // h2 含 <code> 等内层标签，id 应正确加，不影响内层
  const { html, count } = injectSectionIds('<h2>用 <code>fn</code> 调用</h2>');
  assert.equal(count, 1);
  assert.ok(html.includes('<h2 id="section-1">'));
});

// ============================================================
// collectKatexErrors（扫描 katex-error span，架构债 #3 核心）
// ============================================================
test('collectKatexErrors 无错误返回空数组', () => {
  const errors = collectKatexErrors('<p>正常内容</p>');
  assert.deepEqual(errors, []);
});

test('collectKatexErrors 提取错误信息', () => {
  const html = '<span class="katex-error" title="ParseError: Expected group after &#x27;^&#x27;">x^</span>';
  const errors = collectKatexErrors(html);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].msg.includes('ParseError'), '应含 ParseError 信息');
  assert.equal(errors[0].src, 'x^');
});

test('collectKatexErrors 多个错误全部收集', () => {
  const html = '<span class="katex-error" title="ParseError: a">a^</span>'
             + '<span class="katex-error" title="ParseError: b">\\frac{}</span>';
  const errors = collectKatexErrors(html);
  assert.equal(errors.length, 2);
});

test('collectKatexErrors 不误报正常 katex', () => {
  // 正常渲染的 katex 用 class="katex"，不是 "katex-error"
  const html = '<span class="katex">正常公式</span>';
  const errors = collectKatexErrors(html);
  assert.deepEqual(errors, []);
});
