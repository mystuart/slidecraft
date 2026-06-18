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

// 架构债 #3 修复：KaTeX 解析错误收集器
// throwOnError:false 时 KaTeX 不抛异常，而是把错误渲染成 <span class="katex-error">
// 这里在 build 期主动扫描产物 HTML，收集错误 → 末尾汇总报告 + exit code 非 0
// 避免"产物能 build 但公式不显示、作者完全不知道"的静默降级。
const KATEX_ERROR_RE = /<span class="katex-error"[^>]*>([\s\S]*?)<\/span>/g;
const buildErrors = []; // [{ file, errors: [{ src, msg }] }]

/**
 * 扫描渲染后的 HTML，收集所有 katex-error 标记
 * @param {string} html
 * @returns {Array<{src:string, msg:string}>}
 */
function collectKatexErrors(html) {
  const errors = [];
  let m;
  // 重置正则 lastIndex（全局正则复用）
  KATEX_ERROR_RE.lastIndex = 0;
  while ((m = KATEX_ERROR_RE.exec(html)) !== null) {
    // katex-error 的 title 属性含 "ParseError: ..." 信息，
    // textContent 是出错的原 LaTeX 源码
    const inner = m[0];
    const src = m[1].trim();
    const titleMatch = inner.match(/title="([^"]*)"/);
    let msg = 'KaTeX 解析失败';
    if (titleMatch) {
      // title 里是 HTML entity 编码的，解码最常见的
      msg = titleMatch[1]
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    }
    errors.push({ src, msg });
  }
  return errors;
}

/**
 * 生成 OG image（社交分享预览图）的 SVG data URI。
 * 800×400 卡片：薰衣草紫背景 + Slidecraft wordmark + 课件标题/tagline。
 * 内联到 HTML 的 <meta property="og:image">，零外部文件。
 */
function buildOgImage(title, subtitle) {
  // 标题/副标题里剥 HTML 标签（titleTag 可能含 <span> 等）+ 转义 XML
  const clean = (s) => String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const t = clean(title).slice(0, 40);
  const s = clean(subtitle).slice(0, 60);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b7dd8"/>
      <stop offset="1" stop-color="#6b5db0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#bg)"/>
  <g transform="translate(40, 40)" opacity="0.95" font-family="-apple-system,sans-serif">
    <!-- 层叠卡片 mark（同 assets/logo-mark.svg，放左上作品牌锚点） -->
    <rect x="6" y="42" width="64" height="64" rx="13" fill="#ffffff" opacity="0.18"/>
    <rect x="26" y="26" width="64" height="64" rx="13" fill="#ffffff" opacity="0.32"/>
    <rect x="46" y="10" width="64" height="64" rx="13" fill="#ffffff"/>
    <!-- S 居中于前层（46,10 ~ 110,74 → center 78,42） -->
    <text x="78" y="42" font-size="44" font-weight="800" fill="#8b7dd8" text-anchor="middle" dominant-baseline="middle">S</text>
  </g>
  <text x="200" y="180" font-family="-apple-system,sans-serif" font-size="42" font-weight="800" fill="white">Slidecraft</text>
  <text x="200" y="220" font-family="-apple-system,sans-serif" font-size="20" fill="white" opacity="0.85">${t}</text>
  <text x="200" y="252" font-family="-apple-system,sans-serif" font-size="16" fill="white" opacity="0.7">${s}</text>
</svg>`;
  // URL 编码（data URI 要求）
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

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
 * 返回 { html, count }，count 是注入的 h2 数量（用于 build 时跟 sections 对比）
 */
function injectSectionIds(html) {
  let counter = 0;
  const out = html.replace(/<h2(\s*)>([\s\S]*?)<\/h2>/g, (m, sp, content) => {
    counter += 1;
    // 去掉内层可能的标签，只留纯文本做 title
    const titleText = content.replace(/<[^>]+>/g, '').trim();
    return `<h2${sp} id="section-${counter}">${content}</h2>`;
  });
  return { html: out, count: counter };
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

  // 2) 配置 marked + 语法高亮（编译时，产物零运行时）
  const { marked } = await loadMarked();
  const { highlight, highlightAuto } = require('./template/components/_highlight.js');
  const mdRenderer = new marked.Renderer();
  mdRenderer.code = function(code, infostring) {
    // marked 5+ 可能传 ({text, lang}) 对象，兼容两种签名
    if (typeof code === 'object') {
      infostring = code.lang;
      code = code.text;
    }
    const lang = (infostring || '').split(/\s+/)[0];
    const highlighted = lang ? highlight(code, lang) : highlightAuto(code);
    const langClass = lang ? ' class="hljs language-' + lang + '"' : ' class="hljs"';
    return '<pre><code' + langClass + '>' + highlighted + '</code></pre>';
  };
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
    renderer: mdRenderer,
  });

  // 3) 渲染剩余 markdown
  let bodyHtml = await marked.parse(preprocessed);

  // 4) 把组件占位符替换回组件 HTML
  bodyHtml = renderer.mergeComponents(bodyHtml, components);

  // 4.5) 处理行内公式 $...$（依赖 katex，未安装则跳过）
  bodyHtml = renderer.processInlineFormulas(bodyHtml);

  // 4.6) 架构债 #3：扫描 KaTeX 静默降级
  // throwOnError:false 让 KaTeX 把错误渲染成 katex-error span 而非抛异常，
  // 这里主动收集，build 末尾汇总报告 + exit code 非 0。
  const katexErrors = collectKatexErrors(bodyHtml);
  if (katexErrors.length > 0) {
    buildErrors.push({ file: path.basename(inputPath), errors: katexErrors });
  }

  // 5) 给 h2 注入 id
  const injected = injectSectionIds(bodyHtml);
  bodyHtml = injected.html;
  const h2Count = injected.count;

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

  // 6.6) 条件加载组件专属 CSS（表驱动）
  // 仅当渲染产物含对应组件标记 class 时注入该组件 CSS，不含的组件零负担。
  // 新增组件 CSS：往 COMPONENT_CSS 加一行即可，加载与拼接都自动处理（单一同步点）。
  const COMPONENT_CSS = [
    { marker: 'class="geom-3d"',       file: 'geometry-3d.css' },
    { marker: 'class="coords-2d"',     file: 'coords-2d.css' },
    { marker: 'class="function-plot"', file: 'function-plot.css' },
    { marker: 'class="intersection"',  file: 'intersection-marker.css' },
  ];
  const componentCssParts = [];
  for (const { marker, file } of COMPONENT_CSS) {
    if (!bodyHtml.includes(marker)) continue;
    const cssPath = path.join(ROOT, 'template/styles', file);
    if (fs.existsSync(cssPath)) {
      componentCssParts.push(fs.readFileSync(cssPath, 'utf8'));
    }
  }
  const componentCss = componentCssParts.join('\n');

  // 7) 渲染侧边导航
  const nav = renderer.renderSideNav(fm.sections || [], fm.title, fm.subtitle, fm.author);

  // 7.5) 兜底提醒：frontmatter 没写 sections 但正文有 h2，sidebar 会是空的
  // 漏写 sections 不会让 build 失败（向后兼容），只给 warning
  if (!nav.items && /<h2[\s>]/i.test(bodyHtml)) {
    console.warn(`! 提醒：${path.basename(inputPath)} 有 <h2> 但 frontmatter 没写 sections，sidebar 会是空的。`);
    console.warn('  参考 content/binary-card-trick.md 的 frontmatter 补 sections。');
  }

  // 7.6) strict 校验：sections 数量必须 == h2 数量，否则锚点错位
  // 之前 sections 按位置 (i+1) 编号、h2 也按位置 (1..N) 编号，两边数量不一致会无声错位
  // （如三角柱 demo 漏写 ## 原题 时 "原题"sidebar 跳到不存在的 section-1、"第(2)问"跳到 section-3 而非 section-4）
  // 2026-06-15 升级：所有现有 .md 已修齐，从 warn 升级为 error + exit 1（架构债 #4 收尾）
  const sectionsCount = Array.isArray(fm.sections) ? fm.sections.length : 0;
  if (sectionsCount > 0 && h2Count > 0 && sectionsCount !== h2Count) {
    console.error('! 锚点错位：' + path.basename(inputPath) + ' frontmatter sections=' + sectionsCount + '，但正文 h2=' + h2Count + '。');
    console.error('  侧边栏按 (i+1) 编号、正文按出现顺序编号 —— 数量不一致会导致锚点错位。');
    // 给出 sections 列表便于排查
    (fm.sections || []).forEach(function(s, i) {
      const label = typeof s === 'string' ? s : (s && s.title ? s.title : '');
      console.error('    sidebar #section-' + (i + 1) + ' -> "' + label + '"');
    });
    // 给出 h2 列表（粗略匹配：去掉内层标签 + 截断 30 字符）
    const h2Texts = [];
    bodyHtml.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, function(_, c) {
      const t = c.replace(/<[^>]+>/g, '').trim();
      h2Texts.push(t.length > 30 ? t.slice(0, 30) + '...' : t);
    });
    h2Texts.forEach(function(t, i) {
      console.error('    正文 h2 #' + (i + 1) + ': "' + t + '"');
    });
    process.exitCode = 1;
  }

  // 8) 收集客户端 JS
  const clientJs = renderer.collectClientScript();

  // 8.5) Three.js 包处理（A1 · 拆外链 + 缓存破坏）
  // 仅当输出文件用到了 geometry-3d 组件时才注入，避免给不需要 3D 的课件也增加 730KB
  // 两种模式：
  //   a) 默认（externalThree=true）：Three.js 拆为外链 <script src="three-bundle.<hash>.iife.js"></script>
  //      同一站点多个课件共享同一份 Three.js（浏览器缓存命中，CDN 流量减半）
  //   b) --inline-three：Three.js 内联进 HTML，单文件离线部署（Alice 内网部署场景）
  const threeBundlePath = path.join(ROOT, 'three-bundle.iife.js');
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
      // v0.x 修复：硬失败而不是 warn
      //   之前只 warn 不 throw，新 clone 项目 + npm install 之后 Alice 跑 build 看不出问题，
      //   课件 3D 跑不起来才在浏览器里发现。
      //   现在直接 throw + 给一键修复命令。
      const buildCmd = 'node_modules/.bin/esbuild three-bundle.js --bundle --format=iife --target=es2020 --minify --outfile=three-bundle.iife.js';
      throw new Error(
        `检测到 geometry-3d 组件但未找到 three-bundle.iife.js。\n` +
        `先运行:\n  ${buildCmd}\n` +
        `(一次性设置，后续 build 自动复用)`
      );
    }
  }

  // 9) 注入模板
  const out = tpl
    .replace(/\{\{TITLE\}\}/g, () => nav.titleTag)
    .replace(/\{\{SUBTITLE\}\}/g, () => escapeHtml(fm.subtitle || ''))
    .replace(/\{\{SUBTITLE_TAG\}\}/g, () => nav.subtitleTag)
    .replace(/\{\{AUTHOR\}\}/g, () => nav.author)
    .replace(/\{\{THEME\}\}/g, () => escapeHtml(fm.theme || 'lavender'))
    .replace(/\{\{OG_IMAGE\}\}/g, () => buildOgImage(nav.titleTag, fm.subtitle || ''))
    .replace(/\{\{NAV_ITEMS\}\}/g, () => nav.items)
    .replace(/\{\{CONTENT\}\}/g, () => bodyHtml)
    .replace(/\{\{CSS\}\}/g, () => css + '\n' + katexCss + (componentCss ? '\n' + componentCss : ''))
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
  let WATCH = false;
  for (const a of rawArgs) {
    if (a === '--inline-three') {
      INLINE_THREE = true;
      console.log('[build] 模式：Three.js 内联（单文件离线部署）');
    } else if (a === '--watch') {
      WATCH = true;
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

  // --watch 模式：监听文件变化，debounce 后增量重 build，不退出
  if (WATCH) {
    console.log('');
    console.log('[watch] 监听 ' + targets.length + ' 个文件，保存即重 build（Ctrl+C 退出）');
    const changedFiles = new Set();
    let debounceTimer = null;
    function scheduleRebuild() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        debounceTimer = null;
        const files = Array.from(changedFiles);
        changedFiles.clear();
        buildErrors.length = 0; // 清空旧错误报告
        for (const f of files) {
          try {
            await buildFile(f);
          } catch (e) {
            console.error('[watch] build 失败 ' + path.basename(f) + ': ' + e.message);
          }
        }
      }, 300);
    }
    targets.forEach(t => {
      fs.watch(t, { persistent: true }, (eventType) => {
        if (eventType === 'change') {
          changedFiles.add(t);
          scheduleRebuild();
        }
      });
    });
    return; // watch 模式不退出进程，也不走错误报告的 exit code
  }

  // 架构债 #3：汇总 KaTeX 解析错误报告
  // 产物已生成（可看），但有公式解析失败时报告出来 + exit code 1，
  // 让 CI / 作者能发现"公式没正确渲染"。
  if (buildErrors.length > 0) {
    const totalErrors = buildErrors.reduce((s, r) => s + r.errors.length, 0);
    console.error('');
    console.error('⚠ 发现 ' + totalErrors + ' 个公式解析错误（产物已生成，但下列公式未正确渲染）：');
    for (const report of buildErrors) {
      console.error('  ' + report.file + '：');
      for (const e of report.errors) {
        const d = String.fromCharCode(36);
        console.error("    - " + e.msg + " --- 源码: " + d + e.src + d);
      }
    }
    console.error('产物可正常打开，但上述公式显示为红色错误。修复 LaTeX 语法后重新 build。');
    process.exitCode = 1;
  }
}

// 允许被 require 测试（不触发 main）；直接运行时才 build
if (require.main === module) {
  main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}

// 导出供测试用（不触发 main）
module.exports = { injectSectionIds, collectKatexErrors };
