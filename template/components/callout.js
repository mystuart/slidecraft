/**
 * @component callout
 * @version 0.2.0
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
 * 借鉴方向：每个 type 配统一 SVG icon / 内容超过 N 行默认折叠
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § callout
 *
 * 已知问题：content 不支持内联 LaTeX（系统级问题 #1）。
 * 决策记录：见 [COMPONENTS.md](../../COMPONENTS.md) § 决策记录 #2（5 色调色板定型）。
 */

const { processInline, escapeHtml } = require('./_inline.js');

const TYPE_META = {
  tip:     { icon: '💡', label: '小贴士' },
  warning: { icon: '⚠️', label: '注意' },
  info:    { icon: 'ℹ️', label: '信息' },
  danger:  { icon: '🚫', label: '危险' },
  note:    { icon: '📌', label: '笔记' },
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
