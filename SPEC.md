# 互动课件框架 SPEC

> 目标：一次开发，永久复用。Markdown 写内容，HTML 是编译产物。零基础小白友好。

---

## 1. 核心理念

- **内容层（markdown）**：纯文本 + 约定的 fenced code block 语法定义互动组件
- **框架层（HTML/JS/CSS）**：导航、样式、各类互动组件的渲染逻辑
- **编译时**：build 脚本读 markdown → 解析自定义组件 → 注入 HTML 模板 → 每个 markdown 输出一份独立 HTML（`dist/<name>.html`）

下次换话题：复制整个 `courseware/` 文件夹 → 改 `content/xxx.md` → 跑 `node build.js` → 完事。

---

## 2. 文件结构

```
courseware/
├── SPEC.md                       # 本文档（设计规范）
├── README.md                     # 使用说明
├── COMPONENTS.md                 # 组件登记簿（v0.x.x 状态、打磨参考、决策依据）
├── content/                      # 源内容（要换话题时只改这里）
│   ├── how-to-create-skill.md
│   ├── binary-card-trick.md
│   ├── components-showcase.md
│   ├── formula-test.md
│   ├── math-step-test.md
├── template/                     # 框架层（写一次永久复用）
│   ├── index.html.tpl            # HTML 骨架模板
│   ├── components/               # 各互动组件的渲染函数
│   │   ├── _inline.js            # 公共：内联 markdown 处理（processInline）
│   │   ├── hero.js
│   │   ├── quiz.js               # 含 quiz-track（数组模式）
│   │   ├── fill-blank.js
│   │   ├── step-guide.js
│   │   ├── compare.js
│   │   ├── concept-card.js
│   │   ├── callout.js
│   │   ├── formula.js
│   │   ├── math-step.js
│   │   ├── geometry-3d.js        # 3D 几何（WebGL/Three.js，立体几何教学）
│   │   ├── slider.js             # 滑块，驱动 geometry-3d 命名顶点
│   │   ├── tetra-equiv.js        # 同体异构四面体（等体积法可视化）
│   │   ├── cut-anim.js           # 剖切动画（从多面体切出三棱锥）
│   │   ├── _geom_utils.js        # 几何工具（顶点/面/法线计算，geometry-3d 内部用）
│   │   └── renderer.js           # 组件调度器（processMarkdown / mergeComponents / collectClientScript）
│   └── styles/
│       └── main.css              # CSS 变量驱动主题（含 @media print 打印样式）
├── docs/                         # 设计/打磨记录
│   ├── README.md                 # docs/ 目录说明
│   ├── geometry-3d-schema.md     # geometry-3d 组件字段契约（v0.1.7，4 个示例）
│   ├── slider-schema.md          # slider 组件字段契约（v0.1）
│   ├── cut-anim-schema.md        # cut-anim 组件字段契约（v0.1）
│   └── tetra-equiv-schema.md     # tetra-equiv 组件字段契约（v0.1）
├── build.js                      # 编译脚本：md → HTML
└── dist/                         # 编译产物（最终分发，每个 .md 独立一份）
    └── <name>.html
```

---

## 3. Markdown Frontmatter 约定

```yaml
---
title: 如何创作 SKILL
subtitle: 从零开始，写出可复用的 AI 技能
author: Alice
theme: lavender      # 主题色：当前仅 lavender 真正实现 CSS（其他值静默回退到默认）
sections:
  - 开篇：什么是 SKILL
  - SKILL 的结构解剖
  - 写一个 SKILL 的 5 个步骤
  - 常见陷阱与最佳实践
  - 动手实践：写你的第一个 SKILL
  - 收尾与下一步
---
```

---

## 4. 互动组件语法约定

> **设计原则**：所有组件内部用 **JSON** 格式。理由：解析最稳、嵌套结构清晰、几乎不会出错。
> 写起来"看起来不那么随意"，但写完一行能立刻在脑里 parse。后面会提供模板生成器进一步降低写作成本。

### 4.1 Hero（开篇封面）

````markdown
```hero
{
  "title": "如何创作 SKILL",
  "subtitle": "从零开始，写出可复用的 AI 技能",
  "emoji": "📘",
  "cta": "开始学习"
}
```
````

### 4.2 Quiz（选择题）

````markdown
```quiz
{
  "id": "q1",
  "question": "SKILL 的本质是什么？",
  "type": "single",
  "options": [
    { "id": "a", "text": "一段被触发的提示词模板" },
    { "id": "b", "text": "一个完整的 AI 模型" },
    { "id": "c", "text": "一个可以安装的插件" },
    { "id": "d", "text": "一段 Python 代码" }
  ],
  "correct": ["a"],
  "feedback": {
    "correct": "答对了！SKILL 本质上就是被触发的提示词模板。",
    "wrong": "再想想，SKILL 是 AI 层面而非代码层面的东西。"
  },
  "hint": "想想 SKILL 加载后会发生什么。"
}
```
````

### 4.3 Fill-blank（填空题）

> **使用限制（重要）**：fill-blank **只用于有明确单一答案的场景**。判分走**trim + 大小写不敏感**——忽略首尾空格、忽略大小写，命中每个空对应的等价集合任一项即对。
> 
> **不做** Unicode 归一化、不去中间空格、不支持模糊匹配（"近似即可"场景不应使用 fill-blank）。
> 
> 适合的：单词拼写、公式、专有名词、化学元素、文件名、命令
> 不适合的：开放性填空（"用一句话总结..."）、自然语言句子

**字段**（v0.2.0+）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | 题目 ID |
| `question` | string | ✓ | 题面。多空用 `{{1}} {{2}} {{3}} ...` 显式占位（单空可省占位，整题一空） |
| `answers` | `Array<string \| string[]>` | 推荐 | 多空答案数组，位置 i 对应题面 `{{i+1}}`。每项是 string（唯一答案）或 string[]（等价集合） |
| `answer` | string | 兼容 | 旧字段：`"H\|O"` 自动转 `[["H"], ["O"]]`（多空时复制该等价集合到所有空） |
| `hint` | string | 可选 | 提示文案 |
| `placeholder` | string | 可选 | 输入框占位符（默认"在此输入答案"） |
| `mode` | `"reveal" \| "practice"` | 可选 | 答错时是否显示 hint/答案。`"practice"` 时答错只显示对错 |

**占位编号约束（v0.2.1+，build 硬校验）**：

- 必须从 `{{1}}` 开始连续递增：`{{1}} {{2}} {{3}}` ✓，`{{1}} {{3}}` ✗，`{{2}} {{1}}` ✗
- 同一编号不能重复：`{{1}} {{2}} {{2}}` ✗
- 违反任一约束 → render 时 throw 自描述错误："发现 `{{3}}`（出现在第 2 个空）。请改用 `{{1}} {{2}} {{3}}` ... 顺序编写。"

**等价集合示例**：
```json
"answers": [["x", "X"], ["3.14", "π"], ["5"]]
```
第 1 空 `x` 或 `X` 算对；第 2 空 `3.14` 或 `π` 算对；第 3 空只 `5` 算对。

**多空判分粒度**：按位置独立判 ✓ / ✗。全空全对显示进度条 + "3 / 3 ✓"；部分对显示 "2 / 3" + 标 ✗ 的空。

````markdown
```fill-blank
{
  "id": "f1",
  "question": "一个 SKILL 文件通常以 {{1}} 命名（{{2}} 扩展名）。",
  "answers": [["skill", "SKILL"], [".md", ".MD"]],
  "hint": "文件名小写，用连字符分隔。",
  "mode": "reveal"
}
```
````

### 4.4 Step-guide（步骤引导）

````markdown
```step-guide
{
  "id": "s1",
  "title": "创建一个 SKILL 的 5 个步骤",
  "steps": [
    {
      "title": "明确触发场景",
      "content": "写下你的 SKILL 会在什么情况下被调用。用户会说什么？想清楚 2-3 个具体场景。",
      "example": "用户说'帮我把这段会议录音整理成纪要' → 触发 meeting-notes SKILL"
    },
    {
      "title": "列出触发关键词",
      "content": "..."
    }
  ]
}
```
````

### 4.5 Compare（前后对比）

````markdown
```compare
{
  "id": "c1",
  "title": "好的 SKILL vs 不好的 SKILL",
  "left": {
    "label": "不好的 SKILL",
    "tag": "bad",
    "points": [
      "触发词模糊：在某些情况下使用",
      "没有明确流程",
      "输出不可预测"
    ]
  },
  "right": {
    "label": "好的 SKILL",
    "tag": "good",
    "points": [
      "触发词具体：当用户说'会议纪要/整理录音/会议总结'时触发",
      "步骤清晰可执行",
      "输出格式明确"
    ]
  }
}
```
````

### 4.6 Concept-card（概念卡片网格）

````markdown
```concept-card
{
  "id": "cc1",
  "title": "SKILL 的核心三要素",
  "columns": 3,
  "cards": [
    { "icon": "🎯", "title": "name", "desc": "SKILL 的名字，简洁、能描述功能" },
    { "icon": "📝", "title": "description", "desc": "详细说明这个 SKILL 做什么、何时触发" },
    { "icon": "💡", "title": "body", "desc": "实际执行的提示词内容" }
  ]
}
```
````

### 4.7 Callout（高亮块）

````markdown
```callout
{
  "type": "tip",
  "title": "小贴士",
  "content": "触发词尽量使用用户原话，而不是你自己造的说法。"
}
```
````

### 4.8 普通 Markdown 块

普通 markdown（标题、列表、引用、代码块、图片、表格、`<details>` 折叠）走 marked 默认渲染。

### 4.9 Quiz-track（多题轮播）

当一组 quiz 题目需要连续浏览（综合测试、知识串联），用 `quiz-track` 把多个 quiz 放进一个**轮播组件**里——左右切换题、点击圆点直达、键盘 ←/→ 控制。

````markdown
```quiz-track
[
  {
    "id": "q1",
    "type": "single",
    "question": "第一题...？",
    "options": [{"id": "a", "text": "..."}, ...],
    "correct": ["a"],
    "feedback": {"correct": "...", "wrong": "..."}
  },
  {
    "id": "q2",
    "type": "single",
    "question": "第二题...？",
    ...
  }
]
```
````

**行为**：
- 顶部：进度文字「第 N / 共 M 题」+ 圆点导航（点击直达任意题）
- 中间：当前题卡片，左右滑动切换（transform/left 动画）
- 底部：「上一题」「下一题」按钮，单题时隐藏
- 键盘：focus 容器后按 ←/→ 切换

**打印模式**（Cmd+P）：carousel 容器展开成纵向列表，所有题平铺显示，圆点和导航按钮隐藏。

**已知问题**：carousel 用 transform / left 切题时，Chrome 的 GPU 合成层可能穿透父级 `overflow: hidden` 导致相邻 slide 漏边。临时方案是给 `.quiz-carousel-slide` 加 `padding: 0 5%` 左右留白——即使漏出也只是空白。根因待查（合成层穿透 overflow 是 Chrome 实现行为，W3C spec 跟 Chrome 有出入）。

### 4.10 组件清单

**MVP 10 个组件**（v1.0.0 稳定）：
- `hero` — 开篇封面（v0.2.0）
- `quiz` — 选择题（单选/多选，含即时反馈）（v0.2.0）
- `quiz-track` — 多题轮播（quiz 数组，carousel 切换）（v0.2.0）
- `fill-blank` — 填空题（v0.2.1，支持多空 + 等价 + practice）
- `step-guide` — 步骤引导（v0.2.0）
- `compare` — 前后对比（v0.2.0）
- `concept-card` — 概念卡片网格（v0.2.0）
- `callout` — 高亮块（tip/warning/info/danger/note）（v0.2.0）
- `formula` — 数学公式块（KaTeX 编译时渲染，含编号 / caption / 分类）（v0.2.0）
- `math-step` — 分步解题（v0.2.1，step 高亮联动 geometry-3d）

**3D 体系（v1.2.0 新增）**：
- `geometry-3d` — 立体几何 3D 渲染（v0.1.7，WebGL/Three.js；触摸板 / Z 轴自转 / 三角面 / 派生顶点 / 辅助线池 / per-instance 闭包）
- `slider` — 滑块联动 3D 命名顶点（v0.1）
- `tetra-equiv` — 同体异构四面体（v0.1，等体积法可视化）
- `cut-anim` — 剖切动画（v0.1，从多面体切出三棱锥）

**公共工具**（非组件）：
- `_inline.js` — 行内 markdown 解析（processInline，KaTeX 集成）
- `_geom_utils.js` — 几何工具函数（顶点/面/法线计算，供 geometry-3d 和 3D 联动组件共用）

侧边导航由 frontmatter 的 `sections` 字段自动生成（无独立组件）。

**后续可扩展**（不进入 MVP）：
- `accordion`（折叠列表）—— 可用 `<details>` 替代
- `code-reviewer`（代码对比+高亮）—— 内容量大时再加
- `timeline`（时间线）—— 适合讲发展史
- `geometry-3d` 进阶：剖切（`clippingPlane`）/ 三视图（`views: "three"`）/ 展开图（`unfold`）—— 路线图见 [`docs/geometry-3d-schema.md`](./docs/geometry-3d-schema.md)

### 4.11 组件内联 markdown 支持

`step-guide` 的 `content`、`callout` 的 `content`、`compare` 的 `label` / `points` 都支持以下内联语法（由 `template/components/_inline.js` 的 `processInline` 统一处理）：

| 语法 | 效果 | 备注 |
|------|------|------|
| `` `code` `` | 行内代码 | 优先于 `*` 解析 |
| `**bold**` | 加粗 | — |
| `*italic*` | 斜体 | — |
| `[text](url)` | 链接（新窗口） | 仅允许 `http`/`https`/`mailto`/`#` 协议 |
| `\n` | 换行 | 渲染为 `<br>` |

> 安全：所有输入先 `escapeHtml`，再做替换；`url` 走白名单协议，杜绝 `javascript:` / `data:` XSS。

### 4.12 组件字段扩展

**hero.ctaHref**（可选，默认 `#section-1`）
- `cta` 为空时整块不渲染（适合无 sections 的封面场景）
- `ctaHref` 可覆盖默认锚点

**fill-blank.mode**（可选，默认 `"reveal"`）
- `"reveal"`：答错时显示 hint 和答案（教学场景）
- `"practice"`：答错时只显示对错反馈，不显示 hint / 答案（自测场景）

**quiz 题间导航**
- **仅 `quiz-track` 模式（quiz 数组）生效**。非题组（普通 quiz，单题）**不显示**「第 N / M 题」角标、**不显示**题间导航按钮。
- 题组模式：carousel + dots 进度由 quiz.js clientJs `renderTrack` 自动管理。
- 实现：单题 quiz 走静态渲染；数组入参时进 quiz-track 模式，由 clientJs 注入 carousel 状态。

### 4.13 Geometry-3D（3D 几何体）

**用途**：立体几何 / 空间向量 / 解析几何的交互式 3D 演示。鼠标拖动旋转、滚轮缩放、右键平移、键盘 A/D 或 ←/→ 绕 Z 轴自转；标签用 DOM（CSS2DRenderer）跟随几何体。

**详细字段契约、数据示例、v0.1.7 完整能力见** [`docs/geometry-3d-schema.md`](./docs/geometry-3d-schema.md)。

**关键点速览**（v0.1.7）：
- 字段契约：10+ 类 30+ 字段（`geometry` / `display` / `labels` / `planes` / `auxLines` / `rightAngles` / `derivedVertices` / `camera` / `id` / `caption` / `size` / `vertices` / `background`），全部带默认值
- 支持几何体：box / sphere / cylinder / cone / tetrahedron / octahedron / **triangular-prism**（v0.1.2 真正实现，不再是占位）
- 体积影响：单 HTML 注入约 730KB（Three.js + OrbitControls + CSS2DRenderer，esbuild IIFE 外链），**仅在课件包含此组件时内联**。`--inline-three` 模式可强制内联（Alice 内网离线部署）
- 交互：拖动旋转 / 滚轮缩放 / Shift+拖动平移 / 双击几何体 = 局部复位 / 双击空白 = 全局复位 / **A/D 或 ←/→ 键绕 Z 轴自转** / 右下角操作提示徽章
- 坐标系：默认 +Z 朝上（`camera.up.set(0,0,1)`），与项目 BB₁ 垂直约定一致
- 标签：DOM 形式（CSS2DRenderer），可与 KaTeX 混排、a11y 友好
- **派生顶点**（v0.1.3）：`derivedVertices: [{label, formula}]` —— formula 走 `midpoint` / `centroid` / `linear`，命名顶点变化时整组重算
- **辅助线池**（v0.1.7）：`auxLines: [{id, from, to, style, color}]` —— 默认全部隐藏，通过 `api.showAuxLines([id,...])` 或 `math-step.highlight.auxLines` toggle
- **API**：per-instance 闭包（`container.__cwApi`），向后兼容 `window.__cwGeom3D[id]`
- 路线图（v0.2+）：剖切（`clippingPlane`）/ 三视图（`views: "three"`）/ 展开图（`unfold`）

### 4.14 Slider（滑块 + 3D 顶点联动）

**用途**：拖动滑块改变某个数值，实时联动 geometry-3d 中的命名顶点位置。适用于「$P$ 在 $A_1C_1$ 上滑动」「$h$ 从 0 增到 2」等动点 / 动值教学场景。

**关键点速览**（v0.1）：
- 必填：`label` / `min` / `max`
- 联动：`linkedGeometry3d` + `drives: [{vertex, path:[a,b], param}]` —— 滑块值 $t \in [0,1]$ 在 `path` 两 label 间插值
- 联动后自动触发：CSS2D 标签移动 / 引用 label 的半透面重算 / 派生顶点重算
- 详细字段契约见 [`docs/slider-schema.md`](./docs/slider-schema.md)

### 4.15 Tetra-equiv（同体异构四面体）

**用途**：在同一 canvas 内**同时**显示「同一个四面体的 4 种不同摆法」（4 种底 + 4 个锥顶），让学员一眼看见「4 个形状不同、顶点不同，但体积完全相等」—— 立体几何「等体积法」教学的核心可视化。

**关键点速览**（v0.1）：
- 必填：`vertexLabels: [lbl1,lbl2,lbl3,lbl4]`（4 个顶点）+ `showAs: [4 项]`
- 每项 `showAs` 含 `base:[3 label]` / `apex:1 label` / `color` / `label`
- 联动源 `slider` 拖动 P 时，4 个四面体同步变形
- 体积校验自动显示 4 个数值（理论相等，浮点 $10^{-6}$ 误差）
- 详细字段契约见 [`docs/tetra-equiv-schema.md`](./docs/tetra-equiv-schema.md)

### 4.16 Cut-anim（剖切动画）

**用途**：动画展示「从三棱柱切下一刀得到三棱锥」的过程，把「为什么可以用 V_keep / V_total 这个比例」从抽象变成肉眼可见的几何动作。

**关键点速览**（v0.1）：
- 必填：`linkedGeometry3d` / `keepVertices:[4 label]` / `cutPlane:{type:"plane-through-points", points:[3 label]}`
- 动画方案：**不用** Three.js `clippingPlane`（兼容性差），改用「透明度动画」—— 三棱柱从 1.0 淡到 0.3，保留四面体从 0 渐显到 0.85
- 联动源 `slider` 拖动 P 时，保留四面体 / 切平面 / 完整三棱柱同步重画
- 体积提示（默认 on）：保留 / 整体 / 比例三个数值实时显示
- 详细字段契约见 [`docs/cut-anim-schema.md`](./docs/cut-anim-schema.md)

### 4.17 build.js 锚点校验（v0.1.8）

**问题**：旧版 `injectSectionIds` 按出现顺序给 h2 编号为 `section-1..N`，侧边栏也按 (i+1) 编号。一旦 frontmatter `sections` 数量 ≠ 正文 h2 数量，**sidebar 锚点会无声错位**（如三角柱 demo 漏写 `## 原题` 时 "原题"sidebar 跳到不存在的 section-1、"第(2)问"跳到 section-3 而非 section-4）。

**修复**：build.js 6/12 加了 section 7.6 校验：

```js
if (sectionsCount > 0 && h2Count > 0 && sectionsCount !== h2Count) {
  console.warn(`! 锚点错位风险：...sections=${sectionsCount}，但正文 h2=${h2Count}`);
  // 打印 sidebar 列表 + h2 列表便于排查
}
```

**约束（写新课件时）**：
- `sections` 数量 **必须** 等于正文 h2 数量
- `sections` 顺序应与 h2 在正文中出现顺序一致
- 漏写 `sections` 不会让 build 失败（向后兼容，只给 warning），但 sidebar 会是空

---

## 5. 内容大纲：《如何创作 SKILL》

> 受众：零基础小白，从没写过 SKILL

### 第 1 章：开篇（hero）
- 一句话定义 SKILL
- 为什么值得学
- 学完后能做什么

### 第 2 章：SKILL 的结构解剖
- 一个 SKILL 文件长什么样（show 完整示例）
- 三要素：name / description / body
- 用 concept-card 展示三要素
- 用 quiz 检验理解

### 第 3 章：写 SKILL 的 5 个步骤
- 用 step-guide 引导
- 每一步配 1 个 quiz 或 fill-blank
- 配 1 个真实案例贯穿

### 第 4 章：常见陷阱与最佳实践
- 用 compare 展示好/坏对比
- 用 callout 标记高频错误
- 用 `<details>` 收 FAQ

### 第 5 章：动手实践
- 用 step-guide 让用户跟着做一个最小 SKILL
- 提供 SKILL.md 模板下载（生成器）
- 提供"提交给 AI 让它帮你看看"的功能（生成 prompt）

### 第 6 章：收尾
- 总结
- 下一步去哪（推荐阅读/动手项目）
- 反馈渠道

---

## 6. 视觉风格

- 主题：lavender（薰衣草紫）作为基调，呼应 Alice 风格
- 字体：标题用思源黑体/Inter，正文用系统字体
- 强调：内容驱动，不堆装饰
- 响应式：优先桌面端，移动端可读

---

## 7. 实施分工

| 步骤 | 负责人 | 产出 |
|------|--------|------|
| 语法约定 + 内容大纲 | Alice（我） | 本 SPEC + 完整 markdown 内容 |
| HTML 模板 + 组件库 + 编译脚本 | 周念 | template/* + build.js |
| 内容填入 | Alice | content/how-to-create-skill.md |
| 编译整合 | 周念 | dist/<name>.html（每个 .md 独立产物） |
| README | Alice | README.md |

---

## 8. 后续优化方向（不在本次范围）

- watch 模式（改 markdown 自动重编译，配套 dev server）
- 支持内嵌图片/视频
- 支持导出 PDF（基于 print 样式 + 浏览器「另存为 PDF」可先用）
- 主题切换 UI
- 学习进度持久化（localStorage）
- 移动端深度适配

---

## 9. 内容审查清单（做新课件时的自检表）

写完一份课件后、编译前，过一遍这张表。这一节是从《如何创作 SKILL》第一版的两次 bug 修复中提炼出来的——"形式做对了，但口径跑偏"是最常见也最隐蔽的失败。

### 9.1 术语口径一致

> [!WARNING] 学员脑子里第一个"心理模型"是错的，后面全歪。

- [ ] **核心概念的指代在全文统一**。比如"SKILL"指文件夹、`SKILL.md` 指主文件——全文都用这个口径，不要混用"SKILL 文件"这种含糊说法。
- [ ] **第一次提到该概念时**用最严谨的措辞（"X 是一个文件夹，不是单个文件"），后续引用可以简化，但不能与首次定义矛盾。
- [ ] **代码示例、互动组件、Markdown 正文**三处的措辞口径要一致——别在正文里说"SKILL 文件"，在代码块里又说"`SKILL.md`"。

### 9.2 教学点前置检查

> [!TIP] 学员学到这里时，脑子里有这个概念吗？若没有，先补课再考。

- [ ] **每个互动题考察的概念，学员在本题之前已经学过**。如果考察"命名约定"，那"SKILL = 文件夹"这个概念必须已经在前文建立。
- [ ] **概念引入 → 应用 → 考察**三步在章节里是有序的。避免"先考再讲"或"边考边讲"。
- [ ] **hint 的反例要直击常见误解**。不是"想想看为什么"这种空提示，而是给一个具体反例（"如 codeReviewer"）让学员立刻判断。

### 9.3 互动题"考察点-概念-答案"三重对齐

> [!WARNING] 填空题、选择题最容易栽在这一步——题目和答案在不同维度上。

- [ ] **考察点 = 概念**：题目问的是"格式约定"还是"具体例子"？二选一，不能模糊。
- [ ] **答案对应考察点**：如果问"格式约定"，答案应该是约定本身（如"kebab-case"），不是具体例子（如"meeting-notes"）。
- [ ] **答案的可接受范围明确**：多空用 `answers` 数组 + `{{1}} {{2}} {{3}}` 显式占位，每空可写等价集合（fill-blank v0.2.0+）；旧 `answer: "A|B"` 写法仍兼容。写清楚是否区分大小写、是否允许同义词。
- [ ] **错答反馈**有教学价值：不是"答错了，再想想"，而是给出正确答案 + 一句"为什么这样"的解释。

### 9.4 编译前最后一次核查

- [ ] 跑 `node build.js` 编译成功
- [ ] 打开 `dist/<name>.html`，翻完所有章节，肉眼检查每页渲染正确
- [ ] 把所有 quiz / fill-blank 自己答一遍，确认反馈逻辑没问题
- [ ] 打印预览（Cmd/Ctrl + P）检查 @media print 样式：侧栏隐藏、答案展开、每章新页
- [ ] 检查贯穿案例（如"会议纪要 SKILL"）在全文中的引用一致

