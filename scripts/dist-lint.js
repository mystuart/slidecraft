#!/usr/bin/env node
/**
 * dist-lint — 产物气味检查（v1.10.0 质量守门机制）
 *
 * 逐个扫描 dist/*.html，抓「能 build 但不该上线」的已知病症：
 *   - class="katex-error"          公式静默降级残留
 *   - <!--SC-COMPONENT-N-->        组件占位符未替换（管线断裂）
 *   - data-feedback-*              已废弃的属性传值渠道（v0.3.2 泄漏 bug 的残骸）
 *   - >undefined< / >NaN<          运行时/模板拼接垃圾进入正文
 *   - href="#section-N" 无对应 id  侧栏/搜索锚点死链
 *
 * build 期校验（build.js）管「源数据合法性」，本脚本管「产物最终形态」——
 * 两道闸互相独立，防的是不同环节的回归。
 * 用法：node build.js && npm run check
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('[dist-lint] dist/ 不存在——先跑 node build.js');
  process.exit(1);
}

const files = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
if (files.length === 0) {
  console.error('[dist-lint] dist/ 里没有产物——先跑 node build.js');
  process.exit(1);
}

let problemCount = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(DIST, file), 'utf8');
  const problems = [];

  if (/class="katex-error"/.test(html)) {
    problems.push('存在 katex-error（公式解析失败残留，build 日志应有对应报告）');
  }
  if (/<!--\s*SC-COMPONENT-\d+\s*-->/.test(html)) {
    problems.push('存在未替换的组件占位符（提取/合并管线断裂）');
  }
  if (/data-feedback-(correct|wrong)=/.test(html)) {
    problems.push('存在已废弃的 data-feedback-* 属性（v0.3.2 泄漏 bug 的旧渠道）');
  }
  const junkText = html.match(/>(?:undefined|NaN)</g);
  if (junkText) {
    problems.push(`正文出现 ${junkText.length} 处 undefined/NaN 文本（模板拼接垃圾）`);
  }
  // 锚点死链：页面里每个 #section-N 引用都要有对应 id
  const anchorIds = new Set();
  let m;
  const idRe = /\bid="(section-\d+)"/g;
  while ((m = idRe.exec(html)) !== null) anchorIds.add(m[1]);
  const hrefRe = /href="#(section-\d+)"/g;
  const missing = new Set();
  while ((m = hrefRe.exec(html)) !== null) {
    if (!anchorIds.has(m[1])) missing.add(m[1]);
  }
  if (missing.size > 0) {
    problems.push('锚点死链（引用了不存在的 section）：' + Array.from(missing).join(', '));
  }

  if (problems.length > 0) {
    problemCount += problems.length;
    console.error('✗ ' + file);
    problems.forEach(p => console.error('    - ' + p));
  }
}

if (problemCount > 0) {
  console.error(`\n[dist-lint] ${files.length} 个产物中发现 ${problemCount} 处问题`);
  process.exit(1);
}
console.log(`[dist-lint] ✓ ${files.length} 个产物无已知病症`);
