/**
 * GDL 解释器：AST → 形状列表 + 运行时错误。
 * MVP 命令集：BLOCK / CYLIND / SPHERE / CONE / ADD / MUL / ROT / DEL
 * 变量大小写不敏感；内置函数 SIN/COS/TAN/ABS/SQR/INT/FRA/MIN/MAX/PI 等。
 */
import type { Expr, GdlError, Mat4, Shape, Stmt } from './types'
import { makeError } from './errors'
import * as M from './matrix'

const D2R = Math.PI / 180

/** 命令签名表：命令名 → 参数个数（null = 变长） */
const CMD_SIG: Record<string, number> = {
  BLOCK: 3, CYLIND: 2, SPHERE: 1, CONE: 3,
  ADD: 3, MUL: 3, ROT: 3, DEL: 1
}

const FUNCS: Record<string, (xs: number[]) => number> = {
  SIN: ([x]) => Math.sin(x * D2R),
  COS: ([x]) => Math.cos(x * D2R),
  TAN: ([x]) => Math.tan(x * D2R),
  ASN: ([x]) => Math.asin(x) / D2R,
  ACS: ([x]) => Math.acos(x) / D2R,
  ATN: ([x]) => Math.atan(x) / D2R,
  ABS: ([x]) => Math.abs(x),
  SQR: ([x]) => Math.sqrt(x),
  INT: ([x]) => Math.trunc(x),
  FRA: ([x]) => x - Math.trunc(x),
  MIN: ([a, b]) => Math.min(a, b),
  MAX: ([a, b]) => Math.max(a, b),
  __NOT: ([x]) => x ? 0 : 1
}
const CONSTS: Record<string, number> = { PI: Math.PI }

const LOOP_LIMIT = 10000

export interface RunResult {
  shapes: Shape[]
  errors: GdlError[]
}

export function interpret(ast: Stmt[]): RunResult {
  const shapes: Shape[] = []
  const errors: GdlError[] = []
  const vars = new Map<string, number>()
  const stack: Mat4[] = [M.identity()]

  let ops = 0 // 指令总量保险丝

  const cur = (): Mat4 => stack[stack.length - 1]

  const num = (e: Expr): number => evalExpr(e)

  function evalExpr(e: Expr): number {
    switch (e.kind) {
      case 'num': return e.value
      case 'var':
        if (e.name in CONSTS) return CONSTS[e.name]
        if (!vars.has(e.name)) {
          errors.push(makeError('undefined', 'undefinedVar', e.pos, { name: e.name }))
          return 0
        }
        return vars.get(e.name)!
      case 'unary': {
        const v = evalExpr(e.arg)
        return e.op === '-' ? -v : v
      }
      case 'binary': {
        const l = evalExpr(e.left)
        const r = evalExpr(e.right)
        switch (e.op) {
          case '+': return l + r
          case '-': return l - r
          case '*': return l * r
          case '/':
            if (r === 0) { errors.push(makeError('runtime', 'divZero', e.pos)); return 0 }
            return l / r
          case '^': return Math.pow(l, r)
          case '=': return l === r ? 1 : 0
          case '<>': return l !== r ? 1 : 0
          case '<': return l < r ? 1 : 0
          case '>': return l > r ? 1 : 0
          case '<=': return l <= r ? 1 : 0
          case '>=': return l >= r ? 1 : 0
          case 'AND': return (l !== 0 && r !== 0) ? 1 : 0
          case 'OR': return (l !== 0 || r !== 0) ? 1 : 0
        }
        return 0
      }
      case 'call': {
        if (e.name in CONSTS && e.args.length === 0) return CONSTS[e.name]
        const fn = FUNCS[e.name]
        if (!fn) {
          errors.push(makeError('undefined', 'undefinedFn', e.pos, { name: e.name }))
          return 0
        }
        return fn(e.args.map(evalExpr))
      }
      case 'str':
        errors.push(makeError('type', 'notANumber', e.pos))
        return 0
    }
  }

  const need = (name: string, args: Expr[], n: number, pos: any): number[] | null => {
    if (args.length !== n) {
      errors.push(makeError('undefined', 'argCount', pos, { cmd: name, n, m: args.length }))
      return null
    }
    return args.map(num)
  }

  const ge0 = (v: number, pos: any): boolean => {
    if (v < 0) { errors.push(makeError('runtime', 'negRadius', pos)); return false }
    return true
  }

  function execBlock(body: Stmt[]): void {
    for (const s of body) {
      if (++ops > 200000) return // 保险丝：防死循环拖垮浏览器
      exec(s)
    }
  }

  function exec(s: Stmt): void {
    switch (s.kind) {
      case 'assign':
        vars.set(s.name, num(s.value))
        return
      case 'if':
        if (num(s.cond) !== 0) execBlock(s.then)
        else execBlock(s.else)
        return
      case 'for': {
        const from = num(s.from)
        const to = num(s.to)
        const step = s.step ? num(s.step) : (to >= from ? 1 : -1)
        if (step === 0) { errors.push(makeError('runtime', 'loopLimit', s.pos)); return }
        let iters = 0
        for (let v = from; step > 0 ? v <= to : v >= to; v += step) {
          if (++iters > LOOP_LIMIT) { errors.push(makeError('runtime', 'loopLimit', s.pos)); return }
          vars.set(s.varName, v)
          execBlock(s.body)
        }
        return
      }
      case 'cmd': {
        const n = CMD_SIG[s.name]
        if (n === undefined) {
          errors.push(makeError('undefined', 'undefinedCmd', s.pos, { cmd: s.name }))
          return
        }
        // DEL 参数可省（默认 1）
        const argc = s.name === 'DEL' && s.args.length === 0 ? 0 : n
        const a = need(s.name, s.args, argc, s.pos)
        if (!a) return
        switch (s.name) {
          case 'BLOCK':
            if (ge0(a[0], s.pos) && ge0(a[1], s.pos) && ge0(a[2], s.pos))
              shapes.push({ type: 'block', a: a[0], b: a[1], c: a[2], matrix: cur().slice() })
            return
          case 'CYLIND':
            if (ge0(a[1], s.pos)) shapes.push({ type: 'cylind', h: a[0], r: a[1], matrix: cur().slice() })
            return
          case 'SPHERE':
            if (ge0(a[0], s.pos)) shapes.push({ type: 'sphere', r: a[0], matrix: cur().slice() })
            return
          case 'CONE':
            if (ge0(a[1], s.pos) && ge0(a[2], s.pos)) shapes.push({ type: 'cone', h: a[0], r1: a[1], r2: a[2], matrix: cur().slice() })
            return
          case 'ADD':
            stack.push(M.mul(cur(), M.translate(a[0], a[1], a[2])))
            return
          case 'MUL':
            stack.push(M.mul(cur(), M.scale(a[0], a[1], a[2])))
            return
          case 'ROT':
            stack.push(M.mul(cur(), M.rotate(a[0], a[1], a[2])))
            return
          case 'DEL': {
            const d = a.length === 0 ? 1 : a[0]
            if (d < 1 || stack.length - d < 1) {
              errors.push(makeError('runtime', 'badDel', s.pos))
              return
            }
            for (let k = 0; k < d; k++) stack.pop()
            return
          }
        }
      }
    }
  }

  execBlock(ast)
  return { shapes, errors }
}
