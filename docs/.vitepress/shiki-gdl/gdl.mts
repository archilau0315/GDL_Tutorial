// GDL 语法高亮定义（Shiki TextMate grammar，简化版：命令/控制流/字符串/数字/注释）
// 后续按需扩充正则与 repository 分类
const GDL_COMMANDS = [
  'ADD', 'ADDX', 'ADDY', 'ADDZ', 'MUL', 'MULX', 'MULY', 'MULZ',
  'ROT', 'ROTX', 'ROTY', 'ROTZ', 'DEL', 'XFORM', 'ADD2', 'MUL2', 'ROT2',
  'BLOCK', 'BRICK', 'CYLIND', 'SPHERE', 'ELLIPS', 'CONE', 'ELBOW',
  'PRISM', 'CPRISM_', 'BPRISM_', 'FPRISM_', 'HPRISM_', 'SPRISM_',
  'SLAB', 'CSLAB_', 'CWALL_', 'BWALL_', 'XWALL_', 'CROOF_', 'MESH', 'ARMC', 'ARME',
  'PLANE', 'PLANE_', 'RECT', 'POLY', 'POLY_', 'CIRCLE', 'ARC',
  'LIN_', 'HOTSPOT', 'HOTLINE', 'HOTARC',
  'EXTRUDE', 'PYRAMID', 'REVOLVE', 'RULED', 'SWEEP', 'TUBE', 'TUBEA', 'COONS', 'MASS', 'POLYROOF',
  'LINE2', 'RECT2', 'POLY2_', 'ARC2', 'CIRCLE2', 'TEXT2', 'FRAGMENT2', 'DRAWINDEX', 'PROJECT2', 'HOTSPOT2',
  'PEN', 'MATERIAL', 'FILL', 'LINE_TYPE', 'BUILDING_MATERIAL', 'COVER', 'SEPARATOR', 'RESOL', 'TOLER', 'RADIUS',
  'PARAMETERS', 'VALUES', 'VALUES{2}', 'LOCK', 'HIDEPARAMETER',
  'PRINT', 'GOSUB', 'RETURN', 'GOTO', 'END',
  'PLACEGROUP', 'IREG', 'SUBGROUP', 'ADDGROUP', 'INTERSECTGROUPS', 'DOUBLEREG',
  'UI_DIALOG', 'UI_CURRENT_PAGE', 'UI_PAGE', 'UI_BUTTON', 'UI_OUTFIELD', 'UI_INFIELD',
  'UI_SEPARATOR', 'UI_GROUPBOX', 'UI_PICT', 'UI_STYLE', 'UI_TOOLTIP', 'UI_COLORPICKER'
]

const GDL_CONTROL = ['IF', 'THEN', 'ELSE', 'ELSIF', 'ENDIF', 'FOR', 'TO', 'NEXT', 'WHILE', 'ENDWHILE', 'REPEAT', 'UNTIL', 'EXIT']
const GDL_FUNCS = ['SQR', 'ABS', 'INT', 'FRA', 'CEIL', 'ROUND_INT', 'MIN', 'MAX', 'SIN', 'COS', 'TAN', 'ASN', 'ACS', 'ATN', 'LOG', 'LGT', 'EXP', 'PI', 'REQ', 'STR', 'STRLEN', 'STRSTR', 'SPLIT', 'STREQ', 'USE', 'VARTYPE', 'APPLICATION_QUERY']

const esc = (w: string) => w.replace('_', '_?')

export const gdlGrammar = {
  // Shiki 用 name 作为语言 id，须与代码块标记 ```gdl 完全一致（小写）
  name: 'gdl',
  scopeName: 'source.gdl',
  aliases: ['GDL'],
  patterns: [
    { match: `!.*$`, name: 'comment.line.gdl' },
    { match: `"[^"]*"`, name: 'string.quoted.double.gdl' },
    { match: `\\b\\d+(\\.\\d+)?([eE][-+]?\\d+)?\\b`, name: 'constant.numeric.gdl' },
    { match: `\\b(AND|OR|NOT)\\b`, name: 'keyword.operator.word.gdl' },
    { match: `\\b(${GDL_CONTROL.join('|')})\\b`, name: 'keyword.control.gdl' },
    { match: `\\b(${GDL_COMMANDS.map(esc).join('|')})\\b`, name: 'entity.name.tag.gdl' },
    { match: `\\b(${GDL_FUNCS.map(esc).join('|')})\\b(?=\\()`, name: 'support.function.gdl' },
    { match: `\\b(A|B|ZZYZX|GLOB_[A-Z_]+|REQ\\b)\\b`, name: 'variable.language.gdl' },
    { match: `[-+*/^=<>#]`, name: 'keyword.operator.gdl' }
  ]
}
