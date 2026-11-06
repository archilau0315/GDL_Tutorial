# debug_log_1

## 2026-11-06 P0 脚手架

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 20:10 | 项目根 | 初始化 npm 项目、安装 VitePress 1.6 + Vue 3 | Node 22 环境 |
| 20:12 | .vitepress/config.mts | 双 locale（中=根、英=/en/）、导航侧边栏骨架、GDL_BASE 环境变量抽离部署路径 | 堂主决策：双语 |
| 20:12 | shiki-gdl/gdl.mts | GDL 语法高亮 TextMate grammar（命令/控制流/函数/字符串/注释简化版） | 后续按需扩充 |
| 20:14 | theme/style.css | 「数字蓝图」视觉：蓝图蓝七级色阶 + 制图橙 CTA + 坐标纸 hero 底纹 + 暗色深夜蓝图模式 | 堂主已确认视觉规范 |
| 20:14 | theme/i18n.ts | 组件界面文案中英字典 | P1 沙盒组件使用 |
| 20:16 | 内容骨架 | 中英首页 + guide/reference 骨架页 + favicon | 全部中英成对 |
| 20:18 | scripts/check-i18n.mjs | CI 两语文件对齐检查脚本 | 禁止单语孤儿页面 |
| 20:18 | .github/workflows | GitHub Pages 自动部署流水线 | 上线公司资源目录时改 GDL_BASE |
| 20:20 | README/.gitignore | 项目说明与忽略规则 | 按全局规则生成 |

- 计划文档：`开发计划.md` v1.4（视觉规范已写入 4.5 节）
- 下一步：P1 GDL 沙盒引擎（tokenizer → parser → interpreter → renderer）

## 2026-11-06 P0 视觉验收修复

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 20:35 | shiki-gdl/gdl.mts | 语言 id 由 `GDL` 改小写 `gdl` | Shiki 按 name 匹配代码块标记，大小写不符导致高亮失效（显示纯文本） |
| 20:35 | config.mts | favicon 路径拼接 base 变量 | 子路径部署时 `/favicon.svg` 指向站点根，404 |
| 20:36 | style.css | hero 网格线 0.5px→1px、透明度 0.35→0.22 | 0.5px 在高分屏渲染不出来，网格不可见 |
| 20:40 | shiki-gdl/theme.mts（新增） | 数字蓝图专属高亮主题：命令蓝图蓝、控制流制图橙、字符串墨绿、数字深蓝、注释暖灰（明暗双主题） | 原 github 主题命令为绿色，与品牌不符 |
| 20:40 | .gitignore | 忽略 .playwright-cli/ 与 screenshots/ | 浏览器自动化临时文件误入提交 |
| 20:45 | 截图验收 | Playwright 自动截图 5 张：中英首页/教程页/暗色/移动端 | 全部正常，线上 CI 部署 success |

