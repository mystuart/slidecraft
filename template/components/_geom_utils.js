/**
 * @component _geom_utils
 * @version 0.2.0
 * @status 内部工具，不参与组件登记
 *
 * 几何 / 多项式共享工具函数：
 *   - 3D 四面体工具（tetra-equiv / cut-anim 用）：tetraVolume / buildTetraPositions / buildEdgePositions
 *   - 2D 多项式工具（function-plot / intersection-marker 用）：polyEval / polyDeriv / polyRealRoots
 *
 * 暴露两套 API：
 *   - 服务端（CommonJS）：require('./_geom_utils') → { tetraVolume, ..., polyEval, polyDeriv, polyRealRoots }
 *   - 客户端（嵌入 clientJs 字符串）：require('./_geom_utils').clientJs → 工具函数定义字符串（cwGeom_ 前缀）
 *
 * 客户端字符串直接拼到 clientJs 顶部，避免每个组件重复定义。
 * 函数名加 `cwGeom_` 前缀，避免和组件 clientJs 内的其他变量冲突。
 *
 * v0.2.0 变更：新增 polyEval / polyDeriv / polyRealRoots（2D 评审 C2-1 抽共享）。
 *   polyRealRoots 的 n==2 走精确二次公式 —— 修 C1-1（扫描+二分漏 Δ=0 相切重根，
 *   导致 demo 拖到相切点时「判别式说 1 个交点、画面显示 0 个」自相矛盾）。
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

// ============================================================
// 多项式工具（2D 组件 function-plot / intersection-marker 共用）
// 约定：coeffs **降序**（最高次在前），如 y = x² - 2x - 3 → [1, -2, -3]
// ============================================================

/**
 * 多项式求值（Horner 法），coeffs 降序
 */
function polyEval(coeffs, x) {
  var v = 0;
  for (var i = 0; i < coeffs.length; i++) v = v * x + coeffs[i];
  return v;
}

/**
 * 多项式求导系数：降序输入 → 降序输出
 *   [a_n, a_{n-1}, ..., a_0] → [n·a_n, (n-1)·a_{n-1}, ..., 1·a_1]
 */
function polyDeriv(coeffs) {
  var d = [];
  for (var i = 0; i < coeffs.length - 1; i++) d.push((coeffs.length - 1 - i) * coeffs[i]);
  return d;
}

/**
 * 求多项式所有实根（降序 coeffs）
 *  - n==1：一次方程直接解
 *  - n==2：精确二次公式（**关键**：扫描+二分会漏掉 Δ=0 的相切重根，
 *          导致 demo 拖到相切点时「判别式说 1 个交点、画面显示 0 个」）
 *  - n>=3：[-50,50] 扫描 + 二分，配合去重
 *  - **不改输入数组**（先 slice 再去前导零）
 */
function polyRealRoots(coeffs) {
  if (!Array.isArray(coeffs) || coeffs.length === 0) return [];
  var c = coeffs.slice();                      // 不改原数组（C3-1）
  while (c.length > 1 && c[0] === 0) c.shift(); // 去前导零
  var n = c.length - 1;
  if (n === 0) return [];
  if (n === 1) return [-c[1] / c[0]];
  if (n === 2) {
    var a = c[0], b = c[1], cc = c[2];
    var disc = b * b - 4 * a * cc;
    if (disc < -1e-9) return [];                       // 无实根
    if (Math.abs(disc) <= 1e-9) return [-b / (2 * a)]; // 重根（相切）
    var sq = Math.sqrt(disc);
    return [(-b - sq) / (2 * a), (-b + sq) / (2 * a)];
  }
  // n >= 3：扫描 + 二分
  var roots = [];
  var lo = -50, hi = 50, step = 0.01;
  var prevX = lo, prevY = polyEval(c, lo);
  for (var x = lo + step; x <= hi; x += step) {
    var y = polyEval(c, x);
    if (prevY === 0) pushDedup(roots, prevX);
    if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
      var ba = prevX, bb = x;
      for (var k = 0; k < 50; k++) {
        var m = (ba + bb) / 2;
        var ym = polyEval(c, m);
        if (Math.abs(ym) < 1e-9) { ba = bb = m; break; }
        if ((prevY < 0 && ym < 0) || (prevY > 0 && ym > 0)) ba = m;
        else bb = m;
      }
      pushDedup(roots, (ba + bb) / 2);
    }
    prevX = x; prevY = y;
  }
  if (prevY === 0) pushDedup(roots, prevX);
  return roots;
}

/** 根去重：与已有根距离 < 1e-3 视为同一个（二分边界 + prevY===0 可能重复 push） */
function pushDedup(arr, r) {
  for (var i = 0; i < arr.length; i++) {
    if (Math.abs(arr[i] - r) < 1e-3) return;
  }
  arr.push(r);
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
// ---- 多项式工具（2D 组件 function-plot / intersection-marker 共用） ----
// coeffs 降序（最高次在前）。与 _geom_utils 服务端 polyEval/polyDeriv/polyRealRoots 同逻辑。
function cwGeom_polyEval(coeffs, x) {
  var v = 0;
  for (var i = 0; i < coeffs.length; i++) v = v * x + coeffs[i];
  return v;
}
function cwGeom_polyDeriv(coeffs) {
  var d = [];
  for (var i = 0; i < coeffs.length - 1; i++) d.push((coeffs.length - 1 - i) * coeffs[i]);
  return d;
}
function cwGeom_polyRealRoots(coeffs) {
  if (!Array.isArray(coeffs) || coeffs.length === 0) return [];
  var c = coeffs.slice();                      // 不改原数组
  while (c.length > 1 && c[0] === 0) c.shift();
  var n = c.length - 1;
  if (n === 0) return [];
  if (n === 1) return [-c[1] / c[0]];
  if (n === 2) {
    // 二次方程精确解：扫描+二分会漏掉 Δ=0 的相切重根（C1-1）
    var a = c[0], b = c[1], cc = c[2];
    var disc = b * b - 4 * a * cc;
    if (disc < -1e-9) return [];
    if (Math.abs(disc) <= 1e-9) return [-b / (2 * a)];
    var sq = Math.sqrt(disc);
    return [(-b - sq) / (2 * a), (-b + sq) / (2 * a)];
  }
  var roots = [];
  var lo = -50, hi = 50, step = 0.01;
  var prevX = lo, prevY = cwGeom_polyEval(c, lo);
  for (var x = lo + step; x <= hi; x += step) {
    var y = cwGeom_polyEval(c, x);
    if (prevY === 0) cwGeom_pushRootDedup(roots, prevX);
    if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
      var ba = prevX, bb = x;
      for (var k = 0; k < 50; k++) {
        var m = (ba + bb) / 2;
        var ym = cwGeom_polyEval(c, m);
        if (Math.abs(ym) < 1e-9) { ba = bb = m; break; }
        if ((prevY < 0 && ym < 0) || (prevY > 0 && ym > 0)) ba = m;
        else bb = m;
      }
      cwGeom_pushRootDedup(roots, (ba + bb) / 2);
    }
    prevX = x; prevY = y;
  }
  if (prevY === 0) cwGeom_pushRootDedup(roots, prevX);
  return roots;
}
function cwGeom_pushRootDedup(arr, r) {
  for (var i = 0; i < arr.length; i++) {
    if (Math.abs(arr[i] - r) < 1e-3) return;
  }
  arr.push(r);
}
`;

module.exports = {
  // 服务端直接调用
  tetraVolume, buildTetraPositions, buildEdgePositions,
  polyEval, polyDeriv, polyRealRoots,
  // 客户端字符串（嵌入到 clientJs 顶部）
  clientJs,
};
