/**
 * @component renderer
 * @version 0.2.7
 * @status 内部调度器，不参与组件登记
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

  // 1) 保护 <code>/<pre> 块：用占位符暂时替换，正则处理完再还原
  const codeBlocks = [];
  html = html.replace(/(<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>)/g, (m) => {
    const idx = codeBlocks.length;
    codeBlocks.push(m);
    return `\u0000SCINLINECODE${idx}\u0000`;
  });

  // 2) 处理行内公式 $...$（不允许跨行）
  html = html.replace(/\$([^$\n]+?)\$/g, (match, expr) => {
    const trimmed = String(expr).trim();
    if (!trimmed) return match;
    try {
      return katex.renderToString(trimmed, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (e) {
      return match; // 解析失败保持原样
    }
  });

  // 3) 还原 <code>/<pre> 块
  html = html.replace(/\u0000SCINLINECODE(\d+)\u0000/g, (_, i) => codeBlocks[parseInt(i, 10)]);

  return html;
}

/**
 * 收集所有组件的客户端 JS
 * 自动遍历 COMPONENT_MAP，按注册顺序拼接，dedupe 同一组件对象引用。
 * 新增组件时无需再手动维护这个列表。
 * @returns {string}
 */
function collectClientScript() {
  const seen = new Set();
  return Object.values(COMPONENT_MAP)
    .filter(c => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .map(c => c.clientJs)
    .filter(Boolean)
    .concat([initSideNavScript()])
    .join('\n\n');
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
