---
title: Stat-Grid 组件测试
subtitle: 数据卡片墙验证
author: 测试
sections:
  - 一、科普数据
  - 二、成绩报告
  - 三、边界情况
---

# Stat-Grid 组件测试

## 一、科普数据

关键数字以大字号冲击呈现。

```stat-grid
{
  "title": "中国基本数据",
  "stats": [
    {"value": "14", "unit": "亿", "label": "人口"},
    {"value": "960", "unit": "万 km²", "label": "国土面积"},
    {"value": "5000", "unit": "年", "label": "文明史"},
    {"value": "56", "label": "个民族"}
  ]
}
```

## 二、成绩报告

带趋势标记的卡片。

```stat-grid
{
  "title": "本次考试统计",
  "stats": [
    {"value": "87", "unit": "%", "label": "及格率", "trend": "↑5%"},
    {"value": "78", "label": "平均分", "trend": "↑3"},
    {"value": "98", "label": "最高分"},
    {"value": "12", "unit": "%", "label": "不及格率", "trend": "↓4%"}
  ]
}
```

带 LaTeX 的数字：

```stat-grid
{
  "stats": [
    {"value": "$\\pi$", "label": "圆周率"},
    {"value": "$e$", "label": "自然常数"},
    {"value": "$\\sqrt{2}$", "label": "毕达哥拉斯常数"}
  ]
}
```

## 三、边界情况

空 stats（应报错）：

```stat-grid
{
  "title": "空测试",
  "stats": []
}
```

单个卡片：

```stat-grid
{
  "stats": [{"value": "42", "label": "生命、宇宙与一切的终极答案"}]
}
```
