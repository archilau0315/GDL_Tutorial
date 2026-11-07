/**
 * 速查数据校验：结构完整、中英字段成对、分类与章节链接合法。
 * 覆盖 commands.json 与 globals.json 两份单源数据。
 * 用法：npm run check:data
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsDir = resolve(root, 'docs')
const errors = []

function load(name) {
  return JSON.parse(readFileSync(resolve(root, 'docs/reference/data', name), 'utf8'))
}

/** 中英字段成对校验，返回该语言下应检查的章节链接 */
function checkPair(at, field, value, needArray = false) {
  for (const lang of ['zh', 'en']) {
    if (needArray) {
      if (!Array.isArray(value?.[lang]) || !value[lang].length) errors.push(`${at}: 缺少 ${field}.${lang}`)
      else if (value[lang].some(v => typeof v !== 'string' || !v.trim())) errors.push(`${at}: ${field}.${lang} 含空值`)
    } else if (!value?.[lang]?.trim()) {
      errors.push(`${at}: 缺少 ${field}.${lang}`)
    }
  }
}

function checkChapter(at, chapter) {
  if (!chapter) return
  for (const lang of ['zh', 'en']) {
    const link = chapter[lang]
    if (link && !existsSync(resolve(docsDir, link.replace(/^\//, '') + '.md'))) {
      errors.push(`${at}: 章节文件不存在 ${link}`)
    }
  }
}

/* ---------- 命令 ---------- */
const cmd = load('commands.json')
const cmdCats = new Set((cmd.categories ?? []).map(c => c.id))
const cmdNames = new Set()
if (!cmd.meta?.version) errors.push('commands: 缺少 meta.version')

for (const c of cmd.commands ?? []) {
  const at = `命令 ${c.name ?? '(无名)'}`
  if (!c.name) errors.push(`${at}: 缺少 name`)
  if (cmdNames.has(c.name)) errors.push(`${at}: 命令名重复`)
  cmdNames.add(c.name)
  if (!cmdCats.has(c.category)) errors.push(`${at}: 未知分类 ${c.category}`)
  if (!c.syntax?.trim()) errors.push(`${at}: 缺少 syntax`)
  if (!c.example?.trim()) errors.push(`${at}: 缺少 example`)
  checkPair(at, 'desc', c.desc)
  checkPair(at, 'params', c.params, true)
  if (c.aliases) checkPair(at, 'aliases', c.aliases, true)
  checkChapter(at, c.chapter)
}

/* ---------- GLOB 变量 ---------- */
const glob = load('globals.json')
const globCats = new Set((glob.categories ?? []).map(c => c.id))
const globNames = new Set()
const KINDS = new Set(['number', 'string', 'array'])
if (!glob.meta?.version) errors.push('globals: 缺少 meta.version')

for (const g of glob.globals ?? []) {
  const at = `变量 ${g.name ?? '(无名)'}`
  if (!g.name) errors.push(`${at}: 缺少 name`)
  else if (!/^GLOB_/.test(g.name)) errors.push(`${at}: 变量名应以 GLOB_ 开头`)
  if (globNames.has(g.name)) errors.push(`${at}: 变量名重复`)
  globNames.add(g.name)
  if (!globCats.has(g.category)) errors.push(`${at}: 未知分类 ${g.category}`)
  if (!KINDS.has(g.type)) errors.push(`${at}: 未知类型 ${g.type}`)
  if (!g.example?.trim()) errors.push(`${at}: 缺少 example`)
  checkPair(at, 'desc', g.desc)
  if (g.aliases) checkPair(at, 'aliases', g.aliases, true)
  checkChapter(at, g.chapter)
}

if (errors.length) {
  console.error(`速查数据校验失败（${errors.length} 项）：`)
  errors.forEach(e => console.error('  - ' + e))
  process.exit(1)
}
console.log(
  `速查数据校验通过：${cmd.commands.length} 条命令 / ${cmd.categories.length} 类，` +
  `${glob.globals.length} 个 GLOB 变量 / ${glob.categories.length} 类`
)
