/**
 * @component _geom_utils
 * @version 0.1.0
 * @status 内部工具，不参与组件登记
 *
 * 3D 几何体共享工具函数（tetra-equiv / cut-anim 等需要画四面体的组件共用）。
 *
 * 暴露两套 API：
 *   - 服务端（CommonJS）：require('./_geom_utils') → { tetraVolume, buildTetraPositions, buildEdgePositions }
 *   - 客户端（嵌入 clientJs 字符串）：require('./_geom_utils').clientJs → 工具函数定义字符串
 *
 * 客户端字符串直接拼到 clientJs 顶部，避免每个组件重复定义。
 * 函数名加 `cwGeom_` 前缀，避免和组件 clientJs 内的其他变量冲突。
 *
 * v0.1.0 起源：tetra-equiv.js 和 cut-anim.js 各自重复了 tetraVolume + 三角形/边构建，
 * 抽到这里消除重复（GLM-5.1 评审指出）。
 */

// ---- 服务端函数（直接调用） ----

// 六面体体积公式：V = |(b-a) · ((c-a) × (d-a))| / 6
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

/**
 * 4 个顶点 → 三角面 positions 数组
 * 顶点顺序 [v0, v1, v2, v3]，v0v1v2 是底面，v3 是锥顶
 * 4 个三角面（底 + 3 侧面），每面 3 顶点 = 12 顶点 = 36 浮点数
 * 返回 null 表示输入不合法
 */
function buildTetraPositions(verts) {
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

/**
 * 4 个顶点 → 6 条边 LineSegments positions 数组
 * 3 条底边（v0v1, v1v2, v2v0）+ 3 条侧棱（v0v3, v1v3, v2v3）= 6 条边 = 12 顶点 = 36 浮点数
 * 返回 null 表示输入不合法
 */
function buildEdgePositions(verts) {
  if (!Array.isArray(verts) || verts.length !== 4) return null;
  var v0 = verts[0], v1 = verts[1], v2 = verts[2], v3 = verts[3];
  if (!v0 || !v1 || !v2 || !v3) return null;
  var positions = [];
  function pushLine(a, b) {
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  pushLine(v0, v1); pushLine(v1, v2); pushLine(v2, v0);
  pushLine(v0, v3); pushLine(v1, v3); pushLine(v2, v3);
  return positions;
}

// ---- 客户端字符串（嵌入 clientJs 时反斜杠注意）：
// 工具函数定义（无反斜杠正则/字符串，可以原样嵌入）
// 给变量加 `cwGeom_` 前缀避免和组件 clientJs 内的其他变量冲突
const clientJs = `
function cwGeom_tetraVolume(a, b, c, d) {
  if (!a || !b || !c || !d) return 0;
  var bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  var cax = c[0] - a[0], cay = c[1] - a[1], caz = c[2] - a[2];
  var dax = d[0] - a[0], day = d[1] - a[1], daz = d[2] - a[2];
  var cx = cay * daz - caz * day;
  var cy = caz * dax - cax * daz;
  var cz = cax * day - cay * dax;
  var dot = bax * cx + bay * cy + baz * cz;
  return Math.abs(dot) / 6;
}
function cwGeom_buildTetraPositions(verts) {
  if (!Array.isArray(verts) || verts.length !== 4) return null;
  var v0 = verts[0], v1 = verts[1], v2 = verts[2], v3 = verts[3];
  if (!v0 || !v1 || !v2 || !v3) return null;
  var positions = [];
  function pushTri(a, b, c) {
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  }
  pushTri(v0, v1, v2);
  pushTri(v0, v1, v3);
  pushTri(v1, v2, v3);
  pushTri(v2, v0, v3);
  return positions;
}
function cwGeom_buildEdgePositions(verts) {
  if (!Array.isArray(verts) || verts.length !== 4) return null;
  var v0 = verts[0], v1 = verts[1], v2 = verts[2], v3 = verts[3];
  if (!v0 || !v1 || !v2 || !v3) return null;
  var positions = [];
  function pushLine(a, b) {
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  pushLine(v0, v1); pushLine(v1, v2); pushLine(v2, v0);
  pushLine(v0, v3); pushLine(v1, v3); pushLine(v2, v3);
  return positions;
}
function cwGeom_fmtVol(v) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v) >= 100) return v.toFixed(2);
  if (Math.abs(v) >= 1) return v.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
  return v.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
}
`;

module.exports = {
  // 服务端直接调用
  tetraVolume, buildTetraPositions, buildEdgePositions,
  // 客户端字符串（嵌入到 clientJs 顶部）
  clientJs,
};
