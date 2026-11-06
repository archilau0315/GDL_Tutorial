/**
 * GDL 语法分析器：Token 流 → AST。
 * MVP 语法范围：
 *   赋值   NAME = expr        （可选 LET 前缀）
 *   命令   NAME arg, arg, ...  （含无参命令 ENDIF/ELSE/NEXT）
 *   条件   IF cond ... [ELSE ...] ENDIF
 *   循环   FOR NAME = e TO e [STEP e] ... NEXT [NAME]
 */
import type { Expr, GdlError, Pos, Stmt, Token } from './types'
import { makeError } from './errors'

const BLOCK_ENDERS = new Set(['ENDIF', 'ELSE', 'NEXT', 'ENDWHILE'])

/** 标签形式：数字或字符串后跟冒号（如 `100:`） */

export function parse(tokens: Token[]): { ast: Stmt[]; errors: GdlError[] } {
  const p = new Parser(tokens)
  const ast = p.parseProgram()
  return { ast, errors: p.errors }
}

class Parser {
  private i = 0
  readonly errors: GdlError[] = []

  constructor(private tokens: Token[]) {}

  /* ---------- 基础游标 ---------- */
  private peek(k = 0): Token {
    return this.tokens[Math.min(this.i + k, this.tokens.length - 1)]
  }
  private next(): Token { return this.tokens[this.i++] }
  private at(type: string, value?: string): boolean {
    const t = this.peek()
    return t.type === type && (value === undefined || t.value === value)
  }
  private skipNewlines(): void {
    while (this.at('newline')) this.i++
  }
  private eatNewlines(): void {
    while (this.at('newline')) this.i++
  }
  private err(kind: any, key: any, pos: Pos, kv?: any): void {
    this.errors.push(makeError(kind, key, pos, kv ?? {}))
  }

  /* ---------- 程序 ---------- */
  parseProgram(): Stmt[] {
    const stmts: Stmt[] = []
    this.skipNewlines()
    while (!this.at('eof')) {
      const before = this.i
      const s = this.parseStatement()
      if (s) stmts.push(s)
      // 防死循环：游标未推进时跳过一个 token
      if (this.i === before) this.next()
      this.skipNewlines()
    }
    return stmts
  }

  /* ---------- 语句 ---------- */
  private parseStatement(): Stmt | null {
    const t = this.peek()
    // 标签：数字或字符串字面量后跟冒号（GOSUB 跳转目标）
    if ((t.type === 'number' || t.type === 'string') && this.peek(1).type === 'op' && this.peek(1).value === ':') {
      this.i += 2
      return { kind: 'label', value: String(t.type === 'number' ? t.num! : t.value), pos: t }
    }
    if (t.type !== 'ident') {
      // 跳到行尾
      while (!this.at('newline') && !this.at('eof')) this.i++
      this.err('syntax', 'unexpectedToken', t, { tok: t.value || (t.type === 'newline' ? '换行' : t.value) })
      return null
    }
    const name = t.value
    if (name === 'IF') return this.parseIf()
    if (name === 'FOR') return this.parseFor()
    if (name === 'WHILE') return this.parseWhile()
    if (name === 'GOSUB') {
      this.i++
      const target = this.parseExpr()
      return { kind: 'gosub', target, pos: t }
    }
    if (name === 'RETURN') { this.i++; return { kind: 'return', pos: t } }
    if (name === 'END') { this.i++; return { kind: 'end', pos: t } }
    if (name === 'ENDIF' || name === 'ELSE' || name === 'NEXT' || name === 'ENDWHILE') {
      this.err('syntax', name === 'ENDIF' ? 'dupEndif' : name === 'ELSE' ? 'elseWithoutIf' : name === 'NEXT' ? 'nextWithoutFor' : 'dupEndwhile', t)
      this.i++
      return null
    }
    if (name === 'LET') {
      this.i++
      return this.parseAssign(t)
    }
    // 赋值 vs 命令：IDENT '=' → 赋值；否则命令
    if (this.peek(1).type === 'op' && this.peek(1).value === '=') {
      return this.parseAssign(t)
    }
    return this.parseCommand()
  }

  private parseAssign(start: Token): Stmt | null {
    const nameTok = this.peek()
    if (nameTok.type !== 'ident') {
      this.err('syntax', 'unexpectedToken', nameTok, { tok: nameTok.value })
      while (!this.at('newline') && !this.at('eof')) this.i++
      return null
    }
    this.i++ // IDENT
    const eq = this.next()
    if (!(eq.type === 'op' && eq.value === '=')) {
      this.err('syntax', 'expectedEqual', eq)
    }
    const value = this.parseExpr()
    return { kind: 'assign', name: nameTok.value, value, pos: start }
  }

  private parseCommand(): Stmt | null {
    const nameTok = this.next()
    const args: Expr[] = []
    if (!this.at('newline') && !this.at('eof') && !this.at('op', ',')) {
      args.push(this.parseExpr())
      // 逗号后可跨行：PRISM 顶点表、POLY2_ 状态位序列的标准写法
      while (this.at('op', ',')) {
        this.i++
        this.skipNewlines()
        if (this.at('eof')) break
        args.push(this.parseExpr())
      }
    }
    return { kind: 'cmd', name: nameTok.value, args, pos: nameTok }
  }

  private parseIf(): Stmt {
    const start = this.next() // IF
    const cond = this.parseExpr()
    // THEN 可选；单行式：IF cond THEN stmt [ELSE stmt]（无 ENDIF）
    if (this.at('ident', 'THEN')) {
      this.i++
      if (!this.at('newline') && !this.at('eof')) {
        const then = [this.parseStatement()!]
        if (this.at('ident', 'ELSE')) {
          this.i++
          const elseB = [this.parseStatement()!]
          return { kind: 'if', cond, then, else: elseB, pos: start }
        }
        return { kind: 'if', cond, then, else: [], pos: start }
      }
    }
    const then: Stmt[] = []
    const elseB: Stmt[] = []
    let sawElse = false
    let closed = false
    this.eatNewlines()
    while (!this.at('eof')) {
      if (this.at('ident', 'ENDIF')) { this.i++; closed = true; break }
      if (this.at('ident', 'ELSE')) {
        if (sawElse) this.err('syntax', 'elseWithoutIf', this.peek())
        this.i++; sawElse = true; this.eatNewlines(); continue
      }
      if (BLOCK_ENDERS.has(this.peek().value) && this.peek().type === 'ident') {
        // 嵌套控制块交给 parseStatement 处理
      }
      const before = this.i
      const s = this.parseStatement()
      if (s) (sawElse ? elseB : then).push(s)
      if (this.i === before) this.i++
      this.eatNewlines()
    }
    if (!closed) this.err('syntax', 'expectedEndif', start)
    return { kind: 'if', cond, then, else: elseB, pos: start }
  }

  private parseWhile(): Stmt {
    const start = this.next() // WHILE
    const cond = this.parseExpr()
    if (this.at('ident', 'DO')) this.i++
    const body: Stmt[] = []
    let closed = false
    this.eatNewlines()
    while (!this.at('eof')) {
      if (this.at('ident', 'ENDWHILE')) { this.i++; closed = true; break }
      const before = this.i
      const s = this.parseStatement()
      if (s) body.push(s)
      if (this.i === before) this.i++
      this.eatNewlines()
    }
    if (!closed) this.err('syntax', 'expectedEndwhile', start)
    return { kind: 'while', cond, body, pos: start }
  }

  private parseFor(): Stmt {
    const start = this.next() // FOR
    const nameTok = this.next()
    if (nameTok.type !== 'ident') {
      this.err('syntax', 'unexpectedToken', nameTok, { tok: nameTok.value })
      return { kind: 'for', varName: '_', from: zero(), to: zero(), body: [], pos: start }
    }
    const eq = this.next()
    if (!(eq.type === 'op' && eq.value === '=')) this.err('syntax', 'expectedEqual', eq)
    const from = this.parseExpr()
    if (!this.at('ident', 'TO')) this.err('syntax', 'expectedTo', this.peek())
    else this.i++
    const to = this.parseExpr()
    let step: Expr | undefined
    if (this.at('ident', 'STEP')) { this.i++; step = this.parseExpr() }
    const body: Stmt[] = []
    let closed = false
    this.eatNewlines()
    while (!this.at('eof')) {
      if (this.at('ident', 'NEXT')) {
        this.i++
        if (this.peek().type === 'ident') this.i++ // NEXT 后的循环变量名（可选）
        closed = true
        break
      }
      const before = this.i
      const s = this.parseStatement()
      if (s) body.push(s)
      if (this.i === before) this.i++
      this.eatNewlines()
    }
    if (!closed) this.err('syntax', 'expectedNext', start)
    return { kind: 'for', varName: nameTok.value, from, to, step, body, pos: start }
  }

  /* ---------- 表达式（优先级爬升） ----------
   * GDL 优先级（低到高）：OR、AND、比较、加减、乘除与 MOD、一元负号、幂、原子
   */
  private parseExpr(): Expr { return this.parseOr() }

  private parseOr(): Expr {
    let left = this.parseAnd()
    while (this.at('ident', 'OR')) { const op = this.next(); const right = this.parseAnd(); left = { kind: 'binary', op: 'OR', left, right, pos: op } }
    return left
  }
  private parseAnd(): Expr {
    let left = this.parseCompare()
    while (this.at('ident', 'AND')) { const op = this.next(); const right = this.parseCompare(); left = { kind: 'binary', op: 'AND', left, right, pos: op } }
    return left
  }
  private parseCompare(): Expr {
    let left = this.parseAdd()
    while (this.at('op', '=') || this.at('op', '<>') || this.at('op', '<') || this.at('op', '>') || this.at('op', '<=') || this.at('op', '>=')) {
      const op = this.next()
      const right = this.parseAdd()
      left = { kind: 'binary', op: op.value, left, right, pos: op }
    }
    return left
  }
  private parseAdd(): Expr {
    let left = this.parseMul()
    while (this.at('op', '+') || this.at('op', '-')) {
      const op = this.next()
      const right = this.parseMul()
      left = { kind: 'binary', op: op.value, left, right, pos: op }
    }
    return left
  }
  private parseMul(): Expr {
    let left = this.parseUnary()
    while (this.at('op', '*') || this.at('op', '/') || this.at('ident', 'MOD')) {
      const op = this.next()
      const right = this.parseUnary()
      left = { kind: 'binary', op: op.type === 'ident' ? 'MOD' : op.value, left, right, pos: op }
    }
    return left
  }
  private parseUnary(): Expr {
    if (this.at('op', '-') || this.at('op', '+')) {
      const op = this.next()
      const arg = this.parseUnary()
      return { kind: 'unary', op: op.value as '-' | '+', arg, pos: op }
    }
    if (this.at('ident', 'NOT')) {
      const op = this.next()
      const arg = this.parseUnary()
      return { kind: 'unary', op: '-', arg: { kind: 'call', name: '__NOT', args: [arg], pos: op }, pos: op }
    }
    return this.parsePow()
  }
  private parsePow(): Expr {
    const base = this.parseAtom()
    if (this.at('op', '^')) {
      const op = this.next()
      const exp = this.parseUnary() // 右结合
      return { kind: 'binary', op: '^', left: base, right: exp, pos: op }
    }
    return base
  }
  private parseAtom(): Expr {
    const t = this.peek()
    if (t.type === 'number') { this.i++; return { kind: 'num', value: t.num!, pos: t } }
    if (t.type === 'string') { this.i++; return { kind: 'str', value: t.value, pos: t } }
    if (t.type === 'op' && t.value === '(') {
      this.i++
      const e = this.parseExpr()
      if (this.at('op', ')')) this.i++
      else this.err('syntax', 'unexpectedToken', this.peek(), { tok: this.peek().value })
      return e
    }
    if (t.type === 'ident') {
      this.i++
      if (this.at('op', '(')) {
        this.i++
        const args: Expr[] = []
        if (!this.at('op', ')')) {
          args.push(this.parseExpr())
          while (this.at('op', ',')) { this.i++; args.push(this.parseExpr()) }
        }
        if (this.at('op', ')')) this.i++
        else this.err('syntax', 'unexpectedToken', this.peek(), { tok: this.peek().value })
        return { kind: 'call', name: t.value, args, pos: t }
      }
      return { kind: 'var', name: t.value, pos: t }
    }
    this.err('syntax', 'expectedExpr', t)
    if (!this.at('newline') && !this.at('eof')) this.i++
    return zero()
  }
}

function zero(): Expr { return { kind: 'num', value: 0, pos: { line: 1, col: 1 } } }
