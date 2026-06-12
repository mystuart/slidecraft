/**
 * @component concept-card
 * @version 0.2.0
 * @status 打磨完成
 *
 * 概念卡片网格
 *
 * 字段：
 *   - id        {string}                        可选 · 组件根 ID
 *   - title     {string}                        可选 · 组件标题
 *   - columns   {number}                        可选 · 网格列数（默认 auto-fit 250px）
 *   - cards     [{icon, iconType, title, desc}] 必填 · 卡片数组（别名 items，v0.2.2 兼容）
 *   - cards[].icon     {string}                图标内容（按 iconType 路由）
 *   - cards[].iconType 'emoji'|'svg'|'image'   图标类型（v0.2.0 新增，默认 emoji）
 *   - cards[].title    {string}                卡片标题（走 processInline）
 *   - cards[].desc     {string}                卡片描述（走 processInline，别名 description）
 *   - description       {string}               可选 · 组件级描述（JSDoc 未列出的字段，
 *                                              旧版 markdown 误用，已被忽略，删了不影响）
 *                                              v0.2.2 兼容期：若提供则作为网格上方说明
 *
 * iconType 行为：
 *   - emoji  原样输出 icon 字符串
 *   - svg    原样输出 icon 字符串（**不**转义）
 *   - image  icon 是 URL，自动包成 <img src="..."> + loading="lazy"
 *
 * v0.2.0 变更：iconType 字段路由 · title 走 processInline
 * v0.2.2 变更：兼容 items / description 别名（binary-card-trick 误用致静默白屏）；顶级 description 视为无效字段（v0.2.3 起再次弃用）
 *
 * 借鉴方向：响应式断点（移动端降级列数）/ 统一 SVG 图标库替换 emoji
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § concept-card
 *
 * 已知问题：emoji 跨平台渲染不一致（系统级问题 #3）。
 */

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

function normalizeCardItem(c) {
  if (!c || typeof c !== 'object') return null;
  return {
    icon: c.icon,
    iconType: c.iconType,
    title: c.title,
    desc: c.desc !== undefined ? c.desc : c.description,  // description 是 v0.2.2 兼容别名
  };
}

function render(data) {
  const id = data.id || ('cc-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const columns = Math.max(1, Math.min(4, parseInt(data.columns) || 3));
  const rawItems = Array.isArray(data.cards) ? data.cards
    : Array.isArray(data.items) ? data.items  // items 是 v0.2.2 兼容别名
    : [];
  const cards = rawItems.map(normalizeCardItem).filter(Boolean);
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
