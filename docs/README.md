# docs/

courseware 项目的文档目录。**纳入 git 管理**——和源码、SPEC、内容一起进版本控制。

## 当前文件

- [geometry-3d-schema.md](./geometry-3d-schema.md) — geometry-3d 组件的字段契约（**v0.1.7**，4 个示例含三角柱 + 辅助线池 + math-step 联动）
- [slider-schema.md](./slider-schema.md) — slider 组件的字段契约（v0.1）
- [tetra-equiv-schema.md](./tetra-equiv-schema.md) — tetra-equiv 组件的字段契约（v0.1）
- [cut-anim-schema.md](./cut-anim-schema.md) — cut-anim 组件的字段契约（v0.1）

> 2026-06-08 起：原 `docs/components-registry.md` 已被合并到根目录 [`COMPONENTS.md`](../COMPONENTS.md)（commit 744351e），字段契约统一放 `template/components/<name>.js` 顶部 JSDoc，schema 文档只放 3D 体系这种"v0.1 阶段字段多、几何特性多"需要独立成文的内容。

## 维护约定

- 任何组件字段/视觉/交互调整时，**先**改代码，**后**更新 schema（不要反过来，避免漏记）
- schema 文档头标 vX.Y.Z 跟代码 `JSDoc @version` 同步
- 状态变更（待打磨 → 打磨中 → 打磨完成）时同步更新 `COMPONENTS.md` 概览表
- 跨组件的系统级问题单列在 `COMPONENTS.md` 的「已知系统级问题」段
