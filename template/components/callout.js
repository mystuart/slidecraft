// Callout 高亮块组件
// 数据：{ type, title, content }
// type: tip | warning | info | danger | note

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
