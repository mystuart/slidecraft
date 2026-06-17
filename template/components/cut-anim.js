/**
 * @component cut-anim
 * @version 0.1.3
 * @status 最小可用版
 *
 * v0.1.3 变更（生命周期接入，架构债 H4）：
 *   - 永续 renderLoop RAF + playhead animate RAF 登记到句柄，destroy 可取消
 *   - ResizeObserver 登记，destroy disconnect
 *   - 2 个 setTimeout（自动播放 / 不循环回 0）登记，destroy clearTimeout
 *   - 新增 WebGL 资源释放 disposer（OrbitControls / geometry+material / renderer）
 *
 * 剖切动画组件 —— 「从三棱柱切下一刀得到三棱锥」的过程动画
 *
 * 教学场景：立体几何求三棱锥体积时，把「取巧等体积法」可视化为
 * 「从三棱柱里切下一块」 —— 切下部分就是三棱锥，剩余部分是另一个三棱柱，
 * 学员能**直接看到** 7/12 vs 5/12 这种比例关系的几何本质。
 *
 * 字段：
 *   - id               {string}   必填 · 组件根 ID
 *   - title            {string}   可选 · 卡片小标题
 *   - caption          {string}   可选 · 卡片下方说明文字
 *   - linkedGeometry3d {string}   必填 · 联动的 geometry-3d 实例 ID（顶点源）
 *   - keepVertices     {string[]} 必填（4 个）· 切下保留的 4 个顶点（构成目标三棱锥）
 *   - cutPlane         {object}   必填 · {type: "plane-through-points", points: [lbl1, lbl2, lbl3]}
 *                                用 3 个 label 定义的「切割平面」（必须含 cutPlane 内部三角）
 *   - duration         {number}   可选 · 动画时长（ms，默认 1500）
 *   - easing           {string}   可选 · 缓动函数名（默认 'easeInOutQuad'，可选 'linear' / 'easeOutCubic'）
 *   - playButton       {bool}     可选 · 是否显示播放按钮（默认 true；false = 加载即自动播一次）
 *   - loop             {bool}     可选 · 动画结束后保持显示「保留四面体」还是隐藏（默认 true 保留）
 *   - camera           {object}   可选 · {position:[x,y,z], target:[x,y,z]}（默认自动框）
 *   - showVolumeHint   {bool}     可选 · 是否显示「切下 / 剩余」体积比例提示（默认 true）
 *
 * 联动规则（v0.1）：
 *   - 每帧从 window.__scGeom3D[linkedGeometry3d].getLabelPos(name) 拉取所有命名顶点
 *   - linkedGeometry3d 里通过 slider 改 P 位置时，本组件动画用最新位置
 *   - 切割平面由 3 个 label 定义，每帧重算（顶点变了切面也跟着转）
 *
 * v0.1 动画设计：
 *   - 不引入 Three.js clippingPlane（兼容性差，与 slider/derived 联动风险高）
 *   - 用「完整几何体半透明 + 保留四面体 fade in」表达剖切效果
 *   - 进度 0.0：只显示完整三棱柱（淡），保留四面体不可见
 *   - 进度 0.5：保留四面体 fade in 到 ~50% 透明度
 *   - 进度 1.0：保留四面体不透明（凸显「切下的部分」），完整几何体淡到 30%
 *   - 进度 1.0 + 动画结束：循环或保持（loop=false = 回到 0）
 *
 * v0.1 实现边界：
 *   - 不做"切割产生的物理位移"（如让切下部分整体平移出三棱柱）
 *   - 不做"切面纹路"（只展示几何，不展示平面纹理）
 *   - 仅支持 plane-through-points（3 个 label）；不支持平面方程 / 法线直接给定
 *   - 完整几何体的顶点必须全部在源 geometry-3d 的 labels 里声明
 *   - keepVertices 必须正好 4 项且与 cutPlane.points 不全相同（4 个保留点必构成四面体）
 *
 * 已知问题：
 *   - 「切下部分」和「完整几何体」在同一个 canvas 里叠加，3D 拖动时学员可能误判空间关系
 *   - 比例提示（showVolumeHint）的「切下 / 剩余」用体积公式估算，未做精确 mesh-level 切割
 *   - linkedGeometry3d 实例未就绪时组件 fallback：等 200ms / 800ms 重拉
 */

const { escapeHtml } = require('./_inline.js');
const { clientJs: geomUtilsJs } = require('./_geom_utils.js');

function render(data) {
  const id = data.id || ('cut-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const caption = data.caption || '';
  const linkedGeometry3d = data.linkedGeometry3d || '';
  const keepVertices = Array.isArray(data.keepVertices) ? data.keepVertices : [];
  const cutPlane = (data.cutPlane && typeof data.cutPlane === 'object') ? data.cutPlane : null;
  const duration = Number.isFinite(data.duration) ? data.duration : 1500;
  const easing = data.easing || 'easeInOutQuad';
  const playButton = data.playButton !== false;
  const loop = data.loop !== false;
  const showVolumeHint = data.showVolumeHint !== false;
  // v0.1.2 升级：prism 顶点 labels 由 schema 配置（GLM-5.1 评审指出硬编码 'A'/'B'/'C' 是 bug）
  // 默认值兼容旧 demo：['A', 'B', 'C', 'A₁', 'B₁', 'C₁']，对应标准三棱柱 6 顶点
  const prismLabels = Array.isArray(data.prismLabels) && data.prismLabels.length === 6
    ? data.prismLabels
    : ['A', 'B', 'C', 'A₁', 'B₁', 'C₁'];

  // 把配置序列化到 data-*（供 clientJs 解析）
  // 所有用户输入字段走 escapeHtml 防 XSS
  const linkedId = escapeHtml(linkedGeometry3d);
  const keepJson = JSON.stringify(keepVertices);
  const cutPlaneJson = cutPlane ? JSON.stringify(cutPlane) : '{}';

  const titleHtml = title
    ? `<div class="cut-anim-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="cut-anim-caption">${escapeHtml(caption)}</div>`
    : '';

  return `<div class="cut-anim" id="${escapeHtml(id)}"
  data-cut-id="${escapeHtml(id)}"
  data-linked-geometry-3d="${linkedId}"
  data-keep='${escapeHtml(keepJson)}'
  data-cut-plane='${escapeHtml(cutPlaneJson)}'
  data-prism-labels='${escapeHtml(JSON.stringify(prismLabels))}'
  data-duration="${duration}"
  data-easing="${escapeHtml(easing)}"
  data-play-button="${playButton ? '1' : '0'}"
  data-loop="${loop ? '1' : '0'}"
  data-show-volume="${showVolumeHint ? '1' : '0'}">
  ${titleHtml}
  <div class="cut-anim-stage"></div>
  <div class="cut-anim-controls">
    ${playButton ? `<button class="cut-anim-play" type="button">▶ 播放剖切动画</button>` : ''}
    <button class="cut-anim-reset" type="button">↻ 重置</button>
    <span class="cut-anim-progress-text" data-progress-text>就绪</span>
  </div>
  <div class="cut-anim-volume-hint" data-volume-hint hidden>
    <span class="cut-anim-volume-label">保留四面体 ≈ </span>
    <span data-keep-vol>—</span>
    <span class="cut-anim-volume-sep"> · 整体三棱柱 = </span>
    <span data-total-vol>—</span>
    <span class="cut-anim-volume-sep"> · 比例 ≈ </span>
    <span data-ratio>—</span>
  </div>
  ${captionHtml}
</div>`;
}

/**
 * 缓动函数（与 Three.js / CSS easing 同名）
 */
const EASING_FN = `
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeLinear(t) { return t; }
function pickEasing(name) {
  if (name === 'linear') return easeLinear;
  if (name === 'easeOutCubic') return easeOutCubic;
  return easeInOutQuad;
}
`;

const clientJs = `
${geomUtilsJs}
(function() {
  if (window.__scCutAnimLoaded) return;
  window.__scCutAnimLoaded = true;

  ${EASING_FN}

  function initOne(root) {
    var lc = createLifecycle(root);   // 生命周期句柄（架构债 H4）
    var THREE = window.__scThree;
    var OC = window.__scOrbitControls;
    if (!THREE) {
      console.warn('[cut-anim] window.__scThree 未找到，请确认 build.js 已注入 Three.js');
      return;
    }

    var linkedId = root.getAttribute('data-linked-geometry-3d') || '';
    var api = null;  // 联动源 API（v0.1.2：提升到 initOne 顶层，dirty flag 渲染循环需要访问）
    var linkedEl = null;
    var keep = [];
    var cutPlane = null;
    var duration = parseInt(root.getAttribute('data-duration'), 10) || 1500;
    var easingName = root.getAttribute('data-easing') || 'easeInOutQuad';
    var playButton = root.getAttribute('data-play-button') === '1';
    var loop = root.getAttribute('data-loop') === '1';
    var showVolume = root.getAttribute('data-show-volume') === '1';
    var easing = pickEasing(easingName);

    try { keep = JSON.parse(root.getAttribute('data-keep') || '[]'); } catch (e) { keep = []; }
    try {
      var cp = JSON.parse(root.getAttribute('data-cut-plane') || '{}');
      if (cp && cp.type === 'plane-through-points' && Array.isArray(cp.points) && cp.points.length === 3) {
        cutPlane = cp;
      }
    } catch (e) { /* keep null */ }
    // v0.1.2：棱柱 6 顶点 label 由 schema 配置（默认 ['A','B','C','A₁','B₁','C₁']）
    // 顺序：[底面3, 顶面3]，与 geometry-3d 的 vertices 顺序一致
    var prismLabels = ['A', 'B', 'C', 'A₁', 'B₁', 'C₁'];
    try {
      var pl = JSON.parse(root.getAttribute('data-prism-labels') || '[]');
      if (Array.isArray(pl) && pl.length === 6) prismLabels = pl;
    } catch (e) { /* keep default */ }

    var stage = root.querySelector('.cut-anim-stage');
    if (!stage) return;
    var w = stage.clientWidth || 360;
    var h = stage.clientHeight || 320;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#fdfdfd');

    var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(4, 4, 5);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    stage.appendChild(renderer.domElement);

    var controls = null;
    if (OC) {
      controls = new OC(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.update();
    }

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() {
        var nw = stage.clientWidth || 360;
        var nh = stage.clientHeight || 320;
        if (nw === w && nh === h) return;
        w = nw; h = nh;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(stage);
      lc.observer(ro);
    }

    /**
     * 完整三棱柱组（淡显示 = 1.0，淡去 = 0.3）
     * 注意：geometry-3d 是 triangular-prism，6 个顶点 = 底面 ABC + 顶面 A₁B₁C₁
     */
    var prismFill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#cce0ff'),
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: true,
      })
    );
    scene.add(prismFill);
    var prismEdges = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      // C3 修复：必须 transparent: true，否则 L418 动画改 opacity 失效（Three.js 要求）
      new THREE.LineBasicMaterial({ color: new THREE.Color('#1a1a1a'), transparent: true })
    );
    scene.add(prismEdges);

    /**
     * 保留四面体组（fade in：0.0 → 0.85）
     */
    var keepFill = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff6b35'),
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    scene.add(keepFill);
    var keepEdges = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: new THREE.Color('#ff6b35') })
    );
    keepEdges.material.transparent = true;
    keepEdges.material.opacity = 0.0;
    scene.add(keepEdges);

    /**
     * 切平面（半透面，淡蓝/淡紫，动画过程中淡入提示「这是切口」）
     */
    var cutPlaneMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#a78bfa'),
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    scene.add(cutPlaneMesh);

    /**
     * 从源 geometry-3d 拉取所有命名顶点 + 重画三棱柱 + 保留四面体 + 切平面
     * v0.1.1：优先走 DOM 元素的 __scApi（per-instance 闭包，A2 改造），
     * 兜底用 window.__scGeom3D[id]（兼容老代码）
     */
    function pullAndRender(progress) {
      progress = (typeof progress === 'number') ? progress : (root.dataset.progress ? parseFloat(root.dataset.progress) : 0);
      linkedEl = document.getElementById(linkedId);
      if (linkedEl && linkedEl.__scApi && typeof linkedEl.__scApi.getLabelPos === 'function') {
        api = linkedEl.__scApi;
      } else if (window.__scGeom3D && window.__scGeom3D[linkedId]) {
        api = window.__scGeom3D[linkedId];
      }
      if (!api || typeof api.getLabelPos !== 'function') return;

      // 取所有标准顶点 A, B, C, A₁, B₁, C₁（用于画三棱柱）
      // 注意：源 geometry-3d 的 labels 用的可能是带下标字符（"A₁"），
      // 取所有 6 个棱柱顶点（label 由 schema 配置，默认 ['A','B','C','A₁','B₁','C₁']）
      // 顺序：底面 3 + 顶面 3，与 geometry-3d 的 vertices 顺序一致
      function tryGet(name) { return api.getLabelPos(name) || null; }
      var a  = tryGet(prismLabels[0]);
      var b  = tryGet(prismLabels[1]);
      var c  = tryGet(prismLabels[2]);
      var a1 = tryGet(prismLabels[3]);
      var b1 = tryGet(prismLabels[4]);
      var c1 = tryGet(prismLabels[5]);
      var p  = tryGet('P');
      // C2 修复：删掉 var d = tryGet(['D']); —— 死代码（变量 d 从未使用，且 ['D'] 是数组非字符串，靠 JS 对象键 toString 巧合不报错）

      var verts = [];
      if (a && b && c && a1 && b1 && c1) {
        verts = [a, b, c, a1, b1, c1];
      }
      if (verts.length === 6) {
        // 6 顶点三棱柱：构造 fill + edges
        // 底面 ABC = 0,1,2；顶面 A₁B₁C₁ = 3,4,5
        // 5 个面（实际更多细分，但 client 用 BufferGeometry 自己三角化）
        var positions = [];
        function pushTri(i, j, k) {
          positions.push(verts[i][0], verts[i][1], verts[i][2]);
          positions.push(verts[j][0], verts[j][1], verts[j][2]);
          positions.push(verts[k][0], verts[k][1], verts[k][2]);
        }
        // 底面 ABC（朝下看 CW）
        pushTri(0, 1, 2);
        // 顶面 A₁B₁C₁（朝上看 CCW）
        pushTri(3, 5, 4);
        // 侧面 1: A-B-B₁-A₁
        pushTri(0, 1, 4); pushTri(0, 4, 3);
        // 侧面 2: B-C-C₁-B₁
        pushTri(1, 2, 5); pushTri(1, 5, 4);
        // 侧面 3: C-A-A₁-C₁
        pushTri(2, 0, 3); pushTri(2, 3, 5);
        prismFill.geometry.dispose();
        prismFill.geometry = new THREE.BufferGeometry();
        prismFill.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        prismFill.geometry.computeVertexNormals();

        var edgePos = [];
        function pushEdge(i, j) {
          edgePos.push(verts[i][0], verts[i][1], verts[i][2]);
          edgePos.push(verts[j][0], verts[j][1], verts[j][2]);
        }
        // 底面 3 条
        pushEdge(0, 1); pushEdge(1, 2); pushEdge(2, 0);
        // 顶面 3 条
        pushEdge(3, 4); pushEdge(4, 5); pushEdge(5, 3);
        // 侧棱 3 条
        pushEdge(0, 3); pushEdge(1, 4); pushEdge(2, 5);
        prismEdges.geometry.dispose();
        prismEdges.geometry = new THREE.BufferGeometry();
        prismEdges.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
      }

      // 保留四面体
      if (keep.length === 4) {
        var kv = [
          api.getLabelPos(keep[0]) || [0, 0, 0],
          api.getLabelPos(keep[1]) || [0, 0, 0],
          api.getLabelPos(keep[2]) || [0, 0, 0],
          api.getLabelPos(keep[3]) || [0, 0, 0],
        ];
        var kf = cwGeom_buildTetraPositions(kv);
        var ke = cwGeom_buildEdgePositions(kv);
        if (kf) {
          keepFill.geometry.dispose();
          keepFill.geometry = new THREE.BufferGeometry();
          keepFill.geometry.setAttribute('position', new THREE.Float32BufferAttribute(kf, 3));
          keepFill.geometry.computeVertexNormals();
        }
        if (ke) {
          keepEdges.geometry.dispose();
          keepEdges.geometry = new THREE.BufferGeometry();
          keepEdges.geometry.setAttribute('position', new THREE.Float32BufferAttribute(ke, 3));
        }
        // 体积提示
        if (showVolume) {
          var hint = root.querySelector('.cut-anim-volume-hint');
          if (hint && hint.hidden) hint.hidden = false;
          var keepVol = cwGeom_tetraVolume(kv[0], kv[1], kv[2], kv[3]);
          var totalVol = 0;
          // 三棱柱体积 = 底面积 × 高（用 B₁B 向量在底面法向的投影；此处用最简估算）
          if (a && b && c && b1) {
            // 底面积 = |AC × AB| / 2
            var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
            var ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            var crossX = ab[1] * ac[2] - ab[2] * ac[1];
            var crossY = ab[2] * ac[0] - ab[0] * ac[2];
            var crossZ = ab[0] * ac[1] - ab[1] * ac[0];
            var baseArea = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) / 2;
            // 高 = B₁ 到平面 ABC 的距离
            var n = [crossX, crossY, crossZ];
            var nLen = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
            var ap = [b1[0] - a[0], b1[1] - a[1], b1[2] - a[2]];
            var dot = ap[0] * n[0] + ap[1] * n[1] + ap[2] * n[2];
            var height = Math.abs(dot) / nLen;
            totalVol = baseArea * height;
          }
          var elKV = root.querySelector('[data-keep-vol]');
          var elTV = root.querySelector('[data-total-vol]');
          var elR  = root.querySelector('[data-ratio]');
          if (elKV) elKV.textContent = cwGeom_fmtVol(keepVol);
          if (elTV) elTV.textContent = cwGeom_fmtVol(totalVol);
          if (elR) elR.textContent = (totalVol > 1e-9 ? (keepVol / totalVol).toFixed(4).replace(/0+$/, '').replace(/\\.$/, '') + ' : 1' : '—');
        }
      }

      // 切平面（cutPlane.points 三点构成的平面 + 一点点大小）
      if (cutPlane && cutPlane.points.length === 3) {
        var cp1 = api.getLabelPos(cutPlane.points[0]) || [0, 0, 0];
        var cp2 = api.getLabelPos(cutPlane.points[1]) || [0, 0, 0];
        var cp3 = api.getLabelPos(cutPlane.points[2]) || [0, 0, 0];
        // 构造切平面：在三点上扩展成一个三角形（用 3 点本身作为三角形顶点，
        // 这是「切面」的退化情况 —— 但够演示切口位置）
        var cpPos = [
          cp1[0], cp1[1], cp1[2],
          cp2[0], cp2[1], cp2[2],
          cp3[0], cp3[1], cp3[2],
        ];
        cutPlaneMesh.geometry.dispose();
        cutPlaneMesh.geometry = new THREE.BufferGeometry();
        cutPlaneMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(cpPos, 3));
        cutPlaneMesh.geometry.computeVertexNormals();
      }

      // 动画进度 → 透明度
      // 完整三棱柱：1.0 → 0.3
      prismFill.material.opacity = 1.0 - 0.7 * progress;
      prismEdges.material.opacity = 1.0 - 0.5 * progress;
      // 保留四面体：0.0 → 0.85
      keepFill.material.opacity = 0.85 * progress;
      keepEdges.material.opacity = progress;
      // 切平面：进度 0~0.5 淡入到 0.4，0.5~1.0 淡出
      cutPlaneMesh.material.opacity = (progress < 0.5 ? progress * 2 * 0.4 : (1 - progress) * 2 * 0.4);

      // 自适应相机框
      if (!root.dataset.cameraFramed && verts.length === 6) {
        var minX = Infinity, minY = Infinity, minZ = Infinity;
        var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (var vi = 0; vi < verts.length; vi++) {
          var pp = verts[vi];
          if (!pp) continue;
          if (pp[0] < minX) minX = pp[0];
          if (pp[1] < minY) minY = pp[1];
          if (pp[2] < minZ) minZ = pp[2];
          if (pp[0] > maxX) maxX = pp[0];
          if (pp[1] > maxY) maxY = pp[1];
          if (pp[2] > maxZ) maxZ = pp[2];
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

    // 动画状态
    var animState = { raf: null, startTime: 0, active: false };
    var progress = 0;

    function setProgress(p) {
      progress = Math.max(0, Math.min(1, p));
      root.dataset.progress = String(progress);
      var pt = root.querySelector('[data-progress-text]');
      if (pt) {
        if (progress <= 0) pt.textContent = '就绪';
        else if (progress >= 1) pt.textContent = '✓ 剖切完成';
        else pt.textContent = '剖切中… ' + Math.round(progress * 100) + '%';
      }
    }

    function animate() {
      var now = performance.now();
      var elapsed = now - animState.startTime;
      var t = Math.min(1, elapsed / duration);
      var eased = easing(t);
      setProgress(eased);
      pullAndRender(progress);
      if (controls) controls.update();
      renderer.render(scene, camera);
      if (t < 1) {
        animState.raf = requestAnimationFrame(animate);
        lc.raf(animState.raf);
      } else {
        animState.active = false;
        if (!loop) {
          // 不循环：回到 0
          var tid = setTimeout(function() {
            setProgress(0);
            pullAndRender(0);
          }, 1500);
          lc.timeout(tid);
        }
      }
    }

    function play() {
      if (animState.active) return;
      animState.active = true;
      animState.startTime = performance.now();
      // 进度从 0 开始（如已在中间则从当前位置继续）
      if (progress >= 1) {
        setProgress(0);
        animState.startTime = performance.now();
      }
      if (animState.raf) cancelAnimationFrame(animState.raf);
      animState.raf = requestAnimationFrame(animate);
      lc.raf(animState.raf);
    }

    function reset() {
      if (animState.raf) cancelAnimationFrame(animState.raf);
      animState.active = false;
      setProgress(0);
      pullAndRender(0);
    }

    // 控件绑定
    var playBtn = root.querySelector('.cut-anim-play');
    if (playBtn) playBtn.addEventListener('click', play);
    var resetBtn = root.querySelector('.cut-anim-reset');
    if (resetBtn) resetBtn.addEventListener('click', reset);

    // v0.1.2：RAF + dirty flag 渲染循环
    //   只有联动源 setLabelPos 触发（api.__dirty = true）才 pullAndRender 重建
    //   空闲时只 render(scene) 沿用现有几何体，省 GC
    //   动画播放期间仍走独立 animate() 循环（线性插值进度条）
    function renderLoop() {
      var rid = requestAnimationFrame(renderLoop);
      lc.raf(rid);   // 永续循环登记，destroy 可取消
      if (!animState.active) {
        if (api && api.__dirty) {
          api.__dirty = false;
          pullAndRender(progress);
        }
        if (controls) controls.update();
        renderer.render(scene, camera);
      }
    }
    renderLoop();

    // 事件驱动：监听联动源的 sc:geom3d:change 立即触发一次重建
    var linkedGeom3dEl = document.getElementById(linkedId);
    if (linkedGeom3dEl) {
      linkedGeom3dEl.addEventListener('sc:geom3d:change', function() { api.__dirty = true; });
      // linkedGeom3dEl 是 per-element 监听，元素移除即销毁，不必登记到 lc
    }

    // 首帧强制 pullAndRender 一次（拿到初始坐标）
    pullAndRender(progress);

    // 自动播放（如果 playButton=false）
    if (!playButton) {
      var autoTid = setTimeout(play, 500);
      lc.timeout(autoTid);
    }

    // 销毁时释放 WebGL 资源 + OrbitControls（架构债 H4）
    lc.dispose(function() {
      try { if (controls && typeof controls.dispose === 'function') controls.dispose(); } catch (e) {}
      try {
        scene.traverse(function(obj) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(function(m) { m.dispose(); });
            else obj.material.dispose();
          }
        });
      } catch (e) {}
      try { renderer.dispose(); } catch (e) {}
    });
  }

  function initAll() {
    document.querySelectorAll('.cut-anim').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[cut-anim] init failed:', e); }
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