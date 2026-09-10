// CLI 易用性：阅读时间估算 + new 脚手架
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { estimateReadingTime } = require('../build.js');

test('阅读时间：纯中文按 400 字/分', () => {
  const md = '汉'.repeat(800);
  assert.strictEqual(estimateReadingTime(md), 2);
});

test('阅读时间：中英混合加权', () => {
  const md = '汉'.repeat(400) + ' ' + 'word '.repeat(200);
  assert.strictEqual(estimateReadingTime(md), 2);
});

test('阅读时间：代码块与 HTML 标签不计入', () => {
  const heavy = '汉'.repeat(50) + '\n```quiz\n{"question": "' + 'x'.repeat(2000) + '"}\n```\n';
  assert.strictEqual(estimateReadingTime(heavy), 1);
});

test('阅读时间：空文最少 1 分钟', () => {
  assert.strictEqual(estimateReadingTime(''), 1);
});

test('new 脚手架：生成 content/<name>.md 且可被 build 编译', () => {
  const { execFileSync } = require('node:child_process');
  const ROOT = path.join(__dirname, '..');
  const name = 'zz-scaffold-test-' + Date.now();
  const outPath = path.join(ROOT, 'content', name + '.md');
  try {
    execFileSync('node', ['build.js', 'new', name], { cwd: ROOT, encoding: 'utf8' });
    assert.ok(fs.existsSync(outPath), '脚手架文件应生成');
    const md = fs.readFileSync(outPath, 'utf8');
    assert.ok(md.startsWith('---\ntitle:'), '应含 frontmatter');
    assert.ok(md.includes('sections:'), '应含 sections');
    assert.ok(md.includes('```quiz'), '应含 quiz 示例');
    // 生成的脚手架必须能直接编译通过（开箱即用是脚手架的底线）
    execFileSync('node', ['build.js', 'content/' + name + '.md'], { cwd: ROOT, encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(ROOT, 'dist', name + '.html')), '编译产物应存在');
  } finally {
    fs.rmSync(outPath, { force: true });
    fs.rmSync(path.join(ROOT, 'dist', name + '.html'), { force: true });
  }
});

test('new 脚手架：拒绝非法名字与覆盖已有文件', () => {
  const { execFileSync } = require('node:child_process');
  const ROOT = path.join(__dirname, '..');
  const fails = (argv) => assert.throws(
    () => execFileSync('node', argv, { cwd: ROOT, encoding: 'utf8' }),
    /Command failed/
  );
  fails(['build.js', 'new', '../evil']);
  fails(['build.js', 'new', 'binary-card-trick']);
});
