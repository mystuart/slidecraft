# Changelog

本项目的所有重要变更记录。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)，
但 Slidecraft 的版本 = 功能里程碑（每加一个体系 +0.1）。

## [1.9.0] — 2026-09-11

### 钢人分析驱动的迭代：写作管线健壮性 + 读者侧检索导航

对 v1.8.0 做多角度不足分析（写作管线 / 读者侧 / 工程健壮性 / 竞争定位 / 无障碍），
对每条批评构造最强形式（钢人）后定出三条改进路径，本轮实施其中可落地部分。

**✍️ 路径一：写作管线（作者侧根基）**

- **组件提取升级 CommonMark 嵌套围栏语义**（renderer v0.4.0，逐行扫描替代单正则）——
  修复真实 bug：` ```` `（无语言名）示例包裹层内的 ` ```quiz ` 会被误提取为真组件、
  示例文本被吃掉。现在 ≥4 反引号围栏整块透传，课件里可放心展示组件示例；
  组件围栏未闭合从「静默不提取」改为 throw 自描述错误（带行号）；
  单行风格（` ```hero {"json"} `）与超长闭合围栏兼容。回归测试 10 个
- **`sections` 自动推导**：frontmatter 缺省时侧栏直接按正文 `##` 文字生成，
  「漏写 sections → 空侧栏」整类问题清零；显式提供时严格校验保留（错误信息
  附「删掉 sections 即可自动推导」的修复指引）
- **watch 盲区修复**：此前只监听初始 .md——改 template/CSS/组件 JS 不触发重编译、
  新建 .md 要重启。现在 template/ 递归监听（变更→全量重建）、content/ 目录监听
  （新文件自动纳入）
- **单文件错误隔离**：一个坏 .md 不再阻塞其余文件，末尾汇总 + exit 1
- **构建汇总行**：`✓ 完成：N 个课件 → dist/`

**🔍 路径二：读者侧检索与导航（长课件可用性）**

- **站内搜索**（`fm.search: false` 可关）——编译期按 h2 分段抽取文本索引
  （剥 KaTeX mathml 防公式重复、CJK 间空格压缩保中文短语匹配、96KB 体积护栏
  分级降级），随单文件内嵌、零运行时依赖；侧栏顶部搜索框（Ctrl/Cmd+K 聚焦），
  <mark> 命中高亮 + 章节跳转 + ↑↓ 选择 + Esc 清除；移动端抽屉内同源渲染，
  命中后自动收起抽屉
- **跳转正文 skip-link**（键盘用户 Tab 第一站）+ **侧栏激活项 `aria-current`**（读屏器可感知）
- 侧栏链接样式收窄到 `ol` 作用域——修复搜索结果面板继承序号计数器显示 "00" 的污染

**🏷 路径三：产品成熟度细节**

- 产物 `<meta name="generator" content="Slidecraft x.y.z">`（版本随 package.json）

### 钢人分析后明确不做（避免伪需求）

- **演示模式**：最强批评是「教师需要投屏演示」；但 Slidecraft 品类是滚动课件 +
  打印讲义，演示场景由打印/PDF 承接，做演示模式会做成二流 reveal.js。
  留在路线图，等有真实教学反馈再立项
- **多课件间导航（上一课/下一课）**：单文件分发的核心场景是一次一份课件，
  跨文件导航属于「课程平台」范畴，超出单文件哲学

### 测试

- npm test: **84/84**（新增 18 个：嵌套围栏扫描 10 + 站内搜索 5 + sections 推导/
  严格校验/错误隔离 3）

## [1.8.0] — 2026-09-10

### 易用性 + UI 全面升级（对齐成熟产品标准）

**🐛 修复 quiz 反馈属性泄漏（build 链路 bug）**
- feedback 文案含 `$...$` 时（如 components-showcase 的抛物线题），build 后置的
  `processInlineFormulas` 会把 KaTeX HTML 注进 `data-feedback-*` 属性——属性含双引号被撑破，
  原始属性文本泄漏为正文。**修复**：feedback 改走隐藏 DOM（`.quiz-feedback-store`）+
  processInline 渲染（quiz v0.3.2），顺带解除「feedback 不支持内联 LaTeX」限制（系统级问题 #1 收尾）；
  `processInlineFormulas` 增加全标签保护（引号感知正则，属性内的 `$` 对替换引擎不可见）作为纵深防御。
- feedback 传 string 的旧行为未定义（实际走默认文案），现明确为「视为答对文案」。

**📖 阅读体验（框架 UI 2.0，全部渐进增强，打印态自动隐藏）**
- **阅读进度条**：顶边 3px 品牌渐变，rAF 节流 scaleX 驱动
- **返回顶部**：滚动 >600px 浮现的右下角圆钮（reduced-motion 尊重）
- **代码卡片**：markdown 代码块自动包壳——语言标签 + 一键复制（clipboard API + execCommand 兜底）；
  code-runner 自带工具栏不受影响
- **主题切换**：侧栏 footer（桌面）/ 吸顶栏（移动端）月亮/太阳按钮，lavender↔dark 一键切换，
  localStorage 持久化 + head 内 boot 脚本防首帧闪变；打印自动回作者主题（省墨）；
  frontmatter `themeToggle: false` 可关（landing 等单主题页）
- **Markdown 正文打磨**：表格斑马纹 + 圆角胶囊 + 窄屏横向滚动；details/summary 品牌 marker
  与旋转动效；`::selection` 品牌色；细滚动条（webkit + Firefox）；锚点平滑滚动（reduced-motion 豁免）

**🛠 作者体验（CLI）**
- `node build.js --help`：完整用法帮助
- `node build.js new <name>`：**课件脚手架**——生成含 frontmatter + 常用组件示例的起步文件，
  开箱即可编译；拒绝非法名字与覆盖已有文件
- **阅读时间**：侧栏 footer 自动显示「约 N 分钟读完」（CJK 400 字/分 + 英文 200 词/分，代码块不计入）

### 测试

- npm test: **66/66**（新增 10 个：公式标签保护回归 4 + CLI/脚手架/阅读时间 6）

### 复审修复（2026-09-11，对 1.8.0 的自查四连修）

- **移动端抽屉 z-index 穿模**：返回顶部（z:70）/ 阅读进度条（z:80）盖在全屏目录（z:55）上——
  `setNavOpen` 现同步 `body.is-nav-open` class，抽屉打开时浮层 UI 让位（含 lifecycle 销毁回滚）
- **测试夹具隐性依赖产物**：`test/progress.test.js` 直读 gitignore 的 `dist/*.html`，
  新 clone 直接 `npm test` 会 ENOENT——改 `before` 钩子自动构建夹具（永远测当前代码的产物）
- **登记簿失同步**：quiz-track 行漏跟 quiz.js 版本（v0.3.0 → v0.3.3）
- **复制逻辑重复**：quiz「复制成绩」删自带 fallback 拷贝，改调框架 `__SCCopy`（与代码卡片同一实现）

## [1.7.0] — 2026-08-20

### 实际价值导向优化（竞品对标后的一轮补强）

对照 Marp / Slidev / Quarto(revealjs) / Gamma 调研结论：单文件 HTML + 数学教学互动组件的
定位没有直接竞品（Slidev 无单文件导出、Gamma 互动锁在自家托管、Quarto 有 embed-resources
但无内置判分组件链）。本轮补的是「学生侧体验」和「分发链路完整性」：

- **图片自动内联**（`build.js:inlineImages`）——正文相对路径 `<img>` 编译时烧成 data URI
  （svg 走 utf8 更省），单文件承诺不再被图片路径打破；文件缺失/格式不支持 → 汇总报告 +
  exit 1（沿用「不静默失败」哲学）
- **学习进度持久化**（新内部工具 `_progress.js`，quiz v0.3.0 / fill-blank v0.3.x 接入）——
  作答 / 判分态 / 题组浏览位置 / 完成态存 localStorage（Safari 隐私模式等异常静默降级为
  不持久化），刷新 / 重开自动恢复；恢复采用「重放」策略，UI 与真人作答走同一链路
- **题组「复制成绩」按钮**——完成后一键复制文本成绩单（`【课件名】共 N 题：全对 x…`），
  学生可直接微信回发老师；clipboard API + execCommand 双路径
- **移动端目录抽屉**（<900px）——侧栏变吸顶栏 + 汉堡按钮，目录收进全屏抽屉（章节点击/
  Esc 收起、body 滚动锁）；渐进增强门控 `html.js-nav`，无 JS 保持原布局，桌面/打印零变化
- **build 期 quiz 硬校验**——`correct` 引用不存在的选项 id（如大小写笔误）/ correct 为空 /
  选项数 <2 直接 throw 自描述错误，杜绝「学员永远答不对的静默错题」
- **fill-blank 无占位单空修复**（v0.3.1，**线上 bug**）——题面无 `{{n}}` 时（`__` 旧写法）
  此前渲染 0 个输入框、answers 被截成 `[]`，binary-card-trick 与 how-to-create-skill 共
  4 道题一直空转；现在整题视为一个空、输入框附题面末尾（兑现 SPEC「单空可省占位」承诺）；
  answers 缺失改为 throw
- **frontmatter 新增 `lang`**（默认 `zh-CN`）——英文课件可正确声明 `<html lang>`
- **AI 课件创作指南**（`docs/ai-authoring.md`）——硬约束 + 组件最小 schema + 验证闭环，
  可直接投喂给任意 AI agent 产出合规课件（格式对 LLM 友好是本项目的隐性优势，把它显性化）

### 测试

- npm test: **56/56**（新增 15 个：图片内联 6 + quiz 校验 5 + 进度持久化集成 4（jsdom 跑
  真实产物，覆盖保存/恢复/清除全链路）+ fill-blank 无占位回归 3）
- 新增 devDependency `jsdom`（跑产物级交互测试用，不影响产物体积）

## [1.6.0] — 2026-06-18

### UI/UX 全局升级（token → hover → CTA → 进场动画，4 commits + Bunny 2 commits）

**设计 token 地基**：
- 动效 token（`--ease-out/-std` + `--dur-fast/base/slow`），统一全场 22 处散落的 duration/easing
- 分层阴影 v2（ambient + directional 三层栈，紫色 tint）
- 全局 `:focus-visible`（修全场零 focus ring + `outline:none` 无替代）—— WCAG 2.4.13
- `transition: all` 全部改显式属性；`prefers-reduced-motion` + print 全局兜底

**交互一致性**：
- 卡片 hover lift 统一 -1px + shadow 升级（quiz/callout/step-guide/timeline/diagram 补齐）
- 按钮 `:active` 按压 snap（scale 0.98 + 80ms）
- callout 补 shadow、tip 标题色修语义、图标 per-type 染色
- sidebar 滑动高亮条（`::after` scaleY）+ hover 微抬

**视觉质感（Bunny）**：
- 品牌紫加深 `#8b7dd8→#7e6cc8`、新增暖金 secondary（`accent-warm`）
- body dot grid 纹理 + 顶部色晕（iOS 触屏降级 scroll，桌面保留 fixed 视差）
- 全部 `border-left 4px` 实心 → primary→accent 渐变光条（12 处统一品牌签名）
- 组件标题 dashed 下划线 → 渐变短线；radius 7/12/20；sidebar 渐变背景 + leading-zero 序号
- hero CTA 渐变发光（全场唯一渐变元素）；卡片交错进场（IntersectionObserver + stagger，data-reveal）

**本轮 5.3 复审修复**：
- **品牌色分裂修复**：Bunny 改了 main.css primary 但 logo/favicon/OG/landing/brand.md 未同步——全量统一到 `#7e6cc8`（含 rgba 形式的 bg-wash）
- **data-reveal 渐进增强**：进场动画隐藏态改以 `html.js-reveal` 为前提（JS 挂掉/被拦截/无 IO 时内容直接可见，18 个产物页面的内容丢失风险清零）
- **暖金文字对比度**：code/nav 序号 `#c9944a`（2.44:1 不达标）→ 新 token `--color-accent-warm-text: #8a6420`（4.85:1 AA 达标），dark 主题维持 6.52:1

## [1.5.0] — 2026-06-18

### 品牌升级（feat(brand) · 7412ef6）
- **层叠卡片 Logo 定型**——`assets/logo.svg` / `logo-mark.svg` / `logo-mono-white.svg` / `logo-mark-32.svg` 4 件资产，"craft + slide" 双关语义 + Lusion 几何积木风格。Wordmark 跟 UI 字体统一（system sans 800），mark 永远 `#8b7dd8` 实心 + 白 S。
- **favicon 32×32 优化版**——内联到 `template/index.html.tpl`（data URI），去掉半透深度层，16px 仍清晰。
- **OG image 动态生成**——`build.js:buildOgImage()`，每个课件自动生成专属 Open Graph 图。
- **品牌规范文档**——[`docs/brand.md`](./docs/brand.md)（89 行）锁定 logo 概念 / 资产清单 / 配色 / 排版 / 使用规则 / 设计决策记录，避免后人误改。

### Landing 落地页（feat(landing) · 165c422 + e26c456 + 2010248）
- **GitHub Pages 根页**——`content/index.md`（dark 主题），作为项目 landing，链向 showcase / 2d-showcase / binary-card-trick / how-to-create-skill 等亮点课件。
- **Lusion 风格层叠布局**——`template/styles/landing.css`，卡片层叠 + 几何积木感 + 3D 旋转装饰（用 `autoRotate: true` 的 geometry-3d 做主视觉），与品牌 mark 视觉同源。
- **CSS 表驱动自动接入**——`build.js:COMPONENT_CSS` 加 `landing-hero` marker → 自动注入 landing.css，无需改 build.js 其他地方。
- **三角柱定位修复**（2010248）——landing 用 `<article class="landing-hero">` 包裹 3D 组件，相对 article 而非整页定位，hero 卡片缩放/位移时三角柱跟随。

### geometry-3d autoRotate（feat(geometry-3d) · e9da11f · v0.1.9 → v0.2.0）
- **新增 `autoRotate` / `autoRotateSpeed` 字段**——OrbitControls 原生能力，`animate()` 已调 `controls.update()` 自动生效。
- **默认关**，配 `autoRotate: true` 开启。`autoRotateSpeed` 默认 2.0（OrbitControls 标准），landing 装饰建议 1.0-1.5。
- **教学场景**：「展示旋转立体」/ 「演示正 n 面体对称性」/ landing 装饰。

### npm 脚本完善
- **`build:three` 暴露成 npm script**（package.json）—— 之前 build.js 第 306 行有 esbuild 命令字符串，但只埋在内部分支用，没暴露成 npm script。`npm run build:three` 现在一键打包 Three.js bundle。

### 文档
- 全部 README / CHANGELOG / package.json / docs/ 校对同步到本版本（**25 个组件数对齐**，quiz-track 算独立组件名）

## [1.4.0] — 2026-06-17

### 架构债清零（C2-4/5 + H4：组件生命周期）
- **新增 `_lifecycle.js` 基础设施**（内部工具）—— `createLifecycle(root)` per-element 句柄，统一登记 doc/win 监听 / observer / raf / timeout / 自定义 disposer；`destroy()` 幂等回滚；全局 `__SC_LIFECYCLES` + `sc:destroy` 事件批量销毁。
- **8 个泄漏组件全接入**：coords-2d / function-plot / intersection-marker（5 个总线监听 + resize）/ geometry-3d（全局 keydown + 永续 RAF + ResizeObserver）/ cut-anim / trajectory / tetra-equiv / renderer scroll-spy。匿名 handler 全改具名。
- **4 个 3D 组件额外登记 WebGL 资源释放** disposer（OrbitControls.dispose / geometry+material.dispose / renderer.dispose）。
- **现有 UX 零影响**：destroy 仅在显式 `sc:destroy` 触发时跑，单页课件不触发 = 行为与今天完全一致。SPA 嵌入 / 热重载 / 多实例场景不再泄漏。

### KaTeX 公式渲染修复
- **行内 `$...$` 正则错配 + CJK stderr 告警**（`_inline.js` v0.2.3、`renderer.js`）—— 原 regex 不识别 `$...$` display 分隔符，把 `$S_n=...$。中文，$O(1)$` 这种「行内公式 + 中文句号 + 第二个行内公式」串成跨段匹配，中文喂进 KaTeX 触发 26 条 `unicodeTextInMathMode` 告警 + 垃圾 katex-error span。**修复**：先剥 `$...$` 占位保护再匹配行内；KaTeX 调用统一加 `strict: 'ignore'`。产物 -199KB（全是错配产生的垃圾 error span）。

### build.js 重构
- **CSS 注入改表驱动**（消除 4 处重复条件块）—— `COMPONENT_CSS` 清单表循环加载 + join 拼接，单一同步点。新增组件 CSS 只需往表里加一行。

### 文档修复
- **COMPONENTS.md 去重**（历史遗留腐烂）—— 整个大段内容重复 3 次 + 3 处被 YAML frontmatter 截断，无一份完整。重建为单一干净副本（618 → 326 行），从 3 份残卷拼回完整「已知系统级问题」1-9 条，新增决策记录 #13。

### 版本号
- 内部工具：`_inline` v0.2.3、`_lifecycle` v0.1.0（新增）、`renderer` v0.3.0
- 组件接入：geometry-3d v0.1.9、cut-anim v0.1.3、trajectory v0.1.1、tetra-equiv v0.1.3、coords-2d v0.1.1、function-plot v0.1.1、intersection-marker v0.1.1

### 测试
- npm test: **38/38**（新增 13 个回归测试：6 个 KaTeX inline-math + 7 个 lifecycle）

## [1.3.0] — 2026-06-17

### 品牌
- 项目正式定名 **Slidecraft**（前身 courseware），全量清理改名残留
- 版本号体系收敛：项目版本 = 里程碑号（1.0=MVP / 1.2=3D / 1.3=2D+通用叙事）
- 内部占位符 `CW-*` → `SC-*`，过时命令引用修正

### 新组件（组件数 17 → 24）
- **timeline** — 时间线（vertical/horizontal 双模式，历史/流程）
- **chart** — 数据图表（bar/line/pie 编译时静态 SVG）
- **tabs** — 标签页切换（并列对比：多解法/多视角）
- **stat-grid** — 数据卡片墙（关键数字 + 趋势标记）
- **quote** — 引用语/金句（大字号 + 引号装饰）
- **diagram** — 流程图/关系图（编译时 SVG，3 形状 + 5 语义配色）
- **code-runner** — 代码 + 输出对照（预录制，折叠展开）

### 视觉系统
- **dark 主题**（兑现"主题可换"承诺，bg #1a1a24 / text 95% 白）
- 四级字号系统（display/heading/body/label，45 处硬编码变量化）
- callout 图标 emoji → 内联 SVG（解决跨平台渲染不一致）
- 颜色全变量化（on-* 语义文字色 + border 色跨主题适配）
- **编译时语法高亮**（highlight.js，markdown 代码块 + code-runner 均受益，零运行时）

### 架构债清理
- **#3 KaTeX 静默降级** → build 期收集 katex-error，汇总报告 + exit 1
- **#4 sections↔h2 不一致** → 升级为 strict 模式（console.error + exit 1）
- **C2-2 定时器地狱** → 2D 渲染链改事件驱动（coords:ready → funcplot:ready），消除 14 个猜测式 setTimeout
- 顺手修复 1 个静默坏掉的公式（gaokao-2020-jiangsu-q18.md）

### 开发体验
- **测试框架**（Node 原生 node:test，25 个测试覆盖数值算法 + build 校验）
- **--watch / npm run dev**（fs.watch + http.server，改 .md 自动重 build）

## [1.2.0] — 2D 平面几何体系 + 3D 打磨

### 新组件
- **coords-2d** — 平面坐标系（函数曲线/交点/滑块联动的底座）
- **function-plot** — 函数图像（polynomial/sine/conic，v0.1.1 加 conic_ellipse）
- **intersection-marker** — 交点标记（手动 + polynomial 自动求交）
- **slider** v2 — 滑块联动 form-B（关联 geometry-3d / function-plot）
- **trajectory** — 轨迹动画（slider 联动画路径）
- **tetra-equiv** — 同体异构四面体
- **cut-anim** — 剖切动画

### 3D 体系打磨
- plane 三角形化 + auxLines 步骤 toggle
- 触摸板旋转修复 + Z 轴自转 + 坐标系校准
- Three.js 拆外链 + hash 缓存破坏（A1 性能优化）
- API 改 per-instance 闭包（A2 架构优化）

### 数值算法
- `_geom_utils.js` 抽出共享工具：polyEval / polyDeriv / polyRealRoots
- 修复重根漏掉 bug（C1-1）：二次公式 Δ=0 分支

## [1.0.0] — MVP

### 核心架构
- Markdown → 单文件 HTML 编译器（zero runtime · 单文件分发）
- 10 个基础组件：hero / quiz / concept-card / callout / formula / step-guide / compare / fill-blank / math-step / quiz-track
- geometry-3d 组件（Three.js，可转/可切/可高亮）
- KaTeX 公式、marked、主题系统（lavender）
- sidebar 章节导航 + 打印友好

### 基础设施
- build.js CLI（单文件 / 全量 / --inline-three 三种模式）
- processInline 行内 markdown + LaTeX
- 组件注册机制（COMPONENT_MAP + clientJs 自动收集）

---

版本号约定详见 [SPEC.md](./SPEC.md)。
