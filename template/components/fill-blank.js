/**
 * @component fill-blank
 * @version 0.3.1
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
 * v0.3.1 变更：
 *   - 修复「单空省占位」模式静默空转：题面无 {{n}} 占位时（如 "……等于十进制 __" 旧写法），
 *     blankCount=0 导致 answers 被截成 []、渲染出 0 个输入框。现在整题视为一个空，
 *     输入框附在题面末尾（binary-card-trick / how-to-create-skill 各 2 道题受益）
 *   - answers/answer 字段缺失改为 throw（没有答案的填空题没有意义）
 *
 * v0.3.0 变更：
 *   - 学习进度持久化：输入中的值实时保存（checked:false），提交判分后保存判分态（checked:true），
 *     刷新/重开自动恢复——checked 时重放 check() 走同一套判分/反馈链路。重做即清除。
 *
 * v0.2.1 变更：
 *   - 修复占位编号乱序/跳号/重复时 input 索引错位的 bug：render 时校验编号必须 1, 2, 3 ... 连续且唯一，违反则 throw 自描述错误
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
  // 找题面里所有 {{1}} {{2}} ... 按出现顺序
  const re = /\{\{(\d+)\}\}/g;
  const numbers = [];
  let m;
  while ((m = re.exec(question)) !== null) {
    numbers.push(parseInt(m[1], 10));
  }
  let blankCount = numbers.length;

  // answers 缺失直接报错（fill-blank 没有答案就没有意义，静默渲染只会产出空转的题）
  if (answers === undefined || answers === null) {
    throw new Error(
      `[fill-blank] 缺少 answers（或旧字段 answer）。题目必须有答案才能判分。`
    );
  }

  // 校验 1：编号必须从 1 开始连续（{{1}} {{2}} {{3}} ...）
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] !== i + 1) {
      throw new Error(
        `[fill-blank] 占位编号必须从 1 开始连续递增，发现 {{${numbers[i]}}}` +
        `（出现在第 ${i + 1} 个空）。请改用 {{1}} {{2}} {{3}} ... 顺序编写。`
      );
    }
  }
  // 校验 2：同一编号不能重复出现
  const seen = new Set();
  for (let i = 0; i < numbers.length; i++) {
    if (seen.has(numbers[i])) {
      throw new Error(
        `[fill-blank] 占位编号 {{${numbers[i]}}} 重复出现在第 ${i + 1} 个空。` +
        `每个空必须用唯一编号（{{1}} {{2}} {{3}} ...）。`
      );
    }
    seen.add(numbers[i]);
  }

  // SPEC 承诺：单空可省占位——题面一个 {{n}} 都没有时，整题视为一个空，
  // 输入框附在题面末尾。此前该模式渲染出 0 个输入框（blankCount=0 → answers 被截成 []），
  // binary-card-trick / how-to-create-skill 里的 `__` 写法全部静默空转（v0.3.1 修复）。
  const noPlaceholder = blankCount === 0;
  if (noPlaceholder) blankCount = 1;

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

  return { blankCount, normAnswers, re, noPlaceholder };
}

function render(data) {
  // id 是进度持久化的 localStorage key：缺省随机 id 在重新编译后会变化（v1.10.0 警告）
  const explicitId = Boolean(data.id);
  const id = data.id || ('f-' + Math.random().toString(36).slice(2, 8));
  if (!explicitId) {
    console.warn(`[fill-blank] "${String(data.question || '').slice(0, 24)}…" 缺少 id，已生成随机 id。重新编译后学员作答进度会失效，建议显式指定。`);
  }
  const question = data.question || '';
  const hint = data.hint || '';
  const placeholder = data.placeholder || '在此输入答案';
  const mode = data.mode === 'practice' ? 'practice' : 'reveal';
  const { blankCount, normAnswers, re, noPlaceholder } = normalizeBlanksSpec(question, data.answers !== undefined ? data.answers : data.answer);

  // 把 {{n}} 替换成 <input class="fill-blank-input" data-blank-idx="n">
  // 无占位单空模式：输入框附在题面末尾（v0.3.1，修复 `__` 写法静默空转）
  // 题面其余文字走 escapeHtml 防 XSS
  const inputHtml = (idx) => `<input class="fill-blank-input" type="text" data-blank-idx="${idx}" placeholder="${escapeHtml(placeholder)}" autocomplete="off">`;
  const questionHtml = noPlaceholder
    ? escapeHtml(question) + ' ' + inputHtml(0)
    : escapeHtml(question).replace(re, (_, n) => inputHtml(parseInt(n, 10) - 1));

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
  var progressId = 'fillblank:' + (fb.getAttribute('data-fillblank-id') || '');

  function persistValues(checked) {
    if (!window.__SCProgress) return;
    var vals = Array.prototype.map.call(inputs, function(i) { return i.value; });
    window.__SCProgress.save(progressId, { values: vals, checked: !!checked });
  }

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
      persistValues(false);
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
    // 提交后保存判分态（恢复时重放 check()，反馈/进度条与真人提交完全一致）
    persistValues(true);
  }

  submit.addEventListener('click', check);
  inputs.forEach(function(inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    inp.addEventListener('input', function() {
      inp.classList.remove('is-correct', 'is-wrong');
      hideAnswer();
      // 输入中的内容实时保存（未判分态），刷新后还在
      persistValues(false);
    });
  });
  reset.addEventListener('click', function() {
    inputs.forEach(function(inp) { inp.value = ''; inp.classList.remove('is-correct', 'is-wrong'); });
    feedback.className = 'fill-blank-feedback';
    feedback.innerHTML = '';
    hideAnswer();
    updateProgress();
    if (window.__SCProgress) window.__SCProgress.clear(progressId);
    if (inputs[0]) inputs[0].focus();
  });

  // 进度恢复：先回填输入值；已判分过的重放一次 check()
  if (window.__SCProgress) {
    var saved = window.__SCProgress.load(progressId);
    if (saved && Array.isArray(saved.values)) {
      inputs.forEach(function(inp, i) {
        if (saved.values[i] != null) inp.value = saved.values[i];
      });
      if (saved.checked) check();
    }
  }
});
`;

module.exports = { render, clientJs };
