const { escapeHtml } = require('./_inline.js');

// Concept-card 概念卡片网格组件
// 数据：{ id, title, columns: 1|2|3|4, cards: [{icon, title, desc}] }



function render(data) {
  const id = data.id || ('cc-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  let columns = parseInt(data.columns, 10);
  if (![1, 2, 3, 4].includes(columns)) columns = 3;
  const cards = Array.isArray(data.cards) ? data.cards : [];

  const cardsHtml = cards.map(c => `
    <div class="concept-card-item">
      ${c.icon ? `<span class="concept-card-icon">${escapeHtml(c.icon)}</span>` : ''}
      <h4 class="concept-card-item-title">${escapeHtml(c.title || '')}</h4>
      <p class="concept-card-item-desc">${escapeHtml(c.desc || '')}</p>
    </div>
  `).join('');

  return `<div class="concept-card" data-concept-card-id="${escapeHtml(id)}">
  ${title ? `<div class="concept-card-title">${escapeHtml(title)}</div>` : ''}
  <div class="concept-card-grid" data-cols="${columns}">${cardsHtml}</div>
</div>`;
}

module.exports = { render };
