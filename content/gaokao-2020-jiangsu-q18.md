---
title: 2020 江苏高考 · 椭圆 3 问
subtitle: x²/4 + y²/3 = 1 · 焦点、准线、面积三件套
author: Alice
sections:
  - 一、原题
  - 二、椭圆基本量（a/b/c/e）
  - 三、第(1)问：ΔAF₁F₂ 周长 = 6（椭圆定义）
  - 四、第(2)问：OP · OQ 最小值 = 1（调和点列 / 圆幂）
  - 五、第(3)问：S₂ = 3S₁ 求 M 坐标（面积比 = 距离比）
  - 六、能力边界（这套课件能 / 不能做什么）
  - 七、课件创作流程小结
---

# 2020 江苏高考 · 第 18 题

> **本课件目的**：用这道经典高考题测试 Slidecraft 的 2D 组件能力——**能覆盖的部分做成交互，缺能力的部分如实标注**。

## 一、原题

**（2020 江苏高考 · 第 18 题）** 在平面直角坐标系 $xOy$ 中，已知椭圆 $E: \dfrac{x^2}{4} + \dfrac{y^2}{3} = 1$ 的左、右焦点分别为 $F_1, F_2$，点 $A$ 在椭圆 $E$ 上且在第一象限内，$AF_2 \perp F_1F_2$，直线 $AF_1$ 与椭圆 $E$ 相交于另一点 $B$。

**(1)** 求 $\triangle AF_1F_2$ 的周长；

**(2)** 在 $x$ 轴上任取一点 $P$，直线 $AP$ 与椭圆 $E$ 的右准线相交于点 $Q$，求 $\overrightarrow{OP} \cdot \overrightarrow{OQ}$ 的最小值；

**(3)** 设点 $M$ 在椭圆 $E$ 上，记 $\triangle OAB$ 与 $\triangle MAB$ 的面积分别为 $S_1, S_2$，若 $S_2 = 3S_1$，求点 $M$ 的坐标。

```callout
{
  "type": "info",
  "title": "题目要点",
  "content": "椭圆 E 标准形式 a²=4, b²=3 → c²=1, c=1, e=1/2。右准线 x = a²/c = 4。AF₂ ⊥ F₁F₂ 提示 A 在第一象限 x 坐标 = c = 1（A 投到 x 轴正好是 F₂）。"
}
```

---

## 二、椭圆基本量（静态可视化）

```coords-2d
{
  "id": "kq-coords-static",
  "title": "椭圆 E 静态图（含焦点、中心）",
  "xRange": [-3, 5],
  "yRange": [-2.5, 2.5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": true,
  "aspect": "equal"
}
```

```function-plot
{
  "id": "kq-fp-ellipse",
  "title": "椭圆 x²/4 + y²/3 = 1（焦点 F₁(-1,0), F₂(1,0)，准线 x=±4）",
  "coords": "kq-coords-static",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "E",
      "type": "conic_ellipse",
      "params": {
        "a": 2,
        "b": 1.732,
        "showDirectrix": true,
        "directrixColor": "#888",
        "directrixStyle": "dashed",
        "onCurve": { "theta": 1.047, "color": "#d65a5a", "label": "A" }
      },
      "color": "#4caf85",
      "width": 2.5
    }
  ],
  "caption": "a=2, b=√3, c=1, e=1/2。**v0.1.1 新增**：(1) 准线 x=±4 虚线（c 中心时准线位置 = ±a²/c = ±4）；(2) onCurve 模式：椭圆上点 A（θ=π/3）= (1, 1.5)，slider 联动 onCurve.theta 可拖动 A 沿椭圆动。"
}
```

```slider
{
  "id": "kq-slider-theta",
  "label": "A 沿椭圆动（θ 角度）",
  "min": 0, "max": 6.2832, "step": 0.01, "defaultValue": 1.047, "unit": "θ",
  "linkedFunctionPlot": "kq-fp-ellipse",
  "drives": [
    { "fnId": "E", "param": "onCurve.theta", "map": "lerp", "min": 0, "max": 6.2832 }
  ],
  "caption": "拖滑块动 θ，椭圆上 A 点（红）跟着动。θ=0 在 (+2,0)，θ=π/2 在 (0, +√3)，θ=π 在 (-2, 0)。**杀手特性**：拖 A 看 |AF₁| + |AF₂| 恒为 4（椭圆第一定义）。"
}
```

```formula
{
  "id": "kq-formula-basics",
  "title": "椭圆基本量",
  "expr": "a^2 = 4, \\quad b^2 = 3, \\quad c^2 = 1, \\quad e = \\dfrac{1}{2}, \\quad \\text{右准线}\\ x = 4"
}
```

```callout
{
  "type": "note",
  "title": "AF₂ ⊥ F₁F₂ 的几何意义",
  "content": "题目给条件 AF₂ ⊥ F₁F₂，结合 F₁F₂ 在 x 轴上 → AF₂ 平行 y 轴 → A 的 x 坐标 = F₂ 的 x 坐标 = c = 1。代入椭圆方程 1/4 + y²/3 = 1 → y = √(9/4) = 3/2。**所以 A 坐标就是 (1, 3/2)**。"
}
```

---

## 三、第(1)问：ΔAF₁F₂ 周长 = 6

### 3.1 解题思路

```math-step
{
  "id": "kq-step-q1",
  "title": "周长 = |AF₁| + |AF₂| + |F₁F₂|",
  "question": "求 $\\triangle AF_1F_2$ 的周长",
  "steps": [
    {
      "id": "s1",
      "label": "椭圆定义",
      "content": "A 在椭圆上 → $|AF_1| + |AF_2| = 2a = 4$",
      "highlight": {}
    },
    {
      "id": "s2",
      "label": "焦距",
      "content": "$|F_1 F_2| = 2c = 2$",
      "highlight": {}
    },
    {
      "id": "s3",
      "label": "求和",
      "content": "周长 $= 2a + 2c = 4 + 2 = \\boxed{6}$",
      "highlight": {}
    }
  ]
}
```

### 3.2 杀手特性：**杀手特性测试** |AF₁| + |AF₂| 恒为 4（椭圆定义可视化）

```callout
{
  "type": "warning",
  "title": "能力缺口：拖动 A 沿椭圆",
  "content": "理想实现是**拖 A 沿椭圆动**实时显示 |AF₁| + |AF₂| = 4 恒成立（椭圆第一定义）。但**现有 2D 组件缺这个能力**——\n- `function-plot` 联动 `slider` 只能改 conic 曲线参数（a/b/cx/cy），不能『沿曲线拖动一个点』\n- 没有『几何对象』组件（点/线段/多边形/面积/距离）\n\n**这是 geometry-2d 平面几何画板组件的典型用例**（见第六节）。"
}
```

```concept-card
{
  "id": "kq-q1-summary",
  "title": "第(1)问结论",
  "items": [
    { "icon": "📐", "label": "周长", "value": "6", "note": "2a + 2c = 4 + 2" },
    { "icon": "🔑", "label": "核心定理", "value": "椭圆定义", "note": "|AF₁| + |AF₂| = 2a" },
    { "icon": "🎯", "label": "本题答案", "value": "6", "note": "直接套定义" }
  ]
}
```

---

## 四、第(2)问：OP · OQ 最小值 = 1

### 4.1 解题思路

```math-step
{
  "id": "kq-step-q2",
  "title": "调和点列 / 圆幂",
  "question": "求 $\\overrightarrow{OP} \\cdot \\overrightarrow{OQ}$ 的最小值",
  "steps": [
    {
      "id": "s1",
      "label": "几何结构",
      "content": "右准线 $x = 4$。A 在椭圆第一象限，P 在 x 轴 (p, 0)，Q 在右准线 (4, q) 且 A/P/Q 共线。",
      "highlight": {}
    },
    {
      "id": "s2",
      "label": "调和点列",
      "content": "由 A/F₂ 调和分割 P/Q（**A 是椭圆上的点，F₂ 是焦点，准线是右准线**——这是圆锥曲线的极线/调和性质），得 $\\overrightarrow{OP} \\cdot \\overrightarrow{OQ} = OF_2^2 = c^2 = 1$。",
      "highlight": {}
    },
    {
      "id": "s3",
      "label": "结论",
      "content": "$\\overrightarrow{OP} \\cdot \\overrightarrow{OQ} = 1$ **恒成立**（与 A 位置无关）→ 最小值 $= \\boxed{1}$",
      "highlight": {}
    }
  ]
}
```

```callout
{
  "type": "warning",
  "title": "能力缺口：拖 A 看 OP·OQ 恒为 1",
  "content": "理想实现是**拖 A 沿椭圆动**实时显示 OP·OQ = 1（圆幂/调和点列）。\n\n**现有组件缺**：\n- 沿曲线拖动点（缺口同 3.2）\n- **画任意直线**（AP 线、准线、连心线）—— 没有『画线段』组件\n- **任意两线求交**（直线 AP ∩ 准线 = Q）—— intersection-marker 只支持两 polynomial 相交，**不支持任意直线**\n- **点积计算**（OP·OQ = p·4 + 0·q = 4p）—— 没有几何量计算 API"
}
```

---

## 五、第(3)问：S₂ = 3S₁ 求 M 坐标

### 5.1 解题思路

```math-step
{
  "id": "kq-step-q3",
  "title": "面积比 = 距离比（O/M 到直线 AB）",
  "question": "若 $S_2 = 3S_1$，求点 $M$ 的坐标",
  "steps": [
    {
      "id": "s1",
      "label": "共用底",
      "content": "$\\triangle OAB$ 和 $\\triangle MAB$ **共用底边 AB** → 面积比 = 高之比 = O 与 M 到直线 AB 的距离之比",
      "highlight": {}
    },
    {
      "id": "s2",
      "label": "S₂ = 3S₁",
      "content": "$\\dfrac{S_2}{S_1} = \\dfrac{d(M, AB)}{d(O, AB)} = 3$，且 O 与 M 在 AB 异侧（面积叠加）",
      "highlight": {}
    },
    {
      "id": "s3",
      "label": "直线 AB 方程",
      "content": "A = (1, 3/2)，B = (?, ?)：B 是 AF₁ 直线与椭圆另一交点。AF₁ 斜率 = (3/2 - 0)/(1 - (-1)) = 3/4 → 直线 y = 3/4 (x + 1)。代入椭圆求 B → x_B = -2（解 x²/4 + 3/16(x+1)²/3 = 1）→ B = (-2, -3/4)。",
      "highlight": {}
    },
    {
      "id": "s4",
      "label": "求 M",
      "content": "M 在椭圆上且到 AB 距离 = 3·O 到 AB 距离 = 3·(3/4)/√(1+9/16) = ... 设 M = (x, y)，解距离比方程 → M 有 2 个解。",
      "highlight": {}
    }
  ]
}
```

```callout
{
  "type": "warning",
  "title": "能力缺口：拖 M 沿椭圆看面积比",
  "content": "理想实现是**拖 M 沿椭圆动**实时显示 S₂/S₁ → 找 S₂/S₁=3 的 2 个点。\n\n**现有组件缺**：\n- 沿曲线拖动点（同前）\n- **画三角形 OAB / MAB 区域**（fill 多边形）\n- **三角形面积计算**（= 1/2 · |AB| · h）\n- **点线距离计算**\n- **异侧判断**"
}
```

---

## 六、能力边界（这套课件能 / 不能做什么）

### 6.1 现有 2D 组件能做的

| 能力 | 组件 | 用法 |
|------|------|------|
| 画椭圆 + 焦点 + 顶点 | `function-plot` conic_ellipse | 静态（**不能拖动曲线上的点**）|
| 数学公式展示 | `formula` | KaTeX 编译时渲染 |
| 分步解题 | `math-step` | 步骤高亮 + 内容 |
| 概念卡片 | `concept-card` | 网格总结 |
| 警示 / 注解 | `callout` | 4 种类型（tip/warning/info/note） |
| 静态画图（多曲线叠加）| `function-plot` 多 functions 数组 | 双曲线/抛物线同款 |

### 6.2 这道题需要的、本课件**做不到**的能力

| 缺口 | 表现 | 建议 |
|------|------|------|
| **沿曲线拖动点** | 没法"拖 A 沿椭圆动"看 | **新组件 `geometry-2d` 平面几何画板** |
| **任意点（不在曲线上）**| 没法"拖 P 沿 x 轴" | 同上 |
| **任意直线/线段** | 没法画 AP、AB、F₁F₂ 这些非函数直线 | 同上（line 几何对象） |
| **任意两线求交** | 没法"AP ∩ 准线 = Q" | 同上（line × line 交点） |
| **几何量计算** | 距离 / 面积 / 点积 / 夹角 | 同上（measure API） |
| **椭圆准线绘制** | 焦点有，**准线没现成 API** | function-plot conic_ellipse 加 `showDirectrix: true` |
| **填充多边形** | 没法画三角形 OAB 区域 | geometry-2d 组件（polygon fill） |

### 6.3 与 3D 组件的对比

| 维度 | 3D（geometry-3d）| 2D（function-plot）| 缺的 2D |
|------|------------------|---------------------|---------|
| 几何对象 | 点 / 线段 / 面 / 三角化 / 辅助线 | **只有函数曲线** | 任意点 / 任意线 / 任意多边形 |
| 拖动 | slider 联动命名顶点 P | slider 联动 conic 参数 a/b | 拖任意几何对象 |
| 几何量 | 体积 / 边长 / 角度（_geom_utils）| 仅有函数值 | 长度 / 面积 / 距离 / 点积 |
| 标注 | auxLabels（length/angle/rightAngle）| 关键点（零点/极值/焦点/中心）| 自定义标注（线段中点 / 准线 / 任意点） |

```callout
{
  "type": "tip",
  "title": "结论",
  "content": "**Slidecraft 的 2D 体系目前只覆盖到「画函数图像」层级**——能做『任意函数 y=f(x) 画出来 + 联动改参数 + 找零点/极值/交点 + 算判别式』。\n\n**但「画任意几何对象」+「拖几何对象」+「算几何量」这套是 3D 组件已经具备的成熟能力，2D 还没建起来。**\n\n**这道高考题 + 我那个『杀手特性二次方程组图像解法』demo 都不是真几何题**——一个是函数（quadratic polynomial），一个是曲线相交（polynomial ∩ polynomial）。\n\n**真要完整覆盖高考几何题 / 数学家教老师备课场景，需要做 `geometry-2d` 平面几何画板组件**（点/线/线段/射线/角/多边形/圆 + measure API + 自定义标注）。\n\n**这个组件一旦做完，二次方程组杀手特性会变成它的子集**。"
}
```

---

## 七、课件创作流程小结

**整体流程**（以本课件为例）：

1. **分析题目能力清单**（2 分钟）—— 列出需要哪些组件能力
2. **静态部分写 markdown**（15 分钟）—— 原题 / 公式 / 概念卡 / 警示
3. **build 验证**（1 分钟）—— `node build.js` 看产物
4. **浏览器实测**（5 分钟）—— 端到端跑，看实际能力
5. **暴露能力缺口**（5 分钟）—— 第六节那种"能/不能"表
6. **下个迭代规划**（5 分钟）—— 哪些缺口要做新组件

**这套流程跑下来**—— 2D 组件对**函数图像相关**的课件覆盖度好，**真几何**（点线面 + 任意拖动 + 几何量）**完全缺**。下一步重心是 `geometry-2d` 平面几何画板组件。
