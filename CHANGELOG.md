# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-06-04

第一版正式发布。框架从内部 demo 升级为可独立维护的开源项目。

### 新增
- `_inline.js` 公共工具，组件内联 markdown 统一处理（`processInline`）
- `hero.ctaHref` 字段，cta 按钮跳转地址可配置
- `fill-blank.mode` 字段（`reveal` / `practice`）
- quiz 自动题号 + 上一题/下一题导航（零配置自动注入）
- `@media print` 打印样式（侧栏隐藏、答案展开、每章新页、链接后缀显示 URL）
- 组件 `label` / `points` 支持内联 markdown（`**bold**` / `*italic*` / `` `code` `` / `[link](url)`）

### 修复
- `build.js` 多 markdown 文件同时编译时后编译的会覆盖前一个 → 改为每个 `.md` 独立产物
- `renderer.js` JSON 解析失败只 `console.error` 不退出 → 改为 `throw` 含行号定位
- `renderer.js` 解析代码块的正则要求紧跟换行 → 放宽为 ````hero[ \t]*\n?` ``
- `hero` cta 链接硬编码跳 `#section-1` → 无 `sections` 时整块不渲染

### 移除
- `progress.js` 空壳（占位组件，无实际功能）

### 文档
- `README.md` / `SPEC.md` / `template/README.md` 同步新组件字段和 build 产物路径
