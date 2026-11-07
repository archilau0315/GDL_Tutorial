/**
 * 学习进度共享状态：章节页脚与学习路径面板共用。
 * 只用 localStorage，不上传；首次挂载时才读取，SSR 安全。
 */
import { onMounted, ref, watch } from 'vue'

const KEY = 'gdl-progress-v1'
const done = ref<Set<string>>(new Set())
let initialized = false

function load(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (Array.isArray(saved)) done.value = new Set(saved.filter((x: unknown) => typeof x === 'string'))
  } catch {
    /* 记录损坏时从零开始 */
  }
}

function init(): void {
  if (initialized) return
  initialized = true
  load()
  watch(done, (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...value]))
    } catch {
      /* 隐私模式禁用存储时静默降级 */
    }
  })
  // 多标签页之间保持同步
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) load()
  })
}

export function useProgress() {
  onMounted(init)

  function toggle(id: string): void {
    const next = new Set(done.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    done.value = next
  }

  function reset(): void {
    done.value = new Set()
  }

  return { done, toggle, reset }
}
