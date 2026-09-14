// sections 自动推导（v1.9.0）：frontmatter 缺省 → 按正文 h2 生成侧栏；显式提供 → 严格校验保留
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const TMP_FILES = [];

function writeTmp(content) {
  const name = 'zz-derive-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const p = path.join(ROOT, 'content', name + '.md');
  fs.writeFileSync(p, content);
  TMP_FILES.push({ md: p, html: path.join(ROOT, 'dist', name + '.html') });
  return p;
}

test('无 sections → 侧栏自动按 h2 生成，build 通过', () => {
  writeTmp([
    '---',
    'title: 推导测试',
    '---',
    '',
    '导语。',
    '',
    '## 一、开篇',
    '',
    '内容 A。',
    '',
    '## 二、深入',
    '',
    '内容 B。',
    '',
  ].join('\n'));
  const mdPath = TMP_FILES[TMP_FILES.length - 1].md;
  execFileSync('node', ['build.js', mdPath], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  const html = fs.readFileSync(TMP_FILES[TMP_FILES.length - 1].html, 'utf8');
  assert.ok(html.includes('href="#section-1"'), '侧栏应有第一节锚点');
  assert.ok(html.includes('>一、开篇<'), '侧栏文字来自 h2');
  assert.ok(html.includes('>二、深入<'), '第二节也在');
});

test('显式 sections 数量与 h2 不符 → exit 1（严格校验保留）', () => {
  writeTmp([
    '---',
    'title: 校验测试',
    'sections:',
    '  - 只有这一条',
    '---',
    '',
    '## 一',
    '',
    '## 二',
    '',
  ].join('\n'));
  assert.throws(
    () => execFileSync('node', ['build.js', TMP_FILES[TMP_FILES.length - 1].md], { cwd: ROOT, encoding: 'utf8' }),
    /Command failed/
  );
});

test('单个坏文件不阻塞其余编译（错误隔离 + 汇总 exit 1）', () => {
  const bad = writeTmp('---\ntitle: 坏文件\n---\n\n```quiz\n{"id":"q1" 不是合法 JSON\n```\n');
  const good = writeTmp('---\ntitle: 好文件\n---\n\n## 一、节\n\n内容。\n');
  assert.throws(
    () => execFileSync('node', ['build.js', bad, good], { cwd: ROOT, encoding: 'utf8' }),
    /Command failed/,
    '整体 exit code 应为 1'
  );
  assert.ok(fs.existsSync(TMP_FILES[TMP_FILES.length - 1].html), '好文件应已编译出产物');
});

test.after(() => {
  for (const f of TMP_FILES) {
    fs.rmSync(f.md, { force: true });
    fs.rmSync(f.html, { force: true });
  }
});
