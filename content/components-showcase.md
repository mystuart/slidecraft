---
title: 组件总览
subtitle: 10 个交互组件的真实示例 · 字段、视觉、交互逐个打磨
author: Alice
sections:
  - 1. hero · 封面
  - 2. quiz · 单题选择
  - 3. quiz-track · 题组 carousel
  - 4. fill-blank · 填空
  - 5. step-guide · 步骤引导（tab 切换）
  - 6. compare · 对比
  - 7. concept-card · 概念卡片网格
  - 8. callout · 高亮块
  - 9. formula · 公式
  - 10. math-step · 分步解题
  - 打磨方向预告
---

```hero
{
  "title": "组件总览",
  "subtitle": "10 个交互组件的真实示例 · 字段、视觉、交互逐个打磨",
  "emoji": "🧩",
  "visual": { "value": "🧩", "rotated": -8 }
}
```

## 1. hero · 封面

> hero 组件的展示见本页 sidebar 顶部的 brand 区（由 frontmatter 的 `title` / `subtitle` / `emoji` 字段驱动），不重复嵌入示例块。

---

## 2. quiz · 单题选择

```quiz
{
  "id": "q-parabola",
  "question": "抛物线 $y = 2x^2 - 4x + 1$ 的开口方向是？",
  "type": "single",
  "options": [
    {"id": "a", "text": "向上"},
    {"id": "b", "text": "向下"},
    {"id": "c", "text": "向左"},
    {"id": "d", "text": "向右"}
  ],
  "correct": ["a"],
  "feedback": {
    "correct": "✓ 正确。$a = 2 \\gt 0$，开口向上。",
    "wrong": "看二次项系数 $a$ 的正负即可。"
  },
  "hint": "$a \\gt 0$ 开口向上，$a \\lt 0$ 开口向下。"
}
```

```quiz
{
  "id": "q-discriminant",
  "question": "关于方程 $x^2 - 2x + 5 = 0$ 的根，下列说法**正确**的有？",
  "type": "multi",
  "options": [
    {"id": "a", "text": "有两个不相等的实数根"},
    {"id": "b", "text": "有两个相等的实数根"},
    {"id": "c", "text": "没有实数根"},
    {"id": "d", "text": "有一对共轭复数根"}
  ],
  "correct": ["c", "d"],
  "feedback": {
    "correct": "✓ 全部选对。$\\Delta = (-2)^2 - 4 \\times 1 \\times 5 = -16 \\lt 0$，无实数根。",
    "wrong": "判别式 $\\Delta = b^2 - 4ac$ 的符号决定根的情况。"
  }
}
```

---

## 3. quiz-track · 题组 carousel

```quiz-track
[
  {
    "id": "qt-pythagoras-1",
    "question": "直角三角形两直角边为 3 和 4，斜边长多少？",
    "type": "single",
    "options": [
      {"id": "a", "text": "5"},
      {"id": "b", "text": "6"},
      {"id": "c", "text": "7"},
      {"id": "d", "text": "$\\sqrt{7}$"}
    ],
    "correct": ["a"],
    "feedback": {
      "correct": "✓ 勾股定理：$3^2 + 4^2 = 5^2$。",
      "wrong": "勾股定理 $a^2 + b^2 = c^2$。"
    }
  },
  {
    "id": "qt-pythagoras-2",
    "question": "等腰直角三角形斜边为 $6\\sqrt{2}$，直角边长多少？",
    "type": "single",
    "options": [
      {"id": "a", "text": "3"},
      {"id": "b", "text": "6"},
      {"id": "c", "text": "$6\\sqrt{2}$"},
      {"id": "d", "text": "12"}
    ],
    "correct": ["b"],
    "feedback": {
      "correct": "✓ $c^2 = 2a^2$，代入 $c = 6\\sqrt{2}$ 得 $a = 6$。",
      "wrong": "等腰直角三角形满足 $c = a\\sqrt{2}$。"
    }
  },
  {
    "id": "qt-pythagoras-3",
    "question": "边长为 1 的正方形对角线长度？",
    "type": "single",
    "options": [
      {"id": "a", "text": "1"},
      {"id": "b", "text": "$\\sqrt{2}$"},
      {"id": "c", "text": "2"},
      {"id": "d", "text": "$\\sqrt{3}$"}
    ],
    "correct": ["b"],
    "feedback": {
      "correct": "✓ $d = \\sqrt{1^2 + 1^2} = \\sqrt{2}$。",
      "wrong": "正方形对角线把正方形分成两个等腰直角三角形。"
    }
  }
]
```

```quiz-track
[
  {
    "id": "qt-periodic-1",
    "question": "元素周期表中，原子序数为 8 的元素是？",
    "type": "single",
    "options": [
      {"id": "a", "text": "碳 C"},
      {"id": "b", "text": "氮 N"},
      {"id": "c", "text": "氧 O"},
      {"id": "d", "text": "氟 F"}
    ],
    "correct": ["c"],
    "feedback": {"correct": "✓ 氧 O，原子序数 8。", "wrong": "看元素周期表第一周期尾数。"}
  },
  {
    "id": "qt-periodic-2",
    "question": "下列哪一组元素都属于碱金属？",
    "type": "single",
    "options": [
      {"id": "a", "text": "Li、Na、K"},
      {"id": "b", "text": "Be、Mg、Ca"},
      {"id": "c", "text": "F、Cl、Br"},
      {"id": "d", "text": "He、Ne、Ar"}
    ],
    "correct": ["a"],
    "feedback": {"correct": "✓ 碱金属是第 IA 族（除 H）。", "wrong": "碱金属是周期表最左一列（除 H 外）。"}
  },
  {
    "id": "qt-periodic-3",
    "question": "稀有气体的最外层电子数通常是？",
    "type": "single",
    "options": [
      {"id": "a", "text": "2 或 8"},
      {"id": "b", "text": "4"},
      {"id": "c", "text": "6"},
      {"id": "d", "text": "7"}
    ],
    "correct": ["a"],
    "feedback": {"correct": "✓ He 是 2，其他（Ne/Ar/Kr/Xe）都是 8。", "wrong": "稀有气体最外层电子数 = 稳定结构。"}
  },
  {
    "id": "qt-periodic-4",
    "question": "金属性最强的元素位于周期表的？",
    "type": "single",
    "options": [
      {"id": "a", "text": "左下角"},
      {"id": "b", "text": "右上角"},
      {"id": "c", "text": "中间"},
      {"id": "d", "text": "左下和右上"}
    ],
    "correct": ["a"],
    "feedback": {"correct": "✓ 金属性从左到右递减、从上到下递增。", "wrong": "金属性递变规律：左下最强，右上最弱。"}
  },
  {
    "id": "qt-periodic-5",
    "question": "下列哪个元素是非金属？",
    "type": "single",
    "options": [
      {"id": "a", "text": "Fe"},
      {"id": "b", "text": "Cu"},
      {"id": "c", "text": "S"},
      {"id": "d", "text": "Al"}
    ],
    "correct": ["c"],
    "feedback": {"correct": "✓ 硫 S 是非金属元素。", "wrong": "金属元素：Fe 铁、Cu 铜、Al 铝。"}
  }
]
```

---

## 4. fill-blank · 填空

```fill-blank
{
  "id": "fb-element",
  "question": "请填入元素符号：氢的化学符号是 ____，氧的化学符号是 ____。",
  "answer": "H|O",
  "hint": "取元素拉丁名首字母（Hydrogen → H，Oxygen → O）。"
}
```

```fill-blank
{
  "id": "fb-water",
  "question": "水的化学式是 ____。",
  "answer": "H2O|H₂O",
  "hint": "两个氢原子与一个氧原子结合。"
}
```

---

## 5. step-guide · 步骤引导（tab 切换）

```step-guide
{
  "id": "sg-balance",
  "title": "化学方程式配平 3 步法",
  "steps": [
    {
      "title": "写方程式",
      "content": "写出**未配平**的化学方程式，例如：\\n\\nFe + O₂ → Fe₂O₃",
      "example": "左右两边原子数不等，这就是配平要解决的问题。"
    },
    {
      "title": "数原子",
      "content": "分别统计左右两边各元素的原子数。",
      "example": "Fe: 左 1 / 右 2\\nO: 左 2 / 右 3"
    },
    {
      "title": "调系数",
      "content": "在分子式前加系数（**绝对不能改下标**），使两边各原子数相等。",
      "example": "4 Fe + 3 O₂ → 2 Fe₂O₃ ✓"
    }
  ]
}
```

```step-guide
{
  "id": "sg-force",
  "title": "受力分析 5 步法",
  "steps": [
    {
      "title": "确定研究对象",
      "content": "选要分析的物体（**隔离法**），其他物体暂时不管。"
    },
    {
      "title": "画重力",
      "content": "竖直向下，作用点画在重心。",
      "example": "G = mg，方向竖直向下"
    },
    {
      "title": "找接触力",
      "content": "逐一检查研究对象与**其他物体**的接触点。",
      "example": "支持力 N（垂直接触面）、拉力 T（沿绳）、弹力 F（垂直接触面）"
    },
    {
      "title": "判断摩擦力",
      "content": "根据相对运动或趋势判断方向：\\n- 滑动摩擦力：与相对运动方向**相反**\\n- 静摩擦力：与相对运动趋势**相反**"
    },
    {
      "title": "列方程",
      "content": "沿坐标轴分解各力，列牛顿第二定律方程组。",
      "example": "水平方向：F合x = maₓ\\n竖直方向：F合y = maᵧ = 0"
    }
  ]
}
```

---

## 6. compare · 对比

```compare
{
  "id": "cmp-lens",
  "title": "凸透镜成像规律",
  "left": {
    "label": "物距 $u \\gt 2f$",
    "tag": "good",
    "points": [
      "成**倒立缩小**实像",
      "像距 $f \\lt v \\lt 2f$",
      "应用：**照相机**"
    ]
  },
  "right": {
    "label": "物距 $u \\lt f$",
    "tag": "bad",
    "points": [
      "成**正立放大**虚像",
      "像与物**同侧**，不能呈在屏上",
      "应用：**放大镜**"
    ]
  }
}
```

```compare
{
  "id": "cmp-thermo",
  "title": "化学反应热效应",
  "left": {
    "label": "放热反应",
    "tag": "warn",
    "points": [
      "$\\Delta H \\lt 0$",
      "反应物能量**高于**生成物",
      "**释放**热量，注意散热安全",
      "例：燃烧、中和反应"
    ]
  },
  "right": {
    "label": "吸热反应",
    "tag": "neutral",
    "points": [
      "$\\Delta H \\gt 0$",
      "反应物能量**低于**生成物",
      "**吸收**热量，需要持续加热",
      "例：碳酸钙分解"
    ]
  }
}
```

---

## 7. concept-card · 概念卡片网格

```concept-card
{
  "id": "cc-newton",
  "title": "牛顿三定律",
  "columns": 3,
  "cards": [
    {
      "icon": "🟢",
      "title": "第一定律（惯性）",
      "desc": "不受力的物体保持静止或匀速直线运动状态。"
    },
    {
      "icon": "➡️",
      "title": "第二定律（F = ma）",
      "desc": "物体加速度与合外力成正比，与质量成反比。"
    },
    {
      "icon": "↔️",
      "title": "第三定律（作用反作用）",
      "desc": "作用力与反作用力大小相等、方向相反、作用在**不同物体**上。"
    }
  ]
}
```

```concept-card
{
  "id": "cc-cell",
  "title": "动物细胞四大结构",
  "columns": 4,
  "cards": [
    {"icon": "🔵", "title": "细胞膜", "desc": "控制物质进出"},
    {"icon": "🟡", "title": "细胞质", "desc": "细胞代谢的主要场所"},
    {"icon": "🟤", "title": "细胞核", "desc": "遗传信息库"},
    {"icon": "🟢", "title": "线粒体", "desc": "有氧呼吸产生 ATP"}
  ]
}
```

---

## 8. callout · 高亮块

```callout
{
  "type": "tip",
  "title": "解题小技巧",
  "content": "遇到含根号的方程，先**平方去根号**简化，但解出后**必须代入原方程检验**——平方操作可能引入增根。"
}
```

```callout
{
  "type": "danger",
  "title": "易错警示",
  "content": "力的分解中，**正交分解**的方向选择决定了计算难度。通常沿加速度方向分解最简单，但**不一定**沿水平/竖直方向——选错了就要多算很多三角函数。"
}
```

---

## 9. formula · 公式

```formula
{
  "expr": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "caption": "一元二次方程求根公式",
  "showExpr": true
}
```

```formula
{
  "expr": "E = mc^2",
  "display": true,
  "caption": "质能方程（爱因斯坦 1905）"
}
```

---

## 10. math-step · 分步解题

```math-step
{
  "title": "解一元一次方程",
  "question": "求方程 $2x + 3 = 7$ 的解。",
  "steps": [
    {
      "title": "移项",
      "content": "把含 $x$ 的项移到左边，常数项移到右边。",
      "answer": "$2x = 7 - 3$",
      "warning": "移项要**变号**！$+3$ 移到右边变成 $-3$。"
    },
    {
      "title": "合并同类项",
      "content": "两边分别化简。",
      "answer": "$2x = 4$"
    },
    {
      "title": "系数化为 1",
      "content": "两边同除以 $x$ 的系数。",
      "answer": "$x = 2$",
      "insight": "这是方程最简解，**代入原方程可验证**：$2 \\times 2 + 3 = 7$ ✓"
    }
  ]
}
```

```math-step
{
  "title": "用因式分解法解一元二次方程",
  "question": "求方程 $x^2 - 5x + 6 = 0$ 的解。",
  "questionFormula": "x^2 - 5x + 6 = 0",
  "steps": [
    {
      "title": "识别方程类型",
      "content": "形如 $ax^2 + bx + c = 0$（$a \\neq 0$）的方程为一元二次方程。",
      "answer": "$a = 1$，$b = -5$，$c = 6$",
      "insight": "本题 $a = 1$（最简情况），可以用**十字相乘法**因式分解。"
    },
    {
      "title": "因式分解",
      "content": "找两个数，使其乘积为 $c$、和为 $b$。",
      "formula": "x^2 - 5x + 6 = (x - 2)(x - 3)",
      "hint": "$(-2) \\times (-3) = 6$，$(-2) + (-3) = -5$ ✓",
      "answer": "$(x - 2)(x - 3) = 0$"
    },
    {
      "title": "应用零积定理",
      "content": "两个因子乘积为零，**至少一个**为零。",
      "answer": "$x - 2 = 0$ 或 $x - 3 = 0$"
    },
    {
      "title": "分别求解",
      "content": "把每个因子分别设为零。",
      "answer": "$x_1 = 2$，$x_2 = 3$"
    },
    {
      "title": "验证（代入原方程）",
      "content": "把两个解代入原方程检查。",
      "formula": "2^2 - 5 \\times 2 + 6 = 4 - 10 + 6 = 0 \\checkmark",
      "answer": "两个解都成立：$x_1 = 2$，$x_2 = 3$",
      "explanation": "因式分解法比求根公式更**直接**——尤其当 $a = 1$ 且 $b, c$ 都是较小整数时，手算比套公式快得多。"
    }
  ]
}
```

---

## 打磨方向预告

> 这一节列出我自己看 showcase 后觉得值得讨论的点（待老板拍板）。

1. **行内 LaTeX 缺失**：`processInline` 不处理 `$...$`，导致 quiz 选项、callout content、step content 里的数学公式都不能渲染——是先把 `_inline.js` 升级，还是继续依赖组件字段？
2. **quiz 选项里的数学**：同上，但 quiz 的 `options[].text` 是不是该走一遍 processInline？如果是，那 `feedback` 也该是。
3. **math-step 的 answer 默认展开**：现在 answer 一直展开，hint/explanation 等折叠——风格不统一。要不要让 answer 也折叠，或者反过来全部默认展开？
4. **concept-card 的图标**：现在用 emoji，但每个浏览器/系统渲染不一致。是否要切到 SVG 图标库（lucide / heroicons）？
5. **compare 的 4 种 tag（good/bad/warn/neutral）**：4 种颜色够不够？要不要加「正确 vs 错误」的二色版（黑白分明）和「注意 vs 提醒」的温和版？
6. **hero 的 CTA**：现在是锚点跳到 `#sec-xxx`，但侧边栏锚点是 renderer 自动生成的——能不能让 hero 直接引用 section id？需要规范化锚点命名。
7. **fill-blank 的多答案**：现在用 `|` 分隔，教学场景够用，但如果答案有「同义/等价但顺序不同」的情况（如 `H2O` 和 `H₂O`），目前是手动枚举——能不能搞个简单的等价规则？
