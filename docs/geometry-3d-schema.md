# geometry-3d 组件 Schema（v0.1.7）

> 目标：初高中立体几何教学 + 空间向量 + 解析几何的可视化
> 参考借鉴：Mathigon textbooks、unconed/mathbox、euclid.js、Three.js demos
> 核心约束：单 HTML 离线分发 / Markdown 写教案 / 不依赖 CDN
> Three.js 默认坐标系 vs 项目约定：「B=原点，BA=+Y，BC=+X，**BB₁=+Z（垂直朝上**）」 —— 组件初始化时 `camera.up.set(0, 0, 1)` 校准。

## 字段一览（v0.1.7 真实存在的字段）

### 基础结构

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | string | - | 自动生成 | 组件根 DOM ID，供 slider/math-step/tetra-equiv/cut-anim 联动查找（per-instance 闭包） |
| `title` | string | - | `''` | 卡片标题（立体几何题目标） |
| `geometry` | string | ✅ | - | 几何体类型（见下方"几何体类型"） |
| `size` | array | - | `[1,1,1]` | 几何体尺寸（按 geometry 含义不同） |
| `vertices` | array | - | - | 自定义顶点数组（`triangular-prism` 等需要，传 `[[x,y,z],...]`） |
| `camera` | object | - | 见下方 | 初始相机视角 |
| `background` | string | - | `"#ffffff"` | 画布背景色 |
| `caption` | string | - | `''` | 卡片下方说明文字 |

### 几何体类型 `geometry`（v0.1.7 支持 9 种）

| 取值 | 含义 | 真实实现 |
|------|------|----------|
| `box` | 长方体（含正方体） | ✅ 原生 |
| `sphere` | 球 | ✅ 原生 |
| `cylinder` | 圆柱 | ✅ 原生 |
| `cone` | 圆锥 | ✅ 原生 |
| `tetrahedron` | 正四面体 | ✅ 原生 |
| `octahedron` | 正八面体 | ✅ 原生 |
| `triangular-prism` | 三棱柱 | ✅ **v0.1.2 真正实现**（不再是 box 占位） |
| `prism` | 通用棱柱 | ⚠️ 占位实现（v0.2 用 vertices + faces 数据表） |
| `pyramid` | 棱锥 | ⚠️ 占位实现（同上） |

### 几何体尺寸 `size`

按 `geometry` 类型含义不同：
- `box`: `[length, width, height]`（长宽高）
- `cylinder/cone`: `[radius, height]`
- `sphere`: `[radius]`
- `triangular-prism`: `[baseSize, height]`（底边长 + 高，约定等边三角形底）
- `prism/pyramid`: 同上（占位）

### 坐标轴与网格

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `showAxes` | bool | `false` | 是否显示坐标轴 |
| `showGrid` | bool | `false` | 是否显示网格 |
| `gridSize` | number | `1` | 网格单位长度 |
| `xRange` | array | `[-3, 3]` | X 轴显示范围 |
| `yRange` | array | `[-3, 3]` | Y 轴显示范围 |
| `zRange` | array | `[-3, 3]` | Z 轴显示范围 |
| `axisLabels` | bool | `true` | 是否显示 X/Y/Z 字母 |

### 顶点 / 棱 / 面的开关

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `showVertices` | bool | `true` | 是否显示顶点小球 |
| `showEdges` | bool | `true` | 是否描边棱线 |
| `showFaces` | bool | `true` | 是否填充面 |
| `edgeColor` | string | `"#1a1a1a"` | 棱线颜色 |
| `faceColor` | string | `"#cce0ff"` | 面填充色（半透明） |
| `vertexColor` | string | `"#ff6b35"` | 顶点球颜色 |
| `opacity` | number | `0.85` | 面填充透明度 |

### 顶点标签

| 字段 | 类型 | 说明 |
|------|------|------|
| `labels` | array | 标签配置数组，每项一个标签 |
| `labels[i].text` | string | 显示文本，如 `"A"`、`"A(1,2,3)"` |
| `labels[i].position` | array | 在几何体上的位置 `[x, y, z]`（局部坐标） |
| `labels[i].offset` | array | `[dx, dy]` 像素偏移，默认 `[0, -10]` |
| `labels[i].color` | string | 文字颜色 |
| `labels[i].fontSize` | number | 字号（px），默认 `14` |
| `labels[i].formula` | string | 可选，KaTeX 公式字符串 |

> **v0.1.3 扩展**：`labels` 里的 label 文本就是「命名顶点」——slider 通过 `setLabelPos(name, [x,y,z])` 改其位置，CSS2D 文字同步移动。

### 半透面 `planes`（v0.1.7 改用 3 顶点 BufferGeometry）

> **重要变更**：v0.1.7 之前用 `THREE.PlaneGeometry(maxSpan, maxSpan)` 画正方形半透面，超出原三角形范围 —— 教学错误。v0.1.7 改用 3 顶点 BufferGeometry，**永远是 3 角形**，不会多也不会少。

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `planes` | array | `[]` | 半透面数组 |
| `planes[i].id` | string | - | 面 ID（`math-step.highlight.planes` 引用） |
| `planes[i].vertices` | string[3] | ✅ | 3 个 label 名（如 `["A","P","C"]`） |
| `planes[i].color` | string | `"#a0e7e5"` | 面填充色 |
| `planes[i].opacity` | number | `0.35` | 面填充透明度 |

**联动规则**：当某个 label（如 P）位置被 slider / setLabelPos 改动时，引用此 label 的 plane **自动重算中心 + 法线**（plane 的 3 顶点跟新 label 走）。

### 辅助线池 `auxLines`（v0.1.7 新增）

> 教学场景里"步骤 N 看到的辅助线"会随步骤变。在 schema 一次性预置好，math-step 的 `highlight.auxLines: [id, ...]` 在不同 step toggle 可见性 —— **不重建几何体**，只改 `line.visible`。

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `auxLines` | array | `[]` | 预置辅助线池 |
| `auxLines[i].id` | string | ✅ | 线 ID（toggle / api 引用） |
| `auxLines[i].from` | string | ✅ | 起点 label 名（必须在 labels 里） |
| `auxLines[i].to` | string | ✅ | 终点 label 名（必须在 labels 里） |
| `auxLines[i].style` | string | `"solid"` | `"solid"` / `"dashed"` |
| `auxLines[i].color` | string | `"#ff3366"` | 线色 |
| `auxLines[i].width` | number | `2` | 线宽（px） |
| `auxLines[i].label` | string | - | 可选 · 中点文字标签 |

> **联动规则**：起点 / 终点 label 变化时，auxLine 两端点**自动跟随**（slider 拖 P 时 line 跟着弯）。

### 派生顶点 `derivedVertices`（v0.1.3 新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| `derivedVertices` | array | 派生顶点列表 |
| `derivedVertices[i].label` | string | 派生 label 名（不在 labels 里，由派生公式算） |
| `derivedVertices[i].formula` | string | 公式：`"midpoint(a, b)"` / `"centroid(a, b, c)"` / `"linear(a, b, t)"` |

**联动规则**：任意命名顶点变化（手动 setLabelPos 或其他 derived 重算）时，整组 derived 按声明顺序重算。

### 直角标记 `rightAngles`（v0.1.7 新增）

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `rightAngles` | array | `[]` | 直角标记（如 `AB⊥BC` 在 B 处） |
| `rightAngles[i].vertex` | string | - | 顶角 label |
| `rightAngles[i].arms` | string[2] | - | 两条边 label |
| `rightAngles[i].size` | number | `0.12` | 标记大小（局部坐标） |
| `rightAngles[i].color` | string | `"#555"` | 标记颜色 |

### 高亮与剖切

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `mode` | string | `"all"` | 交互模式（v0.1 留作占位，未实现 Raycaster 高亮） |
| `highlightOnHover` | bool | `true` | hover 时高亮（v0.1 留作占位） |
| `clickToShowInfo` | bool | `true` | 点击显示顶点的坐标/棱的长度/面的面积（v0.1 留作占位） |

> **v0.1 实际**：`setHighlight({edges, planes, auxLines})` / `resetHighlight()` 由 `math-step` hover 调用，不走 mode 状态机。

### 相机

```jsonc
{
  "position": [3, 3, 3], // 相机位置
  "target":   [0, 0, 0], // 看向的目标
  "fov": 50               // 视场角（度）
}
```

### 教学化补充

| 字段 | 类型 | 说明 |
|------|------|------|
| `caption` | string | 卡片下方说明文字（与基础结构重复保留位置） |
| `captionFormula` | string | KaTeX 公式（如 `"V = \\frac{1}{3}Sh"`） |
| `showDimensions` | bool | 是否标注长宽高 |
| `dimensionUnit` | string | 长度单位，默认 `""` |

## 交互（v0.1.7）

- **拖动旋转**（azimuth + polar，OrbitControls 默认）
- **Shift+拖动平移**（OrbitControls 默认）
- **滚轮缩放**（OrbitControls 默认）
- **A/D 或 ←/→ 键绕 Z 轴自转**（v0.1.6 新增，绕 BB₁ 方向，立体几何教学需求）
- **双击几何体** = 以该几何体包围盒中心重置视角
- **双击空白** = 全局复位到 schema 里 `camera.position` 初始视角
- **右下角操作提示徽章**：🖱 拖动 / ⌨ A/D ←/→ / ⇧ Shift+拖动 / 🖲 滚轮 / ⏺ 双击

## 客户端 API（per-instance 闭包）

```js
// 优先用 DOM 元素上的 __scApi（v0.1.1+ 闭包，不污染全局）
const api = document.getElementById('prism-2024').__scApi;

// 或向后兼容老代码（兜底挂一份到全局）
const api = window.__scGeom3D['prism-2024'];

api.setHighlight({ planes: ['Tri-PAC'], auxLines: ['OD', 'AP'] });
api.resetHighlight();
api.setLabelPos('P', [1.5, 0.5, 2]);    // 改 P 位置，触发 plane/derived/auxLine 重算
api.getLabelPos('P');                     // 拿当前 P 坐标
api.showAuxLines(['OD', 'AP']);           // 直接 toggle 辅助线
api.hideAuxLines(['OD']);
api.toggleAuxLine('B1D');
api.hasAuxLine('B1D');
```

**CustomEvent 事件**（v0.1.2 派发）：
- `sc:geom3d:change` —— 命名顶点变化时派发，detail 含新坐标
- `sc:geom3d:highlight` —— 高亮变化时派发，detail 是 spec 或 null

**`__dirty` 标记**（v0.1.2）：setLabelPos / setHighlight 末尾打 `api.__dirty = true`，联动组件（tetra-equiv / cut-anim）可订阅事件或轮询 dirty 标记按需重画（避免每帧重建浪费）。

## 完整示例

### 示例 1：正方体 ABCD-A'B'C'D'（基础）

```jsonc
{
  "id": "cube-1",
  "title": "正方体 ABCD-A'B'C'D'",
  "geometry": "box",
  "size": [2, 2, 2],
  "showAxes": true,
  "showGrid": true,
  "labels": [
    ["A",  [-1, -1, -1]], ["B",  [ 1, -1, -1]],
    ["C",  [ 1,  1, -1]], ["D",  [-1,  1, -1]],
    ["A'", [-1, -1,  1]], ["B'", [ 1, -1,  1]],
    ["C'", [ 1,  1,  1]], ["D'", [-1,  1,  1]]
  ],
  "camera": { "position": [4, 4, 4], "target": [0, 0, 0] },
  "caption": "正方体的 8 个顶点和 12 条棱"
}
```

### 示例 2：三棱柱（v0.1.2 真正实现） + 辅助线池（v0.1.7）

```jsonc
{
  "id": "prism-2024-xianyang",
  "title": "三棱柱 ABC-A₁B₁C₁（AB⊥BC，AB=BC=AA₁=2）",
  "geometry": "triangular-prism",
  "vertices": [
    [0, 2, 0], [0, 0, 0], [2, 0, 0],
    [0, 2, 2], [0, 0, 2], [2, 0, 2]
  ],
  "size": [2, 2, 2],
  "showFaces": true, "showEdges": true, "showVertices": true,
  "showAxes": true, "showGrid": true,
  "planes": [
    { "id": "Tri-PAC", "vertices": ["A", "P", "C"], "color": "#a0e7e5", "opacity": 0.35 }
  ],
  "auxLines": [
    { "id": "OD",  "from": "O",  "to": "D",  "style": "dashed", "color": "#ff3366" },
    { "id": "AP",  "from": "A",  "to": "P",  "style": "dashed", "color": "#ff3366" }
  ],
  "derivedVertices": [
    { "label": "D", "formula": "midpoint(P, C)" }
  ],
  "rightAngles": [
    { "vertex": "B", "arms": ["A", "C"] }
  ],
  "labels": [
    ["A",  [ 0, 2, 0]], ["B",  [ 0, 0, 0]], ["C",  [ 2, 0, 0]],
    ["A₁", [ 0, 2, 2]], ["B₁", [ 0, 0, 2]], ["C₁", [ 2, 0, 2]],
    ["O",  [ 1, 1, 0]], ["P",  [ 0.5, 1.5, 2]], ["D",  [ 1.25, 0.75, 1]]
  ],
  "camera": { "position": [4.0, 4.0, 1.0], "target": [1.0, 1.0, 1.0], "fov": 45 }
}
```

### 示例 3：math-step 联动高亮

```jsonc
// 上面 prism-2024-xianyang 的 math-step：
{
  "id": "step-q1",
  "geometry3dId": "prism-2024-xianyang",
  "question": "...",
  "steps": [
    {
      "title": "Step 1 · 看见 △PAC",
      "content": "...",
      "highlight": { "planes": ["Tri-PAC"] }
    },
    {
      "title": "Step 2 · 看见中位线 OD ∥ AP",
      "content": "...",
      "highlight": { "planes": ["Tri-PAC"], "auxLines": ["OD", "AP"] }
    }
  ]
}
```

学员 hover step 1 → `__scApi.setHighlight({planes: ["Tri-PAC"]})` 自动调用；hover step 2 → 加 `auxLines: ["OD", "AP"]` 触发两条辅助线显示。

### 示例 4：slider 联动命名顶点

```jsonc
// 上面 prism-2024-xianyang 配套的 slider：
{
  "id": "slider-p",
  "label": "P 沿 A₁ → C₁ 滑动",
  "min": 0, "max": 1, "step": 0.01, "defaultValue": 0.75,
  "linkedGeometry3d": "prism-2024-xianyang",
  "drives": [{ "vertex": "P", "path": ["A₁", "C₁"], "param": "value" }],
  "caption": "t = 0.75 对应 A₁P = 3PC₁（D 自动 = mid(P, C)）。"
}
```

学员拖动滑块 → `setLabelPos('P', ...)` → D 跟着重算（midpoint 公式）→ plane Tri-PAC 跟着转 → auxLines OD/AP 跟着弯。

## 字段取值约定

- 颜色：CSS 颜色字符串（`#rrggbb` / `rgba(...)` / `red`）
- 坐标：数组，`[x, y, z]` 局部坐标（相对几何体中心）
- 角度：弧度（Three.js 默认）
- 长度：任意单位，由 `dimensionUnit` 标注显示单位

## 路线图（v0.2+，**未实现**）

- `clippingPlane` — Three.js 物理剖切平面（与 cut-anim 透明度动画路线互斥）
- `views: "three"` — 三视图同步（主视图 + 左视图 + 俯视图）
- `unfold` — 展开图 / 折叠动画
- `mode` 状态机 + Raycaster 命中高亮（v0.1 留作占位）
