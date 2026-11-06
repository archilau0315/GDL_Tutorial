/**
 * LP XML 导出（L1 路线）：
 * 生成 Graphisoft 官方 LP XML 源文件结构，配合本地 LP_XMLConverter 命令
 * 一步转换为 .gsm。内部流格式以官方 LP XML 规范为蓝本，
 * 兼容性需结合真实 .gsm 样本持续校准（见开发计划 v1.5）。
 */
/** 生成随机 GUID（Libpart 格式要求的 32 位十六进制） */
function guid(): string {
  const h = (n: number) => Array.from({ length: n }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')
  return `${h(8)}-${h(4)}-${h(4)}-${h(4)}-${h(12)}`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface LibpartOptions {
  /** 对象名（默认 MyObject） */
  name?: string
  /** 子类型 GUID；0 = 常规对象 */
  subIdent?: string
}

/**
 * 生成 LP XML 文本。脚本内容原样嵌入 3D Script 段（CDATA）。
 */
export function generateLibpartXml(source: string, opts: LibpartOptions = {}): string {
  const name = esc(opts.name ?? 'MyObject')
  // 从脚本里提取简单数值赋值，生成基础参数（A/B/ZZYZX 的粗略近似）
  const vars: Record<string, number> = {}
  for (const m of source.matchAll(/^\s*(?:LET\s+)?([A-Za-z_]\w*)\s*=\s*(-?\d+\.?\d*)/gim)) {
    vars[m[1].toUpperCase()] = parseFloat(m[2])
  }

  const params = Object.entries(vars)
    .slice(0, 8)
    .map(([k, v]) => `        <Length Name="${k}">
          <Description><![CDATA[${k}]]></Description>
          <Value>${v}</Value>
        </Length>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Symbol Name="${name}" Version="39" Platform="WIN" MainGUID="{${guid()}}" SubIdent="${opts.subIdent ?? '0'}">
  <Ancestry>
    <MainGUID>{${guid()}}</MainGUID>
  </Ancestry>
  <Copyright>
    <Author>GDL_Tutorial Sandbox</Author>
    <License>
      <Type>CC-BY-SA-4.0</Type>
      <Version>4.0</Version>
    </License>
  </Copyright>
  <ParamSection SectVersion="34" SectionFlags="0" SubIdent="0">
    <Parameters>
${params || '        <Length Name="A">\n          <Description><![CDATA[A]]></Description>\n          <Value>1</Value>\n        </Length>'}
    </Parameters>
  </ParamSection>
  <Script_3D><![CDATA[${source}]]></Script_3D>
</Symbol>
<!-- 生成于 GDL_Tutorial 沙盒（转换后即可在 Archicad 中打开） -->
`
}

/** 生成 Windows 下的转换命令（Archicad 安装目录内 LP_XMLConverter） */
export function getConvertCommand(xmlName = 'MyObject.xml', gsmName = 'MyObject.gsm'): string {
  return `"C:\\Program Files\\GRAPHISOFT\\Archicad 27\\LP_XMLConverter.exe" xml2libpart "${xmlName}" "${gsmName}"`
}
