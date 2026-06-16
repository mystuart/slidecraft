// chart 组件 niceMax 刻度算法测试
// niceMax 决定坐标轴刻度上限，边界值容易算错（如 87→100 vs 87→90）。
const test = require('node:test');
const assert = require('node:assert/strict');
const { niceMax } = require('../template/components/chart.js');

test('niceMax 整数对齐到 10 的幂', () => {
  assert.equal(niceMax(100), 100);
  assert.equal(niceMax(1000), 1000);
});

test('niceMax 向上取整到 1/2/5 序列', () => {
  assert.equal(niceMax(1), 1);
  assert.equal(niceMax(87), 100);      // 87/100=0.87 → norm≤1 → 1×100
  assert.equal(niceMax(150), 200);     // 150/100=1.5 → norm≤2 → 2×100
  assert.equal(niceMax(340), 500);     // 340/100=3.4 → norm≤5 → 5×100
  assert.equal(niceMax(780), 1000);    // 780/100=7.8 → norm>5 → 10×100
});

test('niceMax 小数', () => {
  assert.equal(niceMax(0.5), 0.5);     // mag=0.1, norm=5 → 5×0.1=0.5
  assert.equal(niceMax(0.03), 0.05);   // mag=0.01, norm=3 → 5×0.01=0.05
});

test('niceMax 非正数返回 1（兜底）', () => {
  assert.equal(niceMax(0), 1);
  assert.equal(niceMax(-5), 1);
});

test('niceMax 边界（恰等于序列点）', () => {
  assert.equal(niceMax(2), 2);
  assert.equal(niceMax(5), 5);
  assert.equal(niceMax(20), 20);
  assert.equal(niceMax(50), 50);
});
