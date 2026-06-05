---
title: 组件登记簿
summary: courseware 交互课程框架的组件维护档案。每个组件的版本、状态、字段契约、依赖、已知问题、待打磨方向。
category: docs
type: registry
created: 2026-06-05
updated: 2026-06-05
related:
  - ../SPEC.md
  - ../README.md
  - ../content/components-showcase.md
  - ../template/components/
---

# 组件登记簿

> **这是组件的实时状态档案**。`SPEC.md` 是规范文档（讲"应该是什么样"），本文件是维护记录（讲"现在是什么样"）。两者冲突时，以本文件为准（SPEC.md 需要更新）。
>
> 配套讨论画布：`../content/components-showcase.md` —— 每个组件都有 2+ 个真实示例，跑 build 后可在 `../dist/components-showcase.html` 看渲染效果。

## 概览

| # | 组件 | 版本 | 状态 | 首次可用 | 最近更新 | 字段数 |
|---|---|---|---|---|---|---|
| 1 | hero | v0.2.0 | 🟢 打磨完成 | 2026-06-05 | 2026-06-05 | 6 |
| 2 | quiz | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 7 |
| 3 | quiz-track | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 1 (数组) |
| 4 | fill-blank | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 6 |
| 5 | step-guide | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 3 |
| 6 | compare | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 6 |
| 7 | concept-card | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 4 |
| 8 | callout | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 3 |
| 9 | formula | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 4 |
| 10 | math-step | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 7+ |

状态图例：🟢 打磨完成 · 🟡 待打磨 · 🔴 打磨中 · ⚪ 弃用

## 版本号约定

- **v0.1.0** — 首次可用，但字段/视觉/交互都还没经过讨论打磨
- **v0.2.0+** — 经过至少 1 轮打磨，字段或视觉有调整
- **v1.0.0** — 老板签字「打磨完成」，进入稳定状态
- **v1.x.y** — bugfix 或微调，不破坏字段契约

版本号跟随**组件本身的契约**变化，而不是 renderer.js 里的代码改动。

## 依赖一览

| 外部依赖 | 用在哪些组件 | 说明 |
|---|---|---|
| KaTeX (编译时) | formula, math-step, quiz/feedback, callout, hero | `expr`/`formula`/`questionFormula` 字段用 KaTeX 编译时渲染 |
| `processInline` (运行时) | hero, quiz, fill-blank, step-guide, compare, concept-card, callout, math-step | 处理 `**bold**` / `[link](url)` / `code` 内联语法 |
| main.css | 全部组件 | 视觉样式集中地 |

## 已知系统级问题（影响多个组件）

> 标"待打磨"前先看这里——这些是跨组件的、应该一起改的。

1. **`processInline` 不处理 `$...$` 行内 LaTeX** — 导致 quiz 的 `options[].text`、`feedback.content`、callout 的 `content`、math-step 的 `step.content` 里写数学公式都渲染不出来。要么升级 `_inline.js` 支持 LaTeX，要么这些字段继续走组件字段（`formula` / `problemFormula`）绕过。
2. **CTA 锚点 `#sec-xxx` 与 renderer 自动生成的 anchor 未对齐** — hero 的 `ctaHref` 跳到 `#sec-quiz-track` 这种，但 renderer 自动生成 anchor 的规则没文档化，跨 .md 复用时容易断。
3. **emoji 跨平台渲染不一致** — concept-card 的 `icon`、hero 的 `emoji`、callout 的图标都受此影响。
4. ✅ **sidebar 渲染依赖 frontmatter.sections**（已修 2026-06-05）— markdown 没写 `sections` 字段时 sidebar 是空 ol。修复：① 写 `template/fm-template.md` reference 模板列必填字段；② 改 `build.js` 加 warning 兜底（缺 sections 但正文有 h2 时 console.warn 提示）；③ 顺手修 `renderSideNav` 兼容对象格式 sections（formula-test.md 之前吐 [object Object]）。
5. ✅ **escapeHtml 在 7 个文件重复定义**（已修 2026-06-05）— `_inline.js` 已经导出 escapeHtml，但 build.js / renderer.js / hero / quiz / concept-card / fill-blank / formula 各自重写了一份，违反 DRY。修复：7 个文件改为 `import { escapeHtml } from './_inline.js'`，删除本地副本。GLM 5.1 评估漏数了 fill-blank.js / formula.js，实际是 7 个副本不是 6 个。
6. **build.js 的 marked.setOptions 是全局副作用** — 当前串行编译没问题，但 future 想做并行编译时会冲突（多文件共享 setOptions 状态互相覆盖）。优先级：低，等真有并行需求再重构 loader。

---

## 决策记录

> 这些是「明知有代价但选择保留」的架构决策，需要有据可查才不会被后人当 bug 误改。

1. **组件 clientJs 用字符串模板内联**（2026-06-05）— quiz / step-guide / math-step 等组件的 `clientJs` 是 200 行的 JS 字符串，最终内联到 HTML `<script>`。没有 source map，调试困难。**为什么这样选**：项目「零运行时依赖」是顶层约束（构建产物要纯静态、可离线打开），改成外部 .js 文件需要 build 链路多一道 copy 步骤，性价比不高。**重评条件**：如果将来有人频繁调试 clientJs 卡住、或者要支持 source map 调试，可重新评估。

---

## 打磨方向（借鉴 html-anything · 2026-06-05）

**学习源**：nexu-io/html-anything（75 skills × 9 surfaces，重点读了 `deck-swiss-international` 和 `doc-kami-parchment`）

**借鉴核心**：「**设计签名 + 铁律**」—— 每个 skill 配严选 palette（4 选 1）+ 字体分工（display / body / mono / 中文）+ 版式池（22 个锁死）+ 「绝不」清单（drop-shadow / 圆角 / 渐变 / 霓虹色）。相比我现在的「通用 HTML 默认风格 + 5 个自由切换主题」，html-anything 是「少而精 + 严选 + 克制」。

### 全局打磨方向（适用于所有组件）

1. **给每个主题配「设计签名」**（不只换色）
   - **当前**：5 个主题（lavender / champagne / green / dark / gold）只是色调不同，字体 / 间距 / 装饰元素都共用 → 换主题像换壁纸，视觉签名没变。
   - **借鉴**：deck-swiss-international 4 套配色各有 accent + paper + ink 三色 + 字体约束 + 铁律（"文字必须黑/白"等）。
   - **方向**：每个主题补「签名段」：accent 色 + paper 色 + ink 色 + 字体 + 圆角策略（0 / 4 / 12）+ 阴影策略（hairline 描边 vs drop-shadow）。

2. **字号极端反差**（display 9.6vw vs body 14-16px vs label 11px）
   - **当前**：所有字号走浏览器默认，标题 vs 正文反差不够强。
   - **借鉴**：display 9.6vw + body 14-16px + label 11px uppercase letterspacing 0.08em。
   - **方向**：课件建立 4 级字号系统：display（章首 4-5rem）/ h2（节标题 1.75-2rem）/ body（正文 1rem）/ label（角标 0.75rem uppercase）。

3. **「绝不」清单**（铁律）
   - **当前**：CSS 里啥都能用，缺铁律。
   - **借鉴**：每个 skill 都有「绝不 drop-shadow / 圆角 / 渐变 / 霓虹色 / rgba」段。
   - **方向**：每个主题配「铁律」段——什么一定不要。比如 dark 主题：不要纯白文字（用 95% 白）；lavender 主题：不要霓虹色 accent（用 muted 紫）。

4. **Ground texture（背景纹理）**
   - **当前**：纯色背景，没质感。
   - **借鉴**：parchment 羊皮纸底 / dot pattern 点阵 / grid 网格——做氛围底。
   - **方向**：选 1-2 个主题试 ground texture（lavender 加 dot pattern 9% 透明度 / dark 加 grid 6% 透明度做底）。

5. **Hairline 描边代替阴影**
   - **当前**：卡片用 `box-shadow`。
   - **借鉴**：parchment 用 `0 0 0 1px #d4d1c5` 描边代替阴影。
   - **方向**：默认 hairline 1px 描边代替 shadow（更印感、更克制），特殊场景（hover / focus / drag）才用 shadow。

6. **字体系统化分工**
   - **当前**：main.css 字体声明跟系统默认走。
   - **借鉴**：4 种字体分工——display (Inter Tight) / body (Inter) / 中文 (Noto Sans SC) / 数字 mono (JetBrains Mono)。
   - **方向**：建 `template/styles/fonts.css` 集中声明，4 种字体各司其职，组件 CSS 通过 CSS 变量引用，不散落。

7. **「被排过版的纸」质感**（parchment 哲学）
   - **借鉴**："Composed pages, not dashboards. 写得像被排版的纸，不是 dashboard，不是网页。"
   - **方向**：课件的 detail 元素（quote / footnote / metadata / page number）按「印感」打磨，而不是 web card 感。具体：metadata 用 hairline 分隔，footnote 用 1px 顶 rule + 字号 0.8rem + 灰色，page number 用 11px uppercase 角标。

### 逐组件借鉴方向

#### 1. hero
- **当前**：背景色 + 大标题 + 副标题 + 可选 CTA + emoji。
- **借鉴**：S01 Cover「accent 全屏 + ASCII 呼吸点阵 + 反白标题 + 元数据 chrome（date / № / topic）」
- **方向**：加 ground texture · 元数据 chrome（右下角 №N/M 章号 + 左下角 topic 标签）· display 字号（标题 4-5rem）· emoji 切到 SVG 图标（关联系统级问题 #3）。

#### 2. quiz
- **当前**：题干 + 选项 + 反馈。
- **借鉴**：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
- **方向**：题型分类标签（概念题 / 计算题 / 应用题）—— 给 quiz 加 `category` 字段？· 多选状态机（未选 / 部分选 / 全选错 / 全选对 / 提交后）的颜色规范 · feedback 折叠/展开默认决策。

#### 3. quiz-track
- **当前**：题组 carousel，孤立圆点表示进度。
- **借鉴**：S11 Horizontal Timeline「顶部 headline + 中部 hairline 轴 + 等距节点」
- **方向**：进度点用 hairline 轴连成 timeline，不要孤立圆点 · 答对/答错用 hairline 颜色变化（不用填色）· 全部完成时的「总结」是 callout 内嵌还是 modal 浮层？

#### 4. fill-blank
- **当前**：单空 / 多答案 `|` 分隔。
- **借鉴**：parchment 风格的填空「被填进纸里」（hairline 描边输入框，不用浮起的 box-shadow 输入框）。
- **方向**：等价答案规则（大小写 / unicode 标准化 / 去空格）· 多空场景字段设计（一题多个 `____`，按顺序 `answer[0]` `answer[1]` 还是命名 `answers.q1` `answers.q2`）· 判分粒度（全对 vs 部分得分）。

#### 5. step-guide
- **当前**：tab 切换，按钮组形式。
- **借鉴**：S11 Horizontal Timeline（顶部 headline + 节点 + 步骤名）。
- **方向**：tab 视觉从「按钮组」改为「timeline 节点」· `example` 字段的展示形式（折叠 / 展开 / 代码高亮）· 键盘左右切换 + 当前 step 序号角标。

#### 6. compare
- **当前**：左右两列 + tag 颜色。
- **借鉴**：S08 Duo Compare「垂直分割线；左 Before / 右 After」
- **方向**：中间分割线风格（实线 / 虚线 / 留白）· tag 颜色映射约定（good 绿 / bad 红 / warn 黄 / neutral 灰）是否对齐到 callout 5 种 type？· points 数量上限（多了要折叠）。

#### 7. concept-card
- **当前**：网格 + emoji + 标题 + 描述。
- **借鉴**：S04 Six Cells「icon + 编号 + 短标题 + 单行描述」
- **方向**：卡片 hover 效果（hairline 加粗 + 微 translateY？还是要不要 hover？）· emoji 决策：保留 / 切到 lucide SVG / 接受跨平台差异 · 响应式（移动端 4 列降级到 2 列 / 1 列的断点）。

#### 8. callout
- **当前**：5 种 type（tip / warning / info / danger / note）。
- **借鉴**：parchment「tag 用 solid hex 背景方块 + 1px ink 描边」（callout 本来就是这种思路，但还可以更克制）
- **方向**：5 种 type 调色板审视（tip / info / note 是不是太接近？要不要合并成 3 种？）· 每个 type 配一个 SVG icon 统一视觉签名 · 内容超过 N 行默认折叠？

#### 9. formula
- **当前**：KaTeX 编译时 + caption。
- **借鉴**：parchment「文字层级靠衬线对比 + 字号 + 留白，不靠颜色」（公式块不要花哨背景，纯白底 + 居中 + 大留白）
- **方向**：块级 / 行内默认值决策（display 默认 `true` 还是 `false`？行内用 `display: inline` + 中等 padding？）· `showExpr` 教学场景（折叠 / 悬浮 tooltip / 始终展开）· 编号系统（要不要「公式 1.1」自动编号）。

#### 10. math-step
- **当前**：题面 / 步骤 / 答案 / 4 种折叠区。
- **借鉴**：parchment「细节质感」+「"被排过版"」
- **方向**：answer 块 vs 折叠区展开/折叠的统一规则（要不要全部默认折叠？用户点击展开才"教学感"）· 4 种折叠区配色（hint 黄 / explanation 蓝 / warning 红 / insight 紫）是否对齐到 callout 5 种 type？· 进度条计算（每步勾 +1 vs 全部勾完 +1）· 全部完成时「全卡片变绿」是否保留（视觉太重？）。

### 待你拍板的关键决策（影响多个组件）

> 这些是借鉴过程中浮现的「二选一 / 三选一」，需要你点头才能动代码。

- **emoji 命运**：保留（接受跨平台差异）/ 切到 lucide SVG（更统一但要引入图标库）/ 用 ASCII 几何（最克制但表达力弱）。影响 hero / concept-card / callout。
- **圆角策略**：dark 主题保持 8-12px（柔和）/ 全部切到 0 直角（最克制，学院派）/ 大元素 0 直角 + 小元素 4px 圆角（混合）。影响全部组件视觉。
- **阴影策略**：默认全无（最克制）/ 默认 hairline 1px（印感）/ 保留 box-shadow（当前）。影响全部组件。
- **主题数量**：5 个太散，要不要砍到 3 个（lavender + dark + gold）？
- **磨优先级**：从哪个组件开刀（建议 hero → callout → formula → compare → concept-card → quiz → quiz-track → step-guide → fill-blank → math-step，但你说了算）。

---

## 1. hero

**作用**：页面封面。课件的开篇/章首/单元首页。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | ✅ | 主标题 |
| `subtitle` | string | — | 副标题 |
| `emoji` | string | — | 大表情符号（左列主标上方）|
| `cta` | string | — | 行动按钮文字（如"开始练习"） |
| `ctaHref` | string | — | 行动按钮跳转目标（#anchor 或 url） |
| `visual` | `{ value: string, rotated?: number }` | — | 右列装饰 emoji（放大 22rem / 旋转 N° / 半透明 15%） |

**状态**：🟢 v0.2.0 打磨完成（2026-06-05，杂志海报风两列布局 + visual 字段）

**依赖**：main.css `.hero` 系列

**已知问题**：
- CTA 锚点没和 renderer 自动生成的 anchor 规范化（系统级问题 #2）

**待打磨方向**：
- [x] CTA 按钮的视觉/位置（v0.2.0 已打磨：pill 圆角 999px / 主题色实心 / 距文字 2.5em）
- [ ] emoji 是否切到 SVG 图标（系统级问题 #3）
- [ ] 锚点命名规范

**更新日志**：
- 2026-06-05 v0.2.0 杂志海报风两列布局 + visual 字段上线（5 个 .md 同步加 visual）
- 2026-06-05 v0.1.0 首次登记

---

## 2. quiz

**作用**：单道选择题。single（单选）/ multi（多选）两种类型。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一标识 |
| `question` | string | ✅ | 题干 |
| `type` | `'single' \| 'multi'` | ✅ | 单选 / 多选 |
| `options` | `Array<{id, text}>` | ✅ | 选项 |
| `correct` | `string[]` | ✅ | 正确选项的 id 数组 |
| `feedback.correct` | string | — | 全对反馈文案 |
| `feedback.wrong` | string | — | 答错反馈文案 |
| `hint` | string | — | 提示文案 |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.quiz` 系列 + katex（`question` 里的 `questionFormula` 字段无；目前 question 文本走 processInline 不走 katex）

**已知问题**：
- `options[].text` 和 `feedback.content` 里的 `$...$` 不被渲染（系统级问题 #1）

**待打磨方向**：
- [ ] options / feedback 是否要支持 LaTeX
- [ ] 多选的视觉区分（已选/部分选/全错）
- [ ] 题干是否需要图标/分类标签

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 3. quiz-track

**作用**：题组 carousel。多个 quiz 串成一道题组，前/后题导航。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `[]` | `Array<quiz>` | ✅ | 一个 quiz 对象的数组 |

**状态**：🟡 v0.1.0 待打磨

**依赖**：quiz 组件 + carousel 交互 JS

**已知问题**：
- 进度指示器、答错/答对的视觉反馈未统一

**待打磨方向**：
- [ ] carousel 进度点视觉
- [ ] 答对/答错的视觉反馈（圆点变色？显示得分？）
- [ ] 全部完成后是否弹出总结

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 4. fill-blank

**作用**：填空题。一个或多个空，多答案用 `|` 分隔。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一标识 |
| `question` | string | ✅ | 题目文本（`____` 标记空位） |
| `answer` | string | ✅ | 正确答案（`\|` 分隔多答案） |
| `hint` | string | — | 提示 |
| `placeholder` | string | — | 输入框 placeholder 文本 |
| `mode` | string | — | 填空模式（待确认：单空/多空？） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.fill-blank` 系列

**已知问题**：
- 多答案等价规则缺失：H2O 和 H₂O 需手动枚举
- `mode` 字段语义未明确

**待打磨方向**：
- [ ] 等价答案规则（大小写？unicode 标准化？）
- [ ] `mode` 字段的实际用途和取值
- [ ] 多空场景（一题多个 `____`）的字段设计
- [ ] 判分逻辑是否需要部分得分

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 5. step-guide

**作用**：分步引导，tab 切换。展示一个流程的多个步骤。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一标识 |
| `title` | string | ✅ | 步骤组标题 |
| `steps` | `Array<{title, content, example}>` | ✅ | 步骤列表 |
| `steps[].title` | string | ✅ | 步骤标题 |
| `steps[].content` | string | ✅ | 步骤正文（走 processInline） |
| `steps[].example` | string | — | 示例代码或说明 |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.step-guide` 系列 + tab 切换 JS

**已知问题**：
- `example` 字段是否默认折叠没定
- `step.content` 里的 `$...$` 不被渲染（系统级问题 #1）

**待打磨方向**：
- [ ] tab 视觉（当前选中态、过渡动画）
- [ ] `example` 字段的展示形式（折叠？展开？代码高亮？）
- [ ] 是否支持键盘左右切换

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 6. compare

**作用**：左右对比。两组要点对照展示。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一标识 |
| `title` | string | ✅ | 对比标题 |
| `left` | `{label, tag, points[]}` | ✅ | 左侧 |
| `right` | `{label, tag, points[]}` | ✅ | 右侧 |
| `label` | string | ✅ | 列标题 |
| `tag` | `'good' \| 'bad' \| 'warn' \| 'neutral'` | — | 颜色标签（默认 neutral） |
| `points` | `string[]` | ✅ | 要点列表（走 processInline） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.compare` 系列

**已知问题**：
- 4 种 tag 颜色是否够用待验证
- 左右排序的"好/坏"约定未文档化

**待打磨方向**：
- [ ] 4 种 tag 颜色微调
- [ ] 是否要加「正确 vs 错误」二色版（对比更强烈）
- [ ] points 数量上限（多了要折叠？）
- [ ] `points` 里的 `$...$` 渲染（系统级问题 #1）

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 7. concept-card

**作用**：概念卡片网格。多张卡片并列展示。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 唯一标识 |
| `title` | string | ✅ | 卡片组标题 |
| `columns` | `1 \| 2 \| 3 \| 4` | — | 列数（默认 3） |
| `cards` | `Array<{icon, title, desc}>` | ✅ | 卡片列表 |
| `cards[].icon` | string | — | 卡片图标（emoji） |
| `cards[].title` | string | ✅ | 卡片标题 |
| `cards[].desc` | string | ✅ | 卡片描述（走 processInline） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.concept-card` 系列

**已知问题**：
- emoji 跨平台渲染不一致（系统级问题 #3）

**待打磨方向**：
- [ ] 是否切到 SVG 图标库（lucide / heroicons）
- [ ] 卡片 hover 效果
- [ ] 响应式（移动端列数降级）

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 8. callout

**作用**：高亮块。突出显示提示/警告/信息。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | `'tip' \| 'warning' \| 'info' \| 'danger' \| 'note'` | ✅ | 5 种高亮类型 |
| `title` | string | — | 高亮块标题 |
| `content` | string | ✅ | 高亮块内容（走 processInline） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.callout` 系列

**已知问题**：
- 5 种 type 之间的色差/对位关系需要统一审视
- `content` 里的 `$...$` 不被渲染（系统级问题 #1）

**待打磨方向**：
- [ ] 5 种 type 配色微调
- [ ] 是否要支持折叠（内容长了能收起来）
- [ ] `title` 缺省时如何处理

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 9. formula

**作用**：数学公式块。块级或行内展示，KaTeX 编译时渲染。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `expr` | string | ✅ | LaTeX 表达式 |
| `display` | `boolean` | — | `true` 块级 / `false` 行内（待确认默认值） |
| `caption` | string | — | 公式说明文字 |
| `showExpr` | `boolean` | — | 是否同时显示 LaTeX 源码（教学用） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：KaTeX 编译时

**已知问题**：
- 块级 / 行内的默认值未明确
- `showExpr` 教学场景的展示形式未定

**待打磨方向**：
- [ ] 块级 vs 行内的判断标准
- [ ] `showExpr` 的展示形式（折叠？悬浮？始终展开？）
- [ ] 编号/标签系统（"公式 1.1"）是否需要

**更新日志**：
- 2026-06-05 v0.1.0 首次登记

---

## 10. math-step

**作用**：分步解题。带题面/步骤/答案/多种折叠区的解题组件。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | — | 唯一标识（可缺省） |
| `title` | string | — | 组件标题 |
| `question` | string | ✅ | 题干（走 processInline） |
| `questionFormula` | string | — | 题干公式（KaTeX 编译时） |
| `steps` | `Array<step>` | ✅ | 步骤列表 |
| `step.title` | string | ✅ | 步骤标题 |
| `step.content` | string | — | 步骤正文（走 processInline） |
| `step.formula` | string | — | 步骤公式（KaTeX 编译时） |
| `step.answer` | string | — | 答案（绿色块，默认展开） |
| `step.hint` | string | — | 提示（黄色折叠区） |
| `step.explanation` | string | — | 解释（蓝色折叠区） |
| `step.warning` | string | — | 警告（红色折叠区） |
| `step.insight` | string | — | 洞察（紫色折叠区） |

**状态**：🟡 v0.1.0 待打磨（**已重写过一次**——参见 2026-06-05 的 renderer.js 注册 + 字段兼容修复）

**依赖**：KaTeX 编译时 + main.css `.math-step` 系列 + 客户端 JS（进度条/勾选/折叠区交互）

**已知问题**：
- answer 块默认展开 vs 其他折叠区风格不统一
- 4 种折叠区配色（黄/蓝/红/紫）需要审视
- `step.content` 里的 `$...$` 不被渲染（系统级问题 #1）
- 进度条计数逻辑未定义：用户每步勾选后立即 +1，还是全部勾完才 +1？

**待打磨方向**：
- [ ] answer 块展开/折叠决策
- [ ] 4 种折叠区配色（hint 黄 / explanation 蓝 / warning 红 / insight 紫）
- [ ] 进度条计算规则
- [ ] 全部完成时的"全卡片变绿"视觉反馈
- [ ] 错误态样式

**更新日志**：
- 2026-06-05 v0.1.0 首次登记；同步完成 renderer.js 注册 + content/math-step-test.md 测试用例修复

---

## 待办（全局）

按"先易后难"原则排序：

- [x] **hero** — 杂志海报风两列布局（v0.2.0）· 锚点规范待办
- [ ] **callout** — 5 种 type 调色板审视
- [ ] **formula** — 块级/行内默认值 + 编号系统
- [ ] **compare** — 4 种 tag 调色 + 排序约定
- [ ] **concept-card** — emoji → SVG 图标迁移
- [ ] **quiz** — 多选视觉 + LaTeX 支持决策
- [ ] **quiz-track** — 进度反馈 + 总结弹窗
- [ ] **step-guide** — example 折叠/展开 + 键盘支持
- [ ] **fill-blank** — 等价答案规则 + 多空支持
- [ ] **math-step** — 4 折叠区配色 + answer 展开决策

跨组件：
- [ ] **processInline 升级支持 LaTeX**（影响 7 个组件，单独 task）
- [ ] **CTA 锚点规范**（影响 hero）
- [ ] **emoji → SVG 图标**（影响 hero + concept-card + callout）
