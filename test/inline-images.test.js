// inlineImages：相对路径图片 → data URI（单文件分发承诺）
// 覆盖：png/svg 内联、外链跳过、缺失报错、& 转义还原
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { inlineImages, assetErrors } = require('../build.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-img-'));
// 1×1 透明 PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

beforeEach(() => {
  assetErrors.length = 0;
});

test('png 相对路径内联为 base64 data URI', () => {
  fs.writeFileSync(path.join(TMP, 'dot.png'), TINY_PNG);
  const out = inlineImages('<img src="dot.png" alt="d">', TMP, 't.md');
  assert.ok(out.startsWith('<img src="data:image/png;base64,iVBORw0KGgo'));
  assert.ok(!out.includes('"dot.png"'));
  assert.strictEqual(assetErrors.length, 0);
});

test('svg 内联为 utf8 data URI（比 base64 省）', () => {
  fs.writeFileSync(path.join(TMP, 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const out = inlineImages('<img src="mark.svg">', TMP, 't.md');
  assert.ok(out.includes('src="data:image/svg+xml,%3Csvg'));
  assert.strictEqual(assetErrors.length, 0);
});

test('http(s)/data:/锚点 src 不动', () => {
  const html = '<img src="https://a.b/c.png"><img src="data:image/png;base64,xx"><img src="#frag">';
  const out = inlineImages(html, TMP, 't.md');
  assert.strictEqual(out, html);
  assert.strictEqual(assetErrors.length, 0);
});

test('缺失文件：src 原样保留 + 记入 assetErrors（build 末尾 exit 1）', () => {
  const out = inlineImages('<img src="nope.png">', TMP, 't.md');
  assert.strictEqual(out, '<img src="nope.png">');
  assert.strictEqual(assetErrors.length, 1);
  assert.ok(assetErrors[0].msg.includes('图片不存在'));
  assert.strictEqual(assetErrors[0].file, 't.md');
});

test('不支持的后缀：报错且不内联', () => {
  fs.writeFileSync(path.join(TMP, 'pic.tiff'), 'x');
  const out = inlineImages('<img src="pic.tiff">', TMP, 't.md');
  assert.ok(out.includes('"pic.tiff"'));
  assert.strictEqual(assetErrors.length, 1);
  assert.ok(assetErrors[0].msg.includes('不支持的图片格式'));
});

test('src 中的 &amp; 还原为 & 再解析路径', () => {
  fs.writeFileSync(path.join(TMP, 'a&b.png'), TINY_PNG);
  const out = inlineImages('<img src="a&amp;b.png">', TMP, 't.md');
  assert.ok(out.startsWith('<img src="data:image/png;base64,'));
});

// 清理临时目录（进程退出时）
process.on('exit', () => fs.rmSync(TMP, { recursive: true, force: true }));
