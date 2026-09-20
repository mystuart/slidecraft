// 产物冒烟测试（v1.10.0 质量守门机制）
// jsdom 逐个加载 dist/*.html 并执行全部内联脚本，断言零「未捕获异常」。
// 抓的是集成测试覆盖不到的页面级初始化问题（脚本顺序、运行时依赖、跨组件干扰）。
// 已知可控降级不算失败：geometry-3d 在无 WebGL 环境会走 try/catch 降级提示（不会未捕获）。
// 夹具缺失时自动全量 build（与 progress.test.js 同策略，新 clone 直接 npm test 可跑）。
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

before(function buildFixture() {
  const files = fs.existsSync(DIST) ? fs.readdirSync(DIST).filter(f => f.endsWith('.html')) : [];
  if (files.length === 0) {
    execFileSync('node', ['build.js'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  }
});

test('dist 全部产物加载零未捕获异常', () => {
  const files = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  assert.ok(files.length > 0, 'dist 里应有产物');

  const failures = [];
  for (const file of files) {
    // 并发测试进程可能刚清理了临时产物（sections-derive 等），消失的文件跳过
    let html;
    try {
      html = fs.readFileSync(path.join(DIST, file), 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => {
      // jsdom 把未捕获脚本错误和「Not implemented」都报成 jsdomError：
      // 后者是 jsdom 能力限制（不是产物 bug），白名单放行
      const msg = String(e && e.message || e);
      if (/^Not implemented/.test(msg)) return;
      errors.push(msg.split('\n')[0]);
    });
    vc.on('error', (msg) => {
      // 代码里显式 console.error 的只有可控降级（geometry-3d WebGL），白名单放行
      const s = String(msg);
      if (s.includes('[geometry-3d] init failed')) return;
      errors.push('console.error: ' + s.split('\n')[0]);
    });

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost/' + file,
      pretendToBeVisual: true,
      virtualConsole: vc,
    });
    // 强制 GC 不了，让句柄可回收即可；脚本同步执行完即视为加载完成
    dom.window.close();

    if (errors.length > 0) {
      failures.push({ file, errors });
    }
  }

  if (failures.length > 0) {
    for (const f of failures) {
      console.error('✗ ' + f.file);
      f.errors.forEach(e => console.error('    - ' + e));
    }
    assert.fail(`${failures.length} 个产物加载时出现未捕获异常（详见上方清单）`);
  }
});
