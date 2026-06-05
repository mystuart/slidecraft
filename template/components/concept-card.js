const { processInline, escapeHtml } = require('./_inline.js');

// Concept-card 概念卡片网格组件
// 数据：{ id, title, description, columns: 1|2|3|4, items|cards: [{icon, title|term, desc|definition}] }



function render(data) {
  const id = data.id || ('cc-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const description = data.description || '';
  let columns = parseInt(data.columns, 10);
  if (![1, 2, 3, 4].includes(columns)) columns = 3;
  const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.cards) ? data.cards : []);

  const itemsHtml = items.map(c => `
    <div class="concept-card-item">
      ${c.icon ? `<span class="concept-card-icon">${escapeHtml(c.icon)}</span>` : ''}
      <h4 class="concept-card-item-title">${processInline(c.title || c.term || '')}</h4>
      <p class="concept-card-item-desc">${processInline(c.desc || c.definition || '')}</p>
    </div>
  `).join('');

  return `<div class="concept-card" data-concept-card-id="${escapeHtml(id)}">
  ${title ? `<div class="concept-card-title">${processInline(title)}</div>` : ''}
  ${description ? `<p class="concept-card-desc">${processInline(description)}</p>` : ''}
  <div class="concept-card-grid" data-cols="${columns}">${itemsHtml}</div>
</div>`;
}

module.exports = { render };
