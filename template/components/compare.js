// Compare 对比组件
// 数据：{ id, title, mode, left: {label, tag, points[]}, right: {label, tag, points[]} }
// tag: good | bad | warn | neutral
// mode: good-bad | before-after | neutral（v0.2.0 新增）
//   - good-bad: 左对/右错（"vs" 圆牌 + 标签 "优劣对比"）
//   - before-after: 左前/右后（"vs" 圆牌 + 标签 "改进前 → 改进后"）
//   - neutral: 默认，纯并列（不显示标签和"vs"圆牌）
// points 每一项支持内联 markdown：**bold** / *italic* / `code` / [link](url) / $LaTeX$

const { processInline, escapeHtml } = require('./_inline.js');

const VALID_TAGS = new Set(['good', 'bad', 'warn', 'neutral']);
const VALID_MODES = new Set(['good-bad', 'before-after', 'neutral']);

const MODE_LABELS = {
  'good-bad': '优劣对比',
  'before-after': '改进前 → 改进后',
  // neutral 模式下不显示标签
};

function normalizeTag(tag) {
  return VALID_TAGS.has(tag) ? tag : 'neutral';
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'neutral';
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
  const mode = normalizeMode(data.mode);
  const modeLabelHtml = MODE_LABELS[mode]
    ? `<div class="compare-mode-label">${MODE_LABELS[mode]}</div>`
    : '';

  return `<div class="compare" data-compare-id="${escapeHtml(id)}" data-mode="${mode}">
  ${title ? `<div class="compare-title">${escapeHtml(title)}</div>` : ''}
  ${modeLabelHtml}
  <div class="compare-grid">
    ${renderSide(data.left)}
    ${renderSide(data.right)}
  </div>
</div>`;
}

module.exports = { render };
