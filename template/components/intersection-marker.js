/**
 * @component intersection-marker
 * @version 0.1.1
 * @status 最小可用版
 *
 * v0.1.1 变更：
 *   - 接入生命周期基础设施：5 个总线监听（coords2d change/ready、funcplot change×2/ready）+ resize
 *     + redraw RAF/timeout 全登记到句柄，destroy 可回滚（原全仓零 removeEventListener 的最严重 2D 泄漏点）
 *
 * v0.1.0 变更：
 *   - 第一版：在坐标系上画一组「交点」高亮
 *   - 输入：x/y 列表（绝对坐标）+ coords id（坐标系实例）
 *   - 自动监听 coords 缩放/平移重新画位置
 *   - polynomialIntersection 模式：自动求两 polynomial 交点（f1 - f2 = 0 求实根）
 *     监听 function-plot 的 sc:functionplot:change，实时更新交点
 *   - polynomialDiscriminant 模式：实时显示 Δ = b²-4ac（韦达形式）+ Vieta 公式
 *     Δ > 0 → 两个交点（绿色）/ Δ = 0 → 一个交点（黄色）/ Δ < 0 → 无解（灰色）
 *
 * 交点高亮组件 —— 配合 function-plot 使用
 *
 * 字段：
 *   - id               {string}  必填 · 实例 id
 *   - coords           {string}  必填 · 关联的 coords-2d 实例 id
 *   - points           {array}   可选 · 静态交点列表 [{x, y, label?, color?}, ...]
 *   - polynomialIntersection  {object}  可选 · 实时求交模式
 *       { "functionPlotId": "fp-1", "fnId1": "p1", "fnId2": "p2", "pointColor?": "..." }
 *   - polynomialDiscriminant  {object}  可选 · 实时判别式显示
 *       { "functionPlotId": "fp-1",
 *         "fnId": "p1",                 // 主 polynomial（必填）
 *         "subtractFnId?": "line",     // 可选：求 fnId - subtractFnId 的 Δ（两 polynomial 求交场景）
 *                                     // 不指定则求 fnId 与 x 轴的交点 Δ（标准 ax²+bx+c=0 形式）
 *         "showVieta?": true }          // 额外显示韦达 x₁+x₂=-b/a, x₁·x₂=c/a
 *   - showLabels       {bool}    可选 · 是否显示标签（默认 true）
 *   - pointColor       {string}  可选 · 点颜色（默认 #d65a5a 红）
 *   - labelColor       {string}  可选 · 标签颜色
 *   - caption          {string}  可选
 *
 * 客户端 API（per-instance 闭包）：
 *   - setPoints(points)          · 改静态交点列表并重画
 *   - addPoint({x, y, label?})   · 加一个静态交点
 *   - clear()                    · 清空静态交点
 *   - getPoints()                · 拿当前显示的交点（静态 + polynomial 自动算的）
 *   - refreshPolynomialIntersections()  · 强制重算 polynomial 交点
 *   - getDiscriminant()          · 拿当前 Δ 值（如果有 polynomialDiscriminant 配置）
 *
 * 已知问题（v0.1.0）：
 *   - polynomialIntersection 只支持两 polynomial 求交（相减 → 多项式 → 扫描+二分求实根）
 *   - v0.2 计划：支持 polynomial vs sin/cos 通用求交
 */

const { escapeHtml } = require('./_inline.js');
const { clientJs: geomUtilsJs } = require('./_geom_utils.js');

function render(data) {
  const id = data.id || ('intersection-' + Math.random().toString(36).slice(2, 10));
  const title = data.title || '';
  const caption = data.caption || '';
  const coords = data.coords || '';
  const points = Array.isArray(data.points) ? data.points : [];
  const showLabels = data.showLabels !== false;
  const pointColor = data.pointColor || '#d65a5a';
  const labelColor = data.labelColor || '#2a2538';
  const polynomialIntersection = data.polynomialIntersection || null;
  const polynomialDiscriminant = data.polynomialDiscriminant || null;

  const config = {
    coords, points, showLabels, pointColor, labelColor,
    polynomialIntersection, polynomialDiscriminant,
  };
  const meta = { id };

  const titleHtml = title
    ? `<div class="intersection-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="intersection-caption">${escapeHtml(caption)}</div>`
    : '';

  return `<div class="intersection" id="${escapeHtml(id)}"
     data-config='${escapeHtml(JSON.stringify(config))}'
     data-meta='${escapeHtml(JSON.stringify(meta))}'>
  ${titleHtml}
  <div class="intersection-host"></div>
  <div class="intersection-delta" data-delta-host></div>
  ${captionHtml}
</div>`;
}

const clientJs = `
${geomUtilsJs}
(function() {
  function initOne(root) {
    var lc = createLifecycle(root);   // 生命周期句柄（架构债 C2-4/5）
    var cfg, meta;
    try {
      cfg = JSON.parse(root.getAttribute('data-config') || '{}');
      meta = JSON.parse(root.getAttribute('data-meta') || '{}');
    } catch (e) { console.error('[intersection] 配置解析失败:', e); return; }

    var coordsId = cfg.coords;
    if (!coordsId) {
      console.error('[intersection] 缺少 coords 字段');
      return;
    }
    function getCoords() { return document.getElementById(coordsId); }
    function getCoordsApi() { var c = getCoords(); return c && c.__scApi; }

    // C2-3：两 polynomial 右对齐相减（refreshPolynomialIntersections / refreshDiscriminant /
    //   getDiscriminant 三处共用，之前各写一遍）。
    //   fnId 必填（主 polynomial）；subtractFnId 可选（被减 polynomial，不传 = fnId 对 x 轴求 Δ）。
    //   返回降序 diff 系数；任一不是 polynomial 返回 null。
    function computeDiffCoeffs(fpApi, fnId, subtractFnId) {
      var fn1 = fpApi.getFunctions().find(function(f){return f.id === fnId;});
      if (!fn1 || fn1.type !== 'polynomial') return null;
      var c1 = fn1.params.coeffs || [];
      if (!subtractFnId) return c1.slice();
      var fn2 = fpApi.getFunctions().find(function(f){return f.id === subtractFnId;});
      if (!fn2 || fn2.type !== 'polynomial') return null;
      var c2 = fn2.params.coeffs || [];
      // 右对齐：c1[length-1] 与 c2[length-1] 都是常数项，对齐到末尾，前面补 0
      // 反例：[1,0,0] - [2,3]（x² 减 2x+3）左对齐得 [-1,-3,0] ❌；右对齐得 [1,-2,-3] ✓
      var n = Math.max(c1.length, c2.length);
      var diff = [];
      for (var i = 0; i < n; i++) {
        var idx1 = c1.length - n + i;
        var idx2 = c2.length - n + i;
        var a = idx1 >= 0 ? c1[idx1] : 0;
        var b = idx2 >= 0 ? c2[idx2] : 0;
        diff.push(a - b);
      }
      return diff;
    }

    // canvas 跟 function-plot 一样：注入到 coords-2d stage
    function ensureCanvasInjected() {
      var coords = getCoords();
      if (!coords) return false;
      var stage = coords.querySelector('.coords-2d-stage');
      if (!stage) return false;
      if (stage.querySelector('.intersection-canvas[data-int-id="' + meta.id + '"]')) return true;
      if (!coords.__scApi) return false;
      var c = document.createElement('canvas');
      c.className = 'intersection-canvas';
      c.setAttribute('data-int-id', meta.id);
      stage.appendChild(c);
      canvas = c;
      ctx = canvas.getContext('2d');
      return true;
    }
    var canvas = null;
    var ctx = null;

    function onCoordsChange(ev) {
      if (!ev.target || ev.target.id !== coordsId) return;
      redraw();
    }
    lc.doc('sc:coords2d:change', onCoordsChange);
    function onWinResize() {
      var id = requestAnimationFrame(redraw);
      lc.raf(id);
    }
    lc.win('resize', onWinResize);

    // polynomialIntersection 模式：监听 function-plot 变化 + 自动算交点
    function refreshPolynomialIntersections() {
      if (!cfg.polynomialIntersection) return;
      var cfgP = cfg.polynomialIntersection;
      var fpEl = document.getElementById(cfgP.functionPlotId);
      if (!fpEl || !fpEl.__scApi) return;
      var fpApi = fpEl.__scApi;
      // C2-3：右对齐相减抽到 computeDiffCoeffs（refreshDiscriminant / getDiscriminant 共用）
      var diff = computeDiffCoeffs(fpApi, cfgP.fnId1, cfgP.fnId2);
      if (!diff) return;
      var roots = cwGeom_polyRealRoots(diff);
      // 转成交点列表（带 y 坐标从任一函数算）
      var newPoints = roots.map(function(x) {
        var y = fpApi.getValueAt(cfgP.fnId1, x);
        return {
          x: x, y: y,
          color: cfgP.pointColor || cfg.pointColor,
          label: '(' + roundNum(x, 3) + ', ' + roundNum(y, 2) + ')',
        };
      });
      cfg.points = newPoints;
      redraw();
    }

    function roundNum(n, digits) {
      if (!isFinite(n)) return '∞';
      var m = Math.pow(10, digits);
      return parseFloat((Math.round(n * m) / m).toFixed(digits)).toString();
    }

    // polyRealRoots 来自 _geom_utils（cwGeom_ 前缀，顶部嵌入；含 Δ=0 相切重根精确解 C1-1）

    // 监听 function-plot 变化
    if (cfg.polynomialIntersection) {
      function onFuncPlotChangeInter(ev) {
        if (!ev.target || ev.target.id !== cfg.polynomialIntersection.functionPlotId) return;
        refreshPolynomialIntersections();
      }
      lc.doc('sc:functionplot:change', onFuncPlotChangeInter);
    }
    if (cfg.polynomialDiscriminant) {
      function onFuncPlotChangeDisc(ev) {
        if (!ev.target || ev.target.id !== cfg.polynomialDiscriminant.functionPlotId) return;
        refreshDiscriminant();
      }
      lc.doc('sc:functionplot:change', onFuncPlotChangeDisc);
    }

    // 判别式 Δ 计算 + 实时显示
    // polynomialDiscriminant 模式：ax²+bx+c=0 形式，coeffs 降序 = [a, b, c]（3 元素）
    //  若 fn1 是 1 次（length=2：[a1, a0]）求与 x 轴交点 → a1x + a0 = 0 一次方程，
    //  Δ 概念不存在（一次方程恒有 1 解），传 null
    function refreshDiscriminant() {
      if (!cfg.polynomialDiscriminant) return;
      var cfgD = cfg.polynomialDiscriminant;
      var fpEl = document.getElementById(cfgD.functionPlotId);
      if (!fpEl || !fpEl.__scApi) return;
      var fpApi = fpEl.__scApi;
      // C2-3：右对齐相减抽到 computeDiffCoeffs（subtractFnId 可选：不传 = fnId 对 x 轴）
      var diff = computeDiffCoeffs(fpApi, cfgD.fnId, cfgD.subtractFnId);
      if (!diff) return;
      // 期望 length=3（a, b, c），否则不显示
      var a = diff[0], b = diff[1], cc = diff[2];
      var delta = null, vieta = null;
      if (diff.length === 3 && isFinite(a) && isFinite(b) && isFinite(cc)) {
        delta = b * b - 4 * a * cc;
        if (a !== 0 && cfgD.showVieta !== false) {
          // 韦达：x₁ + x₂ = -b/a, x₁ · x₂ = c/a
          vieta = {
            sumStr: 'x₁ + x₂ = ' + roundNum(-b / a, 4),
            prodStr: 'x₁ · x₂ = ' + roundNum(cc / a, 4),
          };
        }
      }
      renderDelta(delta, vieta);
    }

    function renderDelta(delta, vieta) {
      var host = root.querySelector('.intersection-delta');
      if (!host) return;
      if (delta == null) {
        host.innerHTML = '';
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var color, statusText;
      if (delta > 0) {
        color = '#4caf85';
        statusText = '两个交点';
      } else if (Math.abs(delta) < 1e-9) {
        color = '#d99a3a';
        statusText = '一个交点（相切）';
      } else {
        color = '#6b6580';
        statusText = '无交点';
      }
      var html = '<div class="delta-line" style="color:' + color + ';">'
        + '<span class="delta-label">Δ = b² − 4ac =</span> '
        + '<span class="delta-value">' + roundNum(delta, 3) + '</span> '
        + '<span class="delta-status" style="background:' + color + '22; border:1px solid ' + color + ';">' + statusText + '</span>'
        + '</div>';
      if (vieta) {
        html += '<div class="vieta-line">'
          + '<span class="vieta-label">韦达定理：</span> '
          + '<span class="vieta-sum">' + vieta.sumStr + '</span> · '
          + '<span class="vieta-prod">' + vieta.prodStr + '</span>'
          + '</div>';
      }
      host.innerHTML = html;
    }

    function render() {
      var coords = getCoords();
      if (!coords || !getCoordsApi()) return;
      if (!ensureCanvasInjected()) return;
      var coordsCanvas = coords.querySelector('.coords-2d-canvas');
      if (!coordsCanvas) return;
      var dpr = window.devicePixelRatio || 1;
      var r = coordsCanvas.getBoundingClientRect();
      var cssW = Math.max(120, Math.floor(r.width  || 480));
      var cssH = Math.max(120, Math.floor(r.height || 320));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // 画所有交点
      var xRange = getCoordsApi().getXRange();
      var yRange = getCoordsApi().getYRange();
      cfg.points.forEach(function(p) {
        if (p.x < xRange[0] || p.x > xRange[1]) return;
        if (p.y < yRange[0] || p.y > yRange[1]) return;
        var sp = getCoordsApi().dataToScreen([p.x, p.y]);
        var color = p.color || cfg.pointColor;
        // 点（带白边）
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sp[0], sp[1], 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 标签
        if (cfg.showLabels && p.label) {
          ctx.fillStyle = cfg.labelColor;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          // 文字描边
          ctx.strokeText(p.label, sp[0] + 10, sp[1] - 8);
          ctx.fillText(p.label, sp[0] + 10, sp[1] - 8);
        }
      });
    }
    function redraw() {
      if (!ensureCanvasInjected()) { var tid = setTimeout(redraw, 50); lc.timeout(tid); return; }
      var rid = requestAnimationFrame(render);
      lc.raf(rid);
    }

    // C2-2 修复：订阅 coords-2d ready 替代 setTimeout(50/200/500)
    // intersection 的 canvas 注入到 coords stage，等 coords 画完即可首次渲染。
    var firstRenderDone = false;
    function firstRender() {
      if (firstRenderDone) return;
      if (!ensureCanvasInjected()) return;
      firstRenderDone = true;
      render();
    }
    function onCoordsReady(ev) {
      if (!ev.target || ev.target.id !== coordsId) return;
      firstRender();
    }
    lc.doc('sc:coords2d:ready', onCoordsReady);
    // 兜底：coords 已 ready 过（事件早于订阅）
    var coordsEl = getCoords();
    if (coordsEl && coordsEl.__scApi) {
      firstRender();
    }

    var api = {
      setPoints: function(pts) {
        if (!Array.isArray(pts)) return false;
        cfg.points = pts;
        redraw();
        return true;
      },
      addPoint: function(p) {
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return false;
        cfg.points.push(p);
        redraw();
        return true;
      },
      clear: function() {
        cfg.points = [];
        redraw();
      },
      getPoints: function() { return cfg.points.slice(); },
      refreshPolynomialIntersections: refreshPolynomialIntersections,
      getDiscriminant: function() {
        // 返回最近一次算的 Δ 值（如果 polynomialDiscriminant 模式没启动，返回 null）
        if (!cfg.polynomialDiscriminant) return null;
        var fpEl = document.getElementById(cfg.polynomialDiscriminant.functionPlotId);
        if (!fpEl || !fpEl.__scApi) return null;
        var fpApi = fpEl.__scApi;
        var cfgD = cfg.polynomialDiscriminant;
        // C2-3：同 refreshDiscriminant，走 computeDiffCoeffs
        var diff = computeDiffCoeffs(fpApi, cfgD.fnId, cfgD.subtractFnId);
        if (!diff) return null;
        if (diff.length !== 3) return null;
        return diff[1] * diff[1] - 4 * diff[0] * diff[2];
      },
    };
    root.__scApi = api;

    // C2-2 修复：polynomial 模式订阅 function-plot 的 ready，替代 setTimeout(100/300)
    // funcplot:ready 保证曲线已画完，此时 refreshPolynomialIntersections / refreshDiscriminant
    // 能正确读到 function-plot 的 coeffs。
    if (cfg.polynomialIntersection || cfg.polynomialDiscriminant) {
      var polyReadyDone = { inter: false, disc: false };
      function onFuncPlotReady() {
        if (cfg.polynomialIntersection && !polyReadyDone.inter) {
          polyReadyDone.inter = true;
          refreshPolynomialIntersections();
        }
        if (cfg.polynomialDiscriminant && !polyReadyDone.disc) {
          polyReadyDone.disc = true;
          refreshDiscriminant();
        }
      }
      // 订阅关联 function-plot 的 ready（detail.coordsId 标识它属于哪个 coords）
      function onFuncPlotReadyEv(ev) {
        var fpId = (cfg.polynomialIntersection || cfg.polynomialDiscriminant).functionPlotId;
        if (ev.target && ev.target.id === fpId) onFuncPlotReady();
      }
      lc.doc('sc:funcplot:ready', onFuncPlotReadyEv);
      // 兜底：function-plot 已 ready 过
      var fpId = (cfg.polynomialIntersection || cfg.polynomialDiscriminant).functionPlotId;
      var fpEl = fpId ? document.getElementById(fpId) : null;
      if (fpEl && fpEl.__scApi) onFuncPlotReady();
    }
  }

  function initAll() {
    document.querySelectorAll('.intersection').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[intersection] init failed:', e); }
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
