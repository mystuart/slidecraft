# slider 组件 Schema 草案（v0.1）

> 目标：让教学课件里的「动点 / 动线 / 动值」能拖动滑块实时改变，并联动 geometry-3d 组件的命名顶点。
> 适用场景：高中立体几何 / 解析几何中需要在 3D 场景里拖动某条边上的点（如 $P$ 在 $A_1C_1$ 上滑动），实时观察依赖该点的几何量（线段、面积、体积）变化。

## 字段一览

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | string | - | 自动生成 | 组件根 DOM ID |
| `title` | string | - | - | 卡片小标题 |
| `label` | string | ✅ | - | 滑块上方的文字描述（用户可读） |
| `min` | number | ✅ | - | 滑块最小值 |
| `max` | number | ✅ | - | 滑块最大值 |
| `step` | number | - | `(max-min)/100` | 步长（推荐显示成 `0.01` 之类细粒度） |
| `defaultValue` | number | - | `(min+max)/2` | 初始值；超出 [min, max] 时自动 clamp |
| `unit` | string | - | `''` | 显示单位文字，跟在数字后面 |
| `showValue` | bool | - | `true` | 是否显示当前数值 |
| `linkedGeometry3d` | string | - | - | 联动的 geometry-3d 实例 ID（须匹配其 `id` 字段） |
| `drives` | array | - | `[]` | 滑块驱动的顶点列表 |
| `caption` | string | - | - | 卡片下方说明文字 |

## drives 字段

`drives` 是数组，每项描述一个由滑块驱动的顶点：

```jsonc
{
  "vertex": "P",          // 顶点 label 名（必须在 linkedGeometry3d 的 labels 中存在）
  "path": ["A1", "C1"],   // 沿这两个 label 之间插值
  "param": "value"        // 可选 · "value"(默认) 表示 t = 归一化滑块值；"1-value" 表示 t = 1 - 归一化值（反向）
}
```

### 联动规则

- 滑块值 $v \in [min, max]$ 归一化 $t = (v - min) / (max - min) \in [0, 1]$
- 顶点新位置 = `path[0] + t * (path[1] - path[0])`
- 联动后调用 `window.__cwGeom3D[id].setLabelPos(name, pos)`
- 联动会**级联触发** linkedGeometry3d 内部的：
  - 同名 CSS2D 文字标签移动
  - 引用该 label 的半透面（`planes`）重新计算中心 + 法线
  - `derivedVertices` 派生顶点重算（`D = midpoint(P, C)` 这种）

### param 字段取值

| 取值 | 含义 | 适用场景 |
|------|------|----------|
| `"value"`（默认） | $t = (v - min) / (max - min)$，从 `path[0]` 滑到 `path[1]` | 常规拖动 |
| `"1-value"` | $t = 1 - (v - min) / (max - min)$，从 `path[1]` 滑到 `path[0]` | 想让 min 端对应 path[1] 时（如 $P$ 离 $A_1$ 远时 $A_1P$ 比例大） |

## 联动示例：P 在 A₁C₁ 上滑动

**geometry-3d 声明**：

```jsonc
{
  "id": "prism-2024-xianyang",
  "geometry": "triangular-prism",
  "vertices": [[0,2,0], [0,0,0], [2,0,0], [0,2,2], [0,0,2], [2,0,2]],
  "labels": [
    ["A1", [0, 2, 2]],
    ["C1", [2, 0, 2]],
    ["P",  [0.5, 1.5, 2]],     // 初始 P 位置（slider 拖动时改它）
    ["D",  [1.25, 0.75, 1]]
  ],
  "derivedVertices": [
    { "label": "D", "formula": "midpoint(P, C)" }   // D 自动跟随 P 重算
  ]
}
```

**slider 声明**：

```jsonc
{
  "id": "slider-p",
  "title": "动点 P 在 A₁C₁ 上的位置",
  "label": "P 沿 A₁ → C₁ 滑动",
  "min": 0,
  "max": 1,
  "step": 0.01,
  "defaultValue": 0.5,
  "unit": "A₁P / A₁C₁",
  "linkedGeometry3d": "prism-2024-xianyang",
  "drives": [
    { "vertex": "P", "path": ["A1", "C1"], "param": "value" }
  ]
}
```

学员拖动滑块时：

1. P 在 A1 (t=0) → C1 (t=1) 之间插值
2. D 跟着 P 自动重算（D = mid(P, C)）
3. 引用 P 的半透面（如果有）自动重定位

## derivedVertices 公式参考

> 这是 geometry-3d 组件的能力（不是 slider 自己的），slider 借助它实现"派生顶点联动"。

| 函数 | 签名 | 含义 |
|------|------|------|
| `midpoint` | `midpoint(a, b)` | 取两点中点 `(a+b)/2` |
| `centroid` | `centroid(a, b, c)` | 取三点重心 `(a+b+c)/3` |
| `linear` | `linear(a, b, t)` | 沿 a→b 线性插值，t ∈ [0, 1] 常数（v0.3 不支持滑块值注入） |

参数支持两种形态：
- **label 名**（如 `"P"`）→ 查 `labelNameToPos` 拿当前坐标
- **数字字面**（如 `0.5`）→ 直接当常数

## 已知问题（v0.1）

- `path` 必须正好 2 个 label，不支持折线 / 曲线插值
- `linear` 公式的 t 是 schema 写死的常数，**滑块不能通过 linear 公式直接控制**——slider 走 `drives` 字段
- 联动仅在客户端触发；初次渲染时不会自动调 `setLabelPos`（保持 geometry-3d 标签的初始位置）
- 不支持内联 LaTeX（系统级问题 #1）
