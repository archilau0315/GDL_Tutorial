/**
 * GDL 引擎单元测试：正常路径 + 错误定位（行号/列号/类别）
 */
import { describe, expect, it } from 'vitest'
import { run } from '../docs/.vitepress/gdl-engine/index'

describe('基本体', () => {
  it('BLOCK 生成一个长方体', () => {
    const r = run('BLOCK 1, 2, 3')
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(1)
    expect(r.shapes[0]).toMatchObject({ type: 'block', a: 1, b: 2, c: 3 })
  })

  it('CYLIND / SPHERE / CONE 参数正确', () => {
    const r = run('CYLIND 2, 0.5\nSPHERE 0.5\nCONE 1, 0.5, 0.1')
    expect(r.errors).toEqual([])
    expect(r.shapes.map(s => s.type)).toEqual(['cylind', 'sphere', 'cone'])
  })

  it('ELLIPS 三参数生成椭球，少给参数报错', () => {
    const ok = run('ELLIPS 0.8, 0.5, 0.25')
    expect(ok.errors).toEqual([])
    expect(ok.shapes[0]).toMatchObject({ type: 'ellips', h: 0.8, rx: 0.5, ry: 0.25 })
    const bad = run('ELLIPS 0.8, 0.5')
    expect(bad.errors[0].messageEn).toContain('ELLIPS')
  })

  it('大小写不敏感：block 与 BLOCK 等价', () => {
    const r = run('block 1,1,1')
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(1)
  })
})

describe('变量与表达式', () => {
  it('赋值后在表达式中引用', () => {
    const r = run('h = 0.72\nBLOCK 1.2, 0.6, h')
    expect(r.errors).toEqual([])
    expect(r.shapes[0]).toMatchObject({ c: 0.72 })
  })

  it('未定义变量报错并定位行号', () => {
    const r = run('BLOCK 1, 1, 1\nBLOCK w, 1, 1')
    expect(r.shapes).toHaveLength(2) // 错误不中断执行
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0].line).toBe(2)
    expect(r.errors[0].messageEn).toContain('Undefined variable W')
    expect(r.errors[0].messageZh).toContain('未定义变量 W')
  })

  it('运算符优先级：2+3*4=14，带括号(2+3)*4=20', () => {
    expect(run('a = 2+3*4\nBLOCK a,1,1').shapes[0].a).toBe(14)
    expect(run('a = (2+3)*4\nBLOCK a,1,1').shapes[0].a).toBe(20)
  })

  it('内置函数 SIN 角度制', () => {
    expect(run('a = SIN(90)\nBLOCK a,1,1').shapes[0].a).toBeCloseTo(1)
  })

  it('除零报运行时错误', () => {
    const r = run('a = 1/0')
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0].kind).toBe('runtime')
  })
})

describe('变换', () => {
  it('ADD 平移生效：z 提高 1', () => {
    const r = run('ADD 0, 0, 1\nBLOCK 1, 1, 1')
    expect(r.errors).toEqual([])
    // 矩阵平移分量（列主序 [12]=x [13]=y [14]=z）
    expect(r.shapes[0].matrix[14]).toBeCloseTo(1)
  })

  it('DEL 回退一层', () => {
    const r = run('ADD 0,0,1\nBLOCK 1,1,1\nDEL 1\nBLOCK 1,1,1')
    expect(r.shapes[0].matrix[14]).toBeCloseTo(1)
    expect(r.shapes[1].matrix[14]).toBeCloseTo(0)
  })

  it('DEL 超深报错', () => {
    const r = run('DEL 5')
    expect(r.errors[0].messageEn).toContain('DEL exceeds')
  })
})

describe('流程控制', () => {
  it('FOR 循环生成 4 条腿', () => {
    const src = `FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD i, j, 0
    BLOCK 0.05, 0.05, 0.7
    DEL 1
  NEXT j
NEXT i`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(4)
  })

  it('IF/ELSE 条件分支（块式带 THEN + 单行式）', () => {
    const r = run('a = 1\nIF a = 1 THEN\nBLOCK 1,1,1\nELSE\nBLOCK 2,2,2\nENDIF')
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(1)
    expect(r.shapes[0].a).toBe(1)
    const r2 = run('b = 0\nIF b THEN BLOCK 9,9,9 ELSE BLOCK 5,5,5')
    expect(r2.errors).toEqual([])
    expect(r2.shapes[0].a).toBe(5)
  })

  it('IF 未闭合报语法错误', () => {
    const r = run('IF 1\nBLOCK 1,1,1')
    expect(r.errors.some(e => e.messageEn.includes('ENDIF'))).toBe(true)
  })

  it('循环上限保险丝', () => {
    const r = run('FOR i = 1 TO 99999999\nBLOCK 1,1,1\nNEXT i')
    expect(r.errors.some(e => e.messageEn.includes('iteration limit'))).toBe(true)
  })
})

describe('未知命令与参数个数', () => {
  it('未知命令报错', () => {
    const r = run('FOOBAR 3, 1')
    expect(r.errors[0].messageEn).toContain('Unknown command FOOBAR')
  })

  it('参数个数不符报错并定位行号', () => {
    const r = run('BLOCK 1, 2')
    expect(r.errors[0].line).toBe(1)
    expect(r.errors[0].messageEn).toContain('expects 3 argument(s), got 2')
  })
})

describe('注释与换行', () => {
  it('! 注释被忽略', () => {
    const r = run('! 这是注释\nBLOCK 1, 1, 1  ! 行尾注释')
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(1)
  })
})

describe('LP XML 导出', () => {
  it('生成合法 XML 骨架并内嵌 3D 脚本', async () => {
    const { generateLibpartXml } = await import('../docs/.vitepress/gdl-engine/libpart-xml')
    const xml = generateLibpartXml('BLOCK 1,1,1\nw = 2', { name: 'TestObj' })
    expect(xml).toContain('<Script_3D><![CDATA[BLOCK 1,1,1')
    expect(xml).toContain('Name="TestObj"')
    expect(xml).toContain('<Length Name="W">')
    expect(xml).not.toContain('hasError')
  })
})

describe('P2 扩展：PRISM 族', () => {
  it('PRISM 跨行顶点表（带尾逗号）正确解析', () => {
    const src = `PRISM 4, 1,
  0, 0, 15,
  1, 0, 15,
  1, 1, 15,
  0, 1, -1`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(1)
    const p = r.shapes[0] as any
    expect(p.type).toBe('prism')
    expect(p.pts).toHaveLength(4)
    expect(p.h).toBe(1)
    expect(p.pts[3].s).toBe(-1)
  })

  it('PRISM 顶点数与 n 不符报错', () => {
    const r = run('PRISM 3, 1, 0,0,15, 1,0,15')
    expect(r.errors[0].messageEn).toContain('argument')
  })

  it('PRISM 支持变换矩阵叠加', () => {
    const r = run('ADD 1, 2, 3\nPRISM 4, 1, 0,0,15, 1,0,15, 1,1,15, 0,1,15')
    expect(r.errors).toEqual([])
    const m = (r.shapes[0] as any).matrix
    expect(m[12]).toBeCloseTo(1)
    expect(m[13]).toBeCloseTo(2)
    expect(m[14]).toBeCloseTo(3)
  })
})

describe('P2 扩展：2D 命令', () => {
  it('LINE2/RECT2/CIRCLE2/ARC2 产出 2D 形状', () => {
    const r = run('LINE2 0, 0, 1, 1\nRECT2 0, 0, 2, 2\nCIRCLE2 1, 1, 0.5\nARC2 0, 0, 1, 0, 90')
    expect(r.errors).toEqual([])
    expect(r.shapes2.map(s => s.type)).toEqual(['line2', 'rect2', 'circle2', 'arc2'])
  })

  it('POLY2 无状态位 / POLY2_ 带状态位', () => {
    const r = run('POLY2 3, 7, 0,0, 1,0, 1,1\nPOLY2_ 3, 7, 0,0,1, 1,0,1, 1,1,-1')
    expect(r.errors).toEqual([])
    expect(r.shapes2).toHaveLength(2)
    expect((r.shapes2[1] as any).pts[2].s).toBe(-1)
  })

  it('TEXT2 保留字符串文本', () => {
    const r = run('TEXT2 0, 0, "Hello GDL"')
    expect(r.errors).toEqual([])
    expect((r.shapes2[0] as any).text).toBe('Hello GDL')
  })

  it('2D 变换 ADD2/ROT2/DEL2 独立于 3D 栈', () => {
    const r = run('ADD 5, 5, 5\nADD2 1, 0\nLINE2 0, 0, 1, 0\nDEL2 1\nLINE2 0, 0, 1, 0')
    expect(r.errors).toEqual([])
    expect(r.shapes2[0].matrix[12]).toBeCloseTo(1)  // 受 ADD2 影响
    expect(r.shapes2[1].matrix[12]).toBeCloseTo(0)  // DEL2 回退后回到原点
    expect(r.shapes2[0].matrix[14]).toBeCloseTo(0)  // 3D 栈不影响 2D
  })
})

describe('P2 扩展：流程控制', () => {
  it('WHILE 循环', () => {
    const r = run('i = 0\nWHILE i < 3 DO\ni = i + 1\nENDWHILE\nBLOCK i, i, i')
    expect(r.errors).toEqual([])
    expect((r.shapes[0] as any).a).toBe(3)
  })

  it('GOSUB/RETURN 子程序（数值标签）', () => {
    const src = `n = 0
GOSUB 100
GOSUB 100
BLOCK n, n, 1
END
100:
n = n + 1
RETURN`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect((r.shapes[0] as any).a).toBe(2)
  })

  it('GOSUB 找不到标签报错', () => {
    const r = run('GOSUB 999')
    expect(r.errors[0].messageEn).toContain('cannot find label 999')
  })

  it('DEL TOP 清空变换栈；DEL 无参默认回退 1 层', () => {
    const r = run('ADD 1, 0, 0\nADD 0, 2, 0\nDEL TOP\nBLOCK 1, 1, 1')
    expect(r.errors).toEqual([])
    expect(r.shapes[0].matrix[12]).toBeCloseTo(0)
    const r2 = run('ADD 1, 0, 0\nADD 0, 2, 0\nDEL\nBLOCK 1, 1, 1')
    expect(r2.shapes[0].matrix[12]).toBeCloseTo(1)
    expect(r2.shapes[0].matrix[13]).toBeCloseTo(0)
  })
})

describe('P2 扩展：运算与属性', () => {
  it('MOD 运算符', () => {
    expect(run('a = 7 MOD 3\nBLOCK a,1,1').shapes[0].a).toBe(1)
  })

  it('MATERIAL 记录到形状', () => {
    const r = run('MATERIAL 3\nBLOCK 1,1,1\nMATERIAL 5\nBLOCK 1,1,1')
    expect(r.errors).toEqual([])
    expect(r.shapes[0].matIdx).toBe(3)
    expect(r.shapes[1].matIdx).toBe(5)
  })

  it('ADDX/ROTZ 单轴变换', () => {
    const r = run('ADDZ 2\nBLOCK 1,1,1')
    expect(r.shapes[0].matrix[14]).toBeCloseTo(2)
    const r2 = run('ROTZ 90\nBLOCK 1, 0, 1')
    expect((r2.shapes[0].matrix[0])).toBeCloseTo(0)   // cos90
    expect((r2.shapes[0].matrix[1])).toBeCloseTo(1)   // sin90
  })
})

describe('跳转不丢循环状态（回归）', () => {
  it('FOR 循环里调 GOSUB，每轮都执行', () => {
    const src = `FOR i = 1 TO 3
  GOSUB 100
NEXT i
END
100:
BLOCK 0.5, 0.5, 0.5
ADD 1, 0, 0
RETURN`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(3)
    expect(r.shapes.map(s => Math.round(s.matrix[12]))).toEqual([0, 1, 2])
  })

  it('WHILE 循环里调 GOSUB，每轮都执行', () => {
    const src = `k = 0
WHILE k < 4
  GOSUB 100
  k = k + 1
ENDWHILE
END
100:
ADD 0.25, 0, 0
BLOCK 0.1, 0.1, 0.1
DEL 1
RETURN`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(4)
  })

  it('子程序内含未配对 FOR 时，RETURN 后调用方循环仍继续', () => {
    const src = `FOR i = 1 TO 3
  GOSUB 100
NEXT i
END
100:
FOR j = 1 TO 2
  ADD 0, 1, 0
NEXT j
BLOCK 0.2, 0.2, 0.2
RETURN`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(3)
    // 子程序里两次 ADD 不退栈，三次调用累积成 2 / 4 / 6（GDL 变换栈本就不随 RETURN 复位）
    expect(r.shapes.map(s => Math.round(s.matrix[13]))).toEqual([2, 4, 6])
  })

  it('栏杆示例：7 根立柱均匀分布 + 1 根扶手', () => {
    const src = `len = 3.0
n = 7
gap = len / (n - 1)
FOR i = 1 TO n
  ADD (i - 1) * gap, 0, 0
  GOSUB 100
  DEL 1
NEXT i
ADD 0, 0, 1.0
BLOCK len, 0.06, 0.04
DEL 1
END
100:
CYLIND 0.95, 0.02
RETURN`
    const r = run(src)
    expect(r.errors).toEqual([])
    expect(r.shapes).toHaveLength(8)
    const xs = r.shapes.slice(0, 7).map(s => +s.matrix[12].toFixed(2))
    expect(xs).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3])
  })
})
