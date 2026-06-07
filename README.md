# 互动课件框架

> 一套「内容与框架解耦」的课件系统：Markdown 是源、HTML 是产物，**换话题只改一个 markdown 文件**。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version: 1.1.0](https://img.shields.io/badge/version-1.1.0-blue.svg)](./COMPONENTS.md)
[![Components: 10](https://img.shields.io/badge/components-10-green.svg)](./COMPONENTS.md)
[![Size: ~150KB](https://img.shields.io/badge/size-~150KB-lightgrey.svg)](./dist)

## 特性

- **零运行时依赖** —— 编译后是单个 HTML 文件，所有 JS/CSS 内联，双击就能打开
- **Markdown 即源** —— 写课件就是写 markdown，互动组件用 fenced code block 嵌入
- **10 个互动组件** —— 封面、选择题、题组、填空、步骤引导、前后对比、概念卡片、高亮块、数学公式、分步解题
- **主题可换** —— CSS 变量驱动，lavender / 默认 / 自定义，换一行就行
- **打印友好** —— 内置 `@media print` 样式，侧栏自动隐藏、答案展开、每章新页
- **响应式** —— 桌面端优先，移动端可读

## 快速开始

```bash
cd courseware
npm install              # 装 gray-matter + marked
node build.js            # 编译 content/*.md → dist/<name>.html
open dist/how-to-create-skill.html     # 在浏览器查看
```

## 目录结构

```
courseware/
├── content/             # 源内容（换话题只改这里）
│   └── how-to-create-skill.md
├── template/            # 框架（写一次永久复用）
│   ├── index.html.tpl   # HTML 骨架
│   ├── components/      # 10 个组件 + _inline 公共工具
│   ├── styles/main.css  # CSS 变量驱动主题（含 @media print 打印样式）
│   └── README.md        # 组件 API 详细文档
├── build.js             # 编译脚本
├── COMPONENTS.md        # 组件登记簿（v0.x.x 状态、打磨参考、决策依据）
├── SPEC.md              # 设计规范
├── package.json
└── dist/                # 编译产物（每个 .md 独立一份，分发这些）
    └── <name>.html
```

## 如何换话题

**整个流程只需要 3 步**：

### 1. 写一个 markdown 文件

在 `content/` 下新建 `xxx.md`，顶部加 frontmatter：

```markdown
---
title: 你的课件标题
subtitle: 副标题（可选）
author: 你的名字（可选）
theme: lavender
sections:
  - 第一章标题
  - 第二章标题
  - ...
---

\`\`\`hero
{
  "title": "封面大标题",
  "subtitle": "封面副标题",
  "emoji": "📘",
  "cta": "开始学习"
}
\`\`\`

## 章节标题

正文 markdown 照常写...
```

### 2. 编译

```bash
node build.js
```

默认编译 `content/` 下所有 `.md` 文件，每个 `.md` 输出到独立的 `dist/<name>.html`（互不覆盖）。  
想编译指定文件：`node build.js content/xxx.md` → 输出到 `dist/xxx.html`。

### 3. 分发

把 `dist/<name>.html` 发出去，对方双击就能在浏览器打开，**不需要任何环境**。想打印留档也可以，框架已内置 `@media print` 样式（侧栏自动隐藏、答案强制展开、每章新页）。

## Frontmatter 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 页面标题、hero 大标题 |
| `subtitle` | 否 | 副标题、meta description |
| `author` | 否 | 作者名 |
| `theme` | 否 | 主题名（默认 lavender，未来支持多主题） |
| `sections` | 是 | 章节标题列表，自动生成侧边导航 |

## 组件速查

完整 API 见 [template/components/*.js](./template/components/) 顶部 JSDoc，下面是速查表。

| 组件 | 用途 | 最小示例 |
|------|------|----------|
| `hero` | 封面 | `{"title": "标题", "cta": "开始"}` |
| `quiz` | 选择题（单/多选） | `{"question": "?", "type": "single", "options": [...], "correct": ["a"]}` |
| `fill-blank` | 填空题 | `{"question": "答案是 ____", "answer": "42"}` |
| `step-guide` | 步骤引导 | `{"title": "标题", "steps": [{"title": "步骤1", "content": "..."}]}` |
| `compare` | 前后对比 | `{"left": {...}, "right": {...}}` |
| `concept-card` | 概念卡片网格 | `{"cards": [{"icon": "🎯", "title": "...", "desc": "..."}]}` |
| `callout` | 高亮块 | `{"type": "tip", "content": "..."}` |
| `formula` | 数学公式块 | `{"expr": "E = mc^2", "caption": "质能方程"}` |
| `math-step` | 分步解题 | `{"question": "...", "steps": [{"title": "...", "content": "..."}]}` |
| `quiz-track` | 题组（quiz 数组） | `[{"question": "?", "type": "single", "options": [...], "correct": ["a"]}, ...]` |

类型：`tip` / `warning` / `info` / `danger` / `note`，五种配色。

## 进阶用法

### 换主题

编辑 `template/styles/main.css` 顶部的 `:root[data-theme="..."]` 块，改 CSS 变量即可。
想加新主题：复制 lavender 块、改变量值、在 frontmatter 里指定 `theme: 新名字`。

### 加新组件

1. 在 `template/components/` 下新建 `my-component.js`，导出一个 `render(json) => htmlString` 的函数
2. 在 `renderer.js` 里注册：`renderer.register('my-component', require('./my-component').render)`
3. 在 `template/styles/main.css` 加 `.my-component` 样式
4. 在 markdown 里用 ` ```my-component ` fenced code block 触发

完整流程见 [CONTRIBUTING.md](./CONTRIBUTING.md#扩展指南)。

### 普通 Markdown 怎么用

普通 markdown（标题、列表、引用、代码块、图片、表格、`<details>` 折叠、链接）照常写，自动渲染。

## 演示

- `content/how-to-create-skill.md` — 完整 6 章节课件（《如何创作 SKILL》）
- `content/components-showcase.md` — 10 个组件 × 20+ 变体的大型 showcase
- `content/binary-card-trick.md` — 二进制与纸牌魔术的 6 章节课件
- `content/formula-test.md` — 公式组件（formula）的数学/化学/物理场景
- `content/math-step-test.md` — 分步解题组件（math-step）的展示

## 设计文档

- [SPEC.md](./SPEC.md) — 完整设计规范（理念、语法约定、内容大纲）
- [template/components/*.js](./template/components/) — 组件源码，字段契约在文件顶部 JSDoc

## 后续可扩展

MVP 10 个组件之外的候选（与 [SPEC.md §4.10](./SPEC.md#410-组件清单) 同步）：
- `accordion`（折叠列表）—— 当前用 `<details>` 替代
- `code-reviewer`（代码对比+高亮）—— 内容量大时再加
- `timeline`（时间线）—— 适合讲发展史

需要时按"加新组件"流程扩展即可。

## License

MIT —— 详见 [LICENSE](./LICENSE)。
