/**
 * 双语错误工厂：按 Archicad 报错骨架（脚本类型 + 行号 + 列号 + 错误类别）
 * 同义仿写，中英双语，不复制官方原文。
 */
import type { GdlError, GdlErrorKind, Pos } from './types'

type Msg = { zh: string; en: string }

const T: Record<string, Msg> = {
  unexpectedChar: { zh: '无法识别的字符', en: 'Unrecognized character' },
  unterminatedString: { zh: '字符串缺少结束引号', en: 'Unterminated string literal' },
  unexpectedToken: { zh: '意外的符号 “{tok}”', en: 'Unexpected symbol “{tok}”' },
  expectedExpr: { zh: '此处应为表达式', en: 'Expression expected' },
  expectedEqual: { zh: '赋值语句应为 “=”', en: '“=” expected in assignment' },
  expectedTo: { zh: 'FOR 语句缺少 “TO”', en: '“TO” expected in FOR statement' },
  expectedEndif: { zh: 'IF 语句未用 ENDIF 闭合', en: 'IF block not closed with ENDIF' },
  expectedNext: { zh: 'FOR 循环未用 NEXT 闭合', en: 'FOR loop not closed with NEXT' },
  nextWithoutFor: { zh: 'NEXT 没有对应的 FOR', en: 'NEXT without matching FOR' },
  dupEndwhile: { zh: '多余的 ENDWHILE', en: 'Unexpected ENDWHILE' },
  expectedEndwhile: { zh: 'WHILE 循环未用 ENDWHILE 闭合', en: 'WHILE loop not closed with ENDWHILE' },
  unknownLabel: { zh: 'GOSUB 找不到标签 {name}', en: 'GOSUB cannot find label {name}' },
  noReturn: { zh: 'RETURN 没有对应的 GOSUB', en: 'RETURN without matching GOSUB' },
  prismArgs: { zh: '命令 {cmd} 参数序列非法：顶点数应为 3 的倍数', en: 'Command {cmd} invalid argument list: vertex count must be a multiple of 3' },
  polyArgs: { zh: '命令 {cmd} 参数序列非法：顶点数应为 2 的倍数', en: 'Command {cmd} invalid argument list: vertex count must be a multiple of 2' },
  elseWithoutIf: { zh: 'ELSE 没有对应的 IF', en: 'ELSE without matching IF' },
  dupEndif: { zh: '多余的 ENDIF', en: 'Unexpected ENDIF' },
  argCount: { zh: '命令 {cmd} 需要 {n} 个参数，实际 {m} 个', en: 'Command {cmd} expects {n} argument(s), got {m}' },
  undefinedCmd: { zh: '未知命令 {cmd}', en: 'Unknown command {cmd}' },
  undefinedVar: { zh: '未定义变量 {name}', en: 'Undefined variable {name}' },
  undefinedFn: { zh: '未知函数 {name}', en: 'Unknown function {name}' },
  notANumber: { zh: '表达式结果不是数值', en: 'Expression did not evaluate to a number' },
  divZero: { zh: '除数为零', en: 'Division by zero' },
  negRadius: { zh: '几何参数不能为负数', en: 'Geometric parameter cannot be negative' },
  loopLimit: { zh: '循环次数超过安全上限（10000 次）', en: 'Loop iteration limit exceeded (10000)' },
  badDel: { zh: 'DEL 回退层数超过当前变换栈深度', en: 'DEL exceeds current transformation stack depth' }
}

function fill(s: string, kv: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(kv[k] ?? ''))
}

/** 生成一条双语错误（Archicad 式定位骨架） */
export function makeError(
  kind: GdlErrorKind, key: keyof typeof T,
  pos: Pos, kv: Record<string, string | number> = {}
): GdlError {
  const m = T[key]
  return {
    kind,
    script: '3D',
    line: pos.line,
    col: pos.col,
    messageZh: fill(m.zh, kv),
    messageEn: fill(m.en, kv)
  }
}
