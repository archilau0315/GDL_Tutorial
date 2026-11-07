/**
 * 编辑器内联补全：取光标前正在输入的命令名，给出前缀候选和弹出坐标。
 * Tab / Enter 取用，Esc 忽略到下一个词，避免打断正常敲代码。
 */
import { ref, type Ref } from 'vue'
import raw from '../../reference/data/commands.json'

export interface SuggestItem {
  name: string
  syntax: string
}

const commands = (raw as { commands: SuggestItem[] }).commands
let ctx: CanvasRenderingContext2D | null = null

export function useEditorSuggest(textarea: Ref<HTMLTextAreaElement | undefined>) {
  const items = ref<SuggestItem[]>([])
  const active = ref(false)
  const index = ref(0)
  const left = ref(0)
  const top = ref(0)
  let ignored = ''

  function close(): void {
    active.value = false
  }

  function currentWord(): string {
    const ta = textarea.value
    if (!ta) return ''
    return ta.value.slice(0, ta.selectionStart).match(/[A-Za-z_]+$/)?.[0] ?? ''
  }

  /** 用等宽字体宽度 + 行列号估算光标像素位置，避免为 textarea 做镜像层 */
  function caretPos(ta: HTMLTextAreaElement, line: number, col: number): { left: number; top: number } {
    const style = getComputedStyle(ta)
    const fontSize = parseFloat(style.fontSize) || 13
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.55
    ctx ??= document.createElement('canvas').getContext('2d')
    if (ctx) ctx.font = `${fontSize}px ${style.fontFamily}`
    const charW = ctx?.measureText('M').width || fontSize * 0.6
    const padTop = parseFloat(style.paddingTop) || 8
    const padLeft = parseFloat(style.paddingLeft) || 12
    return {
      left: padLeft + col * charW - ta.scrollLeft,
      top: padTop + (line + 1) * lineHeight - ta.scrollTop
    }
  }

  function refresh(): void {
    const ta = textarea.value
    if (!ta || ta.selectionStart !== ta.selectionEnd) return close()
    const word = currentWord()
    if (word.length < 2 || word === ignored) return close()
    const q = word.toLowerCase()
    const hit = commands.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 6)
    if (!hit.length) return close()

    const before = ta.value.slice(0, ta.selectionStart)
    const line = before.split('\n').length - 1
    const col = before.length - before.lastIndexOf('\n') - 1
    const pos = caretPos(ta, line, col)
    // 气泡挂在 .pg-code-wrap 上，要加上 textarea 相对它的偏移（左侧行号槽）
    const popupW = 200
    const popupH = hit.length * 24 + 20
    let topY = pos.top + 2
    if (topY + popupH > ta.clientHeight) topY = Math.max(0, pos.top - popupH - 2)

    items.value = hit
    index.value = 0
    left.value = Math.max(0, Math.min(pos.left + ta.offsetLeft, ta.offsetLeft + ta.clientWidth - popupW))
    top.value = topY
    active.value = true
  }

  function move(step: number): void {
    const n = items.value.length
    if (n) index.value = (index.value + step + n) % n
  }

  function take(at = index.value): SuggestItem | null {
    const item = items.value[at] ?? null
    ignored = ''
    close()
    return item
  }

  function dismiss(): void {
    ignored = currentWord()
    close()
  }

  return { items, active, index, left, top, refresh, move, take, dismiss }
}
