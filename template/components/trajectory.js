/**
 * @component trajectory
 * @version 0.1.0
 * @status 最小可用版
 *
 * 动点轨迹追踪组件 —— 在独立 canvas 里画出某个 3D 顶点走过的路径
 *
 * 教学场景：slider 拖动 P 在 A₁C₁ 上滑动时，「P 走过的路径」是直线段 A₁C₁；
 * 学员第一反应是"那不就是条直线吗" —— 但当 P 在曲面上滑动 / 在约束里运动时，轨迹
 * 可能是抛物线、圆弧、双纽线等。3D 场景里拖动时，**先画的路径会留下半透拖尾**，
 * 学员能直观看到「运动的形状」。
 *
 * 字段：
 *   - id                {string}        必填 · 组件根 ID
 *   - title             {string}        可选 · 卡片小标题
 *   - caption           {string}        可选 · 卡片下方说明文字
 *   - linkedGeometry3d  {string}        必填 · 联动的 geometry-3d 实例 ID
 *   - tracks            {array}         必填 · 1+ 个追踪对象
 *   - tracks[].id       {string}        必填 · 追踪对象 ID（与该顶点的 label 名相同）
 *   - tracks[].label     {string}        可选 · 轨迹图例文字（默认 = id）
 *   - tracks[].color    {string}        可选 · 轨迹颜色（默认 #ff6b35）
 *   - tracks[].width     {number}        可选 · 线宽（默认 2）
 *   - tracks[].style     {'line'|'dotted'}  可选 · 线条样式（默认 'line'）
 *   - tracks[].maxPoints {number}        可选 · 轨迹最长保留多少采样点（默认 200）
 *   - camera            {object}        可选 · {position, target, fov}（默认自适应）
 *   - liveTrace         {bool}          可选 · 实时画拖尾（true）vs 全程先回放（false），默认 true
 *   - showAxes          {bool}          可选 · 是否画坐标轴（默认 false）
 *   - showVertices      {bool}          可选 · 轨迹上的关键点画球（默认 true）
 *
 * 联动规则（v0.1）：
 *   - 启动时立即从 source 拉一次当前顶点位置，画初始点
 *   - 监听 source 的 sc:geom3d:change 事件（setLabelPos 触发），每收一个事件：
 *     1) 把新位置 push 到 tracks[id].points 数组
 *     2) 数组满 maxPoints 时 shift 头（FIFO 滑动窗口）
 *     3) 重画对应追踪对象的 BufferGeometry（line + 顶点球）
 *   - 与 slider.js / tetra-equiv.js 联动一致：优先 per-instance 闭包
 *
 * v0.1 实现边界：
 *   - 仅支持追踪 1 个顶点（多顶点可以同时追踪，但每顶点独立一条线）
 *   - 轨迹仅保留最近的 maxPoints 个采样点（避免内存无限增长）
 *   - 三个组件共用 Three.js bundle（window.__scThree）
 *
 * 已知问题：
 *   - 拖动很快时轨迹采样点稀疏（取决于 source setLabelPos 频率）—— 可通过拉平差值解决
 *   - 第一帧如果没收到 sc:geom3d:change 事件，初始位置点可能画错位（依赖源是初始化时已渲染的）
 */

const { escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('traj-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const caption = data.caption || '';
  const linkedGeometry3d = data.linkedGeometry3d || '';
  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const liveTrace = data.liveTrace !== false;
  const showAxes = data.showAxes === true;
  const showVertices = data.showVertices !== false;

  const tracksJson = JSON.stringify(tracks);

  const titleHtml = title
    ? `<div class="trajectory-title">${escapeHtml(title)}</div>`
    : '';
  const captionHtml = caption
    ? `<div class="trajectory-caption">${escapeHtml(caption)}</div>`
    : '';

  const legendItems = tracks.map(function(t) {
    const color = (t && t.color) || '#ff6b35';
    const label = (t && t.label) || (t && t.id) || '?';
    return `<span class="trajectory-legend-item"><i class="trajectory-swatch" style="background:${escapeHtml(color)}"></i>${escapeHtml(label)}</span>`;
  }).join('');

  return `<div class="trajectory" id="${escapeHtml(id)}"
  data-traj-id="${escapeHtml(id)}"
  data-linked-geometry-3d="${escapeHtml(linkedGeometry3d)}"
  data-tracks='${escapeHtml(tracksJson)}'
  data-live-trace="${liveTrace ? '1' : '0'}"
  data-show-axes="${showAxes ? '1' : '0'}"
  data-show-vertices="${showVertices ? '1' : '0'}">
  ${titleHtml}
  <div class="trajectory-stage"></div>
  <div class="trajectory-legend">${legendItems}</div>
  ${captionHtml}
</div>`;
}

const clientJs = `
(function() {
  if (window.__scTrajectoryLoaded) return;
  window.__scTrajectoryLoaded = true;

  function initOne(root) {
    var THREE = window.__scThree;
    if (!THREE) {
      console.warn('[trajectory] window.__scThree 未找到，请确认 build.js 已注入 Three.js');
      return;
    }

    var linkedId = root.getAttribute('data-linked-geometry-3d') || '';
    var linkedEl = null;
    var api = null;
    var tracks = [];
    var liveTrace = root.getAttribute('data-live-trace') === '1';
    var showAxes = root.getAttribute('data-show-axes') === '1';
    var showVertices = root.getAttribute('data-show-vertices') === '1';

    try { tracks = JSON.parse(root.getAttribute('data-tracks') || '[]'); } catch (e) { tracks = []; }

    var stage = root.querySelector('.trajectory-stage');
    if (!stage) return;
    var w = stage.clientWidth || 360;
    var h = stage.clientHeight || 240;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#fdfdfd');

    var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(4, 4, 5);
    camera.lookAt(0, 0, 0);
    // 沿用项目坐标系：BB₁=+Z 朝上
    camera.up.set(0, 0, 1);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    stage.appendChild(renderer.domElement);

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() {
        var nw = stage.clientWidth || 360;
        var nh = stage.clientHeight || 240;
        if (nw === w && nh === h) return;
        w = nw; h = nh;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(stage);
    }

    if (showAxes) {
      scene.add(new THREE.AxesHelper(3));
    }

    // 每个 track 一个 Group（line + 可选 vertex balls）
    var trackObjects = {}; // id → { line, points[], vertexMeshes[], group, color, maxPoints }
    tracks.forEach(function(t) {
      var maxPoints = Number.isFinite(t.maxPoints) ? t.maxPoints : 200;
      var color = new THREE.Color(t.color || '#ff6b35');
      var lineMat = new THREE.LineBasicMaterial({ color: color });
      var lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(maxPoints * 3), 3));
      lineGeom.setDrawRange(0, 0); // 初始 0 点
      var line = new THREE.Line(lineGeom, lineMat);
      scene.add(line);

      // 关键点球（小白点，跟随轨迹点）
      var ballMeshes = [];
      // 用一个 InstancedMesh 多个球
      var ballGeom = new THREE.SphereGeometry(0.04, 8, 8);
      var ballMat = new THREE.MeshBasicMaterial({ color: color });
      var inst = new THREE.InstancedMesh(ballGeom, ballMat, maxPoints);
      inst.count = 0;
      scene.add(inst);

      trackObjects[t.id] = {
        line: line,
        lineGeom: lineGeom,
        instMesh: inst,
        ballMat: ballMat,
        points: [], // [{x, y, z}, ...]
        maxPoints: maxPoints,
        color: color,
        meta: t
      };
    });

    function getLinkedApi() {
      if (!linkedEl) linkedEl = document.getElementById(linkedId);
      if (linkedEl && linkedEl.__scApi) return linkedEl.__scApi;
      if (window.__scGeom3D && window.__scGeom3D[linkedId]) return window.__scGeom3D[linkedId];
      return null;
    }

    function pushPoint(trackId, x, y, z) {
      var tobj = trackObjects[trackId];
      if (!tobj) return;
      tobj.points.push([x, y, z]);
      if (tobj.points.length > tobj.maxPoints) {
        tobj.points.shift();
      }
      // 重建 line geometry
      var positions = tobj.lineGeom.getAttribute('position');
      var n = tobj.points.length;
      for (var i = 0; i < n; i++) {
        positions.setXYZ(i, tobj.points[i][0], tobj.points[i][1], tobj.points[i][2]);
      }
      tobj.lineGeom.setDrawRange(0, n);
      positions.needsUpdate = true;
      // 关键点：InstancedMesh 用最后一点的位置
      if (showVertices && n > 0) {
        var p = tobj.points[n - 1];
        var m = new THREE.Matrix4();
        m.makeTranslation(p[0], p[1], p[2]);
        tobj.instMesh.setMatrixAt(0, m);
        tobj.instMesh.count = 1;
        tobj.instMesh.instanceMatrix.needsUpdate = true;
      }
    }

    function pullCurrent() {
      var lApi = getLinkedApi();
      if (!lApi) return;
      tracks.forEach(function(t) {
        var pos = lApi.getLabelPos(t.id);
        if (pos) pushPoint(t.id, pos[0], pos[1], pos[2]);
      });
    }

    function fitCamera() {
      // 自适应相机框：取所有追踪点 + 当前拉取点
      var allPts = [];
      Object.keys(trackObjects).forEach(function(tid) {
        allPts = allPts.concat(trackObjects[tid].points);
      });
      // 加上当前快照
      var lApi = getLinkedApi();
      if (lApi) {
        tracks.forEach(function(t) {
          var p = lApi.getLabelPos(t.id);
          if (p) allPts.push(p);
        });
      }
      if (allPts.length < 2) return;
      var minX = Infinity, minY = Infinity, minZ = Infinity;
      var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      allPts.forEach(function(p) {
        if (p[0] < minX) minX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[2] < minZ) minZ = p[2];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] > maxY) maxY = p[1];
        if (p[2] > maxZ) maxZ = p[2];
      });
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
      var radius = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 2;
      camera.position.set(cx + radius * 1.5, cy + radius * 1.2, cz + radius * 1.8);
      camera.lookAt(cx, cy, cz);
    }

    // 渲染循环
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // 拉初始点（可能源已就绪）
    setTimeout(pullCurrent, 50);
    setTimeout(pullCurrent, 200);
    setTimeout(function() { fitCamera(); renderer.render(scene, camera); }, 300);

    // 事件驱动：监听联动源的 sc:geom3d:change 立即 push 新点
    // 注意：linkedEl 可能在源未初始化时为 null，事件也会冒泡到 document
    // 装 document 级监听更稳，且能在源延迟渲染后正确响应
    function onGeomChange(ev) {
      var detail = ev && ev.detail;
      if (!detail || !detail.name) return;
      if (!liveTrace) return;
      var tobj = trackObjects[detail.name];
      if (!tobj) return;
      // 校验源元素：必须是联动源（避免其他 geom-3d 干扰）
      var srcEl = ev.target;
      if (linkedId && srcEl && srcEl.id !== linkedId) return;
      pushPoint(detail.name, detail.pos[0], detail.pos[1], detail.pos[2]);
    }
    document.addEventListener('sc:geom3d:change', onGeomChange);
  }

  function initAll() {
    document.querySelectorAll('.trajectory').forEach(function(r) {
      try { initOne(r); } catch (e) { console.error('[trajectory] init failed:', e); }
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
