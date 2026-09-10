// processInlineFormulas 标签保护回归：
// 公式替换只允许发生在文本节点——HTML 标签/属性内的 $...$ 必须原样保留。
// 背景 bug：quiz feedback 走 data-属性的时代，属性内 $a = 2 > 0$ 被替换成含双引号的
// KaTeX HTML，把属性撑破、原始属性泄漏为正文（components-showcase 实际发生）。
const { test } = require('node:test');
const assert = require('node:assert');
const renderer = require('../template/components/renderer.js');

test('属性内的 $...$ 不被公式替换（标签保护）', () => {
  const html = '<div data-x="因为 $a = 2 > 0$ 所以向上" data-y="直线 $l$ 与圆">正文</div>';
  const out = renderer.processInlineFormulas(html);
  assert.strictEqual(out, html, '标签/属性内出现 $...$ 时整个文件应原样返回');
});

test('文本节点的 $...$ 正常渲染为 KaTeX', () => {
  const out = renderer.processInlineFormulas('<p>勾股定理 $a^2+b^2=c^2$ 成立。</p>');
  assert.ok(out.includes('katex'), '文本节点公式应渲染出 KaTeX');
  assert.ok(out.includes('成立。'), '正文保留');
});

test('code/pre 内的 $...$ 保持原样（既有行为回归）', () => {
  const html = '<pre><code>const x = "$a$";</code></pre>';
  const out = renderer.processInlineFormulas(html);
  assert.ok(out.includes('$a$'), 'code 内 $ 不应被替换');
  assert.ok(!out.includes('katex'), '不应产生 KaTeX');
});

test('混合场景：属性 + 文本节点同时存在', () => {
  const src = '<span title="$x$">公式 $x^2$ 与 $y^2$</span>';
  const out = renderer.processInlineFormulas(src);
  assert.ok(out.includes('title="$x$"'), '属性原样');
  assert.ok(out.includes('katex'), '文本节点已渲染');
});
