---
title: Code-Runner 组件测试
subtitle: 代码+输出对照验证
author: 测试
sections:
  - 一、Python 示例
  - 二、带注释的示例
  - 三、边界情况
---

# Code-Runner 组件测试

## 一、Python 示例

代码 + 折叠的运行结果（点击展开）。

```code-runner
{
  "title": "列表推导式",
  "lang": "python",
  "code": "squares = [x**2 for x in range(5)]\nprint(squares)",
  "output": "[0, 1, 4, 9, 16]"
}
```

## 二、带注释的示例

输出下方加注释说明。

```code-runner
{
  "title": "递归阶乘",
  "lang": "python",
  "code": "def fact(n):\n    return 1 if n <= 1 else n * fact(n-1)\n\nprint(fact(5))\nprint(fact(10))",
  "output": "120\n3628800",
  "note": "注意 `fact(10)` 已经接近递归深度极限，更大数建议用 `math.factorial`。"
}
```

JavaScript 示例：

```code-runner
{
  "title": "数组求和",
  "lang": "javascript",
  "code": "const nums = [1, 2, 3, 4, 5];\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log(sum);",
  "output": "15"
}
```

## 三、边界情况

空 code（应报错）：

```code-runner
{
  "title": "空代码",
  "output": "nothing"
}
```

只有代码、无输出（不显示运行结果按钮）：

```code-runner
{
  "lang": "python",
  "code": "# 这段代码没有输出展示\nx = 42"
}
```

只有代码 + 语言标记，无标题：

```code-runner
{
  "lang": "go",
  "code": "fmt.Println(\"Hello, World!\")",
  "output": "Hello, World!"
}
```
