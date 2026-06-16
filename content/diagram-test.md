---
title: Diagram 组件测试
subtitle: 流程图/关系图验证
author: 测试
sections:
  - 一、决策流程
  - 二、系统架构
  - 三、边界情况
---

# Diagram 组件测试

## 一、决策流程

经典的"分数≥60?"决策树。

```diagram
{
  "title": "及格判定流程",
  "width": 500,
  "height": 320,
  "nodes": [
    {"id": "start", "label": "开始", "x": 250, "y": 40, "kind": "start"},
    {"id": "check", "label": "分数≥60?", "x": 250, "y": 140, "shape": "diamond", "kind": "decision"},
    {"id": "pass", "label": "及格", "x": 120, "y": 250, "kind": "process"},
    {"id": "fail", "label": "补考", "x": 380, "y": 250, "kind": "end"}
  ],
  "edges": [
    {"from": "start", "to": "check"},
    {"from": "check", "to": "pass", "label": "是"},
    {"from": "check", "to": "fail", "label": "否"}
  ]
}
```

## 二、系统架构

Web 请求流程。

```diagram
{
  "title": "Web 请求流程",
  "width": 600,
  "height": 260,
  "nodes": [
    {"id": "client", "label": "浏览器", "x": 80, "y": 130, "kind": "data"},
    {"id": "api", "label": "API 网关", "x": 240, "y": 130, "kind": "process"},
    {"id": "db", "label": "数据库", "x": 440, "y": 60, "kind": "data"},
    {"id": "cache", "label": "缓存", "x": 440, "y": 200, "kind": "data"}
  ],
  "edges": [
    {"from": "client", "to": "api", "label": "请求"},
    {"from": "api", "to": "db"},
    {"from": "api", "to": "cache"},
    {"from": "db", "to": "api"},
    {"from": "cache", "to": "api"}
  ]
}
```

矩形节点（rect 形状）：

```diagram
{
  "nodes": [
    {"id": "a", "label": "输入", "x": 100, "y": 80, "shape": "rect"},
    {"id": "b", "label": "处理", "x": 300, "y": 80, "shape": "rect"},
    {"id": "c", "label": "输出", "x": 500, "y": 80, "shape": "rect"}
  ],
  "edges": [{"from": "a", "to": "b"}, {"from": "b", "to": "c"}]
}
```

## 三、边界情况

空 nodes（应报错）：

```diagram
{
  "title": "空图",
  "nodes": []
}
```

只有节点、无边：

```diagram
{
  "nodes": [
    {"id": "x", "label": "孤立节点", "x": 100, "y": 80}
  ]
}
```
