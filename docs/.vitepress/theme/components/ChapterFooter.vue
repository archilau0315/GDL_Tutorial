<script setup lang="ts">
/**
 * 章节页脚：自动识别当前页属于哪一章，提供「上一章 / 标记学完 / 下一章」。
 * 章节清单来自 reference/data/chapters.json，与学习路径页共用同一份进度。
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
const { lang, page } = useData()
const loc = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'zh'))
const { done, toggle } = useProgress()

/** 当前页 → 章节下标（英文页去掉 /en 前缀后与中文 href 对齐） */
const index = computed(() => {
  const rel = page.value.relativePath.replace(/\.md$/, '').replace(/^en\//, '')
  return book.chapters.findIndex(c => c.href.zh === '/' + rel)
})

const current = computed(() => (index.value >= 0 ? book.chapters[index.value] : null))
const prev = computed(() => (index.value > 0 ? book.chapters[index.value - 1] : null))
const next = computed(() =>
  index.value >= 0 && index.value < book.chapters.length - 1 ? book.chapters[index.value + 1] : null
)
const hit = computed(() => book.chapters.filter(c => done.value.has(c.id)).length)
</script>

<template>
  <footer v-if="current" class="chfoot">
    <a v-if="prev" class="chfoot-nav prev" :href="withBase(prev.href[loc])">
      <span class="chfoot-dir">← {{ t(loc, 'progPrev') }}</span>
      <span class="chfoot-name">{{ prev.title[loc] }}</span>
    </a>
    <span v-else class="chfoot-nav" />

    <label class="chfoot-mark" :class="{ on: done.has(current.id) }">
      <input
        type="checkbox"
        :checked="done.has(current.id)"
        @change="toggle(current.id)"
      >
      <span>{{ done.has(current.id) ? t(loc, 'progDoneChapter') : t(loc, 'progMarkChapter') }}</span>
      <em class="chfoot-count">{{ tf(loc, 'progOverall', { done: hit, total: book.chapters.length }) }}</em>
    </label>

    <a v-if="next" class="chfoot-nav next" :href="withBase(next.href[loc])">
      <span class="chfoot-dir">{{ t(loc, 'progNext') }} →</span>
      <span class="chfoot-name">{{ next.title[loc] }}</span>
    </a>
    <span v-else class="chfoot-nav" />
  </footer>
</template>

<style scoped>
.chfoot {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  margin-top: 40px;
  padding-top: 18px;
  border-top: 1px solid var(--vp-c-divider);
}

.chfoot-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-decoration: none;
}
.chfoot-nav.next { align-items: flex-end; text-align: right; }

.chfoot-dir {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.chfoot-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--bp-600);
}
.chfoot-nav:hover .chfoot-name { text-decoration: underline; }
.dark .chfoot-name { color: var(--bp-200); }

.chfoot-mark {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 5px 12px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.chfoot-mark:hover { border-color: var(--bp-400); }
.chfoot-mark.on { color: var(--bp-600); border-color: var(--bp-400); }
.dark .chfoot-mark.on { color: var(--bp-200); }

.chfoot-mark input {
  width: 14px;
  height: 14px;
  accent-color: var(--bp-600);
  cursor: pointer;
}

.chfoot-count {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-style: normal;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .chfoot {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .chfoot-nav { align-items: center; text-align: center; }
  .chfoot-mark { order: -1; }
}
</style>
