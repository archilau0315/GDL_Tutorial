/**
 * GDL 字节码编译：AST → 扁平指令表 + 跳转目标。
 * 为什么不用递归执行 AST：GOSUB/RETURN 是任意跳转，
 * 一旦在 FOR/WHILE 里调用子程序，递归模型会丢掉整个 JS 调用栈（循环状态），
 * 返回后无法续跑。真实 GDL 也是「程序计数器 + 循环栈」的模型，这里照它做。
 */
import type { Expr, Pos, Stmt } from './types'

export type Instr =
  | { op: 'assign'; name: string; value: Expr }
  | { op: 'cmd'; name: string; args: Expr[]; pos: Pos }
  | { op: 'label'; value: string }
  | { op: 'gosub'; target: Expr; pos: Pos }
  | { op: 'return'; pos: Pos }
  | { op: 'end' }
  /** 条件为假时跳到 falseJump */
  | { op: 'test'; cond: Expr; falseJump: number }
  | { op: 'jump'; to: number }
  | { op: 'forinit'; varName: string; from: Expr; to: Expr; step?: Expr; bodyEnd: number; pos: Pos }
  | { op: 'next'; start: number }

/** 编译整段脚本；索引即程序计数器 */
export function compile(ast: Stmt[]): Instr[] {
  const out: Instr[] = []
  block(ast, out)
  return out
}

function block(body: Stmt[], out: Instr[]): void {
  for (const s of body) stmt(s, out)
}

function stmt(s: Stmt, out: Instr[]): void {
  switch (s.kind) {
    case 'assign':
      out.push({ op: 'assign', name: s.name, value: s.value })
      return
    case 'cmd':
      out.push({ op: 'cmd', name: s.name, args: s.args, pos: s.pos })
      return
    case 'label':
      out.push({ op: 'label', value: s.value })
      return
    case 'gosub':
      out.push({ op: 'gosub', target: s.target, pos: s.pos })
      return
    case 'return':
      out.push({ op: 'return', pos: s.pos })
      return
    case 'end':
      out.push({ op: 'end' })
      return

    case 'if': {
      const test = out.push({ op: 'test', cond: s.cond, falseJump: -1 }) - 1
      block(s.then, out)
      const skip = out.push({ op: 'jump', to: -1 }) - 1
      ;(out[test] as { falseJump: number }).falseJump = out.length
      block(s.else, out)
      ;(out[skip] as { to: number }).to = out.length
      return
    }

    case 'while': {
      const test = out.push({ op: 'test', cond: s.cond, falseJump: -1 }) - 1
      block(s.body, out)
      out.push({ op: 'jump', to: test })
      ;(out[test] as { falseJump: number }).falseJump = out.length
      return
    }

    case 'for': {
      const init = out.push({
        op: 'forinit', varName: s.varName, from: s.from, to: s.to,
        step: s.step, bodyEnd: -1, pos: s.pos
      }) - 1
      block(s.body, out)
      out.push({ op: 'next', start: init })
      ;(out[init] as { bodyEnd: number }).bodyEnd = out.length
      return
    }
  }
}
