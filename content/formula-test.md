---
title: 公式组件测试
subtitle: formula component playground
author: Test Suite
theme: lavender
sections:
  - id: 1
    title: 基础数学
  - id: 2
    title: 经典公式
  - id: 3
    title: 化学方程式
  - id: 4
    title: 错误处理
---

```hero
{
  "title": "公式组件测试",
  "subtitle": "formula component playground",
  "emoji": "🧪",
  "visual": { "value": "🧪", "rotated": -8 }
}
```

## 基础数学

```formula
{
  "expr": "x^2 + y^2 = r^2",
  "display": true,
  "caption": "勾股定理（圆的标准方程）"
}
```

```formula
{
  "expr": "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "display": true,
  "caption": "一元二次方程求根公式"
}
```

行内公式示例：勾股 $a^2 + b^2 = c^2$ 是初中最常见的几何关系之一，欧拉恒等式 $e^{i\pi} + 1 = 0$ 被誉为最美的数学公式。

行内公式不应处理代码块里的美元号：变量名 `$foo_bar$`、命令 `npm install --save $pkg`、shell `$HOME` 这些保持原样。

行内公式会保护 `<code>` 标签：单引号内 `$a^2 + b^2 = c^2$` 不会渲染成公式。

## 经典公式

```formula
{
  "expr": "E = mc^2",
  "display": true,
  "caption": "爱因斯坦质能方程"
}
```

```formula
{
  "expr": "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
  "display": true,
  "caption": "高斯积分"
}
```

## 化学方程式

```formula
{
  "expr": "2H_2 + O_2 \\rightarrow 2H_2O",
  "display": true,
  "caption": "氢气燃烧（不启用 mhchem 时的纯 LaTeX 写法）"
}
```

## 错误处理

```formula
{
  "expr": "\\frac{1 +",
  "display": true,
  "caption": "故意写错的公式（缺右括号）"
}
```

```formula
{
  "expr": ""
}
```