# UI/UX 全局升级方案（炫酷但有克制）

## 决策已定
- **范围**：全局设计语言升级（main.css 为主，地基稳→表现层打磨）
- **炫酷 4 点全选**：Hero CTA 渐变发光 · 卡片交错进场 · 按钮 active 按压 · Sidebar 滑动高亮条
- **约束**：纯 CSS + 极少 JS、打印安全、零运行时依赖、尊重 reduced-motion

## 实现分 4 块（4 commits，每块独立可回滚）

---

### Commit 1：设计 token 地基（motion + 分层阴影 + focus）

**改 `template/styles/main.css`**：
1. **新增 motion token**（`--ease-out` / `--ease-std` / `--dur-fast` / `--dur-base` / `--dur-slow`）到 `:root`
2. **分层阴影**（Josh Comeau ambient+directional 栈，紫色 tint 保持品牌感）：
   - `--shadow-sm: 0 1px 2px rgba(60,40,120,0.04), 0 1px 3px rgba(60,40,120,0.06)`
   - `--shadow-md: 0 1px 2px rgba(60,40,120,0.04), 0 4px 12px rgba(60,40,120,0.08)`
   - `--shadow-lg: 0 2px 4px rgba(60,40,120,0.05), 0 12px 28px rgba(60,40,120,0.12)`（启用死代码）
   - dark 主题同步
3. **全局 `:focus-visible`**（修零 focus + box-shadow 不一致）：
   - `outline: 2px solid var(--color-primary); outline-offset: 2px`
   - 删除 fill-blank-input 的 `outline: none`、timeline/intersection 的散乱 box-shadow ring
4. **扫除 `transition: all`**（lines 270/435/463/864/1900）改显式属性 + token
5. **统一 chevron/进度条时间**（0.18s 和 0.15s 两套 → 统一 token）

**不改**：颜色变量、字体、排版尺度、打印规则的结构（仅末尾加 transform/animation 归零）

---

### Commit 2：卡片 hover 一致性 + 按钮 active 按压

**改 `template/styles/main.css`**：
1. **hover lift 从 -2px → -1px**（concept-card-item:1127、stat-card:1963；premium 感不是"弹"）
2. **扩展 hover lift 到更多卡片**：quiz / callout / step-guide / timeline-item / diagram（目前完全没 hover）统一加 `transform: translateY(-1px)` + `shadow-sm → shadow-md` 的过渡。这是"把已有 idiom 用满"而非引入新效果。
3. **全局 `:active` 按压 snap**：所有 button / .hero-cta / .quiz-check / .step-guide-tab / .tabs-label 在 active 态 `scale(0.98)` + `transition-duration: 80ms`（Apple/Linear 手感，最便宜的高级感）
4. **callout 补 shadow**（与同流 quiz/concept-card 视觉一致；目前 callout 是唯一无 shadow 的卡片）
5. **修 callout-tip 标题色**（primary-dark 紫 → success 绿，与语义对齐）
6. **callout 图标 per-type 染色**（currentColor 改为各 type 的饱和色）

---

### Commit 3：Hero CTA 渐变发光（炫酷点 1）

**改 `template/styles/main.css`** `.hero-cta`（lines 357-373）：
- 背景改 `linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))`（2-stop 同色相，非彩虹）
- 加 `box-shadow: 0 4px 14px rgba(108,93,184,0.25)`（软发光，非霓虹）
- hover 改"加深"而非"opacity 变淡"：`background-position` 偏移 + shadow 扩到 `0 6px 20px rgba(108,93,184,0.35)` + `translateY(-1px)`
- **仅此一处用渐变**（Lusion 原则：孤立的高光时刻）。其它按钮/卡片保持纯色，反差造焦点

**改 `template/styles/landing.css`**：`.landing-btn-primary` 的 `0 4px 20px rgba(139,125,216,0.4)` 太重，软化到与 hero-cta 一致的 `0 4px 14px`（两处 CTA 风格统一）

---

### Commit 4：卡片交错进场 + Sidebar 滑动高亮条（炫酷点 2 + 4）

**炫酷点 2 — 卡片交错进场**：
- `template/styles/main.css` 加 `@media (prefers-reduced-motion: no-preference)` 的 `[data-reveal]` 规则：opacity 0 + translateY(8px) → 1 + none，320ms ease-out，delay `calc(min(var(--i),6) * 60ms)`
- `template/components/_lifecycle.js` 的 clientJs 末尾加 ~15 行 IntersectionObserver：扫 `[data-reveal]`，进入视口加 `.is-visible`，按兄弟序设 `--i`
- `template/components/renderer.js` 的 `collectClientScript` 已注入 _lifecycle runtime，observer 自动跟着进
- **只给** `.concept-card-item` / `.stat-card` / `.timeline-item` / `.hero` 加 `data-reveal`（改对应组件 render 加属性）。**不给** p/h2/callout/quiz 加（那是阅读内容，动效=廉价感）
- reduced-motion 用户：元素直接显示，零成本

**炫酷点 4 — Sidebar 滑动高亮条**：
- `template/styles/main.css` `.side-nav`：保留现有 `border-left` 但加 `transition: border-color var(--dur-base) var(--ease-out)`
- 当前 `.is-active` 切换是离散的 bg + border；改为 `::before` 伪元素绝对定位的"光条"（`width: 3px; background: var(--color-primary); transform: scaleY(0)` → active 时 `scaleY(1)`，`transition: transform var(--dur-base) var(--ease-out)`）。光条从中心展开，比 border 突现更顺滑
- hover 也加 `translateY(-1px)` 微动（目前只有 bg 变色）

---

## 不做（克制边界）

- ❌ Glassmorphism / backdrop-filter（破坏打印、flat 白底无收益）
- ❌ Skeleton loading（静态 HTML 无网络等待）
- ❌ Parallax 滚动视差（jank、需 JS、反阅读）
- ❌ 霓虹 glow / 多色相渐变 / bounce easing
- ❌ 给正文 / 标题 / 所有 section 加进场动画（动阅读内容=廉价）
- ❌ geometry-3d.css 的硬编码值本轮不动（单独一轮做"3D 家族 token 化"，避免范围蔓延）

## 验证
- npm test 38/38（纯 CSS + 极少 JS，不破坏现有）
- node build.js：KaTeX 告警 0、产物语法 OK
- 打印校验：所有新动效在 @media print 里归零（transform/animation/box-shadow 都 none）
- reduced-motion：禁用所有非必要动效后页面仍完整可用
- 手动开 dist/components-showcase.html + dist/index.html 看效果

## 执行顺序
1. Commit 1：token 地基（motion + 阴影 + focus + 清 transition:all）
2. Commit 2：卡片 hover + 按钮 active + callout 修补
3. Commit 3：Hero CTA 渐变发光（炫酷 1）+ landing 软化
4. Commit 4：卡片进场动画（炫酷 2）+ sidebar 光条（炫酷 4）+ JS observer
5. 整体回归 + 打印/reduced-motion 校验 + 停下看效果

每个 commit 都跑 npm test + build 验证。确认后开始。