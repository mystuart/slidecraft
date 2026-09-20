#!/usr/bin/env node
/**
 * visual.mjs — 视觉基线工具（v1.10.0 质量守门机制）
 *
 * 把「每轮手工拍截图」机制化：用 headless Chrome 拍 6 个 canonical 场景
 * （桌面 / 移动 / 暗色 / 抽屉展开 / 搜索展开），与基线逐像素比对。
 *
 * 用法：
 *   npm run visual              拍当前截图并与基线比对（有差异 → exit 1 + 输出 diff 图）
 *   npm run visual:baseline     把当前截图固化为新基线（改样式后有意刷新时用）
 *
 * 基线与 diff 存 test/__screenshots__/（gitignore，本地工具不入库——
 * 跨机器抗渲染差异太脆，不适合 CI 自动 fail；发布前手动跑一次是发布检查单的一项）。
 * Chrome 路径：环境变量 CHROME_BIN，缺省 macOS 标准路径。
 */
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SHOT_DIR = path.join(ROOT, 'test', '__screenshots__');
const CURRENT = path.join(SHOT_DIR, 'current');
const BASELINE = path.join(SHOT_DIR, 'baseline');
const PORT = 8719;
const IS_BASELINE = process.argv.includes('--baseline');

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 场景清单：name / page / viewport / 可选注入脚本（load 后延时执行）
const SCENES = [
  { name: 'showcase-desktop', page: 'components-showcase.html', w: 1280, h: 900 },
  { name: 'courseware-desktop', page: 'binary-card-trick.html', w: 1280, h: 900 },
  { name: 'courseware-mobile', page: 'binary-card-trick.html', w: 500, h: 900 },
  { name: 'dark-theme', page: 'dark-theme-test.html', w: 1280, h: 900 },
  {
    name: 'drawer-open-mobile', page: 'binary-card-trick.html', w: 500, h: 900,
    inject: `document.querySelector('.sidebar-toggle').click();`,
  },
  {
    name: 'search-open-desktop', page: 'how-to-create-skill.html', w: 1280, h: 900,
    inject: `var i=document.querySelector('.sc-search-input');if(i){i.focus();i.value='SKILL';i.dispatchEvent(new Event('input',{bubbles:true}));}`,
  },
];

if (!fs.existsSync(DIST)) {
  console.error('[visual] dist/ 不存在——先跑 node build.js');
  process.exit(1);
}

// 内存注入页：/__inject__/<name>.html = dist/<page> + 尾部脚本
const injected = new Map();
for (const s of SCENES) {
  if (!s.inject) continue;
  const html = fs.readFileSync(path.join(DIST, s.page), 'utf8');
  const script = `<scr` + `ipt>window.addEventListener('load',function(){setTimeout(function(){try{${s.inject}}catch(e){}},300)});</scr` + `ipt>`;
  injected.set('/__inject__/' + s.name + '.html', html.replace('</body>', script + '</body>'));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (injected.has(url)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(injected.get(url));
    return;
  }
  const file = path.join(DIST, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': ext === '.js' ? 'text/javascript' : 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(PORT, resolve));

fs.mkdirSync(CURRENT, { recursive: true });

let mismatchCount = 0;
const noBaseline = [];
for (const s of SCENES) {
  const url = s.inject ? `/__inject__/${s.name}.html` : `/${s.page}`;
  const out = path.join(CURRENT, s.name + '.png');
  const r = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu',
    `--window-size=${s.w},${s.h}`,
    '--virtual-time-budget=6000',
    // 保底退出：页面有持续 rAF（3D 自转/动画）时 virtual-time 不收敛，Chrome 会挂住
    '--timeout=15000',
    '--hide-scrollbars',
    `--screenshot=${out}`,
    `http://localhost:${PORT}${url}`,
  ], { stdio: 'ignore', timeout: 30000 });
  if (r.status !== 0 || !fs.existsSync(out)) {
    const detail = r.error ? r.error.message : `status=${r.status} signal=${r.signal}`;
    console.error(`✗ ${s.name}: 截图失败（${detail}）`);
    mismatchCount += 1;
    continue;
  }

  const base = path.join(BASELINE, s.name + '.png');
  if (IS_BASELINE) { console.log(`● 基线已固化: ${s.name}`); continue; }
  if (!fs.existsSync(base)) { noBaseline.push(s.name); continue; }

  const a = PNG.sync.read(fs.readFileSync(base));
  const b = PNG.sync.read(fs.readFileSync(out));
  if (a.width !== b.width || a.height !== b.height) {
    console.error(`✗ ${s.name}: 尺寸变化 ${a.width}x${a.height} → ${b.width}x${b.height}（布局回归？）`);
    mismatchCount += 1;
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const pct = (diffPixels / (a.width * a.height)) * 100;
  if (pct > 1) {
    const diffPath = path.join(SHOT_DIR, 'diff-' + s.name + '.png');
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    console.error(`✗ ${s.name}: 像素差异 ${pct.toFixed(2)}%（>1%）→ diff 图：${diffPath}`);
    mismatchCount += 1;
  } else {
    console.log(`✓ ${s.name}（差异 ${pct.toFixed(3)}%）`);
  }
}

server.close();

// 显式退出：server 未关闭的 keep-alive 句柄会阻止自然退出
process.exit(IS_BASELINE || mismatchCount === 0 ? 0 : 1);

if (IS_BASELINE) {
  console.log(`\n[visual] ${SCENES.length} 个场景基线已固化到 test/__screenshots__/baseline/`);
} else if (noBaseline.length > 0) {
  console.log(`\n[visual] ${noBaseline.length} 个场景无基线（${noBaseline.join(', ')}）——首次使用先跑 npm run visual:baseline`);
} else if (mismatchCount > 0) {
  console.error(`\n[visual] ${mismatchCount} 个场景超阈值。确认是预期改动后：npm run visual:baseline`);
  process.exit(1);
} else {
  console.log(`\n[visual] 全部场景与基线一致`);
}
