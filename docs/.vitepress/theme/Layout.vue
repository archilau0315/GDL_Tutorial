<script setup lang="ts">
/** 在默认主题的正文末尾插入章末自测与章节页脚（上一章 / 标记学完 / 下一章）。 */
import DefaultTheme from 'vitepress/theme'
import ChapterQuiz from './components/ChapterQuiz.vue'
import ChapterFooter from './components/ChapterFooter.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-after>
      <ChapterQuiz />
      <ChapterFooter />
    </template>
  </Layout>
</template>
