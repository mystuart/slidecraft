---
title: 三棱柱-步骤联动验证
---

> [!INFO] 本页只验证 2 件事：
> 1. hover 步骤 → geometry-3d 高亮对应的边 / 半透面
> 2. 勾选"已完成" → 高亮常驻；取消勾选 → 复位

# 题目

三棱柱 ABC-A₁B₁C₁，O 是 A₁C₁ 中点，E 是 B₁C₁ 中点。
(1) 证明 OE ∥ 平面 AB₁C；
(2) 求三棱锥 B₁-AEC 的体积。

```geometry-3d
{
  "id": "prism-test-1",
  "title": "三棱柱 ABC-A₁B₁C₁",
  "geometry": "triangular-prism",
  "size": [1.2, 1.8, 1.2],
  "showFaces": true,
  "showEdges": true,
  "showVertices": true,
  "planes": [
    { "id": "AB1C", "vertices": ["A","B1","C"], "opacity": 0.35, "color": "#ffd166" }
  ],
  "labels": [
    ["A",  [-0.6, -0.35, 0]],
    ["B",  [ 0.6, -0.35, 0]],
    ["C",  [ 0.0,  0.69, 0]],
    ["A1", [-0.6, -0.35, 1.8]],
    ["B1", [ 0.6, -0.35, 1.8]],
    ["C1", [ 0.0,  0.69, 1.8]],
    ["O",  [-0.3,  0.17, 1.8]],
    ["E",  [ 0.3,  0.17, 1.8]]
  ],
  "camera": { "position": [3.2, 2.8, 3.6], "target": [0.6, 0.9, 0.6] }
}
```

```math-step
{
  "id": "demo-1",
  "title": "分步证明（验证联动）",
  "geometry3dId": "prism-test-1",
  "question": "三棱柱 ABC-A₁B₁C₁，O 是 A₁C₁ 中点，E 是 B₁C₁ 中点。证明 OE ∥ 平面 AB₁C。",
  "steps": [
    {
      "title": "高亮半透面 AB₁C",
      "content": "hover 这一步时，3D 场景应高亮半透面 AB₁C（橙色）。",
      "highlight": {
        "planes": ["AB1C"]
      }
    },
    {
      "title": "高亮虚拟边 OE（+平面 AB₁C）",
      "content": "hover 这一步时，应额外画一条从 O 到 E 的红色虚拟边。",
      "highlight": {
        "edges": [["O", "E"]],
        "planes": ["AB1C"]
      }
    },
    {
      "title": "同时高亮两条边 + 平面",
      "content": "hover 时画 OE、画 A 到 B₁（验证 A、B1 标签命名都查得到），平面高亮。",
      "highlight": {
        "edges": [["O", "E"], ["A", "B1"]],
        "planes": ["AB1C"]
      }
    }
  ]
}
```

## 自测动作

| 动作 | 预期 |
|---|---|
| hover 第 1 步 | 平面 AB₁C 变橙色高亮 |
| hover 第 2 步 | 平面高亮 + 出现 O→E 红线 |
| hover 第 3 步 | 上面 + 多一条 A→B₁ 红线 |
| 勾选"已完成" | 离开步骤后高亮仍保留 |
| 取消勾选 | 立即复位 |
| 双击 3D 几何体 | 相机以几何体为中心复位（局部） |
| 双击 3D 空白 | 相机回到 schema 的 camera.position（全局） |
