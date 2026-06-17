# Changelog

本项目的所有重要变更记录。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)，
但 Slidecraft 的版本 = 功能里程碑（每加一个体系 +0.1）。

## [1.3.0] — 2026-06-17

### 品牌
- 项目正式定名 **Slidecraft**（前身 courseware），全量清理改名残留
- 版本号体系收敛：项目版本 = 里程碑号（1.0=MVP / 1.2=3D / 1.3=2D+通用叙事）
- 内部占位符 `CW-*` → `SC-*`，过时命令引用修正

### 新组件（组件数 16 → 23）
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
