---
title: 立体几何综合题：2024·陕西咸阳·模拟预测
subtitle: 三棱柱中证线面平行 + 求三棱锥体积
author: Stuart
sections:
  - 原题
  - 3D 几何体
  - 第 (1) 问：证明 OD ∥ 平面 PAB
  - 第 (2) 问：求三棱锥 B₁-APC 的体积
---

# 立体几何综合题：2024·陕西咸阳·模拟预测

## 原题

> **（2024·陕西咸阳·模拟预测）** 已知三棱柱 $ABC$-$A_1B_1C_1$，$P$ 是 $A_1C_1$ 上一动点，$O, D$ 分别是 $AC, PC$ 的中点，$AB \perp BC$，$AA_1 = AB = BC = 2$。
>
> （1）求证：$OD \parallel$ 平面 $PAB$；
> （2）当 $AA_1 \perp$ 平面 $ABC$，且 $A_1P = 3PC_1$ 时，求三棱锥 $B_1\text{-}APC$ 的体积。

```callout
{
  "type": "info",
  "title": "坐标系约定",
  "content": "B 为原点，$\\overrightarrow{BA}$ 为 y 轴、$\\overrightarrow{BC}$ 为 x 轴、$\\overrightarrow{BB_1}$ 为 z 轴（垂直）。\n第 (2) 问条件 $AA_1 \\perp$ 平面 $ABC$ ⇒ 直三棱柱 ⇒ $A_1, B_1, C_1$ 的 z 坐标都是 2。"
}
```

---

## 3D 几何体

```geometry-3d
{
  "id": "prism-2024-xianyang",
  "title": "三棱柱 ABC-A₁B₁C₁（AB⊥BC，AB=BC=AA₁=2）",
  "geometry": "triangular-prism",
  "vertices": [
    [0, 2, 0], [0, 0, 0], [2, 0, 0],
    [0, 2, 2], [0, 0, 2], [2, 0, 2]
  ],
  "size": [2, 2, 2],
  "showFaces": true, "showEdges": true, "showVertices": true,
  "showAxes": true, "showGrid": true,
  "planes": [
    { "id": "Tri-PAC", "vertices": ["A", "P", "C"], "color": "#a0e7e5", "opacity": 0.35 }
  ],
  "auxLines": [
    { "id": "OD",  "from": "O",  "to": "D",  "style": "dashed", "color": "#ff3366" },
    { "id": "AP",  "from": "A",  "to": "P",  "style": "dashed", "color": "#ff3366" }
  ],
  "labels": [
    ["A",  [ 0, 2, 0]], ["B",  [ 0, 0, 0]], ["C",  [ 2, 0, 0]],
    ["A₁", [ 0, 2, 2]], ["B₁", [ 0, 0, 2]], ["C₁", [ 2, 0, 2]],
    ["O",  [ 1, 1, 0]], ["P",  [ 0.5, 1.5, 2]], ["D",  [ 1.25, 0.75, 1]]
  ],
  "camera": { "position": [4.0, 4.0, 1.0], "target": [1.0, 1.0, 1.0], "fov": 45 }
}
```

> 拖动旋转 / Shift+拖动平移 / 滚轮缩放 / **A/D 或 ←/→ 绕 Z 轴自转** / 双击复位。

---

## 第 (1) 问：证明 OD ∥ 平面 PAB

```math-step
{
  "id": "step-q1",
  "title": "证明 OD ∥ 平面 PAB（线面平行判定）",
  "geometry3dId": "prism-2024-xianyang",
  "question": "P 是 A₁C₁ 上任意一点，O 是 AC 中点，D 是 PC 中点。求证 OD ∥ 平面 PAB。",
  "steps": [
    {
      "title": "Step 1 · 看见 △PAC（跨面三角形）",
      "content": "$P$ 在顶面 $A_1C_1$ 上、$A, C$ 在底面上 —— **△PAC 跨顶面和底面**。",
      "highlight": { "planes": ["Tri-PAC"] }
    },
    {
      "title": "Step 2 · 看见中位线 OD ∥ AP",
      "content": "$O$ 是 $AC$ 中点、$D$ 是 $PC$ 中点 ⇒ $OD$ 是 $\\triangle PAC$ 的中位线 ⇒ $OD \\parallel AP$。\n\n$AP \\subset$ 平面 $PAB$，$OD \\not\\subset$ 平面 $PAB$，由**线面平行判定定理** ⇒ $OD \\parallel$ 平面 $PAB$。",
      "highlight": {
        "planes": ["Tri-PAC"],
        "auxLines": ["OD", "AP"]
      }
    }
  ]
}
```

---

## 第 (2) 问：求三棱锥 B₁-APC 的体积

```callout
{
  "type": "info",
  "title": "第 (2) 问新条件",
  "content": "$AA_1 \\perp$ 平面 $ABC$ ⇒ 直三棱柱；$A_1P = 3PC_1$ ⇒ $P$ 分 $A_1C_1$ 为 $3:1$，$P = (1.5, 0.5, 2)$。"
}
```

```geometry-3d
{
  "id": "prism-2024-xianyang-q2",
  "title": "三棱柱（直）· P = (1.5, 0.5, 2)",
  "geometry": "triangular-prism",
  "vertices": [
    [0, 2, 0], [0, 0, 0], [2, 0, 0],
    [0, 2, 2], [0, 0, 2], [2, 0, 2]
  ],
  "size": [2, 2, 2],
  "showFaces": true, "showEdges": true, "showVertices": true, "showAxes": true,
  "planes": [
    { "id": "Tri-APC", "vertices": ["A", "P", "C"], "color": "#ffd166", "opacity": 0.4 }
  ],
  "auxLines": [
    { "id": "B1D", "from": "B₁", "to": "D", "style": "dashed", "color": "#ff3366" }
  ],
  "labels": [
    ["A",  [   0, 2, 0]], ["B",  [   0, 0, 0]], ["C",  [   2, 0, 0]],
    ["A₁", [   0, 2, 2]], ["B₁", [   0, 0, 2]], ["C₁", [   2, 0, 2]],
    ["P",  [ 1.5, 0.5, 2]], ["D",  [ 1.75, 0.25, 1]]
  ],
  "derivedVertices": [
    { "label": "D", "formula": "midpoint(P, C)" }
  ],
  "camera": { "position": [3.5, 3.2, 3.6], "target": [0.8, 1, 0.8], "fov": 50 }
}
```

```slider
{
  "id": "slider-p-q2",
  "label": "P 沿 A₁ → C₁ 滑动（t = A₁P / A₁C₁）",
  "min": 0, "max": 1, "step": 0.01, "defaultValue": 0.75, "unit": "t",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "drives": [{ "vertex": "P", "path": ["A₁", "C₁"], "param": "value" }],
  "caption": "t = 0.75 对应 A₁P = 3PC₁（D 自动 = mid(P, C)，B₁D 跟着动）。"
}
```

```tetra-equiv
{
  "id": "tetra-equiv-b1apc",
  "title": "同一个三棱锥 B₁-APC 的 4 种摆法（等体积法）",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "vertexLabels": ["A", "P", "C", "B₁"],
  "showAs": [
    { "base": ["A", "P", "C"],  "apex": "B₁", "color": "#ff6b6b", "label": "B₁-APC（题面底）" },
    { "base": ["A", "P", "B₁"], "apex": "C",  "color": "#4ecdc4", "label": "C-APB₁（C 锥顶）" },
    { "base": ["A", "C", "B₁"], "apex": "P",  "color": "#ffe66d", "label": "P-ACB₁（P 锥顶）" },
    { "base": ["P", "C", "B₁"], "apex": "A",  "color": "#a8e6cf", "label": "A-PCB₁（A 锥顶）" }
  ],
  "caption": "4 个三棱锥同框，4 种 apex 互换，**体积完全相等**。拖上面滑块改 P，4 个锥同步变形。"
}
```

```cut-anim
{
  "id": "cut-b1apc",
  "title": "剖切动画：从三棱柱切出三棱锥 B₁-APC",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "keepVertices": ["A", "P", "C", "B₁"],
  "cutPlane": { "type": "plane-through-points", "points": ["A", "P", "C"] },
  "duration": 1800, "easing": "easeInOutQuad",
  "caption": "切下部分 = 三棱锥 B₁-APC（橙）；剩余 = 三棱柱去掉该锥（淡蓝）。点播放看剖切。"
}
```

```math-step
{
  "id": "step-q2",
  "title": "求 V_{B₁-APC}",
  "geometry3dId": "prism-2024-xianyang-q2",
  "question": "AA₁⊥平面 ABC，A₁P = 3PC₁。求三棱锥 B₁-APC 的体积。",
  "steps": [
    {
      "title": "Step 1 · 建系，看 4 个顶点",
      "content": "$A(0,2,0)$、$B_1(0,0,2)$、$P(1.5, 0.5, 2)$、$C(2, 0, 0)$ —— 4 点不共面。",
      "highlight": { "planes": ["Tri-APC"] }
    },
    {
      "title": "Step 2 · 等体积法（4 种 apex 互换）",
      "content": "看上方「同体异构」组件 —— 同一个三棱锥选 4 种 apex 任意一个，**体积完全相等**。\n\n所以不用纠结「选哪个底」，随便选一个能算的就行。下面用 $\\triangle APC$ 做底。",
      "highlight": {
        "planes": ["Tri-APC"],
        "auxLines": ["B1D"]
      }
    },
    {
      "title": "Step 3 · 选底 △APC，叉积算",
      "content": "$\\vec{AP} = (1.5, -1.5, 2)$，$\\vec{AC} = (2, -2, 0)$，$\\vec{AP} \\times \\vec{AC} = (4, 4, 0)$。\n\n$S_{\\triangle APC} = \\tfrac{1}{2}|\\vec{AP} \\times \\vec{AC}| = 2\\sqrt{2}$。\n\n面 $APC$ 法向量 $\\vec{n} = (4, 4, 0)$，$B_1(0,0,2)$ 到面 $APC$ 距离 $h = \\tfrac{|\\vec{AB_1} \\cdot \\vec{n}|}{|\\vec{n}|} = \\tfrac{|-8|}{4\\sqrt{2}} = \\sqrt{2}$。\n\n$V = \\tfrac{1}{3} \\cdot 2\\sqrt{2} \\cdot \\sqrt{2} = \\boxed{\\dfrac{4}{3}}$。"
    }
  ]
}
```
