---
title: 组件登记簿
summary: courseware 交互课程框架的组件维护档案。概览、v0.x.x 状态、借鉴方向、系统级问题、决策记录、待办。
category: registry
type: registry
created: 2026-06-05
updated: 2026-06-07
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
| 4 | fill-blank | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-07 |
| 5 | step-guide | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 6 | compare | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 7 | concept-card | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 8 | callout | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-05 |
| 9 | formula | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-06 |
| 10 | math-step | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-07 |

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

### 逐组件借鉴方向

#### 1. hero
- **当前**：背景色 + 大标题 + 副标题 + 可选 CTA + emoji。
- **借鉴**：S01 Cover「accent 全屏 + ASCII 呼吸点阵 + 反白标题 + 元数据 chrome（date / № / topic）」
- **方向**：加 ground texture · 元数据 chrome（右下角 №N/M 章号 + 左下角 topic 标签）· display 字号（标题 4-5rem）· emoji 切到 SVG 图标。

#### 2. quiz
- **借鉴**：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
- **方向**：题型分类标签（概念题 / 计算题 / 应用题）—— 给 quiz 加 `category` 字段？· 多选状态机（未选 / 部分选 / 全选错 / 全选对 / 提交后）的颜色规范 · feedback 折叠/展开默认决策。

#### 3. quiz-track *(v0.2.0 已打磨)*
- **当前**：题组 carousel，dots 容器加 hairline 时间轴（灰轴 + 已答段绿 hairline，宽度由 `--quiz-progress-width` 变量驱动），节点 hairline 描边 4 态（default/correct/partial/wrong），完成时 callout 内嵌 4 stat 总结（总题数/全对/部分对/答错），next 按钮 3 态分发。
- **方向**：答对自动跳下一题（流畅感 vs 允许回头看）· 移动端/窄屏 prev/next 文字可改纯箭头 · 进度 hairline 当前按"已答总数"算，若想表达"连续答对"需换算法。

#### 4. fill-blank
- **当前**：单空 / 多答案 `|` 分隔。
- **借鉴**：parchment 风格的填空「被填进纸里」（hairline 描边输入框，不用浮起的 box-shadow 输入框）。
- **方向**：等价答案规则（大小写 / unicode 标准化 / 去空格）· 多空场景字段设计（一题多个 `____`，按顺序 `answer[0]` 还是命名 `answers.q1`）· 判分粒度（全对 vs 部分得分）。

> 2026-06-07 升级到 v0.2.0：多空支持（{{1}} 占位）+ 每空独立等价集合 + 旧 `answer: "H|O"` 写法兼容 + 进度条 + hairline 描边输入框（已实现）。

#### 5. step-guide（v0.2.0 已打磨）
- **当前**：tab 切换，按钮组形式。`title` 走 processInline；`example` 字段默认展开 + 可折叠（HTML `<details>` 原生，零 JS）。
- **下一步可选**：tab 视觉从"按钮组"改为"timeline 节点"· 当前 step 序号角标 · 移动端 tab 横滑 · example 代码高亮（hljs 集成）。

#### 6. compare（v0.2.0 已打磨）
- **当前**：左右两列 + 4 tag 颜色 + `mode` 字段控制语义（good-bad / before-after / neutral）+ "vs" 圆牌 + warn 加边框增强对比。
- **下一步可选**：points 数量上限折叠（> 6 项时折叠）· 横向响应式（移动端两列改纵向）· "vs" 圆牌可换成箭头/方向指示。

#### 7. concept-card（v0.2.0 已打磨）
- **当前**：网格 + icon + 标题 + 描述。`title` 走 processInline；`iconType` 字段路由 emoji/svg/image 三种 icon 写法。
- **下一步可选**：响应式（移动端 4 列降级到 2 列 / 1 列的断点）· 是否切到统一 SVG 图标库。

#### 8. callout
- **当前**：5 种 type（tip / warning / info / danger / note），调色板：tip 绿 / warning 琥珀 / info 蓝 / danger 红 / note 紫。
- **方向**：✅ 调色板定型（2026-06-05）· 每个 type 配一个 SVG icon 统一视觉签名 · 内容超过 N 行默认折叠？

#### 9. formula（v0.2.0 已打磨）
- **当前**：KaTeX 编译时 + caption 走 processInline + showExpr 折叠按钮 + 块级公式自动编号。
- **下一步可选**：编号字体（当前用 0.88em italic）· 公式引用（"由公式 1.1 得..." 跨公式引用方案）· 公式锚点（点击编号跳到公式）。

#### 10. math-step *(v0.2.0 已打磨)*
- **当前**：题面 / 步骤 / 答案 / 4 种折叠区（统一琥珀色，默认展开）/ hairline 进度条 + 文字 / `celebrate: false` 可关全卡片变绿。
- **下一步可选**：单 step 内进度（"看完了提示"不算"完成"，是不是要二级进度？）· 折叠区支持折叠回默认（现在 `open` 是硬编码的，不支持 step 级"教学节奏"）· 进度条完成态加点动效（避免太干）。

### 待你拍板的关键决策（影响多个组件）

- **emoji 命运**：保留 / 切到 lucide SVG / 用 ASCII 几何。影响 hero / concept-card / callout。
- **圆角策略**：dark 保持 8-12px / 全部切到 0 直角 / 大元素 0 + 小元素 4px 混合。影响全部组件。
- **阴影策略**：默认全无（最克制）/ 默认 hairline 1px（印感）/ 保留 box-shadow（当前）。影响全部组件。
- **主题数量**：5 个太散，要不要砍到 3 个（lavender + dark + gold）？
- **打磨优先级**：从哪个组件开刀（建议 hero → callout → formula → compare → concept-card → quiz → quiz-track → step-guide → fill-blank → math-step）。

---

## 已知系统级问题（影响多个组件）

> 标"待打磨"前先看这里——这些是跨组件的、应该一起改的。

1. **`processInline` 已支持 `$...$` 行内 LaTeX**（`_inline.js:30-44`）— 现状：quiz / callout / math-step 的 `content` 字段内 `$x^2$` 会被 KaTeX 编译。
   - **升级目标**（不是 bug）：(a) 支持多行 LaTeX（`$$...$$`）— 当前正则 `\$([^$\n]+)\$` 排除换行。(b) 兼容 `\(...\)` / `\[...\]` 标准语法。(c) 解析失败时给出**编译期**提示（目前 throwOnError:false 静默降级到 `<code>`，学员看不到"哪里写错了"）。
2. **架构债 #1：`_inline.js` 顶层硬 `require('katex')` 跟组件零依赖约束矛盾**（优先级 P2）— 现状：5 个组件在 `renderer.js` 模块树顶层被加载的副作用下"共享"闭包变量（ce129f7 注释承认）。升级路径：把 `katex` 导入下沉到 `processInline` 内部 lazy require，或拆 `_inline-math.js` 子模块按需加载。
3. **架构债 #2：`build` 静默降级**（优先级 P1）— marked.parse / katex.renderToString 失败时 throwOnError:false / catch 吞掉异常，产物能跑但**学员看不到公式**。需要：(a) 编译期收集所有解析失败的位置 + 源 .md 行号。(b) 写到一个 build 报告文件，build exit code 在有未解析项时非 0。
4. **架构债 #3：frontmatter `sections` ↔ 正文 `## h2` 不同步**（优先级 P1 · 教学链路）— 现状 3 个 .md 中招：
   - `binary-card-trick.md`：sections 声明 6 章，正文 h2 7 章（"## 魔术前的准备"在 sections 之外）
   - `math-step-test.md`：sections 4 个"x、"题号，正文是 4 个 `## 1、` 编号但格式不对齐（"## 三题总结"没在 sections 里）
   - `how-to-create-skill.md`：sections 6 章，正文 h2 14 个（差 8 个孤儿 h2）
   - 影响：sections 是 hero 卡片下方的"章节目录"，学员点 `## xxx` 不会出现在目录里 = 教学链路断。需要：(a) build 时校验 sections 与 h2 数量一致 + 文本一致。(b) 给出"加入 sections"或"删除 h2"建议。
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
