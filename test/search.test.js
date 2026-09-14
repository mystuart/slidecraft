// 站内搜索：索引提取（build 侧）+ 客户端交互（jsdom 跑真实产物）
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const { extractSearchIndex } = require('../build.js');

const ROOT = path.join(__dirname, '..');

// ---- build 侧：索引提取 ----

test('索引按 h2 分段：标题剥标签、正文剥 math/标签/空白', () => {
  const html = '<div>导语段落。</div>'
    + '<h2 id="section-1">一、<b>热身</b></h2>'
    + '<p>正文 <math><annotation>a = 2 &gt; 0</annotation></math>之后文字。</p>'
    + '<h2 id="section-2">二、运算</h2><p>第二节内容。</p>';
  const items = extractSearchIndex(html);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].id, 'section-1');
  assert.strictEqual(items[0].t, '一、热身');
  assert.ok(items[0].x.includes('之后文字'), 'math 之外文字保留');
  assert.ok(!items[0].x.includes('annotation'), 'KaTeX annotation 不重复入库');
  assert.ok(items[0].x.startsWith('导语段落'), 'h2 前导语并入第一节');
  assert.ok(!/<[a-z]/.test(items[0].x), '不含标签');
});

test('嵌入 script 安全：索引 JSON 的 < 已转义（集成抽查）', () => {
  const html = fs.readFileSync(path.join(ROOT, 'dist/binary-card-trick.html'), 'utf8');
  const m = html.match(/window\.__SC_SEARCH=\{items:(\[[\s\S]*?\])\};/);
  assert.ok(m, '产物应内嵌搜索索引');
  assert.ok(!m[1].includes('<'), '索引 JSON 内不允许裸 <（防 </script 提前闭合）');
  const items = JSON.parse(m[1]);
  assert.ok(items.length >= 5, 'binary-card-trick 应有多节索引');
});

// ---- 读者侧：搜索框注入 + 过滤 + 跳转（jsdom）----

const HTML = fs.readFileSync(path.join(ROOT, 'dist/binary-card-trick.html'), 'utf8');

function boot() {
  return new JSDOM(HTML, { runScripts: 'dangerously', url: 'http://localhost/x.html', pretendToBeVisual: true });
}

before(function buildFixture() {
  if (!fs.existsSync(path.join(ROOT, 'dist/binary-card-trick.html'))) {
    execFileSync('node', ['build.js', 'content/binary-card-trick.md'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  }
});

test('搜索框注入侧栏顶部，输入触发过滤 + <mark> 高亮', () => {
  const dom = boot();
  const d = dom.window.document;
  const input = d.querySelector('.sc-search-input');
  assert.ok(input, '侧栏应有搜索框');
  assert.strictEqual(d.querySelector('.sc-search-panel').hidden, true, '初始面板收起');

  input.value = '二进制';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const panel = d.querySelector('.sc-search-panel');
  assert.strictEqual(panel.hidden, false, '有匹配时面板展开');
  const marks = panel.querySelectorAll('mark');
  assert.ok(marks.length > 0, '命中片段应高亮');
  assert.ok(panel.querySelectorAll('.sc-search-item').length <= 8, '结果上限 8 条');
});

test('无匹配显示空态；点击结果跳章节锚点', () => {
  const dom = boot();
  const d = dom.window.document;
  const input = d.querySelector('.sc-search-input');
  input.value = '绝不存在的词xyzq';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const panel = d.querySelector('.sc-search-panel');
  assert.ok(panel.textContent.includes('没有匹配'), '空态文案');

  input.value = '热身';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const item = d.querySelector('.sc-search-item');
  assert.ok(item.getAttribute('href').startsWith('#section-'), '结果应指向章节锚点');
});

test('skip-link 存在且指向主内容；aria-current 已挂到激活项', () => {
  const dom = boot();
  const d = dom.window.document;
  const skip = d.querySelector('.skip-link');
  assert.ok(skip, '应有跳转正文链接');
  assert.strictEqual(skip.getAttribute('href'), '#main-content');
  assert.ok(d.getElementById('main-content'), '主内容锚点存在');
  // jsdom 无 IntersectionObserver → scroll-spy 回退 activate(0) → aria-current 应在第一项
  const current = d.querySelector('.side-nav a[aria-current="true"]');
  assert.ok(current, '应有一项带 aria-current');
});
