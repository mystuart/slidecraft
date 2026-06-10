const { escapeHtml } = require('./template/components/_inline.js');

// build.js — 编译脚本
// 用法：
//   node build.js                       # 编译 content/ 目录下所有 .md
//   node build.js content/xxx.md        # 编译指定文件
//   node build.js content/*.md          # 编译所有
//
// 流程：
//   1. 读 markdown 文件
//   2. gray-matter 拆 frontmatter + body
//   3. renderer.processMarkdown 提取所有组件代码块 → 替换为占位符
//   4. marked 渲染剩余 markdown
//   5. renderer.mergeComponents 把占位符替换为组件 HTML
//   6. 给 ## 标题加 id（section-N），便于侧边导航锚点
//   7. 把 frontmatter + 渲染后的内容注入 index.html.tpl
//   8. 写 dist/<name>.html（每个 .md 独立产物）

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');
const renderer = require('./template/components/renderer.js');

// marked 5+ 是 ESM-only，CommonJS 只能用 dynamic import
let markedModule = null;
async function loadMarked() {
  if (!markedModule) {
    markedModule = await import('marked');
  }
  return markedModule;
}

// CLI 标志：A1 · Three.js 内联模式（--inline-three 启用）
// 默认 false = 拆外链 + 缓存破坏
let INLINE_THREE = false;

// ============================================================
// 配置
// ============================================================
const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, 'template/index.html.tpl');
const CSS_PATH = path.join(ROOT, 'template/styles/main.css');
const DIST_DIR = path.join(ROOT, 'dist');

// ============================================================
// 工具
// ============================================================


/**
 * 把 marked 渲染后的 HTML 中正文里的 h2 加上 id
 * 这样侧边导航的 #section-N 锚点能正确跳转
 * 只处理 <h2>xxx</h2>，不处理带 attribute 的
 */
function injectSectionIds(html) {
  let counter = 0;
  return html.replace(/<h2(\s*)>([\s\S]*?)<\/h2>/g, (m, sp, content) => {
    counter += 1;
    // 去掉内层可能的标签，只留纯文本做 title
    const titleText = content.replace(/<[^>]+>/g, '').trim();
    return `<h2${sp} id="section-${counter}">${content}</h2>`;
  });
}

// ============================================================
// 编译单个文件
// ============================================================
async function buildFile(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`输入文件不存在: ${inputPath}`);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const { data: fm, content } = matter(raw);

  // 1) 提取组件
  const { md: preprocessed, components } = renderer.processMarkdown(content);

  // 2) 配置 marked
  const { marked } = await loadMarked();
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
  });

  // 3) 渲染剩余 markdown
  let bodyHtml = await marked.parse(preprocessed);

  // 4) 把组件占位符替换回组件 HTML
  bodyHtml = renderer.mergeComponents(bodyHtml, components);

  // 4.5) 处理行内公式 $...$（依赖 katex，未安装则跳过）
  bodyHtml = renderer.processInlineFormulas(bodyHtml);

  // 5) 给 h2 注入 id
  bodyHtml = injectSectionIds(bodyHtml);

  // 6) 读模板和 CSS
  const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  // 6.5) 加载 KaTeX CSS（数学/化学公式组件依赖）
  // KaTeX 的渲染逻辑在公式组件里用 require('katex') 在编译时跑，
  // 渲染出的 HTML 依赖这份 CSS 才能正确显示数学符号
  let katexCss = '';
  const katexCssPath = path.join(ROOT, 'node_modules/katex/dist/katex.min.css');
  if (fs.existsSync(katexCssPath)) {
    katexCss = fs.readFileSync(katexCssPath, 'utf8');
  } else {
    console.error('! 警告：未找到 KaTeX CSS（node_modules/katex/dist/katex.min.css）');
    console.error('  公式组件将无法正确渲染。请运行: npm install katex');
  }

  // 7) 渲染侧边导航
  const nav = renderer.renderSideNav(fm.sections || [], fm.title, fm.subtitle, fm.author);

  // 7.5) 兜底提醒：frontmatter 没写 sections 但正文有 h2，sidebar 会是空的
  // 漏写 sections 不会让 build 失败（向后兼容），只给 warning
  if (!nav.items && /<h2[\s>]/i.test(bodyHtml)) {
    console.warn(`! 提醒：${path.basename(inputPath)} 有 <h2> 但 frontmatter 没写 sections，sidebar 会是空的。`);
    console.warn('  复制 template/fm-template.md 的 frontmatter，参考 binary-card-trick.md 补 sections。');
  }

  // 8) 收集客户端 JS
  const clientJs = renderer.collectClientScript();

  // 8.5) Three.js 包处理（A1 · 拆外链 + 缓存破坏）
  // 仅当输出文件用到了 geometry-3d 组件时才注入，避免给不需要 3D 的课件也增加 730KB
  // 两种模式：
  //   a) 默认（externalThree=true）：Three.js 拆为外链 <script src="three-bundle.<hash>.iife.js"></script>
  //      同一站点多个课件共享同一份 Three.js（浏览器缓存命中，CDN 流量减半）
  //   b) --inline-three：Three.js 内联进 HTML，单文件离线部署（Alice 内网部署场景）
  const threeBundlePath = path.join(ROOT, 'cw-three-bundle.iife.js');
  let threeBundleJs = '';
  let threeBundleTag = '';
  if (bodyHtml.includes('class="geom-3d"')) {
    if (fs.existsSync(threeBundlePath)) {
      if (INLINE_THREE) {
        // 模式 b：内联
        threeBundleJs = fs.readFileSync(threeBundlePath, 'utf8');
      } else {
        // 模式 a：外链 + hash 缓存破坏
        const bundle = fs.readFileSync(threeBundlePath);
        const hash = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 8);
        const hashedName = `three-bundle.${hash}.iife.js`;
        const hashedPath = path.join(DIST_DIR, hashedName);
        // 复制到 dist/（如果 hash 变了 = 重新复制；hash 不变 = 复用同名文件）
        if (!fs.existsSync(hashedPath)) {
          fs.writeFileSync(hashedPath, bundle);
        }
        threeBundleTag = `<script src="${hashedName}"></script>`;
      }
    } else {
      console.error('! 警告：检测到 geometry-3d 组件但未找到 cw-three-bundle.iife.js');
      console.error('  运行: node_modules/.bin/esbuild cw-three-bundle.js --bundle --format=iife --target=es2020 --minify --outfile=cw-three-bundle.iife.js');
    }
  }

  // 9) 注入模板
  const out = tpl
    .replace(/\{\{TITLE\}\}/g, () => nav.titleTag)
    .replace(/\{\{SUBTITLE\}\}/g, () => escapeHtml(fm.subtitle || ''))
    .replace(/\{\{SUBTITLE_TAG\}\}/g, () => nav.subtitleTag)
    .replace(/\{\{AUTHOR\}\}/g, () => nav.author)
    .replace(/\{\{THEME\}\}/g, () => escapeHtml(fm.theme || 'lavender'))
    .replace(/\{\{NAV_ITEMS\}\}/g, () => nav.items)
    .replace(/\{\{CONTENT\}\}/g, () => bodyHtml)
    .replace(/\{\{CSS\}\}/g, () => css + '\n' + katexCss)
    .replace(/\{\{THREE_SCRIPT\}\}/g, () => threeBundleTag)
    .replace(/\{\{CLIENT_JS\}\}/g, () => threeBundleJs + '\n' + clientJs);

  // 10) 写文件
  // 每个 markdown 编译成独立的 dist/<name>.html，避免多文件互相覆盖
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(DIST_DIR, baseName + '.html');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`✓ Built ${path.relative(ROOT, outPath)} (${out.length} bytes) from ${path.relative(ROOT, inputPath)}`);
  return outPath;
}

// ============================================================
  // CLI 入口
  // ============================================================
  async function main() {
    const rawArgs = process.argv.slice(2);
    const args = [];
    for (const a of rawArgs) {
      if (a === '--inline-three') {
        INLINE_THREE = true;
        console.log('[build] 模式：Three.js 内联（单文件离线部署）');
      } else if (a === '--watch') {
        // 占位 —— 真正的 --watch 留给后续实现
        console.warn('[build] --watch 暂未实现，使用 `node build.js` 手动重跑');
      } else {
        args.push(a);
      }
    }

    // 默认：编译 content/ 目录下所有 .md
    let targets;
    if (args.length === 0) {
      const contentDir = path.join(ROOT, 'content');
      if (fs.existsSync(contentDir)) {
        targets = fs.readdirSync(contentDir)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(contentDir, f));
      } else {
        targets = [];
      }
    } else {
    // 解析所有参数（支持 glob-like 简单展开 *.md）
    targets = [];
    for (const arg of args) {
      const abs = path.isAbsolute(arg) ? arg : path.resolve(ROOT, arg);
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        // 目录：取所有 .md
        fs.readdirSync(abs).filter(f => f.endsWith('.md')).forEach(f => targets.push(path.join(abs, f)));
      } else if (abs.includes('*')) {
        // 简化 glob：只支持 *.xxx 模式（不递归、不子目录 glob）
        const dir = path.dirname(abs);
        const base = path.basename(abs);
        const extMatch = base.match(/^\*\.(.+)$/);
        if (extMatch && fs.existsSync(dir)) {
          const ext = '.' + extMatch[1];
          fs.readdirSync(dir).filter(f => f.endsWith(ext)).forEach(f => targets.push(path.join(dir, f)));
        } else {
          console.warn(`[build] glob 模式不支持：${abs}（只支持 *.xxx）`);
        }
      } else if (fs.existsSync(abs)) {
        targets.push(abs);
      } else {
        console.error(`! Skipped (not found): ${arg}`);
      }
    }
  }

  if (targets.length === 0) {
    console.error('没有可编译的 markdown 文件');
    console.error('用法: node build.js [file.md ...]');
    process.exit(1);
  }

  for (const t of targets) {
    await buildFile(t);
  }
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
