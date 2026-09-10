/**
 * @component renderer
 * @version 0.3.1
 * @status 内部调度器，不参与组件登记
 *
 * v0.3.1 变更：
 *   - collectClientScript 注入 _progress.js runtime（__SCProgress，进度持久化）
 *   - initSideNavScript 新增移动端目录抽屉（<900px 汉堡按钮 + 全屏目录面板，
 *     html.js-nav 渐进增强门控，无 JS 保持原布局；Esc/选中章节收起，body 滚动锁）
 *
 * v0.3.0 变更：
 *   - collectClientScript 注入 _lifecycle.js runtime 作为最前缀（架构债 C2-4/5 + H4）
 *   - 生命周期基础设施：组件用 createLifecycle(root) 登记可释放资源，sc:destroy 批量销毁
 *
 * v0.2.9 变更：
 *   - 注册 code-runner 组件（v0.1.0 代码+输出对照）
 *
 * v0.2.8 变更：
 *   - 注册 diagram 组件（v0.1.0 流程图/关系图）
 *
 * v0.2.7 变更：
 *   - 注册 quote 组件（v0.1.0 金句引用）
 *
 * v0.2.6 变更：
 *   - 注册 stat-grid 组件（v0.1.0 数据卡片墙）
 *
 * v0.2.5 变更：
 *   - 注册 tabs 组件（v0.1.0 标签页切换）
 *
 * v0.2.4 变更：
 *   - 注册 chart 组件（v0.1.0 柱/折/饼静态 SVG）
 *
 * v0.2.3 变更：
 *   - 注册 timeline 组件（v0.1.0 时间线）
 *
 * v0.2.2 变更：
 *   - 注册 cut-anim 组件（v0.3 剖切动画）
 *
 * v0.2.1 变更：
 *   - 注册 slider + tetra-equiv 两个新组件（v0.3 联动能力）
 *
 * 组件主调度器。
 *
 * 职责：
 *   1. 扫描 markdown 文本，提取所有 fenced code block
 *   2. 把语言标记为组件名的代码块，调用对应组件渲染 → 替换为 HTML 注释占位符
 *   3. 把渲染后的 HTML 收集到数组
 *   4. 让外部把剩余 markdown 交给 marked 渲染
 *   5. 让外部把占位符替换回组件 HTML
 *   6. 提供 collectClientScript() 把所有组件的客户端 JS 拼起来
 *   7. 提供 renderSideNav(sections) 渲染侧边导航 HTML
 *
 * 对外 API：
 *   - processMarkdown(md) — 预扫 markdown，返回 { html, components, sections } 三元组
 *   - mergeComponents(mdHtml, components) — 把占位符替换回组件 HTML
 *   - collectClientScript() — 拼接所有组件的 clientJs 字符串
 *   - renderSideNav(sections) — 渲染侧边导航 HTML
 *
 * 字段契约：内部调度器，无字段。
 *
 * 已知问题：marked.setOptions 是全局副作用（系统级问题 #5），未来要做并行编译时需重构 loader。
 */

const { escapeHtml } = require('./_inline.js');
const { getLifecycleRuntime, getRevealRuntime } = require('./_lifecycle.js');
const { getProgressRuntime } = require('./_progress.js');

const hero = require('./hero.js');
const quiz = require('./quiz.js');
const fillBlank = require('./fill-blank.js');
const stepGuide = require('./step-guide.js');
const compare = require('./compare.js');
const conceptCard = require('./concept-card.js');
const callout = require('./callout.js');
const formula = require('./formula.js');
const mathStep = require('./math-step.js');
const geometry3d = require('./geometry-3d.js');
const slider = require('./slider.js');
const tetraEquiv = require('./tetra-equiv.js');
const cutAnim = require('./cut-anim.js');
const trajectory = require('./trajectory.js');
const coords2d = require('./coords-2d.js');
const functionPlot = require('./function-plot.js');
const intersectionMarker = require('./intersection-marker.js');
const timeline = require('./timeline.js');
const tabs = require('./tabs.js');
const statGrid = require('./stat-grid.js');
const quote = require('./quote.js');
const diagram = require('./diagram.js');
const codeRunner = require('./code-runner.js');
const chart = require('./chart.js');

// 语言标记 → 组件渲染器
const COMPONENT_MAP = {
  'hero': hero,
  'quiz': quiz,
  'quiz-track': quiz,
  'quiztrack': quiz,
  'quiz_track': quiz,
  'fill-blank': fillBlank,
  'fillblank': fillBlank,
  'fill_blank': fillBlank,
  'step-guide': stepGuide,
  'stepguide': stepGuide,
  'step_guide': stepGuide,
  'compare': compare,
  'concept-card': conceptCard,
  'conceptcard': conceptCard,
  'concept_card': conceptCard,
  'callout': callout,
  'formula': formula,
  'math-step': mathStep,
  'mathstep': mathStep,
  'math_step': mathStep,
  'geometry-3d': geometry3d,
  'geometry3d': geometry3d,
  'geometry_3d': geometry3d,
  'slider': slider,
  'tetra-equiv': tetraEquiv,
  'tetraequiv': tetraEquiv,
  'tetra_equiv': tetraEquiv,
  'cut-anim': cutAnim,
  'cutanim': cutAnim,
  'cut_anim': cutAnim,
  'trajectory': trajectory,
  'traj': trajectory,
  'coords-2d': coords2d,
  'coords2d': coords2d,
  'coords_2d': coords2d,
  'function-plot': functionPlot,
  'functionplot': functionPlot,
  'function_plot': functionPlot,
  'intersection-marker': intersectionMarker,
  'intersection': intersectionMarker,
  'intersectionmarker': intersectionMarker,
  'timeline': timeline,
  'chart': chart,
  'tabs': tabs,
  'stat-grid': statGrid,
  'statgrid': statGrid,
  'quote': quote,
  'diagram': diagram,
  'flowchart': diagram,
  'code-runner': codeRunner,
  'coderunner': codeRunner,
};

const PLACEHOLDER_RE = /<!--\s*SC-COMPONENT-(\d+)\s*-->/g;

/**
 * 扫描 markdown，把组件代码块替换为占位符，返回剩余 markdown + 组件 HTML 列表
 * @param {string} md
 * @returns {{ md: string, components: string[] }}
 */
function processMarkdown(md) {
  const components = [];
  // 匹配 ```lang ... ``` 三反引号代码块
  // lang 与 body 之间允许空格/tab/可选换行（标准 markdown 允许 ```hero` 直接接内容）
  const replaced = md.replace(/```([a-zA-Z][\w-]*)[ \t]*\n?([\s\S]*?)```/g, (m, lang, body, offset) => {
    const key = String(lang).toLowerCase();
    const comp = COMPONENT_MAP[key];
    if (!comp) return m; // 不是组件，留给 marked 正常处理
    let data;
    try {
      data = JSON.parse(String(body).trim());
    } catch (e) {
      // 算出 body 在原文中大致行号，便于定位
      const before = md.slice(0, offset);
      const line = (before.match(/\n/g) || []).length + 1;
      throw new Error(
        `[renderer] 组件 "${key}" JSON 解析失败（大约第 ${line} 行）: ${e.message}\n` +
        `Body 内容:\n${body}`
      );
    }
    const html = (comp.renderTrack && Array.isArray(data))
      ? comp.renderTrack(data)
      : comp.render(data);
    const idx = components.length;
    components.push(html);
    return `<!--SC-COMPONENT-${idx}-->`;
  });
  return { md: replaced, components };
}

/**
 * 把 marked 渲染后的 HTML 中的占位符替换回组件 HTML
 * @param {string} html
 * @param {string[]} components
 * @returns {string}
 */
function mergeComponents(html, components) {
  return html.replace(PLACEHOLDER_RE, (m, idx) => components[parseInt(idx, 10)] || '');
}

/**
 * 处理正文里的行内公式 $...$（不跨行）
 *  - 跳过 <code>/<pre> 里的内容（避免把代码里的 $ 误判为公式）
 *  - KaTeX 解析失败时保持原样（不报错）
 *  - 依赖可选：未安装 katex 时直接返回原 html（行内公式不会渲染，但 build 不会失败）
 */
function processInlineFormulas(html) {
  let katex;
  try {
    katex = require('katex');
  } catch (e) {
    return html; // katex 未安装，跳过行内公式处理
  }

  // 1) 保护 <code>/<pre> 整块（含内容）：优先于标签保护，否则标签占位后
  //    code 内容就成了裸文本、被公式替换误伤（既有行为回归）。
  const codeBlocks = [];
  html = html.replace(/(<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>)/g, (m) => {
    const idx = codeBlocks.length;
    codeBlocks.push(m);
    return `\u0000SCINLINECODE${idx}\u0000`;
  });

  // 2) 保护其余所有 HTML 标签：公式替换只应发生在文本节点。
  //    此前只保护 code/pre，组件属性里的 $...$（如 quiz feedback 走 data-属性的时代）
  //    会被替换成含双引号的 KaTeX HTML，把属性撑破、原始属性泄漏为正文。
  //    正则带引号分支：属性值里可能出现 ">"（如 "$a = 2 > 0$"），裸 [^>] 会在那里截断。
  const tags = [];
  html = html.replace(/<(?:[^"'>]|"[^"]*"|'[^']*')+>/g, (m) => {
    const idx = tags.length;
    tags.push(m);
    return `\u0000SCTAG${idx}\u0000`;
  });

  // 2) 先保护 $...$ 块级公式占位（避免被行内 $...$ 正则错配，
  //    也防止"$S_n=...$。中文，$O(1)$"这类相邻 display/inline 被串成
  //    一个跨段匹配，把中文喂进 KaTeX 触发 unicodeTextInMathMode 告警）
  const displayMath = [];
  html = html.replace(/\$\$([^$]+?)\$\$/g, (m, expr) => {
    const trimmed = String(expr).trim();
    if (!trimmed) return m;
    try {
      const rendered = katex.renderToString(trimmed, {
        throwOnError: false,
        displayMode: true,
        strict: 'ignore',
      });
      const idx = displayMath.length;
      displayMath.push(rendered);
      return `\u0000SCDISPLAYMATH${idx}\u0000`;
    } catch (e) {
      return m;
    }
  });

  // 3) 处理行内公式 $...$（不允许跨行）
  //    strict:'ignore' 关掉 KaTeX 对 \text{中文} 等合法用法的 stderr 告警
  //    （与 formula.js:57 用法一致；告警本就无意义，CJK 在 \text{} 里合法）
  html = html.replace(/\$([^$\n]+?)\$/g, (match, expr) => {
    const trimmed = String(expr).trim();
    if (!trimmed) return match;
    try {
      return katex.renderToString(trimmed, {
        throwOnError: false,
        displayMode: false,
        strict: 'ignore',
      });
    } catch (e) {
      return match; // 解析失败保持原样
    }
  });

  // 4) 还原 $...$ 块级公式
  html = html.replace(/\u0000SCDISPLAYMATH(\d+)\u0000/g, (_, i) => displayMath[parseInt(i, 10)]);

  // 5) 还原 <code>/<pre> 块
  html = html.replace(/\u0000SCINLINECODE(\d+)\u0000/g, (_, i) => codeBlocks[parseInt(i, 10)]);

  // 6) 还原 HTML 标签
  html = html.replace(/\u0000SCTAG(\d+)\u0000/g, (_, i) => tags[parseInt(i, 10)]);

  return html;
}

/**
 * 收集所有组件的客户端 JS
 * 自动遍历 COMPONENT_MAP，按注册顺序拼接，dedupe 同一组件对象引用。
 * 新增组件时无需再手动维护这个列表。
 * @param {{themeToggle?: boolean}} [config] 框架 UI 开关（themeToggle 由 frontmatter 驱动）
 * @returns {string}
 */
function collectClientScript(config) {
  const seen = new Set();
  // 生命周期 runtime 作为最前缀：保证 createLifecycle 在任何组件 init 前可用。
  // （架构债 C2-4/5 + H4：组件统一用 lifecycle 句柄登记可释放资源）
  // 进度持久化 runtime 紧随其后：quiz / quiz-track / fill-blank 的保存/恢复依赖 __SCProgress。
  // 框架 UI runtime（进度条/返回顶部/代码工具栏/主题切换）最后注入。
  return [getLifecycleRuntime(), getRevealRuntime(), getProgressRuntime()]
    .concat(Object.values(COMPONENT_MAP)
      .filter(c => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
      })
      .map(c => c.clientJs)
      .filter(Boolean))
    .concat([getUiRuntime(config), initSideNavScript()])
    .join('\n\n');
}

/**
 * 框架 UI 运行时：阅读进度条 / 返回顶部 / 代码块工具栏 / 主题切换
 * 全部渐进增强（JS 注入 DOM），无 JS 时课件内容完整可读，打印态自动隐藏。
 * config.themeToggle = false 时（frontmatter themeToggle: false）不注入主题切换。
 */
function getUiRuntime(config) {
  const allowThemeToggle = !(config && config.themeToggle === false);
  return `
// ===== 框架 UI：阅读进度条 / 返回顶部 / 代码块工具栏 / 主题切换 =====
(function() {
  var docEl = document.documentElement;
  var THEME_KEY = 'sc-theme';
  var authoredTheme = docEl.getAttribute('data-theme') || 'lavender';
  function userTheme() {
    try { return localStorage.getItem(THEME_KEY) || authoredTheme; } catch (e) { return authoredTheme; }
  }
  function applyTheme(t) { docEl.setAttribute('data-theme', t); }
  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme && savedTheme !== authoredTheme) applyTheme(savedTheme);
  } catch (e) {}
  // 打印回作者主题（深色打印费墨且易出对比问题），打完恢复用户选择
  window.addEventListener('beforeprint', function() { applyTheme(authoredTheme); });
  window.addEventListener('afterprint', function() { applyTheme(userTheme()); });

  // 剪贴板：clipboard API 优先，execCommand 兜底（file:// 与旧内核）
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function() { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
  window.__SCCopy = copyText;

  var ICON_MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var ICON_SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  var themeBtns = [];
  function makeThemeToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', '切换深浅主题');
    btn.title = '切换深浅主题';
    function syncIcon() {
      btn.innerHTML = docEl.getAttribute('data-theme') === 'dark' ? ICON_SUN : ICON_MOON;
    }
    btn.addEventListener('click', function() {
      var next = docEl.getAttribute('data-theme') === 'dark' ? 'lavender' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      themeBtns.forEach(function(b) { b.innerHTML = next === 'dark' ? ICON_SUN : ICON_MOON; });
    });
    syncIcon();
    themeBtns.push(btn);
    return btn;
  }
${allowThemeToggle ? `
  // 注入两处：桌面 sidebar footer / 移动端吸顶 brand 行（CSS 按断点二选一显示）
  var themeFooter = document.querySelector('.sidebar-footer');
  var themeBrand = document.querySelector('.sidebar-brand');
  if (themeFooter) themeFooter.appendChild(makeThemeToggle());
  if (themeBrand) themeBrand.appendChild(makeThemeToggle());
` : ''}

  // --- 阅读进度条 + 返回顶部 ---
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);
  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', '返回顶部');
  topBtn.title = '返回顶部';
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  topBtn.addEventListener('click', function() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  document.body.appendChild(topBtn);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      ticking = false;
      var max = docEl.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressBar.style.transform = 'scaleX(' + pct + ')';
      topBtn.classList.toggle('is-visible', window.scrollY > 600);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (typeof createLifecycle === 'function') {
    createLifecycle(docEl).dispose(function() {
      window.removeEventListener('scroll', onScroll);
    });
  }

  // --- 代码块工具栏：语言标签 + 复制按钮 ---
  // code-runner 自带 heading/lang，跳过；已处理过的跳过（幂等）。
  document.querySelectorAll('.article pre > code').forEach(function(code) {
    var pre = code.parentElement;
    if (!pre || !pre.parentNode) return;
    if (pre.closest('.code-runner') || pre.closest('.code-card')) return;
    var lang = (code.className.match(/language-([\\w-]+)/) || [])[1] || 'text';
    var card = document.createElement('div');
    card.className = 'code-card';
    var head = document.createElement('div');
    head.className = 'code-card-head';
    var langEl = document.createElement('span');
    langEl.className = 'code-card-lang';
    langEl.textContent = lang;
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'code-card-copy';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', function() {
      copyText(code.textContent, function() {
        copyBtn.textContent = '✓ 已复制';
        copyBtn.classList.add('is-copied');
        setTimeout(function() {
          copyBtn.textContent = '复制';
          copyBtn.classList.remove('is-copied');
        }, 1600);
      });
    });
    head.appendChild(langEl);
    head.appendChild(copyBtn);
    pre.parentNode.insertBefore(card, pre);
    card.appendChild(head);
    card.appendChild(pre);
  });
})();
`;
}

/**
 * 侧边导航的 HTML
 * @param {string[]} sections
 * @param {string} [title]
 * @param {string} [subtitle]
 * @param {string} [author]
 */
function renderSideNav(sections, title, subtitle, author) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return {
      titleTag: escapeHtml(title || ''),
      subtitleTag: subtitle ? `<div class="sidebar-subtitle">${escapeHtml(subtitle)}</div>` : '',
      items: '',
      author: escapeHtml(author || ''),
    };
  }
  // 兼容两种 sections 格式：
  //   字符串数组: ['一、热身', '二、二进制运算', ...]
  //   对象数组:   [{id: 1, title: '一、热身'}, ...]
  // 对象缺 id 时回退到数组下标 + 1，保持与 marked 生成 h2 id 的对齐
  const items = sections.map((s, i) => {
    const label = typeof s === 'string' ? s : (s && s.title ? s.title : '');
    const idNum = (s && typeof s.id === 'number') ? s.id : (i + 1);
    return `<li><a href="#section-${idNum}" data-section-idx="${i}">${escapeHtml(label)}</a></li>`;
  }).join('');
  return {
    titleTag: escapeHtml(title || ''),
    subtitleTag: subtitle ? `<div class="sidebar-subtitle">${escapeHtml(subtitle)}</div>` : '',
    items,
    author: escapeHtml(author || ''),
  };
}

/**
 * 侧边导航 scroll-spy 客户端脚本
 * 监听主内容区的 h2 标题，高亮对应的导航项
 */
function initSideNavScript() {
  return `
// Scroll-spy 侧边导航高亮
(function() {
  var navLinks = document.querySelectorAll('.side-nav a[data-section-idx]');
  if (navLinks.length === 0) return;
  var sectionIds = [];
  navLinks.forEach(function(a) {
    sectionIds.push(a.getAttribute('href').slice(1));
  });
  function activate(idx) {
    navLinks.forEach(function(a, i) {
      a.classList.toggle('is-active', i === idx);
    });
  }
  // 点击直接跳转（不依赖 hashchange 重新触发）
  navLinks.forEach(function(a) {
    a.addEventListener('click', function() {
      var idx = parseInt(a.getAttribute('data-section-idx'), 10);
      activate(idx);
    });
  });

  // 移动端目录抽屉（渐进增强：html.js-nav 门控，无 JS 时保持原纵向布局）
  // 微信 / 手机打开课件是高频场景：整页 TOC 不再灌在正文前面，收进汉堡按钮。
  document.documentElement.classList.add('js-nav');
  var sidebarEl = document.querySelector('.sidebar');
  var brandEl = document.querySelector('.sidebar-brand');
  if (sidebarEl && brandEl) {
    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'side-nav');
    toggleBtn.textContent = '\\u2630'; // ☰
    var navEl = document.querySelector('.side-nav');
    if (navEl && !navEl.id) navEl.id = 'side-nav';
    function setNavOpen(open) {
      if (open) {
        sidebarEl.setAttribute('data-nav-open', '1');
      } else {
        sidebarEl.setAttribute('data-nav-open', '0');
      }
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggleBtn.textContent = open ? '\\u2715' : '\\u2630'; // ✕ / ☰
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggleBtn.addEventListener('click', function() {
      setNavOpen(sidebarEl.getAttribute('data-nav-open') !== '1');
    });
    brandEl.appendChild(toggleBtn);
    // 选中章节后收起抽屉（跳转锚点后正文应立即可读）
    navLinks.forEach(function(a) {
      a.addEventListener('click', function() { setNavOpen(false); });
    });
    // Esc 收起
    function onNavKey(e) {
      if (e.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', onNavKey);
    // 登记可释放资源（与 scroll-spy observer 同一模式）
    if (typeof createLifecycle === 'function') {
      createLifecycle(document.documentElement).dispose(function() {
        document.removeEventListener('keydown', onNavKey);
        document.body.style.overflow = '';
      });
    }
  }
  // 滚动时高亮当前可见的章节
  var sections = sectionIds.map(function(id) { return document.getElementById(id); }).filter(Boolean);
  if (sections.length === 0 || !('IntersectionObserver' in window)) {
    activate(0);
    return;
  }
  var currentIdx = 0;
  var io = new IntersectionObserver(function(entries) {
    // 找到最靠近顶部且可见的 section
    var visible = entries
      .filter(function(e) { return e.isIntersecting; })
      .sort(function(a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
    if (visible.length > 0) {
      var id = visible[0].target.id;
      var idx = sectionIds.indexOf(id);
      if (idx >= 0) {
        currentIdx = idx;
        activate(idx);
      }
    }
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  sections.forEach(function(s) { io.observe(s); });
  // 登记到生命周期句柄（架构债 C2-4/5：scroll-spy observer 也应可销毁）
  if (typeof createLifecycle === 'function') {
    createLifecycle(document.documentElement).observer(io);
  }
  // 初始激活第一个
  activate(0);
})();
`;
}



module.exports = {
  processMarkdown,
  mergeComponents,
  processInlineFormulas,
  collectClientScript,
  renderSideNav,
  components: COMPONENT_MAP,
};
