<script setup lang="ts">
/** 编辑器内联候选气泡：只负责显示与定位，取用逻辑在 useEditorSuggest。 */
import type { SuggestItem } from '../useEditorSuggest'

defineProps<{
  items: SuggestItem[]
  active: boolean
  index: number
  left: number
  top: number
}>()

defineEmits<{ (e: 'pick', i: number): void }>()
</script>

<template>
  <ul
    v-if="active"
    class="eds"
    :style="{ left: left + 'px', top: top + 'px' }"
  >
    <li
      v-for="(it, i) in items"
      :key="it.name"
      class="eds-item"
      :class="{ on: i === index }"
      @mousedown.prevent="$emit('pick', i)"
    >
      <span class="eds-name">{{ it.name }}</span>
      <span class="eds-syntax">{{ it.syntax }}</span>
    </li>
    <li class="eds-hint">Tab</li>
  </ul>
</template>

<style scoped>
.eds {
  position: absolute;
  z-index: 20;
  width: 200px;
  padding: 3px;
  margin: 0;
  list-style: none;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  box-shadow: 0 6px 18px rgb(0 0 0 / 12%);
}

.eds-item {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 3px 7px;
  border-radius: 4px;
  cursor: pointer;
}
.eds-item.on { background: var(--bp-50); }
.dark .eds-item.on { background: rgba(55, 138, 221, 0.16); }

.eds-name {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--bp-700);
}
.dark .eds-name { color: var(--bp-200); }

.eds-syntax {
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  color: var(--vp-c-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eds-hint {
  padding: 2px 7px 0;
  font-family: var(--vp-font-family-mono);
  font-size: 9.5px;
  color: var(--vp-c-text-3);
  text-align: right;
}
</style>
