# GLM-5.1 评审请求 · Slidecraft 2D 组件 v0.1.0

> ⚠️ **本文档是 2026-06-13 的历史归档**（评审请求 + GLM 回执 + 修复记录），**不是待办清单**。
> 下面的「当前状态」是 2026-06-16 复盘时补的，便于区分哪些已落地、哪些还挂着。
> 正文保持原样（行号因后续改动已漂移，引用的 `L546` 等不再准确，但决策推理仍有参考价值）。

## 当前状态（2026-06-16 复盘）

| 评审项 | 状态 | 落地位置 |
|---|---|---|
| **C0-1** 抛物线 orientation 画错 | ✅ 已修复（R1 的 4x 缩放也一并修） | `function-plot.js` `drawConicParabola` 用 `Math.sqrt(\|p·dx\|)` |
| **C1-1** 重根漏掉（demo Δ=0 翻车） | ✅ 已修复 | `_geom_utils.js` `polyRealRoots` n==2 走二次公式 |
| **C1-2** 三次极值全标同种 | ✅ 已修复 | `function-plot.js` 用二阶导判凹凸 |
| **C2-1** polyRealRoots 跨组件重复 | ✅ 已修复 | 抽到 `_geom_utils.js` v0.2.0（R3） |
| **C2-3** diff 计算三处重复 | ✅ 已修复 | `computeDiffCoeffs`（R5） |
| **C3-1/3/4** 小修 | ✅ 已修复 | coeffs.slice / console.warn / 删减 0（R6） |
| **C2-2** coords 不发 ready 事件 | ❌ **仍未做** | 下游 function-plot/intersection 仍各有 5/9 个 setTimeout 兜底 |
| **C2-4/5** 无 destroy、document 监听 ×N | ❌ **仍未做** | 和 3D 组件 H4 同款债，待全局统一处理 |
| **C3-2** renderDelta innerHTML | ⏸ 保持现状（无用户输入流入，不构成 XSS） |

**结论**：R1-R6 已全部落地；R8 里「故意没动」的 C2-2 / C2-4 / C2-5 截至 2026-06-16 仍未做，仍是有效待办。C2-2 的风险（架构性改动需配套时序）判断依然成立。

---



> **评审范围**：2D 平面几何组件 4 个 + 1 个 slider 扩展
> **生成日期**：2026-06-13
> **生成人**：Mavis (mavis)
> **目标版本**：Slidecraft v0.1.0（含 coords-2d / function-plot / intersection-marker / slider 扩展）
> **测试 demo**：4 个 markdown（`content/coords-2d-test.md` / `function-plot-test.md` / `function-plot-types-test.md` / `function-plot-slider-demo.md` / `function-plot-quadratic-demo.md`）

---

## 1. 评审背景

### 1.1 框架定位

Slidecraft 是**通用培训引擎**，**不是 DBA 专用**。目标用户群横跨 DBA / 数学家教 / 各种学科教师。3D 组件（geometry-3d / slider / trajectory / tetra-equiv / cut-anim）的真正用户是**数学家教老师**。本轮新增 2D 平面几何组件，服务对象同样是数学家教。

### 1.2 上一轮 GLM 评审结果

之前已经评审过 3D 组件，3 个 C 全部修好：
- C1: tetra-equiv 事件监听（修法：先 pullAndRender 再 addEventListener）
- C2: cut-anim tryGet(['D']) 死代码（修法：删除）
- C3: cut-anim prismEdges transparent 缺失（修法：创建时加 transparent: true）

本轮**新增 2D 组件**，没有 3D 那些老代码包袱，但**架构风格沿用** 3D 组件的 per-instance 闭包 + __scApi + cw:xxx:change 事件。

### 1.3 已知代码规模

| 组件 | 文件 | 行数 | 版本 |
|------|------|------|------|
| coords-2d | `template/components/coords-2d.js` | 458 | v0.1.0 |
| function-plot | `template/components/function-plot.js` | 762+ | v0.1.0 |
| intersection-marker | `template/components/intersection-marker.js` | 320+ | v0.1.0 |
| slider（扩展） | `template/components/slider.js` | 200+ | v0.1.2（v0.1.1 → v0.1.2） |
| build.js（扩展） | `build.js` | 320 | 新增 coords-2d / function-plot / intersection-marker CSS 条件注入 |

---

## 2. 评审重点

按你之前 3D 评审的反馈，**重点关注**：

### 2.1 死代码 / 失效逻辑（**最常被 C 标红**）

- **功能还活着但实现路径走不通的代码**
- **变量定义后从未使用**
- **事件监听装在错的时机 / 错的元素 / 错的函数**（trajectory / tetra-equiv 同款 bug 风险）
- **static readonly / 闭包变量初始化时序问题**

### 2.2 数值算法正确性（**2D 新增关注点**）

3D 没踩过这个坑，2D 大量依赖数值算法：
- **Horner 多项式求值**（function-plot polyEval）
- **扫描 + 二分求实根**（polyRealRoots）
- **多项式求导 + 极值判定**（polyDeriv + min/max 判断）
- **两 polynomial 求交点**（right-align 相减 + 求实根）
- **判别式 Δ**（b²-4ac）
- **韦达定理**（-b/a, c/a）

特别关注：
- `coeffs` 数组顺序约定是否一致（之前 polynomial 默认升序错了一次，已修成降序）
- **min/max 判极值**是看 `leadCoeff` 符号（不是 y 值正负）
- **多项式相减必须右对齐**（按 length 末尾对齐常数项，不是按 index 0 对齐）

### 2.3 事件冒泡 / 派发 / 监听链

- **`bubbles: true`**：所有 CustomEvent 派发都有 ✓
- **listener 时序**：是否在源对象未初始化前就 addEventListener（trajectory / tetra-equiv 同款 bug 风险）
- **联动源元素先拿再装 listener**（同款风险）

### 2.4 Canvas 2D 坐标系

- **Y 轴朝下 vs 数学 Y 朝上**（dataToScreen 用减号）
- **DPR 缩放**（devicePixelRatio 避免高 DPI 屏糊）
- **canvas 注入模式**：function-plot / intersection-marker 的 canvas 注入到 coords-2d 的 stage 里，共享坐标系

### 2.5 静默 return 调试灾难

- **init 失败必须 console.error**（不能光 return）
- 这次我至少加了 console.error（除了之前 function-plot 的 `if (!canvas) return` bug 已修）

---

## 3. 4 个新组件逐一评审

### 3.1 coords-2d

**文件**：`template/components/coords-2d.js`（458 行）

**核心职责**：Canvas 2D 网格 + 坐标轴 + 刻度 + 数据↔像素 API

**字段**：
- `id / title / xRange / yRange / showGrid / showAxes / showTicks / showLabels / originAtCenter / gridColor / axisColor / background / aspect / caption`

**API**：
- `getXRange/setXRange/getYRange/setYRange/dataToScreen/screenToData/getScale/redraw`

**关键算法**：
- 自动选刻度间距（1/2/5 序列）
- originAtCenter: true/false 两种模式
- aspect: fit/equal 两种缩放
- DPR 缩放

**重点关注**：
- L201-202 `var zeroX = (0 - state.xRange[0]) * pxPerUnitX;` —— originAtCenter 时原点位置反算
- **特殊场景**：xRange = [-3, 5] 不对称 + originAtCenter: false 会让负 x 点画到画布外（demo 已用 true 规避，但 coords-2d 本身没限制这个组合）
- `aspect: "equal"` 时 `dataAspect` 与 `canvasAspect` 比较分支
- `formatTick` 整数 / 小数格式化

### 3.2 function-plot

**文件**：`template/components/function-plot.js`（762+ 行）

**核心职责**：5 种曲线类型 + 关键点 + per-instance 闭包 API + canvas 注入 coords-2d

**5 种类型**：
- `polynomial`（任意阶，coeffs 降序）
- `sine` / `cosine`（amp/freq/phase/offset）
- `conic_ellipse`（a/b/cx/cy，自动算 c=√(a²-b²)）
- `conic_hyperbola`（a/b/cx/cy，自动算 c=√(a²+b²) + 渐近线）
- `conic_parabola`（p, orientation 4 选 1, vertex）

**关键算法**：
- `polyEval` Horner 循环（**降序，from index 0**）
- `polyDeriv` 求导系数（**降序**）
- `polyRealRoots` 扫描 + 二分（**[-50, 50] 范围，去前导零判 coeffs[0]**）
- 极值 min/max 判定（**看 leadCoeff 符号，不是 y 值正负**）
- conic 自动算焦点 / 顶点 / 中心
- setParam 支持 `coeffs.0` 点语法访问数组下标

**API**：
- `getFunctions/getParam/setParam/setFunctionParams/getValueAt/getKeyPoints/redraw`
- 监听 `sc:coords2d:change` 自动 redraw
- 派发 `sc:functionplot:change`（带 bubbles: true）

**重点关注**：
- **canvas 注入模式**：fp 的 canvas 注入到 coords-2d stage 里（`ensureCanvasInjected`），需要 coords 已 init 完成
- `getValueAt`：**只实现了 polynomial / sine / cosine 三种**，hyperbola / parabola 未实现 → 拖 hyperbola 滑块时 getValueAt 返回 NaN（不影响视觉但 API 不全）
- sin/cos 的 max/min 计算：cos 在 -phase/freq 取 max（看 polyRealRoots 那段）
- **多次 firstRender 用 setTimeout 50/200/500**（兜底时序）—— 是否过度？
- `polyRealRoots` 的 num stability（高阶 polynomial 6+ 可能不稳）—— v0.1.0 注释已记录

### 3.3 intersection-marker

**文件**：`template/components/intersection-marker.js`（320+ 行）

**核心职责**：在坐标系上画交点高亮 + 自动求两 polynomial 交点 + 实时判别式 Δ 显示 + 韦达定理

**3 种模式**：
- **静态 points 模式**：`points: [{x, y, label?, color?}, ...]`
- **polynomialIntersection 模式**：`{functionPlotId, fnId1, fnId2, pointColor?}` —— 监听 fp 变化自动求交
- **polynomialDiscriminant 模式**：`{functionPlotId, fnId, subtractFnId?, showVieta?}` —— 实时 Δ + 韦达

**关键算法**：
- `polyRealRoots`（与 function-plot 同款，**右对齐相减**）
- `refreshDiscriminant` 区分 `subtractFnId`（求差 Δ）vs 默认（fn1 对 x 轴的 Δ）
- `renderDelta` 三色状态：绿 / 黄 / 灰

**API**：
- `setPoints/addPoint/clear/getPoints/refreshPolynomialIntersections/getDiscriminant`
- 监听 `sc:coords2d:change` 和 `sc:functionplot:change` 自动 redraw

**重点关注**：
- **canvas 注入模式**：与 function-plot 同款（`ensureCanvasInjected`）
- **right-align 修法**在 `refreshDiscriminant` + `getDiscriminant` + `refreshPolynomialIntersections` 三处都有 —— **是否重复？** 是否能抽出来？
- `renderDelta` 字符串拼接 HTML（**没用 escapeHtml**）—— label / status 来自 cfg 是配置但仍可能 XSS（低风险但值得注意）
- **首帧用 setTimeout 100/300 兜底** —— 是否过度？
- `polynomialDiscriminant` 期望 coeffs.length === 3，其他情况返回 null 不显示 —— 是否友好？

### 3.4 slider（v0.1.1 → v0.1.2 扩展）

**文件**：`template/components/slider.js`（200+ 行）

**核心职责**：滑块拖动实时改值，**双形态 drives**：
- **形态 A**（老，向后兼容 v0.1.1）：`{vertex, path, param}` 驱动 geometry-3d 顶点
- **形态 B**（新，v0.1.2）：`{fnId, param, map, min, max}` 驱动 function-plot 参数

**API**：
- 形态 B：`map: "linear" | "lerp" | "1-value"`
- **linkedGeometry3d** 和 **linkedFunctionPlot** 可同设（一次滑动驱动两个目标）
- linkedFunctionPlot 模式下，`drives[].fnId` + `drives[].param` 决定改谁
- `param: "coeffs.0"` 点语法（依赖 function-plot 端 setParam 支持）

**重点关注**：
- `applyDrives` 形态 B 的 if 分支（`if (linkedFpId && d.fnId && d.param)`）—— **形态 A / 形态 B 判断逻辑互斥**（fnId 存在走 B，否则走 A）—— 是否清晰？
- `map: "lerp"` 时没校验 `d.min != null && d.max != null`（null 时当成 0/1，**潜在 bug**）—— 传 null 会怎样？
- 形态 B 没有 setLabelPos 派发 `sc:geom3d:change` —— **如果有 demo 同时用形态 A + 形态 B，形态 A 的 setLabelPos 还是会派发**（不影响）—— 但这值得检查
- `linkedFpId = s.getAttribute('data-linked-function-plot') || ''` —— 没传时是空字符串，`if (linkedFpId && ...)` 自然 false（OK）

### 3.5 build.js（CSS 条件注入扩展）

**文件**：`build.js`（原 305 行 → 现在 320+ 行）

**新增 2 段条件 CSS 注入**（6.7 / 6.8 / 6.9）：
- coords-2d.css
- function-plot.css
- intersection-marker.css

**模式沿用 6.6（geometry-3d.css）**：`if (bodyHtml.includes('class="coords-2d"') && fs.existsSync(...))`

**重点关注**：
- **3 段几乎重复**的 if 块 —— 是否能抽成一个 `if (className, cssPath)` 循环？
- 注入顺序：geomCss → coords2dCss → functionPlotCss → intersectionCss，**是否影响 CSS 优先级**（应该不影响，因为都是不同 class 名）

---

## 4. 已知风险（自评）

我自己已经识别到的：

1. **intersection-marker `renderDelta` HTML 字符串拼接**没用 escapeHtml —— label/status 来自 cfg 配置，作者可控，但模式不安全
2. **intersection-marker `getDiscriminant` 重复了 `refreshDiscriminant` 的 diff 计算逻辑** —— 应该抽出来
3. **function-plot `getValueAt` hyperbola/parabola 未实现** —— 拖 hyperbola slider 时 getValueAt 返回 NaN
4. **coords-2d 不对称 xRange + originAtCenter:false 画布外点** —— demo 已用 true 规避
5. **slider 形态 B `map: "lerp"` 没校验 d.min/max** —— 传 null 时按 0/1 处理
6. **多个 firstRender setTimeout 50/200/500/100/200/300 兜底** —— 是否过度？（保守做法，问题不大）
7. **build.js 3 段 CSS 注入条件块几乎重复** —— 应该抽

---

## 5. 测试方法

### 5.1 怎么跑

```bash
cd /Users/stuart/Studyspace/Alice/courseware

# 编译
node build.js

# 启动 server
pkill -f "http.server 8765" 2>/dev/null; sleep 1
python3 -m http.server 8765 > /tmp/srv.log 2>&1 &

# 浏览器测试 demo
# http://127.0.0.1:8765/dist/coords-2d-test.html
# http://127.0.0.1:8765/dist/function-plot-test.html
# http://127.0.0.1:8765/dist/function-plot-types-test.html
# http://127.0.0.1:8765/dist/function-plot-slider-demo.html
# http://127.0.0.1:8765/dist/function-plot-quadratic-demo.html
```

### 5.2 验证清单

**coords-2d**：
- 网格 + 坐标轴 + 刻度显示 ✓（已验证）
- originAtCenter: true / false 视觉差异
- aspect: fit / equal 视觉差异
- 拖窗口 resize 网格重画

**function-plot**：
- 5 种类型曲线画对
- 关键点位置正确
- 拖 slider 改 a/b 实时重画
- 多条曲线叠画

**intersection-marker**：
- 静态 points 模式显示
- polynomialIntersection 自动算交点
- polynomialDiscriminant Δ 实时显示
- Δ 颜色（绿/黄/灰）随 Δ 数值变化
- 韦达定理 x₁+x₂ / x₁·x₂ 正确

**slider 形态 B**：
- 单条线拖动（lerp / linear / 1-value 三种 map）
- 多条线同步（一个 slider 驱动 2 个 fn param）
- 拖到底/顶时所有值到位

---

## 6. 反馈格式（参照你 3D 评审的风格）

按 **C0 / C1 / C2 / C3** 严重程度分级：

- **C0 / Critical**：功能失效 / 死代码 / 数据流断裂
- **C1 / High**：实现可工作但不正确（如约定不一致、潜在边界 bug）
- **C2 / Medium**：可工作但可读性 / 性能 / 一致性问题
- **C3 / Low**：代码风格 / 文档 / 命名建议

每条请给：
- **文件 + 行号**
- **问题描述**（症状）
- **根因**（代码层面）
- **修法建议**（具体怎么改）

---

## 7. 时间窗

- **本 review request 生成**：2026-06-13 15:21
- **期望评审回执**：你方便时即可

---

## 8. 关联

- **之前 GLM 评审**：3D 组件 C1-C3 全部修好（commit 历史可查）
- **Slidecraft**：https://github.com/itshen/learn-ai 风格
- **AGENTS.md / SPEC.md**：`/Users/stuart/Studyspace/Alice/courseware/` 下
- **本轮代码路径**：
  - `template/components/coords-2d.js`
  - `template/components/function-plot.js`
  - `template/components/intersection-marker.js`
  - `template/components/slider.js`
  - `template/styles/coords-2d.css` / `function-plot.css` / `intersection-marker.css`
  - `content/*-test.md` / `*-demo.md`（5 个 demo）
  - `build.js`（CSS 条件注入扩展）
  - `template/components/renderer.js`（3 个新组件注册）

---

# 评审回执 · GLM-5.1

> **评审人**：GLM-5.1
> **评审日期**：2026-06-13
> **评审方式**：逐文件精读（coords-2d / function-plot / intersection-marker / slider / build.js CSS 注入段 / function-plot-quadratic-demo.md），未运行 build。
> **结论**：自评 7 条大部分准确，另挖到 4 条 Mavis 未识别的问题（含 1 个 C0）。先列我新发现的，再附自评核对表。

---

## 9. 新发现（Mavis 自评之外）

### C0-1 · `conic_parabola` 画出来的曲线和 keypoint 对不上 —— orientation 语义错

**文件**：`function-plot.js` 画法 `L546-616` vs 关键点 `L347-368`

`computeKeyPoints` 里 `orientation: "up"` 的语义是**向上开口**：焦点在 `(vx, vy+pp/4)`（顶点上方）、准线在下方。这是标准 `x² = 4py` 形式，正确。

但 `drawConicParabola` 对 `"up"` 画的是：

```js
// L564-577  orient==='up' 分支
for (var x = vx; x <= xRange[1]; x += stepX) {
  var dx = x - vx;
  var y = vy + sign * 2 * Math.sqrt(Math.abs(p * dx));  // y = vy + 2√(p·(x-vx))
}
// 再镜像画 y = vy - 2√(...) 下半支
```

这是 `y² = 4p(x-vx)` —— **向右开口的横置抛物线**（x 从 vx 走向 +∞，y 上下分叉）。`"up"` 实际画出横的，`"left"/"right"`（else 分支 `L590-615`）反而画成竖的。**4 个 orientation 的画法和 keypoint 完全是两套几何**，焦点圆点会落在空白处。

**根因**：draw 函数把 `y²=4px` 当成基型硬套到 4 个方向上，只翻转 sign/换轴，没区分「开口朝向」和「参数化方向」。

**修法**：`up`/`down` 应画 `x² = ±4py`（y 作为 x² 的函数，竖向 U/∩），`left`/`right` 画 `y² = ±4px`（横向）。当前 else 分支（left/right）的竖向画法其实是对的，up/down 分支错了 —— 两个分支的曲线类型需要对调。

> 注：5 个 demo 都没用 conic_parabola，所以是潜伏 bug。但组件 JSDoc 把它当一等公民宣传，建议要么修，要么在文档降级标注「v0.1 不支持抛物线」。

---

### C1-1 · `polyRealRoots` 漏掉相切重根 → demo 的 Δ=0 场景 UI 自相矛盾

**文件**：`function-plot.js:212-245`、`intersection-marker.js:179-206`

求根靠符号变化检测：

```js
if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) { /* 二分 */ }
if (prevY === 0) roots.push(prevX);  // 只在精确 0 时兜底
```

重根（如 `(x+1)²`，coeffs `[1,2,1]`）不穿轴，没有符号反转；而 `prevY === 0` 的兜底依赖扫描步长 0.01 从 -50 累加**正好命中** x=-1.0，浮点累加误差下基本命中不了（得到 ±1e-14），于是重根丢失。

**对 demo 的实际影响**：`content/function-plot-quadratic-demo.md` 第二节，b 拖到 ±2 时 `x²+2x+1` 与 x 轴相切。此时 `polynomialDiscriminant` 显示黄色「一个交点（相切）」，但 `polynomialIntersection` → `polyRealRoots([1,2,1])` 返回 `[]` → **0 个交点高亮**。判别式说有 1 个、画面显示 0 个，自相矛盾。

**修法**：重根附近用「极小值点」兜底 —— 扫到 `|y|` 局部极小且 < tol（如 1e-6）时也算一个根；或对 n≤2 直接走解析公式（`Δ = b²-4ac`，重根即 `-b/2a`）。后者最干净，正好和 discrimininant 组件复用同一段。

---

### C1-2 · 三次及以上多项式的极值 min/max 全标成同一种

**文件**：`function-plot.js:265-266`

```js
var leadCoeff = coeffs[0] || 0;
var type = leadCoeff > 0 ? 'min' : 'max';  // 所有极值统一用首项符号判
```

三次 `x³-3x` 求导 `3x²-3` 有两个极值（一个 max 一个 min），这里会**两个都标成 min**（leadCoeff=1>0）。注释自己也写了「简单起见」。

**影响**：demo 全用二次（只有 1 个极值，巧合正确），一旦画三次曲线 keypoint 标签全错。

**修法**：用二阶导 `polyDeriv(polyDeriv(coeffs))` 在该点判符号（>0 凹/min，<0 凸/max），或看左右一阶导数符号变化（-→+ 为 min，+→- 为 max）。

---

### C2-1 · `polyRealRoots` + `polyEval` 在两个文件里重复定义（跨组件）

**文件**：`function-plot.js:189-245` vs `intersection-marker.js:179-211`（`polyEvalDiff` 和 `polyEval` 逐字相同）

这正是 3D 评审 H5（`_geom_utils` 重复注入）的同款问题，而且这次连共享文件都没抽。**更大的风险**：C1-1 如果只修一边（比如 function-plot 改成解析公式、intersection 还在用扫描），两边的求根结果会不一致 —— 交点和零点对不上。

**修法**：扩展 `_geom_utils.js`（已存在，就是为这个设计的）加 `cwGeom_polyEval` / `cwGeom_polyRealRoots` / `cwGeom_polyDeriv` 客户端字符串，两个组件都引。顺便 C1-1 只需修一处。

---

## 10. 自评核对表

| Mavis 自评 | GLM 判定 |
|------------|----------|
| #1 renderDelta innerHTML XSS | ✅ 识别对，但**风险被高估** —— 当前 statusText/color 全硬编码、roundNum 输出是数字，无用户输入流入，实际不构成 XSS（见 C3-2） |
| #2 getDiscriminant 重复 diff | ✅ 准确，实际是 `refreshPolynomialIntersections` + `refreshDiscriminant` + `getDiscriminant` **三处**重复（C2-3） |
| #3 getValueAt 缺 hyperbola/parabola | ✅ 准确（`function-plot.js:742-751` default 分支返 NaN） |
| #4 不对称 xRange + originAtCenter:false | ✅ 准确，demo 用 true 规避 |
| #5 slider lerp 缺校验 | ✅ 准确（C3-3） |
| #6 setTimeout 过度 | ✅ 识别对，但**根因没点出** —— 是 coords-2d 初始渲染不发 ready/change 事件导致的（见 C2-2） |
| #7 build.js 3 段 CSS 注入重复 | ✅ 准确，可抽成 `(className, cssPath)` 循环 |

**Mavis 漏掉的**（新发现）：C0-1 抛物线 orientation 画错、C1-1 重根漏掉导致 demo Δ=0 自相矛盾、C1-2 三次极值标错、C2-1 polyRealRoots 跨组件重复（比他 #2 更严重）。

---

## 11. 我独立确认的其余条目（补充行号）

### C2-2 · coords-2d 初始渲染不发事件 → 下游被迫 setTimeout 轮询

**文件**：`coords-2d.js:418-424`（`emitChange` 只在 setXRange/setYRange 里调）、init `L441` 只 `redraw()` 不 emit

下游无法知道 coords 何时 ready，只能堆定时器：

- function-plot `L702-704`：`firstRender` 50/200/500
- intersection `L368-370`：`firstRender` 50/200/500，外加 `L427-432` refreshPolynomialIntersections 100/300、refreshDiscriminant 100/300

**一个实例最多挂 7 个 setTimeout**。

**修法**：coords-2d init 末尾 `redraw()` 之后调一次 `emitChange()`（或派发 `cw:coords2d:ready`），下游监听这个事件做首帧，删掉大部分 setTimeout。

### C2-3 · diff 计算三处重复

**文件**：`intersection-marker.js:147-157` / `L249-257` / `L407-415`

右对齐相减逻辑（`idx1 = c1.length - n + i`）三处各写一遍。抽 `computeDiffCoeffs(fpApi, fnId, subtractFnId)` 共用。

### C2-4 · 全部 2D 组件无 destroy / resize listener 不清理

coords-2d `L438`、function-plot `L178`、intersection `L124` 都 `window.addEventListener('resize', ...)` 无解绑。和 3D 组件 H4 同款债。

### C2-5 · 每个实例都在 document 上挂事件监听

**文件**：function-plot `L173`、intersection `L120/215/221`

N 个实例 = N 个 document 监听器，每次 coords change 全部触发再各自过滤。建议监听挂在自己的 `root` 上（事件 bubbles 会冒上来）。

### C3-1 · `polyRealRoots` 用 `.shift()` 原地改输入

**文件**：function-plot `L215`、intersection `L181`

当前调用点都传 `.slice()` 或新数组，安全；但是个 footgun。建议函数内先 `coeffs = coeffs.slice()`。

### C3-2 · `renderDelta` innerHTML（Mavis 自评 #1，风险被高估）

**文件**：`intersection-marker.js:297-309`

当前无用户输入流入，不构成 XSS。保持现状即可，但建议加注释「此处仅常量，若引入 cfg 字段需 escapeHtml」。

### C3-3 · slider `map:"lerp"` 缺 min/max 校验（Mavis 自评 #5）

**文件**：`slider.js:163-166`

漏配时静默回退成 0/1（等于 linear），作者多半是想要自定义范围，静默回退会让滑块「看起来没生效」。建议漏配时 `console.warn`。

### C3-4 · coords-2d `(pt[0] - 0)` 冗余

**文件**：`coords-2d.js:228-229`

`dataToScreen` 里 `(pt[0] - 0)` 就是 `pt[0]`，减 0 无意义。无害，删掉更干净。

---

## 12. 优先级建议

1. **先修 C0-1 + C1-1**：一个是组件核心数学画错，一个是 demo 主打特性（拖滑块看 Δ）在相切点翻车。
2. C1-2 顺手修（极值用二阶导判凹凸）。
3. **C2-1（抽共享 util）和 C2-2（coords 发 ready 事件）一起做** —— 抽 util 时 C1-1 只改一处；发事件时能砍掉一堆 setTimeout。
4. C2/C3 其余按时间窗安排。

---

# 接手修复记录 · GLM-5.1（2026-06-13）

> **背景**：Mavis 接到上面评审后，只改了 `function-plot.js`，只动了 **C0-1 的抛物线方向**（up/down→竖向、left/right→横向），方向本身修对了。但其余 7 条没碰，而且 C0-1 的修复**残留一个 4x 缩放 bug**（见下 R1）。本轮 GLM 接手把剩下的修完。
>
> 这一节是给 Mavis 的复盘 —— 重点不是「改了什么」，而是「**为什么 Mavis 漏了 / 改了一半**」，避免下次重蹈。

---

## R0. Mavis 这轮做对 / 没做全的

| 评审项 | Mavis 的动作 | 结论 |
|--------|-------------|------|
| C0-1 抛物线 orientation | 重写了 `drawConicParabola`，方向分支对调（up/down 画竖向、left/right 画横向） | ✅ 方向修对，但 ❌ **缩放漏改 4x**（R1） |
| C1-1 / C1-2 / C2-1 / C2-3 / C3-* | 未动 | 留给本轮 |

**教训 1：修一个 bug 时，要核对「整条契约」，不是只核对「自己改的那一行」。**
Mavis 看到「up 画成横的」就动手把分支对调，但没回头验证「改完之后，draw 画出来的曲线和 keypoint 的焦点圆点是否吻合」。结果方向对了、比例错了 —— 焦点还是落在曲线外面。这类「改一半」的修复比不改更危险，因为肉眼看「方向对了」会误以为搞定了。

---

## R1. C0-1 残留 4x 缩放（Mavis 漏掉的关键点）

**文件**：`function-plot.js` `drawConicParabola`

Mavis 改完方向后，竖向分支是 `y = vy + dirSign * (dx*dx) / (4*p)`。但 `computeKeyPoints` 里 `up` 的焦点放在 `(vx, vy + p/4)`、准线 `y = vy - p/4`。

**用焦点-准线定义反推曲线**（这才是抛物线的「真身」，焦点+准线是定义、draw 只是渲染）：

```
点 (x,y) 到焦点 (vx, vy+p/4) 的距离 = 到准线 y=vy-p/4 的距离
→ (x-vx)² + (y-vy-p/4)² = (y-vy+p/4)²
→ 令 u = y-vy：(x-vx)² + (u-p/4)² = (u+p/4)²
→ (x-vx)² = p·u
→ y = vy + (x-vx)² / p        ← 分母是 p，不是 4p
```

p=1 时真身是 `y = x²`，Mavis 的 `/4p` 画的是 `y = x²/4`，比焦点宽 4 倍。横向分支同理多了个 `2*sqrt`（`y²=4px` 形式，焦点应在 `vx+p`，但 keypoint 放在 `vx+p/4`）。

**修法**：竖向 `/ (4*p)` → `/ p`；横向 `2 * Math.sqrt(...)` → `Math.sqrt(...)`，统一对齐 keypoint 的焦点约定（keypoint + 准线是自洽的一对，改 draw 比改 8 处 keypoint 省事）。

**教训 2：组件里同一个几何概念有两套表达（draw 画曲线 + keypoint 画焦点）时，必须用一个公共定义串起来，否则两者各自「看起来对」但合不上。** 这里没抽公共函数是历史原因，但至少要在改 draw 时，手算一个点验证焦点是否落在曲线上。

---

## R2. C1-1 相切重根（demo 主打特性翻车的根因）

**文件**：`_geom_utils.js` `polyRealRoots`

旧实现靠「符号变化 + 二分」找根，重根（`(x+1)²`，曲线只碰一下 x 轴不穿过）没有符号反转，扫不到；`prevY === 0` 的兜底又依赖步长 0.01 从 -50 累加**正好命中** x=-1，浮点误差下基本命中不了 → 重根丢失。

**对 demo 的实际后果**：`function-plot-quadratic-demo.md` 第二节拖 b 到 ±2（`x²+2x+1` 与 x 轴相切）时，`polynomialDiscriminant` 显示黄色「一个交点（相切）」，但 `polynomialIntersection` 的 `polyRealRoots([1,2,1])` 返回 `[]` → 画面 0 个交点高亮。**判别式说有 1 个、画面显示 0 个，自相矛盾** —— 这正好是 demo 想演示的核心瞬间。

**修法**：n==2 直接走精确二次公式（`Δ = b²-4ac`，`Δ=0` 即重根 `-b/2a`），不靠扫描。n≥3 才用扫描+二分（相切对高次罕见，且教学 demo 不涉及）。

```
n==2:  Δ<0 → []；Δ≈0 → [-b/2a]；Δ>0 → [(-b±√Δ)/2a]
```

**验证**：`polyRealRoots([1,2,1])` → `[-1]` ✓（旧法返回 `[]`）。

**教训 3：数值算法要按「真实用例的边界」测一遍，不能只测 happy path。** demo 明确要演示 Δ=0 相切，但 polyRealRoots 从没拿 `[1,2,1]` 跑过 —— 这种「组件 A（判别式）说有、组件 B（求交）说没有」的不一致，只有端到端跑 demo 才暴露。Mavis 自评时如果拖一下 b 到 2 就能看见。

---

## R3. C2-1 抽共享 util —— 同时修掉 C1-1 / C3-1

**文件**：`_geom_utils.js`（v0.1.0 → v0.2.0）+ function-plot + intersection

之前 `polyRealRoots` + `polyEval` 在 function-plot 和 intersection-marker **各写一遍**（intersection 的 `polyEvalDiff` 和 function-plot 的 `polyEval` 逐字相同）。这有两个害处：
1. 维护双份，容易漂移（C1-1 如果只修 function-plot 那份、intersection 还用旧扫描，两边求根结果就不一致 —— 交点和零点对不上）。
2. 修 C1-1 要改两处。

**修法**：扩展已有的 `_geom_utils.js`（3D 组件抽 tetra 工具时就建好了这个文件，2D 直接复用同一套机制）：
- 加 `polyEval` / `polyDeriv` / `polyRealRoots`（服务端 + 客户端 `cwGeom_` 前缀两套）
- function-plot / intersection 顶部 `${geomUtilsJs}` 嵌入，删本地副本，调用点改 `cwGeom_*`
- C1-1 的二次公式精确解、C3-1 的 `coeffs.slice()` 不改原数组 —— **一次改、两处生效**

**教训 4：发现两处重复时，不要只在评审里记一笔就完事 —— 抽成共享 util 是「修 bug 顺便降低未来漂移风险」的高杠杆操作。** 尤其 polyRealRoots 这种有数值正确性坑的函数，重复定义几乎注定将来一边修了一边没修。

> 注：`_geom_utils` 的 clientJs 仍会被每个消费组件各嵌入一次（同款 3D 的 H5 债），同页有 3D+2D 组件时 `cwGeom_*` 会被定义 2~4 次。因为是同代码静默覆盖，无害。彻底去重需要改 renderer 的 `collectClientScript` 做 util 级 dedup —— 单独一轮再说。

---

## R4. C1-2 极值分类 —— 三次以上会全标成同一种

**文件**：`function-plot.js` `computeKeyPoints` polynomial 分支

旧逻辑 `type = coeffs[0] > 0 ? 'min' : 'max'`（用首项系数一刀切）。二次只有一个极值，巧合正确；三次 `x³-3x` 求导 `3x²-3` 有两个极值（一个 max 一个 min），这里**两个都标 min**。

**修法**：算二阶导 `polyDeriv(polyDeriv(coeffs))`，在该极值点求值 —— `>0` 凹→min、`<0` 凸→max、`≈0`→拐点。

**验证**：`x³-3x` → x=-1 是 max（二阶导 -6）、x=1 是 min（二阶导 6）✓。

**教训 5：「简单起见」的启发式要看清楚它的适用边界。** 注释自己写了「简单起见：看首项系数」—— 但首项系数只决定「整体开口」，对「多个极值各自是 min 还是 max」无信息。看到「简单起见」四个字时，多问一句：这个简化在 n 更大时还成立吗？

---

## R5. C2-3 diff 三处重复 → 抽 computeDiffCoeffs

**文件**：`intersection-marker.js`

「两 polynomial 右对齐相减」的逻辑（`idx = c.length - n + i` 那段循环）在 `refreshPolynomialIntersections` / `refreshDiscriminant` / `getDiscriminant` **三处**各写一遍。Mavis 自评 #2 识别到了，但没动手。

**修法**：抽 `computeDiffCoeffs(fpApi, fnId, subtractFnId)`（subtractFnId 可选，覆盖「fn1 对 x 轴」和「fn1 - fn2」两种场景），三处都调它。右对齐循环只剩 helper 内一份。

---

## R6. 小修 C3-1 / C3-3 / C3-4

| 项 | 改动 |
|----|------|
| C3-1 | `polyRealRoots` 开头 `coeffs.slice()` 再去前导零，不改原数组（footgun：以前有人直接传 `fn.params.coeffs` 就会把用户配置数组的前导零吃掉） |
| C3-3 | slider `map:"lerp"` 漏配 min/max 时 `console.warn`（不再静默回退成 [0,1]，作者写 lerp 多半想要自定义范围，静默会让滑块「看起来没生效」） |
| C3-4 | coords-2d `dataToScreen` 的 `(pt[0] - 0)` → `pt[0]`（减 0 无意义） |

---

## R7. 验证（不是「build 过了就算完」）

build.js 把 clientJs 当**字符串**拼进 HTML —— **clientJs 内部的语法错误不会让 `node build.js` 失败**，只会在浏览器里炸。所以「build 过了」≠「没问题」。本轮额外做了三层验证：

1. **clientJs 语法**：5 个组件的 clientJs 抽出来 `new Function(js)` 校验，全过。
2. **注入落地**：grep 产物 HTML 确认 `cwGeom_poly*` 已注入、本地 `function polyRealRoots` 定义为 0、二次公式 `disc` 分支在、`computeDiffCoeffs` 在、`d2Coeffs` 在、抛物线 `/p` 在。
3. **数值正确性**：拿 demo 的真实多项式跑服务端 `polyRealRoots`（与客户端同逻辑）—— 相切 `[1,2,1]→[-1]`、两根 `[1,-2,-3]→[-1,3]`、无根 `[1,0,1]→[]`、不污染输入、三次极值分类正确。

**教训 6：字符串拼接型框架（clientJs 当模板字符串）的验证，必须独立校验字符串内容，不能依赖外层 build 通过。** 这是 Slidecraft 特有的坑，3D 组件那一轮也踩过（`\\s` 反斜杠转义）。

---

## R8. 故意没动的（留给后续，附理由）

| 项 | 为什么留 |
|----|---------|
| **C2-2**（coords 发 ready 事件消除 setTimeout 梯子） | 架构性改动，且事件时序有坑：coords 的 initOne 先于 function-plot 跑（DOM 顺序），coords 初始 emit 时 fp 的 listener 还没注册 → 信号被漏掉。要彻底解决得配套改 consumer 的 listener 注册时机（先注册再查就绪状态），风险高于收益，单独一轮做。 |
| **C2-4 / C2-5**（无 destroy、document 监听器 ×N） | 和 3D 组件 H4 同款债，全局一致问题，统一处理。 |
| **C3-2**（renderDelta innerHTML） | 当前无用户输入流入，实际不构成 XSS，保持现状。 |

**教训 7：不是所有评审项都该立刻修。** 架构性改动（C2-2）如果不把配套的时序问题一起想清楚，改一半会引入更隐蔽的 bug。明确标注「为什么留」比硬上一个半成品强。

---

## R9. 给 Mavis 的 checklist（下次自己评审 / 修复时过一遍）

1. [ ] 改完一个 bug，核对**整条契约**（draw ↔ keypoint、组件 A ↔ 组件 B），不只看自己改的那行。
2. [ ] 数值算法用**真实用例的边界**测（相切、重根、Δ=0、高次），不只测 happy path。
3. [ ] 看到「简单起见」/「暂时」的注释，问一句：n 更大 / 边界场景下还成立吗？
4. [ ] 两处重复的算法，抽成共享 util（顺带降低将来一边修一边没修的漂移风险）。
5. [ ] clientJs 是字符串拼接 —— build 过了不等于没问题，独立校验字符串内容 + 跑数值。
6. [ ] 自评时**端到端跑一下 demo**（拖滑块到极端值），很多不一致只有跑起来才看得见。
7. [ ] 架构性改动想清楚时序配套再动，否则标「为什么留」。
