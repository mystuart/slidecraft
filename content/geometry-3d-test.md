---
title: Geometry-3D 立体几何测试
description: 验证 3D 组件的 box / sphere / cylinder / cone / 顶点标签 / 坐标轴 / 网格
theme: lavender
author: Alice
sections:
  - 1、正方体（带顶点标签 + 坐标轴）
  - 2、圆柱（带网格）
  - 3、圆锥（不透明面 + 棱线）
---

# 1、正方体（带顶点标签 + 坐标轴）

拖动旋转、滚轮缩放、Shift+拖动平移。

```geometry-3d
{
  "title": "正方体 ABCD-A₁B₁C₁D₁",
  "geometry": "box",
  "size": [2, 2, 2],
  "camera": { "position": [3.5, 3, 4], "target": [0, 0, 0], "fov": 50 },
  "background": "#ffffff",
  "showAxes": true,
  "showVertices": true,
  "showEdges": true,
  "showFaces": true,
  "edgeColor": "#1a1a1a",
  "faceColor": "#cce0ff",
  "vertexColor": "#ff6b35",
  "labels": [
    ["A", [-1, -1, -1]],
    ["B", [ 1, -1, -1]],
    ["C", [ 1,  1, -1]],
    ["D", [-1,  1, -1]],
    ["A₁",[-1, -1,  1]],
    ["B₁",[ 1, -1,  1]],
    ["C₁",[ 1,  1,  1]],
    ["D₁",[-1,  1,  1]]
  ],
  "caption": "观察 8 个顶点的空间分布。注意 A、C₁ 在体对角线两端。"
}
```

# 2、圆柱（带网格）

```geometry-3d
{
  "title": "圆柱 r=1, h=2",
  "geometry": "cylinder",
  "size": [1, 2, 32],
  "camera": { "position": [3, 2, 3], "target": [0, 0, 0] },
  "background": "#ffffff",
  "showGrid": true,
  "gridSize": 0.5,
  "showEdges": true,
  "edgeColor": "#333",
  "faceColor": "#e8f4d8",
  "vertexColor": "#2e7d32",
  "opacity": 0.6
}
```

# 3、圆锥

```geometry-3d
{
  "title": "圆锥 r=1.2, h=2.5",
  "geometry": "cone",
  "size": [1.2, 2.5, 32],
  "camera": { "position": [3, 2.5, 3.5], "target": [0, 1, 0] },
  "background": "#fafafa",
  "showVertices": false,
  "showEdges": true,
  "edgeColor": "#b85042",
  "faceColor": "#f9c8b8",
  "opacity": 0.9
}
```
