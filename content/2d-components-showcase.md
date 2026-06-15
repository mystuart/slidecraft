---
title: 2D 平面几何组件（v0.1.0 验证 + 教学）
subtitle: coords-2d / function-plot / intersection-marker / slider form-B · 4 组件 + 17 个示例
author: Alice
sections:
  - 1. coords-2d · 网格 + 坐标轴（地基）
  - 2. function-plot · 多项式 + 椭圆
  - 3. function-plot · 4 种非多项式（sin/cos/双曲线/抛物线）
  - 4. slider · 联动 function-plot
  - 5. 二次方程组图像解法（杀手特性）
---

# 2D 平面几何组件（v0.1.0）

courseware 框架 v1.3.0 新增 4 个 2D 组件：坐标系 + 函数图像 + 交点 + 滑块联动。
**目标用户**：数学家教老师（不是 DBA！框架是通用培训课件引擎，跨学科）。

| # | 组件 | 核心能力 |
|---|------|----------|
| 15 | `coords-2d` | Canvas 2D 网格 + 坐标轴 + 刻度 + 数据↔像素 API |
| 16 | `function-plot` | 5 种曲线（polynomial/sine/cosine/conic_ellipse/conic_hyperbola/conic_parabola）+ 关键点 + setParam 点语法 |
| 17 | `intersection-marker` | 静态交点 / polynomialIntersection / polynomialDiscriminant（Δ 实时 + 韦达定理） |
| - | `slider` v0.1.2 | form-B 联动 function-plot 参数（v0.1.1 老 form-A 联动 geometry-3d 向后兼容） |

**架构对齐**（与 3D 组件同款）：canvas 注入到 coords-2d stage 共享坐标系、per-instance `__scApi` 闭包、`sc:coords2d:change` / `sc:functionplot:change` 事件带 `bubbles: true`。

> **v0.2.0 评审修复**（GLM-5.1）：抛物线 orientation 4 方向画法 + 4x 缩放（C0-1）、`polyRealRoots` 重根漏掉相切（C1-1）、三次极值分类错（C1-2）、抽 `_geom_utils` 共享（C2-1）、`computeDiffCoeffs` 抽 helper（C2-3）。详见 `docs/glm-review-2d-v0.1.0.md`。

---

## 1. coords-2d · 网格 + 坐标轴（地基）

`coords-2d` 是 2D 体系的**地基组件**——`function-plot` 和 `intersection-marker` 都把自己的 canvas 注入到它的 stage 里共享坐标系。
3 种典型配置覆盖教学最常见的 3 个场景：基础居中、函数图像左下角原点、几何图形等比。

### 1.1 基础网格：x/y 居中

```coords-2d
{
  "id": "showcase-grid-basic",
  "title": "基础网格：x ∈ [-5, 5]，y ∈ [-5, 5]",
  "xRange": [-5, 5],
  "yRange": [-5, 5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": true,
  "caption": "标准 10×10 网格，原点在画布中心，每格 1 单位。刻度数字自动按 1 / 2 / 5 间隔选。",
  "aspect": "fit"
}
```

### 1.2 原点左下角：适合函数图像

```coords-2d
{
  "id": "showcase-grid-origin-bl",
  "title": "原点左下角：适合函数图像 y = f(x)",
  "xRange": [0, 10],
  "yRange": [0, 6],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": false,
  "aspect": "fit",
  "caption": "originAtCenter=false：原点在左下角。等下 function-plot 组件就吃这种配置。"
}
```

### 1.3 等比模式：x/y 单位像素相同

```coords-2d
{
  "id": "showcase-grid-equal",
  "title": "aspect: equal — x/y 单位像素相同",
  "xRange": [-6, 6],
  "yRange": [-3, 3],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": true,
  "aspect": "equal",
  "caption": "aspect: equal —— 单位像素在 x/y 方向相同，长方形可视域居中（短边留白）。适合需要视觉上『圆形确实是圆』的场景。"
}
```

---

## 2. function-plot · 多项式 + 椭圆

`function-plot` v0.1.0 共 5 种曲线类型——**结构化参数**（`{type, params}`），零字符串解析风险。
本节覆盖教学最常用的 3 个例子：多项式（基础 + 二次抛物线 + 关键点）+ 椭圆（conic_ellipse）。

### 2.1 多项式 y = x² - 2x - 3

```coords-2d
{
  "id": "showcase-fp-coords-poly",
  "title": "坐标系（多项式用）",
  "xRange": [-5, 5],
  "yRange": [-5, 5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-fp-poly",
  "title": "y = x² - 2x - 3",
  "coords": "showcase-fp-coords-poly",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "f1",
      "type": "polynomial",
      "params": { "coeffs": [1, -2, -3] },
      "color": "#8b7dd8",
      "width": 2.5,
      "label": "y = x² - 2x - 3"
    }
  ],
  "caption": "开口向上抛物线，零点 x=-1 和 x=3，顶点 (1, -4)。**coeffs 降序**（最高次在前）：[a₂=1, a₁=-2, a₀=-3]。"
}
```

### 2.2 二次抛物线 + 关键点

```coords-2d
{
  "id": "showcase-fp-coords-quad",
  "title": "坐标系（抛物线用）",
  "xRange": [-4, 6],
  "yRange": [-5, 8],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "showLabels": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-fp-quad",
  "title": "y = x² - 4x + 3 = (x-1)(x-3)",
  "coords": "showcase-fp-coords-quad",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "q1",
      "type": "polynomial",
      "params": { "coeffs": [1, -4, 3] },
      "color": "#d65a5a",
      "width": 2.5
    }
  ],
  "caption": "零点 (1, 0) 和 (3, 0)，顶点 (2, -1)。"
}
```

### 2.3 椭圆 x²/9 + y²/4 = 1

```coords-2d
{
  "id": "showcase-fp-coords-ellipse",
  "title": "坐标系（椭圆用，等比模式）",
  "xRange": [-5, 5],
  "yRange": [-3.5, 3.5],
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
  "id": "showcase-fp-ellipse",
  "title": "椭圆 x²/9 + y²/4 = 1",
  "coords": "showcase-fp-coords-ellipse",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "e1",
      "type": "conic_ellipse",
      "params": { "a": 3, "b": 2 },
      "color": "#4caf85",
      "width": 2.5
    }
  ],
  "caption": "长轴端点 (±3, 0)，短轴端点 (0, ±2)，焦点 (±√5, 0) ≈ (±2.24, 0)。"
}
```

---

## 3. function-plot · 4 种非多项式（sin/cos/双曲线/抛物线）

v0.1.0 共 5 种曲线，本节验证非多项式的 4 种：sine / cosine / conic_hyperbola / conic_parabola。

### 3.1 正弦 y = sin(x)

```coords-2d
{
  "id": "showcase-t1-coords",
  "xRange": [-6.28, 6.28],
  "yRange": [-2, 2],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-t1-fp",
  "title": "y = sin(x)",
  "coords": "showcase-t1-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "s1",
      "type": "sine",
      "params": { "amp": 1, "freq": 1, "phase": 0, "offset": 0 },
      "color": "#8b7dd8",
      "width": 2.5
    }
  ],
  "caption": "y = sin(x)，amp=1, freq=1, phase=0, offset=0。最大 1，最小 -1，周期 2π。"
}
```

### 3.2 余弦 y = cos(2x)

```coords-2d
{
  "id": "showcase-t2-coords",
  "xRange": [-6.28, 6.28],
  "yRange": [-1.5, 1.5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-t2-fp",
  "title": "y = cos(2x)",
  "coords": "showcase-t2-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "c1",
      "type": "cosine",
      "params": { "amp": 1, "freq": 2, "phase": 0, "offset": 0 },
      "color": "#4caf85",
      "width": 2.5
    }
  ],
  "caption": "y = cos(2x)，频率 2 → 周期 π。amp=1 区间 [-1, 1]。"
}
```

### 3.3 双曲线 x²/4 - y²/1 = 1

```coords-2d
{
  "id": "showcase-t3-coords",
  "xRange": [-5, 5],
  "yRange": [-3, 3],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "equal"
}
```

```function-plot
{
  "id": "showcase-t3-fp",
  "title": "双曲线 x²/4 - y²/1 = 1",
  "coords": "showcase-t3-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "h1",
      "type": "conic_hyperbola",
      "params": { "a": 2, "b": 1 },
      "color": "#d65a5a",
      "width": 2.5
    }
  ],
  "caption": "a=2, b=1 → 顶点 (±2, 0)，焦点 (±√5, 0) ≈ (±2.24, 0)，渐近线 y = ±(1/2)x。"
}
```

### 3.4 抛物线 y² = 8x

```coords-2d
{
  "id": "showcase-t4-coords",
  "xRange": [-1, 10],
  "yRange": [-5, 5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-t4-fp",
  "title": "抛物线 y² = 8x（焦点 (2, 0)，准线 x = -2）",
  "coords": "showcase-t4-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "p1",
      "type": "conic_parabola",
      "params": { "p": 8, "orientation": "right" },
      "color": "#d99a3a",
      "width": 2.5
    }
  ],
  "caption": "y² = 4px → p=8 → 焦点 (p/4, 0) = (2, 0)，准线 x = -p/4 = -2。**注意**：横向抛物线焦点不在曲线上，焦点是曲线内部的特殊点（焦点-准线定义）。"
}
```

> **orientation 4 方向**（GLM 评审 C0-1 修复）：up/down 画竖向 U/∩、left/right 画横向。`orientation: "right"` 时焦点 `(p/4, 0)`、准线 `x = -p/4`。

---

## 4. slider · 联动 function-plot

`slider` v0.1.2 新增 **form-B 联动 function-plot** —— 拖滑块实时改曲线参数，对应的关键点（焦点/顶点/中心）自动重算。

> 联动规则：slider 值 v ∈ [min, max] 归一化成 t ∈ [0,1]，然后按 `drives[].map` 映射成实际参数值（lerp / linear / 1-value）。`drives[].fnId` + `drives[].param` 决定改哪条曲线的哪个参数。`param` 支持点语法（`coeffs.0` 改数组下标）。

### 4.1 a 控长半轴

```coords-2d
{
  "id": "showcase-ep1-coords",
  "title": "坐标系（等比模式）",
  "xRange": [-5, 5],
  "yRange": [-3.5, 3.5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "equal"
}
```

```function-plot
{
  "id": "showcase-ep1-fp",
  "title": "椭圆 x²/a² + y²/b² = 1（a 拖动，b 固定为 2）",
  "coords": "showcase-ep1-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "e1",
      "type": "conic_ellipse",
      "params": { "a": 3, "b": 2 },
      "color": "#4caf85",
      "width": 2.5
    }
  ]
}
```

```slider
{
  "id": "showcase-ep1-slider-a",
  "label": "长半轴 a",
  "min": 1, "max": 4.5, "step": 0.05, "defaultValue": 3, "unit": "a",
  "linkedFunctionPlot": "showcase-ep1-fp",
  "drives": [
    { "fnId": "e1", "param": "a", "map": "lerp", "min": 1, "max": 4.5 }
  ],
  "caption": "a 拖到 2 时椭圆变成正圆（因为 b 也是 2），焦点缩到圆心。a 拖到 4.5 时椭圆又长又扁。"
}
```

### 4.2 b 控短半轴

```coords-2d
{
  "id": "showcase-ep2-coords",
  "xRange": [-5, 5],
  "yRange": [-3.5, 3.5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "equal"
}
```

```function-plot
{
  "id": "showcase-ep2-fp",
  "title": "椭圆（b 拖动，a 固定为 3）",
  "coords": "showcase-ep2-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "e2",
      "type": "conic_ellipse",
      "params": { "a": 3, "b": 2 },
      "color": "#d99a3a",
      "width": 2.5
    }
  ]
}
```

```slider
{
  "id": "showcase-ep2-slider-b",
  "label": "短半轴 b",
  "min": 0.3, "max": 3, "step": 0.05, "defaultValue": 2, "unit": "b",
  "linkedFunctionPlot": "showcase-ep2-fp",
  "drives": [
    { "fnId": "e2", "param": "b", "map": "lerp", "min": 0.3, "max": 3 }
  ],
  "caption": "b 接近 3 时椭圆接近正圆（a 也是 3），b 接近 0.3 时椭圆压得很扁。"
}
```

### 4.3 a + b 同时联动

```coords-2d
{
  "id": "showcase-ep3-coords",
  "xRange": [-5, 5],
  "yRange": [-3.5, 3.5],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "equal"
}
```

```function-plot
{
  "id": "showcase-ep3-fp",
  "title": "椭圆（a + b 同时联动）",
  "coords": "showcase-ep3-coords",
  "showKeyPoints": true,
  "functions": [
    {
      "id": "e3",
      "type": "conic_ellipse",
      "params": { "a": 3, "b": 2 },
      "color": "#8b7dd8",
      "width": 2.5
    }
  ]
}
```

```slider
{
  "id": "showcase-ep3-slider-ab",
  "label": "a + b 同步（看焦点 c=√(a²-b²) 怎么变）",
  "min": 0, "max": 1, "step": 0.01, "defaultValue": 0.5, "unit": "t",
  "linkedFunctionPlot": "showcase-ep3-fp",
  "drives": [
    { "fnId": "e3", "param": "a", "map": "lerp", "min": 0.5, "max": 4.5 },
    { "fnId": "e3", "param": "b", "map": "lerp", "min": 0.5, "max": 3 }
  ],
  "caption": "一个滑块同时驱动 a 和 b。t=0 时 a=b=0.5（极扁）；t=0.5 时 a=2.5, b=1.75（接近正圆）；t=1 时 a=4.5, b=3（长椭圆）。"
}
```

---

## 5. 二次方程组图像解法（杀手特性）

**为什么是杀手特性**：两条曲线相交的瞬间是数学课最直观的瞬间——交点 = 方程组的解。拖滑块同时看：
- 曲线相交瞬间
- 交点坐标（高亮圆点）
- 判别式 Δ 实时数字 + 状态色（绿/黄/灰）
- 韦达定理联动（x₁+x₂, x₁·x₂）

**教学思路**（联立 `y = x²` 和 `y = k·x + m`）：
- 移项 → `x² - k·x - m = 0`
- 标准形式 `ax² + bx + c = 0`，这里 `a=1, b=-k, c=-m`
- 判别式 `Δ = b² - 4ac = k² + 4m`
- Δ > 0：两个交点 / Δ = 0：相切一个交点 / Δ < 0：无交点

下面用 `slider` 联动 polynomial 的 `coeffs.0` / `coeffs.1` 改参数。

### 5.1 基础：y = x² 与 y = 2x + 3

```coords-2d
{
  "id": "showcase-q1-coords",
  "xRange": [-3, 5],
  "yRange": [-2, 12],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-q1-fp",
  "title": "y = x² 与 y = 2x + 3",
  "coords": "showcase-q1-coords",
  "showKeyPoints": false,
  "functions": [
    {
      "id": "parabola",
      "type": "polynomial",
      "params": { "coeffs": [1, 0, 0] },
      "color": "#8b7dd8",
      "width": 2.5
    },
    {
      "id": "line",
      "type": "polynomial",
      "params": { "coeffs": [2, 3] },
      "color": "#d99a3a",
      "width": 2.5
    }
  ],
  "caption": "联立 x² = 2x + 3 → x² - 2x - 3 = 0 → (x-3)(x+1) = 0 → x = 3 或 x = -1 → 交点 (3, 9) 和 (-1, 1)，Δ = 4 + 12 = 16 > 0。"
}
```

```intersection-marker
{
  "id": "showcase-q1-int",
  "coords": "showcase-q1-coords",
  "polynomialIntersection": {
    "functionPlotId": "showcase-q1-fp",
    "fnId1": "parabola",
    "fnId2": "line",
    "pointColor": "#d65a5a"
  },
  "polynomialDiscriminant": {
    "functionPlotId": "showcase-q1-fp",
    "fnId": "parabola",
    "subtractFnId": "line",
    "showVieta": true
  }
}
```

### 5.2 拖 b 看顶点 + Δ 变化（Δ<0 → Δ=0 → Δ>0 三态演示）

```coords-2d
{
  "id": "showcase-q2-coords",
  "xRange": [-5, 5],
  "yRange": [-2, 6],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-q2-fp",
  "title": "y = x² + b·x + 1（抛物线 + x 轴）",
  "coords": "showcase-q2-coords",
  "showKeyPoints": false,
  "functions": [
    {
      "id": "p2",
      "type": "polynomial",
      "params": { "coeffs": [1, 0, 1] },
      "color": "#4caf85",
      "width": 2.5
    },
    {
      "id": "xaxis",
      "type": "polynomial",
      "params": { "coeffs": [0, 0] },
      "color": "#6b6580",
      "width": 1
    }
  ],
  "caption": "抛物线与 x 轴的交点就是它的零点。b=0 时 Δ = -4 < 0 无交点；b=±2 时 Δ = 0 相切（一个交点，重根）；|b| > 2 时两个交点。"
}
```

```intersection-marker
{
  "id": "showcase-q2-int",
  "coords": "showcase-q2-coords",
  "polynomialIntersection": {
    "functionPlotId": "showcase-q2-fp",
    "fnId1": "p2",
    "fnId2": "xaxis",
    "pointColor": "#d65a5a"
  },
  "polynomialDiscriminant": {
    "functionPlotId": "showcase-q2-fp",
    "fnId": "p2",
    "showVieta": true
  }
}
```

```slider
{
  "id": "showcase-q2-slider-b",
  "label": "b（一次项系数）",
  "min": -3, "max": 3, "step": 0.1, "defaultValue": 0, "unit": "b",
  "linkedFunctionPlot": "showcase-q2-fp",
  "drives": [
    { "fnId": "p2", "param": "coeffs.1", "map": "lerp", "min": -3, "max": 3 }
  ],
  "caption": "拖 b 看 (-b/2, 1 - b²/4) 顶点 + 与 x 轴交点怎么动。b=0 时无交点（灰）；b=±2 时 Δ = 0 切于一点（黄，重根 -1）；|b|>2 时两个交点（绿）。"
}
```

### 5.3 拖 a 看开口宽度 + Δ<0 持续演示

```coords-2d
{
  "id": "showcase-q3-coords",
  "xRange": [-10, 5],
  "yRange": [-2, 12],
  "showGrid": true,
  "showAxes": true,
  "showTicks": true,
  "originAtCenter": true,
  "aspect": "fit"
}
```

```function-plot
{
  "id": "showcase-q3-fp",
  "title": "y = a·x² + 2x + 3（拖 a 看零点怎么变）",
  "coords": "showcase-q3-coords",
  "showKeyPoints": false,
  "functions": [
    {
      "id": "p3",
      "type": "polynomial",
      "params": { "coeffs": [1, 2, 3] },
      "color": "#d65a5a",
      "width": 2.5
    },
    {
      "id": "xaxis3",
      "type": "polynomial",
      "params": { "coeffs": [0, 0] },
      "color": "#6b6580",
      "width": 1
    }
  ],
  "caption": "y = a·x² + 2x + 3 = 0 形式 (b=2, c=3)，Δ = 4 - 12a。"
}
```

```intersection-marker
{
  "id": "showcase-q3-int",
  "coords": "showcase-q3-coords",
  "polynomialIntersection": {
    "functionPlotId": "showcase-q3-fp",
    "fnId1": "p3",
    "fnId2": "xaxis3",
    "pointColor": "#d65a5a"
  },
  "polynomialDiscriminant": {
    "functionPlotId": "showcase-q3-fp",
    "fnId": "p3",
    "showVieta": true
  }
}
```

```slider
{
  "id": "showcase-q3-slider-a",
  "label": "a（首项系数，决定开口宽度和方向）",
  "min": -1, "max": 1.5, "step": 0.05, "defaultValue": 1, "unit": "a",
  "linkedFunctionPlot": "showcase-q3-fp",
  "drives": [
    { "fnId": "p3", "param": "coeffs.0", "map": "lerp", "min": -1, "max": 1.5 }
  ],
  "caption": "a > 0 开口向上，a < 0 开口向下。a=1/3 时 Δ = 0（相切 1 个零点），a < 1/3 时 Δ < 0（无零点），a > 1/3 时两个零点。**点语法 coeffs.0 改数组下标**。"
}
```

---

## 6. 验证清单（GLM 评审 R7 + 端到端复测）

| 项 | 状态 | 验证方法 |
|---|---|---|
| C0-1 抛物线 4x 缩放 | ✅ | code `/p` (不是 `/4p`)，build 注入无 `/(4*p)` 残留 |
| C1-1 重根 | ✅ | `polyRealRoots([1,2,1])→[-1]`，端到端 demo 拖 b=2 看到 Δ=0 黄色"一个交点（相切）" + 602 红像素圆点 |
| C1-2 三次极值 | ✅ | `x³-3x` 极值用二阶导判对（max@-1, min@1） |
| C2-1 抽 util | ✅ | fp/intersection 不再有本地 `function polyRealRoots` 定义，全走 `cwGeom_*` |
| C2-3 diff 三处重复 | ✅ | `computeDiffCoeffs` 抽出 + 右对齐逻辑 + 注释 |
| C3-1/3-3/3-4 | ✅ | 服务端 + 客户端都 `coeffs.slice()`；slider lerp 漏配 `console.warn`；`(pt[0]-0)` 删 |
| 端到端 5.2 拖 b | ✅ | b ∈ {-3, -2, -0.5, 0, 0.5, 2, 3} 7 个值连续拖，Δ 全部计算对（5/0/-3.75/-4/-3.75/0/5） |

GLM 修复总评 + 复盘记录：`docs/glm-review-2d-v0.1.0.md` §9-§12。
