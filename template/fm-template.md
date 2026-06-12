# 课件 Markdown 模板（复制此文件开始写新课件）

> **用法**：复制本文件 → 删掉所有 `<!-- -->` 注释 → 在 `# 一级标题` 处开始写正文。
> **frontmatter 在前，正文在后**。两个 `---` 之间的内容是 frontmatter，控制 sidebar、标题、主题等元信息。
> **漏写 `sections` 会让 sidebar 是空的**——build.js 会给 warning 兜底，但写之前看一眼 binary-card-trick.md 是怎么写的，最稳。

---

<!--
================================================================================
FRONTMATTER 必填与可选字段说明
================================================================================
必填：
  title            课件标题（sidebar 大标题、浏览器 tab 标题）

强烈建议（漏了 sidebar 会是空的）：
  sections         章节列表，对应正文里所有 `##` 二级标题
                   ⚠️ 写完正文后必须回来同步这一段，否则 sidebar 跳不过去

可选：
  subtitle         副标题（sidebar 标题下小字）
  description      课件简介（meta description、分享卡）
  author           作者名（sidebar 底部）
  theme            主题色：lavender / champagne / green / dark / rosegold / blue（缺省 lavender）
  emoji            sidebar 标题前的小图标（一个 emoji 字符）

================================================================================
sections 两种格式（二选一，不要混用）
================================================================================

格式 A：字符串数组（最简单，90% 场景用这个）
按 `##` 在正文里出现的顺序排列。
  sections:
    - 一、热身：5 个问题猜中你的数字
    - 二、什么是二进制？
    - 三、二进制的运算规则

格式 B：对象数组（需要自定义锚点 id 时用）
缺 id 时自动回退到数组下标 + 1，与 marked 默认生成的 h2 id 对齐。
  sections:
    - {id: 1, title: '一、热身：5 个问题猜中你的数字'}
    - {id: 2, title: '二、什么是二进制？'}
    - {id: 5, title: '五、彩蛋与挑战'}     ← id 跳号时显式指定
================================================================================
-->

---

title: 课件标题
subtitle: 副标题（可选）
description: 课件简介（可选，1-2 句话）
author: 作者名（可选）
theme: lavender
emoji: 🧩
sections:
  - id: ch1
    title: 章节 1 标题
  - id: ch2
    title: 章节 2 标题
  - id: ch3
    title: 章节 3 标题
---

# 一级标题（H1，每个 markdown 只能有一个）

> 这里写一段导言 / 学习目标 / 适用人群。
> 导言结束后，下面开始写 `##` 二级标题，每个对应 sidebar 一个 li。

## 章节 1 标题

> 复制本模板后**先改 hero 标题和 sections 列表**，再开始写正文。

章节导言段（可选）。

> 章节要点或学习目标（可选 callout）。

```hero
{
  "emoji": "🃏",
  "title": "用 5 张扑克牌学会二进制",
  "subtitle": "数学 + 魔术 + 计算机基础，零基础也能懂",
  "description": "本课件用扑克牌魔术开场，从直觉引入二进制概念。",
  "cta": "开始这场魔术",
  "ctaHref": "#section-1"
}
```

章节内容继续……

## 章节 2 标题

```callout
{
  "type": "tip",
  "title": "解题小技巧",
  "content": "先画图，把已知条件标在图上。`a^2 + b^2 = c^2` 是经典公式。"
}
```

```quiz
{
  "id": "q1",
  "question": "二进制的基是？",
  "options": [
    {"label": "2", "value": "2", "correct": true},
    {"label": "8", "value": "8"},
    {"label": "10", "value": "10"},
    {"label": "16", "value": "16"}
  ],
  "feedback": {"correct": "对！二进制只有 0 和 1", "wrong": "再想想"}
}
```

## 章节 3 标题

```concept-card
{
  "title": "进制",
  "description": "用一组固定的符号和规则来表示数字的方法。",
  "columns": 2,
  "items": [
    {"term": "二进制", "definition": "基为 2，只有 0/1 两个数字"},
    {"term": "十进制", "definition": "基为 10，0-9 十个数字"}
  ]
}
```

```step-guide
{
  "id": "s1",
  "title": "从右到左，每位权重翻倍",
  "steps": [
    {"label": "最右位（第 1 位）", "content": "权重 **1** (= 2^0)，亮 = 加 1"},
    {"label": "1010 = ?", "content": "**1**×8 + **0**×4 + **1**×2 + **0**×1 = **10**"}
  ]
}
```

最后一个章节……

---

<!--
================================================================================
组件字段速查（详见 [COMPONENTS.md](../COMPONENTS.md)）
================================================================================
所有组件都包在 ```xxx  围栏代码块里，内部是 JSON。

hero       必填：emoji, title, subtitle
           可选：description, cta + ctaHref, tags, visual: { value, rotated }

callout    必填：type（tip / warning / info / danger / note）, content
           可选：title

quiz       必填：question, options
           options[]: { label, value, correct: true/false }
           可选：multiSelect, feedback.{correct,wrong}

concept-card  必填：title, description
              可选：columns（1-4）, items 或 cards
              items[]: { term, definition } 或 { title, desc, icon }

step-guide    必填：id, steps[]
              steps[]: { title 或 label, content }
              可选：title（tab 大标题）, example

processInline  支持：**bold** / *italic* / `code` / [text](url) / $LaTeX$

================================================================================
写完后自检清单（推荐三秒钟过一遍）
================================================================================
□ frontmatter 里的 `title` 填了吗
□ `sections` 的每一项和正文 `##` 标题完全一致吗
□ `sections` 数量和 `##` 数量对得上吗
□ 跑一次 build，看 build 输出的 sidebar li 数量是不是 0
□ 跑一次 build，看 console 有没有 warning
□ 跑一次 build，看有没有「锚点错位风险」warning —— 说明 sections 数量 ≠ 正文 h2 数量
□ 跑一次 build，看有没有「检测到 geometry-3d 组件但未找到 cw-three-bundle.iife.js」throw
  —— 第一次跑 `npm run build:three` 把 three-bundle.iife.js 准备好
================================================================================
-->
