---
title: 互动课件框架演示
subtitle: 一次开发，永久复用 — Markdown → 编译 → HTML
author: Alice
theme: lavender
sections:
  - 一、开篇（Hero）
  - 二、概念卡片
  - 三、选择题
  - 四、填空题
  - 五、步骤引导
  - 六、前后对比
  - 七、高亮块
  - 八、收尾
---

```hero
{
  "title": "互动课件框架演示",
  "subtitle": "用 Markdown 写内容，用组件做互动，一次开发永久复用",
  "emoji": "📘",
  "cta": "开始体验"
}
```

## 一、开篇（Hero）

上面的封面就是 `hero` 组件。它吃四个字段：`title` / `subtitle` / `emoji` / `cta`。

```callout
{
  "type": "tip",
  "title": "设计原则",
  "content": "Hero 一般只放在最开头作为视觉锚点，不要每章都用，会显得用力过猛。"
}
```

## 二、概念卡片

`concept-card` 用网格展示并列概念。`columns` 字段控制列数（1/2/3/4），移动端会自动塌缩成 1 列。

```concept-card
{
  "id": "cc-demo",
  "title": "Markdown 课件的 3 大优势",
  "columns": 3,
  "cards": [
    { "icon": "✍️", "title": "纯文本写作", "desc": "Vim、VS Code、任何编辑器都能写，永远不会因软件版本而打不开" },
    { "icon": "🔁", "title": "一次开发永久复用", "desc": "换课题只改 markdown，框架层（HTML/CSS/JS）一行不用动" },
    { "icon": "📦", "title": "单文件分发", "desc": "编译后是单个 index.html，邮件附件、网盘、U盘都能塞" }
  ]
}
```

## 三、选择题

`quiz` 支持单选（`type: "single"`）和多选（`type: "multi"`）。点完提交立刻出反馈，可以重做。

```quiz
{
  "id": "q-demo-1",
  "question": "本课件框架的核心编译产物是什么？",
  "type": "single",
  "options": [
    { "id": "a", "text": "一个 .pdf 文件" },
    { "id": "b", "text": "一个 index.html 单文件" },
    { "id": "c", "text": "一个 React 应用包" },
    { "id": "d", "text": "一个 Word 文档" }
  ],
  "correct": ["b"],
  "feedback": {
    "correct": "对！编译产物是单个 index.html，所有 JS/CSS 内联，零外部依赖。",
    "wrong": "再想想——本框架强调「零依赖单文件分发」。"
  },
  "hint": "看上面第一段的核心承诺。"
}
```

```quiz
{
  "id": "q-demo-2",
  "question": "以下哪些是 MVP 的 10 个组件？",
  "type": "multi",
  "options": [
    { "id": "a", "text": "hero" },
    { "id": "b", "text": "quiz" },
    { "id": "c", "text": "tabs" },
    { "id": "d", "text": "step-guide" },
    { "id": "e", "text": "accordion" },
    { "id": "f", "text": "callout" }
  ],
  "correct": ["a", "b", "d", "f"],
  "feedback": {
    "correct": "对！MVP 是 hero / quiz / quiz-track / fill-blank / step-guide / compare / concept-card / callout / formula / math-step。tabs 和 accordion 留到后续扩展。",
    "wrong": "注意：tabs 和 accordion 已被砍掉，可改用普通 markdown 或 <details> 替代。"
  }
}
```

## 四、填空题

`fill-blank` 支持不区分大小写、首尾空格忽略。多答案用 `|` 分隔（任一匹配即算对）。答错给提示。

```fill-blank
{
  "id": "f-demo-1",
  "question": "本框架编译时用的 markdown 解析库叫 ____。",
  "hint": "一个非常流行的 markdown 解析器，名字很直白。",
  "answer": "marked"
}
```

```fill-blank
{
  "id": "f-demo-2",
  "question": "frontmatter 解析用 ____ 这个 npm 包。",
  "hint": "包名就是「灰色物质」的意思。",
  "answer": "gray-matter|grayMatter"
}
```

## 五、步骤引导

`step-guide` 把多步流程组织成可点击切换的步骤条。点 tab 切换，点"上一步/下一步"按钮也行。

```step-guide
{
  "id": "s-demo-1",
  "title": "用本框架写一个新课件的 5 个步骤",
  "steps": [
    {
      "title": "写 frontmatter",
      "content": "在 markdown 文件顶部用 YAML 写 title / subtitle / sections 等元信息。sections 数组会自动生成侧边导航。",
      "example": "title: 我的课件\nsections:\n  - 第一章\n  - 第二章"
    },
    {
      "title": "写章节标题",
      "content": "用 markdown 的 ## 标记章节。frontmatter 里的 sections 数组会按顺序对应到 ## 标题，作为侧边导航锚点。",
      "example": "## 第一章：xxx\n内容..."
    },
    {
      "title": "插入组件",
      "content": "在 markdown 中用三个反引号 + 组件名（hero / quiz / step-guide 等）包裹一段 JSON，框架会自动识别并替换为对应组件。",
      "example": "在 markdown 里写一个以三个反引号 + quiz 开头的代码块，包裹 JSON 数据，框架会自动识别。"
    },
    {
      "title": "跑 build 编译",
      "content": "在 courseware 目录跑 node build.js，自动生成 dist/index.html。所有 JS/CSS 都被内联，单文件可分发。",
      "example": "$ node build.js\n✓ Built dist/index.html (12345 bytes)"
    },
    {
      "title": "分发 & 迭代",
      "content": "dist/index.html 可以邮件发、网盘传、本地双击打开。改内容时改 markdown 然后重跑 build.js，框架层永远不动。",
      "example": "下次换课题：cp -r courseware/ new-topic/ && 编辑 markdown"
    }
  ]
}
```

## 六、前后对比

`compare` 左右两列对比，支持 `good` / `bad` / `warn` / `neutral` 四种 tag 颜色。

```compare
{
  "id": "c-demo-1",
  "title": "好的写法 vs 不好的写法",
  "left": {
    "label": "不好的写法",
    "tag": "bad",
    "points": [
      "用 Word 写课件，依赖特定软件版本才能打开",
      "每个新课题都重新写一遍 HTML + CSS",
      "组件样式散落在各处，改一个要全文件搜",
      "课件内容跟样式耦合，无法直接换主题"
    ]
  },
  "right": {
    "label": "好的写法",
    "tag": "good",
    "points": [
      "用纯 markdown 写，任何编辑器都能打开",
      "框架层写一次永久复用，换课题只改 markdown",
      "组件是独立的渲染函数，样式集中管理",
      "主题色用 CSS 变量，一行换主题"
    ]
  }
}
```

## 七、高亮块

`callout` 支持 5 种 type：`tip` / `warning` / `info` / `danger` / `note`，每种配色不同。

```callout
{
  "type": "tip",
  "title": "小贴士",
  "content": "组件的 JSON 写起来「看起来不随意」，但写完一行就能在脑里 parse。如果嫌手写烦，可以做个生成器进一步降低写作成本。"
}
```

```callout
{
  "type": "warning",
  "title": "注意",
  "content": "marked 默认会自己渲染 fenced code block，框架通过先把组件代码块替换为占位符的方式绕过。占位符用 HTML 注释，marked 不会动它。"
}
```

```callout
{
  "type": "info",
  "title": "信息",
  "content": "marked 5.x 的 API 是异步的，build.js 里用 `await marked.parse(...)` 等待渲染完成。"
}
```

```callout
{
  "type": "danger",
  "title": "危险",
  "content": "不要在 marked 配置里开 `mangle: true`，会破坏 HTML 注释占位符。"
}
```

```callout
{
  "type": "note",
  "title": "笔记",
  "content": "侧边导航的 scroll-spy 用 IntersectionObserver 实现，rootMargin 设为 `-20% 0px -60% 0px` 让高亮跟着「视觉上的当前章节」走，而不是 DOM 位置。"
}
```

## 八、收尾

```callout
{
  "type": "tip",
  "title": "下一步",
  "content": "现在你可以在 content/ 目录下新建一个 xxx.md，按本文件的样子塞组件，然后跑 `node build.js xxx.md` 看效果。框架层（template/）你一行都不用动。"
}
```

> 想看更多示例，参考 `template/README.md` 里的组件 API 文档。
