<script setup lang="ts">
/**
 * GLOB 变量速查表：数据来自 reference/data/globals.json（中英字段单源）。
 * 关键词搜索 + 分类筛选，渲染类型、说明、最小示例与章节回链。
 */
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/globals.json'

type Kind = 'number' | 'string' | 'array'

interface Entry {
  name: string
  category: string
  type: Kind
  desc: Record<Locale, string>
  example: string
  chapter: Record<Locale, string> | null
  aliases?: Record<Locale, string[]>
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as { categories: { id: string; zh: string; en: string }[]; globals: Entry[] }

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const query = ref('')
const active = ref('all')

const cats = computed(() => [
  { id: 'all', label: t(loc.value, 'globAll') },
  ...data.categories.map(c => ({ id: c.id, label: c[loc.value] }))
])

const typeLabel = (type: Kind): string =>
  t(loc.value, type === 'number' ? 'globTypeNumber' : type === 'string' ? 'globTypeString' : 'globTypeArray')

const list = computed(() => {
  const q = query.value.trim().toUpperCase()
  return data.globals.filter((g) => {
    if (active.value !== 'all' && g.category !== active.value) return false
    if (!q) return true
    const hay = [g.name, g.desc[loc.value], g.example, ...(g.aliases?.[loc.value] ?? [])]
      .join(' ')
      .toUpperCase()
    return hay.includes(q)
  })
})
</script>

<template>
  <div class="glob-table">
    <div class="glob-toolbar">
      <input
        v-model="query"
        class="glob-search"
        type="search"
        :placeholder="t(loc, 'globSearch')"
        :aria-label="t(loc, 'globSearch')"
      >
      <span class="glob-count">{{ tf(loc, 'globFound', { n: list.length }) }}</span>
    </div>

    <div class="glob-cats">
      <button
        v-for="c in cats"
        :key="c.id"
        class="glob-chip"
        :class="{ on: active === c.id }"
        type="button"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="!list.length" class="glob-empty">{{ t(loc, 'globEmpty') }}</p>

    <article v-for="g in list" :id="`glob-${g.name}`" :key="g.name" class="glob-card">
      <header class="glob-head">
        <h3 class="glob-name">{{ g.name }}</h3>
        <span class="glob-type" :data-kind="g.type">{{ typeLabel(g.type) }}</span>
        <span class="glob-cat">{{ data.categories.find(c => c.id === g.category)?.[loc] }}</span>
      </header>

      <p class="glob-desc">{{ g.desc[loc] }}</p>

      <pre class="glob-example"><code>{{ g.example }}</code></pre>

      <a v-if="g.chapter?.[loc]" class="glob-link" :href="withBase(g.chapter[loc])">
        {{ t(loc, 'globChapter') }} →
      </a>
    </article>

    <p class="glob-source">{{ t(loc, 'globSource') }}</p>
  </div>
</template>

<style scoped>
.glob-table { margin-top: 24px; }

.glob-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.glob-search {
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
.glob-search:focus {
  outline: 2px solid var(--bp-400);
  outline-offset: 1px;
  border-color: var(--bp-400);
}

.glob-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.glob-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 20px;
}

.glob-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--bp-600);
  background: var(--bp-50);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.glob-chip:hover { border-color: var(--bp-400); }
.glob-chip.on {
  color: #fff;
  background: var(--bp-600);
  border-color: var(--bp-600);
}
.dark .glob-chip { color: var(--bp-100); background: rgba(55, 138, 221, 0.16); }
.dark .glob-chip.on { color: #061a30; background: var(--bp-200); border-color: var(--bp-200); }

.glob-card {
  margin-bottom: 14px;
  padding: 14px 18px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid var(--bp-300);
  border-radius: 8px;
  scroll-margin-top: 88px;
}

.glob-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: baseline;
}

.glob-name {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 15.5px;
  font-weight: 600;
  color: var(--bp-800);
  letter-spacing: 0.02em;
}
.dark .glob-name { color: var(--bp-100); }

.glob-type,
.glob-cat {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
}

.glob-type[data-kind='number'] { color: #0b7285; border-color: rgba(11, 114, 133, 0.35); }
.glob-type[data-kind='string'] { color: #9c36b5; border-color: rgba(156, 54, 181, 0.35); }
.glob-type[data-kind='array'] { color: #e8590c; border-color: rgba(232, 89, 12, 0.35); }
.dark .glob-type[data-kind='number'] { color: #66d9e8; }
.dark .glob-type[data-kind='string'] { color: #e599f7; }
.dark .glob-type[data-kind='array'] { color: #ffa94d; }

.glob-desc {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.glob-example {
  margin: 0;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.6;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.glob-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bp-600);
  text-decoration: none;
}
.glob-link:hover { text-decoration: underline; }
.dark .glob-link { color: var(--bp-200); }

.glob-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

.glob-source {
  margin-top: 24px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
