/**
 * GDL 引擎门面：源码 → { shapes, errors }
 */
import { tokenize } from './tokenizer'
import { parse } from './parser'
import { interpret } from './interpreter'
import type { GdlError, Shape, Shape2 } from './types'

export interface ExecResult {
  shapes: Shape[]
  shapes2: Shape2[]
  errors: GdlError[]
}

/** 一键执行：词法 → 语法 → 解释（3D + 2D 形状一并产出） */
export function run(source: string): ExecResult {
  const { tokens, errors: lexErrors } = tokenize(source)
  const { ast, errors: parseErrors } = parse(tokens)
  // 有语法错误时仍尝试执行（宽松模式，尽量给出后续错误）
  const { shapes, shapes2, errors: runErrors } = interpret(ast)
  return { shapes, shapes2, errors: [...lexErrors, ...parseErrors, ...runErrors] }
}

export type { Shape, Shape2, GdlError } from './types'
export { generateLibpartXml, getConvertCommand } from './libpart-xml'
