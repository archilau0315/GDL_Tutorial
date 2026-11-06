// 组件界面文案中英字典（i18n.ts）
// P1 沙盒组件（GdlPlayground）等自定义组件从这里取文案
export const dict = {
  zh: {
    run: '运行',
    reset: '重置',
    example: '示例',
    params: '参数',
    errorAt: '第 {line} 行出错',
    verifyHint: '以 Archicad 实际运行结果为准',
    loading: '建模中…'
  },
  en: {
    run: 'Run',
    reset: 'Reset',
    example: 'Example',
    params: 'Parameters',
    errorAt: 'Error at line {line}',
    verifyHint: 'Final result follows actual Archicad output',
    loading: 'Building geometry…'
  }
} as const

export type Locale = keyof typeof dict

export function t(locale: Locale, key: keyof typeof dict['zh']): string {
  return dict[locale][key]
}
