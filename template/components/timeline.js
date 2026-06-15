/**
 * @component timeline
 * @version 0.1.0
 * @status 首次可用
 *
 * 时间线组件（讲发展史 / 演进过程 / 流程节点）
 *
 * 字段：
 *   - id    {string}                 可选 · 组件根 ID
 *   - title {string}                 可选 · 组件标题（走 processInline）
 *   - mode  'vertical'|'horizontal'  可选 · 布局模式（默认 vertical）
 *   - items [{time, title, description, tag?}]  必填 · 时间节点数组
 *   - items[].time        {string}   节点时间/序号（如 "1991" / "步骤 1"，走 processInline）
 *   - items[].title       {string}   节点标题（走 processInline）
 *   - items[].description {string}   节点描述（走 processInline，支持多行）
 *   - items[].tag         {string}   可选 · 节点角标（如 "里程碑" / "重要"）
 *
 * v0.1.0 首版：
 *   - 零运行时（纯 HTML/CSS）
 *   - 两种布局：vertical（左轴线 + 右内容）/ horizontal（顶部轴线 + 下方卡片）
 *   - 打印友好：break-inside avoid，每个节点不被截断
 *
 * 借鉴方向（v0.2+）：节点 icon（emoji→SVG）/ 当前节点高亮 / 节点点击展开详情
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § timeline
 */

const { processInline, escapeHtml } = require('./_inline.js');

const VALID_MODES = new Set(['vertical', 'horizontal']);

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'vertical';
}

function renderItem(item, idx) {
  const time = item.time || ('节点 ' + (idx + 1));
  const title = item.title || '';
  const description = item.description || '';
  const tag = item.tag ? `<span class="timeline-tag">${processInline(item.tag)}</span>` : '';

  return `<li class="timeline-item">
    <div class="timeline-marker"></div>
    <div class="timeline-time">${processInline(time)}</div>
    <div class="timeline-body">
      <div class="timeline-title">${processInline(title)}${tag ? ' ' + tag : ''}</div>
      ${description ? `<div class="timeline-desc">${processInline(description)}</div>` : ''}
    </div>
  </li>`;
}

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('t-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const mode = normalizeMode(data.mode);
  const items = Array.isArray(data.items) ? data.items.filter(it => it && typeof it === 'object') : [];

  if (items.length === 0) {
    return `<div class="timeline timeline-error">timeline 组件 items 为空，请检查 JSON。</div>`;
  }

  const itemsHtml = items.map(renderItem).join('');

  return `<div class="timeline timeline-${mode}" data-timeline-id="${escapeHtml(id)}">
  ${title ? `<div class="timeline-heading">${processInline(title)}</div>` : ''}
  <ol class="timeline-list">${itemsHtml}</ol>
</div>`;
}

module.exports = { render };
