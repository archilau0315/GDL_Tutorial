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
