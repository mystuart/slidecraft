// formula.js — 公式组件（数学/化学/物理）
// 编译时用 KaTeX 服务端渲染成 HTML，客户端无需 katex JS 即可看到公式
// KaTeX CSS 由 build.js 注入到产物 <style> 里

const katex = require('katex');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

/**
 * 渲染单个公式
 * @param {object} data
 * @param {string} data.expr      LaTeX 表达式（必填）
 * @param {boolean} [data.display=true]  true=块级居中, false=行内
 * @param {string} [data.caption]        公式下方的说明文字
 * @param {boolean} [data.showExpr=false] 是否在 caption 里同时显示 LaTeX 源码
 * @returns {string} HTML
 */
function render(data) {
  const expr = String(data.expr || '').trim();
  const display = data.display !== false; // 默认块级
  const caption = data.caption || '';
  const showExpr = data.showExpr === true;

  if (!expr) {
    return `<div class="formula formula-error">⚠ 公式为空（expr 字段必填）</div>`;
  }

  let html;
  try {
    html = katex.renderToString(expr, {
      displayMode: display,
      throwOnError: true,
      strict: 'ignore',
      output: 'html',
      trust: false
    });
  } catch (e) {
    return `<div class="formula formula-error">
      <strong>⚠ 公式解析失败</strong>
      <div class="formula-error-msg">${escapeHtml(e.message)}</div>
      <code class="formula-error-src">${escapeHtml(expr)}</code>
    </div>`;
  }

  const captionHtml = caption
    ? `<div class="formula-caption">${escapeHtml(caption)}${showExpr ? ` <code class="formula-source">${escapeHtml(expr)}</code>` : ''}</div>`
    : '';

  return `<div class="formula ${display ? 'formula-display' : 'formula-inline'}">${html}${captionHtml}</div>`;
}

/**
 * 渲染多公式（carousel 风格，跟 quiz-track 对齐）
 * @param {object[]} arr
 * @returns {string} HTML
 */
function renderTrack(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return `<div class="formula formula-error">⚠ 公式数组为空</div>`;
  }
  return arr.map(render).join('');
}

module.exports = { render, renderTrack };
