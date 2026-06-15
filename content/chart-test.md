---
title: Chart 组件测试
subtitle: 数据图表组件（v0.1.0）柱/折/饼渲染验证
author: 测试
sections:
  - 一、柱状图
  - 二、折线图
  - 三、饼图
  - 四、边界情况
---

# Chart 组件测试

## 一、柱状图

最常见的数据对比场景。带单位、y 轴标签、长标签旋转。

```chart
{
  "type": "bar",
  "title": "2024 年浏览器市场份额（百万用户）",
  "unit": "M",
  "yAxisLabel": "用户数",
  "data": [
    {"label": "Chrome", "value": 3200},
    {"label": "Safari", "value": 1100},
    {"label": "Edge", "value": 210},
    {"label": "Firefox", "value": 170},
    {"label": "Samsung Internet", "value": 140}
  ]
}
```

## 二、折线图

趋势展示。

```chart
{
  "type": "line",
  "title": "某产品月度销量趋势",
  "unit": " 件",
  "data": [
    {"label": "1月", "value": 120},
    {"label": "2月", "value": 145},
    {"label": "3月", "value": 132},
    {"label": "4月", "value": 178},
    {"label": "5月", "value": 195},
    {"label": "6月", "value": 240}
  ]
}
```

## 三、饼图

占比展示。左图右图例。

```chart
{
  "type": "pie",
  "title": "编程语言使用占比",
  "data": [
    {"label": "JavaScript", "value": 65},
    {"label": "Python", "value": 51},
    {"label": "TypeScript", "value": 38},
    {"label": "Java", "value": 30},
    {"label": "其他", "value": 25}
  ]
}
```

## 四、边界情况

只有一项的饼图（画整圆）：

```chart
{
  "type": "pie",
  "data": [{"label": "唯一项", "value": 100}]
}
```

空数据（应显示错误提示）：

```chart
{
  "type": "bar",
  "title": "空数据测试",
  "data": []
}
```

不支持的 type（应回退到 bar）：

```chart
{
  "type": "scatter",
  "data": [{"label": "A", "value": 10}, {"label": "B", "value": 20}]
}
```
