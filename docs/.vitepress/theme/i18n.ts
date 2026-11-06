// 组件界面文案中英字典（i18n.ts）
// P1 沙盒组件（GdlPlayground）等自定义组件从这里取文案
export const dict = {
  zh: {
    run: '运行',
    reset: '重置',
    example: '示例',
    errorPanel: '错误信息',
    noErrors: '✓ 脚本无错误',
    errorAt: '3D 脚本 · 第 {line} 行 · 第 {col} 列',
    verifyHint: '沙盒仅作教学演示，以 Archicad 实际运行结果为准',
    loading: '建模中…',
    exportXml: '导出对象（LP XML）',
    copyCmd: '复制转换命令',
    copied: '已复制',
    cmdHint: '在本机执行命令即可转出 .gsm（需安装 Archicad）',
    shapes: '{n} 个几何体',
    editor: 'GDL 3D 脚本',
    viewport: '3D 视口（拖动旋转 · 滚轮缩放）'
  },
  en: {
    run: 'Run',
    reset: 'Reset',
    example: 'Example',
    errorPanel: 'Errors',
    noErrors: '✓ No errors',
    errorAt: '3D Script · Line {line} · Col {col}',
    verifyHint: 'Sandbox is for teaching; final result follows actual Archicad output',
    loading: 'Building geometry…',
    exportXml: 'Export object (LP XML)',
    copyCmd: 'Copy convert command',
    copied: 'Copied',
    cmdHint: 'Run the command locally to get a .gsm (Archicad required)',
    shapes: '{n} shape(s)',
    editor: 'GDL 3D Script',
    viewport: '3D viewport (drag to orbit · scroll to zoom)'
  }
} as const

export type Locale = keyof typeof dict

export function t(locale: Locale, key: keyof typeof dict['zh']): string {
  return dict[locale][key]
}

export function tf(locale: Locale, key: keyof typeof dict['zh'], kv: Record<string, string | number>): string {
  return (dict[locale][key] as string).replace(/\{(\w+)\}/g, (_, k) => String(kv[k] ?? ''))
}
