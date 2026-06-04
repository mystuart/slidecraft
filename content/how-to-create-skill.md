---
title: 如何创作 SKILL
subtitle: 从零开始，写出可复用的 AI 技能
author: Alice
theme: lavender
sections:
  - 开篇：什么是 SKILL
  - SKILL 的结构解剖
  - 写一个 SKILL 的 5 个步骤
  - 常见陷阱与最佳实践
  - 动手实践：写你的第一个 SKILL
  - 收尾与下一步
---

```hero
{
  "title": "如何创作 SKILL",
  "subtitle": "从零开始，写出可复用的 AI 技能",
  "emoji": "📘",
  "cta": "开始学习"
}
```

## 什么是 SKILL？

SKILL 是 AI 助手可以加载的「能力包」——一个被触发的提示词模板。

当你说"帮我把这段会议录音整理成纪要"时，AI 加载的是「会议纪要 SKILL」；当你说"翻译这段文字"时，加载的是「翻译 SKILL」。每个 SKILL 就像一个专业工具——用得越多，AI 越懂你在说什么。

```callout
{
  "type": "info",
  "title": "本课学完后你能做什么",
  "content": "看懂一个 SKILL 的结构、写出你自己的第一个 SKILL、判断一个 SKILL 写得好不好、把它迭代得更好用。"
}
```

### 为什么值得学 SKILL？

- **省时间**：把反复说的"请这样回复"沉淀成 SKILL，AI 自动调用
- **保证一致性**：团队成员都能用同一套 SKILL，输出风格统一
- **可复用**：写一次，长期受益，不像临时提问"用过就忘"
- **门槛低**：不需要编程，核心是写好一段提示词

---

## SKILL 的结构解剖

在拆解一个 SKILL 之前，先明确一个最基本但容易被忽略的事实：**一个 SKILL 本质上是一个文件夹，不是单个文件**。

这个文件夹有自己的名字（决定它的唯一标识），里面装着提示词主文件（固定叫 `SKILL.md`，首字母大写），还可以放示例、辅助脚本、配置文件等其他资源。

理解这一点是后面讨论"命名约定"和"结构"的基础——讨论"SKILL 的名字"时，我们说的是**文件夹**的名字；讨论"SKILL 的内容"时，我们说的是**文件夹里 `SKILL.md` 文件**的内容。

先看一个真实可用的 SKILL 长什么样：

```markdown
# meeting-notes（会议纪要 SKILL）

## 触发场景
当用户需要整理会议内容时调用。

## 触发关键词
- "会议纪要 / 会议记录 / 整理录音 / 总结会议"
- "把这次开会的内容整理成文档"

## 工作流程
1. 接收原始会议内容（录音转写 / 聊天记录 / 手写笔记）
2. 识别参会人员和讨论主题
3. 按时间线或主题归类讨论要点
4. 提取决议事项和待办（标注负责人和截止时间）
5. 输出结构化纪要

## 输出格式
使用以下模板：
- 会议主题
- 时间 / 地点 / 参会人
- 讨论要点（分主题）
- 决议事项
- 待办清单（谁、做什么、什么时候）
```

```callout
{
  "type": "note",
  "title": "关于格式",
  "content": "上面展示的是「人类可读版」——为了让你一眼看懂结构。实际 SKILL 里的主文件（`SKILL.md`）通常是 markdown + 特定字段的混合体，下面会介绍。"
}
```

### SKILL 的核心三要素

```concept-card
{
  "id": "cc-elements",
  "title": "SKILL 的核心三要素",
  "columns": 3,
  "cards": [
    { "icon": "🎯", "title": "name", "desc": "SKILL 的名字，简洁、能描述功能。比如 meeting-notes、translator、code-reviewer。" },
    { "icon": "📝", "title": "description", "desc": "详细说明这个 SKILL 做什么、何时触发。这是 AI 决定是否加载它的关键。" },
    { "icon": "💡", "title": "body", "desc": "实际执行的提示词内容——具体的工作流程、输出格式、注意事项。" }
  ]
}
```

### 可选：扩展子目录

```callout
{
  "type": "info",
  "title": "SKILL 不只是 SKILL.md",
  "content": "除了主文件 `SKILL.md`，SKILL 文件夹里还可以放：\n\n- `references/` — 参考文档（详细 API、规范、领域知识），需要时按需加载\n- `templates/` — 输出模板（周报、邮件、报告的标准格式）\n- `scripts/` — 自动化脚本（让 SKILL 真的能执行代码，不只是生成文本）\n\n**渐进式披露原则**：核心三要素（name + description）始终在 AI 的 context 里（要小、要精），body 在 SKILL 加载后进入 context，references 和 scripts 按需调用。这就是为什么 SKILL 主文件要控制在合理长度——太长了会撑爆 context。"
}
```

### 小试牛刀

```quiz
{
  "id": "q1",
  "question": "SKILL 最核心的三个部分是什么？",
  "type": "single",
  "options": [
    { "id": "a", "text": "name / description / body" },
    { "id": "b", "text": "title / content / footer" },
    { "id": "c", "text": "input / process / output" },
    { "id": "d", "text": "start / middle / end" }
  ],
  "correct": ["a"],
  "feedback": {
    "correct": "对了！name（名字）、description（描述）、body（提示词正文）是 SKILL 的三要素。",
    "wrong": "提示：想想一个 SKILL 加载后 AI 怎么知道它要做什么、什么时候该用它。"
  },
  "hint": "其中一部分是「身份」，一部分是「自我介绍」，一部分是「工作内容」。"
}
```

```fill-blank
{
  "id": "f1",
  "question": "一个 SKILL 本身是一个文件夹，文件夹通常采用 ____ 风格命名（小写、单词用连字符分隔）。",
  "hint": "注意：文件夹里的提示词主文件固定叫 SKILL.md（不是 kebab-case），不要混。",
  "answer": "kebab-case|小写连字符"
}
```

```callout
{
  "type": "tip",
  "title": "命名建议",
  "content": "用动词或功能描述命名（如 code-reviewer、meeting-notes、weekly-report），避免用中文或驼峰式（如 CodeReviewer、MeetingNotes）。"
}
```

---

## 写一个 SKILL 的 5 个步骤

```step-guide
{
  "id": "s1",
  "title": "创建一个 SKILL 的 5 个步骤",
  "steps": [
    {
      "title": "明确触发场景",
      "content": "用一句话回答：用户在什么情况下会需要这个 SKILL？越具体越好。",
      "example": "用户说'帮我整理这次会议的内容' → 触发 meeting-notes SKILL"
    },
    {
      "title": "列出触发关键词",
      "content": "写下用户可能说的 3-5 种表达。这些关键词会决定 AI 在什么情况下加载这个 SKILL。",
      "example": "'会议纪要 / 会议记录 / 整理录音 / 总结会议 / 把开会内容整理一下'"
    },
    {
      "title": "写出 description",
      "content": "用 2-3 句话描述 SKILL 做什么、什么时候用、产出什么。description 越精准，触发越准确。",
      "example": "'当用户需要将会议内容（录音、笔记、聊天记录）整理成结构化纪要时调用。输出包含参会人、讨论要点、决议事项、待办清单。'"
    },
    {
      "title": "设计 body",
      "content": "写实际的工作流程：接收什么输入、经过什么步骤、输出什么格式。可以加示例、边界情况、注意事项。",
      "example": "工作流程：1) 识别输入形式 2) 提取参会人 3) 按主题归类 4) 输出 markdown 模板"
    },
    {
      "title": "测试和迭代",
      "content": "用真实场景试几次，看 AI 是否正确触发、输出是否满意。触发不准确就调关键词，输出不满意就改 body。",
      "example": "试着说'帮我把今天组会的录音整理一下'，看 AI 是否加载了 meeting-notes SKILL 并给出预期格式。"
    }
  ]
}
```

### 每一步的关键细节

#### 步骤 1 关键：场景要具体

```callout
{
  "type": "warning",
  "title": "避免模糊的场景描述",
  "content": "❌ '用户需要帮助时'\n✅ '当用户需要把会议内容整理成结构化纪要时'\n\n场景越具体，触发越准确。"
}
```

#### 步骤 2 关键：用用户的原话

```callout
{
  "type": "tip",
  "title": "触发词尽量用用户原话",
  "content": "用户不会说'触发会议纪要 SKILL'，他们会说'帮我把会议内容整理一下'。把用户可能说的口语化表达都列出来。"
}
```

#### 步骤 3 关键：description 是给 AI 看的

```callout
{
  "type": "info",
  "title": "description 写给谁看？",
  "content": "不是写给你自己看，是写给 AI 看——它根据 description 决定是否加载这个 SKILL。所以要清晰说明：做什么 + 什么时候用 + 产出什么。"
}
```

```callout
{
  "type": "tip",
  "title": "Pushy 公式：写一个会主动抢活的 description",
  "content": "description 是 SKILL 唯一被看到的字段——AI 靠它判断什么时候该加载。一个好的 description 要 **pushy**（主动抢活），不是 polite（礼貌等召唤）。\n\n**公式**：技能名称 + 做什么 + 在什么情况下用（**即使用户没明确要求也要用**）\n\n**对比**：\n\n❌ 「会议记录助手。帮用户整理会议内容。」——太礼貌，AI 不会主动调用\n\n✅ 「**主动**用：用户提及会议、讨论、决策、跟进事项时，**立即**整理为结构化纪要（含参会人、要点、决议、待办）。」——pushy，明确主动触发"
}
```

#### 步骤 4 关键：body 要可执行

```callout
{
  "type": "tip",
  "title": "body 写得越具体，输出越稳定",
  "content": "与其说'整理会议内容'，不如列出具体步骤：'1) 列出参会人 2) 按主题归类讨论 3) 提取决议和待办 4) 用 markdown 模板输出'。"
}
```

#### 步骤 5 关键：用真实数据测试

```callout
{
  "type": "warning",
  "title": "不要用想象的场景测试",
  "content": "用你最近一次真实的会议内容试——只有真实数据才能暴露问题（格式、长度、风格）。"
}
```

### 自我检验

```quiz
{
  "id": "q2",
  "question": "下列哪个是「好的」触发关键词？",
  "type": "single",
  "options": [
    { "id": "a", "text": "\"在某些情况下使用\"" },
    { "id": "b", "text": "\"当用户说'会议纪要 / 整理录音 / 会议总结'时触发\"" },
    { "id": "c", "text": "\"通用工具\"" },
    { "id": "d", "text": "\"AI 觉得需要时\"" }
  ],
  "correct": ["b"],
  "feedback": {
    "correct": "对！触发词要具体、用用户原话、列出多种表达。",
    "wrong": "提示：触发词是给 AI 看的信号，要让它一眼知道什么时候该加载这个 SKILL。"
  }
}
```

```fill-blank
{
  "id": "f2",
  "question": "写 SKILL 时，description 主要是给 ____ 看的。",
  "hint": "description 决定了它什么时候被加载。",
  "answer": "AI"
}
```

---

## 常见陷阱与最佳实践

```compare
{
  "id": "c1",
  "title": "好的 SKILL vs 不好的 SKILL",
  "left": {
    "label": "不好的 SKILL",
    "tag": "bad",
    "points": [
      "触发词模糊：「在某些情况下使用」",
      "description 笼统：「帮助用户处理事情」",
      "body 没有流程：直接说「整理内容」",
      "输出格式没说清楚：靠 AI 自己理解",
      "没有示例：用户不知道会得到什么"
    ]
  },
  "right": {
    "label": "好的 SKILL",
    "tag": "good",
    "points": [
      "触发词具体：「当用户说'会议纪要/整理录音/会议总结'时触发」",
      "description 清晰：「当用户需要将会议内容整理成结构化纪要时调用。输出包含参会人、讨论要点、决议事项、待办清单。」",
      "body 列出步骤：1) 识别输入 2) 提取要素 3) 归类整理 4) 输出模板",
      "输出格式明确：用 markdown 模板，列出必填字段",
      "有 1-2 个示例：展示典型输入和输出"
    ]
  }
}
```

### 高频错误 TOP 5

```callout
{
  "type": "danger",
  "title": "错误 1：触发词写得太抽象",
  "content": "「当用户需要帮助时」——AI 无法判断什么时候该用。改成具体的关键词和场景。"
}
```

```callout
{
  "type": "danger",
  "title": "错误 2：body 只有一句笼统的话",
  "content": "「请整理一下内容」——AI 不知道按什么步骤做。列出明确的流程步骤。"
}
```

```callout
{
  "type": "danger",
  "title": "错误 3：没指定输出格式",
  "content": "「输出纪要」——AI 给你一段散文。指定 markdown 模板或结构化字段。"
}
```

```callout
{
  "type": "danger",
  "title": "错误 4：想用一个 SKILL 覆盖所有场景",
  "content": "「万能助手」——结果什么都不精。一个 SKILL 只做一件事，做透。"
}
```

```callout
{
  "type": "danger",
  "title": "错误 5：写完不测试",
  "content": "凭想象写完就发布——用真实数据跑几次才会发现触发不准、格式不对、边界情况没覆盖。"
}
```

### 进阶 bad smell：好 SKILL 也可能藏的暗病

```callout
{
  "type": "warning",
  "title": "这些 SKILL 表面能用，实际有暗病",
  "content": "1. **description < 100 词** — 触发不准，AI 不知道边界在哪\n2. **SKILL.md > 500 行没 fallback** — 撑爆 context，应该拆出 references/\n3. **没 example** — 学员看了不知道会得到什么\n4. **没版本号** — 迭代后无法回滚\n5. **没「完成标准」** — AI 不知道什么时候算做完了"
}
```

### 测一测你的判断力

```quiz
{
  "id": "q3",
  "question": "下面哪个 description 写得最好？",
  "type": "single",
  "options": [
    { "id": "a", "text": "\"帮用户处理事情\"" },
    { "id": "b", "text": "\"AI 助手\"" },
    { "id": "c", "text": "\"当用户需要将会议内容（录音、笔记、聊天记录）整理成结构化纪要时调用。输出包含参会人、讨论要点、决议事项、待办清单。\"" },
    { "id": "d", "text": "\"有用的工具\"" }
  ],
  "correct": ["c"],
  "feedback": {
    "correct": "完美！好的 description 要包含：触发场景 + 输入是什么 + 输出包含什么。",
    "wrong": "提示：description 要让 AI 一眼知道「什么时候用 + 做什么 + 产出什么」。"
  }
}
```

---

## 动手实践：写你的第一个 SKILL

```step-guide
{
  "id": "s2",
  "title": "跟着做一个最小可用的 SKILL",
  "steps": [
    {
      "title": "选一个你日常会用的小任务",
      "content": "回想你最近一周重复做的事：写周报？整理会议？翻译文档？回复客户邮件？选一个高频但模式化的事。",
      "example": "我选'周报'——每周五要把本周做的事、下周计划、遇到的问题整理成周报。"
    },
    {
      "title": "用一句话写下触发场景",
      "content": "用户会在什么情况下需要这个 SKILL？",
      "example": "当用户说'帮我写周报 / 总结这周 / 周五总结'时触发。"
    },
    {
      "title": "列出 3-5 个触发关键词",
      "content": "写下用户可能的口语化表达。",
      "example": "「写周报 / 周报 / 总结这周 / 周五总结 / weekly report」"
    },
    {
      "title": "写下 description（2-3 句）",
      "content": "说明：什么时候用 + 做什么 + 产出什么。",
      "example": "「当用户需要整理本周工作内容、形成结构化周报时调用。输入是用户口述或列出的本周工作要点，输出是按统一模板组织的周报文档。」"
    },
    {
      "title": "写出 body 的工作流程",
      "content": "至少 3-4 个步骤，说明怎么从输入到输出。",
      "example": "工作流程：\n1) 引导用户列出本周完成的事\n2) 引导用户列出下周计划\n3) 引导用户列出遇到的问题和需要的支持\n4) 按模板输出周报（用 markdown 标题分级）"
    },
    {
      "title": "指定输出格式（用模板）",
      "content": "给一个明确的输出模板，AI 才知道怎么排版。",
      "example": "# 周报（YYYY-MM-DD）\n\n## 本周完成\n- ...\n\n## 下周计划\n- ...\n\n## 问题与支持\n- ..."
    },
    {
      "title": "用真实数据测试一次",
      "content": "真的用一次——把本周的工作发过去，看 AI 是否正确加载 SKILL、输出是否符合模板。",
      "example": "试试说：「这周做了三件事：1. 上线了新功能 2. 修复了 5 个 bug 3. 完成了季度评审。帮我整理成周报。」"
    },
    {
      "title": "根据测试结果迭代",
      "content": "触发不准确就改关键词，输出格式不对就调模板，工作流程跑不通就细化 body。SKILL 是迭代出来的，不是写一次就完美。",
      "example": "测试发现 AI 没有加载 SKILL——把触发词从'周报'改成'周报 / 总结本周 / 写周报'多个表达。"
    }
  ]
}
```

### SKILL.md 模板（可直接复制使用）

```callout
{
  "type": "info",
  "title": "复制下面的模板开始写你的 SKILL",
  "content": "把 [xxx] 替换成你的具体内容，删掉所有方括号占位符。"
}
```

```markdown
---
name: [你的 SKILL 名字，用小写连字符]
description: [2-3 句话：什么时候用 + 做什么 + 产出什么]
---

# [SKILL 名字]

## 触发场景
[用一段话描述这个 SKILL 在什么情况下被调用]

## 触发关键词
- "[用户可能说的表达 1]"
- "[用户可能说的表达 2]"
- "[用户可能说的表达 3]"

## 工作流程
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]
4. [步骤 4]

## 输出格式
[指定输出模板，比如 markdown 结构、字段列表、长度限制等]

## 示例
**输入示例**：[一个典型的输入]

**输出示例**：
[展示 AI 应当输出的样子]
```

### 让 AI 帮你看看

```callout
{
  "type": "tip",
  "title": "把初稿发给 AI 让它帮你 review",
  "content": "写完第一版后，把你的 SKILL 内容贴给 AI，让它帮你检查：触发词够不够具体？流程是否清晰？输出格式是否明确？"
}
```

---

## 收尾与下一步

### 一句话回顾

SKILL 创作的核心就三件事：**说清楚什么时候用、说清楚怎么做、说清楚输出长什么样**。剩下的都是迭代。

### 下一步推荐

```concept-card
{
  "id": "cc-next",
  "title": "学完后你可以做什么",
  "columns": 2,
  "cards": [
    { "icon": "✍️", "title": "写你第一个 SKILL", "desc": "选一个你本周实际用过的小任务，按本课的 5 步流程写出来。" },
    { "icon": "🔄", "title": "迭代已有的 SKILL", "desc": "如果你已经在用某些 SKILL，拿出来用本课的判断标准 review 一遍。" },
    { "icon": "👥", "title": "分享给团队", "desc": "把好用的 SKILL 分享给同事，让大家都用上。" },
    { "icon": "📚", "title": "看更多 SKILL 示例", "desc": "去研究那些已经成熟发布的 SKILL（比如翻译、写作、代码 review 类），看高手怎么写。" }
  ]
}
```

```callout
{
  "type": "note",
  "title": "最后的提醒",
  "content": "SKILL 写作没有标准答案。好的 SKILL 是「你用了觉得顺手」的，不是「符合所有规范」的。先写出来用起来，再慢慢优化。"
}
```

---

**恭喜你学完本课。** 现在你已经有了创作 SKILL 的完整知识，剩下的就是动手了。
