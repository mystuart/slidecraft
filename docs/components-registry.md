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
| 1 | hero | v0.1.0 | 🟡 待打磨 | 2026-06-05 | 2026-06-05 | 5 |
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

---

## 1. hero

**作用**：页面封面。课件的开篇/章首/单元首页。

**字段契约**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | ✅ | 主标题 |
| `subtitle` | string | — | 副标题 |
| `emoji` | string | — | 大表情符号 |
| `cta` | string | — | 行动按钮文字（如"开始练习"） |
| `ctaHref` | string | — | 行动按钮跳转目标（#anchor 或 url） |

**状态**：🟡 v0.1.0 待打磨

**依赖**：main.css `.hero` 系列

**已知问题**：
- CTA 锚点没和 renderer 自动生成的 anchor 规范化（系统级问题 #2）

**待打磨方向**：
- [ ] CTA 按钮的视觉/位置
- [ ] emoji 是否切到 SVG 图标（系统级问题 #3）
- [ ] 锚点命名规范

**更新日志**：
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

- [ ] **hero** — 最简单，先开刀定锚点规范
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
