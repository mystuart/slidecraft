---
title: Math-step 公式测试
description: 验证分步解题组件的所有字段：公式、提示、解析、警告、洞察
theme: lavender
author: Alice
sections:
  - 1、一元二次方程求根
  - 2、不等式 3x + 1 > 7
  - 3、几何：长方形的面积
  - 4、字符串包含"负的 b"（JSON 转义踩坑）
---

```hero
{
  "title": "Math-step 公式测试",
  "subtitle": "验证分步解题组件的所有字段：公式、提示、解析、警告、洞察",
  "emoji": "📐",
  "visual": { "value": "📐", "rotated": -8 }
}
```

## 1、一元二次方程求根

解方程 $x^2 - 5x + 6 = 0$。

```math-step
{
  "question": "解方程",
  "questionFormula": "x^2 - 5x + 6 = 0",
  "steps": [
    {
      "title": "第一步：识别方程类型",
      "content": "这是一个**标准的一元二次方程**，形如 $ax^2 + bx + c = 0$。\\n\\n对比标准式，得出：$a=1$, $b=-5$, $c=6$。",
      "hint": "如果方程里 $a=0$，那就是一元一次方程，不是本题的类型。",
      "answer": "a=1, b=-5, c=6"
    },
    {
      "title": "第二步：计算判别式",
      "content": "判别式决定方程有几个实数解。先算 $b^2 - 4ac$：",
      "formula": "\\Delta = b^2 - 4ac = (-5)^2 - 4 \\times 1 \\times 6 = 25 - 24 = 1",
      "hint": "判别式 > 0：两个不同实数根；= 0：一个重根；< 0：无实数根。",
      "answer": "Δ = 1"
    },
    {
      "title": "第三步：代入求根公式",
      "content": "用求根公式：",
      "formula": "x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{5 \\pm \\sqrt{1}}{2} = \\frac{5 \\pm 1}{2}",
      "insight": "求根公式是中学代数里**最重要**的公式之一，必须背熟。",
      "answer": "x = (5 ± 1) / 2"
    },
    {
      "title": "第四步：计算两个根",
      "content": "分两种情况：\\n\\n- $x_1 = (5+1)/2 = 3$\\n- $x_2 = (5-1)/2 = 2$",
      "warning": "注意**正负号**！很多同学在 $-b$ 那一步会漏掉负号。",
      "answer": "x₁ = 3, x₂ = 2"
    },
    {
      "title": "第五步：验证",
      "content": "代回原方程验证：\\n- $3^2 - 5 \\times 3 + 6 = 9 - 15 + 6 = 0$ ✓\\n- $2^2 - 5 \\times 2 + 6 = 4 - 10 + 6 = 0$ ✓",
      "explanation": "这是个好习惯——做完代数题代入验证，能避免**符号错误**和**计算粗心**。",
      "answer": "两个根都正确"
    }
  ]
}
```

## 2、鸡兔同笼

笼子里有头 35 个，脚 94 只，问鸡兔各几只？

```math-step
{
  "question": "笼子里有头 35 个，脚 94 只，鸡兔各几只？",
  "steps": [
    {
      "title": "第一步：设未知数",
      "content": "设鸡有 $x$ 只，兔有 $y$ 只。\\n\\n题目给了两个关系：\\n- 头共 35 个 → $x + y = 35$\\n- 脚共 94 只 → 鸡 2 脚 + 兔 4 脚 → $2x + 4y = 94$",
      "hint": "这类题的通用思路：先**列方程组**，再**消元**求解。",
      "answer": "x + y = 35, 2x + 4y = 94"
    },
    {
      "title": "第二步：化简第二个方程",
      "content": "$2x + 4y = 94$ 两边除以 2：",
      "formula": "x + 2y = 47",
      "insight": "化简后系数更小，计算更不容易出错。",
      "answer": "x + 2y = 47"
    },
    {
      "title": "第三步：消元求 y",
      "content": "用第二个方程减第一个方程：\\n\\n$(x + 2y) - (x + y) = 47 - 35$ → $y = 12$",
      "warning": "消元时**符号要变号**！比如 $2y - y = y$，$47 - 35 = 12$。",
      "answer": "y = 12（兔 12 只）"
    },
    {
      "title": "第四步：代入求 x",
      "content": "$x = 35 - y = 35 - 12 = 23$",
      "explanation": "答：**鸡 23 只，兔 12 只**。验证：$23 + 12 = 35$ 头 ✓，$23 \\times 2 + 12 \\times 4 = 46 + 48 = 94$ 脚 ✓。",
      "answer": "x = 23（鸡 23 只）"
    }
  ]
}
```

## 3、二次函数求顶点

求 $y = 2x^2 - 4x + 1$ 的顶点坐标。

```math-step
{
  "question": "求二次函数",
  "questionFormula": "y = 2x^2 - 4x + 1",
  "steps": [
    {
      "title": "第一步：识别 a, b, c",
      "content": "对照 $y = ax^2 + bx + c$：\\n- $a = 2$（决定开口方向和大小）\\n- $b = -4$\\n- $c = 1$（y 轴截距）",
      "insight": "$a \\gt 0$ 开口向上，$a \\lt 0$ 开口向下。本题 $a = 2 \\gt 0$，所以抛物线开口**向上**，顶点是**最小值**点。",
      "answer": "a=2, b=-4, c=1"
    },
    {
      "title": "第二步：用顶点公式求横坐标",
      "content": "顶点横坐标公式：",
      "formula": "x_0 = -\\frac{b}{2a} = -\\frac{-4}{2 \\times 2} = \\frac{4}{4} = 1",
      "warning": "**负号最容易丢**。$-b$ 永远要算成「负的 b」，不是「减去 b」。",
      "answer": "x₀ = 1"
    },
    {
      "title": "第三步：代入求纵坐标",
      "content": "把 $x_0 = 1$ 代回原函数：",
      "formula": "y_0 = 2 \\times 1^2 - 4 \\times 1 + 1 = 2 - 4 + 1 = -1",
      "hint": "也可以用更快的公式 $y_0 = c - \\frac{b^2}{4a}$，但代入法更直观不易错。",
      "answer": "y₀ = -1"
    },
    {
      "title": "第四步：写出顶点",
      "content": "顶点坐标为 $(1, -1)$。",
      "explanation": "因为 $a \\gt 0$，抛物线开口向上，所以顶点 $(1, -1)$ 是函数的**最小值点**，$y_{min} = -1$。",
      "answer": "(1, -1)"
    },
    {
      "title": "第五步：扩展理解（选学）",
      "content": "把原式配方验证：\\n\\n$y = 2x^2 - 4x + 1 = 2(x^2 - 2x) + 1 = 2(x-1)^2 - 2 + 1 = 2(x-1)^2 - 1$",
      "formula": "y = 2(x - 1)^2 - 1",
      "insight": "配方后的**顶点式** $y = a(x-h)^2 + k$ 里，$(h, k)$ 就是顶点。本题 $(1, -1)$ ✓。",
      "answer": "配方后顶点式: y = 2(x-1)² - 1"
    }
  ]
}
```

## 三题总结

| 例题 | 公式数 | 折叠区类型 |
|---|---|---|
| 一元二次方程 | 2 个 | hint + insight + warning + explanation |
| 鸡兔同笼 | 1 个 | hint + insight + warning + explanation |
| 二次函数 | 4 个 | insight + warning + hint + explanation |

三道题覆盖了 math-step 组件的全部字段类型——块级公式、4 种折叠区（hint/explanation/warning/insight）、完成勾选、进度条。
