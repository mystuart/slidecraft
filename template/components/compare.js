// Compare 对比组件
// 数据：{ id, title, left: {label, tag, points[]}, right: {label, tag, points[]} }
// tag: good | bad | warn | neutral
// points 每一项支持内联 markdown：**bold** / *italic* / `code` / [link](url)

const { processInline, escapeHtml } = require('./_inline.js');

const VALID_TAGS = new Set(['good', 'bad', 'warn', 'neutral']);

function normalizeTag(tag) {
  return VALID_TAGS.has(tag) ? tag : 'neutral';
}

function renderSide(side) {
  if (!side) return '';
  const label = side.label || '';
  const tag = normalizeTag(side.tag);
  const points = Array.isArray(side.points) ? side.points : [];
  return `<div class="compare-col" data-tag="${tag}">
    <div class="compare-label compare-tag-${tag}">${processInline(label)}</div>
    <ul class="compare-points">
      ${points.map(p => `<li>${processInline(p)}</li>`).join('')}
    </ul>
  </div>`;
}

function render(data) {
  const id = data.id || ('c-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  return `<div class="compare" data-compare-id="${escapeHtml(id)}">
  ${title ? `<div class="compare-title">${escapeHtml(title)}</div>` : ''}
  <div class="compare-grid">
    ${renderSide(data.left)}
    ${renderSide(data.right)}
  </div>
</div>`;
}

module.exports = { render };
