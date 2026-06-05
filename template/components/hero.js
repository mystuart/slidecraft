const { escapeHtml } = require('./_inline.js');

// Hero 封面组件（杂志海报风 · 两列布局）
// 数据：{ title, subtitle, emoji, cta?, ctaHref?, visual? }
// visual: { value, rotated } 存在时渲染右列装饰（22rem 放大 emoji）
// cta 为空时按钮不渲染
// ctaHref 默认跳 #section-1



function render(data) {
  const title = data.title || '';
  const subtitle = data.subtitle || '';
  const emoji = data.emoji || '';
  const cta = data.cta || '';
  const ctaHref = data.ctaHref || '#section-1';
  const visual = data.visual;
  const visualHtml = visual && visual.value
    ? `<div class="hero-visual" style="transform: rotate(${visual.rotated || 0}deg)">${escapeHtml(visual.value)}</div>`
    : '';
  return `<section class="hero" id="hero">
  <div class="hero-inner">
    ${emoji ? `<div class="hero-emoji">${escapeHtml(emoji)}</div>` : ''}
    <h1 class="hero-title">${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="hero-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    ${cta ? `<a href="${escapeHtml(ctaHref)}" class="hero-cta">${escapeHtml(cta)} ↓</a>` : ''}
  </div>
  ${visualHtml}
</section>`;
}

module.exports = { render };
