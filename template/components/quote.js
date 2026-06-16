/**
 * @component quote
 * @version 0.1.0
 * @status 首次可用
 *
 * 引用语 / 重点金句组件
 *
 * 理念：markdown 原生 > 太朴素，没有"金句感"。
 * quote 组件用大字号 + 引号装饰 + 作者署名，提升内容氛围。
 * 适合名人名言、文献引用、重点结论。
 *
 * 字段：
 *   - id     {string} 可选 · 组件根 ID
 *   - text   {string} 必填 · 金句正文（走 processInline，支持 markdown + LaTeX）
 *   - author {string} 可选 · 作者/出处（走 processInline）
 *   - role   {string} 可选 · 作者身份/头衔（如"物理学家"，走 processInline）
 *   - align  'left'|'center'  可选 · 对齐（默认 center）
 *
 * v0.1.0 首版：
 *   - 大引号装饰（CSS ::before/::after）
 *   - text 大字号（h2 级），author 小字号 + em-dash 前缀
 *   - 居中（默认）/ 左对齐
 *   - 打印友好
 */

const { processInline, escapeHtml } = require('./_inline.js');

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('qt-' + Math.random().toString(36).slice(2, 8));
  const text = data.text || '';
  const author = data.author || '';
  const role = data.role || '';
  const align = data.align === 'left' ? 'left' : 'center';

  if (!text) {
    return `<div class="quote quote-error">quote 组件 text 为空，请检查 JSON。</div>`;
  }

  let footer = '';
  if (author || role) {
    const authorPart = author ? processInline(author) : '';
    const rolePart = role ? `<span class="quote-role">${processInline(role)}</span>` : '';
    footer = `<footer class="quote-footer">— ${authorPart}${author && role ? '，' : ''}${rolePart}</footer>`;
  }

  return `<blockquote class="quote quote-${align}" data-quote-id="${escapeHtml(id)}">
  <div class="quote-text">${processInline(text)}</div>
  ${footer}
</blockquote>`;
}

module.exports = { render };
