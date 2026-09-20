# 复审清单（Review Checklist）

> 对项目做一轮质量复审时按此清单逐项过。来源：v1.8.0 后两轮真实复审提炼——每一项都对应一个**实际抓到过**的 bug，不是理论清单。
> 机器能查的部分（build 校验 / `npm run check` / `npm test` / `npm run visual`）先跑完再开始人工项——人工只做机器做不了的。

## 1. 安全面（内少数派：每个点都要溯源）

- [ ] 所有运行时 `innerHTML` 赋值的字符串来源是 build 期 `processInline` / `escapeHtml` 产物，还是用户/学生可控输入？
- [ ] localStorage 读出的恢复值流向哪里？（只允许 `input.value` / `checked` / 程序化点击，不允许拼 HTML）
- [ ] 正则扫描类改动：对属性含 `>`、引号、CJK、`</script` 的输入是否安全？
- [ ] 新增外链是否过了协议白名单（http/https/mailto/#）？

## 2. 渐进增强与无障碍

- [ ] 新 UI 全部是 JS 注入（无 JS 时页面内容完整可读）？
- [ ] 新交互件在打印态 `display:none`（@media print 块）？
- [ ] 动效只在 `prefers-reduced-motion: no-preference` 下启用？
- [ ] 新导航/交互有键盘路径（focus-visible、Esc 收起、aria-current / aria-expanded / aria-pressed）？
- [ ] 新样式全走 token（grep 颜色字面量；`color-mix` 需 @supports 回退）？

## 3. 四态视觉（机器辅助，人工判读）

- [ ] `npm run visual` 六场景比对通过
- [ ] 暗色主题下新组件可读（dark-theme-test 页加临时示例看一眼）
- [ ] 移动端（<900px）：吸顶栏/抽屉/表格横向滚动行为正确
- [ ] 打印预览（Cmd+P）：侧栏隐藏、答案展开、无浮层残留、省墨

## 4. 边界数据（组件的手工 fuzz）

- [ ] 空/缺字段、超长文本（>100 字标题）、纯符号、emoji
- [ ] CJK 与 LaTeX 混排（`$a = 2 > 0$` 这类含 `>` 的公式进过属性/DOM 没有？）
- [ ] 组件 id：全页唯一、随机 id 警告触发、`{{1}}` 占位编号连续
- [ ] markdown 结构：4 反引号包裹层内展示组件示例、未闭合围栏、单行组件风格

## 5. 文档与登记一致性

- [ ] `npm run check` 全绿（dist-lint + check-registry）
- [ ] JSDoc `@version` / COMPONENTS.md / CHANGELOG 三处口径一致
- [ ] README 中英、SPEC、ai-authoring 中涉及本次改动的说法还成立吗（字段表、约束、特性列表）
- [ ] AGENTS.md 的不变量清单是否需要因本次改动更新

## 6. 复审产出纪律

- 每个发现记 P1-P4（P1 用户可见 bug / P2 会破坏体验的缺陷 / P3 文档失同步 / P4 卫生问题）
- 修复后：回归测试锁住 + CHANGELOG「复审修复」小节记录（沿用 1.8.0「复审四连修」先例）
