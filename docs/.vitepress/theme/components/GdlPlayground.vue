<script setup lang="ts">
/**
 * GDL 交互沙盒：左代码右 3D，实时运行、错误定位、导出 LP XML。
 * 引擎：docs/.vitepress/gdl-engine（纯 TS）；渲染：three.js。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as THREE from 'three'
import { run as runGdl, generateLibpartXml, getConvertCommand } from '../../gdl-engine/index'
import { buildGroup, frameCamera } from '../../gdl-engine/renderer'
import { buildSvg2d } from '../../gdl-engine/renderer-2d'
import type { GdlError, Shape, Shape2 } from '../../gdl-engine/types'
import { t, tf, type Locale } from '../i18n'

const props = withDefaults(defineProps<{
  /** 初始代码（默认参数化桌凳） */
  code?: string
  /** 预设示例 key（章节内嵌用）：stack / array / bookcase / chair2d / railing */
  preset?: string
  height?: number
}>(), { height: 420 })

/* ---------- 示例库（GDL 代码两语共用，注释中英对照同行） ---------- */
const EXAMPLES = [
  {
    key: 'table',
    label: { zh: '🪑 参数化桌凳', en: '🪑 Table & Stool' },
    code: props.code ?? `! === 参数化桌凳 / Parametric table & stool ===
! 桌面尺寸 / table top: width, depth, height
w = 1.2
d = 0.6
h = 0.72
th = 0.04
legR = 0.03

! 桌面 / table top
ADD 0, 0, h - th
BLOCK w, d, th
DEL 1

! 四条圆腿（双层循环）/ four cylindrical legs
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD legR + (i - 1) * (w - 2 * legR), legR + (j - 1) * (d - 2 * legR), 0
    CYLIND h - th, legR
    DEL 1
  NEXT j
NEXT i

! 旁边的独腿凳 / a small stool
ADD w + 0.3, 0, 0
ADD 0.175, 0.175, 0
CYLIND 0.45, 0.025
DEL 1
ADD 0, 0, 0.45
BLOCK 0.35, 0.35, 0.02
DEL 2`
  },
  {
    key: 'prim',
    label: { zh: '🏀 基本体', en: '🏀 Primitives' },
    code: `! 基本体一览 / primitives at a glance
BLOCK 1, 1, 1

ADD 2, 0, 0
CYLIND 1.5, 0.4
DEL 1

ADD 4, 0, 0
CONE 1.5, 0.5, 0.1
DEL 1

ADD 6, 0, 0.4
SPHERE 0.5
DEL 1`
  },
  {
    key: 'array',
    label: { zh: '🌀 变换与循环', en: '🌀 Transforms & loops' },
    code: `! 旋转阵列 / radial array of 8 blocks
FOR i = 1 TO 8
  ROT 0, 0, i * 45
  ADD 1.5, 0, 0
  BLOCK 0.3, 0.1, 0.6 + i * 0.05
  DEL 2
NEXT i

! 中心柱 / centre column
CYLIND 0.8, 0.2`
  },
  {
    key: 'prism',
    label: { zh: '🔺 PRISM 棱柱', en: '🔺 PRISM extrusion' },
    code: `! PRISM：底面多边形沿 Z 挤出 / extrude polygon along Z
! 用 MATERIAL 换材质（沙盒用调色板近似）
MATERIAL 8
PRISM 6, 0.9,
  0,   0,   15,
  1.0, 0,   15,
  1.0, 0.6, 15,
  0.6, 0.6, 15,
  0.6, 0.25, 15,
  0,   0.25, -1

! 上方再叠一个圆柱
MATERIAL 6
ADD 0.3, 0.4, 0.9
CYLIND 0.3, 0.15
DEL 1`
  },
  {
    key: 'plan',
    label: { zh: '📐 2D 平面符号', en: '📐 2D plan symbol' },
    code: `! 2D 脚本：画对象的平面符号 / plan symbol
! 桌面轮廓（对角点定义）
RECT2 0, 0, 1.2, 0.6

! 四条腿投影为圆
CIRCLE2 0.05, 0.05, 0.03
CIRCLE2 1.15, 0.05, 0.03
CIRCLE2 1.15, 0.55, 0.03
CIRCLE2 0.05, 0.55, 0.03

! 中心十字线
LINE2 0.5, 0.3, 0.7, 0.3
LINE2 0.6, 0.2, 0.6, 0.4

! 标注文本
TEXT2 0.05, 0.62, "1.2 x 0.6"

! POLY2_：带填充的多边形（1=轮廓 2=填充 4=闭合）
POLY2_ 4, 7, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, -1

! 注：沙盒不绘制 PROJECT2 投影，需手绘符号`
  },
  {
    key: 'buggy',
    label: { zh: '❌ 含错误的脚本', en: '❌ Buggy script' },
    code: `! 故意写错，试试报错效果 / on purpose: watch the errors
w = 1.0
BLOCK w, d, 0.5        ! 第 3 行：d 未定义 / line 3: d undefined
CYLIND 1.2             ! 第 4 行：CYLIND 需要 2 个参数 / line 4: 2 args required
PRISM 3, 1             ! 第 5 行：顶点表不完整 / line 5: incomplete vertex list`
  },
  {
    key: 'stack',
    label: { zh: '🧱 变换堆栈对比', en: '🧱 Stack comparison' },
    code: `! 左：忘记 DEL —— 角度一轮轮往上叠，柱脚全散了
FOR i = 1 TO 6
  ROTZ i * 60
  ADD 1.5, 0, 0
  BLOCK 0.18, 0.18, 0.6
NEXT i

! 右：每轮 DEL 2 —— 回到起点重新出发（规整一圈）
DEL TOP
ADD 4.2, 0, 0
FOR i = 1 TO 6
  ROTZ i * 60
  ADD 1.5, 0, 0
  BLOCK 0.18, 0.18, 0.6
  DEL 2
NEXT i

! 同一个循环体，只差一个 DEL 2，几何完全不同`
  },
  {
    key: 'bookcase',
    label: { zh: '📚 参数化书架', en: '📚 Parametric bookcase' },
    code: `! 参数化书架：层数随高度变化
w = 0.9
d = 0.3
h = 1.8
th = 0.02

! 两侧立板
BLOCK th, d, h
ADD w - th, 0, 0
BLOCK th, d, h
DEL 1

! 层板：每 0.4m 一层（用 WHILE 判断）
z = 0
WHILE z <= h - th
  ADD 0, 0, z
  BLOCK w, d, th
  DEL 1
  z = z + 0.4
ENDWHILE

! 顶板
ADD 0, 0, h - th
BLOCK w, d, th
DEL 1`
  },
  {
    key: 'boolean',
    label: { zh: '🧩 拼块开洞', en: '🧩 Hole without booleans' },
    code: `! 沙盒用「拼块」模拟带洞的板；真正挖洞在 Archicad 里用 SUBGROUP
! the sandbox fakes a holed panel with blocks; use SUBGROUP in Archicad
w = 0.60
h = 2.00
th = 0.02
holeX = 0.30
holeZ = 1.20
holeR = 0.06

! 左条 / left strip
BLOCK holeX - holeR, th, h

! 右条 / right strip
ADD holeX + holeR, 0, 0
BLOCK w - holeX - holeR, th, h
DEL 1

! 孔下方 / below the hole
ADD holeX - holeR, 0, 0
BLOCK 2 * holeR, th, holeZ - holeR

! 孔上方 / above the hole
ADD 0, 0, holeZ + holeR
BLOCK 2 * holeR, th, h - holeZ - holeR
DEL 2`
  },
  {
    key: 'chair2d',
    label: { zh: '🪑 椅子平面符号', en: '🪑 Chair plan symbol' },
    code: `! 椅子平面符号（2D 脚本）
! 座面轮廓
RECT2 0, 0, 0.45, 0.45

! 靠背（矩形 + 斜线示意）
RECT2 0, 0.42, 0.45, 0.5
LINE2 0.05, 0.42, 0.05, 0.5
LINE2 0.40, 0.42, 0.40, 0.5

! 四条腿
CIRCLE2 0.04, 0.04, 0.02
CIRCLE2 0.41, 0.04, 0.02
CIRCLE2 0.41, 0.41, 0.02
CIRCLE2 0.04, 0.41, 0.02

! 扶手弧线
ARC2 0.225, 0.05, 0.18, 200, 340

! 填充示意（1+2+4 = 轮廓+填充+闭合）
POLY2_ 4, 7, 0.02, 0.02, 1, 0.43, 0.02, 1, 0.43, 0.43, 1, 0.02, 0.43, -1

! 标注
TEXT2 0.02, 0.55, "chair 450x450"`
  },
  {
    key: 'railing',
    label: { zh: '🪜 栏杆阵列（GOSUB）', en: '🪜 Railing array (GOSUB)' },
    code: `! 栏杆：等距立柱 + 扶手，用 GOSUB 复用
len = 3.0
n = 7
gap = len / (n - 1)

FOR i = 1 TO n
  ADD (i - 1) * gap, 0, 0   ! 每轮从起点算绝对位置
  GOSUB 100                 ! 画一根立柱
  DEL 1
NEXT i

! 扶手
ADD 0, 0, 1.0
BLOCK len, 0.06, 0.04
DEL 1
END

100:
CYLIND 0.95, 0.02
RETURN`
  },
  {
    key: 'revolve',
    label: { zh: '🏺 旋转体（REVOLVE）', en: '🏺 Revolved solid (REVOLVE)' },
    code: `! REVOLVE：截面绕 X 轴旋转，y 就是半径
! 这里先绕 Y 转 90°，让轴线立起来成柱子
ROT 0, 90, 0
REVOLVE 6, 360, 0,
  0,    0.00, 1,
  0,    0.18, 0,
  0.06, 0.18, 0,
  0.06, 0.10, 0,
  0.30, 0.10, 0,
  0.30, 0.00, -1
DEL 1

! 再做一个半球形柱头：截面是一段圆弧
MATERIAL 6
ADD 0, 0, 0.30
ROT 0, 90, 0
REVOLVE 8, 360, 0,
  0.00, 0.00, 1,
  0.00, 0.16, 0,
  0.02, 0.15, 0,
  0.05, 0.13, 0,
  0.08, 0.09, 0,
  0.10, 0.05, 0,
  0.11, 0.02, 0,
  0.11, 0.00, -1
DEL 2`
  },
  {
    key: 'extrude',
    label: { zh: '📐 斜向挤出（EXTRUDE）', en: '📐 Slanted extrusion (EXTRUDE)' },
    code: `! EXTRUDE：截面沿任意向量挤出，比 PRISM 多两个方向
! 一块斜向挑出的雨棚
EXTRUDE 4, 1.0, 0, 0.45, 0,
  0,   0,   1,
  1.2, 0,   0,
  1.2, 0.6, 0,
  0,   0.6, -1

! 下面用 PRISM 做等高的直柱，对比两者差别
MATERIAL 3
ADD 0.2, 0.6, 0
PRISM 4, 1.0,
  0, 0, 1,
  0.8, 0, 0,
  0.8, 0.15, 0,
  0, 0.15, -1
DEL 1`
  },
]

const exLabel = (i: number): string => EXAMPLES[i].label[loc.value]

/* ---------- 状态 ---------- */
const { lang } = useData()
const loc = computed<Locale>(() => (lang.value?.startsWith('zh') ? 'zh' : 'en'))

const presetIdx = props.preset ? EXAMPLES.findIndex(e => e.key === props.preset) : -1
const selIdx = ref(presetIdx >= 0 ? presetIdx : 0)
const src = ref(props.code ?? EXAMPLES[selIdx.value].code)
const errors = ref<GdlError[]>([])
const shapeCount = ref(0)
const has2d = ref(false)
const copied = ref(false)
let runTimer: ReturnType<typeof setTimeout> | undefined

const errorLines = computed(() => new Set(errors.value.map(e => e.line)))
const lineCount = computed(() => src.value.split('\n').length)
const gutter = ref<HTMLElement>()
const editor = ref<HTMLTextAreaElement>()
const viewport = ref<HTMLElement>()
const emit = defineEmits<{ (e: 'errors', n: number): void }>()

/* ---------- 运行 ---------- */
function execute(): void {
  const r = runGdl(src.value)
  errors.value = r.errors
  shapeCount.value = r.shapes.length
  has2d.value = r.shapes2.length > 0
  rebuild(r.shapes)
  render2d(r.shapes2)
  emit('errors', r.errors.length)
}

function schedule(): void {
  if (runTimer) clearTimeout(runTimer)
  runTimer = setTimeout(execute, 400)
}

watch(src, schedule)

/* ---------- three.js ---------- */
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let modelGroup: THREE.Group | null = null
let ro: ResizeObserver | undefined
const view2d = ref<HTMLElement>()

function render2d(shapes2: Shape2[]): void {
  if (!view2d.value) return
  const isDark = document.documentElement.classList.contains('dark')
  view2d.value.innerHTML = buildSvg2d(shapes2, { isDark })
}

function rebuild(shapes: Shape[]): void {
  if (!scene) return
  if (modelGroup) {
    scene.remove(modelGroup)
    modelGroup.traverse(o => {
      const m = o as THREE.Mesh
      m.geometry?.dispose?.()
    })
  }
  const isDark = document.documentElement.classList.contains('dark')
  const { group, bbox } = buildGroup(shapes, isDark)
  modelGroup = group
  scene.add(group)
  if (camera) frameCamera(camera, bbox)
  // OrbitControls 会把相机拽回 target 方向，模型不在原点时必须同步 target
  if (controls && !bbox.isEmpty()) bbox.getCenter(controls.target)
  controls?.update()
}

function initThree(): void {
  if (!viewport.value) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  viewport.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

  const isDark = document.documentElement.classList.contains('dark')
  // 灯光
  const amb = new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.75)
  const dir = new THREE.DirectionalLight(0xffffff, isDark ? 0.9 : 0.7)
  dir.position.set(5, 8, -6)
  scene.add(amb, dir)
  // 地面网格（蓝图坐标纸）
  const grid = new THREE.GridHelper(20, 20, isDark ? 0x1d4f7c : 0x9cc3e6, isDark ? 0x143a5c : 0xd7e8f7)
  grid.position.y = -0.001
  scene.add(grid)
  // 坐标轴（红X 绿Y 蓝Z——three 系；GDL 的 z 向上映射为 three 的 y）
  const axes = new THREE.AxesHelper(0.5)
  axes.renderOrder = 1
  scene.add(axes)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const resize = (): void => {
    if (!viewport.value || !renderer || !camera) return
    const w = viewport.value.clientWidth
    const h = viewport.value.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / Math.max(h, 1)
    camera.updateProjectionMatrix()
  }
  ro = new ResizeObserver(resize)
  ro.observe(viewport.value)
  resize()

  const tick = (): void => {
    controls?.update()
    renderer?.render(scene!, camera!)
    requestAnimationFrame(tick)
  }
  tick()
}

/* ---------- 主题切换时重建材质 ---------- */
let themeObserver: MutationObserver | undefined
function watchTheme(): void {
  themeObserver = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('dark')
    if (scene) {
      scene.background = null
      const grid = scene.children.find(c => (c as THREE.GridHelper).isGridHelper) as THREE.GridHelper | undefined
      if (grid) {
        ;(grid.material as THREE.Material).color.set(isDark ? 0x1d4f7c : 0x9cc3e6)
      }
    }
    renderer?.setClearColor(isDark ? 0x0a1626 : 0xf6fafd, 1)
    execute()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/* ---------- 编辑器交互 ---------- */
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Tab' && editor.value) {
    e.preventDefault()
    const ta = editor.value
    const s = ta.selectionStart, en = ta.selectionEnd
    src.value = src.value.slice(0, s) + '  ' + src.value.slice(en)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2 })
  }
}
function syncScroll(): void {
  if (gutter.value && editor.value) gutter.value.scrollTop = editor.value.scrollTop
}
function pickExample(ev: Event): void {
  const idx = Number((ev.target as HTMLSelectElement).value)
  selIdx.value = idx
  src.value = EXAMPLES[idx].code
}
function resetCode(): void {
  src.value = EXAMPLES[0].code
  execute()
}

/* ---------- 导出 ---------- */
function exportXml(): void {
  const name = 'MyGdlObject'
  const xml = generateLibpartXml(src.value, { name })
  const blob = new Blob([xml], { type: 'application/xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.xml`
  a.click()
  URL.revokeObjectURL(a.href)
}
async function copyCommand(): Promise<void> {
  try {
    await navigator.clipboard.writeText(getConvertCommand())
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* 剪贴板不可用时静默 */ }
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  initThree()
  watchTheme()
  const isDark = document.documentElement.classList.contains('dark')
  renderer?.setClearColor(isDark ? 0x0a1626 : 0xf6fafd, 1)
  execute()
})
onBeforeUnmount(() => {
  ro?.disconnect()
  themeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
})

const errLine = (i: number): boolean => errorLines.value.has(i)
</script>

<template>
  <div class="gdl-pg" :style="{ '--pg-h': height + 'px' }">
    <!-- 工具栏 -->
    <div class="pg-bar">
      <select class="pg-select" :value="selIdx" @change="pickExample" :aria-label="t(loc, 'example')">
        <option v-for="(ex, i) in EXAMPLES" :key="i" :value="i">{{ ex.label[loc] }}</option>
      </select>
      <button class="pg-btn" @click="execute">{{ t(loc, 'run') }}</button>
      <button class="pg-btn ghost" @click="resetCode">{{ t(loc, 'reset') }}</button>
      <span class="pg-chip" :class="{ bad: errors.length }">
        {{ errors.length ? errors.length + ' ✕' : tf(loc, 'shapes', { n: shapeCount }) }}
      </span>
      <span class="pg-spacer" />
      <button class="pg-btn accent" @click="exportXml">{{ t(loc, 'exportXml') }}</button>
      <button class="pg-btn ghost" @click="copyCommand">{{ copied ? t(loc, 'copied') : t(loc, 'copyCmd') }}</button>
    </div>

    <!-- 主区：左代码右 3D -->
    <div class="pg-main">
      <div class="pg-editor">
        <div class="pg-pane-label">{{ t(loc, 'editor') }}</div>
        <div class="pg-code-wrap">
          <div ref="gutter" class="pg-gutter">
            <span v-for="i in lineCount" :key="i" class="pg-ln" :class="{ err: errLine(i) }">{{ i }}</span>
          </div>
          <textarea
            ref="editor"
            v-model="src"
            class="pg-ta"
            spellcheck="false"
            @keydown="onKey"
            @scroll="syncScroll"
          />
        </div>
      </div>
      <div class="pg-view" :class="{ dual: has2d }">
        <div class="pg-pane">
          <div class="pg-pane-label">{{ t(loc, 'viewport') }}</div>
          <div ref="viewport" class="pg-canvas" />
        </div>
        <div v-show="has2d" class="pg-pane">
          <div class="pg-pane-label">{{ t(loc, 'view2d') }}</div>
          <div ref="view2d" class="pg-svg" />
        </div>
      </div>
    </div>

    <!-- 错误面板（Archicad 式定位） -->
    <div class="pg-errors" :class="{ bad: errors.length }">
      <div class="pg-err-title">{{ t(loc, 'errorPanel') }} · {{ errors.length ? errors.length : t(loc, 'noErrors') }}</div>
      <div v-if="errors.length" class="pg-err-list">
        <div v-for="(e, i) in errors.slice(0, 20)" :key="i" class="pg-err-item">
          <span class="pg-err-loc">{{ tf(loc, 'errorAt', { line: e.line, col: e.col }) }}</span>
          <span class="pg-err-msg">{{ loc === 'zh' ? e.messageZh : e.messageEn }}</span>
        </div>
      </div>
      <div class="pg-hint">{{ t(loc, 'verifyHint') }} · {{ t(loc, 'cmdHint') }}</div>
    </div>
  </div>
</template>

<style scoped>
.gdl-pg {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
  background: var(--vp-c-bg);
}
.pg-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--vp-c-border);
  flex-wrap: wrap;
}
.pg-spacer { flex: 1 }
.pg-select, .pg-btn {
  font-size: 13px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 4px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.pg-btn:hover { border-color: var(--vp-c-brand) }
.pg-btn.accent {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: #fff;
}
.pg-btn.ghost { background: transparent }
.pg-chip {
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: #1a7f37;
  background: rgba(26, 127, 55, 0.1);
  border-radius: 10px;
  padding: 2px 10px;
}
.pg-chip.bad { color: #c0392b; background: rgba(192, 57, 43, 0.12) }
/* 暗色模式：状态标签与错误面板提亮，保证对比度 */
.dark .pg-chip { color: #4ade80; background: rgba(74, 222, 128, 0.14) }
.dark .pg-chip.bad { color: #f87171; background: rgba(248, 113, 113, 0.16) }
.dark .pg-errors.bad { background: rgba(248, 113, 113, 0.08) }
.dark .pg-err-loc { color: #f87171 }
.pg-main {
  display: grid;
  grid-template-columns: minmax(260px, 44%) 1fr;
  min-height: var(--pg-h);
}
@media (max-width: 720px) { .pg-main { grid-template-columns: 1fr } }
.pg-pane-label {
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  padding: 6px 10px 2px;
  font-family: var(--vp-font-family-mono);
}
.pg-code-wrap {
  display: flex;
  height: calc(var(--pg-h) - 24px);
  min-height: 240px;
}
.pg-gutter {
  width: 40px;
  overflow: hidden;
  text-align: right;
  padding: 8px 6px 8px 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-alt);
  border-right: 1px solid var(--vp-c-border);
  box-sizing: border-box;
}
.pg-ln { display: block }
.pg-ln.err {
  color: #e67300;
  font-weight: 700;
  position: relative;
}
.pg-ln.err::before {
  content: '▸';
  position: absolute;
  left: 2px;
  color: #e67300;
}
.pg-ta {
  flex: 1;
  border: 0;
  resize: none;
  padding: 8px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
  outline: none;
  white-space: pre;
  overflow: auto;
  tab-size: 2;
}
.pg-canvas {
  height: calc(var(--pg-h) - 24px);
  min-height: 240px;
  position: relative;
}
.pg-view.dual { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px }
.pg-view.dual .pg-pane { min-width: 0; overflow: hidden }
.pg-view.dual .pg-canvas { border-right: 1px solid var(--vp-c-border) }
@media (max-width: 720px) { .pg-view.dual { grid-template-columns: 1fr } }
.pg-canvas { min-width: 0 }
.pg-canvas :deep(canvas) { display: block; max-width: 100% }
.pg-svg {
  height: calc(var(--pg-h) - 24px);
  min-height: 240px;
  padding: 6px;
  box-sizing: border-box;
}
.pg-svg :deep(svg) { width: 100%; height: 100%; display: block }
.pg-errors {
  border-top: 1px solid var(--vp-c-border);
  padding: 8px 12px;
  font-size: 12.5px;
}
.pg-errors.bad { background: rgba(192, 57, 43, 0.06) }
.pg-err-title {
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}
.pg-err-list { max-height: 140px; overflow: auto }
.pg-err-item { padding: 2px 0; display: flex; gap: 10px; flex-wrap: wrap }
.pg-err-loc {
  font-family: var(--vp-font-family-mono);
  color: #c0392b;
  flex-shrink: 0;
}
.pg-err-msg { color: var(--vp-c-text-1) }
.pg-hint { margin-top: 4px; color: var(--vp-c-text-3); font-size: 11.5px }
</style>
