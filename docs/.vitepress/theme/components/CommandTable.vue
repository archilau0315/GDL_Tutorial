<script setup lang="ts">
/**
 * 命令速查表：数据来自 reference/data/commands.json（中英字段单源）。
 * 支持关键词搜索 + 分类筛选，渲染签名、参数、说明、最小示例与章节回链。
 */
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/commands.json'

interface Entry {
  name: string
  category: string
  syntax: string
  params: Record<Locale, string[]>
  desc: Record<Locale, string>
  example: string
  chapter: Record<Locale, string> | null
  aliases?: Record<Locale, string[]>
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as { meta: any; categories: { id: string; zh: string; en: string }[]; commands: Entry[] }

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const query = ref('')
const active = ref('all')

const cats = computed(() => [
  { id: 'all', label: t(loc.value, 'cmdAll') },
  ...data.categories.map(c => ({ id: c.id, label: c[loc.value] }))
])

// 每条命令都有独立详情页（构建期由 commands.json 生成），便于搜索与外部引用
const slug = (name: string) => name.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '')
const detail = (name: string) =>
  withBase(`${loc.value === 'en' ? '/en' : ''}/reference/commands/${slug(name)}`)

const list = computed(() => {
  const q = query.value.trim().toUpperCase()
  return data.commands.filter(c => {
    if (active.value !== 'all' && c.category !== active.value) return false
    if (!q) return true
    const hay = [
      c.name, c.syntax, c.desc[loc.value], ...c.params[loc.value], c.example,
      ...(c.aliases?.[loc.value] ?? [])
    ].join(' ').toUpperCase()
    return hay.includes(q)
  })
})
</script>

<template>
  <div class="cmd-table">
    <div class="cmd-toolbar">
      <input
        v-model="query"
        class="cmd-search"
        type="search"
        :placeholder="t(loc, 'cmdSearch')"
        :aria-label="t(loc, 'cmdSearch')"
      >
      <span class="cmd-count">{{ tf(loc, 'cmdFound', { n: list.length }) }}</span>
    </div>

    <div class="cmd-cats">
      <button
        v-for="c in cats"
        :key="c.id"
        class="cmd-chip"
        :class="{ on: active === c.id }"
        type="button"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="!list.length" class="cmd-empty">{{ t(loc, 'cmdEmpty') }}</p>

    <article v-for="c in list" :id="`cmd-${c.name}`" :key="c.name" class="cmd-card">
      <header class="cmd-head">
        <h3 class="cmd-name"><a :href="detail(c.name)">{{ c.name }}</a></h3>
        <code class="cmd-syntax">{{ c.syntax }}</code>
      </header>

      <p class="cmd-desc">{{ c.desc[loc] }}</p>

      <div class="cmd-body">
        <div class="cmd-block">
          <span class="cmd-label">{{ t(loc, 'cmdParams') }}</span>
          <ul class="cmd-params">
            <li v-for="(p, i) in c.params[loc]" :key="i">{{ p }}</li>
          </ul>
        </div>
        <div class="cmd-block">
          <span class="cmd-label">{{ t(loc, 'cmdExample') }}</span>
          <pre class="cmd-example"><code>{{ c.example }}</code></pre>
        </div>
      </div>

      <a v-if="c.chapter?.[loc]" class="cmd-link" :href="withBase(c.chapter[loc])">
        {{ t(loc, 'cmdChapter') }} →
      </a>
    </article>

    <p class="cmd-source">{{ t(loc, 'cmdSource') }}</p>
  </div>
</template>

<style scoped>
.cmd-table { margin-top: 24px; }

.cmd-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.cmd-search {
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
.cmd-search:focus {
  outline: 2px solid var(--bp-400);
  outline-offset: 1px;
  border-color: var(--bp-400);
}

.cmd-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.cmd-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 20px;
}

.cmd-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--bp-600);
  background: var(--bp-50);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.cmd-chip:hover { border-color: var(--bp-400); }
.cmd-chip.on {
  color: #fff;
  background: var(--bp-600);
  border-color: var(--bp-600);
}
.dark .cmd-chip { color: var(--bp-100); background: rgba(55, 138, 221, 0.16); }
.dark .cmd-chip.on { color: #061a30; background: var(--bp-200); border-color: var(--bp-200); }

.cmd-card {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid var(--bp-400);
  border-radius: 8px;
  scroll-margin-top: 88px;
}

.cmd-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: baseline;
}

.cmd-name {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--bp-800);
  letter-spacing: 0.02em;
}
.dark .cmd-name { color: var(--bp-100); }

.cmd-name a {
  color: inherit;
  text-decoration: none;
}

.cmd-name a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.cmd-syntax {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
  padding: 2px 6px;
}

.cmd-desc {
  margin: 10px 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.cmd-body {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 1.4fr);
  gap: 12px 20px;
}
@media (max-width: 640px) {
  .cmd-body { grid-template-columns: 1fr; }
}

.cmd-label {
  display: block;
  margin-bottom: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.cmd-params {
  margin: 0;
  padding-left: 16px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.cmd-example {
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

.cmd-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bp-600);
  text-decoration: none;
}
.cmd-link:hover { text-decoration: underline; }
.dark .cmd-link { color: var(--bp-200); }

.cmd-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

.cmd-source {
  margin-top: 24px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
