// 数字蓝图代码高亮主题（Shiki TextMate theme）
// 配色与站点视觉统一：命令=蓝图蓝、控制流=制图橙、字符串=墨绿、数字=深蓝、注释=暖灰
export const blueprintLight = {
  name: 'blueprint-light',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#2c2c2a'
  },
  tokenColors: [
    { scope: ['comment.line.gdl'], settings: { foreground: '#888780', fontStyle: 'italic' } },
    { scope: ['string.quoted.double.gdl'], settings: { foreground: '#3b6d11' } },
    { scope: ['constant.numeric.gdl'], settings: { foreground: '#0c447c' } },
    { scope: ['keyword.control.gdl'], settings: { foreground: '#854f0b', fontStyle: 'bold' } },
    { scope: ['entity.name.tag.gdl'], settings: { foreground: '#185fa5', fontStyle: 'bold' } },
    { scope: ['support.function.gdl'], settings: { foreground: '#993c1d' } },
    { scope: ['variable.language.gdl'], settings: { foreground: '#534ab7' } },
    { scope: ['keyword.operator.gdl', 'keyword.operator.word.gdl'], settings: { foreground: '#5f5e5a' } }
  ]
}

export const blueprintDark = {
  name: 'blueprint-dark',
  type: 'dark',
  colors: {
    'editor.background': '#061a30',
    'editor.foreground': '#e6f1fb'
  },
  tokenColors: [
    { scope: ['comment.line.gdl'], settings: { foreground: '#85b7eb', fontStyle: 'italic' } },
    { scope: ['string.quoted.double.gdl'], settings: { foreground: '#97c459' } },
    { scope: ['constant.numeric.gdl'], settings: { foreground: '#b5d4f4' } },
    { scope: ['keyword.control.gdl'], settings: { foreground: '#ef9f27', fontStyle: 'bold' } },
    { scope: ['entity.name.tag.gdl'], settings: { foreground: '#85b7eb', fontStyle: 'bold' } },
    { scope: ['support.function.gdl'], settings: { foreground: '#f0997b' } },
    { scope: ['variable.language.gdl'], settings: { foreground: '#afa9ec' } },
    { scope: ['keyword.operator.gdl', 'keyword.operator.word.gdl'], settings: { foreground: '#b5d4f4' } }
  ]
}
