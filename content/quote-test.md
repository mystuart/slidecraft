---
title: Quote 组件测试
subtitle: 金句/引用验证
author: 测试
sections:
  - 一、名人名言
  - 二、带出处的引用
  - 三、边界情况
---

# Quote 组件测试

## 一、名人名言

居中（默认）。

```quote
{
  "text": "想象力比知识更重要，因为知识是有限的，而想象力概括着世界。",
  "author": "爱因斯坦"
}
```

带身份头衔：

```quote
{
  "text": "如果一个想法第一眼看上去并不荒谬，那它就毫无希望。",
  "author": "爱因斯坦",
  "role": "物理学家"
}
```

## 二、带出处的引用

左对齐 + 文献引用风格。

```quote
{
  "text": "软件就像性：免费的总是更好。",
  "author": "Linus Torvalds",
  "role": "Linux 之父",
  "align": "left"
}
```

带 LaTeX 的金句：

```quote
{
  "text": "上帝不掷骰子。但 $\\psi(x,t) = A e^{i(kx-\\omega t)}$ 告诉我们，他可能真的在掷。",
  "author": "量子力学的悖论"
}
```

## 三、边界情况

空 text（应报错）：

```quote
{
  "author": "无名氏"
}
```

只有 text、无作者：

```quote
{
  "text": "能被理解的需求，就不是真正的需求。"
}
```
