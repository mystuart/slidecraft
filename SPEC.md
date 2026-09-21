# Slidecraft SPEC — 架构规范

> Markdown 写内容，HTML 是编译产物：一次开发，永久复用。
> 本文只讲**架构与不变量**：编译管线、语法约定、校验哲学、主题系统、路线图。

**当前版本：v1.10.0**（见 [`package.json`](./package.json)）

> **版本号约定**（两套，勿混）：
> - **项目版本**（`package.json`）= 功能里程碑号。每加一个体系（如 3D / 2D）或一次大的能力扩展 +0.1。
> - **组件版本**（各 `template/components/*.js` 顶部 JSDoc `@version`）= 单个组件的独立演进号，从 `0.x` 起，与项目版本无关。

> **文档分工**：README（用户上手）· 本文（架构）· [COMPONENTS.md](./COMPONENTS.md)（组件登记簿，唯一清单源）· 各组件 JSDoc（唯一字段契约源）· [docs/ai-authoring.md](./docs/ai-authoring.md)（课件创作指南，含内容自查清单）· [AGENTS.md](./AGENTS.md)（AI 会话不变量）· [CHANGELOG](./CHANGELOG.md)（历史）。

---

## 1. 核心理念

- **内容层（markdown）**：纯文本 + fenced code block 语法定义互动组件
- **框架层（HTML/JS/CSS）**：导航、样式、组件渲染逻辑（编译期）+ 渐进增强交互（运行时）
- **编译时**：build 读 markdown → 提取组件 → marked 渲染 → 注入模板 → 每个 .md 产出一份独立 HTML（`dist/<name>.html`）

三条产品不变量：**单文件零运行时**（一切渲染编译期完成）、**不静默失败**（可校验的都在 build 期校验）、**离线可分发**（邮件/U 盘/微信/file:// 全通）。

---

## 2. 编译管线（build.js）

```
读 .md
  → gray-matter 拆 frontmatter / body
  → renderer.processMarkdown    逐行扫描：```组件名 块提取为占位符（CommonMark 嵌套围栏语义，
                                   ≥4 反引号包裹层内的示例不会被误提取；未闭合 → throw）
  → marked 渲染剩余 markdown（编译期语法高亮）
  → renderer.mergeComponents     占位符替换回组件 HTML
  → processInlineFormulas        行内/块级 $...$ KaTeX 渲染（全标签保护：属性内 $ 不可见）
  → inlineImages                 相对路径 <img> → data URI（svg 走 utf8）
  → id 唯一校验                   quiz/fill-blank id 重复 → 报告 + exit 1（id 是持久化 key）
  → injectSectionIds             h2 编号 section-N（sections 缺省时侧栏按 h2 文字自动推导）
  → 模板注入                      CSS/KaTeX CSS/组件 CSS（表驱动）/搜索索引/OG 图/CLIENT_JS
  → dist/<name>.html
```

错误策略：**产物先生成、错误汇总在尾部报告、exit 1**（作者能看效果，但 CI/发布必然拦截）——KaTeX 解析错误、图片缺失、锚点错位、id 重复同此哲学。单文件失败不阻塞其余文件（错误隔离）。

---

## 3. 文件结构

```
slidecraft/
├── build.js                      # 编译器 + CLI（node build.js --help）
├── AGENTS.md                     # AI 会话的项目不变量
├── README.md / README.en.md      # 用户文档（中/英）
├── SPEC.md                       # 本文（架构）
├── COMPONENTS.md                 # 组件登记簿（概览表 = 唯一组件清单源）
├── CONTRIBUTING.md               # 贡献指南 + 发布检查单
├── CHANGELOG.md                  # 版本历史（append-only）
├── content/                      # 课件源（18 份，换话题只改这里）
├── template/
│   ├── index.html.tpl            # HTML 骨架（含 skip-link / generator meta / 主题 boot）
│   ├── components/               # 组件源码；字段契约在各自顶部 JSDoc（唯一源）
│   │   ├── _inline.js            # processInline / escapeHtml（所有组件输入的第一道闸）
│   │   ├── _lifecycle.js         # 运行时生命周期句柄（监听/observer/RAF 可销毁）
│   │   ├── _progress.js          # 学习进度持久化（localStorage，重放式恢复）
│   │   ├── _highlight.js         # 编译期语法高亮封装
│   │   ├── _geom_utils.js        # 几何 + 多项式数值工具
│   │   ├── renderer.js           # 组件调度器（扫描/合并/clientJs 拼接/搜索与 UI runtime）
│   │   └── <component>.js ×26    # hero / quiz / fill-blank / feedback / chart / geometry-3d …
│   └── styles/                   # main.css（token + 全部基础样式）+ 组件专属 CSS（表驱动注入）
├── scripts/
│   ├── dist-lint.js              # 产物气味检查（npm run check）
│   ├── check-registry.js         # 登记簿 ↔ JSDoc 版本 + schema 文档版本一致性
│   └── visual.mjs                # 视觉基线比对（npm run visual）
├── test/                         # node:test + jsdom（产物级集成测试，夹具自动构建）
├── docs/                         # ai-authoring / review-checklist / brand / 4 份 3D 体系 schema
├── .github/workflows/ci.yml      # CI：build → check → test → 覆盖率
└── dist/                         # 产物（gitignore）
```

---

## 4. Frontmatter 约定

```yaml
---
title: 课件标题            # 必填（页面 title / hero / og:title）
subtitle: 一句话价值
author: 作者名             # 侧栏 footer：作者 · 约 N 分钟读完（自动估算）
theme: lavender           # lavender（默认）/ dark
lang: zh-CN               # <html lang>，英文课件写 en
themeToggle: true         # 读者侧深浅切换（默认开；单主题设计页写 false）
search: true              # 站内搜索（默认开；写 false 关闭索引注入）
sections:                 # 可省略：缺省自动按正文 ## 推导侧栏
  - 一、开篇               # 显式给出时：数量必须 == ## 数量且顺序一致，否则 build 报错
---
```

---

## 5. 组件语法约定

- **载体**：fenced code block，语言标记 = 组件名（` ```quiz `）；块内是**合法 JSON**（解析失败 → 自描述错误 + 行号）
- **嵌套保护**：≥4 反引号的围栏整块透传——课件里用 ` ```` ` 包住组件示例展示，不会被当真组件执行
- **单行风格**：` ```hero {"title":"T"} ` 兼容
- **quiz-track**：传 quiz 对象数组进 carousel 模式
- **字段契约唯一源**：各组件 JSDoc；3D 体系（字段多、几何特性多）另立 schema 文档——
  [geometry-3d](./docs/geometry-3d-schema.md) · [slider](./docs/slider-schema.md) ·
  [tetra-equiv](./docs/tetra-equiv-schema.md) · [cut-anim](./docs/cut-anim-schema.md)
- **内联 markdown**（`processInline`，组件文本字段通用）：`` `code` `` / `**bold**` / `*italic*` /
  `[text](url)`（协议白名单 http/https/mailto/#）/ `\n` 换行 / `$...$` LaTeX。
  安全：所有输入先 `escapeHtml` 再替换

### 运行时基础设施（渐进增强的底座）

- `_lifecycle`：`createLifecycle(root)` 统一登记监听/observer/RAF/timeout，`sc:destroy` 批量销毁（SPA 嵌入/热重载受益，单页课件零影响）
- `_progress`：`__SCProgress` localStorage 持久化（pathname 命名空间；隐私异常静默降级）。恢复用「重放」策略——程序化触发提交，判分/样式/事件与真人作答同链路
- renderer 注入的框架 UI：阅读进度条 / 返回顶部 / 代码卡片（语言标签+复制）/ 主题切换 / 站内搜索（编译期索引，Ctrl/Cmd+K）/ 移动端目录抽屉。全部 JS 注入，无 JS 不阻塞内容

---

## 6. 校验清单（build 期 + CI）

| 校验 | 时机 | 失败行为 |
|---|---|---|
| JSON 语法 / 组件围栏闭合 | 提取 | throw + 行号 |
| `correct ⊆ options[].id`、选项 ≥2 | quiz render | throw |
| fill-blank 占位编号连续唯一 | render | throw |
| quiz/fill-blank id 全页唯一 | build 4.58 | 报告 + exit 1 |
| KaTeX 解析错误 | build 尾部汇总 | 报告 + exit 1 |
| 图片缺失 / 不支持格式 | build 尾部汇总 | 报告 + exit 1 |
| sections 显式给出时 == h2 数 | build | 报告 + exit 1 |
| 产物气味（占位符残留/死链/undefined） | `npm run check`（dist-lint） | exit 1 |
| 登记簿 ↔ JSDoc ↔ schema 文档版本 | `npm run check`（check-registry） | exit 1 |
| 产物加载零未捕获异常 | `npm test`（jsdom 冒烟） | 测试失败 |

---

## 7. 视觉与主题系统

- 主题 = `main.css` 顶部 CSS 变量块（`--color-*` / `--dur-*` / `--ease-*` / `--font-*`），`data-theme` 切换；**新样式只准用 token**（硬编码色值会在 dark 主题碎裂）
- 读者可切主题（v1.8.0）：侧栏按钮 + localStorage + head boot 防闪变；打印回作者主题
- 四级字号系统；callout 图标内联 SVG；内容驱动、不堆装饰
- 响应式：桌面优先，<900px 吸顶目录抽屉 + 表格横向滚动
- 无障碍：skip-link、`:focus-visible`、`aria-current/expanded/pressed`、`prefers-reduced-motion` 全局尊重、打印态隐藏交互件

---

## 8. 路线图

已交付：~~watch/脚手架/阅读时间（1.3–1.8）~~ · ~~图片内联（1.7）~~ · ~~进度持久化（1.7）~~ · ~~主题切换（1.8）~~ · ~~站内搜索 + sections 自动推导（1.9）~~ · ~~质量守门机制（1.10）~~

候选（未立项）：

- 支持内嵌视频（base64 撑爆单文件，倾向不做；外链是作者自己的选择）
- 导出 PDF（打印样式 + 浏览器「另存为 PDF」可先用）
- 移动端组件级触控优化
- geometry-3d 进阶：剖切 / 三视图 / 展开图（见 [docs/geometry-3d-schema.md](./docs/geometry-3d-schema.md) 路线图）
- 明确不做（理由见 CHANGELOG 对应条目）：演示模式 · 多课件间导航 · 埋点遥测
