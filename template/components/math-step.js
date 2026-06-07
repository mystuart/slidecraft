/**
 * @component math-step
 * @version 0.1.0
 * @status 待打磨
 *
 * 分步解题组件（数学/物理/化学）
 *
 * 字段：
 *   - id              {string}                       可选 · 组件根 ID
 *   - question        {string}                       必填 · 题面（兼容 problem）
 *   - questionFormula {string}                       可选 · 题面公式（兼容 problemFormula，KaTeX 编译时渲染）
 *   - steps           [{content, formula?, answer?, hint?, explanation?, warning?, insight?}]  必填 · 步骤数组
 *   - steps[].content      {string}                  步骤正文（走 processInline）
 *   - steps[].formula      {string}                  可选 · 步骤公式（KaTeX）
 *   - steps[].answer       {string}                  可选 · 该步最终答案（默认展开，绿色块）
 *   - steps[].hint         {string}                  可选 · 提示（折叠）
 *   - steps[].explanation  {string}                  可选 · 详解（折叠）
 *   - steps[].warning      {string}                  可选 · 易错点（折叠）
 *   - steps[].insight      {string}                  可选 · 拓展（折叠）
 *
 * 形态：纵向展开，所有步骤同时可见，每步有"完成"勾选和折叠式 hint/explanation/warning/insight。
 *
 * v0.1.0 变更：首次可用，兼容 problem/question 两种字段名。
 *
 * 待打磨：4 折叠区配色（是否对齐到 callout 5 种 type）/ answer 默认展开 vs 全部默认折叠的决策 / 全部完成时"全卡片变绿"是否保留
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § math-step
 *
 * 已知问题：step.content 不支持内联 LaTeX（系统级问题 #1）。
 */

'use strict';

const { processInline, escapeHtml } = require('./_inline');
const katex = require('katex');

const TYPE_META = {
  hint:        { icon: '💡', label: '提示',       className: 'math-step-hint' },
  explanation: { icon: '📖', label: '详细解析',   className: 'math-step-explanation' },
  warning:     { icon: '⚠️', label: '易错点',     className: 'math-step-warning' },
  insight:     { icon: '🌟', label: '关键洞察',   className: 'math-step-insight' },
};

/**
 * 编译时把 LaTeX 表达式渲染成 KaTeX HTML。
 * 解析失败时降级为 <code> 源码（不抛错，保证 build 不中断）。
 */
function renderFormula(expr, display) {
  const safe = String(expr || '').trim();
  if (!safe) return '';
  try {
    return katex.renderToString(safe, {
      displayMode: display !== false,
      throwOnError: false,
      strict: 'ignore',
      output: 'html',
      trust: false,
    });
  } catch (e) {
    return `<code class="math-step-formula-error">${escapeHtml(safe)}</code>`;
  }
}

/**
 * 渲染分步解题组件
 * 字段约定（向后兼容）：
 *   - id?: string
 *   - title?: string
 *   - question  或  problem: string            题面（支持行内公式）
 *   - questionFormula  或  problemFormula?: string   可选块级公式（KaTeX，编译时渲染）
 *   - steps: Array<{
 *       title: string,
 *       content?: string,
 *       formula?: string,
 *       answer?: string,           最终答案（默认展开，绿色块）
 *       hint?: string,
 *       explanation?: string,
 *       warning?: string,
 *       insight?: string,
 *       reason?: string
 *     }>
 */
function render(data) {
  if (!data || typeof data !== 'object') {
    return '<div class="math-step-error">分步解题组件：缺少数据</div>';
  }

  const id = data.id || ('ms-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const problem = data.question || data.problem || '';
  const problemFormula = data.questionFormula || data.problemFormula || '';
  const steps = Array.isArray(data.steps) ? data.steps : [];

  if (!problem || steps.length === 0) {
    return '<div class="math-step-error">分步解题组件：question 和 steps 字段必填</div>';
  }

  const titleHtml = title
    ? `<h3 class="math-step-title">${escapeHtml(title)}</h3>`
    : '';

  const problemHtml = `<p class="math-step-problem">${processInline(problem)}</p>`;
  const problemFormulaHtml = problemFormula
    ? `<div class="math-step-problem-formula">${renderFormula(problemFormula, true)}</div>`
    : '';

  const stepsHtml = steps.map((step, idx) => {
    const stepNumber = idx + 1;
    const stepTitle = `<h4 class="math-step-step-title">第 ${stepNumber} 步：${escapeHtml(step.title || '')}</h4>`;

    const stepContent = step.content
      ? `<div class="math-step-step-content">${processInline(step.content)}</div>`
      : '';

    const stepFormulaHtml = step.formula
      ? `<div class="math-step-step-formula">${renderFormula(step.formula, true)}</div>`
      : '';

    // 折叠区：hint / explanation / warning / insight
    const expandables = [];
    for (const key of ['hint', 'explanation', 'warning', 'insight']) {
      if (step[key]) {
        const meta = TYPE_META[key];
        expandables.push(`
          <details class="math-step-expandable ${meta.className}">
            <summary><span class="math-step-expandable-icon">${meta.icon}</span>${meta.label}</summary>
            <div class="math-step-expandable-body">${processInline(step[key])}</div>
          </details>
        `);
      }
    }

    // 答案区：默认展开（绿色块）
    const answerHtml = step.answer
      ? `<div class="math-step-answer"><span class="math-step-answer-label">✓ 答案</span><div class="math-step-answer-body">${processInline(step.answer)}</div></div>`
      : '';

    // 完成勾选
    const checkboxHtml = `
      <label class="math-step-done-label">
        <input type="checkbox" class="math-step-done" data-step-id="${stepNumber}">
        <span>已完成这一步</span>
      </label>
    `;

    return `
      <div class="math-step-step" data-step-number="${stepNumber}">
        <div class="math-step-step-header">
          ${stepTitle}
          ${checkboxHtml}
        </div>
        <div class="math-step-step-body">
          ${stepContent}
          ${stepFormulaHtml}
          ${expandables.join('')}
          ${answerHtml}
        </div>
      </div>
    `;
  }).join('');

  const totalSteps = steps.length;
  const progressHtml = `
    <div class="math-step-progress">
      <span class="math-step-progress-text">完成度</span>
      <span class="math-step-progress-count" data-done="0" data-total="${totalSteps}">0 / ${totalSteps}</span>
    </div>
  `;

  return `
    <section class="math-step" id="${escapeHtml(id)}" data-component="math-step" data-step-count="${totalSteps}">
      ${titleHtml}
      <div class="math-step-problem-box">
        ${problemHtml}
        ${problemFormulaHtml}
      </div>
      ${progressHtml}
      <div class="math-step-steps">${stepsHtml}</div>
    </section>
  `;
}

const clientJs = `
document.querySelectorAll('[data-component="math-step"]').forEach(function(root) {
  var total = parseInt(root.dataset.stepCount, 10) || 0;
  var countEl = root.querySelector('.math-step-progress-count');
  var checkboxes = root.querySelectorAll('.math-step-done');

  function updateProgress() {
    var done = 0;
    checkboxes.forEach(function(cb) { if (cb.checked) done++; });
    if (countEl) countEl.textContent = done + ' / ' + total;
    if (countEl) countEl.dataset.done = String(done);
    if (done === total && total > 0) {
      root.classList.add('math-step-all-done');
    } else {
      root.classList.remove('math-step-all-done');
    }
  }

  checkboxes.forEach(function(cb) {
    cb.addEventListener('change', updateProgress);
  });
});
`;

module.exports = { render, clientJs };
