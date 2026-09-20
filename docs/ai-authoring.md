# AI 课件创作指南（把本文投喂给任意 AI agent）

> **用途**：把本文（或其链接）直接放进 prompt / 系统提示词，任何 LLM（ChatGPT、Claude、
> Cursor、ZCode 等）即可按 Slidecraft 的全部约束产出可直接 build 的课件 Markdown。
>
> **信息源唯一化**：组件字段的完整契约以 `template/components/*.js` 顶部 JSDoc 为准，
> 本文只收「AI 写课件时必须知道的事」——硬约束、最小可用 schema、自检闭环。
> 两者冲突时以 JSDoc 为准，并提 issue 修本文。

---

## 你（AI）要做什么

用户给你一个主题，你产出一个 `content/<name>.md` 文件，然后在 slidecraft 项目根目录跑
`node build.js content/<name>.md` 验证通过。产物是 `dist/<name>.html`——单文件、零运行时、
可离线、可打印的互动课件。

**写作顺序建议**：先列 `sections` 章节骨架（教学叙事：引入 → 概念 → 例题 → 练习 → 总结），
再按骨架填正文和组件。每章结尾配 1 个练习组件（quiz / fill-blank / quiz-track）。

---

## 硬约束（违反 = build 失败或静默劣化）

1. **frontmatter 必填 `title`**；`sections` 可省略——缺省自动按正文 `##` 二级标题生成侧栏；
   **显式给出时**数量必须恰好等于 `##` 数量且顺序一致（违反 `exit 1`）。不确定时干脆不写 `sections`。
2. 组件只通过 fenced code block 嵌入，语言标记必须是组件名（如 ` ```quiz `），块内**必须是合法 JSON**（双引号、无尾逗号、无注释）。
3. `quiz.correct` 里的每个 id **必须存在于 options[].id**（区分大小写）；选择题至少 2 个选项，correct 非空。
4. `fill-blank` 多空占位必须从 `{{1}}` 起连续编号、不重复（`{{1}} {{2}} {{3}}`），`answers` 数组按空序对齐。
5. 数学公式用 `$...$`（行内）/ `$$...$$`（块级）LaTeX 语法；写错不会让 build 崩，但会被扫描出来 `exit 1`（KaTeX 解析失败清单）。
6. 图片用 `![alt](相对路径)`，路径相对 `.md` 文件或项目根；build 时自动内联为 data URI。
   引用不存在的图片 = `exit 1`。外链 `http(s)` 图片不内联（依赖网络，慎用）。
7. `theme` 只有两个合法值：`lavender`（默认浅色）/ `dark`。`lang` 默认 `zh-CN`，英文课件写 `en`。
8. `themeToggle: false` 可关闭读者侧深浅切换按钮（单主题设计页如 landing 用）；默认开。

## 起步最快路径

```bash
node build.js new my-course    # 生成脚手架（frontmatter + 组件示例，开箱即可编译）
vi content/my-course.md        # 在示例上改，比从零写快
node build.js content/my-course.md
```

## frontmatter 模板

```yaml
---
title: 课件主标题（同时用于 hero / 侧栏 / og:title）
subtitle: 一句话副标题
author: 作者名
theme: lavender        # lavender | dark
lang: zh-CN            # 可选，默认 zh-CN
sections:
  - 一、开篇：为什么学这个
  - 二、核心概念
  - 三、例题精讲
  - 四、动手练习
  - 五、总结与下一步
---
```

正文里**必须**有与 sections 逐条对应的 `## 一、开篇：为什么学这个` 等 5 个二级标题（文字要一致，方便人核对）。

---

## 组件速查（最小可用 schema）

> 通用规则：所有字段名用英文、字符串值可中文；`id` 全课件唯一；不确定的可选字段宁可不写。

### 叙事类（低风险，先用这些）

````
```hero
{"title": "标题", "subtitle": "副标题", "emoji": "📐", "cta": "开始学习"}
```

```callout
{"type": "tip", "title": "小贴士", "content": "支持 **加粗** `code` 和换行 \\n"}
```

```concept-card
{"title": "三要素", "columns": 3, "cards": [
  {"icon": "🎯", "title": "要点 A", "desc": "一句话说明"},
  {"icon": "📝", "title": "要点 B", "desc": "一句话说明"},
  {"icon": "💡", "title": "要点 C", "desc": "一句话说明"}
]}
```

```step-guide
{"title": "解题五步", "steps": [
  {"title": "第一步", "content": "做什么", "example": "具体例子"},
  {"title": "第二步", "content": "做什么"}
]}
```

```compare
{"title": "好 vs 坏", "left": {"label": "坏做法", "tag": "bad", "points": ["点1", "点2"]},
 "right": {"label": "好做法", "tag": "good", "points": ["点1", "点2"]}}
```

```timeline
{"mode": "vertical", "items": [
  {"title": "1950", "desc": "事件描述"},
  {"title": "2000", "desc": "事件描述"}
]}
```

```stat-grid
{"stats": [{"value": "3.14", "label": "圆周率", "trend": "up"}, {"value": "42", "label": "答案"}]}
```

```quote
{"text": "金句正文", "author": "署名"}
```

```tabs
{"title": "多解法对照", "tabs": [{"label": "解法一", "content": "……"}, {"label": "解法二", "content": "……"}]}
```

```chart
{"type": "bar", "title": "销量", "data": [{"label": "Q1", "value": 12}, {"label": "Q2", "value": 18}]}
```

```diagram
{"title": "流程", "nodes": [
  {"id": "a", "label": "开始", "shape": "rect"},
  {"id": "b", "label": "判断", "shape": "diamond"},
  {"id": "c", "label": "结束", "shape": "rect"}
], "edges": [{"from": "a", "to": "b"}, {"from": "b", "to": "c"}]}
```

```code-runner
{"lang": "python", "code": "print('hi')", "output": "hi"}
```

```feedback
{"id": "fb1", "title": "这节内容对你有帮助吗？", "email": "you@example.com"}
```
````

### 练习类（判分逻辑敏感，字段务必对齐）

````
```quiz
{"id": "q1", "question": "题干？", "type": "single",
 "options": [{"id": "a", "text": "选项 A"}, {"id": "b", "text": "选项 B"}],
 "correct": ["b"],
 "feedback": {"correct": "答对的理由", "wrong": "错因提示"},
 "hint": "给一个具体反例，不要空话", "category": "concept"}
```

```quiz-track
[
  {"id": "t1", "type": "single", "question": "第 1 题", "options": [{"id": "a", "text": "…"}, {"id": "b", "text": "…"}], "correct": ["a"]},
  {"id": "t2", "type": "multi",  "question": "第 2 题（多选）", "options": [{"id": "a", "text": "…"}, {"id": "b", "text": "…"}, {"id": "c", "text": "…"}], "correct": ["a", "c"]}
]
```

```fill-blank
{"id": "f1", "question": "光速约为 {{1}} km/s，符号是 {{2}}。",
 "answers": [["300000", "3×10^5", "3e5"], ["c", "C"]],
 "hint": "科学计数法也算对", "mode": "reveal"}
```
````

> 学员的作答会自动存 localStorage（刷新/重开自动恢复），题组完成后可一键「复制成绩」回发老师。

### 数学类（需要精确 LaTeX）

````
```formula
{"expr": "e^{i\\pi} + 1 = 0", "caption": "欧拉恒等式"}
```
````

`formula.expr` / 正文 `$...$` 都走 KaTeX：反斜杠在 JSON 字符串里要写成 `\\`（`\\pi`）。
化学式用 `\\text{}` 包裹中文/文字。

### 3D / 函数图像类（高阶，宁缺毋滥）

`geometry-3d` / `slider` / `cut-anim` / `tetra-equiv` / `coords-2d` / `function-plot` /
`intersection-marker` / `math-step` / `trajectory` 字段多、联动关系复杂，
**AI 写这类组件前必须先读**对应 `template/components/<name>.js` 顶部 JSDoc 和
`docs/*-schema.md`，不要凭记忆编字段。需要 3D 时提醒用户先跑 `npm run build:three`。

---

## 验证闭环（AI 写完必须执行）

```bash
node build.js content/<name>.md    # 必须 ✓ Built 且无 ⚠ / exit 0
npm test                           # 全绿（不改框架代码时必然通过）
```

1. build 报「锚点错位」→ 对齐 sections 与 `##` 数量/顺序（或直接删掉 sections 自动推导）。
2. build 报「公式解析错误」→ 按清单修 LaTeX（通常是 `\\` 转义或缺失 `}`）。
3. build 报「图片引用问题」→ 修路径或把图放进项目。
4. build 报 quiz 校验 throw → 核对 options[].id 与 correct。
5. 全部通过后，自检文案口径（见 SPEC.md §9）：核心概念指代全文一致；每个互动题考察的
   概念在题目前已经讲过；错答反馈给出「为什么」而不是「再想想」。

## 输出物

- `content/<name>.md`（唯一交付物，dist 由 build 生成）
- 告诉用户：`open dist/<name>.html` 预览；发给学生的就是这个 HTML 文件（可邮件/U盘/微信传输，双击即看）。
