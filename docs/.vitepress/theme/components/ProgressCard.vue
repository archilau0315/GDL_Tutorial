<script setup lang="ts">
/**
 * 首页学习卡片：显示总进度与下一站，入口直达学习路径页。
 * 进度与章节页脚共享 useProgress，纯前端、不采集数据。
 */
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import { useProgress } from '../useProgress'
import raw from '../../../reference/data/chapters.json'

interface Chapter {
  id: string
  num: number
  part: string
  title: Record<Locale, string>
  href: Record<Locale, string>
}

const book = raw as { chapters: Chapter[] }
const props = defineProps<{ locale?: Locale }>()
const { lang } = useData()
const loc = computed<Locale>(() => props.locale ?? (lang.value.startsWith('en') ? 'en' : 'zh'))
const { done } = useProgress()

const hit = computed(() => book.chapters.filter(c => done.value.has(c.id)).length)
const total = book.chapters.length
const pct = computed(() => Math.round((hit.value / total) * 100))
const nextUp = computed(() => book.chapters.find(c => !done.value.has(c.id)) ?? null)
const guide = computed(() => withBase(loc.value === 'en' ? '/en/guide/' : '/guide/'))

const line = computed(() => {
  if (!hit.value) return t(loc.value, 'progCardEmpty')
  if (!nextUp.value) return tf(loc.value, 'progCardDone', { total })
  return tf(loc.value, 'progCardNext', { title: nextUp.value.title[loc.value] })
})
</script>

<template>
  <section class="pcard">
    <div class="pcard-head">
      <span class="pcard-title">{{ t(loc, 'progCardTitle') }}</span>
      <span class="pcard-count">{{ tf(loc, 'progOverall', { done: hit, total }) }}</span>
    </div>

    <div class="pcard-bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
      <span class="pcard-fill" :style="{ width: pct + '%' }" />
    </div>

    <div class="pcard-foot">
      <span class="pcard-line">{{ line }}</span>
      <a class="pcard-go" :href="withBase((nextUp ?? book.chapters[0]).href[loc])">
        {{ hit ? t(loc, 'progContinue') : t(loc, 'progStart') }} →
      </a>
      <a class="pcard-all" :href="guide">{{ t(loc, 'progCardAll') }}</a>
    </div>
  </section>
</template>

<style scoped>
.pcard {
  max-width: 760px;
  margin: 8px auto 24px;
  padding: 16px 20px;
  text-align: left;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid var(--bp-400);
  border-radius: 10px;
}

.pcard-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.pcard-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.pcard-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.pcard-bar {
  height: 6px;
  margin: 10px 0 12px;
  background: var(--vp-c-default-soft);
  border-radius: 999px;
  overflow: hidden;
}

.pcard-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--bp-400), var(--bp-600));
  border-radius: 999px;
  transition: width 0.25s ease;
}
.dark .pcard-fill { background: linear-gradient(90deg, var(--bp-200), var(--bp-400)); }

.pcard-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
}

.pcard-line {
  flex: 1 1 220px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.pcard-go {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--bp-600);
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s;
}
.pcard-go:hover { background: var(--bp-700); }
.dark .pcard-go { color: #061a30; background: var(--bp-200); }
.dark .pcard-go:hover { background: var(--bp-100); }

.pcard-all {
  font-size: 12.5px;
  color: var(--bp-600);
  text-decoration: none;
  white-space: nowrap;
}
.pcard-all:hover { text-decoration: underline; }
.dark .pcard-all { color: var(--bp-200); }
</style>
