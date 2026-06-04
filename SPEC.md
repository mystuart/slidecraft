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
├── SPEC.md                       # 本文档
├── content/                      # 源内容（要换话题时只改这里）
│   └── how-to-create-skill.md
├── template/                     # 框架层（写一次永久复用）
│   ├── index.html.tpl            # HTML 骨架模板
│   ├── components/               # 各互动组件的渲染函数
│   │   ├── _inline.js            # 公共：内联 markdown 处理（processInline）
│   │   ├── hero.js
│   │   ├── quiz.js
│   │   ├── fill-blank.js
│   │   ├── step-guide.js
│   │   ├── compare.js
│   │   ├── concept-card.js
│   │   ├── callout.js
│   │   └── renderer.js
│   └── styles/
│       └── main.css
├── build.js                      # 编译脚本：md → HTML
├── dist/                         # 编译产物（最终分发，每个 .md 独立一份）
│   └── <name>.html
└── README.md                     # 使用说明
```

---

## 3. Markdown Frontmatter 约定

```yaml
---
title: 如何创作 SKILL
subtitle: 从零开始，写出可复用的 AI 技能
author: Alice
theme: lavender      # 主题色：lavender / rosegold / champagne / dark / green
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

````markdown
```fill-blank
{
  "id": "f1",
  "question": "一个 SKILL 文件通常以 ____ 命名。",
  "hint": "文件名小写，用连字符分隔。",
  "answer": "SKILL.md"
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

### 4.9 组件清单

**MVP 7 个组件**（进入本次实现）：
- `hero` — 开篇封面
- `quiz` — 选择题（单选/多选，含即时反馈）
- `fill-blank` — 填空题
- `step-guide` — 步骤引导
- `compare` — 前后对比
- `concept-card` — 概念卡片网格
- `callout` — 高亮块（tip/warning/info/danger/note）

侧边导航由 frontmatter 的 `sections` 字段自动生成（无独立组件）。

**后续可扩展**（不进入 MVP）：
- `tabs`（选项卡）—— 可用普通 markdown 的小标题替代
- `accordion`（折叠列表）—— 可用 `<details>` 替代
- `code-reviewer`（代码对比+高亮）—— 内容量大时再加
- `timeline`（时间线）—— 适合讲发展史

### 4.10 组件内联 markdown 支持

`step-guide` 的 `content`、`callout` 的 `content`、`compare` 的 `label` / `points` 都支持以下内联语法（由 `template/components/_inline.js` 的 `processInline` 统一处理）：

| 语法 | 效果 | 备注 |
|------|------|------|
| `` `code` `` | 行内代码 | 优先于 `*` 解析 |
| `**bold**` | 加粗 | — |
| `*italic*` | 斜体 | — |
| `[text](url)` | 链接（新窗口） | 仅允许 `http`/`https`/`mailto`/`#` 协议 |
| `\n` | 换行 | 渲染为 `<br>` |

> 安全：所有输入先 `escapeHtml`，再做替换；`url` 走白名单协议，杜绝 `javascript:` / `data:` XSS。

### 4.11 组件字段扩展

**hero.ctaHref**（可选，默认 `#section-1`）
- `cta` 为空时整块不渲染（适合无 sections 的封面场景）
- `ctaHref` 可覆盖默认锚点

**fill-blank.mode**（可选，默认 `"reveal"`）
- `"reveal"`：答错时显示 hint 和答案（教学场景）
- `"practice"`：答错时只显示对错反馈，不显示 hint / 答案（自测场景）

**quiz 自动题号 + 导航**
- 文档内出现 ≥2 个 quiz 时，自动在每个 quiz 上方加「第 N / 共 M 题」角标
- quiz 之间显示「← 上一题 / 下一题 →」按钮，平滑滚动跳转
- 仅 1 个 quiz 时不显示导航，避免冗余
- 不需要任何额外配置，clientJs 自动扫描注入

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
- [ ] **答案的可接受范围明确**：多答案用 `|` 分隔（fill-blank 支持），写清楚是否区分大小写、是否允许同义词。
- [ ] **错答反馈**有教学价值：不是"答错了，再想想"，而是给出正确答案 + 一句"为什么这样"的解释。

### 9.4 编译前最后一次核查

- [ ] 跑 `node build.js` 编译成功
- [ ] 打开 `dist/<name>.html`，翻完所有章节，肉眼检查每页渲染正确
- [ ] 把所有 quiz / fill-blank 自己答一遍，确认反馈逻辑没问题
- [ ] 打印预览（Cmd/Ctrl + P）检查 @media print 样式：侧栏隐藏、答案展开、每章新页
- [ ] 检查贯穿案例（如"会议纪要 SKILL"）在全文中的引用一致

