<script setup lang="ts">
/**
 * 学习进度面板：数据来自 reference/data/chapters.json（中英字段单源）。
 * 进度保存在本机 localStorage，不采集、不上传。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/chapters.json'

interface Chapter {
  id: string
  num: number
  part: string
  title: Record<Locale, string>
  href: Record<Locale, string>
}
interface Part {
  id: string
  sheet: string
  title: Record<Locale, string>
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as { parts: Part[]; chapters: Chapter[] }

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const KEY = 'gdl-progress-v1'
const done = ref<Set<string>>(new Set())
const ready = ref(false)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (Array.isArray(saved)) done.value = new Set(saved.filter((x: unknown) => typeof x === 'string'))
  } catch {
    /* 本地记录损坏时从零开始 */
  }
  ready.value = true
})

watch(done, (value) => {
  if (!ready.value) return
  try {
    localStorage.setItem(KEY, JSON.stringify([...value]))
  } catch {
    /* 隐私模式禁用存储时静默降级 */
  }
})

function toggle(id: string): void {
  const next = new Set(done.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  done.value = next
}

function reset(): void {
  done.value = new Set()
}

const groups = computed(() =>
  data.parts.map((p) => {
    const list = data.chapters.filter(c => c.part === p.id)
    const hit = list.filter(c => done.value.has(c.id)).length
    return { ...p, list, hit, total: list.length, pct: list.length ? Math.round((hit / list.length) * 100) : 0 }
  })
)

const totalHit = computed(() => data.chapters.filter(c => done.value.has(c.id)).length)
const totalPct = computed(() => Math.round((totalHit.value / data.chapters.length) * 100))
</script>

<template>
  <section class="prog">
    <header class="prog-head">
      <div class="prog-summary">
        <strong class="prog-num">{{ totalHit }} / {{ data.chapters.length }}</strong>
        <span class="prog-label">{{ tf(loc, 'progSummary', { pct: totalPct }) }}</span>
      </div>
      <button class="prog-reset" type="button" @click="reset">{{ t(loc, 'progReset') }}</button>
    </header>

    <div class="prog-bar" role="progressbar" :aria-valuenow="totalPct" aria-valuemin="0" aria-valuemax="100">
      <span class="prog-fill" :style="{ width: totalPct + '%' }" />
    </div>

    <div v-for="g in groups" :key="g.id" class="prog-group">
      <div class="prog-group-head">
        <span class="prog-group-title">{{ g.title[loc] }}</span>
        <span class="prog-group-sheet">{{ g.sheet }}</span>
        <span class="prog-group-count">{{ g.hit }} / {{ g.total }}</span>
      </div>
      <div class="prog-bar slim"><span class="prog-fill" :style="{ width: g.pct + '%' }" /></div>

      <ul class="prog-list">
        <li v-for="c in g.list" :key="c.id" class="prog-item" :class="{ on: done.has(c.id) }">
          <label class="prog-check">
            <input
              type="checkbox"
              :checked="done.has(c.id)"
              :aria-label="`${t(loc, 'progMark')} GDL-${String(c.num).padStart(2, '0')}`"
              @change="toggle(c.id)"
            >
            <span class="prog-code">GDL-{{ String(c.num).padStart(2, '0') }}</span>
            <span class="prog-title">{{ c.title[loc] }}</span>
          </label>
          <a class="prog-link" :href="withBase(c.href[loc])">{{ t(loc, 'progOpen') }} →</a>
        </li>
      </ul>
    </div>

    <p class="prog-hint">{{ t(loc, 'progHint') }}</p>
  </section>
</template>

<style scoped>
.prog {
  margin: 24px 0 32px;
  padding: 18px 20px 14px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
}

.prog-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
}

.prog-summary {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.prog-num {
  font-family: var(--vp-font-family-mono);
  font-size: 22px;
  color: var(--bp-600);
}
.dark .prog-num { color: var(--bp-200); }

.prog-label {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.prog-reset {
  padding: 3px 11px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.prog-reset:hover { color: var(--bp-600); border-color: var(--bp-400); }
.dark .prog-reset:hover { color: var(--bp-200); }

.prog-bar {
  height: 8px;
  margin: 12px 0 4px;
  background: var(--vp-c-default-soft);
  border-radius: 999px;
  overflow: hidden;
}
.prog-bar.slim { height: 4px; margin: 6px 0 10px; }

.prog-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--bp-400), var(--bp-600));
  border-radius: 999px;
  transition: width 0.25s ease;
}
.dark .prog-fill { background: linear-gradient(90deg, var(--bp-200), var(--bp-400)); }

.prog-group { margin-top: 20px; }

.prog-group-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: baseline;
}

.prog-group-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.prog-group-sheet,
.prog-group-count {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}
.prog-group-count { margin-left: auto; }

.prog-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.prog-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 2px;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.prog-item:last-child { border-bottom: 0; }

.prog-check {
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
  cursor: pointer;
}

.prog-check input {
  flex: none;
  width: 15px;
  height: 15px;
  accent-color: var(--bp-600);
  cursor: pointer;
}

.prog-code {
  flex: none;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.prog-title {
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prog-item.on .prog-title { color: var(--vp-c-text-1); }

.prog-link {
  flex: none;
  font-size: 12px;
  color: var(--bp-600);
  text-decoration: none;
}
.prog-link:hover { text-decoration: underline; }
.dark .prog-link { color: var(--bp-200); }

.prog-hint {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
