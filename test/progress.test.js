// 学习进度持久化（localStorage）集成测试
// 用真实产物 dist/binary-card-trick.html（含 quiz / quiz-track / fill-blank）跑 clientJs：
//   1. 首次加载 → 作答 → localStorage 写入
//   2. 二次加载 → 自动恢复（反馈可见 / 提交钮禁用 / 值回填 / 判分态重放 / 题组状态恢复）
//   3. 重做 → 进度清除
// 夹具是 .gitignore 的编译产物：before 钩子里先 build（~0.5s），新 clone 直接 npm test 也能跑，
// 且永远测「当前代码构建出的产物」，不会吃到陈旧 dist 的假信号。
// jsdom 的 localStorage 不跨实例共享，用 beforeParse 把上一会话的 storage 预置进下一会话，
// 模拟「同一浏览器刷新/重开同一课件」。
// jsdom 无 IntersectionObserver / WebGL，相关代码均有 guard，不会阻断本测试路径。
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FIXTURE_OUT = path.join(ROOT, 'dist', 'binary-card-trick.html');

let HTML;
before(function buildFixture() {
  execFileSync('node', ['build.js', 'content/binary-card-trick.md'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  HTML = fs.readFileSync(FIXTURE_OUT, 'utf8');
});
const URL = 'http://localhost/courseware/binary-card-trick.html';

function snapshotStorage(dom) {
  const out = {};
  const ls = dom.window.localStorage;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    out[k] = ls.getItem(k);
  }
  return out;
}

function boot(seed) {
  return new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: URL,
    pretendToBeVisual: true,
    beforeParse(window) {
      if (seed) {
        for (const [k, v] of Object.entries(seed)) {
          try { window.localStorage.setItem(k, v); } catch (e) {}
        }
      }
    },
  });
}

test('quiz 作答 → 重载恢复判分态，重做清除', () => {
  // --- 第一次会话：答一道单选 ---
  const dom1 = boot();
  const d1 = dom1.window.document;
  const quiz = d1.querySelector('.quiz[data-quiz-id]:not(.quiz-carousel .quiz)');
  assert.ok(quiz, '页面应有独立单题 quiz');
  const correct = JSON.parse(quiz.getAttribute('data-correct'));
  quiz.querySelector(`.quiz-option[data-option-id="${correct[0]}"] input`).checked = true;
  quiz.querySelector('.quiz-check').click();
  assert.ok(!quiz.querySelector('.quiz-feedback').hidden, '提交后反馈可见');

  const key = 'sc-progress:' + '/courseware/binary-card-trick.html' + ':quiz:' + quiz.getAttribute('data-quiz-id');
  assert.strictEqual(dom1.window.localStorage.getItem(key), JSON.stringify({ sel: correct, done: true }));

  // --- 第二次会话：自动恢复 ---
  const dom2 = boot(snapshotStorage(dom1));
  const quiz2 = dom2.window.document.querySelector(`.quiz[data-quiz-id="${quiz.getAttribute('data-quiz-id')}"]`);
  assert.ok(!quiz2.querySelector('.quiz-feedback').hidden, '重载后反馈应恢复可见');
  assert.ok(quiz2.querySelector('.quiz-check').disabled, '重载后提交钮应保持禁用（已作答）');
  assert.ok(
    quiz2.querySelector(`.quiz-option[data-option-id="${correct[0]}"]`).classList.contains('is-correct'),
    '重载后正确选项应标绿'
  );

  // --- 重做 → 清除 → 再重载不恢复 ---
  quiz2.querySelector('.quiz-reset').click();
  const dom3 = boot(snapshotStorage(dom2));
  const quiz3 = dom3.window.document.querySelector(`.quiz[data-quiz-id="${quiz.getAttribute('data-quiz-id')}"]`);
  assert.ok(quiz3.querySelector('.quiz-feedback').hidden, '重做并重载后不应恢复旧作答');
});

test('fill-blank（无占位单空）输入值保存 + 判分态恢复', () => {
  const dom1 = boot();
  const d1 = dom1.window.document;
  const fb = d1.querySelector('.fill-blank[data-fillblank-id]');
  assert.ok(fb, '页面应有 fill-blank 组件');
  const answers = JSON.parse(fb.getAttribute('data-answers'));
  assert.strictEqual(answers.length, 1, '无占位单空模式应有 1 组答案（v0.3.1 修复前是 []）');
  const input = fb.querySelector('.fill-blank-input');
  assert.ok(input, '无占位单空模式应渲染输入框（v0.3.1 修复前是 0 个）');
  input.value = answers[0][0]; // 填入正确答案
  input.dispatchEvent(new dom1.window.Event('input', { bubbles: true }));
  fb.querySelector('.fill-blank-submit').click();
  assert.ok(input.classList.contains('is-correct'), '提交后应标绿');

  // --- 重载：判分态恢复 ---
  const dom2 = boot(snapshotStorage(dom1));
  const fbR = dom2.window.document.querySelector(`.fill-blank[data-fillblank-id="${fb.getAttribute('data-fillblank-id')}"]`);
  const inputR = fbR.querySelector('.fill-blank-input');
  assert.strictEqual(inputR.value, answers[0][0], '重载后输入值应回填');
  assert.ok(inputR.classList.contains('is-correct'), '重载后判分态（is-correct）应重放');
});

test('quiz-track 全组答完 → 重载恢复每题状态与进度轴', () => {
  const dom1 = boot();
  const d1 = dom1.window.document;
  const carousel = d1.querySelector('.quiz-carousel');
  assert.ok(carousel, 'binary-card-trick 应含 quiz-track');
  const total = parseInt(carousel.getAttribute('data-total'), 10);
  // 逐题全部答对
  carousel.querySelectorAll('.quiz').forEach((q) => {
    const correct = JSON.parse(q.getAttribute('data-correct'));
    correct.forEach((cid) => {
      q.querySelector(`.quiz-option[data-option-id="${cid}"] input`).checked = true;
    });
    q.querySelector('.quiz-check').click();
  });
  assert.strictEqual(carousel.getAttribute('data-summary-state'), 'hidden', '未点完成不弹总结');

  // --- 重载：每题状态恢复 ---
  const dom2 = boot(snapshotStorage(dom1));
  const c2 = dom2.window.document.querySelector('.quiz-carousel');
  const answeredSlides = c2.querySelectorAll('.quiz-carousel-slide:not([data-slide-status="default"])');
  assert.strictEqual(answeredSlides.length, total, '重载后每题 slide 状态应恢复');
  const dots = c2.querySelector('.quiz-carousel-dots');
  assert.strictEqual(
    dots.style.getPropertyValue('--quiz-progress-width'), '100%',
    '进度轴应走满'
  );
});

test('复制成绩按钮存在于题组完成态（jsdom 走 execCommand 回退不抛错）', () => {
  const dom = boot();
  const d = dom.window.document;
  const btn = d.querySelector('[data-summary-copy]');
  assert.ok(btn, 'summary 应含复制成绩按钮');
  assert.strictEqual(btn.textContent.trim(), '📋 复制成绩');
  btn.click(); // 不应抛异常
});
