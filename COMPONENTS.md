---
title: 组件登记簿
summary: Slidecraft 交互课程框架的组件维护档案。概览、v0.x.x 状态、借鉴方向、系统级问题、决策记录、待办。
category: registry
type: registry
created: 2026-06-05
updated: 2026-06-12
related:
  - SPEC.md
  - README.md
  - template/components/
---

# 组件登记簿

> 这是组件的**实时维护档案**。`SPEC.md` 是规范文档（讲"应该是什么样"），本文件是维护记录（讲"现在是什么样、打磨方向在哪"）。两者冲突时，**以本文件为准**——SPEC.md 需要跟着更新。
>
> 配套讨论画布：`content/components-showcase.md` —— 每个组件都有 2+ 个真实示例，跑 build 后可在 `dist/components-showcase.html` 看渲染效果。
>
> 字段契约散落在 `template/components/<name>.js` 顶部 JSDoc 里（**信息源唯一化**），不在本文件复述。

---

## 概览

| # | 组件 | 版本 | 状态 | 首次可用 | 最近更新 |
|---|---|---|---|---|---|
| 1 | hero | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-05 |
| 2 | quiz | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-05 |
| 3 | quiz-track | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 4 | fill-blank | v0.2.1 | 🟢 打磨完成 | 2026-06-05 | 2026-06-08 |
| 5 | step-guide | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 6 | compare | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 7 | concept-card | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 8 | callout | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-05 |
| 9 | formula | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 10 | math-step | v0.2.1 | 🟢 打磨完成 | 2026-06-05 | 2026-06-12 |
| 11 | geometry-3d | v0.1.7 | 🟡 首次可用（多能力迭代中） | 2026-06-08 | 2026-06-12 |
| 12 | slider | v0.1.2 | 🟡 首次可用（form-B 联动 function-plot 已加） | 2026-06-10 | 2026-06-13 |
| 13 | tetra-equiv | v0.1.0 | 🟡 首次可用 | 2026-06-11 | 2026-06-11 |
| 14 | cut-anim | v0.1.0 | 🟡 首次可用 | 2026-06-11 | 2026-06-11 |
| 15 | coords-2d | v0.1.0 | 🟡 首次可用 | 2026-06-13 | 2026-06-13 |
| 16 | function-plot | v0.1.0 | 🟡 首次可用 | 2026-06-13 | 2026-06-13 |
| 17 | intersection-marker | v0.1.0 | 🟡 首次可用 | 2026-06-13 | 2026-06-13 |
| 18 | timeline | v0.1.0 | 🟡 首次可用 | 2026-06-15 | 2026-06-15 |
| 19 | _geom_utils | v0.2.0 | 🟡 内部工具（polyEval/Deriv/RealRoots + tetra 等） | 2026-06-11 | 2026-06-13 |

**状态图例**：🟢 打磨完成 · 🟡 待打磨 · 🔴 打磨中 · ⚪ 弃用

**版本号约定**：
- **v0.1.0** — 首次可用，但字段/视觉/交互都还没经过讨论打磨
- **v0.2.0+** — 经过至少 1 轮打磨，字段或视觉有调整
- **v1.0.0** — 老板签字"打磨完成"，进入稳定状态
- **v1.x.y** — bugfix 或微调，不破坏字段契约
- 版本号跟随**组件本身的契约**变化，而不是 renderer.js 里的代码改动

---

## 借鉴方向（学习源：nexu-io/html-anything）

**核心借鉴**：「**设计签名 + 铁律**」—— 每个 skill 配严选 palette（4 选 1）+ 字体分工（display / body / mono / 中文）+ 版式池 + 「绝不」清单（drop-shadow / 圆角 / 渐变 / 霓虹色）。相比"通用 HTML 默认风格 + 5 个自由切换主题"，html-anything 是"少而精 + 严选 + 克制"。

### 全局打磨方向（适用于所有组件）

1. **给每个主题配「设计签名」**（不只换色）—— 当前 5 个主题只是色调不同；html-anything 4 套配色各有 accent + paper + ink 三色 + 字体约束 + 铁律。**方向**：每个主题补"签名段"（accent / paper / ink / 字体 / 圆角策略 / 阴影策略）。
2. **字号极端反差**—— display 9.6vw vs body 14-16px vs label 11px。**方向**：课件建立 4 级字号系统（display 4-5rem / h2 1.75-2rem / body 1rem / label 0.75rem uppercase）。
3. **「绝不」清单**（铁律）—— dark 主题不要纯白文字（用 95% 白）；lavender 主题不要霓虹色 accent。
4. **Ground texture**—— 1-2 个主题试 ground texture（lavender 加 dot pattern 9% / dark 加 grid 6%）。
5. **Hairline 描边代替阴影**—— 默认 hairline 1px 描边代替 box-shadow（更印感、更克制）。
6. **字体系统化分工**—— 4 种字体各司其职（display / body / 中文 / 数字 mono），组件 CSS 通过 CSS 变量引用。
7. **「被排过版的纸」质感**—— detail 元素按"印感"打磨：metadata 用 hairline 分隔，footnote 用 1px 顶 rule + 0.8rem 灰字，page number 用 11px uppercase 角标。

### 逐组件打磨方向（v0.2 路线图）

> MVP 10 组件的"当前"+"下一步"放在这里（v0.1 阶段 geometry-3d 借鉴方向 7 个项目，2ba17a4 后已大半实现，单独成文 schema）。3D 体系（geometry-3d / slider / tetra-equiv / cut-anim）的字段细节看 `docs/*.md`。

#### 1. hero *(v0.2.0 已打磨)*
- **当前**：背景色 + 大标题 + 副标题 + 可选 CTA + emoji。
- **借鉴**：S01 Cover「accent 全屏 + ASCII 呼吸点阵 + 反白标题 + 元数据 chrome（date / № / topic）」
- **方向**：加 ground texture · 元数据 chrome（右下角 №N/M 章号 + 左下角 topic 标签）· display 字号（标题 4-5rem）· emoji 切到 SVG 图标。

#### 2. quiz *(v0.2.0 已打磨)*
- **借鉴**：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
- **方向**：题型分类标签（概念题 / 计算题 / 应用题）—— 给 quiz 加 `category` 字段？· 多选状态机（未选 / 部分选 / 全选错 / 全选对 / 提交后）的颜色规范 · feedback 折叠/展开默认决策。

#### 3. quiz-track *(v0.2.0 已打磨)*
- **当前**：题组 carousel，dots 容器加 hairline 时间轴（灰轴 + 已答段绿 hairline，宽度由 `--quiz-progress-width` 变量驱动），节点 hairline 描边 4 态（default/correct/partial/wrong），完成时 callout 内嵌 4 stat 总结（总题数/全对/部分对/答错），next 按钮 3 态分发。
- **方向**：答对自动跳下一题（流畅感 vs 允许回头看）· 移动端/窄屏 prev/next 文字可改纯箭头 · 进度 hairline 当前按"已答总数"算，若想表达"连续答对"需换算法。

#### 4. fill-blank *(v0.2.1 已打磨)*
- **当前**：v0.2.0 加多空 `{{1}}` 占位 + 每空独立等价集合 + 旧 `answer: "H|O"` 写法兼容。v0.2.1 加占位编号硬校验（必须 `{{1}} {{2}} {{3}}` 连续，无跳号重复）。
- **借鉴**：parchment 风格的填空「被填进纸里」（hairline 描边输入框，不用浮起的 box-shadow 输入框）。
- **方向**：等价答案规则再扩（unicode 标准化 / 去中间空格）· 判分粒度（全对 vs 部分得分）· 显示/隐藏答案按钮。

#### 5. step-guide *(v0.2.0 已打磨)*
- **当前**：tab 切换，按钮组形式。`title` 走 processInline；`example` 字段默认展开 + 可折叠（HTML `<details>` 原生，零 JS）。
- **下一步可选**：tab 视觉从"按钮组"改为"timeline 节点"· 当前 step 序号角标 · 移动端 tab 横滑 · example 代码高亮（hljs 集成）。

#### 6. compare *(v0.2.0 已打磨)*
- **当前**：左右两列 + 4 tag 颜色 + `mode` 字段控制语义（good-bad / before-after / neutral）+ "vs" 圆牌 + warn 加边框增强对比。
- **下一步可选**：points 数量上限折叠（> 6 项时折叠）· 横向响应式（移动端两列改纵向）· "vs" 圆牌可换成箭头/方向指示。

#### 7. concept-card *(v0.2.0 已打磨)*
- **当前**：网格 + icon + 标题 + 描述。`title` 走 processInline；`iconType` 字段路由 emoji/svg/image 三种 icon 写法。
- **下一步可选**：响应式（移动端 4 列降级到 2 列 / 1 列的断点）· 是否切到统一 SVG 图标库。

#### 8. callout *(v0.2.0 已打磨)*
- **当前**：5 种 type（tip / warning / info / danger / note），调色板：tip 绿 / warning 琥珀 / info 蓝 / danger 红 / note 紫。
- **方向**：✅ 调色板定型（2026-06-05）· 每个 type 配一个 SVG icon 统一视觉签名 · 内容超过 N 行默认折叠？

#### 9. formula *(v0.2.0 已打磨)*
- **当前**：KaTeX 编译时 + caption 走 processInline + showExpr 折叠按钮 + 块级公式自动编号。
- **下一步可选**：编号字体（当前用 0.88em italic）· 公式引用（"由公式 1.1 得..." 跨公式引用方案）· 公式锚点（点击编号跳到公式）。

#### 10. math-step *(v0.2.1 已打磨)*
- **当前**：v0.2.1 加 step 联动 geometry-3d（hover → setHighlight）· v0.2.0 4 折叠区统一琥珀色 + 默认展开 + hairline 进度条 + `celebrate: false` 开关。
- **下一步可选**：单 step 内进度（"看完了提示"不算"完成"，是不是要二级进度？）· 折叠区支持折叠回默认（现在 `open` 是硬编码的）· 进度条完成态加点动效（避免太干）。

#### 11. geometry-3d *(v0.1.7)*
- **当前**：v0.1.7 已有 30+ 字段（vertices / planes / auxLines / derivedVertices / rightAngles / id），9 种几何体（triangular-prism v0.1.2 真正实现），触摸板 / Z 轴自转 / camera.up=+Z 校准 / per-instance 闭包 / 三角面 / math-step 联动。
- **字段契约**：[`docs/geometry-3d-schema.md`](./docs/geometry-3d-schema.md)（v0.1.7，含 4 个示例：正方体 / 三角柱+辅助线池+math-step 联动 / slider 联动 / 错误回退）。
- **v0.2+ 路线图**：`clippingPlane`（物理剖切）/ `views: "three"`（三视图）/ `unfold`（展开图）/ `mode` 状态机 + Raycaster 命中高亮。

#### 12-14. slider / tetra-equiv / cut-anim *(v0.1)*
- 三个 3D 联动组件，字段契约见 `docs/slider-schema.md` / `docs/tetra-equiv-schema.md` / `docs/cut-anim-schema.md`。
- **v0.2 路线图**：slider 加键盘 ←/→ 微调 + 输入框数字回写；tetra-equiv 加"按底面积排序"图例 + 4 锥独立相机视角；cut-anim 加 3 段速（匀速 / 缓入缓出 / 弹跳）。
- **体积影响**：约 730KB（Three.js + OrbitControls + CSS2DRenderer，esbuild 打 IIFE）。build.js 检测到 `.geom-3d` class 才注入；`--inline-three` 模式可强制内联（Alice 内网离线部署）。
- **v0.2+ 路线图**：
  - `clippingPlane` —— Three.js 物理剖切平面（注意：cut-anim 走的是透明度动画路线，不是 clippingPlane）
  - `views: "three"` —— 三视图同步（主视图 + 左视图 + 俯视图）
  - `unfold` —— 展开图 / 折叠动画
  - `mode` 状态机 + Raycaster 命中高亮 —— v0.1 留作占位
- **待办**：v0.2 空白区识别区扩大（双击空白命中率对正方体/圆锥偏小，加 padding / 5% 边界保护区）。

### 跨组件悬而未决项（开放讨论中）

- **emoji 命运**：保留 / 切到 lucide SVG / 用 ASCII 几何。影响 hero / concept-card / callout。
- **圆角策略**：当前默认 8-12px / dark 主题待定 / 是否切 0 直角 vs 大元素 0+ 小元素 4px 混合。
- **阴影策略**：默认全无（最克制）/ 默认 hairline 1px（印感）/ 保留 box-shadow（当前）。
- **主题数量**：当前仅 `lavender` 一个真正实现 CSS（SPEC §6 误标 5 个，2026-06-12 已修）。要不要补 dark / gold？什么时候补？

---

## 已知系统级问题（影响多个组件）

> 标"待打磨"前先看这里——这些是跨组件的、应该一起改的。

1. **`processInline` 已支持 `$...$` 行内 LaTeX**（`_inline.js:30-44`）— 现状：quiz / callout / math-step 的 `content` 字段内 `$x^2$` 会被 KaTeX 编译。
   - **升级目标**（不是 bug）：(a) 支持多行 LaTeX（`$$...$$`）— 当前正则 `\$([^$\n]+)\$` 排除换行。(b) 兼容 `\(...\)` / `\[...\]` 标准语法。(c) 解析失败时给出**编译期**提示（目前 throwOnError:false 静默降级到 `<code>`，学员看不到"哪里写错了"）。
2. **架构债 #1：`_inline.js` 顶层硬 `require('katex')` 跟组件零依赖约束矛盾**（优先级 P2）— 现状：5 个组件在 `renderer.js` 模块树顶层被加载的副作用下"共享"闭包变量（ce129f7 注释承认）。升级路径：把 `katex` 导入下沉到 `processInline` 内部 lazy require，或拆 `_inline-math.js` 子模块按需加载。
3. **架构债 #2：`build` 静默降级**（优先级 P1）— marked.parse / katex.renderToString 失败时 throwOnError:false / catch 吞掉异常，产物能跑但**学员看不到公式**。需要：(a) 编译期收集所有解析失败的位置 + 源 .md 行号。(b) 写到一个 build 报告文件，build exit code 在有未解析项时非 0。
4. **架构债 #3：frontmatter `sections` ↔ 正文 `## h2` 不同步**（优先级 P1 · 教学链路 · **2026-06-12 部分修复**）— 现状 2 个 .md 中招（三角柱 demo 已修复）：
   - ~~`triangular-prism-demo.md`：sections 3 章，正文 h2 3 章（"## 原题"漏写导致 sidebar 锚点错位）~~  → **2026-06-12 已加回 `## 原题`，现在 sections=3 / h2=3 匹配**
   - `binary-card-trick.md`：sections 声明 6 章，正文 h2 7 章（"## 魔术前的准备"在 sections 之外）
   - `math-step-test.md`：sections 4 个"x、"题号，正文是 4 个 `## 1、` 编号但格式不对齐（"## 三题总结"没在 sections 里）
   - `how-to-create-skill.md`：sections 6 章，正文 h2 14 个（差 8 个孤儿 h2）
   - **修复（2026-06-12，commit 2ba17a4）**：build.js 加 section 7.6 校验 —— sections 数量 ≠ h2 数量时 console.warn + 打印两列对照表，但**不**阻断 build（向后兼容）
   - 影响：sections 是 hero 卡片下方的"章节目录"，学员点 `## xxx` 不会出现在目录里 = 教学链路断。后续：(a) 把 binary-card-trick / math-step-test 修了（用 build warning 引导）。(b) 长期看应该改成「h2 数量 != sections 数量时 build exit 1」，但目前向后兼容优先。
5. **CTA 锚点 `#sec-xxx` 与 renderer 自动生成的 anchor 未对齐** — hero 的 `ctaHref` 跳到 `#sec-quiz-track` 这种，但 renderer 自动生成 anchor 的规则没文档化，跨 .md 复用时容易断。
6. **emoji 跨平台渲染不一致** — concept-card 的 `icon`、hero 的 `emoji`、callout 的图标都受此影响。
7. **compare 的 good/bad 左右排序约定未文档化**（GLM 5.1 评估 · 2026-06-05）— compare 有 4 种 tag，但 good/bad 哪个放左没明确规则。优先级：低，先定约定（建议 good 在左 / bad 在右 / warn 居中）。
8. **build.js 的 marked.setOptions 是全局副作用** — 当前串行编译没问题，但 future 想做并行编译时会冲突。优先级：低，等真有并行需求再重构 loader。

---

## 决策记录

> 这些是「明知有代价但选择保留」的架构决策，需要有据可查才不会被后人当 bug 误改。

### 1. 组件 clientJs 用字符串模板内联（2026-06-05）

quiz / step-guide / math-step 等组件的 `clientJs` 是 200 行的 JS 字符串，最终内联到 HTML `<script>`。没有 source map，调试困难。

**为什么这样选**：项目「零运行时依赖」是顶层约束（构建产物要纯静态、可离线打开），改成外部 .js 文件需要 build 链路多一道 copy 步骤，性价比不高。

**重评条件**：如果将来有人频繁调试 clientJs 卡住、或者要支持 source map 调试，可重新评估。

### 2. callout 5 色调色板定型（2026-06-05）

tip 绿 / warning 琥珀 / info 蓝 / danger 红 / note 紫，5 个不同色相，0 撞色。

**为什么这样选**：(a) 语义清晰：tip = 积极建议 → 绿色（复用 `--color-success`），note = 中性记录 → 紫色（保留主题主色），warn = 小心 → 琥珀，info = 补充 → 蓝，danger = 危险 → 红。(b) 零新变量：5 色全部复用现有 5 个变量，主题色板不膨胀。(c) 顺手清理：math-step-insight 之前借用了 `--color-tip-bg`（已删），跟随改用 `--color-success-bg` 保持视觉关联。

**重评条件**：如果引入"emoji → SVG 图标库"决策（影响 callout 的 5 个 icon 表现力），或要扩展第 6 种 type（如 `success` / `question`），需要重新审视色板。

### 3. 字段契约放在 `components/<name>.js` 顶部 JSDoc（2026-06-07）

原先字段契约散落在 `docs/components-registry.md`（每个组件 30-50 行表格）。**为什么这样选**：(a) 信息源唯一化——改字段时只动一处，文档不会跟代码脱节。(b) 编辑器能直接读 JSDoc 提供 hover 帮助。(c) registry 的 564 行降到 ~150 行，只留"打磨方向 / 系统问题 / 决策记录"这种**真正需要跨组件视角**的内容。

**重评条件**：如果某天字段契约复杂到 JSDoc 装不下（比如 20+ 字段 + 多种子结构 + 条件约束），再考虑拆出去。

### 4. math-step 4 折叠区统一单色 + `celebrate` 开关（2026-06-07）

4 折叠区（hint/explanation/warning/insight）原本各占一种色（黄/蓝/红/紫），与 callout 5 type 撞色且在 step 内部"色彩嘈杂"。改成统一琥珀色（保留与 callout warning 的语义关联），视觉降噪。`celebrate: false` 开关给"严肃考试"等场景留逃生口。

**为什么这样选**：(a) 4 折叠区在 step 内部是"补充信息"不是"独立 alert"，色彩一致反而让用户注意力留在 step/answer 上。(b) 复用 `--color-warning-bg` 零新变量，主题色板不膨胀。(c) `celebrate` 开关覆盖 99% 教学场景（默认庆祝）+ 1% 严肃场景（关掉），用 boolean 而不是新组件解决。

**重评条件**：如果某天折叠区要承载不同**强度**的"补充"（比如 insight 是金色高亮型、hint 是低调灰色），需要重新审视单色策略。

### 5. 触摸板旋转支持：显式 mouseButtons/touches 映射（2026-06-12，commit 79987cc）

OrbitControls 默认用全部鼠标键 + 触摸做旋转/平移，但**触摸板**（macOS/Windows 精密触控板）会触发左右键双指手势，导致左键 = 旋转、右键 = 平移的契约在触摸板上混淆 —— 学员反馈"只能在二维方向旋转"。

**为什么这样选**：用 `controls.mouseButtons = { LEFT: ROTATE, MIDDLE: DOLLY, RIGHT: PAN }` + `controls.touches = { ONE: ROTATE, TWO: DOLLY_PAN }` 显式声明契约，触摸板滑动 = 旋转、Shift+滑 = 平移、双指 = 缩放/平移。再加 CSS `touch-action: none` 防止浏览器拦截 touch 事件。

**重评条件**：如果学员反馈"在 3D 空间里绕 X/Y 轴旋转够了"（OrbitControls 的两个轴），那 Z 轴自转（决策 #6）就不必要 —— 但目前需求是「我能控制绕 BB₁ 方向（Z）旋转」。

### 6. Z 轴自转绕 BB₁ 方向（2026-06-12，commit 79987cc）

OrbitControls 故意不暴露 3rd 轴旋转（roll/Z-rotate），但立体几何教学里学员经常需要"绕垂直于底面的 BB₁ 方向旋转"（如三角柱 demo 演示 P 在 A₁C₁ 上滑动时）。

**为什么这样选**：自己实现 `rotateAroundZ(deltaAngle)` —— 临时禁用 damping、临时禁用 controls.update() 内部的 lookAt、按 deltaAngle 旋转 camera.position 相对 target 的 (dx,dy)。键位：A / D / ← / →。

**重评条件**：如果将来要"绕任意轴"（如绕某条棱线）旋转，需要把这个工具函数升级成接受 axis 向量参数。

### 7. camera.up = +Z 校准坐标系（2026-06-12，commit 79987cc）

项目坐标系约定是「B=原点，BA=+Y，BC=+X，**BB₁=+Z（垂直）**」，但 Three.js `camera.up` 默认是 `(0, 1, 0)`。两个 up 向量不一致导致 x-y 平面被画成竖面，违背教学约定。

**为什么这样选**：`camera.up.set(0, 0, 1)` 一次性解决，渲染时 +Z 永远朝屏幕上。所有 3D 组件共享这个约定。

**重评条件**：如果某个课件反着约定（B=原点、BA=+X、BC=+Y、BB₁=+Z），需要在每个 geometry-3d 块独立覆盖 `camera.up` —— 但目前所有演示课件都用项目约定。

### 8. plane 从正方形改为 3 顶点 BufferGeometry（2026-06-12，commit 2ba17a4）

原 `planes` 用 `new THREE.PlaneGeometry(maxSpan, maxSpan)` 创建正方形半透面，超出原三角形的部分会让"△PAC"看起来是个"矩形" —— 教学错误。学员在三角柱 demo 第一次看到就问"PAB 那个平面是三角形还是正方形"。

**为什么这样选**：用 3 顶点 BufferGeometry（`setAttribute('position', Float32Array)` + `computeVertexNormals()`），永远只画"那个三角面"，不会多也不少。代价是丢掉了 PlaneGeometry 的边数参数（但我们其实从来不用），换来 100% 视觉保真。

**重评条件**：如果将来要"半透四边形面"（非三角形），需要拆出 `planeType: "triangle" | "quad"` 字段，但目前教学场景 100% 三角面。

### 9. auxLines 辅助线池 + math-step 步骤 toggle（2026-06-12，commit 2ba17a4）

教学场景里"步骤 N 看到的辅助线"会随步骤变 —— 学员问"能不能在 md 里预置好 + 步骤按钮 toggle"。之前的实现是 step.highlight.edges（hover 时即时画线），但每次 hover 重新创建 Line 几何体浪费 + 不能 toggle。

**为什么这样选**：(a) 在 geometry-3d schema 加 `auxLines: [{id, from, to, style, color, width, label}]` 字段，默认全部隐藏。(b) `math-step.highlight.auxLines: [id1, id2]` 在每步 toggle 可见性，**已有 auxLineObjects 直接改 visible**，不重建几何体。(c) 暴露 `api.showAuxLines/hideAuxLines/toggleAuxLine/hasAuxLine` 给 devtools 或脚本直接调用。

**重评条件**：如果某天"辅助线"要支持交互（点击 → 显示长度/角度数字），需要把 auxLine 升级为 object3D with userData。

### 10. Three.js 拆外链 + 缓存破坏（2026-06-08，commit c816efb）

Three.js + OrbitControls + CSS2DRenderer 打包后约 730KB，每个含 geometry-3d 的课件都内联 = 同一站点多课件的 Three.js 不共享缓存，CDN 流量翻倍。

**为什么这样选**：(a) `esbuild three-bundle.js --bundle --format=iife --minify` 一次性打 IIFE 包到 `three-bundle.iife.js`。(b) build 时按 sha256 前 8 位算 cache buster，复制到 `dist/three-bundle.<hash>.iife.js`，HTML 只插 `<script src="...">`。(c) 同一课件重 build hash 不变 = 不重新复制；不同课件 = 同一份 bundle 共享浏览器缓存。(d) Alice 内网离线部署场景用 `node build.js --inline-three` 强制内联回 HTML。

**重评条件**：如果将来课件数量增长到几十个且 Three.js 大版本升级频繁，可考虑用 ESM `<script type="importmap">` 多文件分包，但目前单 IIFE 满足需求。

### 11. per-instance 闭包 API（2026-06-08，commit c816efb）

旧 API 用 `window.__scGeom3D[id]` 全局字典，多课件同页 / 多 iframe / 多 worker session 会冲突（A2 评审指出）。

**为什么这样选**：每个 geometry-3d 渲染时把 `api` 挂到 `container.__scApi`（DOM 元素上），同时**兜底**也挂一份到 `window.__scGeom3D[id]`（向后兼容老代码）。其他组件（slider / cut-anim / tetra-equiv / math-step）**优先**用 `document.getElementById(id).__scApi` 找 API。

**重评条件**：无。per-instance 是 1.x 后的稳定契约。

### 12. build.js 锚点数量校验（2026-06-12，commit 2ba17a4）

旧 build.js 无声支持「sections 数量 ≠ h2 数量」组合，但**sidebar 按 (i+1) 编号、正文按出现顺序编号** —— 两边数量不一致时，学员点 sidebar 跳转到错位的章节（或不存在 section-N）。

**为什么这样选**：build 时 `if (sectionsCount > 0 && h2Count > 0 && sectionsCount !== h2Count) console.warn(...)` + 打印 sidebar 列表 + h2 列表两列对照。**不**改 exit code（向后兼容老课件），只 warn。

**重评条件**：等所有现有课件都修了 sections/h2 对齐后，升级为 `exit 1`（strict 模式）。

---

## 待办（全局）

按"先易后难"原则排序。

**逐组件**：
- [x] **fill-blank** — v0.2.0（多空 + 等价 + 进度条 + practice）

**跨组件**：
- [ ] **processInline 升级支持 LaTeX**（影响 7 个组件，单独 task）
- [ ] **CTA 锚点规范**（影响 hero）
- [ ] **emoji → SVG 图标**（影响 hero + concept-card + callout）
- [ ] **给每个主题配「设计签名」**（影响 5 个主题 × 全部组件）
- [ ] **圆角 / 阴影策略全局决策**（影响全部组件）

**已废弃 / 不做**：
- ~~step-guide 键盘切换折叠~~ — 决定不做，HTML 原生 `<details>` 已支持 Enter/Space，零 JS
