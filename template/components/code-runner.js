/**
 * @component code-runner
 * @version 0.1.0
 * @status 首次可用
 *
 * 代码 + 输出对照组件（预录制，非真运行）
 *
 * 理念：编程教学场景，作者贴一段代码 + 预期输出，
 * 学员点"▶ 运行结果"展开看输出对照。这是"教学演示"，
 * 不是"在线 IDE"——零依赖、单文件、不做真执行。
 *
 * 字段：
 *   - id     {string} 可选 · 组件根 ID
 *   - title  {string} 可选 · 组件标题（走 processInline）
 *   - lang   {string} 可选 · 语言标记（如 "python"，仅显示用，不做高亮）
 *   - code   {string} 必填 · 代码内容（纯文本，不解析 markdown）
 *   - output {string} 可选 · 预期输出（纯文本）
 *   - note   {string} 可选 · 输出下方的注释（走 processInline）
 *
 * v0.1.0 首版：
 *   - 代码块 + ▶ 运行结果折叠对照
 *   - 默认折叠输出，点击展开（clientJs）
 *   - 代码/输出用 monospace，深色背景（终端感）
 *   - 打印友好（打印时输出默认展开）
 *
 * 借鉴方向（v0.2+）：语法高亮（需引入 highlight.js，权衡零依赖）/ 多步执行
 */

const { processInline, escapeHtml } = require('./_inline.js');

function render(data) {
  if (!data || typeof data !== 'object') return '';
  const id = data.id || ('cr-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '';
  const lang = data.lang || '';
  const code = data.code != null ? String(data.code) : '';
  const output = data.output != null ? String(data.output) : '';
  const note = data.note || '';

  if (!code) {
    return '<div class="code-runner code-runner-error">code-runner 组件 code 为空，请检查 JSON。</div>';
  }

  const langBadge = lang ? '<span class="code-runner-lang">' + escapeHtml(lang) + '</span>' : '';
  const codeBlock = '<pre class="code-runner-code"><code>' + escapeHtml(code) + '</code></pre>';

  let outputSection = '';
  if (output) {
    outputSection = '<div class="code-runner-output-wrap">' +
      '<button class="code-runner-toggle" type="button"><span class="code-runner-icon">&#9654;</span> 运行结果</button>' +
      '<pre class="code-runner-output"><code>' + escapeHtml(output) + '</code></pre>' +
      '</div>';
  }

  const noteHtml = note ? '<div class="code-runner-note">' + processInline(note) + '</div>' : '';

  return '<div class="code-runner" data-code-runner-id="' + escapeHtml(id) + '">' +
    (title ? '<div class="code-runner-heading">' + processInline(title) + ' ' + langBadge + '</div>' : (langBadge ? '<div class="code-runner-heading">' + langBadge + '</div>' : '')) +
    codeBlock +
    outputSection +
    noteHtml +
    '</div>';
}

const clientJs = [
  "document.querySelectorAll('.code-runner').forEach(function(cr) {",
  "  var btn = cr.querySelector('.code-runner-toggle');",
  "  if (!btn) return;",
  "  var out = cr.querySelector('.code-runner-output');",
  "  var icon = btn.querySelector('.code-runner-icon');",
  "  btn.addEventListener('click', function() {",
  "    var opened = out.classList.toggle('is-open');",
  "    btn.classList.toggle('is-open', opened);",
  "    if (icon) icon.innerHTML = opened ? '\u25BC' : '\u25B6';",
  "  });",
  "});"
].join('\n');

module.exports = { render, clientJs };
