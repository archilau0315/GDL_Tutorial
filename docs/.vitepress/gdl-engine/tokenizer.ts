/**
 * GDL 词法分析器：源码 → Token 流。
 * 规则（MVP 范围）：
 * - 注释：'!' 到行尾
 * - 行分隔：换行即语句分隔（GDL 约定）
 * - 标识符：字母/下划线开头，大小写不敏感（统一大写）
 * - 数字：十进制 + 小数点，支持 1. 与 .5
 * - 字符串：双引号（转义 "" 表示一个引号）
 */
import type { GdlError, Token } from './types'
import { makeError } from './errors'

const OPS = ['<>', '<=', '>=', '+', '-', '*', '/', '^', '(', ')', ',', '=', '<', '>']

export function tokenize(src: string): { tokens: Token[]; errors: GdlError[] } {
  const tokens: Token[] = []
  const errors: GdlError[] = []
  let i = 0, line = 1, col = 1

  const push = (t: Omit<Token, 'line' | 'col'>) => tokens.push({ ...t, line, col })

  while (i < src.length) {
    const ch = src[i]

    // 换行 → 语句分隔
    if (ch === '\n') {
      push({ type: 'newline', value: '\n' })
      i++; line++; col = 1
      continue
    }
    if (ch === '\r') { i++; continue }
    if (ch === ' ' || ch === '\t') { i++; col++; continue }

    // 注释
    if (ch === '!') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }

    const startCol = col

    // 字符串
    if (ch === '"') {
      i++; col++
      let s = ''
      let closed = false
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') { s += '"'; i += 2; col += 2; continue }
          i++; col++; closed = true; break
        }
        if (src[i] === '\n') break
        s += src[i]; i++; col++
      }
      if (!closed) errors.push(makeError('lexer', 'unterminatedString', { line, col: startCol }))
      push({ type: 'string', value: s })
      continue
    }

    // 数字
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let s = ''
      while (i < src.length && /[0-9.]/.test(src[i])) { s += src[i]; i++; col++ }
      if ((s.match(/\./g) ?? []).length > 1) {
        errors.push(makeError('lexer', 'unexpectedChar', { line, col: startCol }, { tok: s }))
      }
      push({ type: 'number', value: s, num: parseFloat(s) })
      continue
    }

    // 标识符 / 关键字（统一大写）
    if (/[A-Za-z_]/.test(ch)) {
      let s = ''
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) { s += src[i]; i++; col++ }
      push({ type: 'ident', value: s.toUpperCase() })
      continue
    }

    // 运算符（双字符优先）
    const two = src.slice(i, i + 2)
    if (OPS.includes(two)) { push({ type: 'op', value: two }); i += 2; col += 2; continue }
    if (OPS.includes(ch)) { push({ type: 'op', value: ch }); i++; col++; continue }

    errors.push(makeError('lexer', 'unexpectedChar', { line, col: startCol }, { tok: ch }))
    i++; col++
  }

  push({ type: 'eof', value: '' })
  return { tokens, errors }
}
