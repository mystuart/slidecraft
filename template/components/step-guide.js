/**
 * @component step-guide
 * @version 0.2.0
 * @status 打磨完成
 *
 * 步骤引导组件（tab 切换形式）
 *
 * 字段：
 *   - id      {string}                可选 · 组件根元素 ID（默认自动生成）
 *   - title   {string}                可选 · 组件标题
 *   - steps   [{title, content, example?}]  必填 · 步骤数组
 *   - steps[].title   {string}        步骤标题（tab 文案，走 processInline）
 *   - steps[].content {string}        步骤正文（走 processInline）
 *   - steps[].example {string}        可选 · 代码示例，默认展开 + 可折叠
 *
 * v0.2.0 变更：title 走 processInline · example 默认展开 + 用 HTML 原生 <details> 折叠
 *
 * 借鉴方向：tab 视觉可改 timeline 节点 / 当前 step 序号角标 / 移动端横滑
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § step-guide
 *
 * 已知问题：example 代码无语法高亮（决策：不集成 hljs，保持零依赖）。
 */

const { processInline, escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('s-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const steps = Array.isArray(data.steps) ? data.steps : [];

  const tabsHtml = steps.map((s, i) => `
    <button class="step-guide-tab${i === 0 ? ' is-active' : ''}" data-step-idx="${i}" data-step-num="${i + 1}">${processInline(s.title || s.label || ('步骤 ' + (i + 1)))}</button>
  `).join('');

  const panelsHtml = steps.map((s, i) => {
    const exampleHtml = s.example
      ? `<details class="step-guide-example" open>
           <summary>示例</summary>
           <div class="step-guide-example-body">${processInline(s.example)}</div>
         </details>`
      : '';
    return `
    <div class="step-guide-panel${i === 0 ? ' is-active' : ''}" data-step-idx="${i}">
      <h4 class="step-guide-step-title">第 ${i + 1} 步：${processInline(s.title || s.label || '')}</h4>
      <div class="step-guide-content">${processInline(s.content || '')}</div>
      ${exampleHtml}
    </div>`;
  }).join('');

  return `<div class="step-guide" data-step-guide-id="${escapeHtml(id)}">
  ${title ? `<div class="step-guide-title">${processInline(title)}</div>` : ''}
  <div class="step-guide-tabs">${tabsHtml}</div>
  <div class="step-guide-panels">${panelsHtml}</div>
  <div class="step-guide-nav">
    <button class="step-guide-prev" type="button">← 上一步</button>
    <button class="step-guide-next" type="button">下一步 →</button>
  </div>
</div>`;
}

const clientJs = `
document.querySelectorAll('.step-guide').forEach(function(sg) {
  var tabs = sg.querySelectorAll('.step-guide-tab');
  var panels = sg.querySelectorAll('.step-guide-panel');
  var prevBtn = sg.querySelector('.step-guide-prev');
  var nextBtn = sg.querySelector('.step-guide-next');
  var current = 0;

  function show(i) {
    if (i < 0) i = 0;
    if (i >= panels.length) i = panels.length - 1;
    current = i;
    tabs.forEach(function(t, idx) {
      t.classList.toggle('is-active', idx === i);
      t.classList.toggle('is-done', idx < i);
    });
    panels.forEach(function(p, idx) {
      p.classList.toggle('is-active', idx === i);
    });
    prevBtn.disabled = (i === 0);
    nextBtn.disabled = (i === panels.length - 1);
  }

  tabs.forEach(function(t) {
    t.addEventListener('click', function() {
      show(parseInt(t.getAttribute('data-step-idx'), 10));
    });
  });
  prevBtn.addEventListener('click', function() { show(current - 1); });
  nextBtn.addEventListener('click', function() { show(current + 1); });

  show(0);
});
`;

module.exports = { render, clientJs };
