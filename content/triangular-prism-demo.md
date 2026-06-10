---
title: 立体几何综合题：2024·陕西咸阳·模拟预测
subtitle: 三棱柱中证线面平行 + 求三棱锥体积
author: Stuart
sections:
  - 原题呈现
  - 3D 几何体
  - 第 (1) 问：证明 OD ∥ 平面 PAB
  - 第 (2) 问：求三棱锥 B₁-APC 的体积
  - 辅助线 / 辅助面 3D 视觉化方案
---

# 立体几何综合题：2024·陕西咸阳·模拟预测

## 原题

> **（2024·陕西咸阳·模拟预测）** 已知三棱柱 $ABC$-$A_1B_1C_1$，如图所示，$P$ 是 $A_1C_1$ 上一动点，点 $O, D$ 分别是 $AC, PC$ 的中点，$AB \perp BC$，$AA_1 = AB = BC = 2$。
>
> （1）求证：$OD \,\|\,$ 平面 $PAB$；
> （2）当 $AA_1 \perp$ 平面 $ABC$，且 $A_1P = 3PC_1$ 时，求三棱锥 $B_1\text{-}APC$ 的体积。

```callout
{
  "type": "info",
  "title": "本题两大难点",
  "content": "（1）证线面平行：$P$ 是 $A_1C_1$ 上**任意一点**——结论必须对所有位置都成立，不能用特殊点（$P=A_1$、$P=C_1$、$P$ 为中点）取巧。\n\n（2）求体积：标准建系后套 $V = \\frac{1}{3}Sh$，关键是选**合适的底和高**，避免叉积算体积的繁琐。"
}
```

---

## 3D 几何体

> **操作**：拖动旋转、滚轮缩放、Shift+拖动平移；hover 以下步骤可联动高亮半透面 / 虚拟边 / 虚拟平面。

```geometry-3d
{
  "id": "prism-2024-xianyang",
  "title": "三棱柱 ABC-A₁B₁C₁（AB⊥BC，AB=BC=AA₁=2）",
  "geometry": "triangular-prism",
  "vertices": [
    [0, 2, 0],
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 2],
    [0, 0, 2],
    [2, 0, 2]
  ],
  "size": [2, 2, 2],
  "showFaces": true,
  "showEdges": true,
  "showVertices": true,
  "showAxes": true,
  "edgeColor": "#1a1a1a",
  "faceColor": "#cce0ff",
  "vertexColor": "#ff6b35",
  "planes": [
    { "id": "Tri-PAC", "vertices": ["A", "P", "C"], "color": "#a0e7e5", "opacity": 0.35 }
  ],
  "labels": [
    ["A",  [ 0, 2, 0]],
    ["B",  [ 0, 0, 0]],
    ["C",  [ 2, 0, 0]],
    ["A₁", [ 0, 2, 2]],
    ["B₁", [ 0, 0, 2]],
    ["C₁", [ 2, 0, 2]],
    ["O",  [ 1, 1, 0]],
    ["P",  [ 0.5, 1.5, 2]],
    ["D",  [ 1.25, 0.75, 1]]
  ],
  "camera": { "position": [3.5, 3.2, 3.6], "target": [0.8, 1, 0.8], "fov": 50 },
  "caption": "P 取 A₁C₁ 中点（动点示意）。hover 下方步骤可联动高亮关键平面和虚拟辅助线。"
}
```

> **坐标系约定**：B 为原点，$\overrightarrow{BA}$ 为 y 轴正方向，$\overrightarrow{BC}$ 为 x 轴正方向，$\overrightarrow{BB_1}$ 为 z 轴正方向。
> 第 (2) 问条件 $AA_1 \perp$ 平面 $ABC$ ⇒ 侧棱 $\perp$ 底面 ⇒ $A_1, B_1, C_1$ 的 z 坐标都是 2。

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
      "title": "Step 1 · 看见 △PAC —— 横跨两个面的「跨面三角形」",
      "content": "学员第一眼会愣住：$P$ 在**顶面** $A_1C_1$ 上、$A, C$ 在**底面**上——**三角形 PAC 横跨顶面和底面**。\n\n但只要**拖动 3D 视角**让 $P, A, C$ 三点同时出现在眼前，△PAC 就清晰可见。\n\n下一步我们看它的**两条中位线**。",
      "highlight": {
        "planes": ["Tri-PAC"]
      }
    },
    {
      "title": "Step 2 · 看见中位线 OD ∥ AP（关键！）",
      "content": "$O$ 是 $AC$ 中点、$D$ 是 $PC$ 中点 ⇒ **OD 是 △PAC 沿 PC-AC 边的中位线**。\n\n由中位线定理：$OD \\parallel AP$ 且 $OD = \\frac{1}{2}AP$。\n\n此时：\n- $AP \\subset$ 平面 $PAB$（$A, P$ 都是平面 $PAB$ 的顶点）\n- $OD \\not\\subset$ 平面 $PAB$（$O$ 在底面中点，不在面 $PAB$ 内）\n- $OD \\parallel AP$\n\n由**线面平行判定定理**：$OD \\parallel$ 平面 $PAB$。✓",
      "highlight": {
        "planes": ["Tri-PAC"],
        "edges": [["O", "D"], ["A", "P"]]
      }
    }
  ]
}
```

```callout
{
  "type": "warning",
  "title": "教学注解 · 为什么学员会卡在 (1) 问？",
  "content": "**学员卡点不是「中位线定理不会用」，而是「看不出 △PAC 这个三角形」**。\n\n- $P$ 在顶面、$A, C$ 在底面，**这三个点不在同一个看得见的三角形里**（顶面是 △A₁B₁C₁，底面是 △ABC，P 不在底面、A/C 也不在顶面）\n- 学员的本能反应是去底面找中位线（$O$ 在底面 ⇒ 误以为 $OD$ 在底面）\n- **但 OD 是斜的**——从底面 $O$ 斜上到顶面附近的 $D$\n\n3D 教学的作用：让学员**直接看到 △PAC 这个跨面三角形**（半透面高亮）+ **直接看到中位线 OD**（红色虚拟边）—— 一旦这两个元素在 3D 里被「点亮」，中位线定理自然用得上。"
}
```

```callout
{
  "type": "info",
  "title": "为什么证法这么短？",
  "content": "因为题目给的两个中点条件（$O$ 是 $AC$ 中点、$D$ 是 $PC$ 中点）**直接把 OD 钉死在 △PAC 的中位线上**——根本不需要额外构造辅助线。\n\n4 行证明：\n\n1. $O, D$ 分别是 $AC, PC$ 中点 ⇒ $OD$ 是 $\\triangle PAC$ 的中位线\n2. ⇒ $OD \\parallel AP$\n3. $AP \\subset$ 平面 $PAB$，$OD \\not\\subset$ 平面 $PAB$\n4. ⇒ $OD \\parallel$ 平面 $PAB$\n\n**题目的难度不在证明，在「看见 △PAC」**。"
}
```

```math-step
{
  "id": "step-q1-vec",
  "title": "第 (1) 问 · 空间向量法",
  "geometry3dId": "prism-2024-xianyang",
  "question": "建系后用 $\\vec{OD}$ 与平面 PAB 法向量垂直 ⇒ OD ∥ 平面 PAB。",
  "steps": [
    {
      "title": "Step 1 · 建系（B 为原点）",
      "content": "虽然题面没给 $AA_1 \\perp$ 平面 $ABC$（这个条件是 (2) 问才加的），但 (1) 问的证明**不依赖**这个垂直性——可以用同一套坐标系（即使侧棱不垂直底面，向量关系也成立）。\n\n但**等一下**：第 (1) 问**不假设** $AA_1 \\perp$ 平面 $ABC$！侧棱 $AA_1$ 是斜的。题目只说 $AA_1 = 2$。\n\n**正确建系**：以 $B$ 为原点，$\\overrightarrow{BA}, \\overrightarrow{BC}, \\overrightarrow{BB_1}$ 为基向量。但此时 $BB_1$ 不一定垂直底面，所以这不是正交坐标系。\n\n证线面平行**不需要正交坐标系**——只需要找到 $\\vec{OD}$ 在面 PAB 内的分解。\n\n设 $\\vec{BB_1} = \\vec{b}$，则 $\\vec{AA_1} = \\vec{b}$，$A_1 = A + \\vec{b}$。$P$ 在 $A_1C_1$ 上，设 $P = A_1 + t(C_1 - A_1) = A + \\vec{b} + t \\cdot \\vec{BC}$。\n\n此时 $\\vec{OD} = D - O = \\frac{P + C}{2} - \\frac{A + C}{2} = \\frac{P - A}{2} = \\frac{\\vec{b} + t \\cdot \\vec{BC}}{2}$。\n\n而面 PAB 内 $\\vec{AB} = B - A = -\\overrightarrow{AB}$，$\\vec{AP} = P - A = \\vec{b} + t \\cdot \\vec{BC}$。\n\n所以 $\\vec{OD} = \\frac{1}{2}\\vec{AP}$，即 $OD \\parallel AP$，$OD$ 在面 PAB 内（$O$ 在 $AC$ 上属于底面，$A$ 是面 PAB 顶点，所以 $O$ 在面 PAB 外；但 $OD \\parallel AP$ 意味着 $OD$ 平行于面 PAB 内一条直线）。\n\n又 $OD \\not\\subset$ 平面 $PAB$（$O$ 不在面 PAB 内，因为 $O$ 是底面中点，面 PAB 过 $A,B,P$ 三点），所以 $OD \\parallel$ 平面 $PAB$。 ✓"
    }
  ]
}
```

```callout
{
  "type": "success",
  "title": "第 (1) 问关键 insight",
  "content": "$\\vec{OD} = \\frac{1}{2}\\vec{AP}$ 是个**完美的中点巧合**：$O$ 是 $AC$ 中点，$D$ 是 $PC$ 中点 ⇒ $OD$ 是 $\\triangle PAC$ 的中位线 ⇒ $OD \\parallel AP$。\n\n**根本不用建系**！这是 (1) 问的**正确几何证法**：$O, D$ 都是中点 ⇒ $OD$ 是 $\\triangle PAC$ 中位线 ⇒ $OD \\parallel AP$ ⇒ $OD \\parallel$ 平面 $PAB$（$AP \\subset$ 面 $PAB$，$OD \\not\\subset$ 面 $PAB$）。\n\n**3D 教学难点**：学员看不出「$O, D$ 分别是 $AC, PC$ 中点」这条件直接给出 $OD$ 是中位线。需要 3D 拖动让学员看到 $P, A, C$ 三点构成的三角形，以及 $O, D$ 落在这三角形两条中位线交点的位置。"
}
```

---

## 第 (2) 问：求三棱锥 B₁-APC 的体积

```callout
{
  "type": "info",
  "title": "第 (2) 问新条件",
  "content": "$AA_1 \\perp$ 平面 $ABC$ ⇒ 侧棱 $\\perp$ 底面 ⇒ **三棱柱变成直三棱柱**。\n\n$A_1P = 3PC_1$ ⇒ $P$ 分 $A_1C_1$ 为 $3:1$，$P$ 离 $A_1$ 远、离 $C_1$ 近。\n\n具体坐标：$P = A_1 + \\frac{3}{4}(C_1 - A_1) = (0 + \\frac{3}{4} \\cdot 2, 2 + \\frac{3}{4} \\cdot 0, 2) = (1.5, 2, 2)$。"
}
```

```geometry-3d
{
  "id": "prism-2024-xianyang-q2",
  "title": "第 (2) 问：三棱柱变直三棱柱，P 在 A₁C₁ 上（3:1）",
  "geometry": "triangular-prism",
  "vertices": [
    [0, 2, 0],
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 2],
    [0, 0, 2],
    [2, 0, 2]
  ],
  "size": [2, 2, 2],
  "showFaces": true,
  "showEdges": true,
  "showVertices": true,
  "showAxes": true,
  "edgeColor": "#1a1a1a",
  "faceColor": "#cce0ff",
  "vertexColor": "#ff6b35",
  "planes": [
    { "id": "Tri-APC", "vertices": ["A", "P", "C"], "color": "#ffd166", "opacity": 0.4 }
  ],
  "labels": [
    ["A",  [   0, 2, 0]],
    ["B",  [   0, 0, 0]],
    ["C",  [   2, 0, 0]],
    ["A₁", [   0, 2, 2]],
    ["B₁", [   0, 0, 2]],
    ["C₁", [   2, 0, 2]],
    ["P",  [ 1.5, 2, 2]],
    ["D",  [ 1.75, 1, 1]]
  ],
  "derivedVertices": [
    { "label": "D", "formula": "midpoint(P, C)" }
  ],
  "camera": { "position": [3.5, 3.2, 3.6], "target": [0.8, 1, 0.8], "fov": 50 },
  "caption": "P = (1.5, 2, 2)。半透面 APC 已高亮。求 V_{B₁-APC}。拖动下方滑块改变 P 位置，D 自动跟随重算。"
}
```

```slider
{
  "id": "slider-p-q2",
  "title": "动点 P 在 A₁C₁ 上的位置",
  "label": "P 沿 A₁ → C₁ 滑动（t = A₁P / A₁C₁）",
  "min": 0,
  "max": 1,
  "step": 0.01,
  "defaultValue": 0.75,
  "unit": "t",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "drives": [
    { "vertex": "P", "path": ["A₁", "C₁"], "param": "value" }
  ],
  "caption": "t = 0.75 对应 A₁P = 3PC₁（D 自动 = mid(P, C)）。"
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
    { "base": ["A", "B₁", "C₁"], "apex": "P",  "color": "#4ecdc4", "label": "P-AB₁C₁（P 锥顶）" },
    { "base": ["P", "B₁", "C"],  "apex": "A",  "color": "#ffe66d", "label": "A-PB₁C（A 锥顶）" },
    { "base": ["A", "P", "B₁"],  "apex": "C",  "color": "#a8e6cf", "label": "C-APB₁（C 锥顶）" }
  ],
  "caption": "4 个三棱锥形状不同 / 顶点不同 / 体积完全相等。拖动上面滑块改变 P 位置，4 个锥同步变形，但体积校验永远相等。"
}
```

```cut-anim
{
  "id": "cut-b1apc",
  "title": "剖切动画：从三棱柱切出三棱锥 B₁-APC",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "keepVertices": ["A", "P", "C", "B₁"],
  "cutPlane": {
    "type": "plane-through-points",
    "points": ["A", "P", "C"]
  },
  "duration": 1800,
  "easing": "easeInOutQuad",
  "caption": "切下部分 = 三棱锥 B₁-APC（橙色高亮）；剩余部分 = 三棱柱 APC-A₁B₁C₁ 减去切下部分（淡蓝）。点播放看剖切过程；拖动上面滑块改 P 位置，切面跟着转，比例不变。"
}
```

```math-step
{
  "id": "step-q2",
  "title": "第 (2) 问 · 求 V_{B₁-APC}",
  "geometry3dId": "prism-2024-xianyang-q2",
  "question": "AA₁⊥平面 ABC，A₁P = 3PC₁。求三棱锥 B₁-APC 的体积。",
  "steps": [
    {
      "title": "Step 1 · 看清四个顶点的空间位置",
      "content": "建系后 4 个顶点：$A(0,2,0)$、$B_1(0,0,2)$、$P(1.5, 2, 2)$、$C(2, 0, 0)$。\n\n注意 **$A, P$ 在 $y=2$ 平面（$xOz$ 平面切 $y=2$ 的子平面）**、**$B_1, C$ 在 $z=0$ 或 $z=2$ 平面**—— 4 个点**任意 3 个都不共面**（这是三棱锥的必要条件）。\n\n3D 拖动几下让学员看见 4 个点的位置，是教学的第一步。",
      "highlight": {
        "planes": ["Tri-APC"]
      }
    },
    {
      "title": "Step 2 · 等体积法：4 种「底+顶点」选法（v0.3 才有同框动画）",
      "content": "同一个四面体，**底面可以选 4 种**，对应 4 个不同的锥顶：\n\n- $V_{B_1\\text{-}APC}$（题面给的）\n- $V_{P\\text{-}AB_1C_1}$（$P$ 作锥顶）\n- $V_{A\\text{-}PB_1C}$（$A$ 作锥顶）\n- $V_{C\\text{-}APB_1}$（$C$ 作锥顶）\n\n**教学目标**：让学员**同时看到这 4 个「同体异构」四面体**——它们**形状不同、底不同、顶点不同，但体积完全一样**。\n\n**v0.3 同体异构动画**（待 Alice 实现）：4 个四面体用 4 种颜色并排显示，3D 拖动后学员能直接「换个角度看同一个四面体」。\n\n**目前 v0.1/v0.2 没有这个能力**，所以 (2) 问必须**配文字公式**讲。",
      "highlight": {
        "planes": ["Tri-APC"]
      }
    },
    {
      "title": "Step 3 · 选最方便的底：△APC（叉积算面积 + 点到面距离）",
      "content": "用底 $\\triangle APC$：\n- $\\vec{AP} = (1.5, 0, 2)$\n- $\\vec{AC} = (2, -2, 0)$\n- $\\vec{AP} \\times \\vec{AC} = (4, 4, -3)$\n- $S_{\\triangle APC} = \\frac{1}{2}|\\vec{AP} \\times \\vec{AC}| = \\frac{1}{2}\\sqrt{16+16+9} = \\frac{\\sqrt{41}}{2}$\n\n再求 $B_1(0,0,2)$ 到面 $APC$ 的距离 $h$。面 $APC$ 法向量 $\\vec{n} = (4, 4, -3)$，$|\\vec{n}| = \\sqrt{41}$。\n\n$\\vec{AB_1} = (0, -2, 2)$，距离 $h = \\frac{|\\vec{AB_1} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{|0 - 8 - 6|}{\\sqrt{41}} = \\frac{14}{\\sqrt{41}}$\n\n$V = \\frac{1}{3} \\cdot \\frac{\\sqrt{41}}{2} \\cdot \\frac{14}{\\sqrt{41}} = \\frac{1}{3} \\cdot 7 = \\frac{7}{3}$\n\n**答案**：$V_{B_1\\text{-}APC} = \\dfrac{7}{3}$。",
      "highlight": {
        "planes": ["Tri-APC"]
      }
    }
  ]
}
```

```callout
{
  "type": "success",
  "title": "第 (2) 问教学卡点",
  "content": "**学员卡点不是叉积不会算，是「选哪个底」决策成本高**。\n\n四个底中，**只有 △APC 是「斜着的跨面三角形」**（其他三个底要么共 z 平面、要么共 y 平面），所以面积计算必然涉及叉积——**没有「一眼能看出面积」的底**。\n\n**3D 教学能做的事**（v0.3）：\n- **slider 联动 P 位置**：让 P 沿 A₁C₁ 滑动，学员**实时看** $V_{B_1-APC}$ 怎么变（先增后减、极值点出现在 $P = A_1$ 或 $P = C_1$ 还是中点？）\n- **剖切动画**：从三棱柱切出三棱锥 B₁-APC，看切下部分占整个棱柱的 7/12\n- **同体异构四面体同框**：4 个等价底用 4 种颜色，学员一眼看明白「换底不换体积」\n\n**没这些动画**：(2) 问只能死记公式，学员不知道为什么选这个底、不选那个。"
}
```

---

## 辅助线 / 辅助面的 3D 视觉化方案

```callout
{
  "type": "warning",
  "title": "写到这里我发现的事",
  "content": "**这道题的两问都「纯几何构造不直观」**——\n\n- (1) 问的几何证法很简洁（$OD$ 是 $\\triangle PAC$ 中位线 ⇒ $OD \\parallel AP$），但学员**看不出 $\\triangle PAC$ 这个三角形**——因为 $P$ 在顶面、$A, C$ 在底面，跨两个面。\n- (2) 问的等体积法、割补法都需要在脑子里**画 4 个不同的底**，对空间想象力的要求比计算还高。\n\n**这是「3D 教学」最有价值的地方**：用 3D 拖动让学员**直接看到**这些「跨面三角形」「四面体的不同摆法」，比文字描述强 10 倍。"
}
```

**下面是这个题目需要的 3D 视觉化能力清单**（给 Alice 做下一版组件的参考）：

| 视觉能力 | 解决什么 | 现有 geometry-3d 是否支持 |
|---|---|---|
| **3D 拖动旋转** | 学员从任意角度观察三棱柱和点位置 | ✅ 已有 |
| **半透面高亮**（`planes`） | 高亮 $\\triangle PAC$ / 平面 PAB / 平面 $A_1BC_1$ 等 | ✅ 已有 |
| **虚拟辅助边**（`edges`） | 画 $OD$、画 $PE$、画中位线 | ✅ 已有 |
| **虚拟辅助面**（需要新能力） | 「构造过 $P$ 平行 $AB$ 的辅助平面」「补全 $A_1BC_1$ 这个矩形侧面」 | ⚠️ 部分支持（半透面），但**没有「构造动态辅助平面」的交互** |
| **点的轨迹** | $P$ 在 $A_1C_1$ 上滑动时，$OD$ 怎么动？$V_{B_1-APC}$ 怎么变？ | ❌ 没有 slider 联动 |
| **等体积四面体 4 种底** | 同时画出「$B_1\\text{-}APC$」「$P\\text{-}AB_1C_1$」「$A\\text{-}PB_1C_1$」「$C\\text{-}APB_1$」4 个四面体，看它们是同一个 | ❌ 没有「同体异构」可视化 |
| **剖切 / 截取动画** | 把三棱柱「切一刀」得到三棱锥 $B_1\\text{-}APC$ | ⚠️ 已有 `clippingPlane`，但**没有保留切下部分的动画** |

**3D 教学这件事，目前 geometry-3d v0.1 只能解决「**静态观察 + 关键元素高亮**」**。要让学员真正理解「辅助线」「辅助面」的构造过程，**至少还需要**：

1. **滑动条 (slider) 组件**：让 $P$ 沿 $A_1C_1$ 滑动，$D$ 跟着动，$OD$ 实时重画
2. **辅助线/辅助面的「画笔模式」**：教师模式下点选「画一条平行于 $AB$ 的线」→ 自动给出
3. **「同体异构」四面体展示**：同时显示 4 个等价底（点不同），用不同颜色区分
4. **剖切动画**：从三棱柱 → 三棱锥的转化过程

**这些是 courseware v0.3+ 的方向**，v0.1 / v0.2 的「高亮 + 联动」对 (1) 问的几何证法已经够用（让学员看到 $\\triangle PAC$ 即可），但 (2) 问的体积部分**必须有 v0.3 的「等体积四面体同框」+「剖切动画」**才好讲。

---

## 一句话判断

**3D 组件对这道题的价值分两档**：
- (1) 问中位线证法 → **v0.1 现有能力足够**（高亮 $\\triangle PAC$ + 中位线 $OD$ 即可让学员看见「三角形 - 中位线 - 平行线面」三个要素）
- (2) 问体积 → **必须有 v0.3 能力**（等体积四面体同框 + slider 联动 $P$ 位置 + 剖切动画），否则学员只能死记公式
