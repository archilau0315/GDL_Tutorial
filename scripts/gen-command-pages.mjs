// 命令页生成器：由 commands.json 生成每条命令的独立页面（中英各一份）
// 目的：让命令进入构建期搜索索引，并被搜索引擎收录（组件渲染的内容不会被索引）
// 用法：node scripts/gen-command-pages.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../docs', import.meta.url))
const DATA = join(ROOT, 'reference', 'data', 'commands.json')
const data = JSON.parse(readFileSync(DATA, 'utf-8'))

const slug = (name) => name.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '')
const catName = (id, loc) => (data.categories.find((c) => c.id === id) || {})[loc] || id
const clean = (s) => String(s).replace(/\s+/g, ' ').trim()

const zhOut = join(ROOT, 'reference', 'commands')
const enOut = join(ROOT, 'en', 'reference', 'commands')
mkdirSync(zhOut, { recursive: true })
mkdirSync(enOut, { recursive: true })

const HEADER = '<!-- 自动生成，请勿手改；数据源 docs/reference/data/commands.json -->'

function page(c, loc) {
  const zh = loc === 'zh'
  const others = data.commands.filter((o) => o.category === c.category && o.name !== c.name)
  const lines = [
    '---',
    `title: ${JSON.stringify(c.name)}`,
    `description: ${JSON.stringify(clean(c.desc[loc]).slice(0, 80))}`,
    '---',
    '',
    HEADER,
    '',
    `# ${c.name}`,
    '',
    zh ? `**分类**：${catName(c.category, 'zh')}` : `**Category**: ${catName(c.category, 'en')}`,
    ...(c.aliases?.[loc]?.length
      ? ['', zh ? `**别名**：${c.aliases[loc].join('、')}` : `**Also known as**: ${c.aliases[loc].join(', ')}`]
      : []),
    '',
    zh ? '## 语法' : '## Syntax',
    '',
    '```gdl',
    c.syntax,
    '```',
    '',
    zh ? '## 参数' : '## Parameters',
    '',
    ...c.params[loc].map((p) => `- ${p}`),
    '',
    zh ? '## 说明' : '## Description',
    '',
    c.desc[loc],
    '',
    zh ? '## 最小示例' : '## Minimal example',
    '',
    '```gdl',
    c.example,
    '```',
    ''
  ]
  if (c.chapter && c.chapter[loc]) {
    lines.push(zh ? '## 相关章节' : '## Related chapter', '', `- [${zh ? '前往学习' : 'Read the chapter'}](${c.chapter[loc]})`, '')
  }
  if (others.length) {
    const base = zh ? '/reference/commands/' : '/en/reference/commands/'
    lines.push(
      zh ? '## 同类命令' : '## Related commands',
      '',
      others.map((o) => `[${o.name}](${base}${slug(o.name)})`).join(' · '),
      ''
    )
  }
  lines.push('---', '', zh ? '返回 [命令速查表](/reference/commands/)' : 'Back to [Command Index](/en/reference/commands/)', '')
  return lines.join('\n')
}

let count = 0
for (const c of data.commands) {
  const name = `${slug(c.name)}.md`
  writeFileSync(join(zhOut, name), page(c, 'zh'), 'utf-8')
  writeFileSync(join(enOut, name), page(c, 'en'), 'utf-8')
  count++
}

// 清理已从数据源删除的命令页，避免孤儿页面导致两语对齐检查失败
const valid = new Set(data.commands.map((c) => `${slug(c.name)}.md`))
for (const dir of [zhOut, enOut]) {
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.md') && f !== 'index.md' && !valid.has(f)) {
      rmSync(join(dir, f))
      console.log(`清理孤儿页: ${f}`)
    }
  }
}

console.log(`命令页生成完成：${count} 条 × 2 语`)
