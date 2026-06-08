/**
 * @component geometry-3d
 * @version 0.1.0
 * @status 最小可用版
 *
 * 立体几何 3D 组件（Three.js）
 *
 * 字段：
 *   - title         {string}   可选 · 卡片标题
 *   - geometry      {string}   必填 · 几何体类型（box/sphere/cylinder/cone/tetrahedron/octahedron/prism/pyramid）
 *   - size          {array}    可选 · 几何体尺寸（按 geometry 含义不同，默认 [1,1,1]）
 *   - camera        {object}   可选 · {position:[x,y,z], target:[x,y,z], fov:50}
 *   - background    {string}   可选 · 画布背景色（默认 #ffffff）
 *   - showAxes      {bool}     可选 · 是否显示坐标轴（默认 false）
 *   - showGrid      {bool}     可选 · 是否显示网格（默认 false）
 *   - gridSize      {number}   可选 · 网格单位（默认 1）
 *   - showVertices  {bool}     可选 · 是否显示顶点小球（默认 true）
 *   - showEdges     {bool}     可选 · 是否描边（默认 true）
 *   - showFaces     {bool}     可选 · 是否填充面（默认 true）
 *   - edgeColor     {string}   可选 · 棱线颜色（默认 #1a1a1a）
 *   - faceColor     {string}   可选 · 面填充色（默认 #cce0ff）
 *   - vertexColor   {string}   可选 · 顶点球颜色（默认 #ff6b35）
 *   - opacity       {number}   可选 · 面填充透明度（0-1，默认 0.85）
 *   - labels        {array}    可选 · 顶点标签 [text, [x,y,z], color?, fontSize?]
 *   - caption       {string}   可选 · 卡片下方说明文字
 *
 * 已知问题（v0.1）：
 *   - 仅支持 box/sphere/cylinder/cone/tetrahedron/octahedron/prism/pyramid 八种基本几何体
 *   - 剖切面 / 三视图 / 展开动画等高级功能在 v0.2 迭代
 *   - prism/pyramid 在 v0.1 是占位实现（用 box/cone 替代），v0.2 改用真正几何体
 *   - 依赖 node_modules/three，build.js 负责把 three.module.js + addons 内联到 HTML
 *
 * 交互：
 *   - 拖动旋转 / 滚轮缩放 / Shift+拖动平移（OrbitControls 默认）
 *   - 双击几何体 = 以该几何体包围盒中心重置视角
 *   - 双击空白区 = 全局复位到 schema 里 camera.position 初始视角
 *
 * 客户端全局约定（由 build.js 注入）：
 *   - window.__cwThree         : THREE 命名空间
 *   - window.__cwOrbitControls : OrbitControls 构造器
 *   - window.__cwCSS2D         : { CSS2DRenderer, CSS2DObject }
 */

const { escapeHtml } = require('./_inline.js');

function render(data) {
  const title = data.title || '';
  const caption = data.caption || '';
  const captionHtml = caption
    ? `<div class="geom-3d-caption">${escapeHtml(caption)}</div>`
    : '';
  const titleHtml = title
    ? `<div class="geom-3d-title">${escapeHtml(title)}</div>`
    : '';
  const dataJson = JSON.stringify(data || {});

  return `<div class="geom-3d" data-geom='${escapeHtml(dataJson)}'>
  ${titleHtml}
  <div class="geom-3d-stage"></div>
  ${captionHtml}
</div>`;
}

const clientJs = `
(function() {
  if (window.__cwGeom3DLoaded) return;
  window.__cwGeom3DLoaded = true;

  function initAll() {
    var containers = Array.prototype.slice.call(
      document.querySelectorAll('.geom-3d:not(.is-initialized)')
    );
    if (containers.length === 0) return;
    containers.forEach(function(c) {
      try { initOne(c); } catch (err) { console.error('[geometry-3d] init failed:', err); }
    });
  }

  function initOne(container) {
    var stage = container.querySelector('.geom-3d-stage');
    if (!stage) return;

    var data;
    try {
      data = JSON.parse(container.getAttribute('data-geom') || '{}');
    } catch (e) {
      console.error('[geometry-3d] invalid data-geom JSON:', e);
      return;
    }

    container.classList.add('is-initialized');

    var THREE = window.__cwThree;
    if (!THREE) {
      console.error('[geometry-3d] window.__cwThree 未找到，请确认 build.js 已注入 Three.js');
      return;
    }

    buildScene(container, stage, data, THREE);
  }

  function buildScene(container, stage, data, THREE) {
    // ---- 1) 场景 / 相机 / 渲染器 ----
    var width = stage.clientWidth || 600;
    var height = stage.clientHeight || 360;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(data.background || '#ffffff');

    var camPos = (data.camera && data.camera.position) || [3, 3, 3];
    var camTarget = (data.camera && data.camera.target) || [0, 0, 0];
    var fov = (data.camera && data.camera.fov) || 50;
    var camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    camera.lookAt(camTarget[0], camTarget[1], camTarget[2]);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    stage.appendChild(renderer.domElement);

    // CSS2D 渲染器（标签层）—— 如果没注入就跳过
    var labelRenderer = null;
    var CSS2D = window.__cwCSS2D;
    if (CSS2D && CSS2D.CSS2DRenderer) {
      labelRenderer = new CSS2D.CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      stage.appendChild(labelRenderer.domElement);
    }

    // ---- 2) 灯光 ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    scene.add(directional);

    // ---- 3) 坐标轴 / 网格 ----
    if (data.showAxes) scene.add(new THREE.AxesHelper(3));
    if (data.showGrid) {
      var gridSize = data.gridSize || 1;
      var grid = new THREE.GridHelper(10, 10 / gridSize);
      grid.rotation.x = Math.PI / 2;
      grid.material.opacity = 0.4;
      grid.material.transparent = true;
      scene.add(grid);
    }

    // ---- 4) 几何体 ----
    var geomType = String(data.geometry || 'box').toLowerCase();
    var params = resolveGeometryParamsClient(geomType, data.size);

    var geometry;
    switch (geomType) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(params[0], params[1], params[2]);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(params[0], params[0], params[1], params[2]);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(params[0], params[1], params[2]);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(params[0]);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(params[0]);
        break;
      case 'prism':
        // v0.1 占位：真正 prism 在 v0.2
        geometry = new THREE.BoxGeometry(params[0] * 2, params[1], params[0]);
        break;
      case 'pyramid':
        // v0.1 占位：真正 pyramid 在 v0.2
        geometry = new THREE.ConeGeometry(params[0] * 1.5, params[1], 4);
        break;
      case 'box':
      default:
        geometry = new THREE.BoxGeometry(params[0], params[1], params[2]);
    }

    // 用一个 Object3D 当 root 容器，把面、棱、顶点、标签都挂到它上面，整体旋转
    var root = new THREE.Object3D();
    scene.add(root);

    var opacity = typeof data.opacity === 'number' ? data.opacity : 0.85;

    if (data.showFaces !== false) {
      var mat = new THREE.MeshPhongMaterial({
        color: data.faceColor || '#cce0ff',
        transparent: opacity < 1,
        opacity: opacity,
        side: THREE.DoubleSide,
      });
      root.add(new THREE.Mesh(geometry, mat));
    }

    if (data.showEdges !== false) {
      var edges = new THREE.EdgesGeometry(geometry);
      var lineMat = new THREE.LineBasicMaterial({ color: data.edgeColor || '#1a1a1a' });
      root.add(new THREE.LineSegments(edges, lineMat));
    }

    // ---- 5) 顶点小球 ----
    if (data.showVertices !== false) {
      var sphereGeom = new THREE.SphereGeometry(0.06, 16, 12);
      var sphereMat = new THREE.MeshBasicMaterial({ color: data.vertexColor || '#ff6b35' });
      extractVertices(geomType, data.size).forEach(function(v) {
        var dot = new THREE.Mesh(sphereGeom, sphereMat);
        dot.position.set(v[0], v[1], v[2]);
        root.add(dot);
      });
    }

    // ---- 6) 标签（CSS2DObject） ----
    if (Array.isArray(data.labels) && labelRenderer) {
      data.labels.forEach(function(lbl) {
        var text = (lbl && lbl[0]) || '';
        var pos = (lbl && lbl[1]) || [0, 0, 0];
        if (!text) return;
        var div = document.createElement('div');
        div.className = 'geom-3d-label';
        div.textContent = text;
        div.style.color = (lbl && lbl[2]) || '#1a1a1a';
        div.style.fontSize = ((lbl && lbl[3]) || 14) + 'px';
        var labelObj = new CSS2D.CSS2DObject(div);
        labelObj.position.set(pos[0], pos[1], pos[2]);
        root.add(labelObj);
      });
    }

    // ---- 7) 控制器（OrbitControls） ----
    var controls = null;
    if (window.__cwOrbitControls) {
      controls = new window.__cwOrbitControls(camera, renderer.domElement);
      controls.target.set(camTarget[0], camTarget[1], camTarget[2]);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.update();
    }

    // ---- 7.5) 双击复位 ----
    // 几何体根容器包围盒中心（用于"双击几何体 = 以它为中心重置"）
    var initialCamPos = [camPos[0], camPos[1], camPos[2]];
    var initialTarget = [camTarget[0], camTarget[1], camTarget[2]];

    function resetCamera(target) {
      camera.position.set(target[0], target[1], target[2]);
      camera.lookAt(initialTarget[0], initialTarget[1], initialTarget[2]);
      if (controls) {
        controls.target.set(initialTarget[0], initialTarget[1], initialTarget[2]);
        controls.update();
      }
    }

    function resetToInitial() {
      // 全局复位：相机回到 schema 里的 camera.position
      resetCamera(initialCamPos);
    }

    function resetToGeometryCenter() {
      // 局部复位：相机沿当前视角方向靠近，target 移到几何体包围盒中心
      var box = new THREE.Box3().setFromObject(root);
      var center = new THREE.Vector3();
      var size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      if (size.lengthSq() === 0) return;
      // 沿当前视线方向后退 1.5 × 几何体包围球半径
      var dir = new THREE.Vector3().subVectors(camera.position, controls ? controls.target : initialTarget).normalize();
      var radius = size.length() / 2;
      var newPos = center.clone().add(dir.multiplyScalar(radius * 1.5));
      // 平滑过渡：先变 target，再变 position
      if (controls) controls.target.copy(center);
      else camera.lookAt(center);
      camera.position.copy(newPos);
      if (controls) controls.update();
    }

    // 双击事件：点在几何体上 = 局部复位，空白区 = 全局复位
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('dblclick', function(ev) {
      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      var hits = raycaster.intersectObject(root, true);
      if (hits.length > 0) {
        resetToGeometryCenter();
      } else {
        resetToInitial();
      }
    });

    // ---- 8) 自适应 resize ----
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() {
        var w = stage.clientWidth || 600;
        var h = stage.clientHeight || 360;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (labelRenderer) labelRenderer.setSize(w, h);
      });
      ro.observe(stage);
    }

    // ---- 9) 渲染循环 ----
    function animate() {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
      if (labelRenderer) labelRenderer.render(scene, camera);
    }
    animate();
  }

  function resolveGeometryParamsClient(geomType, size) {
    var s = Array.isArray(size) && size.length > 0 ? size : null;
    switch (geomType) {
      case 'box': return [s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1];
      case 'sphere': return [s ? s[0] : 1, 32, 32];
      case 'cylinder':
      case 'cone': return [s ? s[0] : 1, s ? s[1] : 2, 32];
      case 'tetrahedron':
      case 'octahedron': return [s ? s[0] : 1];
      case 'prism':
      case 'pyramid': return [s ? s[0] : 1, s ? s[1] : 2];
      default: return [1, 1, 1];
    }
  }

  function extractVertices(geomType, size) {
    var s = Array.isArray(size) && size.length > 0 ? size : [1, 1, 1];
    if (geomType === 'box') {
      var sx = s[0] / 2, sy = s[1] / 2, sz = s[2] / 2;
      return [
        [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
        [-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz],
      ];
    }
    if (geomType === 'sphere') {
      var r = s[0];
      return [[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]];
    }
    if (geomType === 'cylinder') {
      var rr = s[0], hh = s[1] / 2;
      return [[0,-hh,0],[0,hh,0],[rr,-hh,0],[rr,hh,0]];
    }
    if (geomType === 'cone') {
      var rrc = s[0], hhc = s[1];
      return [[0,0,0],[0,hhc,0],[rrc,0,0]];
    }
    return [];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
`;

module.exports = { render, clientJs };
