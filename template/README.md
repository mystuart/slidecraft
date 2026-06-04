# 互动课件框架 — 组件 API 文档

> **本目录是框架层**。写一次永久复用。换课题只改 `content/*.md`，本目录一行都不用动。

---

## 快速上手

```bash
# 编译
node build.js                              # 编译 content/*.md
node build.js content/我的课件.md           # 编译指定文件
node build.js content/*.md                  # 编译全部

# 产物
dist/<name>.html   # 每个 .md 一份独立 HTML，所有 JS/CSS 内联，可双击打开
```

---

## 7 个组件的 JSON 语法

所有组件的代码块统一用 fenced code block 包裹，**language 标记 = 组件名**：

````
```hero
{ "title": "...", ... }
```
````

### 1. hero — 开篇封面

```json
{
  "title": "如何创作 SKILL",          // 必填
  "subtitle": "从零开始...",          // 可选
  "emoji": "📘",                       // 可选
  "cta": "开始学习",                   // 可选：按钮文案（留空则按钮不渲染）
  "ctaHref": "#section-1"              // 可选：cta 跳转地址，默认 #section-1
}
```

### 2. quiz — 选择题

```json
{
  "id": "q1",                          // 必填：组件唯一 ID
  "question": "SKILL 的本质是什么？",  // 必填
  "type": "single",                    // "single" | "multi"（默认 single）
  "options": [                         // 必填
    { "id": "a", "text": "..." },
    { "id": "b", "text": "..." }
  ],
  "correct": ["a"],                    // 必填：正确答案的 id 列表
  "feedback": {                        // 可选
    "correct": "答对了！...",
    "wrong": "再想想～"
  },
  "hint": "提示文字"                    // 可选
}
```

**自动题号 + 导航**（无需配置，clientJs 自动注入）：
- 文档内出现 ≥2 个 quiz 时，每个 quiz 上方自动加「第 N / 共 M 题」角标
- quiz 之间显示「← 上一题 / 下一题 →」按钮，点击平滑滚动
- 仅 1 个 quiz 时不显示导航，避免冗余

### 3. fill-blank — 填空题

```json
{
  "id": "f1",                          // 必填
  "question": "一个 SKILL 文件通常以 ____ 命名。",  // 必填
  "answer": "SKILL.md",                // 必填；多答案用 | 分隔
  "hint": "提示文字",                   // 可选
  "placeholder": "在此输入答案",        // 可选
  "mode": "reveal"                     // 可选：reveal（默认，答错显示 hint/答案） | practice（自测，答错只显对错）
}
```

**比对规则**：不区分大小写、忽略首尾空格、答案中任一匹配即算对。

### 4. step-guide — 步骤引导

```json
{
  "id": "s1",                          // 必填
  "title": "5 个步骤",                  // 可选
  "steps": [                           // 必填
    {
      "title": "明确触发场景",          // 必填
      "content": "步骤内容...",          // 必填
      "example": "示例"                  // 可选
    }
  ]
}
```

### 5. compare — 前后对比

```json
{
  "id": "c1",                          // 必填
  "title": "对比标题",                  // 可选
  "left": {                            // 必填
    "label": "不好的 SKILL",
    "tag": "bad",                      // good | bad | warn | neutral
    "points": ["...", "..."]
  },
  "right": {                           // 必填
    "label": "好的 SKILL",
    "tag": "good",
    "points": ["...", "..."]
  }
}
```

`label` 和 `points` 每一项都支持内联 markdown：**bold** / *italic* / `code` / [link](url)。

### 6. concept-card — 概念卡片网格

```json
{
  "id": "cc1",                         // 必填
  "title": "三要素",                    // 可选
  "columns": 3,                        // 1 | 2 | 3 | 4（默认 3）
  "cards": [                           // 必填
    { "icon": "🎯", "title": "name", "desc": "..." },
    { "icon": "📝", "title": "description", "desc": "..." }
  ]
}
```

### 7. callout — 高亮块

```json
{
  "type": "tip",                       // tip | warning | info | danger | note
  "title": "小贴士",                    // 可选（不填用默认标题）
  "content": "正文内容..."              // 必填
}
```

---

## Frontmatter 字段

```yaml
---
title: 如何创作 SKILL            # 必填
subtitle: 从零开始...            # 可选
author: Alice                    # 可选
theme: lavender                  # 可选：lavender（其他主题后续扩展）
sections:                        # 可选：侧边导航章节
  - 第一章
  - 第二章
---
```

**注意**：`sections` 数组的顺序要与正文中 `## 标题` 的顺序一一对应。`build.js` 会自动给 `## 标题` 注入 `id="section-N"`，侧边导航通过锚点跳转。

---

## 主题：lavender

当前内置主题是 lavender（薰衣草紫）。所有颜色通过 CSS 变量驱动，换主题改 `template/styles/main.css` 顶部的 `:root` 块即可：

```css
:root,
[data-theme="lavender"] {
  --color-primary: #8b7dd8;
  --color-primary-dark: #6c5db8;
  /* ... */
}
```

---

## 文件结构

```
courseware/
├── content/              # ← 你要改的就这个目录
│   └── 你的课件.md
├── template/             # ← 框架层，原则上不动
│   ├── index.html.tpl    # HTML 骨架
│   ├── components/       # 各组件渲染器
│   │   ├── _inline.js    # 公共：内联 markdown 处理（processInline）
│   │   ├── hero.js
│   │   ├── quiz.js
│   │   ├── fill-blank.js
│   │   ├── step-guide.js
│   │   ├── compare.js
│   │   ├── concept-card.js
│   │   ├── callout.js
│   │   └── renderer.js   # 主调度器
│   └── styles/
│       └── main.css      # 所有样式（CSS 变量驱动）
├── build.js              # 编译脚本
├── dist/                 # 编译产物（每个 .md 独立一份）
│   └── <name>.html
├── EXAMPLE.md            # 演示文件
└── template/README.md    # 本文档
```

---

## 内部约定（给维护者看）

### 编译流程
1. `gray-matter` 拆 frontmatter + body
2. `renderer.processMarkdown` 扫所有 fenced code block，识别 `lang` 是组件名的部分，调用对应渲染器，替换为 HTML 注释占位符 `<!--CW-COMPONENT-N-->`
3. `marked` 渲染剩余 markdown（占位符作为 HTML 注释原样保留）
4. `renderer.mergeComponents` 把占位符替换回组件 HTML
5. `injectSectionIds` 给 `<h2>` 注入 `id="section-N"`
6. 注入 `index.html.tpl`，写 `dist/<name>.html`（每个 markdown 独立产物，避免互相覆盖）

### 客户端 JS
- 各组件的 `clientJs` 字段是字符串
- `renderer.collectClientScript()` 拼起来
- 内联到最终 HTML 的 `<script>` 块
- **不依赖任何外部 CDN**

### 扩展一个新组件
1. 在 `template/components/` 新建 `xxx.js`，export `{ render, clientJs? }`
2. 在 `template/components/renderer.js` 的 `COMPONENT_MAP` 加一行
3. 在 `template/styles/main.css` 加样式
4. 在 `template/README.md` 加 API 文档

完事。
