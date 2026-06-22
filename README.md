# Slidecraft

**中文** · [English](./README.en.md)

> **写一个 Markdown，产出一个独立的 HTML 互动课件。**
> 24 个内嵌组件 · 单文件分发 · 零运行时 · 主题可换 · 打印友好。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version: 1.4.0](https://img.shields.io/badge/version-1.4.0-blue.svg)](./COMPONENTS.md)
[![Components: 24](https://img.shields.io/badge/components-24-green.svg)](./COMPONENTS.md)
[![Output: single .html](https://img.shields.io/badge/output-single%20.html-brightgreen.svg)](./dist)

---

## 一句话讲清

**Slidecraft = Markdown 源 + 互动组件 + 单文件 HTML 产物。**

写课件就是写 Markdown。互动组件（选择题、3D 几何、滑块联动、剖切动画……）用 fenced code block 嵌进 Markdown，编译后是一个独立 HTML 文件——**双击就能在浏览器打开，发给谁都能看，离线也能用，能打印留档**。

换话题只改一个 `.md` 文件，框架部分完全不用动。

---

## 适合谁

| 你是谁 | 用 Slidecraft 做什么 |
|---|---|
| **教师 / 培训师** | 做一份带互动题、3D 演示、打印讲义的课件 |
| **知识博主 / 自媒体** | 把长文做成可交互的网页专栏 |
| **开源作者** | 给项目做带演示组件的交互式文档 |
| **学生 / 家长** | 整理一份可分享、可打印的复习资料 |

---

## 30 秒做出你的第一份课件

```bash
git clone https://github.com/mystuart/slidecraft.git
cd slidecraft
npm install
npm run build:three    # 一次性打包 Three.js（仅用 3D 组件时需要，产物进 dist/）
node build.js content/triangular-prism-demo.md
open dist/triangular-prism-demo.html
```

看到浏览器里立体的三角棱柱能转、能切、能高亮——成了。

> `build:three` 只在课件用到 `geometry-3d` / `cut-anim` / `tetra-equiv` 等 3D 组件时必跑。后续 build 会自动 hash 缓存破坏 + 拆外链；想单文件离线部署用 `node build.js content/xxx.md --inline-three`（Three.js 内联进 HTML）。

**写课件时的开发循环：**

```bash
npm run dev      # watch + 静态服务（改 .md 自动重 build，浏览器刷新即可看效果）
npm run build    # 一次性全量编译 content/ 下所有 .md
npm test         # 跑测试（数值算法 / build 校验逻辑）
```

> `npm run dev` 用 `& python3` 启静态服务，**仅 Linux/macOS 可用**。Windows 用户请手动跑 `node build.js --watch`，另开终端 `python -m http.server 8000 --directory dist`（或用 `npx serve dist`）。

---

## 跟同类工具比，Slidecraft 强在哪

| 工具 | 运行时依赖 | 输出形式 | 互动组件 | 主题可换 | 打印友好 |
|---|---|---|---|---|---|
| Marp | 浏览器 | 多文件 | ❌ | ⚠️ | ❌ |
| Reveal.js | 浏览器 | 多文件 | ⚠️ | ✅ | ❌ |
| Slidev | Node 服务 | 多文件 | ✅ | ✅ | ❌ |
| **Slidecraft** | **零** | **单文件 HTML** | **✅ 24 个** | **✅ CSS 变量** | **✅** |

**Slidecraft 的核心差异**：产物是**单文件 HTML**，不是 Web 应用。这决定了它可以——

- 邮件附件发出去
- U 盘拷给学生
- 微信传文件直接打开
- 打印成纸质讲义（侧栏自动隐藏、答案强制展开、每章新页）
- 部署到任何静态托管（甚至 `file://` 协议）

---

## 24 个内嵌组件速览

完整 API 见 [`template/components/*.js`](./template/components/) 顶部 JSDoc。

| 类别 | 组件 | 一句话 |
|---|---|---|
| **内容** | `hero` | 封面大标题 |
| | `concept-card` | 概念卡片网格 |
| | `callout` | 高亮块（tip/warning/info/danger/note） |
| | `step-guide` | 步骤引导 |
| | `compare` | 前后对比 |
| | `timeline` | 时间线（历史 / 流程节点） |
| | `chart` | 数据图表（柱 / 折 / 饼） |
| | `tabs` | 标签页切换（并列对比） |
| | `stat-grid` | 数据卡片墙（关键数字） |
| | `quote` | 引用语 / 金句 |
| | `diagram` | 流程图 / 关系图（SVG） |
| | `code-runner` | 代码 + 输出对照 |
| **练习** | `quiz` | 选择题（单/多选） |
| | `quiz-track` | 题组 |
| | `fill-blank` | 填空题 |
| | `math-step` | 分步解题（带高亮联动） |
| **数学** | `formula` | 数学公式块（KaTeX） |
| | `coords-2d` | 2D 平面坐标系（函数曲线/交点/滑块联动底座） |
| | `function-plot` | 函数图像（polynomial/sine/conic） |
| | `intersection-marker` | 交点标记（手动 + polynomial 自动求交） |
| **3D 立体几何** | `geometry-3d` | 3D 几何体（盒/球/棱柱/棱锥……） |
| | `slider` | 滑块联动（form-B：3D 顶点 / 2D 函数） |
| | `trajectory` | 轨迹动画（slider 联动画路径） |
| | `tetra-equiv` | 同体异构四面体 |
| | `cut-anim` | 剖切动画 |

组件用 fenced code block 嵌进 Markdown，最小示例：

````markdown
```quiz
{
  "question": "三角函数 sin(π/2) 等于多少？",
  "type": "single",
  "options": [
    {"id": "a", "text": "0"},
    {"id": "b", "text": "1"},
    {"id": "c", "text": "-1"}
  ],
  "correct": ["b"]
}
```
````

---

## 一份完整课件长什么样

**整个流程 3 步：**

### 1. 写 Markdown

在 `content/` 下新建 `xxx.md`，顶部加 frontmatter，正文里嵌入组件：

````markdown
---
title: 三角函数入门
subtitle: 从单位圆到 sin/cos
author: 你的名字
theme: lavender
sections:
  - 一、什么是三角函数
  - 二、单位圆
  - 三、基本关系
---

```hero
{"title": "三角函数入门", "subtitle": "从单位圆到 sin/cos", "emoji": "📐", "cta": "开始学习"}
```

## 一、什么是三角函数

正文 markdown 照常写……
````

### 2. 编译

```bash
node build.js                      # 编译 content/ 下所有 .md
node build.js content/xxx.md       # 编译指定文件 → dist/xxx.html
```

### 3. 分发

把 `dist/<name>.html` 发出去。**对方不需要装任何东西**，双击就能看。想打印留档也可以，框架已内置 `@media print` 样式。

---

## Frontmatter 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 页面标题、hero 大标题 |
| `subtitle` | ❌ | 副标题、meta description |
| `author` | ❌ | 作者名 |
| `theme` | ❌ | 主题名：`lavender`（默认）/ `dark` |
| `sections` | ✅ | 章节标题列表，自动生成侧边导航 |

---

## 进阶用法

### 换主题

编辑 `template/styles/main.css` 顶部的 `:root[data-theme="..."]` 块，改 CSS 变量即可。
已内置 `lavender`（浅色默认）和 `dark`（深色护眼）两套。想加新主题：复制其中一块、改变量值、在 frontmatter 里指定 `theme: 新名字`。

### 加新组件

1. 在 `template/components/` 下新建 `my-component.js`，导出一个 `render(json) => htmlString` 函数（如需支持数组模式如 `quiz-track`，再导出一个 `renderTrack(json[]) => htmlString`）
2. 在 `template/components/renderer.js` 里**两处**注册：
   - 顶部 `require` 块加一行：`const myComponent = require('./my-component.js');`
   - `COMPONENT_MAP` 加一条：`'my-component': myComponent,`（可顺手加 `mycomponent` / `my_component` 别名）
3. 在 `template/styles/main.css` 加 `.my-component` 相关样式
4. 在 `template/components/my-component.js` **顶部 JSDoc 块**写字段表 + v0.x.x 版本号
5. 在 markdown 里用 ` ```my-component ` fenced code block 触发

完整流程见 [CONTRIBUTING.md#加新组件](./CONTRIBUTING.md#加新组件)。

### 普通 Markdown 怎么用

普通 markdown（标题、列表、引用、代码块、图片、表格、`<details>` 折叠、链接）照常写，自动渲染。

---

## 内置演示

| 文件 | 看点 |
|---|---|
| `content/index.md` | 项目 landing page（dark 主题，链向 showcase） |
| `content/components-showcase.md` | 14 个组件 × 30+ 变体的大型 showcase |
| `content/2d-components-showcase.md` | 2D 组件完整展示 |
| `content/binary-card-trick.md` | 二进制与纸牌魔术的 6 章节课件 |
| `content/dark-theme-test.md` | dark 主题视觉验证（背景/文字/边框可读性） |
| `content/formula-test.md` | 公式组件（formula）的数学/化学/物理场景 |
| `content/math-step-test.md` | 分步解题组件（math-step）的展示 |
| `content/geometry-3d-test.md` | 3D 几何组件（geometry-3d）的多几何体展示 |
| `content/triangular-prism-demo.md` | 立体几何大题完整解法（4 组件联动） |
| `content/gaokao-2020-jiangsu-q18.md` | 真实高考题 4 组件联动课件 |
| `content/timeline-test.md` | 时间线组件（timeline）的 vertical/horizontal 模式 + 边界情况 |
| `content/chart-test.md` | 数据图表（chart）的柱/折/饼三种类型 + 边界情况 |
| `content/tabs-test.md` | 标签页切换（tabs）的多解法/多视角对照 |
| `content/stat-grid-test.md` | 数据卡片墙（stat-grid）的数字冲击 + 趋势标记 |
| `content/quote-test.md` | 引用语（quote）的金句 + 作者署名 |
| `content/diagram-test.md` | 流程图（diagram）的决策树/系统架构 |
| `content/code-runner-test.md` | 代码对照（code-runner）的代码 + 输出折叠 |
| `content/how-to-create-skill.md` | 「如何创作 SKILL」课件——用 Slidecraft 做 Slidecraft 教程的范例 |

---

## 文档索引

- [CHANGELOG.md](./CHANGELOG.md) — 版本变更记录
- [README.en.md](./README.en.md) — English documentation
- [SPEC.md](./SPEC.md) — 完整设计规范（理念、语法约定、内容大纲）
- [COMPONENTS.md](./COMPONENTS.md) — 组件登记簿（v0.x.x 状态、打磨参考、决策依据）
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南与扩展流程
- [template/components/*.js](./template/components/) — 组件源码，字段契约在文件顶部 JSDoc
- [docs/](./docs/) — 进阶 schema 与设计文档
  - [docs/README.md](./docs/README.md) — docs 目录索引
  - [docs/geometry-3d-schema.md](./docs/geometry-3d-schema.md) — geometry-3d 进阶路线图（剖切/三视图/展开图）
  - [docs/slider-schema.md](./docs/slider-schema.md) — slider 字段契约（v0.1）
  - [docs/tetra-equiv-schema.md](./docs/tetra-equiv-schema.md) — tetra-equiv 字段契约（v0.1）
  - [docs/cut-anim-schema.md](./docs/cut-anim-schema.md) — cut-anim 字段契约（v0.1）
  - [docs/brand.md](./docs/brand.md) — Logo / 视觉资产规范

---

## 路线图

当前 24 个组件之外的候选（与 [SPEC.md §4.10](./SPEC.md#410-组件清单) 同步）：

- `accordion`（折叠列表）—— 当前用 `<details>` 替代
- `code-reviewer`（代码对比+高亮）—— 内容量大时再加
- geometry-3d 进阶：`clippingPlane`（剖切）/ `views: "three"`（三视图）/ `unfold`（展开图）

需要时按"加新组件"流程扩展即可。

---

## License

MIT —— 详见 [LICENSE](./LICENSE)。
