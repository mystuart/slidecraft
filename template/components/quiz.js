/**
 * @component quiz / quiz-track
 * @version 0.4.0
 * @status 打磨完成
 *
 * Quiz 选择题组件（含题组 quiz-track 模式）
 *
 * 模式判断：data 是数组 → quiz-track（carousel 题组），data 是对象 → quiz（单题）
 *
 * 单题字段（quiz）：
 *   - id        {string}            必填 · 题目 ID
 *   - question  {string}            必填 · 题干（支持内联 markdown + LaTeX）
 *   - type      'single'|'multi'    必填 · 单选/多选
 *   - options   [{id, text}]        必填 · 选项数组（text 支持内联 markdown + LaTeX）
 *   - correct   [id, ...]           必填 · 正确答案 ID 数组（build 期校验 ⊆ options[].id）
 *   - feedback  {correct, wrong}    可选 · 反馈文案（支持内联 markdown + LaTeX；传 string 视为答对文案）
 *   - hint      {string}            可选 · 提示（支持内联 markdown + LaTeX）
 *   - category  'concept'|'calc'|'apply'|'review'  可选 · 题型分类标签
 *
 * 题组字段（quiz-track）：直接传 [单题1, 单题2, ...] 数组
 *
 * v0.4.0 变更：
 *   - 「复制成绩」升级为错题分布报告：逐题列出 ✓/◐/✗ + 截断题干——
 *     老师收到就知道哪一节的内容需要重讲（内容不足探测器）
 *
 * v0.3.3 变更（复审修复）：
 *   - 「复制成绩」改调框架 `__SCCopy`（clipboard API + execCommand 兜底），
 *     删除组件内独立的 fallback 拷贝——与代码卡片复制同一实现，后续只改一处
 *
 * v0.3.2 变更：
 *   - **修复属性泄漏 bug**：feedback 文案含 $...$ 时，build 后置的 processInlineFormulas
 *     会把 KaTeX HTML 注进 data-feedback-* 属性（含双引号），撑破属性泄漏为正文。
 *     现在 feedback 改走隐藏 DOM（.quiz-feedback-store）+ processInline 渲染，
 *     顺带解除"feedback 不支持内联 LaTeX"限制（系统级问题 #1 对 feedback 部分）。
 *   - feedback 传 string 时明确语义：视为答对文案（此前实际走默认文案，行为未定义）
 *   - "(多选)" 角标 inline style 改 class（.quiz-multi-mark）
 *
 * v0.3.0 变更：
 *   - 学习进度持久化：作答 / 重做 / 题组位置（active）/ 完成态（summary）经 __SCProgress
 *     存入 localStorage，刷新/重开自动恢复（重放式恢复，UI 与真人作答同链路）
 *   - 完成态新增「复制成绩」按钮：一键复制文本成绩单，学生可回发给老师
 *   - build 期硬校验：correct ⊆ options[].id、correct 非空、选项 ≥2
 *
 * 借鉴方向：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § quiz / quiz-track
 *
 * 已知问题：无（原 #1「options/feedback/hint 不支持内联 LaTeX」已随 v0.3.2 + processInline v0.2.1 全部解除）。
 */

const { escapeHtml, processInline } = require('./_inline.js');

const CATEGORY_LABELS = {
  concept: '💡 概念题',
  calc: '🧮 计算题',
  apply: '🌐 应用题',
  review: '🔁 复习题'
};

function renderSingleQuestion(data) {
  // id 是进度持久化的 localStorage key：缺省随机 id 在重新编译后会变化，
  // 学员旧进度将无法对应——给出 build 期警告（v1.10.0）
  const explicitId = Boolean(data.id);
  const id = data.id || ('q-' + Math.random().toString(36).slice(2, 8));
  if (!explicitId) {
    console.warn(`[quiz] "${String(data.question || '').slice(0, 24)}…" 缺少 id，已生成随机 id。重新编译后学员作答进度会失效，建议显式指定。`);
  }
  const question = data.question || '';
  const type = data.type === 'multi' ? 'multi' : 'single';
  const options = Array.isArray(data.options) ? data.options : [];
  const correct = Array.isArray(data.correct) ? data.correct : [];
  const feedback = data.feedback;

  // v0.3.0 build 期硬校验：correct 里的每个 id 必须存在于 options[].id。
  // 否则学员永远答不对这道题（判分引用了不存在的选项），且 build 期完全无感知——
  // 典型笔误：options 用 a/b/c/d、correct 写了 "B"（大小写）或抄错字母。
  const optionIds = new Set(options.map(o => String((o && o.id != null) ? o.id : '')));
  for (const c of correct) {
    if (!optionIds.has(String(c))) {
      throw new Error(
        `[quiz "${id}"] correct 引用了 "${c}"，但 options 里没有这个 id。` +
        `可用 id：[${Array.from(optionIds).join(', ')}]。请核对 options[].id 与 correct 是否一致（区分大小写）。`
      );
    }
  }
  if (options.length > 0 && correct.length === 0) {
    throw new Error(`[quiz "${id}"] correct 为空——选择题必须有正确答案。`);
  }
  if (options.length > 0 && options.length < 2) {
    throw new Error(`[quiz "${id}"] 只有 ${options.length} 个选项——选择题至少 2 个选项。`);
  }

  // v0.3.2：feedback 走隐藏 DOM（processInline 渲染，支持 LaTeX / 加粗 / code），
  // 不再经 HTML 属性传递——含 $...$ 的反馈文案此前会在 build 后置的
  // processInlineFormulas 阶段把 KaTeX HTML 注进属性，撑破属性泄漏为正文。
  // feedback 为 string 时视为答对文案（兼容旧写法）。
  const feedbackObj = (feedback && typeof feedback === 'object') ? feedback
    : (typeof feedback === 'string' ? { correct: feedback } : {});
  const fbCorrectHtml = processInline(feedbackObj.correct || '答对了！');
  const fbWrongHtml = processInline(feedbackObj.wrong || '再想想～');
  const hint = data.hint || '';
  const category = CATEGORY_LABELS[data.category] ? data.category : '';
  const inputType = type === 'multi' ? 'checkbox' : 'radio';
  const name = 'q-' + id;

  return `<div class="quiz" data-quiz-id="${escapeHtml(id)}" data-type="${type}" data-correct='${escapeHtml(JSON.stringify(correct))}' data-category="${escapeHtml(category)}">
  ${category ? `<div class="quiz-category quiz-category--${escapeHtml(category)}">${CATEGORY_LABELS[category]}</div>` : ''}
  <div class="quiz-question">${processInline(question)}${type === 'multi' ? ' <small class="quiz-multi-mark">(多选)</small>' : ''}</div>
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
  <div class="quiz-feedback-store" hidden aria-hidden="true"><span class="quiz-fb-correct">${fbCorrectHtml}</span><span class="quiz-fb-wrong">${fbWrongHtml}</span></div>
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
    <button class="quiz-summary-copy" type="button" data-summary-copy title="复制文本成绩单，可直接发给老师">📋 复制成绩</button>
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
  var type = quiz.getAttribute('data-type') || 'single';
  var checkBtn = quiz.querySelector('.quiz-check');
  var resetBtn = quiz.querySelector('.quiz-reset');
  var feedback = quiz.querySelector('.quiz-feedback');
  var options = quiz.querySelectorAll('.quiz-option');
  var progressId = 'quiz:' + (quiz.getAttribute('data-quiz-id') || '');
  // 反馈文案来自隐藏 DOM（v0.3.2 起 feedback 支持 LaTeX / 内联 markdown）
  var fbStore = quiz.querySelector('.quiz-feedback-store');
  var fbCorrect = fbStore ? fbStore.querySelector('.quiz-fb-correct').innerHTML : '答对了！';
  var fbWrong = fbStore ? fbStore.querySelector('.quiz-fb-wrong').innerHTML : '再想想～';

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
    var fbMark = isRight ? '✓' : (isPartial ? '◐' : '✗');
    var fbText = isRight ? fbCorrect : (isPartial ? '部分正确，' + fbWrong : fbWrong);
    feedback.className = 'quiz-feedback ' + fbClass;
    feedback.innerHTML = '<span class="quiz-fb-mark">' + fbMark + '</span><span class="quiz-fb-text">' + fbText + '</span>';
    checkBtn.disabled = true;
    // 进度持久化：存选项 + 已作答（恢复时重放提交，走同一套判分/样式链路）
    if (window.__SCProgress) window.__SCProgress.save(progressId, { sel: sels, done: true });
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
    // 重做即放弃本次作答记录
    if (window.__SCProgress) window.__SCProgress.clear(progressId);
    // 派发 quiz:reset，carousel 块会把 slide 状态重置回 default
    quiz.dispatchEvent(new CustomEvent('quiz:reset', { bubbles: true }));
  });

  // 进度恢复：暂存到元素上。非 carousel 的单题立即重放；
  // carousel 内的题组块稍后统一重放——那时 quiz:answered 监听才挂好，dots/进度才能联动。
  if (window.__SCProgress) {
    quiz.__scSaved = window.__SCProgress.load(progressId);
    if (quiz.__scSaved && !quiz.closest('.quiz-carousel')) {
      window.__SCProgress.replayQuiz(quiz);
    }
  }
});

// 题组 carousel 切换逻辑 + 进度反馈 + 完成态总结
(function() {
  function saveTrackState(car, activeIdx) {
    if (!window.__SCProgress || !car.__scKey) return;
    window.__SCProgress.save(car.__scKey, {
      active: activeIdx,
      summary: car.getAttribute('data-summary-state') === 'visible'
    });
  }
  document.querySelectorAll('.quiz-carousel').forEach(function(carousel) {
    var total = parseInt(carousel.getAttribute('data-total') || '0', 10);
    // 题组进度 key 由组内题目 id 派生：作者改了题目内容，旧进度自动失效
    carousel.__scKey = 'quiztrack:' + Array.prototype.map.call(
      carousel.querySelectorAll('.quiz'),
      function(q) { return q.getAttribute('data-quiz-id') || '?'; }
    ).join(',');
    if (total <= 1) {
      // 单题 carousel：直接监听 quiz:answered 维护状态，但保留 finish/restart 入口
      bindProgressAndSummary(carousel, 1);
      restoreTrack(carousel);
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
      saveTrackState(carousel, active);
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
    // 「复制成绩」：学生把文本成绩单回发给老师（微信/邮件直接粘贴）
    bindCopyScore(carousel, total);
    // 进度恢复：先重放每题作答（触发 quiz:answered → dots/进度联动），再回到上次位置
    restoreTrack(carousel, {
      onRestored: function(saved) {
        if (saved && typeof saved.active === 'number' && saved.active > 0 && saved.active < total) {
          goTo(saved.active);
        } else {
          goTo(0);
        }
      }
    });
  });

  // 共享：恢复题组作答 + 上次浏览位置 / 完成态
  function restoreTrack(carousel, hooks) {
    if (!window.__SCProgress) return;
    Array.prototype.forEach.call(carousel.querySelectorAll('.quiz'), function(q) {
      window.__SCProgress.replayQuiz(q);
    });
    var saved = window.__SCProgress.load(carousel.__scKey);
    if (saved && saved.summary && allAnswered(carousel)) {
      showSummary(carousel);
    }
    if (hooks && hooks.onRestored) hooks.onRestored(saved);
  }

  // 共享：复制成绩按钮（读 summary 里的实时数字 + 每题对错分布）
  function bindCopyScore(carousel, total) {
    var copyBtn = carousel.querySelector('[data-summary-copy]');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', function() {
      function num(sel) {
        var el = carousel.querySelector(sel);
        return el ? el.textContent : '0';
      }
      var lines = ['【' + (document.title || '课件') + '】题组成绩：共 ' + total +
        ' 题 — 全对 ' + num('[data-summary-correct]') +
        '，部分对 ' + num('[data-summary-partial]') +
        '，答错 ' + num('[data-summary-wrong]')];
      // 每题对错分布：老师收到就知道哪一节的内容需要重讲（v1.10.0）
      var marks = { correct: '✓', partial: '◐', wrong: '✗', default: '—' };
      carousel.querySelectorAll('.quiz-carousel-slide').forEach(function(slide, i) {
        var status = slide.getAttribute('data-slide-status') || 'default';
        var q = slide.querySelector('.quiz-question');
        var text = q ? q.textContent.replace(/\s+/g, ' ').trim() : '';
        if (text.length > 30) text = text.slice(0, 30) + '…';
        lines.push('第' + (i + 1) + '题 ' + (marks[status] || '—') + ' ' + text);
      });
      var text = lines.join('\\n');
      // 复制走框架 __SCCopy（clipboard API + execCommand 兜底），与代码卡片同一实现
      if (!window.__SCCopy) return;
      window.__SCCopy(text, function() {
        var old = copyBtn.textContent;
        copyBtn.textContent = '✓ 已复制';
        setTimeout(function() { copyBtn.textContent = old; }, 1600);
      });
    });
  }

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
    // 完成态持久化（配合 active 的保存，重开课件直接回到"本组完成"）
    if (window.__SCProgress && carousel.__scKey) {
      window.__SCProgress.save(carousel.__scKey, {
        active: parseInt(carousel.getAttribute('data-active') || '0', 10),
        summary: true
      });
    }
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
    // 重新开始 = 清空本组进度（goTo(0) 会写入全新的初始态）
    if (window.__SCProgress && carousel.__scKey) {
      window.__SCProgress.clear(carousel.__scKey);
    }
  }
})();
`;

module.exports = { render, renderTrack, clientJs };
