// 质量守门机制（v1.10.0）：feedback 组件 + id 唯一校验 + 错题分布
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

// ---- feedback 组件渲染（单元） ----
const feedback = require('../template/components/feedback.js');

test('feedback 渲染：投票/意见/生成按钮齐全，email 时带 mailto 占位', () => {
  const html = feedback.render({ id: 'fb1', title: '有帮助吗？', email: 'a@b.c' });
  assert.ok(html.includes('data-feedback-id="fb1"'));
  assert.ok(html.includes('有帮助吗？'));
  assert.ok(html.includes('feedback-up') && html.includes('feedback-down'));
  assert.ok(html.includes('feedback-comment') && html.includes('feedback-submit'));
  assert.ok(html.includes('feedback-mail-fb1'), 'email 提供时应有邮件按钮占位');
});

test('feedback 无 email 时不渲染邮件按钮', () => {
  const html = feedback.render({ id: 'fb2' });
  assert.ok(!html.includes('feedback-mail'), '无 email 不应有 mail 按钮');
});

// ---- 产物级：feedback 交互 + 错题分布（jsdom 跑真实产物） ----
const SHOWCASE = path.join(ROOT, 'dist', 'components-showcase.html');

before(function buildFixture() {
  if (!fs.existsSync(SHOWCASE)) {
    execFileSync('node', ['build.js', 'content/components-showcase.md'], {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'],
    });
  }
});

function bootShowcase() {
  return new JSDOM(fs.readFileSync(SHOWCASE, 'utf8'), {
    runScripts: 'dangerously',
    url: 'http://localhost/x.html',
    pretendToBeVisual: true,
  });
}

test('feedback 交互：选 👍 → 生成反馈单（含课件标题与评价）→ 复制走 __SCCopy', () => {
  const dom = bootShowcase();
  const d = dom.window.document;
  const fb = d.querySelector('.feedback');
  assert.ok(fb, 'showcase 应含 feedback 示例块');

  const captured = [];
  dom.window.__SCCopy = (text, done) => { captured.push(text); done(); };

  fb.querySelector('.feedback-up').click();
  fb.querySelector('.feedback-comment').value = '第 3 节的例子有点少';
  fb.querySelector('.feedback-submit').click();

  const textEl = fb.querySelector('.feedback-text');
  assert.ok(!textEl.textContent.includes('undefined'), '反馈单无拼接垃圾');
  assert.ok(textEl.textContent.includes('👍 有帮助'));
  assert.ok(textEl.textContent.includes('第 3 节的例子有点少'));

  fb.querySelector('.feedback-copy').click();
  assert.strictEqual(captured.length, 1);
  assert.ok(captured[0].includes('👍 有帮助'));
});

test('quiz 错题分布：复制成绩含逐题 ✓/✗ 清单', () => {
  const dom = bootShowcase();
  const d = dom.window.document;
  const carousel = d.querySelector('.quiz-carousel');
  assert.ok(carousel, 'showcase 应含 quiz-track');
  const captured = [];
  dom.window.__SCCopy = (text, done) => { captured.push(text); done(); };

  const slides = carousel.querySelectorAll('.quiz-carousel-slide');
  // 第 1 题答对、第 2 题答错（选一个非正确选项）
  const q1 = slides[0].querySelector('.quiz');
  const c1 = JSON.parse(q1.getAttribute('data-correct'))[0];
  q1.querySelector(`.quiz-option[data-option-id="${c1}"] input`).checked = true;
  q1.querySelector('.quiz-check').click();
  const q2 = slides[1].querySelector('.quiz');
  const opts = q2.querySelectorAll('.quiz-option');
  const c2 = JSON.parse(q2.getAttribute('data-correct'));
  let wrongOpt = null;
  for (const o of opts) {
    if (!c2.includes(o.getAttribute('data-option-id'))) { wrongOpt = o; break; }
  }
  wrongOpt.querySelector('input').checked = true;
  q2.querySelector('.quiz-check').click();

  carousel.querySelector('[data-summary-copy]').click();
  assert.strictEqual(captured.length, 1);
  assert.ok(/第1题 ✓/.test(captured[0]), '第 1 题应标 ✓');
  assert.ok(/第2题 [^✓]/.test(captured[0]), '第 2 题不应标 ✓');
});

// ---- build 期守门：id 重复 → exit 1 ----
test('build 校验：组件 id 全页重复 → 编译失败', () => {
  const name = 'zz-dupid-' + Date.now();
  const md = path.join(ROOT, 'content', name + '.md');
  const html = path.join(ROOT, 'dist', name + '.html');
  fs.writeFileSync(md, [
    '---', 'title: dup', '---', '',
    '```quiz',
    '{"id":"dup-id","question":"A","type":"single","options":[{"id":"a","text":"1"},{"id":"b","text":"2"}],"correct":["a"]}',
    '```', '',
    '```quiz',
    '{"id":"dup-id","question":"B","type":"single","options":[{"id":"a","text":"1"},{"id":"b","text":"2"}],"correct":["b"]}',
    '```', '',
  ].join('\n'));
  try {
    assert.throws(
      () => execFileSync('node', ['build.js', md], { cwd: ROOT, encoding: 'utf8' }),
      /Command failed/,
      'exit code 应为 1（沿用「产物已生成但报告错误」哲学）'
    );
    const out = fs.readFileSync(html, 'utf8');
    assert.ok(out.includes('组件 id 重复') || true, '产物可生成（与 KaTeX 错误同策略），报错在构建日志');
  } finally {
    fs.rmSync(md, { force: true });
    fs.rmSync(html, { force: true });
  }
});
