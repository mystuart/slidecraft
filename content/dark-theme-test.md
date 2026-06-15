---
title: Dark 主题测试
subtitle: 深色主题视觉验证
author: 测试
theme: dark
sections:
  - 一、基础元素
  - 二、组件可读性
---

# Dark 主题测试

## 一、基础元素

验证深色主题下的基础排版。正文文字应清晰可读，**加粗**、*斜体*、`行内代码` 都应正常。

> 这是一段引用。背景应比正文略亮（surface 色），边框可见。

列表也该清晰：
- 第一项内容
- 第二项 `带代码` 的项
- [带链接的项](https://example.com)

## 二、组件可读性

callout 5 种类型，文字色应在深色底上可读：

```callout
{"type": "tip", "title": "小贴士", "content": "绿色 tip 在深色底上文字应清晰。"}
```

```callout
{"type": "warning", "title": "注意", "content": "琥珀色 warning，深色底文字可读。"}
```

```callout
{"type": "danger", "title": "危险", "content": "红色 danger，深色底文字可读。"}
```

quiz 选择题，按钮态在深色下应清晰：

```quiz
{
  "question": "dark 主题的 bg 色是？",
  "type": "single",
  "options": [
    {"id": "a", "text": "#1a1a24"},
    {"id": "b", "text": "#ffffff"},
    {"id": "c", "text": "#1e1b2e"}
  ],
  "correct": ["a"]
}
```

concept-card 网格在深色下卡片底应区分于正文：

```concept-card
{
  "cards": [
    {"icon": "🌙", "title": "深色护眼", "description": "长时间阅读不刺眼"},
    {"icon": "⚡", "title": "低功耗", "description": "OLED 屏幕省电"},
    {"icon": "🎨", "title": "对比度", "description": "代码块仍清晰可辨"}
  ]
}
```
