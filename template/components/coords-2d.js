/**
 * @component coords-2d
 * @version 0.1.1
 * @status 最小可用版（地基）
 *
 * v0.1.1 变更：
 *   - 接入生命周期基础设施（createLifecycle）：resize 监听 + RAF 登记到句柄，destroy 可回滚
 *
 * v0.1.0 变更：
 *   - 第一版：Canvas 2D 网格 + 坐标轴 + 可选刻度数字
 *   - 数据范围 xRange/yRange 控制可视域
 *   - 自动选刻度间距（10/20/50/100/200/...）保证每格 >= 50px
 *   - 等比例缩放（aspect = w/h * (xRange / yRange)），非等比时多出一边空白
 *   - 可选 originAtCenter（默认 true）：原点画在中心；false 时画在左下角
 *
 * 平面直角坐标系 / 网格组件
 *
 * 字段：
 *   - id               {string}  可选 · 实例 id（其他组件用这个找 api）
 *   - title            {string}  可选 · 卡片标题
 *   - xRange           {array}   可选 · [xmin, xmax]，默认 [-5, 5]
 *   - yRange           {array}   可选 · [ymin, ymax]，默认 [-5, 5]
 *   - showGrid         {bool}    可选 · 是否显示网格（默认 true）
 *   - showAxes         {bool}    可选 · 是否显示坐标轴（默认 true）
 *   - showTicks        {bool}    可选 · 是否显示刻度数字（默认 true）
 *   - showLabels       {bool}    可选 · 是否显示轴名 x/y（默认 true）
 *   - originAtCenter   {bool}    可选 · 原点是否在画布中心（默认 true）
 *                                 false 时原点在左下角（适合函数图像）
 *   - gridColor        {string}  可选 · 网格线颜色（默认 #e6e1f0 主题色）
 *   - axisColor        {string}  可选 · 坐标轴颜色（默认 #2a2538 主题文字色）
 *   - background       {string}  可选 · 画布背景（默认 #ffffff）
 *   - aspect           {string}  可选 · "equal"（等比）/ "fit"（铺满，默认）
 *                                 equal 时短边留白，长边按短边等比缩
 *   - caption          {string}  可选 · 卡片下方说明
 *
 * 客户端 API（per-instance 闭包，挂在 container.__scApi）：
 *   - getXRange() / setXRange([min, max])     · 重画
 *   - getYRange() / setYRange([min, max])
 *   - dataToScreen([x, y]) → [px, py]         · 坐标系 ↔ 像素
 *   - screenToData([px, py]) → [x, y]
 *   - getScale() → { pxPerUnitX, pxPerUnitY, originX, originY }
 *
 * 架构契约（与 geometry-3d / slider 一致）：
 *   - data-* 属性存 JSON（data-config / data-canvas / data-meta）
 *   - 客户端 initAll() 在 DOMContentLoaded 跑
 *   - 联动靠事件（sc:coords2d:change，detail = {xRange, yRange, scale}）
 *   - 不依赖任何外部 JS 库（纯 Canvas 2D API）
 *
 * 已知问题（v0.1.0）：
 *   - 不支持鼠标交互（拖动平移 / 滚轮缩放）—— v0.2 再加
 *   - 不支持自动等比 / 对数轴 —— v0.2 再加
 *   - 多个 coords-2d 共存时每个独立画布（无共享坐标系）—— 后续如需要 cross-instance
 *     联动，需在 api 上加 globalOriginLock 机制
 */

const { escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('coords2d-' + Math.random().toString(36).slice(2, 10));
  const title = data.title || '';
  const caption = data.caption || '';
  const xRange = Array.isArray(data.xRange) && data.xRange.length === 2 ? data.xRange : [-5, 5];
  const yRange = Array.isArray(data.yRange) && data.yRange.length === 2 ? data.yRange : [-5, 5];
  const showGrid = data.showGrid !== false;
  const showAxes = data.showAxes !== false;
  const showTicks = data.showTicks !== false;
  const showLabels = data.showLabels !== false;
  const originAtCenter = data.originAtCenter !== false; // 默认 true
  const gridColor = data.gridColor || '#e6e1f0';
  const axisColor = data.axisColor || '#2a2538';
  const background = data.background || '#ffffff';
  const aspect = data.aspect || 'fit'; // 'equal' | 'fit'

  const config = {
    xRange, yRange, showGrid, showAxes, showTicks, showLabels,
    originAtCenter, gridColor, axisColor, background, aspect,
  };
  const meta = { id };

  const titleHtml = title
    ? `<div class="coords-2d-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="coords-2d-caption">${escapeHtml(caption)}</div>`
    : '';

  return `<div class="coords-2d" id="${escapeHtml(id)}"
     data-config='${escapeHtml(JSON.stringify(config))}'
     data-meta='${escapeHtml(JSON.stringify(meta))}'>
  ${titleHtml}
  <div class="coords-2d-stage">
    <canvas class="coords-2d-canvas"></canvas>
  </div>
  ${captionHtml}
</div>`;
}

const clientJs = `
(function() {
  /**
   * coords-2d 组件
   * 数据 ↔ 像素 转换：sx = (x - xMin) * pxPerUnitX + padLeft
   *                sy = canvasH - (y - yMin) * pxPerUnitY - padBottom  (canvas Y 朝下)
   * 等比模式：x 和 y 单位像素相同，画布中心对齐
   */

  function initOne(root) {
    var lc = createLifecycle(root);   // 生命周期句柄（架构债 C2-4/5）
    var cfg;
    var meta;
    try {
      cfg = JSON.parse(root.getAttribute('data-config') || '{}');
      meta = JSON.parse(root.getAttribute('data-meta') || '{}');
    } catch (e) {
      console.error('[coords-2d] data-config 解析失败:', e);
      return;
    }

    var canvas = root.querySelector('.coords-2d-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[coords-2d] Canvas 2D 上下文不可用');
      return;
    }

    var stage = root.querySelector('.coords-2d-stage');
    var dpr = window.devicePixelRatio || 1;

    // 当前状态（可被 API 改）
    var state = {
      xRange: cfg.xRange.slice(),
      yRange: cfg.yRange.slice(),
    };
    var scale = null; // { pxPerUnitX, pxPerUnitY, originX, originY, drawW, drawH }

    // ---- 工具：根据可视域挑一个"漂亮"的刻度间距（1, 2, 5, 10, 20, 50, 100...） ----
    function niceStep(range, pixelRange) {
      // 目标：刻度数 ≈ pixelRange / 60px 一格
      var targetCount = Math.max(2, Math.floor(pixelRange / 60));
      var rawStep = (range[1] - range[0]) / targetCount;
      var mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep) || 1)));
      var norm = rawStep / mag;
      var nice;
      if (norm < 1.5) nice = 1;
      else if (norm < 3) nice = 2;
      else if (norm < 7) nice = 5;
      else nice = 10;
      return nice * mag;
    }

    // ---- 计算布局：xRange/yRange → 像素映射 + 等比/居中 ----
    function recomputeScale() {
      var stageRect = stage.getBoundingClientRect();
      var cssW = Math.max(120, Math.floor(stageRect.width  || 480));
      var cssH = Math.max(120, Math.floor(stageRect.height || 320));

      // 设备像素放大（高 DPI 清晰）
      canvas.width  = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width  = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var xSpan = state.xRange[1] - state.xRange[0];
      var ySpan = state.yRange[1] - state.yRange[0];
      if (xSpan <= 0 || ySpan <= 0) {
        console.warn('[coords-2d] range 必须 min < max');
        return;
      }

      var dataAspect = xSpan / ySpan;
      var canvasAspect = cssW / cssH;

      var drawW, drawH, offsetX, offsetY;
      if (cfg.aspect === 'equal') {
        // 等比：x 和 y 单位像素相同，按 dataAspect 居中
        if (dataAspect > canvasAspect) {
          // 宽于画布：宽占满，高按比例
          drawW = cssW;
          drawH = cssW / dataAspect;
          offsetX = 0;
          offsetY = (cssH - drawH) / 2;
        } else {
          drawH = cssH;
          drawW = cssH * dataAspect;
          offsetY = 0;
          offsetX = (cssW - drawW) / 2;
        }
      } else {
        // fit：填满画布，x/y 单位像素不同
        drawW = cssW;
        drawH = cssH;
        offsetX = 0;
        offsetY = 0;
      }

      var pxPerUnitX = drawW / xSpan;
      var pxPerUnitY = drawH / ySpan;

      // 原点位置
      var originX, originY;
      if (cfg.originAtCenter) {
        // 原点 = (0, 0) 在画布（drawW × drawH）内 → 反算到 css 坐标
        var zeroX = (0 - state.xRange[0]) * pxPerUnitX;
        var zeroY = (state.yRange[1] - 0) * pxPerUnitY; // canvas Y 朝下，y 越大越靠上 → 减
        originX = offsetX + zeroX;
        originY = offsetY + zeroY;
      } else {
        // 原点 = 左下角
        originX = offsetX;
        originY = offsetY + drawH;
      }

      scale = {
        pxPerUnitX: pxPerUnitX,
        pxPerUnitY: pxPerUnitY,
        originX: originX,
        originY: originY,
        drawW: drawW,
        drawH: drawH,
        offsetX: offsetX,
        offsetY: offsetY,
        cssW: cssW,
        cssH: cssH,
      };
    }

    // ---- 数据 ↔ 像素 ----
    function dataToScreen(pt) {
      if (!scale) return [0, 0];
      var px = scale.originX + pt[0] * scale.pxPerUnitX;
      var py = scale.originY - pt[1] * scale.pxPerUnitY;
      return [px, py];
    }
    function screenToData(pxy) {
      if (!scale) return [0, 0];
      var x = (pxy[0] - scale.originX) / scale.pxPerUnitX;
      var y = (scale.originY - pxy[1]) / scale.pxPerUnitY;
      return [x, y];
    }

    // ---- 画网格 ----
    function drawGrid() {
      var xStep = niceStep(state.xRange, scale.drawW);
      var yStep = niceStep(state.yRange, scale.drawH);
      ctx.lineWidth = 1;
      ctx.strokeStyle = cfg.gridColor;
      ctx.beginPath();

      // 竖线：x = n*xStep
      var xStart = Math.ceil(state.xRange[0] / xStep) * xStep;
      for (var x = xStart; x <= state.xRange[1]; x += xStep) {
        var px = dataToScreen([x, 0])[0];
        // 只画在 drawW 内
        if (px < scale.offsetX - 0.5 || px > scale.offsetX + scale.drawW + 0.5) continue;
        ctx.moveTo(px, scale.offsetY);
        ctx.lineTo(px, scale.offsetY + scale.drawH);
      }
      // 横线：y = n*yStep
      var yStart = Math.ceil(state.yRange[0] / yStep) * yStep;
      for (var y = yStart; y <= state.yRange[1]; y += yStep) {
        var py = dataToScreen([0, y])[1];
        if (py < scale.offsetY - 0.5 || py > scale.offsetY + scale.drawH + 0.5) continue;
        ctx.moveTo(scale.offsetX, py);
        ctx.lineTo(scale.offsetX + scale.drawW, py);
      }
      ctx.stroke();
    }

    // ---- 画坐标轴（加粗 + 箭头） ----
    function drawAxes() {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = cfg.axisColor;

      // X 轴：穿过 originY 的水平线（只在 drawW 范围内）
      var xStart = dataToScreen([state.xRange[0], 0])[0];
      var xEnd   = dataToScreen([state.xRange[1], 0])[0];
      var xL = Math.max(scale.offsetX, xStart);
      var xR = Math.min(scale.offsetX + scale.drawW, xEnd);
      ctx.beginPath();
      ctx.moveTo(xL, scale.originY);
      ctx.lineTo(xR, scale.originY);
      ctx.stroke();

      // Y 轴：穿过 originX 的垂直线
      var yTop = dataToScreen([0, state.yRange[1]])[1];
      var yBot = dataToScreen([0, state.yRange[0]])[1];
      var yT = Math.min(scale.offsetY, yTop);
      var yB = Math.max(scale.offsetY + scale.drawH, yBot);
      ctx.beginPath();
      ctx.moveTo(scale.originX, yT);
      ctx.lineTo(scale.originX, yB);
      ctx.stroke();

      // 箭头：X 轴正方向
      var arr = 6; // 箭头长度
      ctx.beginPath();
      ctx.moveTo(xR, scale.originY);
      ctx.lineTo(xR - arr, scale.originY - arr / 2);
      ctx.lineTo(xR - arr, scale.originY + arr / 2);
      ctx.closePath();
      ctx.fillStyle = cfg.axisColor;
      ctx.fill();

      // 箭头：Y 轴正方向
      ctx.beginPath();
      ctx.moveTo(scale.originX, yT);
      ctx.lineTo(scale.originX - arr / 2, yT + arr);
      ctx.lineTo(scale.originX + arr / 2, yT + arr);
      ctx.closePath();
      ctx.fill();

      // 轴标签 x / y
      if (cfg.showLabels) {
        ctx.fillStyle = cfg.axisColor;
        ctx.font = 'italic 14px "KaTeX_Math", Georgia, serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('x', xR + 4, scale.originY + 14);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('y', scale.originX - 10, yT - 2);
      }
    }

    // ---- 画刻度数字 ----
    function drawTicks() {
      if (!scale) return;
      var xStep = niceStep(state.xRange, scale.drawW);
      var yStep = niceStep(state.yRange, scale.drawH);
      ctx.fillStyle = '#6b6580';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // X 轴刻度（数字标在 X 轴下方）
      var xStart = Math.ceil(state.xRange[0] / xStep) * xStep;
      for (var x = xStart; x <= state.xRange[1]; x += xStep) {
        if (Math.abs(x) < xStep * 0.0001) continue; // 跳过原点 0
        var px = dataToScreen([x, 0])[0];
        if (px < scale.offsetX - 0.5 || px > scale.offsetX + scale.drawW + 0.5) continue;
        ctx.fillText(formatTick(x), px, scale.originY + 4);
      }

      // Y 轴刻度（数字标在 Y 轴左侧）
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      var yStart = Math.ceil(state.yRange[0] / yStep) * yStep;
      for (var y = yStart; y <= state.yRange[1]; y += yStep) {
        if (Math.abs(y) < yStep * 0.0001) continue;
        var py = dataToScreen([0, y])[1];
        if (py < scale.offsetY - 0.5 || py > scale.offsetY + scale.drawH + 0.5) continue;
        ctx.fillText(formatTick(y), scale.originX - 4, py);
      }

      // 原点 0
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('0', scale.originX - 4, scale.originY + 4);
    }

    function formatTick(n) {
      // 整数不写小数点；非整数保留 1-2 位
      if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
      var abs = Math.abs(n);
      var digits = abs >= 1 ? 1 : 2;
      return parseFloat(n.toFixed(digits)).toString();
    }

    // ---- 主渲染 ----
    function render() {
      if (!scale) recomputeScale();
      // 清空（按 css 尺寸，因为 ctx 已经被 setTransform 缩放）
      ctx.clearRect(0, 0, scale.cssW, scale.cssH);
      // 背景
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, scale.cssW, scale.cssH);

      if (cfg.showGrid) drawGrid();
      if (cfg.showAxes) drawAxes();
      if (cfg.showTicks) drawTicks();
    }

    function redraw() {
      recomputeScale();
      render();
    }

    // ---- API ----
    var api = {
      getXRange: function() { return state.xRange.slice(); },
      setXRange: function(r) {
        if (!Array.isArray(r) || r.length !== 2 || r[0] >= r[1]) return false;
        state.xRange = r.slice();
        redraw();
        emitChange();
        return true;
      },
      getYRange: function() { return state.yRange.slice(); },
      setYRange: function(r) {
        if (!Array.isArray(r) || r.length !== 2 || r[0] >= r[1]) return false;
        state.yRange = r.slice();
        redraw();
        emitChange();
        return true;
      },
      dataToScreen: dataToScreen,
      screenToData: screenToData,
      getScale: function() {
        if (!scale) return null;
        return {
          pxPerUnitX: scale.pxPerUnitX,
          pxPerUnitY: scale.pxPerUnitY,
          originX: scale.originX,
          originY: scale.originY,
        };
      },
      redraw: redraw,
    };

    function emitChange() {
      // v0.1.0：基础范围变化事件，供 function-plot 订阅
      root.dispatchEvent(new CustomEvent('sc:coords2d:change', {
        detail: { xRange: state.xRange.slice(), yRange: state.yRange.slice() },
        bubbles: true,
      }));
    }

    // C2-2 修复：首次绘制完成后发 ready 事件（只发一次）。
    // 下游（function-plot / intersection-marker）订阅此事件做首次渲染，
    // 替代旧的 setTimeout(50/200/500) 猜测式时序。
    var firstRenderDone = false;
    function emitReadyOnce() {
      if (firstRenderDone) return;
      firstRenderDone = true;
      root.dispatchEvent(new CustomEvent('sc:coords2d:ready', {
        detail: { xRange: state.xRange.slice(), yRange: state.yRange.slice() },
        bubbles: true,
      }));
    }

    // 暴露到 DOM 元素
    root.__scApi = api;

    // 高 DPI 屏 / 窗口缩放重画
    var resizeRaf = 0;
    function onResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function() {
        resizeRaf = 0;
        redraw();
      });
      lc.raf(resizeRaf);   // 登记以便 destroy 取消
    }
    lc.win('resize', onResize);

    // 初始画 —— 画完后发 ready 事件（C2-2）
    redraw();
    emitReadyOnce();
  }

  function initAll() {
    document.querySelectorAll('.coords-2d').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[coords-2d] init failed:', e); }
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
