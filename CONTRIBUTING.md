# 贡献指南

感谢你考虑为 courseware 贡献。本文档会告诉你项目结构、最常见的改动场景、以及提交规范。

## 项目结构速览

| 路径 | 作用 | 改动频率 |
|------|------|----------|
| `content/*.md` | 课件源文件 | 最高（换话题只改这里） |
| `template/components/*.js` | 互动组件渲染器 | 中（加新组件时） |
| `template/styles/main.css` | 所有样式 | 中（调主题/加组件样式） |
| `template/index.html.tpl` | HTML 骨架 | 低 |
| `build.js` | 编译脚本 | 低 |
| `SPEC.md` | 设计规范（语法约定、组件清单、决策日志） | 低 |
| `README.md` | 项目说明 | 低 |
| `CONTRIBUTING.md` | 本文档 | 低 |
| `COMPONENTS.md` | 组件登记簿（v0.x.x 状态、打磨参考、决策依据） | 低 |

完整设计理念见 [SPEC.md](./SPEC.md)，组件状态见 [COMPONENTS.md](./COMPONENTS.md)。

## 常见改动场景

### 改课件内容

直接编辑 `content/<name>.md`，跑 `node build.js` 重新编译，浏览器打开 `dist/<name>.html` 看效果。

### 加新组件

1. 在 `template/components/` 下新建 `my-component.js`，导出 `render(json) => htmlString`（如需支持数组模式如 `quiz-track`，再导出一个 `renderTrack(json[]) => htmlString`）
2. 在 `template/components/renderer.js` 里**两处**注册：
   - 顶部 `require` 块加一行：`const myComponent = require('./my-component.js');`
   - `COMPONENT_MAP` 加一条：`'my-component': myComponent,`（可顺手加 `mycomponent` / `my_component` 别名，写法参见同文件其他组件）
3. 在 `template/styles/main.css` 加 `.my-component` 相关样式
4. 在 `template/components/my-component.js` **顶部 JSDoc 块**写字段表 + v0.x.x 版本号（信息源唯一化，避免再开一份散落文档）
5. 在 [COMPONENTS.md](./COMPONENTS.md) 概览表加一条登记
6. 如果有客户端 JS，在组件模块里导出 `clientJs` 字符串，并在 `renderer.js` 的 `collectClientScript()` 里加进拼接数组

如果新组件需要复杂内联渲染（不只是 escape 后插文本），考虑复用 `template/components/_inline.js` 的 `processInline` 函数，避免重写 markdown 处理逻辑。

### 调整主题

`template/styles/main.css` 顶部用 CSS 变量定义主题。改 `:root` 改默认主题，改 `:root[data-theme="xxx"]` 改具名主题。

### 修复 build 脚本 bug

`build.js` 是 Node.js 脚本，没有外部依赖（除了 `gray-matter` 和 `marked`）。改完跑一次 `node build.js content/*.md` 确认所有源文件都能编过。

## 提交规范

commit message 风格参考 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

- `feat:` 新功能
- `fix:` bug 修复
- `docs:` 文档改动
- `style:` 格式调整（不影响代码逻辑）
- `refactor:` 重构
- `chore:` 构建/工具链/杂项

示例：
```
feat: add timeline component
fix: build.js overwrite when compiling multiple files
docs: update README for new hero.ctaHref field
```

## Pull Request 流程

1. fork → 新建分支（`feat/timeline-component` / `fix/xxx`）
2. 改完后 `node build.js` 跑通，确保 `dist/<name>.html` 能正常打开
3. 如果是新组件 / 新字段，更新 `template/components/<name>.js` 顶部 JSDoc + [COMPONENTS.md](./COMPONENTS.md) 概览表 + [SPEC.md](./SPEC.md) 组件清单
4. 提 PR，描述里说清楚改了什么、为什么改

## 行为准则

- 保持简单：能 markdown 解决的别上组件
- 保持零依赖：模板本身只依赖 `gray-matter` + `marked`，别加新的
- 保持向后兼容：组件 JSON 字段用「新增」而非「改名」
