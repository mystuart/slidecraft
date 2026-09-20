# AGENTS.md — 给 AI 会话的项目不变量

> 本文件写给在这个仓库里工作的 AI agent（以及忘了规矩的人类）。
> 目标：让任何一次新会话**开始时就带着项目的质量标准**，而不是靠踩坑重新悟出它们。

## 项目一句话

Markdown 写课件 → 编译成**单文件 HTML 互动课件**。25+ 组件（quiz 判分 / 3D 几何 / 函数图像 / 站内搜索），零运行时、可离线、可打印。读者是学生，作者是老师/博主。

## 不变量（违反 = 退化）

1. **不静默失败**。一切可校验的都在 build 期校验并 `exit 1`（KaTeX 错误、锚点错位、图片缺失、组件 id 重复、JSON 语法、未闭合围栏）。新功能遇到"可能出错"的数据，加校验 + 自描述错误信息，**永远不要静默吞掉**。
2. **单文件零运行时**。所有渲染（公式/高亮/图表/搜索索引）在编译期完成。运行时 JS 必须渐进增强：无 JS 时内容完整可读；打印态隐藏交互件；`prefers-reduced-motion` 全局尊重。
3. **颜色/动效走 token**。新样式只准用 `main.css` 顶部的 CSS 变量（`--color-*` / `--dur-*` / `--ease-*`），硬编码色值会在 dark 主题碎裂。
4. **组件输入先 `escapeHtml` 再处理**；运行时 `innerHTML` 的来源必须是 build 期 `processInline`/`escapeHtml` 的产物，localStorage 恢复值只准进 `value`/`checked`，不准进 `innerHTML`。
5. **组件 id 是持久化 key**。quiz/quiz-track/fill-blank 的 id 全页唯一（build 期校验），缺省随机 id 会触发警告——引导作者显式指定。

## 改动纪律（"改一个组件"的完整清单）

1. 改 `template/components/<name>.js`，**顶部 JSDoc 的 `@version` 必须递增**并写变更记录
2. `COMPONENTS.md` 概览表对应行的版本/日期同步（CI 的 `npm run check` 会拦）
3. 有 CSS 改动 → 确认 dark 主题与打印态（`npm run visual`）
4. 有行为改动 → 补测试（jsdom 可跑真实产物，见 `test/progress.test.js` 的模式）
5. `CHANGELOG.md` 记录（用户可感知的改动）

## 验证闭环（每次改动后，顺序固定）

```bash
node build.js      # 18 个课件编译 + build 期校验
npm run check      # dist-lint（产物气味）+ check-registry（登记簿一致性）
npm test           # 84+ 测试，含 jsdom 产物冒烟（零未捕获异常）
```

视觉改动追加：`npm run visual`（六场景像素比对 vs 基线；有意改动后 `npm run visual:baseline` 刷新）。
发布前：过一遍 `docs/review-checklist.md` + CONTRIBUTING 的发布检查单。

## 版本号约定（两套，勿混）

- **项目版本**（package.json）= 功能里程碑（+0.1/体系）。当前见 CHANGELOG 顶部。
- **组件版本**（各 .js 的 `@version`）= 组件自身演进号，独立于项目版本。

## 明确不做（避免重复讨论，理由见 CHANGELOG 对应条目）

- 演示模式（品类是滚动课件+打印，演示由打印/PDF 承接）
- 多课件间导航（单文件分发哲学，跨文件导航属课程平台）
- 视频内联（base64 撑爆单文件；外链是作者自己的选择）
- 埋点/遥测（隐私 + 离线哲学；内容反馈走 `feedback` 组件的复制回发模式）

## 目录速览

`build.js`（编译器+CLI，`node build.js --help`）· `template/components/`（组件源码，字段契约在顶部 JSDoc——**信息源唯一化**）· `template/styles/main.css`（token + 全部基础样式）· `content/`（课件源）· `dist/`（产物，gitignore）· `test/`（node:test + jsdom，夹具自动构建）· `scripts/`（dist-lint / check-registry / visual）· 文档：README（用户视角）、SPEC（架构）、COMPONENTS.md（登记簿）、docs/ai-authoring.md（AI 写课件指南）
