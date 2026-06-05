const { escapeHtml } = require('./_inline.js');

// Fill-blank 填空题组件
// 数据：{ id, question, answer, hint, placeholder }
// 比对规则：不区分大小写、忽略首尾空格、多个答案用 | 分隔



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
