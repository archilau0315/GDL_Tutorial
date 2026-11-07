// 搜索验收：按 VitePress local search 同等配置重建索引，实测查询命中率
// 用法：node scripts/check-search.mjs [--default]   --default 用 VitePress 原始分词做对比
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import MiniSearch from 'minisearch'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'docs')
const useCjk = !process.argv.includes('--default')

// 中文二元分词：整串 + 每个相邻二字组合，解决「堆栈」查不到「变换堆栈」的问题
function cjkTokenize(text) {
  const out = []
  for (const part of text.split(/[^\p{L}\p{N}_]+/u)) {
    if (!part) continue
    if (!/[\u4e00-\u9fff]/.test(part)) { out.push(part.toLowerCase()); continue }
    out.push(part)
    for (let i = 0; i < part.length - 1; i++) out.push(part.slice(i, i + 2))
  }
  return out
}

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (!['.vitepress', 'public'].includes(name)) walk(p) }
    else if (name.endsWith('.md')) files.push(p)
  }
}
for (const d of ['guide', 'reference', 'playground']) walk(join(root, d))

const docs = files.map((f) => {
  const raw = readFileSync(f, 'utf-8')
  const title = (raw.match(/^#\s+(.+)$/m) || [, ''])[1]
  return {
    id: relative(root, f).replace(/\\/g, '/').replace(/\.md$/, ''),
    title,
    titles: [title],
    text: raw.replace(/^---[\s\S]*?---/, '').replace(/[#>*`|\-]/g, ' ').replace(/\s+/g, ' ')
  }
})

const options = { fields: ['title', 'titles', 'text'], storeFields: ['title', 'titles'] }
if (useCjk) options.tokenize = cjkTokenize
const index = new MiniSearch(options)
index.addAll(docs)

// 查询 → 期望命中的页面（任一出现在前 5 即算通过）
const cases = [
  ['BLOCK', ['reference/commands/block', 'guide/part1-basics/01-first-3d-object']],
  ['PRISM_', ['guide/part2-intermediate/06-prism-family', 'reference/commands/prism-']],
  ['REVOLVE', ['guide/part2-intermediate/07-sweeps-and-revolves', 'reference/commands/revolve']],
  ['MATERIAL', ['guide/part2-intermediate/08-materials', 'reference/commands/material']],
  ['ADDX', ['guide/part1-basics/02-transform-stack', 'reference/commands/addx']],
  ['TEXT2', ['guide/part1-basics/04-2d-script', 'guide/part2-intermediate/11-text-and-strings', 'reference/commands/text2']],
  ['变换堆栈', ['guide/part1-basics/02-transform-stack']],
  ['堆栈', ['guide/part1-basics/02-transform-stack']],
  ['参数化柜体', ['guide/part2-intermediate/12-practice-furniture']],
  ['柜体', ['guide/part2-intermediate/12-practice-furniture']],
  ['门窗', ['guide/part2-intermediate/10-doors-and-windows']],
  ['材质', ['guide/part2-intermediate/08-materials', 'reference/commands/material']],
  ['放样', ['guide/part2-intermediate/07-sweeps-and-revolves']],
  ['挤出', ['guide/part2-intermediate/07-sweeps-and-revolves', 'reference/commands/extrude']],
  ['圆弧', ['guide/part1-basics/04-2d-script', 'reference/commands/arc2']],
  ['热点', ['reference/commands/hotspot2', 'guide/part1-basics/04-2d-script']],
  ['立方体', ['reference/commands/block']]
]

let pass = 0
const failed = []
for (const [q, expect] of cases) {
  const hits = index.search(q, { prefix: true, fuzzy: 0.2 }).slice(0, 5).map((h) => h.id)
  const ok = expect.some((e) => hits.includes(e))
  if (ok) pass++
  else failed.push(`${q} → ${hits[0] || '无结果'}`)
  console.log(`${ok ? '✔' : '✘'} ${q.padEnd(10)} ${hits.slice(0, 2).join(' , ') || '—'}`)
}

const rate = Math.round((pass / cases.length) * 100)
console.log(`\n${useCjk ? '中文二元分词（站点现用配置）' : 'VitePress 原始分词（对比基线）'}：${pass}/${cases.length} 命中，${rate}%`)
if (failed.length) console.log('未命中：' + failed.join('；'))
process.exit(rate >= 95 ? 0 : 1)
