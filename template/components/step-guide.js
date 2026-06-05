// Step-guide 步骤引导组件
// 数据：{ id, title, steps: [{title, content, example?}] }

const { processInline, escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('s-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const steps = Array.isArray(data.steps) ? data.steps : [];

  const tabsHtml = steps.map((s, i) => `
    <button class="step-guide-tab${i === 0 ? ' is-active' : ''}" data-step-idx="${i}" data-step-num="${i + 1}">${escapeHtml(s.title || s.label || ('步骤 ' + (i + 1)))}</button>
  `).join('');

  const panelsHtml = steps.map((s, i) => `
    <div class="step-guide-panel${i === 0 ? ' is-active' : ''}" data-step-idx="${i}">
      <h4 class="step-guide-step-title">第 ${i + 1} 步：${escapeHtml(s.title || s.label || '')}</h4>
      <div class="step-guide-content">${processInline(s.content || '')}</div>
      ${s.example ? `<div class="step-guide-example">${processInline(s.example)}</div>` : ''}
    </div>
  `).join('');

  return `<div class="step-guide" data-step-guide-id="${escapeHtml(id)}">
  ${title ? `<div class="step-guide-title">${escapeHtml(title)}</div>` : ''}
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
