// 数值算法测试 —— _geom_utils.js 的多项式工具
// 这些函数有数值正确性坑（重根、高次稳定性），是回归高发区。
// 运行：node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const { polyRealRoots, polyEval, polyDeriv } = require('../template/components/_geom_utils.js');

// ============================================================
// polyEval（Horner 求值，降序 coeffs）
// ============================================================
test('polyEval 基本求值', () => {
  // y = 2x² + 3x + 1, x=2 → 8+6+1=15
  assert.equal(polyEval([2, 3, 1], 2), 15);
  // y = x - 5, x=5 → 0
  assert.equal(polyEval([1, -5], 5), 0);
});

test('polyEval 空系数 / 单项', () => {
  assert.equal(polyEval([], 100), 0);      // 空数组 = 零多项式
  assert.equal(polyEval([7], 999), 7);       // 常数多项式
});

test('polyEval 高阶稳定', () => {
  // y = x⁴, x=3 → 81
  assert.equal(polyEval([1, 0, 0, 0, 0], 3), 81);
});

// ============================================================
// polyDeriv（求导系数）
// ============================================================
test('polyDeriv 基本求导', () => {
  // y = 3x² + 2x + 1 → y' = 6x + 2
  assert.deepEqual(polyDeriv([3, 2, 1]), [6, 2]);
  // y = x³ → y' = 3x²
  assert.deepEqual(polyDeriv([1, 0, 0, 0]), [3, 0, 0]);
});

test('polyDeriv 常数/线性', () => {
  assert.deepEqual(polyDeriv([5]), []);      // 常数导数为空（零次多项式）
  assert.deepEqual(polyDeriv([2, 7]), [2]);  // 线性导数为常数
});

// ============================================================
// polyRealRoots（实根，C1-1 重根修复的核心）
// ============================================================
test('polyRealRoots 两实根', () => {
  // x² - 2x - 3 = (x-3)(x+1) → 根 3, -1
  const roots = polyRealRoots([1, -2, -3]).sort((a, b) => a - b);
  assert.deepEqual(roots, [-1, 3]);
});

test('polyRealRoots 无实根', () => {
  // x² + 1 = 0 无实根
  assert.deepEqual(polyRealRoots([1, 0, 1]), []);
});

test('polyRealRoots 重根（C1-1 关键修复点）', () => {
  // (x+1)² = x² + 2x + 1，Δ=0，重根 -1
  // 旧扫描+二分实现会漏掉（返回 []），二次公式修复后应返回 [-1]
  const roots = polyRealRoots([1, 2, 1]);
  assert.equal(roots.length, 1, '重根应返回 1 个（去重后）');
  assert.ok(Math.abs(roots[0] - (-1)) < 1e-9, '根应为 -1');
});

test('polyRealRoots 相切重根精度', () => {
  // (x-0.5)² = x² - x + 0.25，重根 0.5
  const roots = polyRealRoots([1, -1, 0.25]);
  assert.equal(roots.length, 1);
  assert.ok(Math.abs(roots[0] - 0.5) < 1e-9);
});

test('polyRealRoots 不修改输入数组', () => {
  // C3-1 修复：去前导零不应改原数组（footgun）
  const input = [0, 0, 1, -2, -3];
  const snapshot = input.slice();
  polyRealRoots(input);
  assert.deepEqual(input, snapshot, 'polyRealRoots 不应修改输入 coeffs');
});

test('polyRealRoots 去前导零', () => {
  // 0·x³ + 0·x² + x² - 3 = x² - 3 → 根 ±√3
  const roots = polyRealRoots([0, 0, 1, 0, -3]).sort((a, b) => a - b);
  assert.ok(roots.length >= 2);
  assert.ok(Math.abs(roots[0] - (-Math.sqrt(3))) < 1e-6);
  assert.ok(Math.abs(roots[1] - Math.sqrt(3)) < 1e-6);
});

test('polyRealRoots 三次（扫描+二分路径）', () => {
  // x³ - 6x² + 11x - 6 = (x-1)(x-2)(x-3) → 根 1, 2, 3
  const roots = polyRealRoots([1, -6, 11, -6]).sort((a, b) => a - b);
  assert.ok(roots.length >= 3);
  roots.slice(0, 3).forEach((r, i) => {
    assert.ok(Math.abs(r - (i + 1)) < 1e-6, `根应接近 ${i + 1}`);
  });
});
