# Slidecraft 品牌规范

> Logo 与视觉资产的使用规范。设计决策有据可查，避免被后人误改。

---

## Logo 概念

**层叠卡片（Stacked Cards）**——3 张圆角卡片阶梯层叠，前层带白色 `S`。

**双重语义**：
- **craft**（手作 / 拼装）—— 卡片像被手工叠起来
- **slide**（幻灯 / 层叠）—— 一摞课件的层叠结构

呼应 Lusion 式的几何积木精致感：硬边几何 + 圆角 + 单方向轻阴影，无渐变高光。

---

## 资产清单

| 文件 | 用途 | 说明 |
|------|------|------|
| `assets/logo.svg` | 主 logo（mark + wordmark 横排） | README / 文档站 header / 正式场合 |
| `assets/logo-mark.svg` | 纯 mark（无文字，64×64） | 头像 / app icon / 大尺寸场景 |
| `assets/logo-mono-white.svg` | 全白反相版 | dark 主题 / 深色背景 / 水印 |
| `assets/logo-mark-32.svg` | 32×32 favicon 优化版 | 浏览器标签（去掉半透深度层，16px 仍清晰） |

favicon 已内联到 `template/index.html.tpl`（data URI），OG image 由 `build.js:buildOgImage()` 动态生成。

---

## 配色

| 角色 | Hex | 用法 |
|------|-----|------|
| **品牌紫（primary）** | `#8b7dd8` | mark 前层实心、wordmark 主色、CTA 按钮 |
| **深紫（primary-dark）** | `#6c5db8` | mark 后层角（favicon 深度暗示）、渐变深端 |
| **白** | `#ffffff` | mark 前层的 `S`、反相版全色 |
| **文字主色** | `#2a2538` | wordmark 在浅色背景（= `--color-text`） |

**与主题系统的关系**：品牌紫 `#8b7dd8` = `--color-primary`（lavender 主题）。dark 主题用 `#a995e0`，logo mark 不随主题变色——**mark 永远是 `#8b7dd8` 实心 + 白 S**，保证跨主题一致性。深色背景改用 `logo-mono-white.svg`。

---

## 排版

**Wordmark 字体**：`-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif`，字重 **800**，字间距 -0.5。

- 与项目 UI 字体一致（`--font-sans`），零额外字体成本
- **不用** Georgia serif（那是 hero 标题字体，与 logo 割裂）

---

## 使用规则

### ✅ 正确

- mark 最小尺寸 **24×24 px**（再小 `S` 不可辨）
- mark 与 wordmark 之间留 **≥ 1 个 mark 宽度的间距**
- 浅色背景用 `logo.svg`（彩色）；深色背景用 `logo-mono-white.svg`
- favicon 用 32×32 优化版（不要直接缩放 64 版，半透层在 16px 会糊）

### ❌ 误用

- **不改色**：mark 永远 `#8b7dd8` + 白 S。不要换成其他主题色 / 渐变 / 描边
- **不拉伸**：保持比例，不要压扁 / 拉长
- **不加投影**：logo 本身用层叠制造深度，外加 drop-shadow 会显脏
- **不旋转**：mark 的阶梯方向是设计语言的一部分，不要翻转 / 旋转
- **不拆解**：不要单独取出某一张卡片用，mark 是整体
- **不改圆角**：圆角 7px（64 版）/ 3.5px（32 版）对齐 `--radius-md`

---

## 设计决策记录

### 为什么选「层叠卡片」而非立方体 / 菱形 / 字标

- **立方体**：3D 基因强，但行业里太常见，且 16px favicon 棱线会糊
- **菱形**：项目 favicon/OG 原本就是菱形，但语义弱（纯标记，不"讲述什么"）
- **S 字标**：识别度高，但 S 字标太多，切割版独特性也不够
- **层叠卡片（选）**：craft + slide 双关语义、独特性高、缩放友好、Lusion 几何积木感

### 为什么 wordmark 用 system sans 而非 Georgia

Georgia 是 hero 标题的"编辑出版"字体，与 UI 体系割裂。logo 作为品牌标识应与 UI 统一（system sans），Georgia 留给内容层的 hero 标题。

### 为什么 mark 不随主题变色

品牌标识需要**绝对一致性**——无论课件用什么主题，slidecraft 的 mark 都是同一个紫。主题变色是内容层的事，品牌层不动。深色背景用反相版（全白），而非让 mark 变浅紫。
