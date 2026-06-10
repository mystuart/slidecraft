/**
 * @component tetra-equiv
 * @version 0.1.0
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
 *   - 客户端每帧从 window.__cwGeom3D[linkedGeometry3d].getLabelPos(name) 拉取最新顶点坐标
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
(function() {
  if (window.__cwTetraEquivLoaded) return;
  window.__cwTetraEquivLoaded = true;

  /**
   * 4 面体体积公式：V = |(b-a) · ((c-a) × (d-a))| / 6
   */
  function tetraVolume(a, b, c, d) {
    if (!a || !b || !c || !d) return 0;
    var bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    var cax = c[0] - a[0], cay = c[1] - a[1], caz = c[2] - a[2];
    var dax = d[0] - a[0], day = d[1] - a[1], daz = d[2] - a[2];
    // (c-a) × (d-a)
    var cx = cay * daz - caz * day;
    var cy = caz * dax - cax * daz;
    var cz = cax * day - cay * dax;
    // (b-a) · cross
    var dot = bax * cx + bay * cy + baz * cz;
    return Math.abs(dot) / 6;
  }

  function fmtVol(v) {
    if (!Number.isFinite(v)) return '—';
    if (Math.abs(v) < 1e-9) return '0';
    if (Math.abs(v) >= 100) return v.toFixed(2);
    if (Math.abs(v) >= 1) return v.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
    return v.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
  }

  function initOne(root) {
    var THREE = window.__cwThree;
    var OC = window.__cwOrbitControls;
    if (!THREE) {
      console.warn('[tetra-equiv] window.__cwThree 未找到，请确认 build.js 已注入 Three.js');
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

    /**
     * 把 4 个顶点 + 1 种「base/apex」划分 转成 BufferGeometry 的 positions（3 三角面）+ 描边 positions
     *   base: [v0, v1, v2] 锥顶: apex（v3）
     *   三角面: (v0,v1,v2)（底）+ (v0,v1,v3) + (v1,v2,v3) + (v2,v0,v3)（侧）
     *   描边: 底 3 条 + 侧 3 条 = 6 条边（24 个顶点）
     */
    function buildTetraGeom(verts) {
      if (!Array.isArray(verts) || verts.length !== 4) return null;
      var v0 = verts[0], v1 = verts[1], v2 = verts[2], v3 = verts[3];
      if (!v0 || !v1 || !v2 || !v3) return null;
      var positions = [];
      function pushTri(a, b, c) {
        positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      }
      pushTri(v0, v1, v2); // 底
      pushTri(v0, v1, v3); // 侧 1
      pushTri(v1, v2, v3); // 侧 2
      pushTri(v2, v0, v3); // 侧 3
      return positions;
    }

    function buildEdgeGeom(verts) {
      if (!Array.isArray(verts) || verts.length !== 4) return null;
      var v0 = verts[0], v1 = verts[1], v2 = verts[2], v3 = verts[3];
      if (!v0 || !v1 || !v2 || !v3) return null;
      // 底 3 条: v0-v1, v1-v2, v2-v0
      // 侧 3 条: v0-v3, v1-v3, v2-v3
      var positions = [];
      function pushLine(a, b) {
        positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
      pushLine(v0, v1); pushLine(v1, v2); pushLine(v2, v0);
      pushLine(v0, v3); pushLine(v1, v3); pushLine(v2, v3);
      return positions;
    }

    /**
     * 拉取最新顶点位置 + 重画 4 个四面体 + 计算体积
     */
    function pullAndRender() {
      var api = (window.__cwGeom3D || {})[linkedId];
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
        var fillPos = buildTetraGeom(orderedVerts);
        var edgePos = buildEdgeGeom(orderedVerts);
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
        volumes.push(tetraVolume(orderedVerts[0], orderedVerts[1], orderedVerts[2], orderedVerts[3]));
      }

      // 体积校验显示
      if (showVolume) {
        var volBox = root.querySelector('.tetra-equiv-volume');
        if (volBox && volBox.hidden) volBox.hidden = false;
        for (var k = 0; k < 4; k++) {
          var el = root.querySelector('[data-vol-' + k + ']');
          if (el) el.textContent = fmtVol(volumes[k]);
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

    // 渲染循环
    function animate() {
      requestAnimationFrame(animate);
      pullAndRender();
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // linkedGeometry3d 实例可能晚于本组件就绪 → 延迟 200ms 再拉一次确保拿到
    setTimeout(pullAndRender, 200);
    setTimeout(pullAndRender, 800);
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