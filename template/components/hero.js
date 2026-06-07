/**
 * @component hero
 * @version 0.2.0
 * @status 打磨完成
 *
 * 封面组件（杂志海报风 · 两列布局）
 *
 * 字段：
 *   - title        {string}           必填 · 主标题
 *   - subtitle     {string}           可选 · 副标题
 *   - emoji        {string}           可选 · 装饰 emoji
 *   - cta          {string}           可选 · CTA 按钮文案（空字符串则不渲染）
 *   - ctaHref      {string}           可选 · CTA 跳转锚点（默认 #section-1）
 *   - visual       {object}           可选 · 右列装饰 { value, rotated }
 *   - visual.value {string}           右列装饰文本（通常是大号 emoji）
 *   - visual.rotated {number}         旋转角度（deg），默认 0
 *
 * 借鉴方向：S01 Cover「accent 全屏 + ASCII 呼吸点阵 + 反白标题 + 元数据 chrome（date / № / topic）」
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § hero
 *
 * 已知问题：CTA 锚点 `#sec-xxx` 与 renderer 自动生成的 anchor 规则未文档化（系统级问题 #2）。
 */

const { escapeHtml } = require('./_inline.js');



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
