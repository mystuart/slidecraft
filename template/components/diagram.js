/**
 * @component diagram
 * @version 0.1.0
 * @status 首次可用
 *
 * 流程图 / 关系图组件（编译时生成静态 SVG）
 *
 * 理念：function-plot 画函数曲线，timeline 画线性序列，
 * diagram 画"网状关系"——系统架构、决策流程、因果关系。
 * 强制作者指定坐标（不做自动布局，保证可控 + 简单）。
 *
 * 字段：
 *   - id    {string}          可选 · 组件根 ID
 *   - title {string}          可选 · 组件标题（走 processInline）
 *   - width {number}          可选 · SVG 宽（默认 600）
 *   - height {number}         可选 · SVG 高（默认 360）
 *   - nodes [{id, label, x, y, shape?, kind?}]  必填 · 节点
 *     - shape 'rect'|'round'|'diamond'  可选 · 形状（默认 round）
 *     - kind  'start'|'end'|'process'|'decision'|'data'  可选 · 语义类型（决定配色）
 *   - edges [{from, to, label?}]  可选 · 边（from/to 引用 node id）
 *
 * 坐标系：左上原点，单位是"逻辑像素"，SVG viewBox 自适应。
 * 建议 x 间隔 120-180，y 间隔 80-100。
 *
 * v0.1.0 首版：
 *   - 3 种形状：rect（矩形）/ round（圆角）/ diamond（菱形，决策）
 *   - 5 种语义类型配色（start 绿 / end 红 / process 蓝 / decision 琥珀 / data 紫）
 *   - 边带箭头 + 可选标签
 *   - 编译时 SVG，零运行时
 *
 * 借鉴方向（v0.2+）：自动布局 / 曲线边 / 子图分组
 */

const { processInline, escapeHtml } = require('./_inline.js');

const KIND_COLOR = {
  start:    { fill: 'var(--color-success-bg)', stroke: 'var(--color-success)', text: 'var(--color-on-success)' },
  end:      { fill: 'var(--color-danger-bg)',  stroke: 'var(--color-danger)',  text: 'var(--color-on-danger)' },
  process:  { fill: 'var(--color-info-bg)',    stroke: 'var(--color-info)',    text: 'var(--color-on-info)' },
  decision: { fill: 'var(--color-warning-bg)', stroke: 'var(--color-warning)', text: 'var(--color-on-warning)' },
  data:     { fill: 'var(--color-primary-bg)', stroke: 'var(--color-primary)', text: 'var(--color-primary-dark)' },
};
const DEFAULT_COLOR = { fill: 'var(--color-surface)', stroke: 'var(--color-border)', text: 'var(--color-text)' };

const ARROW_DEF = '<defs><marker id="diagram-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)"/></marker></defs>';

function svgText(s) {
  return escapeHtml(String(s).replace(/<[^>]+>/g, '')).trim();
}

function renderNode(node) {
  const x = Number(node.x) || 0;
  const y = Number(node.y) || 0;
  const label = svgText(node.label || node.id || '');
  const shape = node.shape || 'round';
  const kind = node.kind;
  const color = (kind && KIND_COLOR[kind]) ? KIND_COLOR[kind] : DEFAULT_COLOR;
  const NW = 100, NH = 44;

  if (shape === 'rect') {
    return '<rect x="' + (x-NW/2) + '" y="' + (y-NH/2) + '" width="' + NW + '" height="' + NH + '" rx="2" fill="' + color.fill + '" stroke="' + color.stroke + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y+5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + color.text + '">' + label + '</text>';
  }
  if (shape === 'diamond') {
    const dw = NW/2 + 12, dh = NH/2 + 12;
    return '<path d="M ' + x + ' ' + (y-dh) + ' L ' + (x+dw) + ' ' + y + ' L ' + x + ' ' + (y+dh) + ' L ' + (x-dw) + ' ' + y + ' Z" fill="' + color.fill + '" stroke="' + color.stroke + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y+5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + color.text + '">' + label + '</text>';
  }
  return '<rect x="' + (x-NW/2) + '" y="' + (y-NH/2) + '" width="' + NW + '" height="' + NH + '" rx="10" fill="' + color.fill + '" stroke="' + color.stroke + '" stroke-width="1.5"/>' +
    '<text x="' + x + '" y="' + (y+5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + color.text + '">' + label + '</text>';
}

function renderEdge(edge, nodeMap) {
  const from = nodeMap[edge.from];
  const to = nodeMap[edge.to];
  if (!from || !to) return '';
  const x1 = Number(from.x) || 0, y1 = Number(from.y) || 0;
  const x2 = Number(to.x) || 0, y2 = Number(to.y) || 0;
  let line = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--color-text-muted)" stroke-width="1.5" marker-end="url(#diagram-arrow)"/>';
  let labelText = '';
  if (edge.label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    labelText = '<g><rect x="' + (mx-14) + '" y="' + (my-9) + '" width="28" height="18" rx="3" fill="var(--color-surface)" stroke="var(--color-border)"/>' +
      '<text x="' + mx + '" y="' + (my+4) + '" text-anchor="middle" font-size="11" fill="var(--color-text)">' + svgText(edge.label) + '</text></g>';
  }
  return line + labelText;
}

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('dg-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const width = Number(data.width) || 600;
  const height = Number(data.height) || 360;
  const nodes = Array.isArray(data.nodes) ? data.nodes.filter(n => n && typeof n === 'object' && n.id) : [];
  const edges = Array.isArray(data.edges) ? data.edges.filter(e => e && e.from && e.to) : [];

  if (nodes.length === 0) {
    return '<div class="diagram diagram-error">diagram 组件 nodes 为空，请检查 JSON。</div>';
  }

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const nodesSvg = nodes.map(renderNode).join('');
  const edgesSvg = edges.map(e => renderEdge(e, nodeMap)).join('');

  return '<div class="diagram" data-diagram-id="' + escapeHtml(id) + '">' +
    (title ? '<div class="diagram-heading">' + processInline(title) + '</div>' : '') +
    '<div class="diagram-body"><svg viewBox="0 0 ' + width + ' ' + height + '" class="diagram-svg" role="img" preserveAspectRatio="xMidYMid meet">' +
    ARROW_DEF + edgesSvg + nodesSvg + '</svg></div></div>';
}

module.exports = { render };
