/**
 * @component feedback
 * @version 0.1.0
 * @status 首次可用
 *
 * 学习反馈组件（v1.10.0 质量守门机制的内容侧回路）
 *
 * 单文件离线课件不能也不应该做埋点——feedback 用「学员一键复制反馈回发作者」
 * 的方式（与题组复制成绩同一模式），把「哪份课件/哪一节没讲明白」的信号
 * 从真实读者手里收回来。这是内容不足的唯一可用探测器。
 *
 * 字段：
 *   - id      {string}  可选 · 组件 ID（缺省随机；影响 localStorage 记忆）
 *   - title   {string}  可选 · 反馈问题文案（默认「这节内容对你有帮助吗？」）
 *   - email   {string}  可选 · 作者邮箱，提供时额外渲染「邮件发送」按钮（mailto: 预填）
 *
 * 行为：
 *   - 👍 / 👎 二选一，选择记忆在 localStorage（重开保持）
 *   - 可选补充意见（textarea）
 *   - 提交后生成文本反馈单 →「复制反馈」+（可选）「邮件发送」
 *   - 打印态隐藏（反馈是交互件，纸上无意义）
 *
 * 已知限制：匿名单向通道——复制/邮件由学员手动发出，无服务端依赖（单文件哲学）。
 */

const { escapeHtml } = require('./_inline.js');

function render(data) {
  const id = data.id || ('fb-' + Math.random().toString(36).slice(2, 8));
  const title = data.title || '这节内容对你有帮助吗？';
  const email = typeof data.email === 'string' ? data.email.trim() : '';

  return `<div class="feedback" data-feedback-id="${escapeHtml(id)}" data-email="${escapeHtml(email)}">
  <div class="feedback-question">${escapeHtml(title)}</div>
  <div class="feedback-vote" role="group" aria-label="${escapeHtml(title)}">
    <button class="feedback-btn feedback-up" type="button" aria-pressed="false" title="有帮助">👍 有帮助</button>
    <button class="feedback-btn feedback-down" type="button" aria-pressed="false" title="需要改进">👎 需要改进</button>
  </div>
  <textarea class="feedback-comment" rows="3" placeholder="补充意见（可选）：哪里没讲清楚、想要什么例子……"></textarea>
  <div class="feedback-actions">
    <button class="feedback-submit" type="button">生成反馈</button>
  </div>
  <div class="feedback-done" hidden>
    <div class="feedback-thanks">谢谢反馈！把下面的内容发给作者即可：</div>
    <pre class="feedback-text"></pre>
    <div class="feedback-done-actions">
      <button class="feedback-copy" type="button">📋 复制反馈</button>
      ${email ? `<a class="feedback-mail" id="feedback-mail-${escapeHtml(id)}" href="#">✉️ 邮件发送</a>` : ''}
    </div>
  </div>
</div>`;
}

const clientJs = `
// 学习反馈交互（选择记忆 + 文本反馈单生成）
document.querySelectorAll('.feedback').forEach(function(fb) {
  var id = fb.getAttribute('data-feedback-id') || '';
  var email = fb.getAttribute('data-email') || '';
  var up = fb.querySelector('.feedback-up');
  var down = fb.querySelector('.feedback-down');
  var comment = fb.querySelector('.feedback-comment');
  var submit = fb.querySelector('.feedback-submit');
  var done = fb.querySelector('.feedback-done');
  var textEl = fb.querySelector('.feedback-text');
  var copyBtn = fb.querySelector('.feedback-copy');
  var mailLink = fb.querySelector('.feedback-mail');
  var verdict = null;
  var storeKey = 'sc-feedback:' + location.pathname + ':' + id;

  function paint() {
    up.classList.toggle('is-picked', verdict === 'up');
    down.classList.toggle('is-picked', verdict === 'down');
    up.setAttribute('aria-pressed', verdict === 'up' ? 'true' : 'false');
    down.setAttribute('aria-pressed', verdict === 'down' ? 'true' : 'false');
  }
  // 恢复上次选择（只恢复勾选，不自动提交——意见可能还没写）
  try {
    var saved = localStorage.getItem(storeKey);
    if (saved === 'up' || saved === 'down') { verdict = saved; paint(); }
  } catch (e) {}

  up.addEventListener('click', function() { verdict = 'up'; paint(); try { localStorage.setItem(storeKey, 'up'); } catch (e) {} });
  down.addEventListener('click', function() { verdict = 'down'; paint(); try { localStorage.setItem(storeKey, 'down'); } catch (e) {} });

  submit.addEventListener('click', function() {
    if (!verdict) {
      submit.textContent = '请先选 👍 或 👎';
      setTimeout(function() { submit.textContent = '生成反馈'; }, 1600);
      return;
    }
    var lines = ['【' + (document.title || '课件') + '】学习反馈',
      '评价：' + (verdict === 'up' ? '👍 有帮助' : '👎 需要改进')];
    var extra = (comment.value || '').trim();
    if (extra) lines.push('意见：' + extra);
    lines.push('—— 来自 Slidecraft 课件');
    var text = lines.join('\\n');
    textEl.textContent = text;
    if (mailLink) {
      mailLink.href = 'mailto:' + email +
        '?subject=' + encodeURIComponent('课件反馈：' + (document.title || '')) +
        '&body=' + encodeURIComponent(text);
    }
    fb.querySelector('.feedback-vote').hidden = true;
    comment.hidden = true;
    submit.hidden = true;
    done.hidden = false;
  });

  copyBtn.addEventListener('click', function() {
    // 复制走框架 __SCCopy（clipboard + execCommand 兜底）
    if (!window.__SCCopy) return;
    window.__SCCopy(textEl.textContent, function() {
      var old = copyBtn.textContent;
      copyBtn.textContent = '✓ 已复制';
      setTimeout(function() { copyBtn.textContent = old; }, 1600);
    });
  });
});
`;

module.exports = { render, clientJs };
