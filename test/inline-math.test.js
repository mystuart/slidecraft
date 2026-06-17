// processInlineFormulas 回归测试（KaTeX CJK 告警修复）
//
// 背景：renderer.processInlineFormulas 的行内 $...$ 正则不识别 $...$ display 分隔符，
// 导致 "（display）$S_n=...$。中文，$O(1)$（inline）" 被串成一个跨段匹配，
// 把中文喂进 KaTeX 触发 unicodeTextInMathMode stderr 告警 + 产生垃圾 katex-error span。
//
// 修复：先剥 $...$ 占位保护，再匹配行内 $...$；KaTeX 调用加 strict:'ignore'。
// 这组测试锁定：display/inline 混排不被错配、中文不进 math mode、display 正确渲染。

const test = require('node:test');
const assert = require('node:assert/strict');
const { processInlineFormulas } = require('../template/components/renderer.js');

test('相邻 display + inline 不串成跨段匹配', () => {
  // 这是 tabs-test.md:21 的原始问题场景
  const html = '$$S_n = \\frac{n(n+1)}{2}$$。直接代入，$O(1)$ 时间复杂度。';
  const out = processInlineFormulas(html);
  // display 公式应渲染成 katex-display 块
  assert.ok(out.includes('katex-display'), 'display 公式应渲染为 katex-display');
  // inline 公式应渲染（非 display）
  assert.ok(out.includes('katex'), 'inline 公式应渲染');
  // 关键：中文「直接代入，」不应被包进任何 katex-error / math span
  assert.ok(!out.includes('katex-error'), '不应产生 katex-error span');
  assert.match(out, /直接代入/);
});

test('纯行内公式正常渲染', () => {
  const out = processInlineFormulas('求 $x^2 + y^2 = r^2$ 的解');
  assert.ok(out.includes('katex'));
  assert.ok(!out.includes('katex-error'));
});

test('纯 display 公式正常渲染', () => {
  const out = processInlineFormulas('$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$');
  assert.ok(out.includes('katex-display'));
  assert.ok(!out.includes('katex-error'));
});

test('不误触 <code> 内的 $ 符号', () => {
  // <code> 块应被保护，内部的 $ 不被当公式
  const html = '价格 <code>$5.00</code> 和变量 $x$';
  const out = processInlineFormulas(html);
  assert.ok(out.includes('<code>$5.00</code>'), 'code 内 $ 应原样保留');
  assert.ok(out.includes('katex'), 'code 外的 $x$ 应渲染');
});

test('空 $...$ 不渲染', () => {
  const out = processInlineFormulas('字面 $$ 文本');
  assert.ok(!out.includes('katex'));
});

test('\\text{中文} 不产生 error span', () => {
  // strict:'ignore' 后，\text{} 内的 CJK 是合法的，不报错也不告警
  const out = processInlineFormulas('$\\text{右准线}\\ x = 4$');
  assert.ok(out.includes('katex'));
  assert.ok(!out.includes('katex-error'));
});
