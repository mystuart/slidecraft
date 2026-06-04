// Quiz 选择题组件
// 单题数据：{ id, question, type: 'single'|'multi', options: [{id,text}], correct: [id,...], feedback: {correct, wrong}, hint }
// 题组（quiz-track）数据：[单题1, 单题2, ...] — 数组，渲染为 carousel

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function renderSingleQuestion(data) {
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

// 题组渲染：carousel 容器，header(counter+dots) + track(slides) + nav(prev/next)
// 内部用 .quiz 元素复用现有交互逻辑
function renderTrack(quizArray) {
  if (!Array.isArray(quizArray) || quizArray.length === 0) {
    throw new Error('[quiz-track] body 必须是 quiz 对象数组（至少 1 个）');
  }
  const slides = quizArray.map((q, i) => {
    return `<div class="quiz-carousel-slide" data-slide-idx="${i}">${renderSingleQuestion(q)}</div>`;
  }).join('\n');
  const total = quizArray.length;
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="quiz-carousel-dot${i === 0 ? ' is-active' : ''}" data-dot-idx="${i}"></span>`
  ).join('');
  return `<div class="quiz-carousel" data-total="${total}" data-active="0" tabindex="0">
  <div class="quiz-carousel-header">
    <span class="quiz-carousel-counter">第 1 / ${total} 题</span>
    <div class="quiz-carousel-dots">${dots}</div>
  </div>
  <div class="quiz-carousel-viewport">
    <div class="quiz-carousel-track">${slides}</div>
  </div>
  <div class="quiz-carousel-nav">
    <button class="quiz-carousel-prev" type="button" disabled aria-label="上一题">← 上一题</button>
    <button class="quiz-carousel-next" type="button"${total <= 1 ? ' disabled' : ''} aria-label="下一题">下一题 →</button>
  </div>
</div>`;
}

// 兼容老调用：render(data) 等同 renderSingleQuestion(data)
function render(data) {
  return renderSingleQuestion(data);
}

const clientJs = `
// 单题 quiz 交互（提交/重做/反馈）
// 注：carousel 内部的 .quiz 由下方 carousel 逻辑统一处理，不重复绑定
document.querySelectorAll('.quiz').forEach(function(quiz) {
  if (quiz.closest('.quiz-carousel')) return;
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

// 题组 carousel 切换逻辑
(function() {
  document.querySelectorAll('.quiz-carousel').forEach(function(carousel) {
    var total = parseInt(carousel.getAttribute('data-total') || '0', 10);
    if (total <= 1) return; // 1 题不切

    var prevBtn = carousel.querySelector('.quiz-carousel-prev');
    var nextBtn = carousel.querySelector('.quiz-carousel-next');
    var counter = carousel.querySelector('.quiz-carousel-counter');
    var dots = carousel.querySelectorAll('.quiz-carousel-dot');
    var track = carousel.querySelector('.quiz-carousel-track');
    var active = 0;

    function goTo(idx) {
      if (idx < 0 || idx >= total) return;
      active = idx;
      carousel.setAttribute('data-active', String(active));
      // 用 left 偏移而不是 transform —— transform 会让 track 提升到 GPU 合成层，
      // Chrome 合成层会穿透 contain: paint 和 overflow: hidden 的裁剪（导致相邻 slide 漏出）。
      // left 是 layout 属性，不创建合成层，没有这个穿透问题。
      if (track) track.style.left = '-' + (active * 100) + '%';
      if (counter) counter.textContent = '第 ' + (active + 1) + ' / ' + total + ' 题';
      dots.forEach(function(d, i) {
        d.classList.toggle('is-active', i === active);
      });
      if (prevBtn) prevBtn.disabled = (active === 0);
      if (nextBtn) nextBtn.disabled = (active === total - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(active - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(active + 1); });
    dots.forEach(function(d, i) {
      d.addEventListener('click', function() { goTo(i); });
    });
    // 键盘左右箭头支持（仅在 carousel 容器聚焦时）
    carousel.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' && active > 0) { e.preventDefault(); goTo(active - 1); }
      else if (e.key === 'ArrowRight' && active < total - 1) { e.preventDefault(); goTo(active + 1); }
    });
  });
})();
`;

module.exports = { render, renderTrack, clientJs };
