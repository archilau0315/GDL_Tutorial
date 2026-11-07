# GDL_Tutorial

**Archicad GDL 从入门到精通 · 交互式双语教程与查询资料库**
*Archicad GDL from zero to professional — an interactive, bilingual tutorial and reference.*

[![VitePress](https://img.shields.io/badge/VitePress-1.x-646cff?logo=vite&logoColor=white)](https://vitepress.dev)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r170-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Tests](https://img.shields.io/badge/tests-41%20passed-2ea44f)](tests/engine.test.ts)
[![Commands](https://img.shields.io/badge/commands-59-0b7285)](docs/reference/data/commands.json)
[![Globals](https://img.shields.io/badge/GLOB-28-5f3dc4)](docs/reference/data/globals.json)
[![License](https://img.shields.io/badge/license-open%20source-2ea44f)](#授权--license)

天津匡形无界智能科技 · 开源项目 / *Tianjin Kuangxing Wujie Intelligent Technology · open source project*

---

## 中文

### 这是什么

一个网页版的 GDL 学习站，两个身份合一：

- **教程**：19 章（GDL-00 ~ GDL-18）分步教学，从画第一个立方体到交付一个完整门窗对象
- **资料库**：命令速查（59 条 / 11 类）、GLOB 变量速查（28 个 / 7 类），签名、示例与章节回链都可搜索，中文检索为第一优先级

页面里嵌了自研的 GDL 沙盒：左边写代码，右边实时出 3D 或 2D 平面符号。**沙盒是可运行的插图，不是在线编译器**——它只实现章节需要的命令，用来把「改一个数，模型怎么变」讲清楚。

### 现在有什么

| 部分 | 章节 | 内容 | 状态 |
|---|---|---|---|
| 入门篇 | GDL-00 ~ 05 | 认识 GDL、基本体、变换堆栈、参数化、2D 脚本、控制流 | ✅ 双语完成 |
| 进阶篇 | GDL-06 ~ 12 | PRISM 族、旋转放样、材质、宏、门窗、字符串、参数化柜体 | ✅ 双语完成 |
| 精通篇 | GDL-13 ~ 18 | UI 脚本、布尔与热区、REQUEST 与 GLOB、数据与文件、工具链、毕业实战 | ✅ 双语完成 |

### 资料库

| 模块 | 内容 | 状态 |
|---|---|---|
| 命令速查 | 59 条 / 11 类，支持关键词与分类筛选，每条有独立详情页 | ✅ |
| GLOB 变量速查 | 28 个常用全局变量 / 7 类，附最小示例与「常见误传」 | ✅ |
| 代码片段库 | 12 段常用写法，一键复制，标注沙盒可运行与对应章节 | ✅ |
| 常见错误手册 | 24 条报错与现象，按「原因 → 改法 → 错误/正确写法」对照 | ✅ |

所有速查数据存放在 `docs/reference/data/*.json`，中英字段同文件保存，`npm run check:data` 校验结构、分类与章节链接。

### 快速开始

```bash
npm install
npm run dev        # 本地开发，http://localhost:5173
```

其他命令：

```bash
npm run build          # 构建静态站点到 docs/.vitepress/dist
npm run preview        # 预览构建产物
npm run test           # 沙盒引擎单测（vitest，41 例）
npm run check:i18n     # 中英页面一一对应检查
npm run check:data     # 命令速查 JSON 校验
npm run check:search   # 搜索命中率实测（17 条固定查询）
npm run gen:commands   # 重新生成命令详情页（dev/build 前自动执行）
```

### 目录结构

```text
docs/
├── .vitepress/
│   ├── config.mts            # 双 locale、导航、侧边栏、中文二元分词
│   ├── gdl-engine/           # 自研 GDL 解释器 + 3D/2D 渲染 + LP XML 导出
│   ├── shiki-gdl/            # GDL 语法高亮（TextMate grammar + 蓝图主题）
│   └── theme/                # 数字蓝图视觉、沙盒组件、命令表组件
├── guide/                    # 中文教程，part1 ~ part3
├── en/                       # 英文镜像，结构与中文完全一致
└── reference/                # 资料库：命令速查 + GLOB 变量 + 单源双语 JSON
scripts/                      # 生成与校验脚本（命令页、i18n、数据、搜索）
tests/                        # 引擎单测
开发计划.md                    # 总体计划（v2.1：查询优先）
debug_log_1.md                # 变更记录
```

### 核心模块

| 模块 | 路径 | 职责 |
|---|---|---|
| 沙盒引擎 | `docs/.vitepress/gdl-engine/` | tokenizer → parser → 字节码 → 执行，输出形状列表供渲染 |
| 沙盒界面 | `theme/components/GdlPlayground.vue` | 左代码右 3D、行号报错、双语错误提示、示例切换 |
| 命令速查 | `reference/data/commands.json` | 单文件双语字段，命令的唯一样板 |
| GLOB 速查 | `reference/data/globals.json` + `theme/components/GlobTable.vue` | 全局变量按用途分组，搜索与分类共用一套数据 |
| 命令详情页 | `scripts/gen-command-pages.mjs` | 由 JSON 生成每条命令的中英页面，构建前自动运行 |
| 2D 渲染 | `gdl-engine/renderer-2d.ts` | 形状 → SVG，自适应取景与主题色 |

### 写一章新教程

1. 在 `docs/guide/partX-*/` 建中文页，**同时在 `docs/en/guide/` 建同路径英文页**（CI 会拦截缺页）
2. 在 `config.mts` 的中英侧边栏登记
3. 更新 `docs/guide/index.md` 与 `docs/en/guide/index.md` 的进度清单
4. 需要新命令就补进 `commands.json`（`chapter` 必须指向已存在的页面）
5. 本地跑完 `check:i18n`、`check:data`、`check:search`、`test`、`build`
6. 在 `debug_log_1.md` 追加一行变更记录

### 部署

- 预览：GitHub Actions 推送 main 自动构建到 GitHub Pages
- 正式：部署到公司站点的资源目录，用环境变量 `GDL_BASE` 指定子路径，**改路径不改代码**

```bash
GDL_BASE=/resources/GDL_Tutorial/ npm run build
```

### 授权 / License

本项目由天津匡形无界智能科技开发并开源发布，欢迎转载、教学使用与二次开发：

- **内容**（章节、图示、示例代码）：CC BY 4.0，署名即可使用
- **代码**（沙盒引擎、组件、脚本）：MIT

命令签名整理自 Graphisoft 官方 GDL Reference 并注明出处；Archicad、GDL 为 Graphisoft 商标，本项目与 Graphisoft 无隶属关系。

---

## English

### What this is

A web-based GDL learning site with two roles in one place:

- **Tutorial**: 19 chapters (GDL-00 ~ GDL-18), from the first cube to a delivered door/window object
- **Reference**: 59 commands in 11 categories with searchable signatures, examples and chapter back-links — Chinese lookup first

Every chapter can embed our own GDL sandbox: code on the left, live 3D or 2D plan symbol on the right. **The sandbox is a runnable illustration, not an online compiler** — it implements only the commands the chapters need, so "change one number, see what moves" stays honest.

### Current content

| Part | Chapters | Topics | Status |
|---|---|---|---|
| Basics | GDL-00 ~ 05 | GDL overview, primitives, transform stack, parameters, 2D script, control flow | ✅ bilingual |
| Intermediate | GDL-06 ~ 12 | PRISM family, sweeps & revolves, materials, macros, doors & windows, strings, cabinet project | ✅ bilingual |
| Advanced | GDL-13 ~ 18 | UI script, booleans & hotspots, REQUEST and GLOB, data & files, toolchain, final project | ✅ bilingual |

### Reference

| Module | Content | Status |
|---|---|---|
| Command index | 59 commands in 11 categories, searchable and filterable, one detail page each | ✅ |
| GLOB variables | 28 common globals in 7 groups, with minimal examples and a "common myths" table | ✅ |
| Snippet library | 12 common patterns with one-click copy, sandbox support and chapter links | ✅ |
| Error handbook | 24 errors and symptoms with cause, fix and a wrong/right pair | ✅ |

All reference data lives in `docs/reference/data/*.json` with both languages in one record; `npm run check:data` validates structure, categories and chapter links.

### Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build          # static output in docs/.vitepress/dist
npm run preview        # preview the build
npm run test           # engine unit tests (vitest, 41 cases)
npm run check:i18n     # every Chinese page has an English twin
npm run check:data     # validate the command JSON
npm run check:search   # 17 fixed queries against the real index
npm run gen:commands   # regenerate command pages (runs before dev/build)
```

### Architecture

```text
docs/
├── .vitepress/
│   ├── config.mts            # dual locale, nav, sidebar, CJK tokenizer
│   ├── gdl-engine/           # interpreter, 3D/2D renderers, LP XML export
│   ├── shiki-gdl/            # GDL syntax highlighting + blueprint theme
│   └── theme/                # visual system, sandbox and command table
├── guide/                    # Chinese chapters, part1 ~ part3
├── en/                       # exact English mirror
└── reference/                # command index, GLOB variables, single-source bilingual JSON
scripts/                      # generators and checks
tests/                        # engine tests
```

### Adding a chapter

1. Create the Chinese page under `docs/guide/partX-*/` **and the English twin at the same path** (CI blocks missing twins)
2. Register both in the sidebars in `config.mts`
3. Update the progress lists in `docs/guide/index.md` and `docs/en/guide/index.md`
4. New commands go into `commands.json` (`chapter` must point to an existing page)
5. Run `check:i18n`, `check:data`, `check:search`, `test`, `build`
6. Append a line to `debug_log_1.md`

### Deployment

- Preview: GitHub Actions builds `main` to GitHub Pages
- Production: the same build served from the company site's resource directory; the sub-path comes from `GDL_BASE`, no code changes

```bash
GDL_BASE=/resources/GDL_Tutorial/ npm run build
```

### License

Developed and open-sourced by Tianjin Kuangxing Wujie Intelligent Technology. Reuse, teaching and derivative work are welcome:

- **Content** (chapters, diagrams, example code): CC BY 4.0 — reuse with attribution
- **Code** (sandbox engine, components, scripts): MIT

Command signatures are compiled from the official Graphisoft GDL Reference with attribution. Archicad and GDL are trademarks of Graphisoft; this project is not affiliated with Graphisoft.
