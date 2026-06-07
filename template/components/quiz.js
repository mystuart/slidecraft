/**
 * @component quiz / quiz-track
 * @version 0.2.0
 * @status 打磨完成
 *
 * Quiz 选择题组件（含题组 quiz-track 模式）
 *
 * 模式判断：data 是数组 → quiz-track（carousel 题组），data 是对象 → quiz（单题）
 *
 * 单题字段（quiz）：
 *   - id        {string}            必填 · 题目 ID
 *   - question  {string}            必填 · 题干
 *   - type      'single'|'multi'    必填 · 单选/多选
 *   - options   [{id, text}]        必填 · 选项数组
 *   - correct   [id, ...]           必填 · 正确答案 ID 数组
 *   - feedback  {correct, wrong}    可选 · 反馈文案（correct/wrong 二选一时也允许是 string）
 *   - hint      {string}            可选 · 提示
 *   - category  'concept'|'calc'|'apply'|'review'  可选 · 题型分类标签
 *
 * 题组字段（quiz-track）：直接传 [单题1, 单题2, ...] 数组
 *
 * 借鉴方向：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § quiz / quiz-track
 *
 * 已知问题：options[].text、feedback.content、hint 不支持内联 LaTeX（系统级问题 #1）。
 */

const { escapeHtml, processInline } = require('./_inline.js');

const CATEGORY_LABELS = {
  concept: '💡 概念题',
  calc: '🧮 计算题',
  apply: '🌐 应用题',
  review: '🔁 复习题'
};

function renderSingleQuestion(data) {
  const id = data.id || ('q-' + Math.random().toString(36).slice(2, 8));
  const question = data.question || '';
  const type = data.type === 'multi' ? 'multi' : 'single';
  const options = Array.isArray(data.options) ? data.options : [];
  const correct = Array.isArray(data.correct) ? data.correct : [];
  const feedback = data.feedback || {};
  const hint = data.hint || '';
  const category = CATEGORY_LABELS[data.category] ? data.category : '';
  const inputType = type === 'multi' ? 'checkbox' : 'radio';
  const name = 'q-' + id;

  return `<div class="quiz" data-quiz-id="${escapeHtml(id)}" data-type="${type}" data-correct='${escapeHtml(JSON.stringify(correct))}' data-feedback-correct="${escapeHtml(feedback.correct || '答对了！')}" data-feedback-wrong="${escapeHtml(feedback.wrong || '再想想～')}" data-category="${escapeHtml(category)}">
  ${category ? `<div class="quiz-category quiz-category--${escapeHtml(category)}">${CATEGORY_LABELS[category]}</div>` : ''}
  <div class="quiz-question">${processInline(question)}${type === 'multi' ? ' <small style="color:var(--color-text-muted);font-weight:400;">(多选)</small>' : ''}</div>
  ${hint ? `<details class="quiz-hint"><summary>💡 提示</summary><div>${processInline(hint)}</div></details>` : ''}
  <div class="quiz-options">
    ${options.map(o => `
    <label class="quiz-option" data-option-id="${escapeHtml(o.id)}">
      <input type="${inputType}" name="${name}" value="${escapeHtml(o.id)}">
      <span class="quiz-option-text">${processInline(o.text)}</span>
    </label>`).join('')}
  </div>
  <div class="quiz-actions">
    <button class="quiz-check" type="button">提交</button>
    <button class="quiz-reset" type="button">重做</button>
  </div>
  <div class="quiz-feedback" hidden></div>
</div>`;
}

// 题组渲染：carousel 容器，header(counter+dots) + track(slides) + summary(callout 内嵌) + nav(prev/next/finish/restart)
// 内部用 .quiz 元素复用现有交互逻辑
function renderTrack(quizArray) {
  if (!Array.isArray(quizArray) || quizArray.length === 0) {
    throw new Error('[quiz-track] body 必须是 quiz 对象数组（至少 1 个）');
  }
  const slides = quizArray.map((q, i) => {
    return `<div class="quiz-carousel-slide" data-slide-idx="${i}" data-slide-status="default">${renderSingleQuestion(q)}</div>`;
  }).join('\n');
  const total = quizArray.length;
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="quiz-carousel-dot${i === 0 ? ' is-active' : ''}" data-dot-idx="${i}"></span>`
  ).join('');
  return `<div class="quiz-carousel" data-total="${total}" data-active="0" data-summary-state="hidden" tabindex="0">
  <div class="quiz-carousel-header">
    <span class="quiz-carousel-counter">第 1 / ${total} 题</span>
    <div class="quiz-carousel-dots">${dots}</div>
  </div>
  <div class="quiz-carousel-viewport">
    <div class="quiz-carousel-track">${slides}</div>
  </div>
  <div class="quiz-carousel-summary" hidden>
    <div class="quiz-carousel-summary-title">本组完成</div>
    <div class="quiz-carousel-summary-stats">
      <span class="summary-stat summary-stat--total"><span class="summary-num">${total}</span><span class="summary-label">总题数</span></span>
      <span class="summary-stat summary-stat--correct"><span class="summary-num" data-summary-correct>0</span><span class="summary-label">全对</span></span>
      <span class="summary-stat summary-stat--partial"><span class="summary-num" data-summary-partial>0</span><span class="summary-label">部分对</span></span>
      <span class="summary-stat summary-stat--wrong"><span class="summary-num" data-summary-wrong>0</span><span class="summary-label">答错</span></span>
    </div>
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
// 注：carousel 内部的 .quiz 也走这里处理（修复：原代码 return 跳过了，导致 carousel 内
// quiz 提交按钮不响应）。carousel 块另起一段监听这里派发的 quiz:answered 事件来更新
// 进度节点 + 总结态。
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
        options.forEach(function(x) { x.classList.remove('is-selected', 'is-pending'); });
      }
      var selClass = type === 'multi' ? 'is-pending' : 'is-selected';
      if (input.checked) o.classList.add(selClass);
      else o.classList.remove('is-selected', 'is-pending');
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
    // partial: 多选 + 答错 + sels 里有对的（部分对部分错）
    var isPartial = !isRight && type === 'multi' && sels.some(function(s) { return correct.indexOf(s) !== -1; });
    options.forEach(function(o) {
      var oid = o.getAttribute('data-option-id');
      o.classList.remove('is-selected', 'is-pending', 'is-correct', 'is-wrong');
      var inCorrect = correct.indexOf(oid) !== -1;
      var isSel = sels.indexOf(oid) !== -1;
      if (inCorrect) o.classList.add('is-correct');
      else if (isSel) o.classList.add('is-wrong');
    });
    feedback.hidden = false;
    var fbClass = isRight ? 'is-correct' : (isPartial ? 'is-partial' : 'is-wrong');
    var fbText = isRight ? '✓ ' + fbCorrect : (isPartial ? '◐ 部分正确，再想想～' : '✗ ' + fbWrong);
    feedback.className = 'quiz-feedback ' + fbClass;
    feedback.textContent = fbText;
    checkBtn.disabled = true;
    // 派发 quiz:answered 自定义事件，carousel 块会监听
    var status = isRight ? 'correct' : (isPartial ? 'partial' : 'wrong');
    quiz.dispatchEvent(new CustomEvent('quiz:answered', { bubbles: true, detail: { status: status } }));
  });

  resetBtn.addEventListener('click', function() {
    options.forEach(function(o) {
      var input = o.querySelector('input');
      if (input) input.checked = false;
      o.classList.remove('is-selected', 'is-pending', 'is-correct', 'is-wrong');
    });
    feedback.hidden = true;
    feedback.className = 'quiz-feedback';
    feedback.textContent = '';
    checkBtn.disabled = false;
    // 派发 quiz:reset，carousel 块会把 slide 状态重置回 default
    quiz.dispatchEvent(new CustomEvent('quiz:reset', { bubbles: true }));
  });
});

// 题组 carousel 切换逻辑 + 进度反馈 + 完成态总结
(function() {
  document.querySelectorAll('.quiz-carousel').forEach(function(carousel) {
    var total = parseInt(carousel.getAttribute('data-total') || '0', 10);
    if (total <= 1) {
      // 单题 carousel：直接监听 quiz:answered 维护状态，但保留 finish/restart 入口
      bindProgressAndSummary(carousel, 1);
      return;
    }

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
      syncNextButton();
    }

    bindProgressAndSummary(carousel, total, {
      onAllAnswered: syncNextButton,
      onReset: syncNextButton
    });

    function syncNextButton() {
      if (!nextBtn) return;
      var summaryOpen = carousel.getAttribute('data-summary-state') === 'visible';
      if (summaryOpen) {
        nextBtn.textContent = '↺ 重新开始';
        nextBtn.disabled = false;
        return;
      }
      if (allAnswered(carousel) && active === total - 1) {
        nextBtn.textContent = '完成 ✓';
        nextBtn.disabled = false;
        return;
      }
      nextBtn.textContent = '下一题 →';
      nextBtn.disabled = (active === total - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(active - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      var summaryOpen = carousel.getAttribute('data-summary-state') === 'visible';
      if (summaryOpen) {
        // 重新开始
        resetCarousel(carousel, total);
        active = 0;
        goTo(0);
        return;
      }
      if (allAnswered(carousel) && active === total - 1) {
        // 展开完成态
        showSummary(carousel);
        syncNextButton();
        return;
      }
      goTo(active + 1);
    });
    dots.forEach(function(d, i) {
      d.addEventListener('click', function() { goTo(i); });
    });
    // 键盘左右箭头支持（仅在 carousel 容器聚焦时）
    carousel.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' && active > 0) { e.preventDefault(); goTo(active - 1); }
      else if (e.key === 'ArrowRight' && active < total - 1) { e.preventDefault(); goTo(active + 1); }
    });
  });

  // 共享辅助：绑定每题进度状态 + 完成态总结渲染
  function bindProgressAndSummary(carousel, total, hooks) {
    var slides = carousel.querySelectorAll('.quiz-carousel-slide');
    var dots = carousel.querySelector('.quiz-carousel-dots');
    function setProgress() {
      if (!dots || total <= 0) return;
      var answered = 0;
      slides.forEach(function(s) {
        if (s.getAttribute('data-slide-status') !== 'default') answered++;
      });
      var pct = (answered / total) * 100;
      // 轴线左右各留 6px 给首尾节点容纳，宽度按比例在节点中心间分配
      // 简单处理：直接用百分比（视觉上够用，节点 9px + 间距 0.4em 误差可忽略）
      dots.style.setProperty('--quiz-progress-width', pct + '%');
    }
    slides.forEach(function(slide) {
      var quiz = slide.querySelector('.quiz');
      if (!quiz) return;
      quiz.addEventListener('quiz:answered', function(e) {
        slide.setAttribute('data-slide-status', e.detail.status);
        setProgress();
        if (hooks && hooks.onAllAnswered) hooks.onAllAnswered();
      });
      quiz.addEventListener('quiz:reset', function() {
        slide.setAttribute('data-slide-status', 'default');
        setProgress();
        if (hooks && hooks.onReset) hooks.onReset();
      });
    });
  }

  function allAnswered(carousel) {
    var slides = carousel.querySelectorAll('.quiz-carousel-slide');
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].getAttribute('data-slide-status') === 'default') return false;
    }
    return true;
  }

  function showSummary(carousel) {
    var slides = carousel.querySelectorAll('.quiz-carousel-slide');
    var c = 0, p = 0, w = 0;
    slides.forEach(function(s) {
      var st = s.getAttribute('data-slide-status');
      if (st === 'correct') c++;
      else if (st === 'partial') p++;
      else if (st === 'wrong') w++;
    });
    var correctEl = carousel.querySelector('[data-summary-correct]');
    var partialEl = carousel.querySelector('[data-summary-partial]');
    var wrongEl = carousel.querySelector('[data-summary-wrong]');
    if (correctEl) correctEl.textContent = c;
    if (partialEl) partialEl.textContent = p;
    if (wrongEl) wrongEl.textContent = w;
    var summary = carousel.querySelector('.quiz-carousel-summary');
    if (summary) summary.hidden = false;
    carousel.setAttribute('data-summary-state', 'visible');
  }

  function resetCarousel(carousel, total) {
    var slides = carousel.querySelectorAll('.quiz-carousel-slide');
    slides.forEach(function(s) {
      s.setAttribute('data-slide-status', 'default');
      var resetBtn = s.querySelector('.quiz-reset');
      if (resetBtn) resetBtn.click();
    });
    var summary = carousel.querySelector('.quiz-carousel-summary');
    if (summary) summary.hidden = true;
    carousel.setAttribute('data-summary-state', 'hidden');
  }
})();
`;

module.exports = { render, renderTrack, clientJs };
