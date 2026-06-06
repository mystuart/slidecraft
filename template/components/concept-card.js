// Concept-card 概念卡片网格
// 数据：{ id, title, columns, cards: [{icon, iconType, title, desc}] }
// icon: emoji 字符 / <svg> 代码 / image URL（按 iconType 路由）
// iconType: 'emoji' | 'svg' | 'image'（v0.2.0 新增，默认 emoji）
//   - emoji: 原样输出 icon 字符串
//   - svg: 原样输出 icon 字符串（作者写 <svg>...</svg>，**不**转义）
//   - image: icon 是 URL，自动包成 <img src="..."> + loading="lazy"
// title / desc 都走 processInline（v0.2.0 起 title 也支持内联 markdown）

const { processInline, escapeHtml } = require('./_inline.js');

const VALID_ICON_TYPES = new Set(['emoji', 'svg', 'image']);

function normalizeIconType(t) {
  return VALID_ICON_TYPES.has(t) ? t : 'emoji';
}

function renderIcon(icon, iconType) {
  if (!icon) return '';
  const type = normalizeIconType(iconType);
  if (type === 'image') {
    // icon 是 URL，包成 <img>，加 alt 兜底
    return `<img class="concept-card-icon concept-card-icon-image" src="${escapeHtml(icon)}" alt="" loading="lazy" />`;
  }
  // emoji / svg：原样输出（不转义，给作者最大灵活度）
  return `<div class="concept-card-icon">${icon}</div>`;
}

function render(data) {
  const id = data.id || ('cc-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const columns = Math.max(1, Math.min(4, parseInt(data.columns) || 3));
  const cards = Array.isArray(data.cards) ? data.cards : [];
  return `<div class="concept-card" data-concept-id="${escapeHtml(id)}">
  <div class="concept-card-title">${processInline(title)}</div>
  <div class="concept-card-grid" data-cols="${columns}">
    ${cards.map(c => `<div class="concept-card-item">
      ${renderIcon(c.icon, c.iconType)}
      <h3 class="concept-card-item-title">${processInline(c.title || '')}</h3>
      <p class="concept-card-item-desc">${processInline(c.desc || '')}</p>
    </div>`).join('')}
  </div>
</div>`;
}

module.exports = { render };
