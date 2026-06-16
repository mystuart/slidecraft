/**
 * @component tabs
 * @version 0.1.0
 * @status 首次可用
 *
 * 标签页切换组件（并列查看多个视角）
 *
 * 理念：step-guide 是线性流程（有前后顺序），tabs 是并列对比（无顺序）。
 * 适合"同一问题的多种解法"、"多平台对比"、"多语言同逻辑"。
 *
 * 字段：
 *   - id    {string}          可选 · 组件根 ID
 *   - title {string}          可选 · 组件标题（走 processInline）
 *   - tabs  [{label, content}] 必填 · 标签页数组
 *   - tabs[].label   {string}  标签标题（走 processInline，tab 按钮文案）
 *   - tabs[].content {string}  标签内容（走 processInline，支持多行 markdown）
 *
 * v0.1.0 首版：
 *   - 纯 tab 切换（点击 label → 显示对应 content）
 *   - 默认激活第一个 tab
 *   - processInline 渲染（支持行内 markdown + LaTeX）
 *   - 打印友好（打印时所有 tab 展开）
 *
 * 借鉴方向（v0.2+）：键盘 ←/→ 切换 / tab 可关闭 / 横向滚动（tab 多时）
 */

const { processInline, escapeHtml } = require('./_inline.js');

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('tb-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const tabs = Array.isArray(data.tabs) ? data.tabs.filter(t => t && typeof t === 'object') : [];

  if (tabs.length === 0) {
    return `<div class="tabs tabs-error">tabs 组件 tabs 数组为空，请检查 JSON。</div>`;
  }

  const labelsHtml = tabs.map((t, i) => {
    const label = t.label || ('标签 ' + (i + 1));
    return `<button class="tabs-label${i === 0 ? ' is-active' : ''}" data-tab-idx="${i}" role="tab" type="button">${processInline(label)}</button>`;
  }).join('');

  const panelsHtml = tabs.map((t, i) => {
    const content = t.content || '';
    return `<div class="tabs-panel${i === 0 ? ' is-active' : ''}" data-tab-idx="${i}" role="tabpanel">
      <div class="tabs-content">${processInline(content)}</div>
    </div>`;
  }).join('');

  return `<div class="tabs" data-tabs-id="${escapeHtml(id)}">
  ${title ? `<div class="tabs-heading">${processInline(title)}</div>` : ''}
  <div class="tabs-bar" role="tablist">${labelsHtml}</div>
  <div class="tabs-panels">${panelsHtml}</div>
</div>`;
}

const clientJs = `
document.querySelectorAll('.tabs').forEach(function(tb) {
  var labels = tb.querySelectorAll('.tabs-label');
  var panels = tb.querySelectorAll('.tabs-panel');
  labels.forEach(function(label) {
    label.addEventListener('click', function() {
      var idx = label.getAttribute('data-tab-idx');
      labels.forEach(function(l, i) { l.classList.toggle('is-active', i == idx); });
      panels.forEach(function(p, i) { p.classList.toggle('is-active', i == idx); });
    });
  });
});
`;

module.exports = { render, clientJs };
