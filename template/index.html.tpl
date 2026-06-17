<!DOCTYPE html>
<html lang="zh-CN" data-theme="{{THEME}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <meta name="description" content="{{SUBTITLE}}">
  <meta name="author" content="{{AUTHOR}}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%238b7dd8'/%3E%3Cpath d='M16 6 L26 16 L16 26 L6 16 Z' fill='none' stroke='white' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E">
  <!-- Open Graph / Twitter Card（社交分享预览） -->
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{SUBTITLE}}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{{OG_IMAGE}}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{SUBTITLE}}">
  <meta name="twitter:image" content="{{OG_IMAGE}}">
  <style>
{{CSS}}
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-title">{{TITLE}}</div>
        {{SUBTITLE_TAG}}
      </div>
      <nav class="side-nav" aria-label="章节导航">
        <ol>
          {{NAV_ITEMS}}
        </ol>
      </nav>
      <div class="sidebar-footer">{{AUTHOR}}</div>
    </aside>

    <main class="content">
      <article class="article">
{{CONTENT}}
      </article>
    </main>
  </div>

  {{THREE_SCRIPT}}
  <script>
{{CLIENT_JS}}
  </script>
</body>
</html>
