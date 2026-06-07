/**
 * @component fill-blank
 * @version 0.2.0
 * @status 打磨完成
 *
 * 填空题组件（单空 / 多空）
 *
 * 字段：
 *   - id          {string}                必填 · 题目 ID
 *   - question    {string}                必填 · 题面，用 {{1}} {{2}} 标记多空位置（单空可省略占位，整题一个空）
 *   - answers     {Array<string|Array>}   推荐 · 多空答案数组。位置 i 对应题面 {{i+1}}。每项是 string（唯一答案）或 string[]（等价集合）。
 *                                          兼容：长度 1 时等同单空。
 *   - answer      {string}                兼容 · 旧字段，"a|b|c" 形式自动转 answers（"a|b" 视为 ["a","b"]，"a" 视为 ["a"]）。
 *   - hint        {string}                可选 · 提示文案
 *   - placeholder {string}                可选 · 输入框占位符（默认"____"）
 *   - mode        {'reveal'|'practice'}   可选 · 答错时是否显示 hint/答案。默认 'reveal'，'practice' 答错只显示对错。
 *
 * 比对规则：不区分大小写、忽略首尾空格；按位置独立判 ✓ / ✗。
 *
 * v0.2.0 变更：
 *   - 支持多空（{{1}} {{2}} 占位 + answers 数组）
 *   - 每空独立等价集合（answers: [["x","X"], ["3.14","π"]]）
 *   - 全空全对显示进度条 + "3/3 ✓"；部分对显示 "2/3 ✓" + 标 ✗ 的空
 *   - 字段向后兼容：旧 answer: "H|O" 写法自动转
 *
 * 已知问题：题面 {{n}} 占位会被 marked 当成普通文本，processInline 不解析 — 当前在 render 时把 {{n}} 替换成 <input> 节点规避。
 */

const { escapeHtml } = require('./_inline.js');


function normalizeBlanksSpec(question, answers) {
  // 找题面里所有 {{1}} {{2}} ...
  const placeholders = [];
  const re = /\{\{(\d+)\}\}/g;
  let m;
  while ((m = re.exec(question)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > placeholders.length) placeholders.push(n);
  }
  // 排序去重
  const unique = Array.from(new Set(placeholders)).sort((a, b) => a - b);
  const blankCount = unique.length;

  // answers 数组归一化：每项是 string[]（等价集合）
  let normAnswers;
  if (Array.isArray(answers)) {
    normAnswers = answers.map(a => Array.isArray(a) ? a.map(String) : [String(a)]);
  } else {
    normAnswers = [[String(answers)]];
  }

  // 多空但 answers 只有 1 项 → 复制该等价集合到所有空（兼容旧 "answer": "H|O" 写法）
  if (blankCount > 1 && normAnswers.length === 1) {
    normAnswers = Array(blankCount).fill(null).map(() => normAnswers[0].slice());
  }

  // 长度对齐：少补空字符串（判 ✗），多截断
  while (normAnswers.length < blankCount) normAnswers.push(['']);
  if (normAnswers.length > blankCount) normAnswers = normAnswers.slice(0, blankCount);

  return { blankCount, normAnswers, re };
}

function render(data) {
  const id = data.id || ('f-' + Math.random().toString(36).slice(2, 8));
  const question = data.question || '';
  const hint = data.hint || '';
  const placeholder = data.placeholder || '在此输入答案';
  const mode = data.mode === 'practice' ? 'practice' : 'reveal';
  const { blankCount, normAnswers, re } = normalizeBlanksSpec(question, data.answers !== undefined ? data.answers : data.answer);

  // 把 {{n}} 替换成 <input class="fill-blank-input" data-blank-idx="n">
  // 题面其余文字走 escapeHtml 防 XSS
  const questionHtml = escapeHtml(question).replace(re, (_, n) => {
    const idx = parseInt(n, 10) - 1;
    return `<input class="fill-blank-input" type="text" data-blank-idx="${idx}" placeholder="${escapeHtml(placeholder)}" autocomplete="off">`;
  });

  const controlsHtml = blankCount > 1 ? `
    <div class="fill-blank-progress">
      <span class="fill-blank-progress-text">已完成</span>
      <div class="fill-blank-progress-track">
        <div class="fill-blank-progress-bar" data-progress="0"></div>
      </div>
      <span class="fill-blank-progress-count" data-done="0" data-total="${blankCount}">0 / ${blankCount}</span>
    </div>
  ` : '';

  return `<div class="fill-blank${blankCount > 1 ? ' fill-blank-multi' : ''}" data-fillblank-id="${escapeHtml(id)}" data-answers='${escapeHtml(JSON.stringify(normAnswers))}' data-mode="${mode}" data-blank-count="${blankCount}">
  <div class="fill-blank-question">${questionHtml}</div>
  ${controlsHtml}
  <div class="fill-blank-input-row">
    <button class="fill-blank-submit" type="button">检查</button>
    <button class="fill-blank-reset" type="button">重做</button>
  </div>
  <div class="fill-blank-feedback"></div>
  ${hint ? `<div class="fill-blank-hint" hidden>${escapeHtml(hint)}</div>` : ''}
  <div class="fill-blank-answer" hidden>${escapeHtml(normAnswers.map(arr => arr[0] || '').join(' | '))}</div>
</div>`;
}

const clientJs = `
document.querySelectorAll('.fill-blank').forEach(function(fb) {
  var answers = JSON.parse(fb.getAttribute('data-answers') || '[]');
  var mode = fb.getAttribute('data-mode') || 'reveal';
  var blankCount = parseInt(fb.getAttribute('data-blank-count'), 10) || 1;
  var inputs = fb.querySelectorAll('.fill-blank-input');
  var submit = fb.querySelector('.fill-blank-submit');
  var reset = fb.querySelector('.fill-blank-reset');
  var feedback = fb.querySelector('.fill-blank-feedback');
  var hint = fb.querySelector('.fill-blank-hint');
  var answer = fb.querySelector('.fill-blank-answer');
  var countEl = fb.querySelector('.fill-blank-progress-count');
  var barEl = fb.querySelector('.fill-blank-progress-bar');

  function normalize(s) {
    return String(s || '').trim().toLowerCase();
  }

  function showAnswer() {
    if (mode === 'practice') {
      if (hint) hint.hidden = true;
      if (answer) answer.hidden = true;
    } else {
      if (hint) hint.hidden = false;
      if (answer) answer.hidden = false;
    }
  }

  function hideAnswer() {
    if (hint) hint.hidden = true;
    if (answer) answer.hidden = true;
  }

  function updateProgress() {
    if (blankCount <= 1) return;
    var done = 0;
    inputs.forEach(function(inp) { if (inp.classList.contains('is-correct')) done++; });
    if (countEl) countEl.textContent = done + ' / ' + blankCount;
    if (countEl) countEl.dataset.done = String(done);
    if (barEl) barEl.style.width = (blankCount > 0 ? (done / blankCount * 100) : 0) + '%';
    if (barEl) barEl.dataset.progress = String(done);
  }

  function clearMarks() {
    inputs.forEach(function(inp) { inp.classList.remove('is-correct', 'is-wrong'); });
  }

  function check() {
    var hasAny = false;
    var correctCount = 0;
    inputs.forEach(function(inp) {
      var v = normalize(inp.value);
      if (!v) {
        inp.classList.remove('is-correct', 'is-wrong');
        return;
      }
      hasAny = true;
      var idx = parseInt(inp.getAttribute('data-blank-idx'), 10);
      var alts = (answers[idx] || []);
      var ok = alts.some(function(a) { return normalize(a) === v; });
      inp.classList.remove('is-correct', 'is-wrong');
      inp.classList.add(ok ? 'is-correct' : 'is-wrong');
      if (ok) correctCount++;
    });
    if (!hasAny) {
      clearMarks();
      feedback.className = 'fill-blank-feedback';
      feedback.innerHTML = '';
      hideAnswer();
      updateProgress();
      return;
    }
    feedback.className = 'fill-blank-feedback';
    if (blankCount > 1) {
      if (correctCount === blankCount) {
        feedback.innerHTML = '<span class="fill-blank-ok">✓ ' + correctCount + ' / ' + blankCount + '</span>';
        hideAnswer();
      } else {
        feedback.innerHTML = '<span class="fill-blank-partial">' + correctCount + ' / ' + blankCount + ' （标红的空答错了）</span>';
        showAnswer();
      }
    } else {
      var only = inputs[0];
      if (only.classList.contains('is-correct')) {
        feedback.innerHTML = '<span class="fill-blank-ok">✓ 正确</span>';
        hideAnswer();
      } else {
        feedback.innerHTML = '<span class="fill-blank-err">答错了，再想想</span>';
        showAnswer();
      }
    }
    updateProgress();
  }

  submit.addEventListener('click', check);
  inputs.forEach(function(inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    inp.addEventListener('input', function() {
      inp.classList.remove('is-correct', 'is-wrong');
      hideAnswer();
    });
  });
  reset.addEventListener('click', function() {
    inputs.forEach(function(inp) { inp.value = ''; inp.classList.remove('is-correct', 'is-wrong'); });
    feedback.className = 'fill-blank-feedback';
    feedback.innerHTML = '';
    hideAnswer();
    updateProgress();
    if (inputs[0]) inputs[0].focus();
  });
});
`;

module.exports = { render, clientJs };
