<script setup lang="ts">
/**
 * 章末自测：数据来自 reference/data/quizzes.json。
 * 按当前页自动匹配章节，答完提交看解析；不记分、不上传、不上锁。
 */
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { t, tf, type Locale } from '../i18n'
import raw from '../../../reference/data/quizzes.json'

interface Question {
  id: string
  q: Record<Locale, string>
  options: Record<Locale, string[]>
  answer: number
  explain: Record<Locale, string>
}
interface Quiz { chapter: string; questions: Question[] }

const data = raw as { quizzes: Quiz[] }
const { lang, page } = useData()
const loc = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'zh'))

/** 当前页 → 章节 id（英文页去掉 /en 前缀，与章节清单同名） */
const chapterId = computed(() => {
  const rel = page.value.relativePath.replace(/^en\//, '').replace(/\.md$/, '')
  return rel.split('/').pop() ?? ''
})
const quiz = computed(() => data.quizzes.find(q => q.chapter === chapterId.value) ?? null)

const picked = ref<Record<string, number>>({})
const submitted = ref(false)

const total = computed(() => quiz.value?.questions.length ?? 0)
const score = computed(() =>
  quiz.value ? quiz.value.questions.filter(q => picked.value[q.id] === q.answer).length : 0
)
const complete = computed(() =>
  quiz.value ? quiz.value.questions.every(q => picked.value[q.id] !== undefined) : false
)

function choose(id: string, option: number): void {
  if (submitted.value) return
  picked.value = { ...picked.value, [id]: option }
}

function submit(): void {
  if (complete.value) submitted.value = true
}

function reset(): void {
  picked.value = {}
  submitted.value = false
}
</script>

<template>
  <section v-if="quiz" class="quiz">
    <header class="quiz-head">
      <h2 class="quiz-title">{{ t(loc, 'quizTitle') }}</h2>
      <span class="quiz-count">{{ tf(loc, 'quizCount', { n: total }) }}</span>
    </header>
    <p class="quiz-hint">{{ t(loc, 'quizHint') }}</p>

    <ol class="quiz-list">
      <li v-for="(q, qi) in quiz.questions" :key="q.id" class="quiz-q">
        <p class="q-text">{{ qi + 1 }}. {{ q.q[loc] }}</p>
        <div class="q-opts">
          <label
            v-for="(opt, oi) in q.options[loc]"
            :key="oi"
            class="q-opt"
            :class="{
              picked: picked[q.id] === oi,
              right: submitted && oi === q.answer,
              wrong: submitted && picked[q.id] === oi && oi !== q.answer
            }"
          >
            <input
              type="radio"
              :name="`${q.id}-${qi}`"
              :checked="picked[q.id] === oi"
              :disabled="submitted"
              @change="choose(q.id, oi)"
            >
            <span class="q-opt-text">{{ opt }}</span>
            <span v-if="submitted && oi === q.answer" class="q-tag">{{ t(loc, 'quizRight') }}</span>
          </label>
        </div>
        <p v-if="submitted" class="q-explain">
          <b>{{ t(loc, 'quizExplain') }}</b>{{ q.explain[loc] }}
        </p>
      </li>
    </ol>

    <div class="quiz-foot">
      <button v-if="!submitted" class="quiz-btn" type="button" :disabled="!complete" @click="submit">
        {{ t(loc, 'quizSubmit') }}
      </button>
      <template v-else>
        <span class="quiz-score">{{ tf(loc, 'quizScore', { score, total }) }}</span>
        <button class="quiz-btn ghost" type="button" @click="reset">
          {{ t(loc, 'quizRedo') }}
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.quiz {
  margin-top: 36px;
  padding: 18px 20px 20px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
}

.quiz-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.quiz-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border: 0;
  padding: 0;
}

.quiz-count {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.quiz-hint {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.quiz-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.quiz-q + .quiz-q {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--vp-c-divider);
}

.q-text {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.q-opts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.q-opt {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.q-opt:hover { border-color: var(--bp-400); }
.q-opt.picked {
  border-color: var(--bp-500);
  background: var(--bp-50);
}
.dark .q-opt.picked { background: rgba(55, 138, 221, 0.14); }

.q-opt.right {
  border-color: #2f9e44;
  background: rgba(47, 158, 68, 0.12);
}
.q-opt.wrong {
  border-color: #e03131;
  background: rgba(224, 49, 49, 0.1);
}

.q-opt input {
  flex: none;
  width: 14px;
  height: 14px;
  accent-color: var(--bp-600);
  cursor: pointer;
}

.q-opt-text { flex: 1; min-width: 0; }

.q-tag {
  flex: none;
  font-size: 11px;
  color: #2f9e44;
}

.q-explain {
  margin: 8px 0 0;
  padding: 8px 10px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border-left: 3px solid var(--bp-300);
  border-radius: 0 6px 6px 0;
}
.q-explain b { margin-right: 4px; color: var(--vp-c-text-1); }

.quiz-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.quiz-btn {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--bp-600);
  border: 1px solid var(--bp-600);
  border-radius: 999px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.quiz-btn:hover { opacity: 0.88; }
.quiz-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.quiz-btn.ghost {
  color: var(--bp-600);
  background: transparent;
  border-color: var(--bp-400);
}
.dark .quiz-btn.ghost { color: var(--bp-200); }

.quiz-score {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
}
</style>
