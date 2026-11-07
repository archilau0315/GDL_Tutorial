/**
 * GDL 引擎类型定义：词法单元、AST、几何形状、错误。
 * 坐标系：GDL 右手系，Z 轴向上（与 Archicad 一致）。
 */

/* ---------- 词法 ---------- */
export type TokenType = 'number' | 'string' | 'ident' | 'op' | 'newline' | 'eof'

export interface Token {
  type: TokenType
  /** 原文（标识符统一大写存储，GDL 大小写不敏感） */
  value: string
  /** 数值字面量的解析值 */
  num?: number
  line: number
  col: number
}

/* ---------- AST ---------- */
export type Expr =
  | { kind: 'num'; value: number; pos: Pos }
  | { kind: 'str'; value: string; pos: Pos }
  | { kind: 'var'; name: string; pos: Pos }
  | { kind: 'unary'; op: '-' | '+'; arg: Expr; pos: Pos }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; pos: Pos }
  | { kind: 'call'; name: string; args: Expr[]; pos: Pos }

export type Stmt =
  | { kind: 'assign'; name: string; value: Expr; pos: Pos }
  | { kind: 'cmd'; name: string; args: Expr[]; pos: Pos }
  | { kind: 'if'; cond: Expr; then: Stmt[]; else: Stmt[]; pos: Pos }
  | { kind: 'while'; cond: Expr; body: Stmt[]; pos: Pos }
  | { kind: 'for'; varName: string; from: Expr; to: Expr; step?: Expr; body: Stmt[]; pos: Pos }
  | { kind: 'label'; value: string; pos: Pos }
  | { kind: 'gosub'; target: Expr; pos: Pos }
  | { kind: 'return'; pos: Pos }
  | { kind: 'end'; pos: Pos }

export interface Pos { line: number; col: number }

/* ---------- 几何（3D） ---------- */
export interface ShapeBase { matrix: number[]; matIdx?: number; penIdx?: number }

export type Shape =
  | { type: 'block'; a: number; b: number; c: number } & ShapeBase
  | { type: 'cylind'; h: number; r: number } & ShapeBase
  | { type: 'sphere'; r: number } & ShapeBase
  | { type: 'cone'; h: number; r1: number; r2: number } & ShapeBase
  | { type: 'ellips'; h: number; rx: number; ry: number } & ShapeBase
  | { type: 'prism'; n: number; h: number; pts: { x: number; y: number; s: number }[] } & ShapeBase
  | { type: 'extrude'; n: number; dx: number; dy: number; dz: number; pts: { x: number; y: number; s: number }[] } & ShapeBase
  | { type: 'revolve'; n: number; alpha: number; pts: { x: number; y: number; s: number }[] } & ShapeBase

/** 2D 形状（平面图形，y 向上） */
export type Shape2 =
  | { type: 'line2'; x1: number; y1: number; x2: number; y2: number } & ShapeBase
  | { type: 'rect2'; x1: number; y1: number; x2: number; y2: number } & ShapeBase
  | { type: 'circle2'; x: number; y: number; r: number } & ShapeBase
  | { type: 'arc2'; x: number; y: number; r: number; a1: number; a2: number } & ShapeBase
  | { type: 'poly2'; pts: { x: number; y: number; s: number }[]; fill: number } & ShapeBase
  | { type: 'text2'; x: number; y: number; text: string } & ShapeBase

/** 4x4 列主序矩阵（与 WebGL/three 约定一致；2D 用 z=0 的平面矩阵） */
export type Mat4 = number[]

/* ---------- 错误 ---------- */
export type GdlErrorKind =
  | 'lexer'        // 词法错误：无法识别的字符等
  | 'syntax'       // 语法错误：结构不闭合、参数缺分隔等
  | 'undefined'    // 未定义变量 / 未定义命令 / 参数个数不符
  | 'type'         // 类型错误
  | 'runtime'      // 运行时错误：除零、循环上限等

export interface GdlError {
  kind: GdlErrorKind
  /** Archicad 式定位：脚本类型 + 行号 + 列号 */
  script: '3D'
  line: number
  col: number
  messageZh: string
  messageEn: string
}
