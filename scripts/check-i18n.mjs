// CI 两语对齐检查：中英文页面文件必须一一对应，禁止单语孤儿页面
// 用法：node scripts/check-i18n.mjs
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath 才能正确解码中文路径（直接取 pathname 会保留 %E7%BB%9D 之类转义）
const ROOT = fileURLToPath(new URL('../docs', import.meta.url))
const ZH_DIR = join(ROOT)
const EN_DIR = join(ROOT, 'en')

function collect(dir, base) {
  const files = new Set()
  if (!statSync(dir).isDirectory()) return files
  const walk = (d, prefix) => {
    for (const name of readdirSync(d)) {
      if (name === 'en' && d === dir) continue // 跳过英文目录本身
      if (name.startsWith('.') || name === 'public' || name === 'node_modules') continue
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full, prefix + name + '/')
      else if (name.endsWith('.md')) files.add(prefix + name)
    }
  }
  walk(dir, base)
  return files
}

const zh = collect(ZH_DIR, '')
const en = collect(EN_DIR, '')
const missingEn = [...zh].filter(f => !en.has(f))
const missingZh = [...en].filter(f => !zh.has(f))

if (missingEn.length || missingZh.length) {
  console.error('两语文件对齐检查失败 / i18n alignment check failed:')
  for (const f of missingEn) console.error(`  缺英文对应页 missing EN: ${f}`)
  for (const f of missingZh) console.error(`  缺中文对应页 missing ZH: ${f}`)
  process.exit(1)
}
console.log(`两语对齐通过 i18n aligned: ${zh.size} 对页面 pairs`)
