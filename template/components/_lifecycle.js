/**
 * @component _lifecycle
 * @version 0.1.0
 * @status 内部工具，不参与组件登记
 *
 * 组件生命周期基础设施（架构债 C2-4/5 + H4 的统一解法）。
 *
 * 背景：全仓原本零 removeEventListener / 零 disconnect / 零 cancelAnimationFrame。
 * 8 个组件在 document/window 上挂监听、开永续 RAF 循环、建 ResizeObserver 都不释放。
 * 单页课件从不销毁组件所以不炸，但 SPA 嵌入 / 热重载 / 多实例 / 内存分析会泄漏。
 *
 * 解法：每个组件 init 时拿一个 lifecycle 句柄，用它登记所有可释放资源；
 * destroy() 一次性回滚。renderer.js 把本文件的 runtime 字符串作为所有组件
 * clientJs 的最前缀注入，保证 createLifecycle 在任何组件 init 前可用。
 *
 * 用法（组件 clientJs 里）：
 *   var lc = createLifecycle(rootEl);
 *   function onKey(ev) { ... }
 *   lc.doc('keydown', onKey);          // document 监听，destroy 自动移除
 *   lc.win('resize', onResize);         // window 监听
 *   lc.observer(resizeObs);             // ResizeObserver / IntersectionObserver
 *   lc.raf(rafId);                      // requestAnimationFrame 句柄
 *   lc.timeout(timerId);                // setTimeout 句柄
 *   lc.dispose(function(){ controls.dispose(); });  // 自定义清理（OrbitControls / WebGLRenderer 等）
 *   // 全局销毁：document.dispatchEvent(new CustomEvent('sc:destroy'))
 *
 * 字段契约：内部工具，无字段。
 */

// ============================================================
// 浏览器端 runtime —— 以字符串形式注入产物 <script>，
// 是所有组件 clientJs 的最前缀（见 renderer.collectClientScript）。
// 注意：这里用字符串拼接而非 require，因为整个 clientJs 体系就是字符串拼接。
// ============================================================
function getLifecycleRuntime() {
  return `
// Slidecraft 生命周期基础设施（_lifecycle.js runtime）
// 全局句柄注册表，支持 sc:destroy 事件批量销毁（SPA 嵌入 / 热重载场景）。
window.__SC_LIFECYCLES = window.__SC_LIFECYCLES || new Set();

// 批量销毁监听：document.dispatchEvent(new CustomEvent('sc:destroy'))
// 现有单页课件不触发此事件，行为零变化。
document.addEventListener('sc:destroy', function() {
  window.__SC_LIFECYCLES.forEach(function(lc) { try { lc.destroy(); } catch (e) {} });
  window.__SC_LIFECYCLES.clear();
});

function createLifecycle(rootEl) {
  var lc = {
    root: rootEl,
    _doc: [],          // [[event, fn]]
    _win: [],          // [[event, fn]]
    _observers: [],    // [ResizeObserver | IntersectionObserver | ...]
    _rafs: [],         // [rafId]
    _timeouts: [],     // [timerId]
    _disposers: [],    // [fn]  自定义清理（OrbitControls.dispose / renderer.dispose 等）
    _destroyed: false,
    // 登记 document 监听（返回 lc 供链式）
    doc: function(ev, fn) {
      if (this._destroyed) return this;
      document.addEventListener(ev, fn);
      this._doc.push([ev, fn]);
      return this;
    },
    // 登记 window 监听
    win: function(ev, fn) {
      if (this._destroyed) return this;
      window.addEventListener(ev, fn);
      this._win.push([ev, fn]);
      return this;
    },
    // 登记 Observer（ResizeObserver / IntersectionObserver / MutationObserver）
    observer: function(o) { this._observers.push(o); return this; },
    // 登记 requestAnimationFrame 句柄
    raf: function(id) { this._rafs.push(id); return this; },
    // 登记 setTimeout 句柄
    timeout: function(id) { this._timeouts.push(id); return this; },
    // 登记自定义清理函数（OrbitControls.dispose / WebGLRenderer.dispose / 等）
    dispose: function(fn) { this._disposers.push(fn); return this; },
    // 一次性销毁所有登记的资源（幂等）
    destroy: function() {
      if (this._destroyed) return;
      this._destroyed = true;
      var i, pair;
      for (i = 0; i < this._doc.length; i++) {
        pair = this._doc[i];
        try { document.removeEventListener(pair[0], pair[1]); } catch (e) {}
      }
      for (i = 0; i < this._win.length; i++) {
        pair = this._win[i];
        try { window.removeEventListener(pair[0], pair[1]); } catch (e) {}
      }
      for (i = 0; i < this._observers.length; i++) {
        try { this._observers[i].disconnect(); } catch (e) {}
      }
      for (i = 0; i < this._rafs.length; i++) {
        try { cancelAnimationFrame(this._rafs[i]); } catch (e) {}
      }
      for (i = 0; i < this._timeouts.length; i++) {
        try { clearTimeout(this._timeouts[i]); } catch (e) {}
      }
      for (i = 0; i < this._disposers.length; i++) {
        try { this._disposers[i](); } catch (e) {}
      }
      window.__SC_LIFECYCLES.delete(this);
    }
  };
  window.__SC_LIFECYCLES.add(lc);
  return lc;
}
`;
}

module.exports = { getLifecycleRuntime };
