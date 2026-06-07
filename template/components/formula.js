/**
 * @component formula
 * @version 0.2.0
 * @status 打磨完成
 *
 * 公式组件（数学/化学/物理）
 *
 * 字段：
 *   - expr        {string}    必填 · 公式表达式（KaTeX 语法）
 *   - display     'block'|'inline'  可选 · 块级/行内（默认 block）
 *   - caption     {string}    可选 · 公式说明（走 processInline）
 *   - showExpr    {boolean}   可选 · 是否显示源表达式（默认 true）
 *
 * 渲染机制：编译时用 KaTeX 服务端渲染成 HTML，客户端无需 katex JS 即可看到公式。
 * KaTeX CSS 由 build.js 注入到产物 <style> 里。
 *
 * v0.2.0 变更：caption 走 processInline · 加 showExpr 折叠按钮 · 块级公式自动编号（按 h2 分组，1.1 / 1.2 / 2.1）
 *
 * 借鉴方向：编号字体（0.88em italic 可调）/ 公式引用（跨公式引用方案）/ 公式锚点（点击编号跳公式）
 * 详见 [COMPONENTS.md](../../COMPONENTS.md) § formula
 *
 * 已知问题：expr 字段写数学公式走 KaTeX，caption 走 processInline 不支持 $...$ LaTeX（系统级问题 #1）。
 */
// 行内公式不参与编号。numbered=false 可关闭单个公式的编号。

const katex = require('katex');

/**
 * 渲染单个公式
 * @param {object} data
 * @param {string} data.expr           LaTeX 表达式（必填）
 * @param {boolean} [data.display=true]   true=块级居中, false=行内
 * @param {string} [data.caption]         公式下方的说明文字（走 processInline，支持 **bold** / `code` / [link]()）
 * @param {boolean} [data.showExpr=false] 是否允许展开 LaTeX 源码（默认折叠，需要时点击展开）
 * @param {boolean} [data.numbered=true]  是否参与自动编号（display=true 时有效）
 * @returns {string} HTML
 */
function render(data) {
  const expr = String(data.expr || '').trim();
  const display = data.display !== false; // 默认块级
  const caption = data.caption || '';
  const showExpr = data.showExpr === true;
  const numbered = data.numbered !== false;

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

  // 块级公式：caption + 可选源码折叠
  // 编号占位（formula-num）由 clientJs 在运行时按 h2 分组填入
  let captionHtml = '';
  if (display) {
    const numHtml = numbered ? '<span class="formula-num"></span>' : '';
    const sourceBtnHtml = showExpr
      ? '<button type="button" class="formula-source-toggle" aria-expanded="false">显示源码</button>'
      : '';
    const sourceBlockHtml = showExpr
      ? `<pre class="formula-source" hidden><code>${escapeHtml(expr)}</code></pre>`
      : '';
    const captionTextHtml = caption ? `<span class="formula-caption-text">${processInline(caption)}</span>` : '';
    captionHtml = `<div class="formula-caption">${numHtml}${captionTextHtml}${sourceBtnHtml}</div>${sourceBlockHtml}`;
  } else {
    // 行内公式：caption 直接走 processInline（虽然实际很少用）
    captionHtml = caption ? `<span class="formula-caption-inline">${processInline(caption)}</span>` : '';
  }

  const displayClasses = [
    'formula',
    display ? 'formula-display' : 'formula-inline',
    numbered && display ? 'formula-numbered' : ''
  ].filter(Boolean).join(' ');

  return `<div class="${displayClasses}">${html}${captionHtml}</div>`;
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

// ============================================================
// 客户端脚本：自动编号 + 源码展开/折叠
// ============================================================
const clientJs = `
// Formula 自动编号 + 源码折叠
(function() {
  // 1) 自动编号：按 h2 章节分组，块级公式获得 "1.1 / 1.2 / 2.1 ..." 风格编号
  // 第一个 h2 之前的公式归到 section 1（hero 之后到第一个 h2 之间）
  var h2s = Array.prototype.slice.call(document.querySelectorAll('main h2, article h2, .content h2, body h2'));
  var sectionCounters = {};

  document.querySelectorAll('.formula-numbered .formula-num').forEach(function(numEl) {
    var formulaEl = numEl.closest('.formula-numbered');
    if (!formulaEl) return;

    // 找 formulaEl 之前最近的 h2
    var secIdx = 0;
    var el = formulaEl.previousElementSibling;
    while (el) {
      if (el.tagName === 'H2') {
        var idx = h2s.indexOf(el);
        if (idx >= 0) secIdx = idx;
        break;
      }
      el = el.previousElementSibling;
    }

    sectionCounters[secIdx] = (sectionCounters[secIdx] || 0) + 1;
    numEl.textContent = '公式 ' + (secIdx + 1) + '.' + sectionCounters[secIdx] + '　';
  });

  // 2) 源码折叠：点击按钮切换显示
  document.querySelectorAll('.formula-source-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var formula = btn.closest('.formula');
      if (!formula) return;
      var source = formula.querySelector('.formula-source');
      if (!source) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        source.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '显示源码';
      } else {
        source.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '隐藏源码';
      }
    });
  });
})();
`;

module.exports = { render, renderTrack, clientJs };
