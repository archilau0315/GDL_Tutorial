# GDL_Tutorial

Archicad GDL 从入门到精通——中英双语交互式教程网站。浏览器内实时 3D 沙盒 + 全命令速查资料库。由天津匡形无界智能科技开发，部署于公司网站资源目录。

## 项目用途

- **教程**：19 章（GDL-00 ~ GDL-18，入门 / 进阶 / 精通）分步教学，配可交互 GDL 代码沙盒
- **资料库**：命令速查表、GLOB 变量表、代码片段库、常见错误手册，中英双语
- **定位**：纯学习工具，不展示公司项目作品

## 模块清单

| 模块 | 路径 | 说明 |
|---|---|---|
| 站点配置 | `docs/.vitepress/config.mts` | 双 locale（中=根路径，英=/en/）、导航、侧边栏 |
| 主题 | `docs/.vitepress/theme/` | 数字蓝图视觉（style.css）、组件文案字典（i18n.ts） |
| GDL 语法高亮 | `docs/.vitepress/shiki-gdl/gdl.mts` | Shiki TextMate grammar（gdl 代码块高亮） |
| GDL 沙盒引擎 | `docs/.vitepress/gdl-engine/` | 自研 GDL 解释器（tokenizer → parser → bytecode 编译 → 程序计数器执行）+ LP XML 导出 + Three.js 渲染 |
| 沙盒组件 | `docs/.vitepress/theme/components/GdlPlayground.vue` | 左代码右 3D、行号错误高亮、双语错误面板、示例切换、导出 |
| 命令速查组件 | `docs/.vitepress/theme/components/CommandTable.vue` | 关键词搜索 + 分类筛选，签名/参数/示例/章节回链 |
| 速查数据 | `docs/reference/data/commands.json` | 中英字段同文件（单源双语），42 条命令 / 8 个分类 |
| 2D 渲染 | `docs/.vitepress/gdl-engine/renderer-2d.ts` | 2D 形状 → SVG（自适应取景、主题色） |
| 引擎单测 | `tests/engine.test.ts` | vitest 41 例，覆盖基本体/挤出/旋转/2D/流程/报错定位/导出 |
| 中文内容 | `docs/guide/`、`docs/reference/` | 教程章节 + 资料库页面 |
| 英文内容 | `docs/en/` | 与中文目录结构完全镜像 |
| 两语对齐检查 | `scripts/check-i18n.mjs` | CI 强制中英页面一一对应 |
| 速查数据校验 | `scripts/check-data.mjs` | 校验字段完整、分类合法、章节链接存在 |
| CI/部署 | `.github/workflows/deploy.yml` | push main → 构建 → GitHub Pages（正式上线走公司资源目录） |
| 开发计划 | `开发计划.md` | 项目总体计划（v2.0：19 章体系、P4a/b/c 拆分、质量门禁），滚动修订 |

## 使用说明

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（http://localhost:5173）
npm run build      # 构建静态站点到 docs/.vitepress/dist
npm run preview    # 本地预览构建产物
npm run test       # 沙盒引擎单元测试（vitest，41 例）
npm run check:i18n # 检查中英文页面文件对齐
npm run check:data # 校验命令速查 JSON 数据
```

- 新增章节：在 `docs/guide/` 建 md 文件，**必须同时在 `docs/en/guide/` 建对应英文文件**（CI 会检查），并在 `config.mts` 侧边栏登记
- 部署 base 路径：环境变量 `GDL_BASE`（GitHub Pages 预览为 `/GDL_Tutorial/`，公司资源目录上线时调整）
- 每次修改记录到 `debug_log_x.md`

## 技术栈

VitePress 1.x + Vue 3 · TypeScript（解释器）· Three.js（3D 渲染）· vitest（单测）
