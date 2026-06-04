<!DOCTYPE html>
<html lang="zh-CN" data-theme="{{THEME}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <meta name="description" content="{{SUBTITLE}}">
  <meta name="author" content="{{AUTHOR}}">
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

  <script>
{{CLIENT_JS}}
  </script>
</body>
</html>
