/**
 * @component compare
 * @version 0.2.0
 * @status 打磨完成
 *
 * 对比组件（左右两列 + 4 tag 颜色）
 *
 * 字段：
 *   - id              {string}                              可选 · 组件根 ID
 *   - title           {string}                              可选 · 组件标题
 *   - mode            'good-bad'|'before-after'|'neutral'  必填 · 语义模式
 *   - left            {label, tag, points[]}               必填 · 左列
 *   - right           {label, tag, points[]}               必填 · 右列
 *   - left.label      {string}                              左列标题
 *   - left.tag        'good'|'bad'|'warn'|'neutral'         左列标签颜色
 *   - left.points     [string]                              左列要点（支持内联 markdown）
 *   - right.*         {同 left}                             右列
 *
 * mode 行为：
 *   - good-bad      "vs" 圆牌 + 标签 "优劣对比"
 *   - before-after  "vs" 圆牌 + 标签 "改进前 → 改进后"
 *   - neutral       纯并列，不显示"vs"圆牌和标签
 *
 * v0.2.0 变更：新增 mode 字段 · warn tag 视觉增强（边框）
 *
 * 借鉴方向：points 数量上限折叠 / 移动端纵向堆叠
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § compare
 *
 * 已知问题：good/bad 左右排序约定未文档化（系统级问题 #4 · 建议 good 在左 / bad 在右 / warn 居中）。
 */

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
