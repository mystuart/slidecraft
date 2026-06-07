/**
 * @component fill-blank
 * @version 0.1.0
 * @status 待打磨
 *
 * 填空题组件（单空）
 *
 * 字段：
 *   - id          {string}   必填 · 题目 ID
 *   - question    {string}   必填 · 题面（不含填空格本身）
 *   - answer      {string}   必填 · 答案，多个等价答案用 | 分隔
 *   - hint        {string}   可选 · 提示文案
 *   - placeholder {string}   可选 · 输入框占位符（默认"____"）
 *
 * 比对规则：不区分大小写、忽略首尾空格
 *
 * 待打磨：等价答案规则（unicode 标准化 / 去空格范围）/ 多空场景字段设计 / 判分粒度（全对 vs 部分得分）
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § fill-blank
 *
 * 已知问题：单空设计，不支持一道题多个空。
 */

const { escapeHtml } = require('./_inline.js');



function render(data) {
  const id = data.id || ('f-' + Math.random().toString(36).slice(2, 8));
  const question = data.question || '';
  const answer = data.answer || '';
  const hint = data.hint || '';
  const placeholder = data.placeholder || '在此输入答案';
  // mode: reveal（默认，答错显示 hint 和答案） | practice（自测模式，答错只显示对错）
  const mode = data.mode === 'practice' ? 'practice' : 'reveal';
  // 多答案用 | 分隔
  const answers = String(answer).split('|').map(s => s.trim()).filter(Boolean);
  return `<div class="fill-blank" data-fillblank-id="${escapeHtml(id)}" data-answers='${escapeHtml(JSON.stringify(answers))}' data-mode="${mode}">
  <div class="fill-blank-question">${escapeHtml(question)}</div>
  <div class="fill-blank-input-row">
    <input class="fill-blank-input" type="text" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
    <button class="fill-blank-submit" type="button">检查</button>
    <button class="fill-blank-reset" type="button">重做</button>
  </div>
  <div class="fill-blank-feedback"></div>
  ${hint ? `<div class="fill-blank-hint" hidden>${escapeHtml(hint)}</div>` : ''}
  <div class="fill-blank-answer" hidden>${escapeHtml(answers[0] || '')}</div>
</div>`;
}

const clientJs = `
document.querySelectorAll('.fill-blank').forEach(function(fb) {
  var answers = JSON.parse(fb.getAttribute('data-answers') || '[]');
  var mode = fb.getAttribute('data-mode') || 'reveal'; // reveal | practice
  var input = fb.querySelector('.fill-blank-input');
  var submit = fb.querySelector('.fill-blank-submit');
  var reset = fb.querySelector('.fill-blank-reset');
  var feedback = fb.querySelector('.fill-blank-feedback');
  var hint = fb.querySelector('.fill-blank-hint');
  var answer = fb.querySelector('.fill-blank-answer');

  function normalize(s) {
    return String(s || '').trim().toLowerCase();
  }

  // practice 模式下答错不显示 hint/answer
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

  function check() {
    var v = normalize(input.value);
    if (!v) {
      input.classList.remove('is-correct', 'is-wrong');
      feedback.className = 'fill-blank-feedback';
      feedback.innerHTML = '';
      hideAnswer();
      return;
    }
    var ok = answers.some(function(a) { return normalize(a) === v; });
    input.classList.remove('is-correct', 'is-wrong');
    input.classList.add(ok ? 'is-correct' : 'is-wrong');
    feedback.className = 'fill-blank-feedback';
    if (ok) {
      feedback.innerHTML = '';
      hideAnswer();
    } else {
      showAnswer();
    }
  }

  submit.addEventListener('click', check);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  });
  input.addEventListener('input', function() {
    input.classList.remove('is-correct', 'is-wrong');
    hideAnswer();
  });
  reset.addEventListener('click', function() {
    input.value = '';
    input.classList.remove('is-correct', 'is-wrong');
    feedback.className = 'fill-blank-feedback';
    feedback.innerHTML = '';
    hideAnswer();
    input.focus();
  });
});
`;

module.exports = { render, clientJs };
