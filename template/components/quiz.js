// Quiz 选择题组件
// 数据：{ id, question, type: 'single'|'multi', options: [{id,text}], correct: [id,...], feedback: {correct, wrong}, hint }

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function render(data) {
  const id = data.id || ('q-' + Math.random().toString(36).slice(2, 8));
  const question = data.question || '';
  const type = data.type === 'multi' ? 'multi' : 'single';
  const options = Array.isArray(data.options) ? data.options : [];
  const correct = Array.isArray(data.correct) ? data.correct : [];
  const feedback = data.feedback || {};
  const hint = data.hint || '';
  const inputType = type === 'multi' ? 'checkbox' : 'radio';
  const name = 'q-' + id;

  return `<div class="quiz" data-quiz-id="${escapeHtml(id)}" data-type="${type}" data-correct='${escapeHtml(JSON.stringify(correct))}' data-feedback-correct="${escapeHtml(feedback.correct || '答对了！')}" data-feedback-wrong="${escapeHtml(feedback.wrong || '再想想～')}">
  <div class="quiz-question">${escapeHtml(question)}${type === 'multi' ? ' <small style="color:var(--color-text-muted);font-weight:400;">(多选)</small>' : ''}</div>
  ${hint ? `<details class="quiz-hint"><summary>💡 提示</summary><div>${escapeHtml(hint)}</div></details>` : ''}
  <div class="quiz-options">
    ${options.map(o => `
    <label class="quiz-option" data-option-id="${escapeHtml(o.id)}">
      <input type="${inputType}" name="${name}" value="${escapeHtml(o.id)}">
      <span class="quiz-option-text">${escapeHtml(o.text)}</span>
    </label>`).join('')}
  </div>
  <div class="quiz-actions">
    <button class="quiz-check" type="button">提交</button>
    <button class="quiz-reset" type="button">重做</button>
  </div>
  <div class="quiz-feedback" hidden></div>
</div>`;
}

const clientJs = `
document.querySelectorAll('.quiz').forEach(function(quiz) {
  var correct = JSON.parse(quiz.getAttribute('data-correct') || '[]');
  var fbCorrect = quiz.getAttribute('data-feedback-correct') || '答对了！';
  var fbWrong = quiz.getAttribute('data-feedback-wrong') || '再想想～';
  var type = quiz.getAttribute('data-type') || 'single';
  var checkBtn = quiz.querySelector('.quiz-check');
  var resetBtn = quiz.querySelector('.quiz-reset');
  var feedback = quiz.querySelector('.quiz-feedback');
  var options = quiz.querySelectorAll('.quiz-option');

  function getSelected() {
    var sels = [];
    options.forEach(function(o) {
      var input = o.querySelector('input');
      if (input && input.checked) sels.push(o.getAttribute('data-option-id'));
    });
    return sels;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.slice().sort(), sb = b.slice().sort();
    for (var i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
    return true;
  }

  options.forEach(function(o) {
    var input = o.querySelector('input');
    if (!input) return;
    input.addEventListener('change', function() {
      if (type === 'single') {
        options.forEach(function(x) { x.classList.remove('is-selected'); });
      }
      if (input.checked) o.classList.add('is-selected');
      else o.classList.remove('is-selected');
    });
  });

  checkBtn.addEventListener('click', function() {
    var sels = getSelected();
    if (sels.length === 0) {
      feedback.hidden = false;
      feedback.className = 'quiz-feedback is-wrong';
      feedback.textContent = '请先选择一个选项～';
      return;
    }
    var isRight = arraysEqual(sels, correct);
    options.forEach(function(o) {
      var oid = o.getAttribute('data-option-id');
      o.classList.remove('is-correct', 'is-wrong');
      if (correct.indexOf(oid) !== -1) o.classList.add('is-correct');
      else if (sels.indexOf(oid) !== -1) o.classList.add('is-wrong');
    });
    feedback.hidden = false;
    feedback.className = 'quiz-feedback ' + (isRight ? 'is-correct' : 'is-wrong');
    feedback.textContent = isRight ? '✓ ' + fbCorrect : '✗ ' + fbWrong;
    checkBtn.disabled = true;
  });

  resetBtn.addEventListener('click', function() {
    options.forEach(function(o) {
      var input = o.querySelector('input');
      if (input) input.checked = false;
      o.classList.remove('is-selected', 'is-correct', 'is-wrong');
    });
    feedback.hidden = true;
    feedback.className = 'quiz-feedback';
    feedback.textContent = '';
    checkBtn.disabled = false;
  });
});

// 题号 + 上一题/下一题导航
// 仅在整篇文档有 ≥1 个 quiz 时启用；只有 1 个时不显示导航（避免冗余）
(function() {
  var all = document.querySelectorAll('.quiz');
  if (!all.length) return;

  all.forEach(function(quiz, idx) {
    // 题号
    var counter = document.createElement('div');
    counter.className = 'quiz-counter';
    counter.textContent = '第 ' + (idx + 1) + ' / ' + all.length + ' 题';
    var q = quiz.querySelector('.quiz-question');
    if (q && q.parentNode) q.parentNode.insertBefore(counter, q);

    // 导航（只一个 quiz 不显示）
    if (all.length < 2) return;

    var nav = document.createElement('div');
    nav.className = 'quiz-nav';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'quiz-prev';
    prev.textContent = '← 上一题';
    if (idx === 0) prev.disabled = true;
    prev.addEventListener('click', function() {
      if (idx > 0) all[idx - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'quiz-next';
    next.textContent = '下一题 →';
    if (idx === all.length - 1) next.disabled = true;
    next.addEventListener('click', function() {
      if (idx < all.length - 1) all[idx + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    nav.appendChild(prev);
    nav.appendChild(next);

    // 插在 .quiz-actions 后面、.quiz-feedback 前面
    var actions = quiz.querySelector('.quiz-actions');
    if (actions && actions.parentNode) {
      actions.parentNode.insertBefore(nav, actions.nextSibling);
    } else {
      quiz.appendChild(nav);
    }
  });
})();
`;

module.exports = { render, clientJs };
