/**
 * @component _inline
 * @version 0.2.3
 * @status 内部工具，不参与组件登记
 *
 * 组件共用的内联 markdown 处理工具。
 *
 * 用法：const { processInline, escapeHtml } = require('./_inline');
 *
 * 导出：
 *   - processInline(text) — 处理内联 markdown 语法 + 行内 LaTeX（$...$），输出 HTML
 *   - escapeHtml(text)    — 转义 HTML 特殊字符
 *
 * 支持的语法（顺序敏感）：
 *   1. `code`           → <code>code</code>
 *   2. **bold**         → <strong>bold</strong>
 *   3. *italic*         → <em>italic</em>
 *   4. [text](url)      → <a href="url">text</a>  （仅允许 http/https/mailto/# 协议）
 *   5. 换行符           → <br>
 *   6. $...$ LaTeX      → KaTeX 渲染（可选依赖：未装 katex 时降级为原样）
 *
 * v0.2.1 变更：JSDoc 同步 processInline 已支持 LaTeX（renderer.processInlineFormulas 升级后
 * 系统级问题 #1 已解决），之前说"不处理 $...$"过期。
 *
 * v0.2.3 变更：KaTeX 调用加 strict:'ignore'（关 \text{中文} 的 stderr 告警）；
 * 先剥 $...$ 块级公式再匹配行内 $...$，修 "相邻 display/inline 被串成跨段匹配" 错配。
 *
 * 字段契约：内部工具，无字段。
 */
//
// 所有输入先 escapeHtml，再做替换，保证 XSS 安全。
// katex 改为按需加载：未安装时 processInline 的 LaTeX 处理降级为 no-op，
// 与 renderer.js:117 processInlineFormulas() 保持一致策略，
// 避免 katex 变成项目级硬依赖。

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

/**
 * 判断一个 url 是否安全（白名单协议）
 * 避免 javascript: / data: 等危险协议
 */
function isSafeUrl(url) {
  if (!url) return false;
  // 锚点、相对路径、http(s)、mailto 都安全
  return /^(https?:\/\/|mailto:|#|\.{0,2}\/)/i.test(url.trim());
}

function processInline(s) {
  const raw = String(s == null ? '' : s);

  // 0) LaTeX inline math $...$ — 先于 \n/\t 转换提取到占位符，防止 \triangle 的 \t、
  //    \not 的 \n 被误替换（v0.2.2 修复：交换步骤 0 和 0.1 的顺序）
  // katex 按需加载：未安装时整段 LaTeX 处理降级为 no-op
  let katex;
  try { katex = require('katex'); } catch (e) { katex = null; }

  const mathSegments = [];
  let rawWithPlaceholders;
  if (!katex) {
    rawWithPlaceholders = raw; // katex 未安装：保留原文
  } else {
    // 0a) 先保护 $...$ 块级公式（v0.2.3）：避免被下面的行内 $...$ 正则错配。
    //     同一行 $S_n=...$。中文，$O(1)$ 若不先剥 display，会串成一个跨段匹配，
    //     把中文喂进 KaTeX 触发 unicodeTextInMathMode 告警（见 tabs-test.md:21）。
    let work = raw.replace(/\$\$([^$]+?)\$\$/g, (m, content) => {
      try {
        const html = katex.renderToString(content, {
          throwOnError: false,
          displayMode: true,
          strict: 'ignore',
        });
        const idx = mathSegments.length;
        mathSegments.push(html);
        return `\x00MATH${idx}\x00`;
      } catch (e) {
        return m;
      }
    });
    // 0b) 行内 $...$（strict:'ignore' 关掉 \text{中文} 的 stderr 告警，与 formula.js 对齐）
    work = work.replace(/\$([^$\n]+)\$/g, (m, content) => {
      try {
        const html = katex.renderToString(content, {
          throwOnError: false,
          displayMode: false,
          strict: 'ignore',
        });
        const idx = mathSegments.length;
        mathSegments.push(html);
        return `\x00MATH${idx}\x00`;
      } catch (e) {
        return m; // KaTeX 解析失败时保持原样
      }
    });
    rawWithPlaceholders = work;
  }

  // 0.1) JSON 字面 \n / \t 转真实字符（LaTeX 已提取为占位符，不受影响）
  const rawDecoded = rawWithPlaceholders.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

  let out = escapeHtml(rawDecoded);

  // 1) inline code 先处理，避免内部 * / [ 被误解析
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 2) bold (** 比 * 长，先匹配)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 3) italic
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 4) link [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
    if (!isSafeUrl(url)) return m; // 不安全协议保持原样
    // 二次 escape 防 escapeHtml 之后再注
    const safeText = escapeHtml(text);
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  });
  // 5) 换行
  out = out.replace(/\n/g, '<br>');

  // 6) 还原 LaTeX 段（占位符未 escape，含 < > 是 HTML 标签，直接插入）
  out = out.replace(/\x00MATH(\d+)\x00/g, (_, idx) => mathSegments[+idx]);

  return out;
}

module.exports = { processInline, escapeHtml };
