/**
 * GDL 解释器：AST → 3D/2D 形状列表 + 运行时错误。
 * 执行模型：顶层程序计数器 + 跳转信号（GOSUB/RETURN/END），
 * 嵌套块遇到跳转信号即逐层上抛。2D 与 3D 各持独立变换栈。
 */
import type { Expr, GdlError, Mat4, Pos, Shape, Shape2, Stmt } from './types'
import { compile } from './bytecode'
import { makeError } from './errors'
import * as M from './matrix'

const D2R = Math.PI / 180

/** 命令签名：名称 → [参数个数下限, 上限]（上限 null = 变长） */
const CMD_SIG: Record<string, [number, number | null]> = {
  BLOCK: [3, 3], CYLIND: [2, 2], SPHERE: [1, 1], ELLIPS: [3, 3],
  CONE: [3, 5],
  ADD: [3, 3], MUL: [3, 3], ROT: [3, 3], DEL: [1, 1],
  ADDX: [1, 1], ADDY: [1, 1], ADDZ: [1, 1],
  ROTX: [1, 1], ROTY: [1, 1], ROTZ: [1, 1],
  MULX: [1, 1], MULY: [1, 1], MULZ: [1, 1],
  MATERIAL: [1, 1], PEN: [1, 1],
  LINE2: [4, 4], RECT2: [4, 4], CIRCLE2: [3, 3], ARC2: [5, 5],
  TEXT2: [3, 3], HOTSPOT2: [2, 2], PROJECT2: [3, 3],
  ADD2: [2, 2], ROT2: [1, 1], MUL2: [2, 2], DEL2: [1, 1]
}

/** 变长命令：PRISM 族（顶点三元组 x,y,s）/ POLY2_（二元或三元组） */
const VAR_3N = new Set(['PRISM', 'PRISM_'])
const VAR_2N = new Set(['POLY2', 'POLY2_'])

/** 挤出/旋转成形：EXTRUDE n, dx,dy,dz, mask, (x,y,s)×n；REVOLVE n, alpha, mask, (x,y,s)×n */
const EXTRUDE_HEAD = 5
const REVOLVE_HEAD = 3

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
  __NOT: ([x]) => (x ? 0 : 1)
}
const CONSTS: Record<string, number> = { PI: Math.PI }

const LOOP_LIMIT = 10000
const OPS_LIMIT = 200000

export interface RunResult {
  shapes: Shape[]
  shapes2: Shape2[]
  errors: GdlError[]
}

export function interpret(ast: Stmt[]): RunResult {
  const shapes: Shape[] = []
  const shapes2: Shape2[] = []
  const errors: GdlError[] = []
  const vars = new Map<string, number>()

  /** GOSUB 返回地址 + 调用时的循环栈深度（RETURN 时丢弃子程序里没配对的循环帧） */
  const callStack: { ret: number; loops: number }[] = []
  /** FOR 循环栈：与程序计数器配合，任何跳转都不会丢循环状态 */
  const loopStack: { varName: string; to: number; step: number; bodyStart: number; iters: number }[] = []
  let curMat: Mat4 = M.identity()
  const stack3d: Mat4[] = [curMat]
  let cur2: Mat4 = M.identity()
  const stack2: Mat4[] = [cur2]
  let matIdx: number | undefined
  let penIdx: number | undefined
  let ops = 0

  interface B { matrix: number[]; matIdx?: number; penIdx?: number }
  const base = (): B => ({ matrix: curMat.slice(), matIdx, penIdx })
  const base2 = (): B => ({ matrix: cur2.slice(), matIdx, penIdx })

  /* ---- 表达式求值 ---- */
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
      case 'unary': return e.op === '-' ? -evalExpr(e.arg) : evalExpr(e.arg)
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
          case 'MOD': return l % r
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

  const num = (e: Expr): number => evalExpr(e)

  const ge0 = (v: number, pos: any): boolean => {
    if (v < 0) { errors.push(makeError('runtime', 'negRadius', pos)); return false }
    return true
  }

  /* ---- 指令执行（由外层程序计数器驱动） ---- */

  function execCmd(s: { name: string; args: Expr[]; pos: Pos }): void {
    const name = s.name
    const args = s.args

    if (VAR_3N.has(name)) { prismCmd(name, s, args); return }
    if (VAR_2N.has(name)) { polyCmd(name, s, args); return }
    if (name === 'EXTRUDE') { extrudeCmd(s, args); return }
    if (name === 'REVOLVE') { revolveCmd(s, args); return }

    // DEL 特殊形态：无参默认回退 1 层；DEL TOP 回退全部
    if (name === 'DEL' || name === 'DEL2') {
      const st = name === 'DEL' ? stack3d : stack2
      if (args.length === 0) { del(st, 1, s.pos); return }
      if (args[0].kind === 'var' && args[0].name === 'TOP') { del(st, st.length - 1, s.pos); return }
    }

    const sig = CMD_SIG[name]
    if (!sig) { errors.push(makeError('undefined', 'undefinedCmd', s.pos, { cmd: name })); return }
    const [lo, hi] = sig
    if (args.length < lo || (hi !== null && args.length > hi)) {
      errors.push(makeError('undefined', 'argCount', s.pos, { cmd: name, n: hi ?? lo, m: args.length }))
      return
    }
    // TEXT2 第 3 参是字符串，不走数值求值
    if (name === 'TEXT2') {
      const x = num(args[0]), y = num(args[1])
      const txt = args[2].kind === 'str' ? (args[2] as any).value : String(num(args[2]))
      shapes2.push({ type: 'text2', x, y, text: txt, ...base2() })
      return
    }
    const a = args.map(num)
    switch (name) {
      /* --- 3D 体 --- */
      case 'BLOCK':
        if (ge0(a[0], s.pos) && ge0(a[1], s.pos) && ge0(a[2], s.pos))
          shapes.push({ type: 'block', a: a[0], b: a[1], c: a[2], ...base() })
        return
      case 'CYLIND':
        if (ge0(a[1], s.pos)) shapes.push({ type: 'cylind', h: a[0], r: a[1], ...base() })
        return
      case 'SPHERE':
        if (ge0(a[0], s.pos)) shapes.push({ type: 'sphere', r: a[0], ...base() })
        return
      case 'ELLIPS':
        if (ge0(a[1], s.pos) && ge0(a[2], s.pos))
          shapes.push({ type: 'ellips', h: a[0], rx: a[1], ry: a[2], ...base() })
        return
      case 'CONE':
        if (ge0(a[1], s.pos) && ge0(a[2], s.pos))
          shapes.push({ type: 'cone', h: a[0], r1: a[1], r2: a[2], ...base() })
        return // 5 参形态（锥角）教学沙盒按普通圆锥近似
      /* --- 3D 变换 --- */
      case 'ADD': push3(M.translate(a[0], a[1], a[2])); return
      case 'MUL': push3(M.scale(a[0], a[1], a[2])); return
      case 'ROT': push3(M.rotate(a[0], a[1], a[2])); return
      case 'ADDX': push3(M.translate(a[0], 0, 0)); return
      case 'ADDY': push3(M.translate(0, a[0], 0)); return
      case 'ADDZ': push3(M.translate(0, 0, a[0])); return
      case 'MULX': push3(M.scale(a[0], 1, 1)); return
      case 'MULY': push3(M.scale(1, a[0], 1)); return
      case 'MULZ': push3(M.scale(1, 1, a[0])); return
      case 'ROTX': push3(M.rotate(a[0], 0, 0)); return
      case 'ROTY': push3(M.rotate(0, a[0], 0)); return
      case 'ROTZ': push3(M.rotate(0, 0, a[0])); return
      case 'DEL': del(stack3d, Math.trunc(a[0]), s.pos); return
      /* --- 属性 --- */
      case 'MATERIAL': matIdx = Math.trunc(a[0]); return
      case 'PEN': penIdx = Math.trunc(a[0]); return
      /* --- 2D 图形 --- */
      case 'LINE2': shapes2.push({ type: 'line2', x1: a[0], y1: a[1], x2: a[2], y2: a[3], ...base2() }); return
      case 'RECT2': shapes2.push({ type: 'rect2', x1: a[0], y1: a[1], x2: a[2], y2: a[3], ...base2() }); return
      case 'CIRCLE2':
        if (ge0(a[2], s.pos)) shapes2.push({ type: 'circle2', x: a[0], y: a[1], r: a[2], ...base2() })
        return
      case 'ARC2': shapes2.push({ type: 'arc2', x: a[0], y: a[1], r: a[2], a1: a[3], a2: a[4], ...base2() }); return
      case 'HOTSPOT2': return // 热区仅是编辑点，不产生图形
      case 'PROJECT2': return // 3D 投影：沙盒不绘制（见第 4 章说明）
      /* --- 2D 变换 --- */
      case 'ADD2': push2(M.translate(a[0], a[1], 0)); return
      case 'ROT2': push2(M.rotate(0, 0, a[0])); return
      case 'MUL2': push2(M.scale(a[0], a[1], 1)); return
      case 'DEL2': del(stack2, Math.trunc(a[0]), s.pos); return
    }
  }

  function push3(m: Mat4): void {
    stack3d.push(M.mul(curMat, m))
    curMat = stack3d[stack3d.length - 1]
  }
  function push2(m: Mat4): void {
    stack2.push(M.mul(cur2, m))
    cur2 = stack2[stack2.length - 1]
  }
  function del(stack: Mat4[], n: number, pos: any): void {
    if (n < 1 || stack.length - n < 1) {
      errors.push(makeError('runtime', 'badDel', pos))
      return
    }
    for (let k = 0; k < n; k++) stack.pop()
    curMat = stack3d[stack3d.length - 1]
    cur2 = stack2[stack2.length - 1]
  }

  /** PRISM / PRISM_：n, h, (x, y, s) × n */
  function prismCmd(name: string, s: any, args: Expr[]): void {
    if (args.length < 5 || (args.length - 2) % 3 !== 0) {
      errors.push(makeError('syntax', 'prismArgs', s.pos, { cmd: name }))
      return
    }
    const n = Math.trunc(num(args[0]))
    const h = num(args[1])
    const pts: { x: number; y: number; s: number }[] = []
    for (let i = 2; i + 2 <= args.length - 1; i += 3) {
      pts.push({ x: num(args[i]), y: num(args[i + 1]), s: Math.trunc(num(args[i + 2])) })
    }
    if (pts.length !== n || n < 3) {
      errors.push(makeError('undefined', 'argCount', s.pos, { cmd: name, n: `${n} 个顶点`, m: pts.length }))
      return
    }
    if (ge0(h, s.pos)) shapes.push({ type: 'prism', n, h, pts, ...base() })
  }

  /** EXTRUDE：n, dx, dy, dz, mask, (x, y, s) × n —— 沿任意向量挤出 */
  function extrudeCmd(s: any, args: Expr[]): void {
    if (args.length < 8 || (args.length - EXTRUDE_HEAD) % 3 !== 0) {
      errors.push(makeError('syntax', 'prismArgs', s.pos, { cmd: 'EXTRUDE' }))
      return
    }
    const n = Math.trunc(num(args[0]))
    const dx = num(args[1]), dy = num(args[2]), dz = num(args[3])
    const pts: { x: number; y: number; s: number }[] = []
    for (let i = EXTRUDE_HEAD; i + 2 <= args.length - 1; i += 3) {
      pts.push({ x: num(args[i]), y: num(args[i + 1]), s: Math.trunc(num(args[i + 2])) })
    }
    if (pts.length !== n || n < 3) {
      errors.push(makeError('undefined', 'argCount', s.pos, { cmd: 'EXTRUDE', n: `${n} 个顶点`, m: pts.length }))
      return
    }
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) === 0) {
      errors.push(makeError('runtime', 'zeroExtrude', s.pos))
      return
    }
    shapes.push({ type: 'extrude', n, dx, dy, dz, pts, ...base() })
  }

  /** REVOLVE：n, alpha, mask, (x, y, s) × n —— 截面绕 X 轴旋转 alpha 度 */
  function revolveCmd(s: any, args: Expr[]): void {
    if (args.length < 6 || (args.length - REVOLVE_HEAD) % 3 !== 0) {
      errors.push(makeError('syntax', 'prismArgs', s.pos, { cmd: 'REVOLVE' }))
      return
    }
    const n = Math.trunc(num(args[0]))
    const alpha = num(args[1])
    const pts: { x: number; y: number; s: number }[] = []
    for (let i = REVOLVE_HEAD; i + 2 <= args.length - 1; i += 3) {
      pts.push({ x: num(args[i]), y: num(args[i + 1]), s: Math.trunc(num(args[i + 2])) })
    }
    if (pts.length !== n || n < 2) {
      errors.push(makeError('undefined', 'argCount', s.pos, { cmd: 'REVOLVE', n: `${n} 个顶点`, m: pts.length }))
      return
    }
    if (alpha === 0) {
      errors.push(makeError('runtime', 'zeroRevolve', s.pos))
      return
    }
    if (pts.some(p => p.y < 0)) {
      errors.push(makeError('runtime', 'revolveY', s.pos))
      return
    }
    shapes.push({ type: 'revolve', n, alpha, pts, ...base() })
  }

  /** POLY2 / POLY2_：n, frame_fill, (x, y [, s]) × n */
  function polyCmd(name: string, s: any, args: Expr[]): void {
    const hasStatus = name === 'POLY2_'
    const per = hasStatus ? 3 : 2
    if (args.length < 4 || (args.length - 2) % per !== 0) {
      errors.push(makeError('syntax', hasStatus ? 'prismArgs' : 'polyArgs', s.pos, { cmd: name }))
      return
    }
    const n = Math.trunc(num(args[0]))
    const fill = Math.trunc(num(args[1]))
    const pts: { x: number; y: number; s: number }[] = []
    for (let i = 2; i + per - 1 <= args.length - 1; i += per) {
      pts.push({ x: num(args[i]), y: num(args[i + 1]), s: hasStatus ? Math.trunc(num(args[i + 2])) : 1 })
    }
    if (pts.length !== n || n < 2) {
      errors.push(makeError('undefined', 'argCount', s.pos, { cmd: name, n: `${n} 个顶点`, m: pts.length }))
      return
    }
    shapes2.push({ type: 'poly2', pts, fill, ...base2() })
  }

  /* ---- 程序计数器主循环 ---- */
  const code = compile(ast)
  const labels = new Map<string, number>()
  code.forEach((ins, i) => { if (ins.op === 'label') labels.set(ins.value, i) })

  let pc = 0
  while (pc >= 0 && pc < code.length) {
    if (++ops > OPS_LIMIT) {
      errors.push(makeError('runtime', 'loopLimit', (code[pc] as { pos?: Pos }).pos ?? { line: 1, col: 1 }))
      break
    }
    const ins = code[pc]

    switch (ins.op) {
      case 'assign':
        vars.set(ins.name, num(ins.value))
        pc++
        break
      case 'cmd':
        execCmd(ins)
        pc++
        break
      case 'label':
        pc++
        break
      case 'gosub': {
        const key = ins.target.kind === 'str' ? ins.target.value : String(Math.trunc(num(ins.target)))
        const idx = labels.get(key)
        if (idx === undefined) {
          errors.push(makeError('undefined', 'unknownLabel', ins.pos, { name: key }))
          pc++
          break
        }
        callStack.push({ ret: pc + 1, loops: loopStack.length })
        pc = idx
        break
      }
      case 'return': {
        const frame = callStack.pop()
        if (!frame) {
          errors.push(makeError('runtime', 'noReturn', ins.pos))
          pc++
          break
        }
        // 子程序里没配对的 FOR 帧一并丢弃，回到调用点的循环状态
        if (loopStack.length > frame.loops) loopStack.length = frame.loops
        pc = frame.ret
        break
      }
      case 'end':
        return { shapes, shapes2, errors }
      case 'test':
        pc = num(ins.cond) === 0 ? ins.falseJump : pc + 1
        break
      case 'jump':
        pc = ins.to
        break
      case 'forinit': {
        const from = num(ins.from)
        const to = num(ins.to)
        const step = ins.step ? num(ins.step) : (to >= from ? 1 : -1)
        if (step === 0) {
          errors.push(makeError('runtime', 'loopLimit', ins.pos))
          pc = ins.bodyEnd
          break
        }
        vars.set(ins.varName, from)
        if (step > 0 ? from > to : from < to) { pc = ins.bodyEnd; break }  // 空区间不执行
        loopStack.push({ varName: ins.varName, to, step, bodyStart: pc + 1, iters: 1 })
        pc++
        break
      }
      case 'next': {
        const fr = loopStack[loopStack.length - 1]
        if (!fr) { pc++; break }
        const v = (vars.get(fr.varName) ?? 0) + fr.step
        if (fr.step > 0 ? v > fr.to : v < fr.to) { loopStack.pop(); pc++; break }
        if (++fr.iters > LOOP_LIMIT) {
          errors.push(makeError('runtime', 'loopLimit', code[fr.bodyStart]?.pos ?? { line: 1, col: 1 }))
          loopStack.pop()
          pc++
          break
        }
        vars.set(fr.varName, v)
        pc = fr.bodyStart
        break
      }
    }
  }

  return { shapes, shapes2, errors }
}
