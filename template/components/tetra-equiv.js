/**
 * @component tetra-equiv
 * @version 0.1.2
 * @status 最小可用版
 *
 * 同体异构四面体组件 —— 同时显示「同一个四面体的 4 种不同摆法」
 *
 * 教学场景：立体几何里「等体积法」求三棱锥体积 —— 同一个四面体可以选择 4 种
 * 「底+顶点」的组合（4 种底对应 4 个不同的锥顶），但 4 个体积完全相同。
 * 学员的卡点往往是「为什么不选别的底」—— 4 个四面体同框显示能让学员一眼看见
 * 「4 个形状不同 / 顶点不同 / 但体积相等」。
 *
 * 字段：
 *   - id               {string}   必填 · 组件根 ID
 *   - title            {string}   可选 · 卡片小标题
 *   - caption          {string}   可选 · 卡片下方说明文字
 *   - linkedGeometry3d {string}   可选 · 联动的 geometry-3d 实例 ID（顶点源）
 *   - vertexLabels     {string[]} 必填 · 4 个顶点 label（顺序无关，内部去重）
 *   - showAs           {array}    必填 · 4 种摆法（每种 = 1 个底 + 1 个锥顶 + 1 种颜色 + 1 个标签）
 *   - showAs[].base    {string[]} 必填 · 该摆法的底（3 个 label）
 *   - showAs[].apex    {string}   必填 · 该摆法的锥顶（1 个 label）
 *   - showAs[].color   {string}   必填 · 该摆法的填充色（hex）
 *   - showAs[].label   {string}   必填 · 该摆法的图例文字
 *   - opacity          {number}   可选 · 填充透明度（默认 0.45）
 *   - camera           {object}   可选 · {position:[x,y,z], target:[x,y,z]}（默认自动框 4 顶点）
 *   - showVolumeCheck  {bool}     可选 · 是否在卡片标题旁显示 4 个体积数值验证相等（默认 true）
 *
 * 联动规则（v0.1）：
 *   - 客户端每帧从 window.__scGeom3D[linkedGeometry3d].getLabelPos(name) 拉取最新顶点坐标
 *   - linkedGeometry3d 实例里通过 slider 改 P 位置时，本组件 4 个四面体同步重画
 *   - 不依赖 derivedVertices —— 只要求这些 label 在源 geometry-3d 的 labels 里存在
 *
 * v0.1 实现边界：
 *   - 4 个四面体共享相机（拖动 = 4 个一起转），不单独控制每个
 *   - 不支持双击复位、Shift+平移（保留基础 OrbitControls：拖动旋转 + 滚轮缩放）
 *   - 不支持 4 个视角独立小窗（如需 4 视角并排，v0.2 再说）
 *   - 顶点必须都在 linkedGeometry3d 的 labels 里声明（否则该顶点位置 = [0,0,0]，组件静默 fallback）
 *   - showAs 必须正好 4 项（少/多都 fallback 为 4 种默认颜色搭配）
 *
 * 已知问题：
 *   - slider 联动 P 时本组件重画频率 = RAF（≈60fps），大量实例同屏可能拖累性能
 *   - 体积校验只显示数值，不显示误差（4 个体积都是浮点计算，理论相等实际有 1e-6 误差）
 */

const { escapeHtml } = require('./_inline.js');
const { clientJs: geomUtilsJs } = require('./_geom_utils.js');

/**
 * 4 种默认摆法的兜底配色（学员至少能看到 4 个不同颜色的四面体）
 */
const DEFAULT_PALETTE = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];

function render(data) {
  const id = data.id || ('tetra-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const caption = data.caption || '';
  const linkedGeometry3d = data.linkedGeometry3d || '';
  const showAs = Array.isArray(data.showAs) && data.showAs.length === 4 ? data.showAs : null;
  const vertexLabels = Array.isArray(data.vertexLabels) && data.vertexLabels.length === 4 ? data.vertexLabels : [];
  const opacity = Number.isFinite(data.opacity) ? data.opacity : 0.45;
  const showVolumeCheck = data.showVolumeCheck !== false;

  // 体积校验所需的 4 个 label（任意顺序，内部取 4 个 vertexLabels）
  const verticesJson = JSON.stringify(vertexLabels);
  const linkedId = escapeHtml(linkedGeometry3d);
  const showAsJson = showAs ? JSON.stringify(showAs) : '';
  const paletteJson = JSON.stringify(DEFAULT_PALETTE);

  const titleHtml = title
    ? `<div class="tetra-equiv-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="tetra-equiv-caption">${escapeHtml(caption)}</div>`
    : '';

  return `<div class="tetra-equiv" id="${escapeHtml(id)}"
  data-tetra-id="${escapeHtml(id)}"
  data-linked-geometry-3d="${linkedId}"
  data-vertices='${escapeHtml(verticesJson)}'
  data-show-as='${escapeHtml(showAsJson)}'
  data-palette='${escapeHtml(paletteJson)}'
  data-opacity="${opacity}"
  data-show-volume="${showVolumeCheck ? '1' : '0'}">
  ${titleHtml}
  <div class="tetra-equiv-stage"></div>
  <div class="tetra-equiv-legend">
    ${(showAs || []).map(function(s, i) {
      const color = (s && s.color) || DEFAULT_PALETTE[i] || '#888';
      const label = (s && s.label) || ('四面体 ' + (i + 1));
      return `<span class="tetra-equiv-legend-item"><i class="tetra-equiv-swatch" style="background:${escapeHtml(color)}"></i>${escapeHtml(label)}</span>`;
    }).join('')}
  </div>
  <div class="tetra-equiv-volume" data-volume-check hidden>
    <span class="tetra-equiv-volume-text">体积校验：<span data-vol-0>—</span> ≈ <span data-vol-1>—</span> ≈ <span data-vol-2>—</span> ≈ <span data-vol-3>—</span></span>
  </div>
  ${captionHtml}
</div>`;
}

const clientJs = `
${geomUtilsJs}
(function() {
  if (window.__scTetraEquivLoaded) return;
  window.__scTetraEquivLoaded = true;

  function initOne(root) {
    var THREE = window.__scThree;
    var OC = window.__scOrbitControls;
    if (!THREE) {
      console.warn('[tetra-equiv] window.__scThree 未找到，请确认 build.js 已注入 Three.js');
      return;
    }

    var linkedId = root.getAttribute('data-linked-geometry-3d') || '';
    var vertexLabels = [];
    var showAs = [];
    var palette = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
    var opacity = parseFloat(root.getAttribute('data-opacity')) || 0.45;
    var showVolume = root.getAttribute('data-show-volume') === '1';

    try { vertexLabels = JSON.parse(root.getAttribute('data-vertices') || '[]'); } catch (e) { vertexLabels = []; }
    try {
      var sa = JSON.parse(root.getAttribute('data-show-as') || '[]');
      if (Array.isArray(sa) && sa.length === 4) showAs = sa;
    } catch (e) { /* keep [] */ }
    try {
      var p = JSON.parse(root.getAttribute('data-palette') || '[]');
      if (Array.isArray(p) && p.length > 0) palette = p;
    } catch (e) { /* keep default */ }

    var api = null;  // 联动源 API（v0.1.2：提升到 initOne 顶层，dirty flag 渲染循环需要访问）
    var linkedEl = null;  // 同上
    var stage = root.querySelector('.tetra-equiv-stage');
    if (!stage) return;
    var w = stage.clientWidth || 360;
    var h = stage.clientHeight || 280;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#fdfdfd');

    var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(4, 4, 5);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    stage.appendChild(renderer.domElement);

    // 共享 OrbitControls（4 个四面体一起转，简单可靠）
    var controls = null;
    if (OC) {
      controls = new OC(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.update();
    }

    // ResizeObserver 自适应
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() {
        var nw = stage.clientWidth || 360;
        var nh = stage.clientHeight || 280;
        if (nw === w && nh === h) return;
        w = nw; h = nh;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(stage);
    }

    // 4 个四面体 group（每 group = 1 个 fill mesh + 1 个 LineSegments 描边）
    var tetraGroups = [];
    for (var i = 0; i < 4; i++) {
      var color = (showAs[i] && showAs[i].color) || palette[i % palette.length];
      var g = new THREE.Group();
      var mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      var fillMesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      g.add(fillMesh);
      var edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.7) });
      var edgeLines = new THREE.LineSegments(new THREE.BufferGeometry(), edgeMat);
      g.add(edgeLines);
      scene.add(g);
      tetraGroups.push({ group: g, fillMesh: fillMesh, edgeLines: edgeLines });
    }

    // buildTetraPositions / buildEdgePositions 来自 _geom_utils 的共享定义（cwGeom_ 前缀）

    /**
     * 拉取最新顶点位置 + 重画 4 个四面体 + 计算体积
     * v0.1.1：优先走 DOM 元素的 __scApi（per-instance 闭包，A2 改造），
     * 兜底用 window.__scGeom3D[id]（兼容老代码）
     */
    function pullAndRender() {
      linkedEl = document.getElementById(linkedId);
      if (linkedEl && linkedEl.__scApi && typeof linkedEl.__scApi.getLabelPos === 'function') {
        api = linkedEl.__scApi;
      } else if (window.__scGeom3D && window.__scGeom3D[linkedId]) {
        api = window.__scGeom3D[linkedId];
      }
      if (!api || typeof api.getLabelPos !== 'function') {
        // 没联动源：所有顶点用 [0,0,0]，4 个四面体重叠在一起 —— 静默 fallback
        return;
      }
      // 拉 4 个顶点（按 vertexLabels 顺序）
      var verts = vertexLabels.map(function(lbl) { return api.getLabelPos(lbl) || [0, 0, 0]; });

      // 4 种摆法每种重排顶点顺序：[base[0], base[1], base[2], apex]
      var volumes = [];
      for (var i = 0; i < 4; i++) {
        var spec = showAs[i] || { base: vertexLabels.slice(0, 3), apex: vertexLabels[3] };
        var baseLabels = Array.isArray(spec.base) && spec.base.length === 3 ? spec.base : vertexLabels.slice(0, 3);
        var apexLabel = spec.apex || vertexLabels[3];
        var orderedVerts = [
          api.getLabelPos(baseLabels[0]) || [0, 0, 0],
          api.getLabelPos(baseLabels[1]) || [0, 0, 0],
          api.getLabelPos(baseLabels[2]) || [0, 0, 0],
          api.getLabelPos(apexLabel) || [0, 0, 0],
        ];
        var fillPos = cwGeom_buildTetraPositions(orderedVerts);
        var edgePos = cwGeom_buildEdgePositions(orderedVerts);
        var entry = tetraGroups[i];
        if (fillPos) {
          entry.fillMesh.geometry.dispose();
          entry.fillMesh.geometry = new THREE.BufferGeometry();
          entry.fillMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(fillPos, 3));
          entry.fillMesh.geometry.computeVertexNormals();
        }
        if (edgePos) {
          entry.edgeLines.geometry.dispose();
          entry.edgeLines.geometry = new THREE.BufferGeometry();
          entry.edgeLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
        }
        volumes.push(cwGeom_tetraVolume(orderedVerts[0], orderedVerts[1], orderedVerts[2], orderedVerts[3]));
      }

      // 体积校验显示
      if (showVolume) {
        var volBox = root.querySelector('.tetra-equiv-volume');
        if (volBox && volBox.hidden) volBox.hidden = false;
        for (var k = 0; k < 4; k++) {
          var el = root.querySelector('[data-vol-' + k + ']');
          if (el) el.textContent = cwGeom_fmtVol(volumes[k]);
        }
      }

      // 自适应相机框：取 4 个顶点的包围盒中心和半径
      // 注：只在首次有效数据到达时执行一次，避免抖动
      if (!root.dataset.cameraFramed) {
        var minX = Infinity, minY = Infinity, minZ = Infinity;
        var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (var vi = 0; vi < verts.length; vi++) {
          var p = verts[vi];
          if (!p) continue;
          if (p[0] < minX) minX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[2] < minZ) minZ = p[2];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] > maxY) maxY = p[1];
          if (p[2] > maxZ) maxZ = p[2];
        }
        if (Number.isFinite(minX) && Number.isFinite(maxX) && maxX > minX) {
          var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
          var dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
          var radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2 || 2;
          camera.position.set(cx + radius * 1.5, cy + radius * 1.2, cz + radius * 1.8);
          camera.lookAt(cx, cy, cz);
          if (controls) {
            controls.target.set(cx, cy, cz);
            controls.update();
          }
          root.dataset.cameraFramed = '1';
        }
      }
    }

    // 渲染循环（v0.1.2：dirty flag 优化）
    //   只有当联动源 setLabelPos / setHighlight 触发时（api.__dirty = true）才 pullAndRender 重建几何体
    //   其他帧只 render(scene) 用现有 geometry，省 GC + 重建 CPU
    //   对静态观察场景（学员不操作）CPU 占用降到接近 0
    function animate() {
      requestAnimationFrame(animate);
      if (api && api.__dirty) {
        api.__dirty = false;
        pullAndRender();
      }
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // v0.1.2：不再用 setTimeout 200/800 兜底联动源就绪
    //   改用事件驱动：addEventListener 监听 sc:geom3d:change
    //   联动源 setLabelPos 触发时立刻同步 + 下一帧重建
    //   首帧时强制 pullAndRender 一次（拿到初始坐标）
    //
    // C1 修复：原代码把 addEventListener 放在 pullAndRender() 之后？
    //   错！原代码先 addEventListener 再 pullAndRender()，但 linkedEl 在 L132
    //   声明时是 null，到 addEventListener 时尚未通过 pullAndRender() 拿到 DOM 元素，
    //   if (linkedEl) 永远 false → listener 永远挂不上。功能还活着（每帧轮询 __dirty），
    //   但事件驱动通道是死代码。
    // 修法：先 pullAndRender() 让 linkedEl 拿到值，再 addEventListener。
    pullAndRender();

    //   改用事件驱动：addEventListener 监听 sc:geom3d:change
    // 事件驱动：监听联动源的 sc:geom3d:change 立即触发一次重建（不等下一帧）
    if (linkedEl && !linkedEl.__scTetraEquivBound) {
      linkedEl.__scTetraEquivBound = true; // 防重复注册（多个 tetra-equiv 绑同一源时）
      linkedEl.addEventListener('sc:geom3d:change', function() { api.__dirty = true; });
    }
  }

  function initAll() {
    document.querySelectorAll('.tetra-equiv').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[tetra-equiv] init failed:', e); }
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