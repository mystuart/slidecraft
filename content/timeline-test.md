---
title: Timeline 组件测试
subtitle: 时间线组件（v0.1.0）渲染验证
author: 测试
sections:
  - 一、vertical 模式（历史）
  - 二、horizontal 模式（流程）
  - 三、边界情况
---

# Timeline 组件测试

## 一、vertical 模式（历史）

讲计算机发展史，最经典的垂直时间线场景。

```timeline
{
  "title": "计算机发展简史",
  "mode": "vertical",
  "items": [
    {"time": "1946", "title": "ENIAC 诞生", "description": "第一台通用电子计算机，重 30 吨，用 18000 个真空管。"},
    {"time": "1971", "title": "Intel 4004", "description": "第一款商用微处理器，开启个人计算机时代。", "tag": "里程碑"},
    {"time": "2007", "title": "iPhone 发布", "description": "智能手机普及，移动计算成为主流。"},
    {"time": "2022", "title": "ChatGPT 发布", "description": "大语言模型进入大众视野，AI 普及加速。", "tag": "里程碑"}
  ]
}
```

带 LaTeX 公式和行内标记的节点：

```timeline
{
  "mode": "vertical",
  "items": [
    {"time": "步骤 1", "title": "建立坐标系", "description": "设 $B$ 为原点，$BA$ 为 $+Y$ 轴方向。"},
    {"time": "步骤 2", "title": "求**关键点**", "description": "代入 $y = x^2 + 2x + 1$ 求极值。"}
  ]
}
```

## 二、horizontal 模式（流程）

横向时间线，适合流程步骤（移动端可横滑）。

```timeline
{
  "title": "软件开发流程",
  "mode": "horizontal",
  "items": [
    {"time": "① 需求", "title": "分析", "description": "明确做什么、为谁做。"},
    {"time": "② 设计", "title": "架构", "description": "技术选型 + 模块划分。"},
    {"time": "③ 开发", "title": "编码", "description": "实现功能 + 写测试。"},
    {"time": "④ 测试", "title": "验收", "description": "功能 / 性能 / 兼容性。"},
    {"time": "⑤ 发布", "title": "上线", "description": "部署 + 监控。", "tag": "交付"}
  ]
}
```

## 三、边界情况

只有标题、没有描述的节点：

```timeline
{
  "items": [
    {"time": "2020", "title": "事件 A"},
    {"time": "2021", "title": "事件 B"},
    {"time": "2022", "title": "事件 C"}
  ]
}
```

空 items（应显示错误提示）：

```timeline
{
  "title": "空时间线",
  "items": []
}
```
