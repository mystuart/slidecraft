/**
 * @component callout
 * @version 0.3.0
 * @status 打磨完成
 *
 * 高亮块组件（5 种 type）
 *
 * 字段：
 *   - type    'tip'|'warning'|'info'|'danger'|'note'  必填 · 高亮类型
 *   - title   {string}                                可选 · 标题
 *   - content {string}                                必填 · 正文（走 processInline）
 *
 * 调色板（v0.2.0 定型，复用现有 CSS 变量，零新变量）：
 *   - tip     绿（成功色）
 *   - warning 琥珀
 *   - info    蓝
 *   - danger  红
 *   - note    紫（主题主色）
 *
 * v0.3.0 变更：emoji 图标 → 内联 SVG（解决跨平台渲染不一致）
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § callout
 *
 * 已知问题：content 不支持内联 LaTeX（系统级问题 #1）。
 * 决策记录：见 [COMPONENTS.md](../../COMPONENTS.md) § 决策记录 #2（5 色调色板定型）。
 */

const { processInline, escapeHtml } = require('./_inline.js');

const TYPE_META = {
  tip:     { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.5.4.8.8 1 1.3h6c.2-.5.5-.9 1-1.3A7 7 0 0 0 12 2z"/></svg>', label: '小贴士' },
  warning: { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', label: '注意' },
  info:    { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>', label: '信息' },
  danger:  { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>', label: '危险' },
  note:    { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l3 3.2H6l3-3.2z"/></svg>', label: '笔记' },
};

function render(data) {
  const type = TYPE_META[data.type] ? data.type : 'note';
  const meta = TYPE_META[type];
  const title = data.title || meta.label;
  const content = data.content || '';
  return `<div class="callout callout-${type}">
  <div class="callout-icon">${meta.icon}</div>
  <div class="callout-body">
    <div class="callout-title">${escapeHtml(title)}</div>
    <div class="callout-content">${processInline(content)}</div>
  </div>
</div>`;
}

module.exports = { render };
