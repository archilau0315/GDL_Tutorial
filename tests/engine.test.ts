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
    const r = run('PRISM 3, 1')
    expect(r.errors[0].messageEn).toContain('Unknown command PRISM')
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
