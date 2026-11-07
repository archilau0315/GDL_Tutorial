<script setup lang="ts">
/**
 * 代码片段库：数据来自 reference/data/snippets.json（中英字段单源）。
 * 关键词搜索 + 分类筛选 + 一键复制。
 */
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/snippets.json'

interface Entry {
  id: string
  category: string
  title: Record<Locale, string>
  desc: Record<Locale, string>
  code: string
  chapter: Record<Locale, string> | null
  tags: Record<Locale, string[]>
  sandbox: boolean
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as { categories: { id: string; zh: string; en: string }[]; snippets: Entry[] }

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const query = ref('')
const active = ref('all')
const copiedId = ref('')

const cats = computed(() => [
  { id: 'all', label: t(loc.value, 'snipAll') },
  ...data.categories.map(c => ({ id: c.id, label: c[loc.value] }))
])

const list = computed(() => {
  const q = query.value.trim().toUpperCase()
  return data.snippets.filter((s) => {
    if (active.value !== 'all' && s.category !== active.value) return false
    if (!q) return true
    const hay = [s.title[loc.value], s.desc[loc.value], s.code, ...(s.tags?.[loc.value] ?? [])]
      .join(' ')
      .toUpperCase()
    return hay.includes(q)
  })
})

async function copy(id: string, code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = code
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copiedId.value = id
  setTimeout(() => { if (copiedId.value === id) copiedId.value = '' }, 1600)
}
</script>

<template>
  <div class="snip-list">
    <div class="snip-toolbar">
      <input
        v-model="query"
        class="snip-search"
        type="search"
        :placeholder="t(loc, 'snipSearch')"
        :aria-label="t(loc, 'snipSearch')"
      >
      <span class="snip-count">{{ tf(loc, 'snipFound', { n: list.length }) }}</span>
    </div>

    <div class="snip-cats">
      <button
        v-for="c in cats"
        :key="c.id"
        class="snip-chip"
        :class="{ on: active === c.id }"
        type="button"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="!list.length" class="snip-empty">{{ t(loc, 'snipEmpty') }}</p>

    <article v-for="s in list" :id="`snip-${s.id}`" :key="s.id" class="snip-card">
      <header class="snip-head">
        <h3 class="snip-title">{{ s.title[loc] }}</h3>
        <span v-if="s.sandbox" class="snip-badge">{{ t(loc, 'snipRunnable') }}</span>
        <button class="snip-copy" type="button" @click="copy(s.id, s.code)">
          {{ copiedId === s.id ? t(loc, 'snipCopied') : t(loc, 'snipCopy') }}
        </button>
      </header>

      <p class="snip-desc">{{ s.desc[loc] }}</p>

      <pre class="snip-code"><code>{{ s.code }}</code></pre>

      <footer class="snip-foot">
        <span v-for="tag in s.tags?.[loc]" :key="tag" class="snip-tag">{{ tag }}</span>
        <a v-if="s.chapter?.[loc]" class="snip-link" :href="withBase(s.chapter[loc])">
          {{ t(loc, 'snipChapter') }} →
        </a>
      </footer>
    </article>

    <p class="snip-source">{{ t(loc, 'snipSource') }}</p>
  </div>
</template>

<style scoped>
.snip-list { margin-top: 24px; }

.snip-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.snip-search {
  flex: 1 1 240px;
  min-width: 0;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-family: var(--vp-font-family-base);
}
.snip-search:focus {
  outline: 2px solid var(--bp-400);
  outline-offset: 1px;
  border-color: var(--bp-400);
}

.snip-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.snip-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 20px;
}

.snip-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--bp-600);
  background: var(--bp-50);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.snip-chip:hover { border-color: var(--bp-400); }
.snip-chip.on {
  color: #fff;
  background: var(--bp-600);
  border-color: var(--bp-600);
}
.dark .snip-chip { color: var(--bp-100); background: rgba(55, 138, 221, 0.16); }
.dark .snip-chip.on { color: #061a30; background: var(--bp-200); border-color: var(--bp-200); }

.snip-card {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid var(--bp-400);
  border-radius: 8px;
  scroll-margin-top: 88px;
}

.snip-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
}

.snip-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.snip-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 999px;
  color: #0b7285;
  border: 1px solid rgba(11, 114, 133, 0.35);
}
.dark .snip-badge { color: #66d9e8; }

.snip-copy {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.snip-copy:hover { color: var(--bp-600); border-color: var(--bp-400); }

.snip-desc {
  margin: 8px 0 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.snip-code {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.65;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.snip-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  margin-top: 10px;
}

.snip-tag {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-alt);
}

.snip-link {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bp-600);
  text-decoration: none;
}
.snip-link:hover { text-decoration: underline; }
.dark .snip-link { color: var(--bp-200); }

.snip-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

.snip-source {
  margin-top: 24px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
