// _inline.js — 组件共用的内联 markdown 处理工具
// 用法：const { processInline } = require('./_inline');
//
// 支持的语法（顺序敏感）：
//   1. `code`           → <code>code</code>
//   2. **bold**         → <strong>bold</strong>
//   3. *italic*         → <em>italic</em>
//   4. [text](url)      → <a href="url">text</a>  （仅允许 http/https/mailto/# 协议）
//   5. 换行符           → <br>
//
// 所有输入先 escapeHtml，再做替换，保证 XSS 安全。
const katex = require('katex');

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

  // 0) LaTeX inline math $...$ — 先在 raw 上提取到占位符，escapeHtml 后还原
  const mathSegments = [];
  const rawWithMath = raw.replace(/\$([^$\n]+)\$/g, (m, content) => {
    try {
      const html = katex.renderToString(content, { throwOnError: false, displayMode: false });
      const idx = mathSegments.length;
      mathSegments.push(html);
      return `\x00MATH${idx}\x00`;
    } catch (e) {
      return m; // KaTeX 解析失败时保持原样
    }
  });

  let out = escapeHtml(rawWithMath);

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
