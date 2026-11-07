<script setup lang="ts">
/**
 * 常见错误手册：数据来自 reference/data/errors.json（中英字段单源）。
 * 按报错消息、原因、改法组织，附「错误写法 / 正确写法」对照。
 */
import { computed, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/errors.json'

interface Entry {
  id: string
  category: string
  message: Record<Locale, string>
  cause: Record<Locale, string>
  fix: Record<Locale, string>
  bad: string
  good: string
  chapter: Record<Locale, string> | null
}

const props = defineProps<{ locale?: Locale }>()
const data = raw as { categories: { id: string; zh: string; en: string }[]; errors: Entry[] }

const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))

const query = ref('')
const active = ref('all')

const cats = computed(() => [
  { id: 'all', label: t(loc.value, 'errAll') },
  ...data.categories.map(c => ({ id: c.id, label: c[loc.value] }))
])

const list = computed(() => {
  const q = query.value.trim().toUpperCase()
  return data.errors.filter((e) => {
    if (active.value !== 'all' && e.category !== active.value) return false
    if (!q) return true
    const hay = [e.message[loc.value], e.cause[loc.value], e.fix[loc.value], e.bad, e.good]
      .join(' ')
      .toUpperCase()
    return hay.includes(q)
  })
})
</script>

<template>
  <div class="err-list">
    <div class="err-toolbar">
      <input
        v-model="query"
        class="err-search"
        type="search"
        :placeholder="t(loc, 'errSearch')"
        :aria-label="t(loc, 'errSearch')"
      >
      <span class="err-count">{{ tf(loc, 'errFound', { n: list.length }) }}</span>
    </div>

    <div class="err-cats">
      <button
        v-for="c in cats"
        :key="c.id"
        class="err-chip"
        :class="{ on: active === c.id }"
        type="button"
        @click="active = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="!list.length" class="err-empty">{{ t(loc, 'errEmpty') }}</p>

    <article v-for="e in list" :id="`err-${e.id}`" :key="e.id" class="err-card">
      <header class="err-head">
        <span class="err-sign">!</span>
        <h3 class="err-msg">{{ e.message[loc] }}</h3>
      </header>

      <dl class="err-body">
        <dt>{{ t(loc, 'errCause') }}</dt>
        <dd>{{ e.cause[loc] }}</dd>
        <dt>{{ t(loc, 'errFix') }}</dt>
        <dd>{{ e.fix[loc] }}</dd>
      </dl>

      <div class="err-codes">
        <div class="err-code bad">
          <span class="err-tag">{{ t(loc, 'errBad') }}</span>
          <pre><code>{{ e.bad }}</code></pre>
        </div>
        <div class="err-code good">
          <span class="err-tag">{{ t(loc, 'errGood') }}</span>
          <pre><code>{{ e.good }}</code></pre>
        </div>
      </div>

      <a v-if="e.chapter?.[loc]" class="err-link" :href="withBase(e.chapter[loc])">
        {{ t(loc, 'errChapter') }} →
      </a>
    </article>

    <p class="err-source">{{ t(loc, 'errSource') }}</p>
  </div>
</template>

<style scoped>
.err-list { margin-top: 24px; }

.err-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.err-search {
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
.err-search:focus {
  outline: 2px solid var(--bp-400);
  outline-offset: 1px;
  border-color: var(--bp-400);
}

.err-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.err-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 20px;
}

.err-chip {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--bp-600);
  background: var(--bp-50);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.err-chip:hover { border-color: var(--bp-400); }
.err-chip.on {
  color: #fff;
  background: var(--bp-600);
  border-color: var(--bp-600);
}
.dark .err-chip { color: var(--bp-100); background: rgba(55, 138, 221, 0.16); }
.dark .err-chip.on { color: #061a30; background: var(--bp-200); border-color: var(--bp-200); }

.err-card {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid #e03131;
  border-radius: 8px;
  scroll-margin-top: 88px;
}

.err-head {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.err-sign {
  flex: none;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #e03131;
  border-radius: 50%;
  transform: translateY(2px);
}

.err-msg {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.err-body {
  margin: 10px 0 12px;
}

.err-body dt {
  margin-top: 8px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.err-body dd {
  margin: 2px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.err-codes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 640px) {
  .err-codes { grid-template-columns: 1fr; }
}

.err-code {
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  overflow: hidden;
}

.err-code pre {
  margin: 0;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}

.err-tag {
  display: block;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.err-code.bad .err-tag { color: #c92a2a; background: rgba(224, 49, 49, 0.1); }
.err-code.good .err-tag { color: #2b8a3e; background: rgba(43, 138, 62, 0.1); }
.dark .err-code.bad .err-tag { color: #ff8787; }
.dark .err-code.good .err-tag { color: #8ce99a; }

.err-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bp-600);
  text-decoration: none;
}
.err-link:hover { text-decoration: underline; }
.dark .err-link { color: var(--bp-200); }

.err-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

.err-source {
  margin-top: 24px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
