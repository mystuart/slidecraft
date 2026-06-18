---
title: Slidecraft
subtitle: 写一份 Markdown，产出一个独立可交互课件
author: Slidecraft
theme: dark
sections:
  - 卖点
  - 上手
  - 组件
  - 开始
---

<div class="landing-hero">
  <div class="landing-hero-inner">
    <h1 class="landing-hero-title">Slidecraft</h1>
    <p class="landing-hero-subtitle">写一份 Markdown，产出一个独立可交互课件。</p>
    <p class="landing-hero-tagline">3D 几何 · 公式推导 · 填空题组 · 全部原生交互，不是图片。单文件输出，双击打开。</p>
    <div class="landing-hero-cta">
      <a class="landing-btn landing-btn-primary" href="components-showcase.html">看组件演示 →</a>
      <a class="landing-btn landing-btn-ghost" href="#section-2">30 秒上手</a>
    </div>
  </div>
</div>

```geometry-3d
{
  "geometry": "triangular-prism",
  "size": [2.4, 2.4],
  "autoRotate": true,
  "autoRotateSpeed": 1.5,
  "background": "#1a1a24",
  "showVertices": false,
  "showAxes": false,
  "showGrid": false,
  "showEdges": true,
  "showFaces": true,
  "edgeColor": "#4a4260",
  "faceColor": "#8b7dd8",
  "opacity": 0.85,
  "camera": { "position": [3.2, 2.6, 3.8], "target": [0, 0, 0.8], "fov": 45 }
}
```

## 卖点

```concept-card
{
  "id": "cc-features",
  "title": "**为什么是 Slidecraft**",
  "columns": 3,
  "cards": [
    {
      "icon": "📄",
      "title": "单文件输出",
      "desc": "一个 `.html` 装下全部——内容、样式、交互、3D 引擎。**双击打开**，离线可用，零运行时依赖。发邮件、丢 U 盘、嵌 iframe 都行。"
    },
    {
      "icon": "🎲",
      "title": "交互原生",
      "desc": "3D 几何可拖动旋转、公式 KaTeX 渲染、填空即时判分、题组 carousel 导航。**不是截图，是真的能玩**。"
    },
    {
      "icon": "✍️",
      "title": "写即所得",
      "desc": "Markdown 写正文 + JSON 配组件。`node build.js` 一键产物。**会写文档就会做课件**，无需前端基础。"
    }
  ]
}
```

**适合谁**：数学/物理/化学老师做复习资料 · 培训机构做互动讲义 · 开源项目做交互式文档 · 任何想"把静态内容变可玩"的人。

## 上手

三步跑起来——

```code-runner
{
  "title": "30 秒上手",
  "lang": "bash",
  "code": "git clone https://github.com/mystuart/slidecraft.git\ncd slidecraft\nnpm install && node build.js\n# 产物在 dist/，双击任意 .html 即可",
  "output": "✓ Built dist/components-showcase.html\n✓ Built dist/geometry-3d-test.html\n✓ Built 17 files total\n\n打开 dist/components-showcase.html 看效果",
  "note": "零配置。Node 18+ 即可。无需数据库、无需后端、无需构建服务器。"
}
```

写一个最简课件——正文是标准 Markdown，组件用围栏块 + JSON 配置：

> **frontmatter** 设标题和主题 → **二级标题** 自动生成侧边栏锚点 → **组件围栏块** 内写 JSON 配置 → node build.js 出产物。
>
> 示例：一个含 3D 立方体 + 行内公式 + 选择题的课件，源码不到 20 行。组件字段契约见各 template/components/\*.js 顶部 JSDoc，真实示例见 [组件总览](components-showcase.html)。

```callout
{
  "type": "info",
  "title": "组件怎么写",
  "content": "每个组件就是一个带组件名的围栏代码块，里面是 JSON。比如 geometry-3d：写 geometry / size / camera 几个字段就能渲染一个可旋转的 3D 立体。quiz 写 question / options / answer。formula 写 expr。会写 JSON 就会用全部 27 个组件。"
}
```

## 组件

27 个组件（含内部工具），覆盖课件常见场景。下面是几个核心组件的预览——

```tabs
{
  "title": "核心组件预览",
  "tabs": [
    {"label": "3D 几何", "content": "`geometry-3d` 渲染可拖动旋转的立体——正方体、三角柱、棱锥、八面体等 9 种。支持辅助线池、顶点标签、半透面、直角标记、math-step 步骤联动高亮。本页顶部那个旋转的三角柱就是它（配 `autoRotate: true`）。"},
    {"label": "公式", "content": "`formula` 用 KaTeX 编译时渲染 LaTeX，支持块级自动编号、`\\text{中文}`、showExpr 折叠展开推导。行内 `$...$` 和块级 `$$...$$` 在正文中随处可用，本句的 $E = mc^2$ 就是。"},
    {"label": "题组", "content": "`quiz-track` 把多道 `quiz` 串成 carousel，带进度时间轴、4 态节点（未答/全对/部分对/答错）、完成时统计 callout。适合做\"一组强化练习\"。"},
    {"label": "填空", "content": "`fill-blank` 多空 `{{1}} {{2}}` 占位 + 每空独立等价集合（`H|O` 表示 H 或 O 都对）+ 占位编号硬校验。parchment 风格的 hairline 输入框。"}
  ]
}
```

> 完整组件清单 + 字段契约 + 真实示例：打开 **[组件总览](components-showcase.html)**（17 个组件的可交互 demo）。

## 开始

```callout
{
  "type": "tip",
  "title": "现在就试",
  "content": "**最快路径**：clone 仓库 → `npm install` → `node build.js` → 打开 `dist/components-showcase.html`。整个流程不到 1 分钟，零配置。"
}
```

- **源码与文档**：[github.com/mystuart/slidecraft](https://github.com/mystuart/slidecraft)
- **组件总览**：[components-showcase.html](components-showcase.html)
- **3D 几何演示**：[triangular-prism-demo.html](triangular-prism-demo.html) · [geometry-3d-test.html](geometry-3d-test.html)
- **设计规范**：[COMPONENTS.md](https://github.com/mystuart/slidecraft/blob/main/COMPONENTS.md) · [SPEC.md](https://github.com/mystuart/slidecraft/blob/main/SPEC.md)

MIT 协议 · 用爱发电，欢迎 issue 和 PR。
