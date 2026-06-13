/**
 * @component slider
 * @version 0.1.2
 * @status 最小可用版
 *
 * 滑块组件（拖动实时改值，可联动 geometry-3d 顶点 或 function-plot 参数）
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
 *   - linkedFunctionPlot  {string}                可选 · 联动的 function-plot 实例 ID（v0.1.2 新增）
 *   - drives              {array}                 可选 · 滑块驱动的目标
 *
 * drives 项（v0.1.2 双形态，向后兼容 v0.1.1）：
 *
 *   形态 A：驱动 geometry-3d 顶点（默认，当 drives[].vertex 存在时使用）
 *     - drives[].vertex     {string}                顶点 label 名（需在 geometry-3d labels 中存在）
 *     - drives[].path       {string[]}              沿这两个 label 之间插值
 *     - drives[].param      {'value'|'1-value'}     可选 · 插值参数
 *
 *   形态 B：驱动 function-plot 参数（当 drives[].fnId 存在时使用，必须配 linkedFunctionPlot）
 *     - drives[].fnId       {string}                function-plot 内某条函数的 id
 *     - drives[].param      {string}                函数参数名（如 "a", "b", "amp", "freq"）
 *     - drives[].map        {'linear'|'lerp'|'1-value'} 可选 · 映射方式
 *                                                  linear: 直接传 t (默认)
 *                                                  lerp:   在 [min, max] 间插值
 *                                                  1-value: 传 1 - t
 *     - drives[].min        {number}                lerp 模式下的下限（map=lerp 时必填）
 *     - drives[].max        {number}                lerp 模式下的上限（map=lerp 时必填）
 *
 *   注意：drives[].param 在两种形态下含义不同 —— A 是插值方向，B 是函数参数名
 *         判断标准：有没有 fnId
 *
 * 联动规则：
 *   - 滑块值 v ∈ [min, max] ⇒ 归一化 t = (v - min) / (max - min) ∈ [0, 1]
 *   - 形态 A：顶点新位置 = path[0] + t * (path[1] - path[0])
 *   - 形态 B：函数参数 = map 后的值（直接传 t / 在 [min,max] 插值 / 1-t）
 *
 * v0.1.2 实现边界：
 *   - 形态 A 的 path 必须正好 2 个 label（不支持更长的折线/曲线）
 *   - 形态 B 的 lerp 模式必须给 min/max，否则传 t 跟 linear 一样
 *   - linkedGeometry3d 和 linkedFunctionPlot 可同时设置（一次滑动驱动两个目标）
 *   - 联动仅在客户端触发，初次渲染时不会自动调用 setParam / setLabelPos
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
  const linkedFunctionPlot = data.linkedFunctionPlot || '';
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
    data-linked-function-plot="${escapeHtml(linkedFunctionPlot)}"
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
  var linkedFpId = s.getAttribute('data-linked-function-plot') || '';
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

  // 把 t 应用到所有 drives（驱动 geometry-3d 顶点 或 function-plot 参数）
  // v0.1.1：优先走 DOM 元素的 __cwApi（per-instance 闭包，A2 改造），
  // 兜底用 window.__cwGeom3D[id]（兼容老代码 + 跑在 DOM 之外的脚本）
  // v0.1.2：新增 function-plot 参数驱动（drives[].fnId/param/map/min/max）
  function applyDrives(t) {
    if (drives.length === 0) return;
    drives.forEach(function(d) {
      if (!d) return;

      // ---- 新支线：function-plot 参数驱动 ----
      if (linkedFpId && d.fnId && d.param) {
        var fpEl = document.getElementById(linkedFpId);
        if (!fpEl || !fpEl.__cwApi) return;
        var fpApi = fpEl.__cwApi;
        // 映射：t → 实际参数值
        // map: "linear"（默认）→ 直接传 t；"lerp" → 在 [d.min, d.max] 间插值
        var value;
        if (d.map === 'lerp') {
          // C3-3：lerp 必须给 min/max，漏配时静默回退成 [0,1]（等同 linear）——
          //   作者写 lerp 多半想要自定义范围，静默会让滑块「看起来没生效」，故 warn
          if (d.min == null || d.max == null) {
            console.warn('[slider] map=lerp 但未给 min/max（fnId=' + d.fnId + '），按 [0,1] 回退');
          }
          var lo = d.min != null ? d.min : 0;
          var hi = d.max != null ? d.max : 1;
          value = lo + t * (hi - lo);
        } else if (d.map === '1-value') {
          value = 1 - t;
        } else {
          // linear：直接传 t
          value = t;
        }
        fpApi.setParam(d.fnId, d.param, value);
        return;
      }

      // ---- 老支线：geometry-3d 顶点位置驱动 ----
      if (!linkedId || !d.vertex) return;
      var api = null;
      var linkedEl = document.getElementById(linkedId);
      if (linkedEl && linkedEl.__cwApi && linkedEl.__cwApi.setLabelPos) {
        api = linkedEl.__cwApi;
      } else if (window.__cwGeom3D && window.__cwGeom3D[linkedId]) {
        api = window.__cwGeom3D[linkedId];
      }
      if (!api || !api.setLabelPos) return;
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
