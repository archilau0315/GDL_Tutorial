/**
 * 速查数据校验：结构完整、中英字段成对、分类与章节链接合法。
 * 覆盖 commands / globals / snippets / errors / glossary / chapters 六份单源数据。
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
    if (!link) continue
    const rel = link.replace(/^\//, '')
    const file = rel.endsWith('/') ? rel + 'index.md' : rel + '.md'
    if (!existsSync(resolve(docsDir, file))) errors.push(`${at}: 章节文件不存在 ${link}`)
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

/* ---------- 代码片段 ---------- */
const snip = load('snippets.json')
const snipCats = new Set((snip.categories ?? []).map(c => c.id))
const snipIds = new Set()
if (!snip.meta?.version) errors.push('snippets: 缺少 meta.version')

for (const s of snip.snippets ?? []) {
  const at = `片段 ${s.id ?? '(无 id)'}`
  if (!s.id) errors.push(`${at}: 缺少 id`)
  if (snipIds.has(s.id)) errors.push(`${at}: id 重复`)
  snipIds.add(s.id)
  if (!snipCats.has(s.category)) errors.push(`${at}: 未知分类 ${s.category}`)
  if (!s.code?.trim()) errors.push(`${at}: 缺少 code`)
  if (typeof s.sandbox !== 'boolean') errors.push(`${at}: sandbox 必须是布尔值`)
  checkPair(at, 'title', s.title)
  checkPair(at, 'desc', s.desc)
  checkPair(at, 'tags', s.tags, true)
  checkChapter(at, s.chapter)
}

/* ---------- 错误手册 ---------- */
const err = load('errors.json')
const errCats = new Set((err.categories ?? []).map(c => c.id))
const errIds = new Set()
if (!err.meta?.version) errors.push('errors: 缺少 meta.version')

for (const e of err.errors ?? []) {
  const at = `错误 ${e.id ?? '(无 id)'}`
  if (!e.id) errors.push(`${at}: 缺少 id`)
  if (errIds.has(e.id)) errors.push(`${at}: id 重复`)
  errIds.add(e.id)
  if (!errCats.has(e.category)) errors.push(`${at}: 未知分类 ${e.category}`)
  if (!e.bad?.trim() || !e.good?.trim()) errors.push(`${at}: 缺少 bad/good 对照代码`)
  checkPair(at, 'message', e.message)
  checkPair(at, 'cause', e.cause)
  checkPair(at, 'fix', e.fix)
  checkChapter(at, e.chapter)
}

/* ---------- 术语表 ---------- */
const gloss = load('glossary.json')
const glossCats = new Set((gloss.categories ?? []).map(c => c.id))
const glossIds = new Set()
if (!gloss.meta?.version) errors.push('glossary: 缺少 meta.version')

for (const g of gloss.terms ?? []) {
  const at = `术语 ${g.id ?? '(无 id)'}`
  if (!g.id) errors.push(`${at}: 缺少 id`)
  if (glossIds.has(g.id)) errors.push(`${at}: id 重复`)
  glossIds.add(g.id)
  if (!glossCats.has(g.category)) errors.push(`${at}: 未知分类 ${g.category}`)
  checkPair(at, 'term', g.term)
  checkPair(at, 'desc', g.desc)
  if (g.aka) checkPair(at, 'aka', g.aka, true)
  checkChapter(at, g.chapter)
}

/* ---------- 章节清单 ---------- */
const book = load('chapters.json')
const partIds = new Set((book.parts ?? []).map(p => p.id))
const chapterIds = new Set()
const chapterNums = new Set()
if (!book.meta?.version) errors.push('chapters: 缺少 meta.version')

for (const p of book.parts ?? []) {
  checkPair(`分部 ${p.id ?? '(无 id)'}`, 'title', p.title)
  if (!p.sheet?.trim()) errors.push(`分部 ${p.id}: 缺少 sheet`)
}

for (const c of book.chapters ?? []) {
  const at = `章节 ${c.id ?? '(无 id)'}`
  if (!c.id) errors.push(`${at}: 缺少 id`)
  if (chapterIds.has(c.id)) errors.push(`${at}: id 重复`)
  chapterIds.add(c.id)
  if (typeof c.num !== 'number' || c.num < 0) errors.push(`${at}: num 必须是非负数字`)
  else if (chapterNums.has(c.num)) errors.push(`${at}: 章号重复 ${c.num}`)
  else chapterNums.add(c.num)
  if (!partIds.has(c.part)) errors.push(`${at}: 未知分部 ${c.part}`)
  checkPair(at, 'title', c.title)
  checkPair(at, 'href', c.href)
  checkChapter(at, c.href)
  if (c.href) {
    for (const lang of ['zh', 'en']) {
      const prefix = lang === 'en' ? '/en/guide/' : '/guide/'
      if (!c.href[lang]?.startsWith(prefix)) errors.push(`${at}: href.${lang} 应以 ${prefix} 开头`)
    }
  }
}

if (errors.length) {
  console.error(`速查数据校验失败（${errors.length} 项）：`)
  errors.forEach(e => console.error('  - ' + e))
  process.exit(1)
}
console.log(
  `速查数据校验通过：${cmd.commands.length} 条命令 / ${cmd.categories.length} 类，` +
  `${glob.globals.length} 个 GLOB 变量 / ${glob.categories.length} 类，` +
  `${snip.snippets.length} 个片段 / ${snip.categories.length} 类，` +
  `${err.errors.length} 条错误 / ${err.categories.length} 类，` +
  `${gloss.terms.length} 个术语 / ${gloss.categories.length} 类，` +
  `${book.chapters.length} 章 / ${book.parts.length} 个分部`
)
