/**
 * @component math-step
 * @version 0.2.0
 * @status 打磨完成
 *
 * 分步解题组件（数学/物理/化学）
 *
 * 字段：
 *   - id              {string}                       可选 · 组件根 ID
 *   - question        {string}                       必填 · 题面（兼容 problem）
 *   - questionFormula {string}                       可选 · 题面公式（兼容 problemFormula，KaTeX 编译时渲染）
 *   - celebrate       {boolean}                      可选 · 默认 true · 全部勾选后根卡片变绿；false 时关闭庆祝效果
 *   - steps           [{content, formula?, answer?, hint?, explanation?, warning?, insight?}]  必填 · 步骤数组
 *   - steps[].content      {string}                  步骤正文（走 processInline）
 *   - steps[].formula      {string}                  可选 · 步骤公式（KaTeX）
 *   - steps[].answer       {string}                  可选 · 该步最终答案（默认展开，绿色块）
 *   - steps[].hint         {string}                  可选 · 提示（默认展开）
 *   - steps[].explanation  {string}                  可选 · 详解（默认展开）
 *   - steps[].warning      {string}                  可选 · 易错点（默认展开）
 *   - steps[].insight      {string}                  可选 · 拓展（默认展开）
 *
 * 形态：纵向展开，所有步骤同时可见，每步有"完成"勾选和折叠式 hint/explanation/warning/insight。
 *
 * v0.2.0 变更：
 *   - 4 折叠区（hint/explanation/warning/insight）统一琥珀色，视觉降噪
 *   - answer / 4 折叠区全部默认展开（教学感 > 探索感）
 *   - 加 hairline 进度条 + 文字 "已完成 X / N"（替代原纯文字）
 *   - 加 `celebrate: false` 字段，关闭全卡片变绿效果
 *
 * 已知问题：step.content 不支持内联 LaTeX（系统级问题 #1，待 processInline 升级后解决）。
 */

'use strict';

const { processInline, escapeHtml } = require('./_inline');
const katex = require('katex');

const TYPE_META = {
  hint:        { icon: '💡', label: '提示' },
  explanation: { icon: '📖', label: '详细解析' },
  warning:     { icon: '⚠️', label: '易错点' },
  insight:     { icon: '🌟', label: '关键洞察' },
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
  const celebrate = data.celebrate !== false; // 默认 true
  // 步骤联动：把每步的 highlight + geometry3dId 透传到客户端
  // - 顶层 geometry3dId：默认目标（每步可单独覆盖）
  // - 每步 highlight: { edges: [[a,b],...], planes: ["AB1C",...] }
  const defaultGeomId = data.geometry3dId || '';
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

    // 折叠区：hint / explanation / warning / insight（v0.2.0 起 4 种统一琥珀色）
    const expandables = [];
    for (const key of ['hint', 'explanation', 'warning', 'insight']) {
      if (step[key]) {
        const meta = TYPE_META[key];
        expandables.push(`
          <details class="math-step-expandable" open>
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

    // 步骤联动：透传 highlight 到 data-attr（客户端读取后调 window.__cwGeom3D[id].setHighlight）
    const stepGeomId = step.geometry3dId || defaultGeomId;
    const highlightAttr = step.highlight
      ? ` data-highlight='${escapeHtml(JSON.stringify(step.highlight))}' data-geometry-3d-id="${escapeHtml(stepGeomId)}"`
      : '';

    // 完成勾选
    const checkboxHtml = `
      <label class="math-step-done-label">
        <input type="checkbox" class="math-step-done" data-step-id="${stepNumber}">
        <span>已完成这一步</span>
      </label>
    `;

    return `
      <div class="math-step-step" data-step-number="${stepNumber}"${highlightAttr}>
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
      <span class="math-step-progress-text">已完成</span>
      <div class="math-step-progress-track">
        <div class="math-step-progress-bar" data-progress="0"></div>
      </div>
      <span class="math-step-progress-count" data-done="0" data-total="${totalSteps}">0 / ${totalSteps}</span>
    </div>
  `;

  return `
    <section class="math-step" id="${escapeHtml(id)}" data-component="math-step" data-step-count="${totalSteps}" data-celebrate="${celebrate ? 'true' : 'false'}" data-geometry-3d-id="${escapeHtml(defaultGeomId)}">
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
  var celebrate = root.dataset.celebrate !== 'false';
  var countEl = root.querySelector('.math-step-progress-count');
  var barEl = root.querySelector('.math-step-progress-bar');
  var checkboxes = root.querySelectorAll('.math-step-done');

  function updateProgress() {
    var done = 0;
    checkboxes.forEach(function(cb) { if (cb.checked) done++; });
    if (countEl) countEl.textContent = done + ' / ' + total;
    if (countEl) countEl.dataset.done = String(done);
    if (barEl) barEl.style.width = (total > 0 ? (done / total * 100) : 0) + '%';
    if (barEl) barEl.dataset.progress = String(done);
    if (done === total && total > 0 && celebrate) {
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
