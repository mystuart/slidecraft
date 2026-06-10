# tetra-equiv 组件 Schema 草案（v0.1）

> 目标：在课件里**同时**显示「同一个四面体的 4 种不同摆法」（4 种底 + 4 个锥顶），让学员**一眼**看见「4 个形状不同、顶点不同，但体积完全相等」—— 这是立体几何「等体积法」教学的核心可视化。
>
> 适用场景：立体几何大题里求三棱锥体积 —— 学员的卡点往往是「4 种底中选哪个」—— 4 个四面体同框显示能把决策成本降到 0。

## 字段一览

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | string | - | 自动生成 | 组件根 DOM ID |
| `title` | string | - | - | 卡片小标题 |
| `caption` | string | - | - | 卡片下方说明文字 |
| `linkedGeometry3d` | string | - | - | 联动的 geometry-3d 实例 ID（顶点源） |
| `vertexLabels` | string[] | ✅（4 个） | - | 4 个顶点的 label（顺序无关，内部去重） |
| `showAs` | array | ✅（正好 4 项） | - | 4 种摆法（每种 = 1 个底 + 1 个锥顶 + 1 种颜色 + 1 个图例文字） |
| `opacity` | number | - | `0.45` | 填充透明度（0-1） |
| `camera` | object | - | 自动框 | `{position:[x,y,z], target:[x,y,z]}`（默认根据 4 顶点包围盒自适应） |
| `showVolumeCheck` | bool | - | `true` | 是否在卡片标题下方显示 4 个体积数值（验证相等） |

## vertexLabels 字段

`vertexLabels` 是 **4 个 label 名**（如 `["A", "P", "C", "B₁"]`）—— 这 4 个 label 必须都在 `linkedGeometry3d` 实例的 `labels` 中存在，否则该顶点位置 fallback 为 `[0, 0, 0]`（不报错，但视觉上会看到四面体塌陷成一点）。

**联动**：组件每帧（≈60fps）从 `window.__cwGeom3D[linkedGeometry3d].getLabelPos(name)` 拉取最新坐标。当 `slider` 组件通过 `setLabelPos` 改动某个 label（如 `P`）时，本组件 4 个四面体自动重画。

## showAs 字段

`showAs` 是数组，**必须正好 4 项**，每项描述一种「底+顶点」摆法：

```jsonc
{
  "base": ["A", "P", "C"],   // 该摆法的底（3 个 label）
  "apex": "B₁",              // 该摆法的锥顶（1 个 label）
  "color": "#ff6b6b",        // 该摆法的填充色（hex）
  "label": "B₁-APC"          // 该摆法的图例文字
}
```

### 默认配色兜底

`showAs` 缺失 / 数量不是 4 时，组件 fallback 到默认 4 色：
- `#ff6b6b`（珊瑚红）
- `#4ecdc4`（薄荷绿）
- `#ffe66d`（暖黄）
- `#a8e6cf`（浅绿）

学员至少能看到 4 个不同颜色的四面体，不会因为 schema 笔误就空白。

## 联动规则

- 组件**每帧**调用 `api.getLabelPos(label)` 拉取 4 个顶点的最新坐标
- 联动源 `linkedGeometry3d` 通过 `slider` 改 `P` 位置时：
  1. `slider.drives` 调 `api.setLabelPos("P", [...])`
  2. 下一帧本组件拉取到新 `P` 位置
  3. 4 个四面体同步重画
- **不依赖** `derivedVertices`（虽然本组件可能跟 derived vertex 联动，但 derived 是 geometry-3d 的能力，不是 tetra-equiv 的）
- 联动源 `linkedGeometry3d` 实例**晚于**本组件就绪也没关系：组件初始化后 200ms / 800ms 各重拉一次

## 体积校验

`showVolumeCheck: true`（默认）时，组件标题下方显示：

> 体积校验：0.5833 ≈ 0.5833 ≈ 0.5833 ≈ 0.5833

4 个数值用「六面体体积公式」 $V = \frac{1}{6} |(b-a) \cdot ((c-a) \times (d-a))|$ 分别算 4 种摆法的体积。

理论上 4 个值**完全相等**（数学上同一个四面体），浮点误差量级在 $10^{-6}$，显示精度自动 truncate。

## 联动示例：三棱锥 B₁-APC 的 4 种底

**geometry-3d 声明**（顶点源，参见 `docs/slider-schema.md` 中的 P 滑动示例）：

```jsonc
{
  "id": "prism-2024-xianyang-q2",
  "geometry": "triangular-prism",
  "vertices": [[0,2,0], [0,0,0], [2,0,0], [0,2,2], [0,0,2], [2,0,2]],
  "labels": [
    ["A",  [   0, 2, 0]],
    ["B₁", [   0, 0, 2]],
    ["P",  [ 1.5, 2, 2]],
    ["C",  [   2, 0, 0]]
  ]
}
```

**tetra-equiv 声明**：

```jsonc
{
  "id": "tetra-equiv-b1apc",
  "title": "同一个四面体的 4 种摆法",
  "linkedGeometry3d": "prism-2024-xianyang-q2",
  "vertexLabels": ["A", "P", "C", "B₁"],
  "showAs": [
    { "base": ["A", "P", "C"], "apex": "B₁", "color": "#ff6b6b", "label": "B₁-APC" },
    { "base": ["A", "B₁", "C₁"], "apex": "P", "color": "#4ecdc4", "label": "P-AB₁C₁" },
    { "base": ["P", "B₁", "C"], "apex": "A", "color": "#ffe66d", "label": "A-PB₁C" },
    { "base": ["A", "P", "B₁"], "apex": "C", "color": "#a8e6cf", "label": "C-APB₁" }
  ],
  "caption": "4 个四面体形状不同 / 顶点不同 / 体积完全相等 —— 这就是「等体积法」的几何本质。"
}
```

学员看到的：
- 4 个半透明彩色四面体叠加在同一个 canvas 里，3D 拖动可绕看
- 卡片底部 4 个体积数值自动校验相等
- 联动 `slider` 拖动 `P` 位置时，4 个四面体同步变形（同时保持体积相等）

## v0.1 实现边界

- **4 个四面体共享相机**（拖动 = 4 个一起转），不单独控制每个 —— 简单可靠
- **不支持双击复位 / Shift+平移**（保留基础 OrbitControls：拖动旋转 + 滚轮缩放）
- **不支持 4 个独立视角小窗**（如需 4 视角并排，v0.2 再说）
- **顶点必须在源 geometry-3d 的 labels 里声明**（否则 fallback 到 `[0, 0, 0]`）
- **`showAs` 必须正好 4 项**（少 / 多都 fallback 为 4 种默认颜色搭配）

## 已知问题

- slider 联动 `P` 时本组件重画频率 = RAF（≈60fps），大量实例同屏可能拖累性能
- 体积校验只显示数值，不显示误差（4 个体积都是浮点，理论相等实际有 $10^{-6}$ 误差，UI 已 truncate）
- 4 个四面体在「特殊位置」（如 4 顶点共面）时会塌陷成平面 —— 不做保护，依赖上游 schema 保证几何合法