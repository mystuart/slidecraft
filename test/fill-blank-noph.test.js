// fill-blank v0.3.1：无占位单空模式 + 缺 answers 报错
const { test } = require('node:test');
const assert = require('node:assert');
const fillBlank = require('../template/components/fill-blank.js');

test('题面无 {{n}} 占位 → 整题一空，输入框附在末尾（v0.3.1 修复）', () => {
  const html = fillBlank.render({
    id: 'f1',
    question: '二进制 1010 等于十进制 __',
    answer: '10',
  });
  assert.ok(html.includes('data-blank-count="1"'), 'blankCount 应为 1');
  assert.strictEqual((html.match(/class="fill-blank-input"/g) || []).length, 1, '应渲染 1 个输入框');
  // escapeHtml 把 " 转成 &quot;（attr 内合法，运行时 getAttribute 解码回 JSON）
  assert.ok(html.includes('data-answers=\'[[&quot;10&quot;]]\''), 'answers 不再被截成 []');
  // 输入框在题面文本之后（末尾追加）
  const q = html.indexOf('二进制 1010 等于十进制');
  const inp = html.indexOf('fill-blank-input');
  assert.ok(q > -1 && inp > q, '输入框应位于题面之后');
});

test('缺 answers/answer → throw 自描述错误', () => {
  assert.throws(
    () => fillBlank.render({ id: 'f2', question: '没有答案的题 {{1}}' }),
    /缺少 answers/u
  );
});

test('多空占位模式行为不变（回归）', () => {
  const html = fillBlank.render({
    id: 'f3',
    question: 'A {{1}} B {{2}}',
    answers: [['a'], ['b']],
  });
  assert.ok(html.includes('data-blank-count="2"'));
  assert.strictEqual((html.match(/class="fill-blank-input"/g) || []).length, 2);
});
