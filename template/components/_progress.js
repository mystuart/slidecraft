/**
 * @component _progress
 * @version 0.1.0
 * @status 内部工具（非组件，不进 COMPONENT_MAP）
 *
 * 学习进度持久化运行时（localStorage）
 *
 * 设计决策：
 *   - key 以页面 pathname 命名空间隔离——同一台设备上多份课件互不干扰
 *   - 所有 localStorage 访问 try/catch：Safari 隐私模式 / 存储被禁 / file:// 异常时
 *     静默降级为"不持久化"，课件交互本身不受影响
 *   - 恢复采用「重放」策略：恢复 quiz 时先勾选保存的选项、再程序化触发一次提交，
 *     让判分/样式/自定义事件走与真人作答完全相同的链路——不存在第二套恢复逻辑
 *
 * 接入方（clientJs 侧）：
 *   - quiz.js       — 每题存 { sel, done }，重放走 replayQuiz
 *   - quiz-track    — 题组另存 { active, summary }（key 由组内题目 id 派生，内容变即失效）
 *   - fill-blank.js — 存 { values, checked }
 *
 * 无字段契约（内部工具）。
 */

function getProgressRuntime() {
  return `
// 学习进度持久化（localStorage，降级安全）
window.__SCProgress = (function() {
  var PREFIX = 'sc-progress:' + (location.pathname || 'local');
  function k(id) { return PREFIX + ':' + id; }
  function save(id, obj) {
    try { localStorage.setItem(k(id), JSON.stringify(obj)); } catch (e) {}
  }
  function load(id) {
    try {
      var v = localStorage.getItem(k(id));
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  function clear(id) { try { localStorage.removeItem(k(id)); } catch (e) {} }
  // 重放一道已作答 quiz：quizEl.__scSaved = { sel: [optionId...], done: true }
  function replayQuiz(quizEl) {
    var saved = quizEl.__scSaved;
    if (!saved || !saved.sel || !saved.sel.length) return;
    saved.sel.forEach(function(oid) {
      var opt = quizEl.querySelector('.quiz-option[data-option-id="' + oid + '"]');
      var inp = opt && opt.querySelector('input');
      if (inp) inp.checked = true;
    });
    if (saved.done) {
      var btn = quizEl.querySelector('.quiz-check');
      if (btn && !btn.disabled) btn.click();
    }
  }
  return { save: save, load: load, clear: clear, replayQuiz: replayQuiz };
})();
`;
}

module.exports = { getProgressRuntime };
