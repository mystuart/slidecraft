/**
 * @component function-plot
 * @version 0.1.0
 * @status 最小可用版（基于 coords-2d v0.1.0）
 *
 * v0.1.0 变更：
 *   - 第一版：5 种曲线类型（polynomial / sine / cosine / conic_ellipse /
 *     conic_hyperbola / conic_parabola）
 *   - 每种类型带预定义关键点（零点/极值/顶点/焦点）
 *   - 联动 coords-2d：监听 sc:coords2d:change 自动 redraw
 *   - 暴露 setParam / setFunctionParam / getParam / getValueAt 等 API
 *   - 多函数叠画（同一坐标系上画多条曲线）
 *
 * 平面直角坐标系 / 函数图像组件（结构化配置，零字符串解析）
 *
 * 字段：
 *   - id               {string}  必填 · 实例 id
 *   - title            {string}  可选 · 卡片标题
 *   - coords           {string}  必填 · 关联的 coords-2d 实例 id（坐标系从这里读 xRange/yRange/scale）
 *   - functions        {array}   必填 · 曲线列表（见下方 function 字段）
 *   - showKeyPoints    {bool}    可选 · 是否显示关键点（默认 true）
 *   - showKeyLabels    {bool}    可可选 · 是否显示关键点标签（默认 true）
 *   - pointColor       {string}  可选 · 关键点颜色（默认 #ff6b35）
 *   - caption          {string}  可选 · 卡片下方说明
 *
 * function 字段：
 *   - id               {string}  必填
 *   - type             {string}  必填 · "polynomial" | "sine" | "cosine" |
 *                                  "conic_ellipse" | "conic_hyperbola" | "conic_parabola"
 *   - params           {object}  必填 · 类型相关参数
 *   - color            {string}  可选 · 曲线颜色
 *   - width            {number}  可选 · 线宽（默认 2）
 *   - label            {string}  可选 · 曲线标签（走 KaTeX，显示在图例区或曲线旁）
 *   - showKeyPoints    {bool}    可选 · 单条覆盖（默认 true = 用 showKeyPoints 全局）
 *   - showLabel        {bool}    可选 · 是否画线段标签
 *
 * 客户端 API（per-instance 闭包，挂在 container.__scApi）：
 *   - getFunctions() → functions 列表（深拷贝）
 *   - getParam(fnId, name) → 当前参数值
 *   - setParam(fnId, name, value) → 改一个参数并重画
 *   - setFunctionParams(fnId, params) → 批量改
 *   - getValueAt(fnId, x) → 数值（NaN 表示 y 不存在，如 sqrt(-1)）
 *   - getKeyPoints(fnId) → [{type, x, y, label}, ...]
 *   - redraw() → 重画所有
 *
 * 关键点定义（v0.1.0）：
 *   - polynomial (coeffs=[a_n, a_{n-1}, ..., a_0]，**降序**，最高次在前)：
 *       例：y = x² - 2x - 3 → coeffs = [1, -2, -3]
 *       zeros         : 数值求根（扫描 + 二分，[-50, 50] 范围）
 *       vertex/extrema: 一阶导零点（用配套求导系数）
 *   - conic_ellipse (a, b)：
 *       vertices      : (±a, 0) 和 (0, ±b) 共 4 个
 *       foci          : (±c, 0) 其中 c = sqrt(a²-b²)
 *       center        : (0, 0)
 *   - conic_hyperbola (a, b)：
 *       vertices      : (±a, 0)
 *       foci          : (±c, 0) 其中 c = sqrt(a²+b²)
 *       asymptotes    : 两条直线 y = ±(b/a)x
 *   - conic_parabola (p, orientation)：
 *       vertex        : (0, 0)
 *       focus         : orientation 决定
 *       directrix     : 准线
 *   - sine/cosine (amp, freq, phase, offset)：
 *       max           : (phase+π/2 over freq, amp+offset)
 *       min           : (phase-π/2 over freq, -amp+offset)
 *       zeros         : (phase+kπ over freq, 0)
 *
 * 架构契约（与 coords-2d / geometry-3d 一致）：
 *   - data-* 属性存 JSON
 *   - 客户端 initAll() 在 DOMContentLoaded 跑
 *   - 联动靠事件（sc:coords2d:change → redraw）
 *   - 不依赖任何外部 JS 库（纯 Canvas 2D API）
 *
 * 已知问题（v0.1.0）：
 *   - 不支持自动求交（多条曲线交点手动算）—— v0.2
 *   - 不支持鼠标 hover 看坐标 —— v0.2
 *   - 不支持自定义 LaTeX 表达式（系数/参数化方式表达）—— 结构化数据已够 90% 数学场景
 *   - polynomial 零点和极值用 companion matrix 数值法，可能对高次项（n>6）不稳定 —— v0.2 改 Sturm 序列
 */

const { escapeHtml } = require('./_inline.js');
const { clientJs: geomUtilsJs } = require('./_geom_utils.js');

function render(data) {
  const id = data.id || ('functionplot-' + Math.random().toString(36).slice(2, 10));
  const title = data.title || '';
  const caption = data.caption || '';
  const coords = data.coords || '';
  const functions = Array.isArray(data.functions) ? data.functions : [];
  const showKeyPoints = data.showKeyPoints !== false;
  const showKeyLabels = data.showKeyLabels !== false;
  const pointColor = data.pointColor || '#ff6b35';

  const config = {
    coords,
    functions,
    showKeyPoints,
    showKeyLabels,
    pointColor,
  };
  const meta = { id };

  const titleHtml = title
    ? `<div class="function-plot-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="function-plot-caption">${escapeHtml(caption)}</div>`
    : '';

  // v0.1.0 架构：function-plot 的 canvas 会被 JS 端注入到对应 coords-2d 的 stage 内部，
  // 跟 coords-2d canvas 视觉上叠在同一区域（pointer-events: none 让交互穿透到 coords）。
  // 这里只输出「占位说明」+ title/caption，不画自身 stage —— stage 由 JS 在 init 时创建。
  return `<div class="function-plot" id="${escapeHtml(id)}"
     data-config='${escapeHtml(JSON.stringify(config))}'
     data-meta='${escapeHtml(JSON.stringify(meta))}'>
  ${titleHtml}
  <div class="function-plot-host" data-function-plot-id="${escapeHtml(id)}"></div>
  ${captionHtml}
</div>`;
}

// ============================================================
// 客户端 JS
// ============================================================
const clientJs = `
${geomUtilsJs}
(function() {
  function initOne(root) {
    var cfg, meta;
    try {
      cfg = JSON.parse(root.getAttribute('data-config') || '{}');
      meta = JSON.parse(root.getAttribute('data-meta') || '{}');
    } catch (e) { console.error('[function-plot] 配置解析失败:', e); return; }

    var coordsId = cfg.coords;
    if (!coordsId) {
      console.warn('[function-plot] 缺少 coords 字段，无法绘制');
      return;
    }
    // canvas 自身没渲染（v0.1.0 架构：JS 把 canvas 注入到 coords-2d stage 里）
    // 这里只占位（拿 host 元素的引用），真正 canvas 在 ensureCanvasInjected 里创建
    var canvas = null;
    var ctx = null;

    // 找关联 coords-2d 实例（用 id 互找）
    function getCoords() {
      return document.getElementById(coordsId);
    }
    function getCoordsApi() {
      var c = getCoords();
      return c && c.__scApi;
    }

    // v0.1.0 架构：把我们的 canvas 注入到 coords-2d 的 stage 里（叠在 coords canvas 之上）
    // 这要求 coords-2d 必须先 init 完成（__scApi 已挂上）
    function ensureCanvasInjected() {
      var coords = getCoords();
      if (!coords) return false;
      var stage = coords.querySelector('.coords-2d-stage');
      if (!stage) return false;
      // 已注入过就别重复
      if (stage.querySelector('.function-plot-canvas[data-fp-id="' + meta.id + '"]')) return true;
      // 确保 coords 自己已 init
      if (!coords.__scApi) return false;
      var newCanvas = document.createElement('canvas');
      newCanvas.className = 'function-plot-canvas';
      newCanvas.setAttribute('data-fp-id', meta.id);
      stage.appendChild(newCanvas);
      canvas = newCanvas; // 替换之前 querySelector 拿到的（可能不在 stage 里）
      ctx = canvas.getContext('2d');
      return true;
    }

    // 监听 coords 变化（来自 setXRange / setYRange / 窗口 resize）
    document.addEventListener('sc:coords2d:change', function(ev) {
      if (!ev.target || ev.target.id !== coordsId) return;
      redraw();
    });
    // 监听窗口缩放（coords-2d 自己会重画，我们跟画）
    window.addEventListener('resize', function() {
      requestAnimationFrame(redraw);
    });

    // ============== 关键点计算 ==============
    // polyEval / polyDeriv / polyRealRoots 来自 _geom_utils（cwGeom_ 前缀，顶部嵌入）

    /**
     * 关键点计算统一入口
     */
    function computeKeyPoints(fn) {
      var p = fn.params;
      switch (fn.type) {
        case 'polynomial': {
          var coeffs = p.coeffs || [];
          var zeros = cwGeom_polyRealRoots(coeffs.slice()).map(function(x) {
            return { type: 'zero', x: x, y: 0, label: 'x=' + round(x, 3) };
          });
          var dCoeffs = cwGeom_polyDeriv(coeffs);
          var d2Coeffs = cwGeom_polyDeriv(dCoeffs); // 二阶导系数（判凹凸）
          var extremaX = cwGeom_polyRealRoots(dCoeffs);
          var extrema = extremaX.map(function(x) {
            var y = cwGeom_polyEval(coeffs, x);
            // C1-2 修复：用二阶导在该点的符号判 min/max，不再用首项系数一刀切
            //   （旧逻辑对三次及以上会把 max/min 全标成同一种）
            //   d2 > 0 → 凹（min）/ d2 < 0 → 凸（max）/ d2 ≈ 0 → 拐点
            var d2 = cwGeom_polyEval(d2Coeffs, x);
            var type = d2 > 1e-9 ? 'min' : (d2 < -1e-9 ? 'max' : 'inflection');
            return { type: type, x: x, y: y, label: '(' + round(x, 2) + ', ' + round(y, 2) + ')' };
          });
          return zeros.concat(extrema);
        }
        case 'sine': case 'cosine': {
          var amp = p.amp != null ? p.amp : 1;
          var freq = p.freq != null ? p.freq : 1;
          var phase = p.phase || 0;
          var offset = p.offset || 0;
          var isCos = fn.type === 'cosine';
          var kps = [];
          // 极值：x = (π/2 - phase + kπ) / freq（sin 在 phase+π/2 取 max）
          // 简化为 2 个：max 和 min
          var period = 2 * Math.PI / freq;
          var xMax = (Math.PI / 2 - phase) / freq;
          var yMax = isCos ? (amp + offset) : (amp + offset);
          // 对 sine，max 在 phase + π/2
          if (isCos) {
            // cos max at x = -phase/freq + 2kπ
            xMax = -phase / freq;
            yMax = amp + offset;
          } else {
            xMax = (Math.PI / 2 - phase) / freq;
            yMax = amp + offset;
          }
          kps.push({ type: 'max', x: xMax, y: yMax, label: 'max (' + round(xMax, 2) + ', ' + round(yMax, 2) + ')' });
          kps.push({ type: 'min', x: xMax + period / 2, y: -amp + offset, label: 'min (' + round(xMax + period / 2, 2) + ', ' + round(-amp + offset, 2) + ')' });
          // 零点：x = (-phase + kπ) / freq（cos）or (-phase + kπ) / freq（sin）
          var x0 = isCos ? -phase / freq + Math.PI / (2 * freq) : -phase / freq;
          // 取可视域内最近的零点
          kps.push({ type: 'zero', x: x0, y: offset, label: 'x=' + round(x0, 2) });
          return kps;
        }
        case 'conic_ellipse': {
          var a = p.a != null ? p.a : 1;
          var b = p.b != null ? p.b : 1;
          var cx = p.cx || 0, cy = p.cy || 0;
          var c2 = a * a - b * b;
          var isVer = a >= b; // 长轴在 x 方向
          var kps = [];
          // 中心
          kps.push({ type: 'center', x: cx, y: cy, label: '(' + cx + ', ' + cy + ')' });
          if (isVer) {
            // 长轴 x
            kps.push({ type: 'vertex', x: cx + a, y: cy, label: '(' + (cx + a) + ', ' + cy + ')' });
            kps.push({ type: 'vertex', x: cx - a, y: cy, label: '(' + (cx - a) + ', ' + cy + ')' });
            kps.push({ type: 'vertex', x: cx, y: cy + b, label: '(' + cx + ', ' + (cy + b) + ')' });
            kps.push({ type: 'vertex', x: cx, y: cy - b, label: '(' + cx + ', ' + (cy - b) + ')' });
            if (c2 > 0) {
              var cf = Math.sqrt(c2);
              kps.push({ type: 'focus', x: cx + cf, y: cy, label: 'F₁' });
              kps.push({ type: 'focus', x: cx - cf, y: cy, label: 'F₂' });
              // v0.1.1 准线 label（仅 keypoint 展示，实际线由 drawConicEllipse 画）
              var aOverE = a * a / cf;
              kps.push({ type: 'directrix', x: cx + aOverE, y: cy, label: '右准线 x=' + round(cx + aOverE, 2) });
              kps.push({ type: 'directrix', x: cx - aOverE, y: cy, label: '左准线 x=' + round(cx - aOverE, 2) });
            }
          } else {
            kps.push({ type: 'vertex', x: cx, y: cy + a, label: '(' + cx + ', ' + (cy + a) + ')' });
            kps.push({ type: 'vertex', x: cx, y: cy - a, label: '(' + cx + ', ' + (cy - a) + ')' });
            kps.push({ type: 'vertex', x: cx + b, y: cy, label: '(' + (cx + b) + ', ' + cy + ')' });
            kps.push({ type: 'vertex', x: cx - b, y: cy, label: '(' + (cx - b) + ', ' + cy + ')' });
            if (c2 > 0) {
              var cf2 = Math.sqrt(c2);
              kps.push({ type: 'focus', x: cx, y: cy + cf2, label: 'F₁' });
              kps.push({ type: 'focus', x: cx, y: cy - cf2, label: 'F₂' });
            }
          }
          // v0.1.1 · onCurve 模式：椭圆上可拖动点 A = (a·cosθ + cx, b·sinθ + cy)
          //   slider 联动 param: "onCurve.theta" 改 θ，A 沿曲线动
          //   走 fp keypoint 系统自动画圆点 + label
          if (p.onCurve && typeof p.onCurve.theta === 'number') {
            var theta = p.onCurve.theta;
            var ax = a * Math.cos(theta) + cx;
            var ay = b * Math.sin(theta) + cy;
            var aLabel = (p.onCurve.label || 'A');
            kps.push({ type: 'onCurve', x: ax, y: ay, label: aLabel + ' (' + round(ax, 3) + ', ' + round(ay, 3) + ')' });
          }
          return kps;
        }
        case 'conic_hyperbola': {
          var a = p.a != null ? p.a : 1;
          var b = p.b != null ? p.b : 1;
          var cx = p.cx || 0, cy = p.cy || 0;
          var c = Math.sqrt(a * a + b * b);
          var kps = [];
          kps.push({ type: 'center', x: cx, y: cy, label: '(' + cx + ', ' + cy + ')' });
          kps.push({ type: 'vertex', x: cx + a, y: cy, label: '(' + (cx + a) + ', ' + cy + ')' });
          kps.push({ type: 'vertex', x: cx - a, y: cy, label: '(' + (cx - a) + ', ' + cy + ')' });
          kps.push({ type: 'focus', x: cx + c, y: cy, label: 'F₁' });
          kps.push({ type: 'focus', x: cx - c, y: cy, label: 'F₂' });
          kps.push({ type: 'asymptote', x: cx, y: cy, label: 'y=±(b/a)x' });
          return kps;
        }
        case 'conic_parabola': {
          var pp = p.p != null ? p.p : 1;
          var orient = p.orientation || 'up';
          var vx = p.vertex ? p.vertex[0] : 0;
          var vy = p.vertex ? p.vertex[1] : 0;
          var kps = [];
          kps.push({ type: 'vertex', x: vx, y: vy, label: '顶点 (' + vx + ', ' + vy + ')' });
          if (orient === 'up') {
            kps.push({ type: 'focus', x: vx, y: vy + pp / 4, label: '焦点' });
            kps.push({ type: 'directrix', x: vx, y: vy - pp / 4, label: '准线 y=' + (vy - pp / 4) });
          } else if (orient === 'down') {
            kps.push({ type: 'focus', x: vx, y: vy - pp / 4, label: '焦点' });
            kps.push({ type: 'directrix', x: vx, y: vy + pp / 4, label: '准线 y=' + (vy + pp / 4) });
          } else if (orient === 'right') {
            kps.push({ type: 'focus', x: vx + pp / 4, y: vy, label: '焦点' });
            kps.push({ type: 'directrix', x: vx - pp / 4, y: vy, label: '准线 x=' + (vx - pp / 4) });
          } else if (orient === 'left') {
            kps.push({ type: 'focus', x: vx - pp / 4, y: vy, label: '焦点' });
            kps.push({ type: 'directrix', x: vx + pp / 4, y: vy, label: '准线 x=' + (vx + pp / 4) });
          }
          return kps;
        }
        default:
          return [];
      }
    }

    function round(n, digits) {
      if (!isFinite(n)) return '∞';
      var m = Math.pow(10, digits);
      return parseFloat((Math.round(n * m) / m).toFixed(digits)).toString();
    }

    // ============== 曲线绘制 ==============

    /**
     * 多项式曲线：扫描 xRange 内每个像素列对应的 x，求 y，画 (x,y) → 像素
     */
    function drawPolynomial(fn) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var scale = coordsApi.getScale();
      if (!scale) return;
      var coords = getCoords();
      var xRange = coordsApi.getXRange();
      var yRange = coordsApi.getYRange();

      var coeffs = fn.params.coeffs || [];
      var color = fn.color || '#8b7dd8';
      var w = fn.width || 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';

      // 像素列扫描：从 stage 左到右，每 0.5px 一个 x
      var step = 0.5 / scale.pxPerUnitX;
      ctx.beginPath();
      var started = false;
      for (var x = xRange[0]; x <= xRange[1]; x += step) {
        var y = cwGeom_polyEval(coeffs, x);
        if (!isFinite(y)) { started = false; continue; }
        var sp = coordsApi.dataToScreen([x, y]);
        // 跳过 yRange 外的点（连不连看是否有空隙）
        if (y < yRange[0] - 5 || y > yRange[1] + 5) { started = false; continue; }
        if (!started) { ctx.moveTo(sp[0], sp[1]); started = true; }
        else ctx.lineTo(sp[0], sp[1]);
      }
      ctx.stroke();
    }

    /**
     * sin/cos 曲线
     */
    function drawSinCos(fn) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var xRange = coordsApi.getXRange();
      var amp = fn.params.amp != null ? fn.params.amp : 1;
      var freq = fn.params.freq != null ? fn.params.freq : 1;
      var phase = fn.params.phase || 0;
      var offset = fn.params.offset || 0;
      var f = fn.type === 'sine' ? Math.sin : Math.cos;
      var color = fn.color || '#8b7dd8';
      var w = fn.width || 2;
      var scale = coordsApi.getScale();
      if (!scale) return;
      var step = 0.5 / scale.pxPerUnitX;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      var started = false;
      for (var x = xRange[0]; x <= xRange[1]; x += step) {
        var y = amp * f(freq * x + phase) + offset;
        var sp = coordsApi.dataToScreen([x, y]);
        if (!started) { ctx.moveTo(sp[0], sp[1]); started = true; }
        else ctx.lineTo(sp[0], sp[1]);
      }
      ctx.stroke();
    }

    /**
     * 椭圆：x²/a² + y²/b² = 1 → y = ±b·sqrt(1 - x²/a²)
     * x ∈ [cx-a, cx+a] 有效
     */
    function drawConicEllipse(fn) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var scale = coordsApi.getScale();
      if (!scale) return;
      var a = fn.params.a != null ? fn.params.a : 1;
      var b = fn.params.b != null ? fn.params.b : 1;
      var cx = fn.params.cx || 0, cy = fn.params.cy || 0;
      var color = fn.color || '#8b7dd8';
      var w = fn.width || 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;

      var step = 0.5 / scale.pxPerUnitX;
      // 上半
      ctx.beginPath();
      var started = false;
      for (var x = cx - a; x <= cx + a; x += step) {
        var inner = 1 - (x - cx) * (x - cx) / (a * a);
        if (inner < 0) { started = false; continue; }
        var y = cy + b * Math.sqrt(inner);
        var sp = coordsApi.dataToScreen([x, y]);
        if (!started) { ctx.moveTo(sp[0], sp[1]); started = true; }
        else ctx.lineTo(sp[0], sp[1]);
      }
      ctx.stroke();
      // 下半
      ctx.beginPath();
      started = false;
      for (var x2 = cx - a; x2 <= cx + a; x2 += step) {
        var inner2 = 1 - (x2 - cx) * (x2 - cx) / (a * a);
        if (inner2 < 0) { started = false; continue; }
        var y2 = cy - b * Math.sqrt(inner2);
        var sp2 = coordsApi.dataToScreen([x2, y2]);
        if (!started) { ctx.moveTo(sp2[0], sp2[1]); started = true; }
        else ctx.lineTo(sp2[0], sp2[1]);
      }
      ctx.stroke();

      // ---- v0.1.1 · 准线绘制（v0.1.0 不支持，gaokao-2020-q18 课件需求） ----
      //   椭圆 x²/a² + y²/b² = 1，c² = a²-b²，e = c/a
      //   左右准线 x = cx ± a/e = cx ± a²/c
      if (fn.params.showDirectrix) {
        var c2 = a * a - b * b;
        if (c2 > 0) {
          var cf = Math.sqrt(c2);
          var e = cf / a;  // 离心率
          var aOverE = a / e;  // = a²/c
          var directrixColor = fn.params.directrixColor || '#888';
          var directrixStyle = fn.params.directrixStyle || 'dashed';
          ctx.save();
          ctx.strokeStyle = directrixColor;
          ctx.lineWidth = 1;
          if (directrixStyle === 'dashed') {
            ctx.setLineDash([4, 4]);
          }
          var yRange = coordsApi.getYRange();
          var yMin = yRange[0], yMax = yRange[1];
          // 左准线 x = cx - a²/c
          var xL = cx - aOverE;
          if (xL >= coordsApi.getXRange()[0] && xL <= coordsApi.getXRange()[1]) {
            var sp1 = coordsApi.dataToScreen([xL, yMin]);
            var sp2 = coordsApi.dataToScreen([xL, yMax]);
            ctx.beginPath();
            ctx.moveTo(sp1[0], sp1[1]);
            ctx.lineTo(sp2[0], sp2[1]);
            ctx.stroke();
          }
          // 右准线 x = cx + a²/c
          var xR = cx + aOverE;
          if (xR >= coordsApi.getXRange()[0] && xR <= coordsApi.getXRange()[1]) {
            var sp3 = coordsApi.dataToScreen([xR, yMin]);
            var sp4 = coordsApi.dataToScreen([xR, yMax]);
            ctx.beginPath();
            ctx.moveTo(sp3[0], sp3[1]);
            ctx.lineTo(sp4[0], sp4[1]);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      // v0.1.1 · onCurve 点：已经在 keypoint 阶段被画了（统一走 keypoint 渲染管道），
      // 这里无需再画。
    }

    /**
     * 双曲线：x²/a² - y²/b² = 1 → y = ±b·sqrt(x²/a² - 1)
     * |x| >= a 有效
     */
    function drawConicHyperbola(fn) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var scale = coordsApi.getScale();
      if (!scale) return;
      var a = fn.params.a != null ? fn.params.a : 1;
      var b = fn.params.b != null ? fn.params.b : 1;
      var cx = fn.params.cx || 0, cy = fn.params.cy || 0;
      var xRange = coordsApi.getXRange();
      var color = fn.color || '#8b7dd8';
      var w = fn.width || 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      var step = 0.5 / scale.pxPerUnitX;

      function drawBranch(sign) {
        // sign = +1 for x > a, -1 for x < -a
        ctx.beginPath();
        var started = false;
        var xStart = sign > 0 ? cx + a : xRange[0];
        var xEnd = sign > 0 ? xRange[1] : cx - a;
        for (var x = xStart; x <= xEnd; x += step) {
          var inner = (x - cx) * (x - cx) / (a * a) - 1;
          if (inner < 0) { started = false; continue; }
          var y = cy + sign * b * Math.sqrt(inner);
          var sp = coordsApi.dataToScreen([x, y]);
          if (!started) { ctx.moveTo(sp[0], sp[1]); started = true; }
          else ctx.lineTo(sp[0], sp[1]);
        }
        ctx.stroke();
        // -y
        ctx.beginPath();
        started = false;
        for (var x2 = xStart; x2 <= xEnd; x2 += step) {
          var inner2 = (x2 - cx) * (x2 - cx) / (a * a) - 1;
          if (inner2 < 0) { started = false; continue; }
          var y2 = cy - sign * b * Math.sqrt(inner2);
          var sp2 = coordsApi.dataToScreen([x2, y2]);
          if (!started) { ctx.moveTo(sp2[0], sp2[1]); started = true; }
          else ctx.lineTo(sp2[0], sp2[1]);
        }
        ctx.stroke();
      }
      drawBranch(1);
      drawBranch(-1);
    }

    /**
     * 抛物线，分两种几何：
     *   - "up"/"down"：x² = ±4py 形式（焦点在 vx 正上方/正下方），竖向 U/∩
     *     y 是 x 的函数：x = vx ± 2·sqrt(p·(y-vy))，y 走 vy → yRange[1] (or 0)
     *   - "left"/"right"：y² = ±4px 形式（焦点在 vy 正左/正右方），横向
     *     x 是 y 的函数：y = vy ± 2·sqrt(p·(x-vx))，x 走 vx → xRange[1] (or 0)
     *
     * 与 computeKeyPoints 一致：up → focus (vx, vy+p/4)，down → (vx, vy-p/4)，
     * right → focus (vx+p/4, vy)，left → focus (vx-p/4, vy)
     */
    function drawConicParabola(fn) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var scale = coordsApi.getScale();
      if (!scale) return;
      var p = fn.params.p != null ? fn.params.p : 1;
      var orient = fn.params.orientation || 'up';
      var vx = fn.params.vertex ? fn.params.vertex[0] : 0;
      var vy = fn.params.vertex ? fn.params.vertex[1] : 0;
      var xRange = coordsApi.getXRange();
      var yRange = coordsApi.getYRange();
      var color = fn.color || '#8b7dd8';
      var w = fn.width || 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      var stepX = 0.5 / scale.pxPerUnitX;
      var stepY = 0.5 / scale.pxPerUnitY;

      if (orient === 'up' || orient === 'down') {
        // 竖向抛物线：x² = 4p·(y - vy) → 解出 y = (x - vx)² / (4p) + vy
        //   up 焦点 (vx, vy + p/4) → 抛物线向上开口 (∩)，x 是自变量
        //   down 焦点 (vx, vy - p/4) → 抛物线向下开口 (U)
        // x 走 xRange，y 算出。**注意 up 时 y ≥ vy，down 时 y ≤ vy**
        var dirSign = orient === 'up' ? 1 : -1; // up: y 增, down: y 减
        ctx.beginPath();
        var started = false;
        for (var x = xRange[0]; x <= xRange[1]; x += stepX) {
          var dx = x - vx;
          // C0-1 残留修复：keypoint 把焦点放在 vy+p/4（焦点-准线定义反推 y=vy+dx²/p），
          //   旧 /(4p) 画出的曲线比焦点宽 4 倍。改 /p 对齐 keypoint 约定。
          var y = vy + dirSign * (dx * dx) / p;
          // 只画 y 满足方向约束的部分
          if (orient === 'up' && y < vy) { started = false; continue; }
          if (orient === 'down' && y > vy) { started = false; continue; }
          if (y < yRange[0] - 5 || y > yRange[1] + 5) { started = false; continue; }
          var sp = coordsApi.dataToScreen([x, y]);
          if (!started) { ctx.moveTo(sp[0], sp[1]); started = true; }
          else ctx.lineTo(sp[0], sp[1]);
        }
        ctx.stroke();
      } else {
        // 横向抛物线：y² = ±4p·(x-vx)
        //   right: 焦点 (vx+p/4, vy) → y = vy ± 2·sqrt(p·(x-vx))，x ≥ vx
        //   left:  焦点 (vx-p/4, vy) → y = vy ± 2·sqrt(p·(vx-x))，x ≤ vx
        var xStart = orient === 'right' ? vx : xRange[0];
        var xEnd   = orient === 'right' ? xRange[1] : vx;
        // +y 支
        ctx.beginPath();
        var started3 = false;
        for (var x3 = xStart; x3 <= xEnd; x3 += stepX) {
          var dx = orient === 'right' ? (x3 - vx) : (vx - x3);
          if (dx < 0) { started3 = false; continue; }
          // C0-1 残留修复：横向同理对齐 keypoint（焦点 vx±p/4 → y=vy±sqrt(p·dx)），去掉多余的 2×
          var y3 = vy + Math.sqrt(Math.abs(p * dx));
          if (y3 > yRange[1] + 5) { started3 = false; continue; }
          var sp3 = coordsApi.dataToScreen([x3, y3]);
          if (!started3) { ctx.moveTo(sp3[0], sp3[1]); started3 = true; }
          else ctx.lineTo(sp3[0], sp3[1]);
        }
        ctx.stroke();
        // -y 镜像
        ctx.beginPath();
        started3 = false;
        for (var x4 = xStart; x4 <= xEnd; x4 += stepX) {
          var dx2 = orient === 'right' ? (x4 - vx) : (vx - x4);
          if (dx2 < 0) { started3 = false; continue; }
          var y4 = vy - Math.sqrt(Math.abs(p * dx2));
          if (y4 < yRange[0] - 5) { started3 = false; continue; }
          var sp4 = coordsApi.dataToScreen([x4, y4]);
          if (!started3) { ctx.moveTo(sp4[0], sp4[1]); started3 = true; }
          else ctx.lineTo(sp4[0], sp4[1]);
        }
        ctx.stroke();
      }
    }

    // ============== 关键点绘制 ==============

    function drawKeyPoint(kp, color) {
      var coordsApi = getCoordsApi();
      if (!coordsApi) return;
      var xRange = coordsApi.getXRange();
      var yRange = coordsApi.getYRange();
      if (kp.x < xRange[0] || kp.x > xRange[1]) return;
      if (kp.y < yRange[0] || kp.y > yRange[1]) return;
      var sp = coordsApi.dataToScreen([kp.x, kp.y]);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      var r = 4;
      ctx.beginPath();
      ctx.arc(sp[0], sp[1], r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // ============== 主渲染 ==============

    function render() {
      var coords = getCoords();
      if (!coords || !getCoordsApi()) {
        // coords 还没初始化（或不同步）：延迟重画
        return;
      }
      if (!ensureCanvasInjected()) return;
      var coordsCanvas = coords.querySelector('.coords-2d-canvas');
      if (!coordsCanvas) return;
      // 把我们的 canvas 同步成 coords 的尺寸 + dpr
      var dpr = window.devicePixelRatio || 1;
      var coordsRect = coordsCanvas.getBoundingClientRect();
      var cssW = Math.max(120, Math.floor(coordsRect.width  || 480));
      var cssH = Math.max(120, Math.floor(coordsRect.height || 320));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // 画所有函数
      cfg.functions.forEach(function(fn) {
        switch (fn.type) {
          case 'polynomial': drawPolynomial(fn); break;
          case 'sine':
          case 'cosine': drawSinCos(fn); break;
          case 'conic_ellipse': drawConicEllipse(fn); break;
          case 'conic_hyperbola': drawConicHyperbola(fn); break;
          case 'conic_parabola': drawConicParabola(fn); break;
        }
      });

      // 画关键点
      if (cfg.showKeyPoints) {
        cfg.functions.forEach(function(fn) {
          var showThis = fn.showKeyPoints !== false;
          if (!showThis) return;
          var kps = computeKeyPoints(fn);
          var pointColor = fn.pointColor || cfg.pointColor;
          kps.forEach(function(kp) { drawKeyPoint(kp, pointColor); });
        });
      }
    }

    function redraw() {
      if (!ensureCanvasInjected()) {
        setTimeout(redraw, 50);
        return;
      }
      // 等下一帧确保 coords 已画完
      requestAnimationFrame(render);
    }

    // 第一次画：C2-2 修复 —— 订阅 coords-2d 的 ready 事件，
    // 替代旧的 setTimeout(50/200/500) 猜测式时序。
    // ready 事件保证 coords 已 init + 首次绘制完成，此时 ensureCanvasInjected 必然成功。
    var firstRenderDone = false;
    function firstRender() {
      if (firstRenderDone) return;
      if (!ensureCanvasInjected()) return; // ready 已发但 coords 异常，放弃（不再重试）
      firstRenderDone = true;
      render();
      // C2-2：通知下游（intersection-marker）曲线已画完，可叠交点
      root.dispatchEvent(new CustomEvent('sc:funcplot:ready', {
        detail: { coordsId: coordsId },
        bubbles: true,
      }));
    }
    // 订阅 ready（coords 画完通知）
    document.addEventListener('sc:coords2d:ready', function(ev) {
      if (!ev.target || ev.target.id !== coordsId) return;
      firstRender();
    });
    // 兜底：若组件初始化时 coords 已经 ready 过（事件早于订阅），直接尝试一次
    var coordsEl = getCoords();
    if (coordsEl && coordsEl.__scApi) {
      firstRender();
    }

    // ============== API ==============

    var api = {
      getFunctions: function() { return JSON.parse(JSON.stringify(cfg.functions)); },
      getParam: function(fnId, name) {
        var fn = cfg.functions.find(function(f) { return f.id === fnId; });
        return fn && fn.params ? fn.params[name] : undefined;
      },
      setParam: function(fnId, name, value) {
        var fn = cfg.functions.find(function(f) { return f.id === fnId; });
        if (!fn || !fn.params) return false;
        // 支持「点语法」访问数组/嵌套字段：coeffs.0, coeffs.1, inner.x
        if (name.indexOf('.') >= 0) {
          var parts = name.split('.');
          var cur = fn.params;
          for (var pi = 0; pi < parts.length - 1; pi++) {
            if (cur == null) return false;
            cur = cur[parts[pi]];
          }
          if (cur == null) return false;
          cur[parts[parts.length - 1]] = value;
        } else {
          fn.params[name] = value;
        }
        redraw();
        emitChange(fnId, name, value);
        return true;
      },
      setFunctionParams: function(fnId, params) {
        var fn = cfg.functions.find(function(f) { return f.id === fnId; });
        if (!fn) return false;
        Object.keys(params).forEach(function(k) { fn.params[k] = params[k]; });
        redraw();
        emitChange(fnId, null, params);
        return true;
      },
      getValueAt: function(fnId, x) {
        var fn = cfg.functions.find(function(f) { return f.id === fnId; });
        if (!fn) return NaN;
        switch (fn.type) {
          case 'polynomial': return cwGeom_polyEval(fn.params.coeffs || [], x);
          case 'sine': return (fn.params.amp != null ? fn.params.amp : 1) * Math.sin((fn.params.freq || 1) * x + (fn.params.phase || 0)) + (fn.params.offset || 0);
          case 'cosine': return (fn.params.amp != null ? fn.params.amp : 1) * Math.cos((fn.params.freq || 1) * x + (fn.params.phase || 0)) + (fn.params.offset || 0);
          default: return NaN;
        }
      },
      getKeyPoints: function(fnId) {
        var fn = cfg.functions.find(function(f) { return f.id === fnId; });
        return fn ? computeKeyPoints(fn) : [];
      },
      redraw: redraw,
    };

    function emitChange(fnId, paramName, value) {
      root.dispatchEvent(new CustomEvent('sc:functionplot:change', {
        detail: { fnId: fnId, paramName: paramName, value: value },
        bubbles: true,
      }));
    }

    root.__scApi = api;
  }

  function initAll() {
    document.querySelectorAll('.function-plot').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[function-plot] init failed:', e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
`;

module.exports = { render, clientJs };
