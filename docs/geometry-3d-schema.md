# geometry-3d 组件 Schema 草案（v0.1）

> 目标：初高中立体几何教学 + 空间向量 + 解析几何的可视化
> 参考借鉴：Mathigon textbooks、unconed/mathbox、euclid.js、Three.js demos
> 核心约束：单 HTML 离线分发 / Markdown 写教案 / 不依赖 CDN

## 字段一览

### 基础结构

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `title` | string | - | - | 卡片标题（立体几何题目标） |
| `geometry` | string | ✅ | - | 几何体类型 |
| `size` | array | - | `[1,1,1]` | 几何体尺寸 |
| `camera` | object | - | 见下方 | 初始相机视角 |
| `background` | string | - | `"#ffffff"` | 画布背景色 |

### 几何体类型 `geometry`

初高中覆盖：

- `box` 长方体（含正方体）
- `prism` 棱柱（base + height）
- `pyramid` 棱锥
- `tetrahedron` 正四面体（pyramid 的特化）
- `octahedron` 正八面体
- `cylinder` 圆柱
- `cone` 圆锥
- `sphere` 球
- `frustum` 圆台 / 棱台
- `custom` 自定义顶点数组（高级用法）

### 几何体尺寸 `size`

按 `geometry` 类型含义不同：

- `box`: `[length, width, height]`（长宽高）
- `cylinder/cone`: `[radius, height]`
- `sphere`: `[radius]`
- `prism/pyramid`: `[baseSize, height]`（底边长 + 高）
- `custom`: 数组的数组，顶点坐标列表

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

### 高亮与剖切

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `mode` | string | `"all"` | 交互模式 |
| `highlightOnHover` | bool | `true` | hover 时高亮 |
| `clickToShowInfo` | bool | `true` | 点击显示顶点的坐标/棱的长度/面的面积 |

`mode` 取值：

- `"all"` 顶点/棱/面都能交互
- `"vertex"` 只能交互顶点
- `"edge"` 只能交互棱
- `"face"` 只能交互面
- `"none"` 完全静态展示

### 剖切面

| 字段 | 类型 | 说明 |
|------|------|------|
| `clippingPlane` | object | null = 不剖切 |
| `clippingPlane.normal` | array | 平面法向量 `[x, y, z]` |
| `clippingPlane.constant` | number | 平面方程常数项 |
| `clippingPlane.showPlane` | bool | 是否显示剖切面（半透明面） |
| `clippingPlane.color` | string | 剖切面颜色 |

### 多视角同步

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `views` | string\|null | `null` | null = 单视角 |
| `views = "three"` | | | 三视图同步：主视图 + 左视图 + 俯视图 |
| `viewLayout` | string | `"grid"` | `"grid"` / `"row"` / `"col"` |
| `linkedCamera` | bool | `true` | 多视角时是否相机联动（拖一个动其他） |

### 相机

```jsonc
{
 "position": [3, 3, 3], // 相机位置
 "target": [0, 0, 0], // 看向的目标
 "fov": 50 // 视场角（度）
}
```

### 展开图 / 折叠动画

| 字段 | 类型 | 说明 |
|------|------|------|
| `unfold` | object | null = 不展开 |
| `unfold.target` | array | 展开后的最终位置数组（与面数量对应） |
| `unfold.duration` | number | 动画时长（ms），默认 800 |
| `unfold.easing` | string | 缓动函数，默认 `"easeInOutQuad"` |

### 教学化补充

| 字段 | 类型 | 说明 |
|------|------|------|
| `caption` | string | 卡片下方说明文字 |
| `captionFormula` | string | KaTeX 公式（如 `"V = \\frac{1}{3}Sh"`） |
| `showDimensions` | bool | 是否标注长宽高 |
| `dimensionUnit` | string | 长度单位，默认 `""` |

## 完整示例

### 示例 1：正方体 ABCD-A'B'C'D'

```jsonc
{
 "title": "正方体 ABCD-A'B'C'D'",
 "geometry": "box",
 "size": [2, 2, 2],
 "showAxes": true,
 "showGrid": true,
 "gridSize": 1,
 "showEdges": true,
 "showVertices": true,
 "edgeColor": "#1a1a1a",
 "labels": [
 ["A", [-1, -1, -1]],
 ["B", [1, -1, -1]],
 ["C", [1, 1, -1]],
 ["D", [-1, 1, -1]],
 ["A'", [-1, -1, 1]],
 ["B'", [1, -1, 1]],
 ["C'", [1, 1, 1]],
 ["D'", [-1, 1, 1]]
 ],
 "camera": { "position": [4, 4, 4], "target": [0, 0, 0] },
 "caption": "正方体的 8 个顶点和 12 条棱",
 "mode": "all"
}
```

### 示例 2：圆柱 + 剖切面

```jsonc
{
 "title": "圆柱的轴截面",
 "geometry": "cylinder",
 "size": [1, 2],
 "clippingPlane": {
 "normal": [1, 0, 0],
 "constant": 0,
 "showPlane": true,
 "color": "#ff6b35"
 },
 "caption": "圆柱的轴截面是矩形",
 "captionFormula": "S = 2rh"
}
```

### 示例 3：三视图同步

```jsonc
{
 "title": "三视图：长方体的主视图 / 左视图 / 俯视图",
 "geometry": "box",
 "size": [3, 2, 1.5],
 "views": "three",
 "viewLayout": "row",
 "linkedCamera": false,
 "showAxes": true
}
```

### 示例 4：棱锥展开

```jsonc
{
 "title": "三棱锥的展开图",
 "geometry": "pyramid",
 "size": [2, 3],
 "unfold": {
 "target": "auto",
 "duration": 800
 },
 "caption": "三棱锥展开为 4 个三角形"
}
```

## 字段取值约定

- 颜色：CSS 颜色字符串（`#rrggbb` / `rgba(...)` / `red`）
- 坐标：数组，`[x, y, z]` 局部坐标（相对几何体中心）
- 角度：弧度（Three.js 默认）
- 长度：任意单位，由 `dimensionUnit` 标注显示单位