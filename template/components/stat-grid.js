/**
 * @component stat-grid
 * @version 0.1.0
 * @status 首次可用
 *
 * 数据卡片墙组件（关键数字 + 注释，冲击力表达）
 *
 * 理念：concept-card 偏"概念释义"，stat-grid 偏"数字冲击"。
 * 适合科普/数据叙事："中国 14 亿人"、"及格率 87%" 这种
 * 一个大数字 + 一句注释的表达。
 *
 * 字段：
 *   - id    {string}            可选 · 组件根 ID
 *   - title {string}            可选 · 组件标题（走 processInline）
 *   - stats [{value, label, unit?, trend?}]  必填 · 数据卡片数组
 *   - stats[].value  {string|number}  大数字（走 processInline，支持 LaTeX）
 *   - stats[].label  {string}          注释（走 processInline）
 *   - stats[].unit   {string}   可选 · 单位后缀（如 "亿"、"%"）
 *   - stats[].trend  {string}   可选 · 趋势标记（如 "↑12%" / "↓5%"）
 *
 * v0.1.0 首版：
 *   - 响应式网格（auto-fill，minmax 180px）
 *   - value 大字号（display 级），label 小字号
 *   - trend 用颜色区分（↑ 绿 / ↓ 红，前缀自动识别）
 *   - 打印友好
 *
 * 借鉴方向（v0.2+）：value 动画 count-up / 对比型（vs 上期）
 */

const { processInline, escapeHtml } = require('./_inline.js');

function renderStat(s) {
  const value = s.value != null ? String(s.value) : '';
  const unit = s.unit || '';
  const label = s.label || '';
  let trendHtml = '';
  if (s.trend) {
    const t = String(s.trend);
    const isUp = /↑|\+|升|增/.test(t);
    const isDown = /↓|-|降|减/.test(t);
    const cls = isDown ? 'stat-trend-down' : 'stat-trend-up';
    trendHtml = `<span class="stat-trend ${cls}">${processInline(t)}</span>`;
  }
  return `<div class="stat-card">
    <div class="stat-value">${processInline(value)}${unit ? `<span class="stat-unit">${processInline(unit)}</span>` : ''}</div>
    ${trendHtml}
    <div class="stat-label">${processInline(label)}</div>
  </div>`;
}

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('sg-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const stats = Array.isArray(data.stats) ? data.stats.filter(s => s && typeof s === 'object') : [];

  if (stats.length === 0) {
    return `<div class="stat-grid stat-grid-error">stat-grid 组件 stats 为空，请检查 JSON。</div>`;
  }

  const cardsHtml = stats.map(renderStat).join('');

  return `<div class="stat-grid" data-stat-grid-id="${escapeHtml(id)}">
  ${title ? `<div class="stat-grid-heading">${processInline(title)}</div>` : ''}
  <div class="stat-grid-cards">${cardsHtml}</div>
</div>`;
}

module.exports = { render };
