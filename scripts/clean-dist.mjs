// 构建前清空产物：VitePress 不清理旧 hash 分块，多次构建后 dist 会堆积过期文件
import { rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', '.vitepress', 'dist')
rmSync(dist, { recursive: true, force: true })
