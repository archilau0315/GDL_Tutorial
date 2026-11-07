/**
 * 速查数据校验：结构完整、中英字段成对、分类与章节链接合法。
 * 用法：npm run check:data
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(root, 'docs/reference/data/commands.json')
const docsDir = resolve(root, 'docs')

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const errors = []
const catIds = new Set((data.categories ?? []).map(c => c.id))
const names = new Set()

if (!data.meta?.version) errors.push('缺少 meta.version')

for (const c of data.commands ?? []) {
  const at = `命令 ${c.name ?? '(无名)'}`
  if (!c.name) errors.push(`${at}: 缺少 name`)
  if (names.has(c.name)) errors.push(`${at}: 命令名重复`)
  names.add(c.name)

  if (!catIds.has(c.category)) errors.push(`${at}: 未知分类 ${c.category}`)
  if (!c.syntax?.trim()) errors.push(`${at}: 缺少 syntax`)
  if (!c.example?.trim()) errors.push(`${at}: 缺少 example`)

  for (const lang of ['zh', 'en']) {
    if (!c.desc?.[lang]?.trim()) errors.push(`${at}: 缺少 desc.${lang}`)
    if (!Array.isArray(c.params?.[lang]) || !c.params[lang].length) errors.push(`${at}: 缺少 params.${lang}`)
    // aliases 可选，但一旦出现必须中英成对、非空字符串（参与站内搜索）
    if (c.aliases) {
      const list = c.aliases[lang]
      if (!Array.isArray(list) || !list.length) errors.push(`${at}: aliases.${lang} 缺失或为空`)
      else if (list.some(a => typeof a !== 'string' || !a.trim())) errors.push(`${at}: aliases.${lang} 含空值`)
    }
    const chapter = c.chapter?.[lang]
    if (chapter && !existsSync(resolve(docsDir, chapter.replace(/^\//, '') + '.md'))) {
      errors.push(`${at}: 章节文件不存在 ${chapter}`)
    }
  }
}

if (errors.length) {
  console.error(`速查数据校验失败（${errors.length} 项）：`)
  errors.forEach(e => console.error('  - ' + e))
  process.exit(1)
}
console.log(`速查数据校验通过：${data.commands.length} 条命令，${data.categories.length} 个分类`)
