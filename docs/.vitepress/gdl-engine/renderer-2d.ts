/**
 * 2D 渲染器：GDL 2D 形状 → SVG 字符串（平面符号视口）。
 * 坐标：GDL 2D 为 y 向上的平面系；SVG y 向下，输出时对 y 取负。
 * 自适应 viewBox：按全部图形包围盒取景并留边距；文本不镜像。
 */
import type { Mat4, Shape2 } from './types'

interface P { x: number; y: number }

/** 4x4 列主序矩阵作用于平面点 (x, y, 0) —— 返回 GDL 坐标 */
function tp(m: Mat4, x: number, y: number): P {
  return {
    x: m[0] * x + m[4] * y + m[12],
    y: m[1] * x + m[5] * y + m[13]
  }
}

const F = (v: number): string => Number(v.toFixed(4)).toString()

export interface Svg2dOptions {
  isDark?: boolean
}

/** 收集所有图形的包围盒（GDL 坐标） */
function bounds(shapes: Shape2[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const add = (x: number, y: number): void => {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  for (const s of shapes) {
    switch (s.type) {
      case 'line2':
      case 'rect2': {
        const a = tp(s.matrix, s.x1, s.y1), b = tp(s.matrix, s.x2, s.y2)
        add(a.x, a.y); add(b.x, b.y); break
      }
      case 'circle2':
      case 'arc2': {
        const c = tp(s.matrix, s.x, s.y)
        add(c.x - s.r, c.y - s.r); add(c.x + s.r, c.y + s.r); break
      }
      case 'poly2': {
        for (const p of s.pts) { const q = tp(s.matrix, p.x, p.y); add(q.x, q.y) }
        break
      }
      case 'text2': {
        const c = tp(s.matrix, s.x, s.y)
        add(c.x, c.y - 0.1); add(c.x + s.text.length * 0.1, c.y + 0.02); break
      }
    }
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
}

/** 形状列表 → SVG（自适应取景；空列表返回占位提示） */
export function buildSvg2d(shapes: Shape2[], opts: Svg2dOptions = {}): string {
  const stroke = opts.isDark ? '#9fd0f0' : '#042c53'
  const fillC = opts.isDark ? 'rgba(100,181,246,0.25)' : 'rgba(91,147,207,0.25)'
  const textC = opts.isDark ? '#d7e8f7' : '#0a3557'

  if (shapes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><text x="50" y="32" text-anchor="middle" font-size="6" fill="${textC}" opacity="0.5">no 2D shapes</text></svg>`
  }
  const bb = bounds(shapes)!
  const margin = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY) * 0.08 + 0.05
  const vw = bb.maxX - bb.minX + 2 * margin
  const vh = bb.maxY - bb.minY + 2 * margin
  // y 翻转：SVG 的 y 与 GDL 相反，viewBox 取 -maxY 为上边界
  const vb = `${F(bb.minX - margin)} ${F(-(bb.maxY + margin))} ${F(vw)} ${F(vh)}`
  const sw = F(Math.max(vw, vh) / 300)
  /** GDL 点 → SVG 屏幕坐标（y 取负） */
  const sy = (p: P): P => ({ x: p.x, y: -p.y })

  const parts: string[] = []
  for (const s of shapes) {
    switch (s.type) {
      case 'line2': {
        const a = sy(tp(s.matrix, s.x1, s.y1)), b = sy(tp(s.matrix, s.x2, s.y2))
        parts.push(`<line x1="${F(a.x)}" y1="${F(a.y)}" x2="${F(b.x)}" y2="${F(b.y)}" stroke="${stroke}" stroke-width="${sw}"/>`)
        break
      }
      case 'rect2': {
        const a = sy(tp(s.matrix, s.x1, s.y1)), b = sy(tp(s.matrix, s.x2, s.y2))
        const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
        const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y)
        parts.push(`<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`)
        break
      }
      case 'circle2': {
        const c = sy(tp(s.matrix, s.x, s.y))
        parts.push(`<circle cx="${F(c.x)}" cy="${F(c.y)}" r="${F(s.r)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`)
        break
      }
      case 'arc2': {
        const c = sy(tp(s.matrix, s.x, s.y))
        // GDL 逆时针角；屏幕点 = (cx + r·cos a, cy − r·sin a) → 屏幕上逆时针 → sweep=0
        const a1 = s.a1 * Math.PI / 180, a2 = s.a2 * Math.PI / 180
        const p1 = { x: c.x + s.r * Math.cos(a1), y: c.y - s.r * Math.sin(a1) }
        const p2 = { x: c.x + s.r * Math.cos(a2), y: c.y - s.r * Math.sin(a2) }
        const large = ((a2 - a1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? 1 : 0
        parts.push(`<path d="M ${F(p1.x)} ${F(p1.y)} A ${F(s.r)} ${F(s.r)} 0 ${large} 0 ${F(p2.x)} ${F(p2.y)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`)
        break
      }
      case 'poly2': {
        const pts = s.pts.map(p => sy(tp(s.matrix, p.x, p.y)))
        if (pts.length < 2) break
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${F(p.x)} ${F(p.y)}`).join(' ')
        const close = (s.fill & 4) !== 0 ? ' Z' : ''
        const doFill = (s.fill & 2) !== 0 && close !== ''
        parts.push(`<path d="${d}${close}" ${doFill ? `fill="${fillC}"` : 'fill="none"'} stroke="${(s.fill & 1) !== 0 ? stroke : 'none'}" stroke-width="${sw}"/>`)
        break
      }
      case 'text2': {
        const c = sy(tp(s.matrix, s.x, s.y))
        const fs = Math.max(vw, vh) / 22
        parts.push(`<text x="${F(c.x)}" y="${F(c.y)}" font-size="${F(fs)}" fill="${textC}" font-family="JetBrains Mono, Consolas, monospace">${escapeXml(s.text)}</text>`)
        break
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${parts.join('\n')}</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
