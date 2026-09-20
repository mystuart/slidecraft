#!/usr/bin/env node
/**
 * check-registry — 组件登记簿一致性校验（v1.10.0 质量守门机制）
 *
 * 比对双向：
 *   1. COMPONENTS.md 概览表的版本列 vs 组件源码顶部 JSDoc @version
 *   2. template/components/*.js 中带 @version 的组件 vs 登记表（防漏登）
 *
 * 背景：quiz-track 曾落后 quiz.js 两个版本（登记行没跟上代码）——
 * 登记簿是这个项目「版本契约」的唯一入口，腐烂必须当场抓住而不是等复审。
 * 特殊映射：quiz-track 与 quiz 共用 quiz.js；chart 等单文件组件同名。
 * 用法：npm run check（或 node scripts/check-registry.js）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REGISTRY = path.join(ROOT, 'COMPONENTS.md');
const COMPONENTS_DIR = path.join(ROOT, 'template', 'components');

// 登记名 → 源码文件（缺省同名；共用文件在此映射）
const NAME_TO_FILE = {
  'quiz-track': 'quiz.js',
};

const registrySource = fs.readFileSync(REGISTRY, 'utf8');

// 1) 解析登记表：| N | name | vX.Y.Z | ...（跳过表头/分隔行/内部工具的文件名即名字的行）
const rows = new Map(); // name → registry version
for (const line of registrySource.split('\n')) {
  const m = /^\|\s*\d+\s*\|\s*([A-Za-z_][\w-]*)\s*\|\s*(v[\d.]+)\s*\|/.exec(line);
  if (m) rows.set(m[1], m[2]);
}
if (rows.size === 0) {
  console.error('[check-registry] 未能从 COMPONENTS.md 解析出任何登记行——表格格式变了？');
  process.exit(1);
}

// 2) 读源码版本
function codeVersion(file) {
  const src = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf8');
  const m = /@version\s+([\d.]+)/.exec(src);
  return m ? 'v' + m[1] : null;
}

let problems = 0;
for (const [name, regVer] of rows) {
  const file = NAME_TO_FILE[name] || (name + '.js');
  const fp = path.join(COMPONENTS_DIR, file);
  if (!fs.existsSync(fp)) {
    console.error(`✗ ${name}: 登记为 ${regVer}，但源码文件 ${file} 不存在`);
    problems += 1;
    continue;
  }
  const ver = codeVersion(file);
  if (!ver) {
    console.error(`✗ ${name}: ${file} 顶部 JSDoc 没有 @version 标注`);
    problems += 1;
  } else if (ver !== regVer) {
    console.error(`✗ ${name}: 登记簿 ${regVer} vs 源码 ${ver}（${file}）——有一边忘了同步`);
    problems += 1;
  }
}

// 3) 反向：带 @version 的源码组件是否都登记了
// 白名单：JSDoc @status 含「不参与组件登记」的内部调度器（如 renderer）按文档决策跳过
for (const file of fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.js'))) {
  const fp = path.join(COMPONENTS_DIR, file);
  const src = fs.readFileSync(fp, 'utf8');
  const ver = codeVersion(file);
  if (!ver) continue; // 内部脚本可以没有 @version
  if (/不参与组件登记/.test(src)) continue;
  const registered = Array.from(rows.entries()).some(([name, regVer]) => {
    return (NAME_TO_FILE[name] || name + '.js') === file && regVer === ver;
  });
  if (!registered) {
    const regRow = Array.from(rows.entries()).find(([name]) => (NAME_TO_FILE[name] || name + '.js') === file);
    if (!regRow) {
      console.error(`✗ ${file} 有 @version ${ver} 但登记簿里没有这个组件`);
    } else {
      continue; // 版本不匹配已在上面报过
    }
    problems += 1;
  }
}

if (problems > 0) {
  console.error(`\n[check-registry] ${problems} 处登记簿与源码不一致`);
  process.exit(1);
}
console.log(`[check-registry] ✓ ${rows.size} 个登记条目与源码版本全部一致`);
