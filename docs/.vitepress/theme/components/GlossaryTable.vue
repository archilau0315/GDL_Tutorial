<script setup lang="ts">
/**
 * 术语对照表：数据来自 reference/data/glossary.json（中英字段单源）。
 * 中英术语同排显示，支持关键词与分类筛选，按用途分组。
 */
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/glossary.json'

interface Term {
  id: string
  category: string
  term: Record<Locale, string>
  aka?: Record<Locale, string[]>
  desc: Record<Locale, string>
  chapter?: Record<Locale, string> | null
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as {
  categories: { id: string; zh: string; en: string }[]
  terms: Term[]
}

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const query = ref('')
const active = ref('all')

const cats = computed(() => [
  { id: 'all', label: t(loc.value, 'globAll') },
  ...data.categories.map(c => ({ id: c.id, label: c[loc.value] }))
])

const list = computed(() => {
  const q = query.value.trim().toLowerCase()
  return data.terms.filter((item) => {
    if (active.value !== 'all' && item.category !== active.value) return false
    if (!q) return true
    const hay = [
      item.term.zh,
      item.term.en,
      item.desc[loc.value],
      ...(item.aka?.[loc.value] ?? [])
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

/** 按分类分组，空分类不渲染 */
const groups = computed(() =>
  data.categories
    .map(c => ({ cat: c, items: list.value.filter(i => i.category === c.id) }))
    .filter(g => g.items.length)
)
</script>

<template>
  <div class="glossary">
    <div class="gl-toolbar">
      <input
        v-model="query"
        class="gl-search"
        type="search"
        :placeholder="t(loc, 'glSearch')"
        :aria-label="t(loc, 'glSearch')"
      >
      <span class="gl-count">{{ tf(loc, 'glFound', { n: list.length }) }}</span>
    </div>

    <div class="gl-cats">
      <button
        v-for="c in cats"
        :key="c.id"
        class="gl-chip"
        :class="{ on: active === c.id }"
        type="button"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="!list.length" class="gl-empty">{{ t(loc, 'globEmpty') }}</p>

    <section v-for="g in groups" :key="g.cat.id" class="gl-group">
      <h3 class="gl-group-title">{{ g.cat[loc] }}</h3>

      <article v-for="item in g.items" :id="`term-${item.id}`" :key="item.id" class="gl-card">
        <div class="gl-terms">
          <span class="gl-zh">{{ item.term.zh }}</span>
          <span class="gl-en">{{ item.term.en }}</span>
          <span v-if="item.aka?.[loc]?.length" class="gl-aka">{{ item.aka[loc].join(' / ') }}</span>
        </div>

        <p class="gl-desc">{{ item.desc[loc] }}</p>

        <a v-if="item.chapter?.[loc]" class="gl-link" :href="withBase(item.chapter[loc])">
          {{ t(loc, 'globChapter') }} →
        </a>
      </article>
    </section>

    <p class="gl-source">{{ t(loc, 'glSource') }}</p>
  </div>
</template>

<style scoped>
.glossary { margin-top: 24px; }

.gl-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.gl-search {
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
.gl-search:focus {
  outline: 2px solid var(--bp-400);
  outline-offset: 1px;
  border-color: var(--bp-400);
}

.gl-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.gl-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 8px;
}

.gl-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--bp-600);
  background: var(--bp-50);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.gl-chip:hover { border-color: var(--bp-400); }
.gl-chip.on {
  color: #fff;
  background: var(--bp-600);
  border-color: var(--bp-600);
}
.dark .gl-chip { color: var(--bp-100); background: rgba(55, 138, 221, 0.16); }
.dark .gl-chip.on { color: #061a30; background: var(--bp-200); border-color: var(--bp-200); }

.gl-group { margin-top: 24px; }

.gl-group-title {
  margin: 0 0 10px;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-border);
}

.gl-card {
  margin-bottom: 10px;
  padding: 12px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid var(--bp-300);
  border-radius: 8px;
  scroll-margin-top: 88px;
}

.gl-terms {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
}

.gl-zh {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.gl-en {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--bp-700);
}
.dark .gl-en { color: var(--bp-200); }

.gl-aka {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.gl-desc {
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.gl-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bp-600);
  text-decoration: none;
}
.gl-link:hover { text-decoration: underline; }
.dark .gl-link { color: var(--bp-200); }

.gl-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

.gl-source {
  margin-top: 24px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
