# Slidecraft

[中文](./README.md) · **English**

> Write one Markdown, ship one self-contained interactive HTML.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Components: 23](https://img.shields.io/badge/components-23-green.svg)](./COMPONENTS.md)

**23 built-in components · single-file output · zero runtime · themable · print-friendly.**

Slidecraft is a Markdown-to-HTML compiler for interactive teaching material. You write structured Markdown with frontmatter and fenced component blocks; it compiles to one self-contained `.html` file you can email, host anywhere, or open offline. No JS framework, no build server, no runtime dependencies.

---

## Why Slidecraft

| | Marp / Slidev | reveal.js | Reveal/Pandoc | **Slidecraft** |
|---|---|---|---|---|
| Runtime deps | Bundler / Vue | JS lib | JS lib | **Zero** |
| Output | Deck / SPA | SPA | SPA | **Single HTML file** |
| Components | ✅ (plugins) | ✅ (plugins) | ❌ | **✅ 23 built-in** |
| Math (LaTeX) | via plugin | manual | ✅ | **✅ KaTeX, compile-time** |
| 3D geometry | ❌ | ❌ | ❌ | **✅ Three.js, opt-in** |
| Print / PDF | partial | ❌ | ✅ | **✅** |

The differentiator: **everything compiles to a single static HTML file** with math rendered, 3D optional, zero runtime. Open it on any device, no server.

## 30-second quickstart

```bash
git clone https://github.com/mystuart/slidecraft.git
cd slidecraft
npm install
node build.js content/triangular-prism-demo.md
open dist/triangular-prism-demo.html
```

Development loop:

```bash
npm run dev      # watch + static server (auto-rebuild on .md change)
npm run build    # build all .md in content/
npm test         # run tests (numeric algorithms + build validation)
```

## Component overview (23 built-in)

| Category | Component | What it does |
|---|---|---|
| **Content** | `hero` | Cover headline |
| | `concept-card` | Concept card grid |
| | `callout` | Highlight block (tip/warning/info/danger/note) |
| | `step-guide` | Step-by-step walkthrough |
| | `compare` | Before/after comparison |
| | `timeline` | Timeline (history / process nodes) |
| | `chart` | Data charts (bar / line / pie) |
| | `tabs` | Tabbed comparison (multi-solution / multi-view) |
| | `stat-grid` | Stat card wall (key numbers + trends) |
| | `quote` | Pull quote / highlight |
| | `diagram` | Flowchart / relationship graph (SVG) |
| | `code-runner` | Code + output comparison |
| **Practice** | `quiz` | Single/multiple choice with feedback |
| | `quiz-track` | Quiz progress tracker |
| | `fill-blank` | Fill-in-the-blank |
| | `math-step` | Stepwise solution with collapse + progress |
| **Math** | `formula` | Display math (KaTeX, compile-time) |
| | `geometry-3d` | 3D geometry (rotate/cut/highlight, Three.js) |
| | `coords-2d` | 2D coordinate system |
| | `function-plot` | Function plotting |
| | `intersection-marker` | Intersection points |
| | + 2 more (slider, trajectory, tetra-equiv, cut-anim) | |

Full API: see [`template/components/*.js`](./template/components/) JSDoc headers, or [COMPONENTS.md](./COMPONENTS.md) (Chinese).

## Frontmatter

```yaml
---
title: "Lesson title"
subtitle: "One-line description"
author: "Your name"
theme: lavender      # lavender (default) / dark
sections:            # Sidebar nav, must match your ## h2 count
  - Introduction
  - Core concept
  - Practice
---
```

## Writing a component

Any fenced code block with a component name becomes interactive:

````markdown
```quiz
{
  "question": "What is 2 + 2?",
  "type": "single",
  "options": [
    {"id": "a", "text": "3"},
    {"id": "b", "text": "4"}
  ],
  "correct": ["b"]
}
```
````

See [`content/components-showcase.md`](./content/components-showcase.md) → `dist/components-showcase.html` for live examples of all 17+ components.

## Themes

Built-in: `lavender` (light, default) and `dark`. Add new themes by copying the CSS variable block in [`main.css`](./template/styles/main.css) and setting `theme: yourname` in frontmatter.

## Roadmap

- More components (accordion, code-reviewer)
- External component packages (`slidecraft-component-*`)
- Geometry-3d advanced: clipping plane, three-view, unfold

## Documentation

- **[README.md](./README.md)** — Full Chinese documentation (detailed, with teaching narrative)
- **[SPEC.md](./SPEC.md)** — Architecture spec
- **[COMPONENTS.md](./COMPONENTS.md)** — Component registry + roadmap
- **[CHANGELOG.md](./CHANGELOG.md)** — Version history

## License

[MIT](./LICENSE) © Stuart Ma
