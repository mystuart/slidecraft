/**
 * @component slider
 * @version 0.1.0
 * @status 最小可用版
 *
 * 滑块组件（拖动实时改值，可联动 geometry-3d 顶点）
 *
 * 字段：
 *   - id                  {string}                可选 · 组件根 ID（未指定自动生成）
 *   - title               {string}                可选 · 卡片小标题
 *   - label               {string}                必填 · 滑块上方的文字描述
 *   - min                 {number}                必填 · 滑块最小值
 *   - max                 {number}                必填 · 滑块最大值
 *   - step                {number}                可选 · 步长（默认 (max-min)/100）
 *   - defaultValue        {number}                可选 · 初始值（默认取 (min+max)/2）
 *   - unit                {string}                可选 · 显示单位文字，会跟在数字后面
 *   - showValue           {bool}                  可选 · 是否显示当前数值（默认 true）
 *   - linkedGeometry3d    {string}                可选 · 联动的 geometry-3d 实例 ID
 *   - drives              {array}                 可选 · 滑块驱动的顶点
 *   - drives[].vertex     {string}                顶点 label 名（需在 geometry-3d labels 中存在）
 *   - drives[].path       {string[]}              沿这两个 label 之间插值
 *   - drives[].param      {'value'|'1-value'}     可选 · 插值参数，'value' 表示 t=value（默认），'1-value' 表示 t=1-value
 *   - caption             {string}                可选 · 卡片下方说明文字
 *
 * 联动规则：
 *   - 滑块值 v ∈ [min, max] ⇒ 归一化 t = (v - min) / (max - min) ∈ [0, 1]
 *   - 顶点新位置 = path[0] + t * (path[1] - path[0])
 *   - 联动后调用 window.__cwGeom3D[id].setLabelPos(name, pos)
 *   - 联动前把 t 通过 param 字段决定方向（"1-value" 用于反向：从 path[1] 滑到 path[0]）
 *
 * v0.1 实现边界：
 *   - path 必须正好 2 个 label（不支持更长的折线/曲线）
 *   - 不支持 param 引用其他滑块的值（v0.1 只支持滑块自身值）
 *   - 联动仅在客户端触发，初次渲染时不会自动调用 setLabelPos（保持 geometry-3d 标签的初始位置）
 *   - 联动会同时触发 geometry-3d 的 derivedVertices 重算（D = midpoint(P, C) 这种）
 *
 * 已知问题：
 *   - 暂不支持键盘左右键微调（浏览器原生 <input type=range> 已支持，不重复实现）
 *   - 不支持显示公式（caption 字段够用，未来加 captionFormula）
 */

const { escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('slider-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const label = data.label || '';
  const min = Number.isFinite(data.min) ? data.min : 0;
  const max = Number.isFinite(data.max) ? data.max : 1;
  let step = Number.isFinite(data.step) ? data.step : (max - min) / 100;
  if (step <= 0) step = (max - min) / 100;
  const defaultValue = Number.isFinite(data.defaultValue)
    ? Math.max(min, Math.min(max, data.defaultValue))
    : (min + max) / 2;
  const unit = data.unit || '';
  const showValue = data.showValue !== false;
  const linkedGeometry3d = data.linkedGeometry3d || '';
  const drives = Array.isArray(data.drives) ? data.drives : [];
  const caption = data.caption || '';

  // 把 drives 数据序列化进 data-attr，客户端解析后注册监听
  // 注意 escapeHtml 处理 JSON 字符串里的引号
  const drivesJson = JSON.stringify(drives);
  const titleHtml = title
    ? `<div class="slider-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="slider-caption">${escapeHtml(caption)}</div>`
    : '';

  return `<div class="slider" id="${escapeHtml(id)}" data-slider-id="${escapeHtml(id)}"
    data-min="${min}" data-max="${max}" data-step="${step}"
    data-default="${defaultValue}" data-unit="${escapeHtml(unit)}"
    data-linked-geometry-3d="${escapeHtml(linkedGeometry3d)}"
    data-drives='${escapeHtml(drivesJson)}'>
  ${titleHtml}
  <div class="slider-row">
    <input class="slider-input" type="range"
      min="${min}" max="${max}" step="${step}" value="${defaultValue}"
      aria-label="${escapeHtml(label)}">
    ${showValue ? `<span class="slider-value" data-unit="${escapeHtml(unit)}">${formatNumber(defaultValue)}${unit ? ' ' + escapeHtml(unit) : ''}</span>` : ''}
  </div>
  <div class="slider-label">${escapeHtml(label)}</div>
  ${captionHtml}
</div>`;
}

/**
 * 格式化数字：保留最多 4 位小数，去掉尾随 0
 * 让 0.5 显示为 0.5 而不是 0.500000
 */
function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  // 用 toFixed(4) 截断后再 parseFloat 去尾随 0
  const s = parseFloat(n.toFixed(4)).toString();
  return s;
}

const clientJs = `
document.querySelectorAll('.slider').forEach(function(s) {
  var id = s.getAttribute('data-slider-id');
  var min = parseFloat(s.getAttribute('data-min')) || 0;
  var max = parseFloat(s.getAttribute('data-max')) || 1;
  var step = parseFloat(s.getAttribute('data-step')) || ((max - min) / 100);
  var defaultValue = parseFloat(s.getAttribute('data-default')) || ((min + max) / 2);
  var unit = s.getAttribute('data-unit') || '';
  var linkedId = s.getAttribute('data-linked-geometry-3d') || '';
  var drives = [];
  try { drives = JSON.parse(s.getAttribute('data-drives') || '[]'); } catch (e) { drives = []; }

  var input = s.querySelector('.slider-input');
  var valueEl = s.querySelector('.slider-value');
  if (!input) return;

  // 数字格式化：保留最多 4 位小数，去尾随 0
  function fmtNum(n) {
    if (!isFinite(n)) return String(n);
    return parseFloat(n.toFixed(4)).toString();
  }

  // 归一化滑块值 → [0,1]
  function normalize(v) {
    if (max === min) return 0;
    return (v - min) / (max - min);
  }

  // 把 t 应用到所有 drives（驱动 geometry-3d 顶点）
  function applyDrives(t) {
    if (!linkedId || drives.length === 0) return;
    var api = (window.__cwGeom3D || {})[linkedId];
    if (!api || !api.setLabelPos) return;
    drives.forEach(function(d) {
      if (!d || !d.vertex) return;
      if (!Array.isArray(d.path) || d.path.length < 2) return;
      var p0 = api.getLabelPos ? api.getLabelPos(d.path[0]) : null;
      var p1 = api.getLabelPos ? api.getLabelPos(d.path[1]) : null;
      if (!p0 || !p1) return;
      var useT = t;
      if (d.param === '1-value') useT = 1 - t;
      // 线性插值
      var nx = p0[0] + useT * (p1[0] - p0[0]);
      var ny = p0[1] + useT * (p1[1] - p0[1]);
      var nz = p0[2] + useT * (p1[2] - p0[2]);
      api.setLabelPos(d.vertex, [nx, ny, nz]);
    });
  }

  // 更新显示 + 联动
  function onChange() {
    var v = parseFloat(input.value);
    if (valueEl) valueEl.textContent = fmtNum(v) + (unit ? ' ' + unit : '');
    var t = normalize(v);
    applyDrives(t);
  }

  input.addEventListener('input', onChange);
  // 初始值不触发（geometry-3d 标签已经放在默认位置），但如果用户希望初始就联动可改成 onChange()
});
`;

module.exports = { render, clientJs };
