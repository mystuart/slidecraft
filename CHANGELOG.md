# Changelog

本项目的所有重要变更记录。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)，
但 Slidecraft 的版本 = 功能里程碑（每加一个体系 +0.1）。

## [1.5.0] — 2026-06-18

### 品牌升级（feat(brand) · 7412ef6）
- **层叠卡片 Logo 定型**——`assets/logo.svg` / `logo-mark.svg` / `logo-mono-white.svg` / `logo-mark-32.svg` 4 件资产，"craft + slide" 双关语义 + Lusion 几何积木风格。Wordmark 跟 UI 字体统一（system sans 800），mark 永远 `#8b7dd8` 实心 + 白 S。
- **favicon 32×32 优化版**——内联到 `template/index.html.tpl`（data URI），去掉半透深度层，16px 仍清晰。
- **OG image 动态生成**——`build.js:buildOgImage()`，每个课件自动生成专属 Open Graph 图。
- **品牌规范文档**——[`docs/brand.md`](./docs/brand.md)（89 行）锁定 logo 概念 / 资产清单 / 配色 / 排版 / 使用规则 / 设计决策记录，避免后人误改。

### Landing 落地页（feat(landing) · 165c422 + e26c456 + 2010248）
- **GitHub Pages 根页**——`content/index.md`（dark 主题），作为项目 landing，链向 showcase / 2d-showcase / binary-card-trick / how-to-create-skill 等亮点课件。
- **Lusion 风格层叠布局**——`template/styles/landing.css`，卡片层叠 + 几何积木感 + 3D 旋转装饰（用 `autoRotate: true` 的 geometry-3d 做主视觉），与品牌 mark 视觉同源。
- **CSS 表驱动自动接入**——`build.js:COMPONENT_CSS` 加 `landing-hero` marker → 自动注入 landing.css，无需改 build.js 其他地方。
- **三角柱定位修复**（2010248）——landing 用 `<article class="landing-hero">` 包裹 3D 组件，相对 article 而非整页定位，hero 卡片缩放/位移时三角柱跟随。

### geometry-3d autoRotate（feat(geometry-3d) · e9da11f · v0.1.9 → v0.2.0）
- **新增 `autoRotate` / `autoRotateSpeed` 字段**——OrbitControls 原生能力，`animate()` 已调 `controls.update()` 自动生效。
- **默认关**，配 `autoRotate: true` 开启。`autoRotateSpeed` 默认 2.0（OrbitControls 标准），landing 装饰建议 1.0-1.5。
- **教学场景**：「展示旋转立体」/ 「演示正 n 面体对称性」/ landing 装饰。

### npm 脚本完善
- **`build:three` 暴露成 npm script**（package.json）—— 之前 build.js 第 306 行有 esbuild 命令字符串，但只埋在内部分支用，没暴露成 npm script。`npm run build:three` 现在一键打包 Three.js bundle。

### 文档
- 全部 README / CHANGELOG / package.json / docs/ 校对同步到本版本（**25 个组件数对齐**，quiz-track 算独立组件名）

## [1.4.0] — 2026-06-17

### 架构债清零（C2-4/5 + H4：组件生命周期）
- **新增 `_lifecycle.js` 基础设施**（内部工具）—— `createLifecycle(root)` per-element 句柄，统一登记 doc/win 监听 / observer / raf / timeout / 自定义 disposer；`destroy()` 幂等回滚；全局 `__SC_LIFECYCLES` + `sc:destroy` 事件批量销毁。
- **8 个泄漏组件全接入**：coords-2d / function-plot / intersection-marker（5 个总线监听 + resize）/ geometry-3d（全局 keydown + 永续 RAF + ResizeObserver）/ cut-anim / trajectory / tetra-equiv / renderer scroll-spy。匿名 handler 全改具名。
- **4 个 3D 组件额外登记 WebGL 资源释放** disposer（OrbitControls.dispose / geometry+material.dispose / renderer.dispose）。
- **现有 UX 零影响**：destroy 仅在显式 `sc:destroy` 触发时跑，单页课件不触发 = 行为与今天完全一致。SPA 嵌入 / 热重载 / 多实例场景不再泄漏。

### KaTeX 公式渲染修复
- **行内 `$...$` 正则错配 + CJK stderr 告警**（`_inline.js` v0.2.3、`renderer.js`）—— 原 regex 不识别 `$...$` display 分隔符，把 `$S_n=...$。中文，$O(1)$` 这种「行内公式 + 中文句号 + 第二个行内公式」串成跨段匹配，中文喂进 KaTeX 触发 26 条 `unicodeTextInMathMode` 告警 + 垃圾 katex-error span。**修复**：先剥 `$...$` 占位保护再匹配行内；KaTeX 调用统一加 `strict: 'ignore'`。产物 -199KB（全是错配产生的垃圾 error span）。

### build.js 重构
- **CSS 注入改表驱动**（消除 4 处重复条件块）—— `COMPONENT_CSS` 清单表循环加载 + join 拼接，单一同步点。新增组件 CSS 只需往表里加一行。

### 文档修复
- **COMPONENTS.md 去重**（历史遗留腐烂）—— 整个大段内容重复 3 次 + 3 处被 YAML frontmatter 截断，无一份完整。重建为单一干净副本（618 → 326 行），从 3 份残卷拼回完整「已知系统级问题」1-9 条，新增决策记录 #13。

### 版本号
- 内部工具：`_inline` v0.2.3、`_lifecycle` v0.1.0（新增）、`renderer` v0.3.0
- 组件接入：geometry-3d v0.1.9、cut-anim v0.1.3、trajectory v0.1.1、tetra-equiv v0.1.3、coords-2d v0.1.1、function-plot v0.1.1、intersection-marker v0.1.1

### 测试
- npm test: **38/38**（新增 13 个回归测试：6 个 KaTeX inline-math + 7 个 lifecycle）

## [1.3.0] — 2026-06-17

### 品牌
- 项目正式定名 **Slidecraft**（前身 courseware），全量清理改名残留
- 版本号体系收敛：项目版本 = 里程碑号（1.0=MVP / 1.2=3D / 1.3=2D+通用叙事）
- 内部占位符 `CW-*` → `SC-*`，过时命令引用修正

### 新组件（组件数 17 → 24）
- **timeline** — 时间线（vertical/horizontal 双模式，历史/流程）
- **chart** — 数据图表（bar/line/pie 编译时静态 SVG）
- **tabs** — 标签页切换（并列对比：多解法/多视角）
- **stat-grid** — 数据卡片墙（关键数字 + 趋势标记）
- **quote** — 引用语/金句（大字号 + 引号装饰）
- **diagram** — 流程图/关系图（编译时 SVG，3 形状 + 5 语义配色）
- **code-runner** — 代码 + 输出对照（预录制，折叠展开）

### 视觉系统
- **dark 主题**（兑现"主题可换"承诺，bg #1a1a24 / text 95% 白）
- 四级字号系统（display/heading/body/label，45 处硬编码变量化）
- callout 图标 emoji → 内联 SVG（解决跨平台渲染不一致）
- 颜色全变量化（on-* 语义文字色 + border 色跨主题适配）
- **编译时语法高亮**（highlight.js，markdown 代码块 + code-runner 均受益，零运行时）

### 架构债清理
- **#3 KaTeX 静默降级** → build 期收集 katex-error，汇总报告 + exit 1
- **#4 sections↔h2 不一致** → 升级为 strict 模式（console.error + exit 1）
- **C2-2 定时器地狱** → 2D 渲染链改事件驱动（coords:ready → funcplot:ready），消除 14 个猜测式 setTimeout
- 顺手修复 1 个静默坏掉的公式（gaokao-2020-jiangsu-q18.md）

### 开发体验
- **测试框架**（Node 原生 node:test，25 个测试覆盖数值算法 + build 校验）
- **--watch / npm run dev**（fs.watch + http.server，改 .md 自动重 build）

## [1.2.0] — 2D 平面几何体系 + 3D 打磨

### 新组件
- **coords-2d** — 平面坐标系（函数曲线/交点/滑块联动的底座）
- **function-plot** — 函数图像（polynomial/sine/conic，v0.1.1 加 conic_ellipse）
- **intersection-marker** — 交点标记（手动 + polynomial 自动求交）
- **slider** v2 — 滑块联动 form-B（关联 geometry-3d / function-plot）
- **trajectory** — 轨迹动画（slider 联动画路径）
- **tetra-equiv** — 同体异构四面体
- **cut-anim** — 剖切动画

### 3D 体系打磨
- plane 三角形化 + auxLines 步骤 toggle
- 触摸板旋转修复 + Z 轴自转 + 坐标系校准
- Three.js 拆外链 + hash 缓存破坏（A1 性能优化）
- API 改 per-instance 闭包（A2 架构优化）

### 数值算法
- `_geom_utils.js` 抽出共享工具：polyEval / polyDeriv / polyRealRoots
- 修复重根漏掉 bug（C1-1）：二次公式 Δ=0 分支

## [1.0.0] — MVP

### 核心架构
- Markdown → 单文件 HTML 编译器（zero runtime · 单文件分发）
- 10 个基础组件：hero / quiz / concept-card / callout / formula / step-guide / compare / fill-blank / math-step / quiz-track
- geometry-3d 组件（Three.js，可转/可切/可高亮）
- KaTeX 公式、marked、主题系统（lavender）
- sidebar 章节导航 + 打印友好

### 基础设施
- build.js CLI（单文件 / 全量 / --inline-three 三种模式）
- processInline 行内 markdown + LaTeX
- 组件注册机制（COMPONENT_MAP + clientJs 自动收集）

---

版本号约定详见 [SPEC.md](./SPEC.md)。
