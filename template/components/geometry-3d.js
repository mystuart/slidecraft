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
 * 顶点 / 派生顶点（v0.3）：
 *   - labels 中声明的 label 文本（如 "P"）即「命名顶点」——slider 拖动时通过
 *     setLabelPos(name, [x,y,z]) 改其位置，CSS2D 文字同步移动，引用此 label 的
 *     半透面（planes）法线 / 中心自动重算。
 *   - derivedVertices: [{label, formula}] —— 声明派生顶点。formula 取值：
 *       "midpoint(a, b)"       取两点中点
 *       "centroid(a, b, c)"    取三点重心
 *       "linear(a, b, t)"      沿 a→b 线性插值，t ∈ [0,1]（t 通过 slider 的 drives[].param 控制）
 *     任意命名顶点变化（手动 setLabelPos 或其他 derived 重算）都会触发整组 derived 重算，
 *     公式顺序按声明顺序排在前面的先算，引用后算的 label 视为依赖。
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
  // id 字段：让外部（math-step / slider 等）能找到具体实例
  // 未指定时自动生成，避免多实例时 window 键冲突
  const id = data.id || ('geom3d-' + Math.random().toString(36).slice(2, 10));
  const dataJson = JSON.stringify(data || {});

  return `<div class="geom-3d" id="${escapeHtml(id)}" data-geom='${escapeHtml(dataJson)}'>
  ${titleHtml}
  <div class="geom-3d-stage"></div>
  ${captionHtml}
</div>`;
}

const clientJs = `
(function() {
  if (window.__cwGeom3DLoaded) return;
  window.__cwGeom3DLoaded = true;
  if (!window.__cwGeom3D) window.__cwGeom3D = {};

  // 多面体通用构造器（v0.2 起 client 用，服务端 buildPolyhedronFromVerts 也在用同名函数）
  // 顶点列表 verts: [[x,y,z], ...] + 三角面/多边形面索引 faces: [[i,j,k], [i,j,k,l]]
  // 多边形面自动 triangulate（fan）
  function buildPolyhedronFromVerts(verts, faces) {
    if (!Array.isArray(verts) || !Array.isArray(faces)) return null;
    var positions = [];
    var indices = [];
    for (var fi = 0; fi < faces.length; fi++) {
      var face = faces[fi];
      if (!Array.isArray(face) || face.length < 3) continue;
      var startIdx = positions.length / 3;
      for (var vi = 0; vi < face.length; vi++) {
        var v = verts[face[vi]];
        if (!v) continue;
        positions.push(v[0], v[1], v[2]);
      }
      // fan triangulate
      for (var ti = 1; ti < face.length - 1; ti++) {
        indices.push(startIdx, startIdx + ti, startIdx + ti + 1);
      }
    }
    var geom = new window.__cwThree.BufferGeometry();
    geom.setAttribute('position', new window.__cwThree.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

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
      case 'triangular-prism':
        // v0.2：等边三角形底面 + 矩形侧面
        // params = [baseSize, height] （data.size 也支持 [base, height] 写法）
        // 6 顶点：A/B/C（底面），A'B'C'（顶面）
        // 顶点排布：底面 z=0 平面，顶面 z=height 平面，y 轴上下
        // v0.3：支持 data.vertices 显式顶点表（6 个 3D 坐标），用于直角三角形底面等非等边场景
        (function () {
          var verts, faces;
          if (data.vertices && Array.isArray(data.vertices) && data.vertices.length >= 6) {
            // 显式顶点表模式：顺序 [A, B, C, A', B', C']
            verts = data.vertices.slice(0, 6);
            faces = [
              [0, 1, 2],     // 底面 ABC
              [3, 5, 4],     // 顶面 A'B'C'（法线反向）
              [0, 3, 4, 1],  // 侧面 ABB'A'
              [1, 4, 5, 2],  // 侧面 BCC'B'
              [2, 5, 3, 0],  // 侧面 CAA'C'
            ];
          } else {
            var base = params[0];
            var h = params[1];
            var r = (base * Math.sqrt(3)) / 3;
            verts = [
              [-base / 2, -r / 2, 0],
              [base / 2, -r / 2, 0],
              [0, r, 0],
              [-base / 2, -r / 2, h],
              [base / 2, -r / 2, h],
              [0, r, h],
            ];
            faces = [
              [0, 1, 2],
              [3, 5, 4],
              [0, 3, 4, 1],
              [1, 4, 5, 2],
              [2, 5, 3, 0],
            ];
          }
          geometry = buildPolyhedronFromVerts(verts, faces);
        })();
        break;
      case 'pyramid':
      case 'triangular-pyramid':
        // v0.2：底面等边三角形 + 顶点在上方
        // params = [baseSize, height]
        (function () {
          var base = params[0];
          var h = params[1];
          var r = (base * Math.sqrt(3)) / 3;
          var vA = [-base / 2, -r / 2, 0];
          var vB = [base / 2, -r / 2, 0];
          var vC = [0, r, 0];
          var vTop = [0, 0, h];
          var faces = [
            [0, 2, 1],     // 底面 ABC（法线反向）
            [0, 1, 3],     // 侧面 ABB'
            [1, 2, 3],     // 侧面 BCC'
            [2, 0, 3],     // 侧面 CAA'
          ];
          geometry = buildPolyhedronFromVerts(
            [vA, vB, vC, vTop],
            faces
          );
        })();
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
      extractVertices(geomType, data.size, data.vertices).forEach(function(v) {
        var dot = new THREE.Mesh(sphereGeom, sphereMat);
        dot.position.set(v[0], v[1], v[2]);
        root.add(dot);
      });
    }

    // ---- 6) 标签（CSS2DObject） + 命名顶点表（highlight 查坐标用） ----
    // labelNameToPos: 文本名 → THREE.Vector3 世界坐标（用于 setHighlight 查"虚拟边"端点）
    var labelNameToPos = {};
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
        // 记录命名坐标，setHighlight 查虚拟边端点时用
        labelNameToPos[text] = new THREE.Vector3(pos[0], pos[1], pos[2]);
      });
    }

    // ---- 6.5) 半透明平面（t5 顺手做）----
    // planes: [{ id, vertices: ["A","B","C"], opacity }]
    // - 用 3 个命名顶点（labelNameToPos 查坐标）算 Plane 法线 + 原点
    // - 单独放在 layer 1，hover raycaster 限定 layer 0（双击复位时不会被半透面阻挡）
    // - 当任一 vertices 中的 label 位置变化时，调用 repositionPlane 重新计算中心 + 法线
    var planeObjects = {}; // id → Mesh
    var planeMeta = {};    // id → { vertices: [...], color, opacity }（重定位时查）
    if (Array.isArray(data.planes) && data.planes.length > 0) {
      data.planes.forEach(function(pl) {
        if (!pl || !pl.id || !Array.isArray(pl.vertices) || pl.vertices.length < 3) return;
        var positions = pl.vertices.map(function(n) { return labelNameToPos[n]; }).filter(Boolean);
        if (positions.length < 3) return;
        var p0 = positions[0], p1 = positions[1], p2 = positions[2];
        var v1 = new THREE.Vector3().subVectors(p1, p0);
        var v2 = new THREE.Vector3().subVectors(p2, p0);
        var normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
        // 让 plane 覆盖所有顶点：临时取最大跨度做 plane 常量
        var center = new THREE.Vector3().add(p0).add(p1).add(p2).multiplyScalar(1 / 3);
        // 用一个足够大的尺寸（容器最大跨度 2 倍）做 plane
        var sceneSpan = 5;
        var planeGeom = new THREE.PlaneGeometry(sceneSpan, sceneSpan);
        var planeMat = new THREE.MeshBasicMaterial({
          color: pl.color || '#ffd166',
          transparent: true,
          opacity: typeof pl.opacity === 'number' ? pl.opacity : 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        var planeMesh = new THREE.Mesh(planeGeom, planeMat);
        planeMesh.position.copy(center);
        // Plane 朝向：把 plane 的 +Z 旋转到 normal 方向
        var quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        planeMesh.quaternion.copy(quat);
        planeMesh.layers.set(1); // 单独 layer，hover 不可达
        planeMesh.renderOrder = 2; // 在实体几何体之后渲染
        root.add(planeMesh);
        planeObjects[pl.id] = planeMesh;
        planeMeta[pl.id] = {
          vertices: pl.vertices.slice(),
          color: pl.color || '#ffd166',
          opacity: typeof pl.opacity === 'number' ? pl.opacity : 0.4,
        };
      });
    }

    // 重算单个 plane 的中心 + 法线（基于最新的 labelNameToPos）
    function repositionPlane(planeId) {
      var m = planeObjects[planeId];
      var meta = planeMeta[planeId];
      if (!m || !meta) return;
      var positions = meta.vertices.map(function(n) { return labelNameToPos[n]; }).filter(Boolean);
      if (positions.length < 3) return;
      var p0 = positions[0], p1 = positions[1], p2 = positions[2];
      var v1 = new THREE.Vector3().subVectors(p1, p0);
      var v2 = new THREE.Vector3().subVectors(p2, p0);
      var normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
      var center = new THREE.Vector3().add(p0).add(p1).add(p2).multiplyScalar(1 / 3);
      m.position.copy(center);
      var quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      m.quaternion.copy(quat);
    }

    // 找出所有引用了某个 label 的 plane id，返回 id 列表
    function planesUsingLabel(labelName) {
      var ids = [];
      Object.keys(planeMeta).forEach(function(pid) {
        if (planeMeta[pid].vertices.indexOf(labelName) >= 0) ids.push(pid);
      });
      return ids;
    }

    // ---- 6.55) 派生顶点（v0.3）----
    // derivedVertices: [{ label, formula }]
    //   - formula 形如 "midpoint(P, C)" / "centroid(A, B, C)" / "linear(A1, C1, 0.5)"
    //   - "linear" 公式当前只支持常数 t（v0.3 不支持滑块值注入；t 通过 schema 显式给定）
    //   - 注意：slider 联动顶点（如 P）走 drives 字段，不通过 derivedVertices。
    //     derivedVertices 只用于"由其它命名顶点算出的新顶点"（D = mid(P, C)）。
    //   - 重算顺序：按 schema 声明顺序排，依赖前一个就把它写在前面。
    function parseFormula(formula) {
      var f = String(formula || '').trim();
      var m = f.match(/^(\w+)\s*\(([^)]*)\)\s*$/);
      if (!m) return null;
      var fn = m[1];
      var args = m[2].split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      return { fn: fn, args: args };
    }

    function applyDerivedFormula(parsed) {
      if (!parsed) return null;
      var args = parsed.args.map(function(a) {
        // 数字字面 → 直接返回
        var n = parseFloat(a);
        if (!isNaN(n) && isFinite(n) && /^-?\d+(\.\d+)?$/.test(a)) return n;
        // 否则视为 label 名
        var v = labelNameToPos[a];
        return v ? [v.x, v.y, v.z] : null;
      });
      if (args.some(function(x) { return x === null; })) return null;
      // 必须全是坐标（三元组）才能用 midpoint/centroid；linear 允许 t 为数字
      if (parsed.fn === 'midpoint' && args.length === 2) {
        var a = args[0], b = args[1];
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      }
      if (parsed.fn === 'centroid' && args.length === 3) {
        var p = args[0], q = args[1], r = args[2];
        return [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3, (p[2] + q[2] + r[2]) / 3];
      }
      if (parsed.fn === 'linear' && args.length === 3) {
        var u = args[0], v = args[1], t = args[2];
        if (typeof t !== 'number') return null;
        return [u[0] + t * (v[0] - u[0]), u[1] + t * (v[1] - u[1]), u[2] + t * (v[2] - u[2])];
      }
      return null;
    }

    // 派生顶点声明解析 + 初始计算
    var derivedList = []; // [{label, parsed}]
    if (Array.isArray(data.derivedVertices) && data.derivedVertices.length > 0) {
      data.derivedVertices.forEach(function(d) {
        if (!d || !d.label) return;
        var parsed = parseFormula(d.formula);
        if (!parsed) {
          console.warn('[geometry-3d] derivedVertices 公式无法解析:', d);
          return;
        }
        derivedList.push({ label: String(d.label), parsed: parsed });
      });
      // 初始重算一次
      derivedList.forEach(function(item) {
        var pos = applyDerivedFormula(item.parsed);
        if (pos) {
          labelNameToPos[item.label] = new THREE.Vector3(pos[0], pos[1], pos[2]);
          // 同步到已存在的 CSS2DObject（如果 labels 里也声明了这个 label，会被同步到正确位置）
          root.children.forEach(function(child) {
            if (child.isCSS2DObject && child.element && child.element.textContent === item.label) {
              child.position.set(pos[0], pos[1], pos[2]);
            }
          });
        }
      });
    }

    // 整组 derived 重算（按声明顺序）
    function recomputeDerived() {
      derivedList.forEach(function(item) {
        var pos = applyDerivedFormula(item.parsed);
        if (pos) {
          labelNameToPos[item.label] = new THREE.Vector3(pos[0], pos[1], pos[2]);
          root.children.forEach(function(child) {
            if (child.isCSS2DObject && child.element && child.element.textContent === item.label) {
              child.position.set(pos[0], pos[1], pos[2]);
            }
          });
        }
      });
    }

    // ---- 6.6) 高亮层（虚拟边 / 实体边） ----
    // highlight.edges: [["O","E"]] 表示查 labelNameToPos 取两端点画线
    // highlight.edges 也支持 [vid, vid] 用顶点索引（提取自 extractVertices）
    // 这些高亮物只是装饰，不入 raycaster（layer 1 + 关闭 picking）
    var HIGHLIGHT_LAYER = 1;
    var highlightGroup = new THREE.Group();
    highlightGroup.layers.set(HIGHLIGHT_LAYER);
    root.add(highlightGroup);

    var defaultVertexPositions = extractVertices(geomType, data.size, data.vertices);

    function drawHighlightEdges(edgePairs) {
      // 清理旧高亮
      while (highlightGroup.children.length > 0) {
        var c = highlightGroup.children.pop();
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      }
      if (!Array.isArray(edgePairs) || edgePairs.length === 0) return;
      // 顶点名 → 坐标的辅助函数：优先查 label 名，回退到顶点索引
      function resolvePoint(token) {
        if (typeof token === 'number') return defaultVertexPositions[token] ? defaultVertexPositions[token].slice() : null;
        if (typeof token !== 'string') return null;
        var v = labelNameToPos[token];
        if (v) return [v.x, v.y, v.z];
        // 也允许 "v:0" 这种显式索引写法
        var m = token.match(/^v:(\d+)$/);
        if (m) return defaultVertexPositions[parseInt(m[1], 10)] ? defaultVertexPositions[parseInt(m[1], 10)].slice() : null;
        return null;
      }
      var positions = [];
      edgePairs.forEach(function(pair) {
        if (!Array.isArray(pair) || pair.length < 2) return;
        var a = resolvePoint(pair[0]);
        var b = resolvePoint(pair[1]);
        if (!a || !b) return;
        positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      });
      if (positions.length === 0) return;
      var lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      var lineMat = new THREE.LineBasicMaterial({ color: '#ff3366', linewidth: 3 });
      var lineSeg = new THREE.LineSegments(lineGeom, lineMat);
      lineSeg.layers.set(HIGHLIGHT_LAYER);
      lineSeg.renderOrder = 3;
      highlightGroup.add(lineSeg);
    }

    // ---- 6.7) 高亮平面（引用 schema.planes 中已存在的 plane，把它们 set visible+highlight 风格） ----
    // highlight.planes: ["AB1C"] 表示把 planeObjects["AB1C"] 材质色调变一下
    function highlightPlanes(planeIds) {
      Object.keys(planeObjects).forEach(function(pid) {
        var m = planeObjects[pid];
        if (!m || !m.material) return;
        if (planeIds && planeIds.indexOf(pid) >= 0) {
          m.visible = true;
          m.material.opacity = 0.55;
          m.material.color.set('#ff7b54');
        } else {
          // 未在 highlight 列表中的半透面：保留但恢复默认样式
          var orig = (data.planes || []).find(function(p) { return p && p.id === pid; });
          m.material.opacity = orig && typeof orig.opacity === 'number' ? orig.opacity : 0.4;
          m.material.color.set(orig && orig.color ? orig.color : '#ffd166');
        }
      });
    }

    // ---- 6.8) 对外 API：setHighlight / resetHighlight / setLabelPos / getLabelPos ----
    // math-step / slider 调这里，不需要 DOM 查询
    var stageId = container.id;
    var api = {
      setHighlight: function(spec) {
        spec = spec || {};
        drawHighlightEdges(spec.edges || []);
        highlightPlanes(spec.planes || []);
      },
      resetHighlight: function() {
        drawHighlightEdges([]);
        highlightPlanes([]);
      },
      getLabelPos: function(name) {
        var v = labelNameToPos[name];
        return v ? [v.x, v.y, v.z] : null;
      },
      setLabelPos: function(name, pos) {
        // slider 拖动 P 时用：把命名顶点移到新位置。
        // 1) 更新 labelNameToPos
        // 2) 同步所有同名 CSS2D 文字标签位置
        // 3) 重新计算引用了此 label 的 plane（中心 + 法线）
        // 4) 触发整组 derivedVertices 重算
        // 5) 衍生 label 变化时也连带触发引用它的 plane 重新定位
        if (!Array.isArray(pos) || pos.length < 3) return;
        var newPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
        labelNameToPos[name] = newPos;
        // 同步 CSS2D 文字
        root.children.forEach(function(child) {
          if (child.isCSS2DObject && child.element && child.element.textContent === name) {
            child.position.copy(newPos);
          }
        });
        // 重新定位引用了此 label 的 plane
        var affectedPlaneIds = planesUsingLabel(name);
        affectedPlaneIds.forEach(function(pid) { repositionPlane(pid); });
        // 重算 derived vertices（按声明顺序，可能产生新位置 → 同样需要更新 CSS2D + 受影响的 plane）
        if (derivedList.length > 0) {
          recomputeDerived();
          // derived 的 label 变化也连带触发 plane 重新定位
          // （每个 derived label 都要查它出现在哪些 plane 里）
          derivedList.forEach(function(item) {
            var ids = planesUsingLabel(item.label);
            ids.forEach(function(pid) { repositionPlane(pid); });
          });
        }
      },
      root: root,
      scene: scene,
    };
    if (stageId) {
      window.__cwGeom3D[stageId] = api;
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
      // 限定 layer 0，半透面（layer 1）和高亮边不参与 picking
      raycaster.layers.set(0);
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
      case 'triangular-prism':
      case 'pyramid':
      case 'triangular-pyramid': return [s ? s[0] : 1, s ? s[1] : 2];
      default: return [1, 1, 1];
    }
  }

  function extractVertices(geomType, size, explicitVertices) {
    if (explicitVertices && Array.isArray(explicitVertices) && explicitVertices.length >= 6) {
      return explicitVertices.slice(0, 6);
    }
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
    if (geomType === 'triangular-prism') {
      // 与几何体构造（line 215-222）完全镜像：底面在 z=0 平面，顶面 z=h
      // 顺序：[A(底), B(底), C(底), A'(顶), B'(顶), C'(顶)]
      // base = s[0], h = s[1]
      var base = s[0];
      var h = s[1];
      var r = (base * Math.sqrt(3)) / 3;
      return [
        [-base/2, -r/2, 0], [base/2, -r/2, 0], [0, r, 0],
        [-base/2, -r/2, h], [base/2, -r/2, h], [0, r, h],
      ];
    }
    if (geomType === 'quadrilateral-prism') {
      // 正方形底面，底面在 z=0，顶面 z=h（与三角棱柱保持 z 方向一致）
      // 顺序：[A,B,C,D(底), A',B',C',D'(顶)]
      // base = s[0], h = s[1]
      var base = s[0];
      var h = s[1];
      var half = base / 2;
      return [
        [-half, -half, 0], [half, -half, 0], [half, half, 0], [-half, half, 0],
        [-half, -half, h], [half, -half, h], [half, half, h], [-half, half, h],
      ];
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
