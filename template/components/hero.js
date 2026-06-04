// Hero 封面组件
// 数据：{ title, subtitle, emoji, cta, ctaHref }
// cta 为空时按钮不渲染（适合无 sections 的场景）
// ctaHref 默认跳 #section-1，可在 frontmatter 缺失 sections 时显式覆盖

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function render(data) {
  const title = data.title || '';
  const subtitle = data.subtitle || '';
  const emoji = data.emoji || '';
  const cta = data.cta || '';
  const ctaHref = data.ctaHref || '#section-1';
  return `<section class="hero" id="hero">
  <div class="hero-inner">
    ${emoji ? `<div class="hero-emoji">${escapeHtml(emoji)}</div>` : ''}
    <h1 class="hero-title">${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="hero-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    ${cta ? `<a href="${escapeHtml(ctaHref)}" class="hero-cta">${escapeHtml(cta)} ↓</a>` : ''}
  </div>
</section>`;
}

module.exports = { render };
