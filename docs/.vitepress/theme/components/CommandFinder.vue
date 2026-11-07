/**
 * 沙盒内的命令搜索栏：输入即出候选（命令名 / 别名 / 语法 / 说明），
 * 回车把语法模板插入编辑器并选中参数占位，方便直接填数字。
 */
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { t, type Locale } from '../i18n'
import raw from '../../../reference/data/commands.json'

interface Cmd {
  name: string
  category: string
  syntax: string
  desc: Record<Locale, string>
  aliases?: Record<Locale, string[]>
}

const data = raw as {
  commands: Cmd[]
  categories: ({ id: string } & Record<Locale, string>)[]
}

const { lang } = useData()
const loc = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'zh'))

const emit = defineEmits<{ (e: 'insert', payload: { name: string; syntax: string }): void }>()

const open = ref(false)
const query = ref('')
const cursor = ref(0)
const input = ref<HTMLInputElement>()

const catMap = new Map(data.categories.map(c => [c.id, c]))

/** 菜单里显示的命令分类名（跟随界面语言） */
function catName(id: string): string {
  return catMap.get(id)?.[loc.value] ?? ''
}

/** 打分：命令名命中优先，其次别名、语法，最后说明文字 */
function score(c: Cmd, q: string): number {
  const name = c.name.toLowerCase()
  if (name === q) return 100
  if (name.startsWith(q)) return 90
  if (name.includes(q)) return 80
  const alias = (c.aliases?.[loc.value] ?? []).map(a => a.toLowerCase())
  if (alias.some(a => a.startsWith(q))) return 70
  if (alias.some(a => a.includes(q))) return 60
  if (c.syntax.toLowerCase().includes(q)) return 50
  // 说明文字只做补充匹配：英文查询至少 4 个字符，避免 add 命中 "adds a group"
  const desc = c.desc[loc.value].toLowerCase()
  if (desc.includes(q) && (q.length >= 4 || /[^\x20-\x7f]/.test(q))) return 40
  return 0
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return data.commands.slice(0, 8)
  return data.commands
    .map(c => ({ c, s: score(c, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name))
    .slice(0, 8)
    .map(x => x.c)
})

function move(step: number): void {
  const n = results.value.length
  if (!n) return
  open.value = true
  cursor.value = (cursor.value + step + n) % n
}

function pick(cmd = results.value[cursor.value]): void {
  if (!cmd) return
  emit('insert', { name: cmd.name, syntax: cmd.syntax })
  query.value = ''
  cursor.value = 0
  open.value = false
}

function focus(): void {
  input.value?.focus()
  input.value?.select()
  open.value = true
}

/** 失焦延迟关闭，留出点击候选项的时间；重新聚焦时要取消这次关闭 */
let blurTimer: ReturnType<typeof setTimeout> | undefined

function onFocus(): void {
  clearTimeout(blurTimer)
  open.value = true
}

function onInput(): void {
  cursor.value = 0
  clearTimeout(blurTimer)
  open.value = true
}

function onBlur(): void {
  blurTimer = setTimeout(() => { open.value = false }, 120)
}

defineExpose({ focus })
</script>

<template>
  <div class="finder">
    <span class="finder-ico" aria-hidden="true">⌕</span>
    <input
      ref="input"
      v-model="query"
      class="finder-input"
      type="search"
      :placeholder="t(loc, 'findPlaceholder')"
      :aria-label="t(loc, 'findPlaceholder')"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pick()"
      @keydown.esc="open = false"
    >
    <ul v-if="open" class="finder-list">
      <li
        v-for="(c, i) in results"
        :key="c.name"
        class="finder-item"
        :class="{ on: i === cursor }"
        @mousedown.prevent="pick(c)"
        @mouseenter="cursor = i"
      >
        <span class="f-name">{{ c.name }}</span>
        <span class="f-syntax">{{ c.syntax }}</span>
        <span class="f-cat">{{ catName(c.category) }}</span>
      </li>
      <li v-if="!results.length" class="finder-empty">{{ t(loc, 'findEmpty') }}</li>
    </ul>
  </div>
</template>

<style scoped>
.finder {
  position: relative;
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
  max-width: 360px;
  height: 24px;
  padding: 0 8px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 5px;
}
.finder:focus-within { border-color: var(--bp-400); }

.finder-ico {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.finder-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  font-size: 11.5px;
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-1);
  background: transparent;
  border: 0;
  outline: none;
  appearance: none;
}
.finder-input::placeholder { color: var(--vp-c-text-3); }
/* 去掉 WebKit 自带的清除按钮，节省窄栏空间 */
.finder-input::-webkit-search-cancel-button { display: none; }

.finder-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 40;
  width: min(360px, 88vw);
  max-height: 248px;
  padding: 4px;
  margin: 0;
  overflow-y: auto;
  list-style: none;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.finder-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 8px;
  padding: 5px 7px;
  border-radius: 5px;
  cursor: pointer;
}
.finder-item.on { background: var(--bp-50); }
.dark .finder-item.on { background: rgba(55, 138, 221, 0.16); }

.f-name {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--bp-700);
}
.dark .f-name { color: var(--bp-200); }

.f-cat {
  grid-column: 2;
  grid-row: 2;
  font-size: 10px;
  color: var(--vp-c-text-3);
}

.f-syntax {
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  color: var(--vp-c-text-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finder-empty {
  padding: 10px 8px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 720px) {
  .finder { max-width: none; }
}
</style>
