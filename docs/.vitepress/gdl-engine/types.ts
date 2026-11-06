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
  | { kind: 'for'; varName: string; from: Expr; to: Expr; step?: Expr; body: Stmt[]; pos: Pos }

export interface Pos { line: number; col: number }

/* ---------- 几何 ---------- */
export type Shape =
  | { type: 'block'; a: number; b: number; c: number; matrix: number[] }
  | { type: 'cylind'; h: number; r: number; matrix: number[] }
  | { type: 'sphere'; r: number; matrix: number[] }
  | { type: 'cone'; h: number; r1: number; r2: number; matrix: number[] }

/** 4x4 列主序矩阵（与 WebGL/three 约定一致） */
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
