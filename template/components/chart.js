/**
 * @component chart
 * @version 0.1.0
 * @status 首次可用
 *
 * 数据图表组件（柱状 / 折线 / 饼图，编译时渲染静态 SVG）
 *
 * 理念：教学场景的"展示一组数据"，不是数据分析工具。纯静态 SVG，
 * 零运行时、打印友好、不依赖外部图表库。
 *
 * 字段：
 *   - id    {string}           可选 · 组件根 ID
 *   - title {string}           可选 · 图表标题（走 processInline）
 *   - type  'bar'|'line'|'pie' 必填 · 图表类型
 *   - data  [{label, value}]   必填 · 数据点数组
 *   - data[].label  {string}   数据点标签（走 processInline）
 *   - data[].value  {number}   数据点数值
 *   - unit  {string}           可选 · 数值单位（如 "万"、"%"）
 *   - yAxisLabel {string}      可选 · y 轴说明（仅 bar/line）
 *   - height {number}          可选 · SVG 高度 px（默认 280，bar/line）/（默认 260，pie）
 *
 * v0.1.0 首版：
 *   - 3 种图表：bar（柱状 + 网格线 + 数值标注）/ line（折线 + 圆点 + 数值标注）/ pie（饼 + 图例）
 *   - 编译时 SVG 生成，零运行时
 *   - 配色复用主题 CSS 变量（primary / accent / success / warning / info / danger）
 *   - 打印友好（SVG 矢量，不模糊）
 *
 * 借鉴方向（v0.2+）：多系列（bar 分组）/ 堆叠 / hover 交互（需要 clientJs）
 *
 * 已知问题：单系列（一组数据），多系列留 v0.2。
 */

const { processInline, escapeHtml } = require('./_inline.js');

// 配色池（复用主题变量，饼图按顺序取色）
const PIE_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-danger)',
  'var(--color-accent)',
  'var(--color-primary-dark)',
  'var(--color-primary-light)',
];

// SVG 文本里的特殊字符转义（label 经过 processInline 后可能含 HTML，这里只要纯文本）
function svgText(s) {
  return escapeHtml(String(s).replace(/<[^>]+>/g, '')).trim();
}

function formatValue(v, unit) {
  const num = (typeof v === 'number' && isFinite(v)) ? v : 0;
  const rounded = Math.round(num * 100) / 100;
  return unit ? `${rounded}${unit}` : String(rounded);
}

// ============================================================
// 柱状图
// ============================================================
function renderBar(data, opts) {
  const items = data;
  const unit = opts.unit || '';
  const W = 600, H = opts.height || 280;
  const padL = 48, padR = 20, padT = 24, padB = 50;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const values = items.map(d => Number(d.value) || 0);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  // y 轴范围：从 min(0, 最小值) 到 max(0, 最大值)，向上取整到漂亮刻度
  const yMax = niceMax(maxVal);
  const yMin = minVal < 0 ? -niceMax(-minVal) : 0;
  const yRange = yMax - yMin || 1;
  const zeroY = padT + plotH * (yMax / yRange);

  const n = items.length;
  const slotW = plotW / n;
  const barW = Math.min(slotW * 0.6, 48);

  // 网格线 + y 轴刻度（4 等分）
  const ticks = 4;
  let gridSvg = '';
  for (let i = 0; i <= ticks; i++) {
    const val = yMin + (yRange * i / ticks);
    const y = padT + plotH - (plotH * i / ticks);
    gridSvg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--color-border)" stroke-width="1"/>`;
    gridSvg += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--color-text-muted)">${formatValue(val, unit)}</text>`;
  }

  // 零轴加粗
  if (yMin < 0) {
    gridSvg += `<line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="var(--color-text)" stroke-width="1.2"/>`;
  }

  // 柱子
  let barsSvg = '';
  items.forEach((d, i) => {
    const val = Number(d.value) || 0;
    const x = padL + slotW * i + (slotW - barW) / 2;
    const barH = (Math.abs(val) / yRange) * plotH;
    const y = val >= 0 ? zeroY - barH : zeroY;
    const label = svgText(d.label || ('' + (i + 1)));
    // 柱子
    barsSvg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="var(--color-primary)" opacity="0.85"/>`;
    // 数值标注（在柱子顶/底外侧）
    const ty = val >= 0 ? y - 6 : y + barH + 14;
    barsSvg += `<text x="${x + barW / 2}" y="${ty}" text-anchor="middle" font-size="11" fill="var(--color-text)">${formatValue(val, unit)}</text>`;
    // x 轴标签（长标签旋转 -30°）
    const lx = x + barW / 2;
    const ly = H - padB + 16;
    const labelLen = label.length;
    if (labelLen > 4) {
      barsSvg += `<text x="${lx}" y="${ly}" text-anchor="end" font-size="11" fill="var(--color-text-muted)" transform="rotate(-30 ${lx} ${ly})">${label}</text>`;
    } else {
      barsSvg += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="11" fill="var(--color-text-muted)">${label}</text>`;
    }
  });

  // 坐标轴
  const axisSvg = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--color-text-muted)" stroke-width="1"/>`;

  // y 轴标签（旋转）
  let yLabelSvg = '';
  if (opts.yAxisLabel) {
    yLabelSvg = `<text x="14" y="${padT + plotH / 2}" text-anchor="middle" font-size="11" fill="var(--color-text-muted)" transform="rotate(-90 14 ${padT + plotH / 2})">${svgText(opts.yAxisLabel)}</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">
    ${gridSvg}${axisSvg}${yLabelSvg}${barsSvg}
  </svg>`;
}

// ============================================================
// 折线图
// ============================================================
function renderLine(data, opts) {
  const items = data;
  const unit = opts.unit || '';
  const W = 600, H = opts.height || 280;
  const padL = 48, padR = 20, padT = 24, padB = 50;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const values = items.map(d => Number(d.value) || 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const yMax = niceMax(maxVal);
  const yMin = minVal >= 0 ? 0 : -niceMax(-minVal);
  const yRange = (yMax - yMin) || 1;

  const n = items.length;
  const xStep = n > 1 ? plotW / (n - 1) : 0;

  // 点坐标
  const pts = items.map((d, i) => {
    const val = Number(d.value) || 0;
    const x = padL + i * xStep;
    const y = padT + plotH - ((val - yMin) / yRange) * plotH;
    return { x, y, val, label: d.label };
  });

  // 网格线
  const ticks = 4;
  let gridSvg = '';
  for (let i = 0; i <= ticks; i++) {
    const val = yMin + (yRange * i / ticks);
    const y = padT + plotH - (plotH * i / ticks);
    gridSvg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--color-border)" stroke-width="1"/>`;
    gridSvg += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--color-text-muted)">${formatValue(val, unit)}</text>`;
  }

  // 折线 path
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const lineSvg = `<path d="${linePath}" fill="none" stroke="var(--color-primary)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;

  // 点 + 数值
  let dotsSvg = '';
  pts.forEach(p => {
    dotsSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--color-primary)" stroke="var(--color-surface)" stroke-width="1.5"/>`;
    dotsSvg += `<text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--color-text)">${formatValue(p.val, unit)}</text>`;
  });

  // x 轴标签
  let xLabelsSvg = '';
  pts.forEach(p => {
    const label = svgText(p.label || '');
    const labelLen = label.length;
    const ly = H - padB + 16;
    if (labelLen > 4) {
      xLabelsSvg += `<text x="${p.x.toFixed(1)}" y="${ly}" text-anchor="end" font-size="11" fill="var(--color-text-muted)" transform="rotate(-30 ${p.x.toFixed(1)} ${ly})">${label}</text>`;
    } else {
      xLabelsSvg += `<text x="${p.x.toFixed(1)}" y="${ly}" text-anchor="middle" font-size="11" fill="var(--color-text-muted)">${label}</text>`;
    }
  });

  const axisSvg = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--color-text-muted)" stroke-width="1"/>`;

  let yLabelSvg = '';
  if (opts.yAxisLabel) {
    yLabelSvg = `<text x="14" y="${padT + plotH / 2}" text-anchor="middle" font-size="11" fill="var(--color-text-muted)" transform="rotate(-90 14 ${padT + plotH / 2})">${svgText(opts.yAxisLabel)}</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">
    ${gridSvg}${axisSvg}${yLabelSvg}${lineSvg}${dotsSvg}${xLabelsSvg}
  </svg>`;
}

// ============================================================
// 饼图
// ============================================================
function renderPie(data, opts) {
  const items = data;
  const unit = opts.unit || '';
  const total = items.reduce((s, d) => s + (Number(d.value) || 0), 0);
  if (total <= 0) {
    return `<div class="chart-error">饼图数据总和必须大于 0。</div>`;
  }

  const W = 600, H = opts.height || 260;
  const cx = 180, cy = H / 2;
  const r = Math.min(cx - 30, cy - 20);

  let startAngle = -Math.PI / 2; // 从 12 点钟方向开始
  let slicesSvg = '';
  const legend = [];

  items.forEach((d, i) => {
    const val = Number(d.value) || 0;
    const angle = (val / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const color = PIE_COLORS[i % PIE_COLORS.length];
    const label = svgText(d.label || ('' + (i + 1)));
    const pct = (val / total * 100);

    // 扇形 path
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    if (items.length === 1) {
      // 只有一项：画整圆
      slicesSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    } else {
      slicesSvg += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}" stroke="var(--color-surface)" stroke-width="2"/>`;
    }

    legend.push({ label, val, pct, color });
    startAngle = endAngle;
  });

  // 图例
  const legendHtml = legend.map(g =>
    `<li class="chart-legend-item">
      <span class="chart-legend-dot" style="background:${g.color}"></span>
      <span class="chart-legend-label">${g.label}</span>
      <span class="chart-legend-value">${formatValue(g.val, unit)}（${g.pct.toFixed(1)}%）</span>
    </li>`
  ).join('');

  return `<div class="chart-pie-wrap">
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg-pie" role="img">
      ${slicesSvg}
    </svg>
    <ul class="chart-legend">${legendHtml}</ul>
  </div>`;
}

// 取一个"漂亮"的刻度上限（如 87 → 100，23 → 25，1230 → 1500）
function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * mag;
}

// ============================================================
// 主渲染函数
// ============================================================
function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('ch-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const type = ['bar', 'line', 'pie'].includes(data.type) ? data.type : 'bar';
  const items = Array.isArray(data.data) ? data.data.filter(it => it && typeof it === 'object') : [];
  const opts = {
    unit: data.unit || '',
    yAxisLabel: data.yAxisLabel || '',
    height: Number(data.height) || undefined,
  };

  if (items.length === 0) {
    return `<div class="chart chart-error">chart 组件 data 为空，请检查 JSON。</div>`;
  }

  let bodySvg;
  try {
    if (type === 'bar') bodySvg = renderBar(items, opts);
    else if (type === 'line') bodySvg = renderLine(items, opts);
    else bodySvg = renderPie(items, opts);
  } catch (e) {
    return `<div class="chart chart-error">chart 渲染失败（type=${type}）：${escapeHtml(e.message)}</div>`;
  }

  return `<div class="chart" data-chart-id="${escapeHtml(id)}" data-chart-type="${type}">
  ${title ? `<div class="chart-title">${processInline(title)}</div>` : ''}
  <div class="chart-body">${bodySvg}</div>
</div>`;
}

module.exports = { render, niceMax };
