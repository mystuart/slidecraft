/**
 * @component _highlight
 * @version 0.1.0
 * @status 内部工具（编译时语法高亮）
 *
 * 编译时语法高亮工具（highlight.js 封装）
 *
 * 理念：语法高亮在 build 期完成（像 KaTeX），产物 HTML 含 <span class="hljs-xxx">，
 * 零运行时依赖。markdown 代码块和 code-runner 都走这里。
 *
 * 用法：
 *   const { highlight, highlightAuto } = require('./_highlight.js');
 *   highlightAuto(code)        // 自动检测语言
 *   highlight(code, 'python')  // 指定语言
 *
 * 未装 highlight.js 时优雅降级（返回 escapeHtml 原文）。
 */

let hljs = null;
let triedLoad = false;

function loadHljs() {
  if (triedLoad) return hljs;
  triedLoad = true;
  try {
    hljs = require('highlight.js');
  } catch (e) {
    hljs = null;
  }
  return hljs;
}

const { escapeHtml } = require('./_inline.js');

/**
 * 指定语言高亮
 * @param {string} code 原始代码
 * @param {string} lang 语言（如 'python'）
 * @returns {string} 带 <span class="hljs-xxx"> 的 HTML
 */
function highlight(code, lang) {
  const lib = loadHljs();
  code = code == null ? '' : String(code);
  if (!lib) return escapeHtml(code);
  try {
    if (lang && lib.getLanguage(lang)) {
      return lib.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    return lib.highlightAuto(code).value;
  } catch (e) {
    return escapeHtml(code);
  }
}

/**
 * 自动检测语言高亮
 * @param {string} code 原始代码
 * @returns {string} 高亮 HTML
 */
function highlightAuto(code) {
  const lib = loadHljs();
  code = code == null ? '' : String(code);
  if (!lib) return escapeHtml(code);
  try {
    return lib.highlightAuto(code).value;
  } catch (e) {
    return escapeHtml(code);
  }
}

module.exports = { highlight, highlightAuto, loadHljs };
