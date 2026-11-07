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

- 2026-11-06 20:30 | gdl-engine | P1 沙盒引擎 MVP 完成：tokenizer/parser/interpreter/matrix/errors 五模块（单文件≤500行），支持基本体+变换+变量+IF/FOR；Three.js 渲染（z-up→y-up 映射）；LP XML 导出+转换命令 | 19 个单测全绿；GdlPlayground 组件、在线沙盒页、第1章嵌入完成；备注：three.js 打包>500kB，后续可懒加载优化；CONE 签名为 h,r1,r2
- 2026-11-06 20:52 | theme/GdlPlayground | 沙盒交互细节：错误行行号标记、宽版布局（playground 页 pageClass=wide-playground）、示例标签与代码注释改中英对照、暗色标签对比度修正 | 本地 preview 实测四状态（中/英/暗/报错）
- 2026-11-06 20:45 | gdl-engine/renderer | 修复几何体姿态错乱：几何改为先按 GDL 本地坐标构造再统一乘 COORD_C×M 映射（原实现预交换轴导致二次旋转）；相机取景距离 3.2→2.9 倍 | 桌面恢复水平、圆柱腿恢复竖直
- 2026-11-06 22:15 | gdl-engine + theme + guide | P2 完成：引擎补 PRISM 族/WHILE/GOSUB/2D 命令全集/变换简写，新增 renderer-2d.ts（2D→SVG），沙盒 3D/2D 双视口 + 章节 preset；入门篇第 0-5 章中英双语全文（11 对页面） | 单测 33 例全绿；坑：① 命令名后 skipNewlines 会吞掉语句边界，导致 `DEL` 吃掉下一行 ② ':' 未进运算符表，数值标签 `100:` 词法报错 ③ TEXT2 字符串参数被 args.map(num) 数值化 ④ 2D 面板用 v-if 首帧未挂载导致 SVG 空白，改 v-show ⑤ canvas 固有宽度把 2D 面板挤成一条缝，需 min-width:0
- 备注：堆栈对比示例初版教学错误（等量 ADD 加不加 DEL 结果相同），已改为「ROT+ADD 不做 DEL → 螺旋漂移 vs 规整圆环」，章节文字同步；取景距离 2.9→2.35
- 计划文档：`开发计划.md` v1.5（沙盒逼真报错 + .gsm 导出三级路线）
- 下一步：P2 引擎扩展（PRISM 族/材质/参数面板）+ 入门篇第 0-5 章全文

## 2026-11-06 P0 视觉验收修复

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 20:35 | shiki-gdl/gdl.mts | 语言 id 由 `GDL` 改小写 `gdl` | Shiki 按 name 匹配代码块标记，大小写不符导致高亮失效（显示纯文本） |
| 20:35 | config.mts | favicon 路径拼接 base 变量 | 子路径部署时 `/favicon.svg` 指向站点根，404 |
| 20:36 | style.css | hero 网格线 0.5px→1px、透明度 0.35→0.22 | 0.5px 在高分屏渲染不出来，网格不可见 |
| 20:40 | shiki-gdl/theme.mts（新增） | 数字蓝图专属高亮主题：命令蓝图蓝、控制流制图橙、字符串墨绿、数字深蓝、注释暖灰（明暗双主题） | 原 github 主题命令为绿色，与品牌不符 |
| 20:40 | .gitignore | 忽略 .playwright-cli/ 与 screenshots/ | 浏览器自动化临时文件误入提交 |
| 20:45 | 截图验收 | Playwright 自动截图 5 张：中英首页/教程页/暗色/移动端 | 全部正常，线上 CI 部署 success |


## 2026-11-06 P2 收尾：跳转与循环的执行模型修复

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 22:35 | gdl-engine/bytecode.ts（新增） | AST → 扁平指令表（assign/cmd/label/gosub/return/end/test/jump/forinit/next），跳转目标回填 | 原实现用递归 execBlock 执行 AST，GOSUB 一打断就丢掉 JS 调用栈，循环状态无法恢复 |
| 22:35 | gdl-engine/interpreter.ts | 执行驱动改为「程序计数器 + 显式循环栈 + 调用栈」；RETURN 时丢弃子程序内未配对的循环帧 | 修复：FOR/WHILE 里调 GOSUB 只执行一次（测试从 2 实体→7 实体）。文件 369 行，仍 <500 |
| 22:40 | theme/GdlPlayground | 重写 stack 预设：左组不 DEL 造成角度层层叠加（块散乱重叠），右组每轮 DEL 2 得规整 8 柱一圈；railing 预设循环内 `ADD (i-1)*gap` 再 GOSUB，修正原来每轮退回原点导致 7 根立柱重叠 | 原示例的右组 `ADD 4.2,0,0` 因左循环累计转 180° 而落到负坐标，教学上是错的 |
| 22:40 | gdl-engine/renderer | frameCamera 改为按包围球半径 + fov + 画布宽高比算距离；视向抬高到 47° | 窄画布下平移分组会被裁边；抬高后平面阵列/圆环更易读 |
| 22:45 | guide 中英各 2 篇 | 第 2 章对比实验文字改为「角度层层叠加」的真实解释；第 5 章 GOSUB 示例与「忘记 END」的后果描述改为与实测一致（多画一根 + RETURN 报错） | 教学文案必须与引擎实际行为一致 |
| 22:50 | tests/engine.test.ts | 新增 4 例：FOR 内 GOSUB、WHILE 内 GOSUB、子程序含未配对 FOR 后调用方循环继续、栏杆示例分布 | 单测 33 → 37 全绿 |
| 23:05 | theme/GdlPlayground | 渲染后把 `bbox` 中心同步给 `OrbitControls.target` | 原先 target 恒为原点，`controls.update()` 会把相机拽回原点方向，模型不在原点时（如栏杆 x=0~3）被推到画面一侧并切边 |
| 23:05 | theme/GdlPlayground | 对比示例改为 6 根、半径 1.5、柱高 0.6 | 8 根在 350px 窄视口里只有 5px 间距，看不出"一圈"，6 根间距翻倍后形状可辨 |

## 2026-11-07 P3 第一批：命令速查库上线

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 09:20 | reference/data/commands.json（新增） | 单源双语命令数据：40 条命令 / 7 个分类，含签名、参数、说明、最小示例、章节回链 | 中英字段同文件，页面不重复维护；未开课命令的 chapter 置 null |
| 09:25 | theme/components/CommandTable.vue（新增） | 速查表组件：关键词搜索（名称/语法/说明/参数/示例）+ 分类筛选 + 锚点 + withBase 子路径兼容 | 列表按 locale 取字段；深色模式适配 |
| 09:28 | theme/i18n.ts | 新增速查组件文案键（搜索占位、参数/示例/章节、空结果等） | 中英成对 |
| 09:30 | reference/commands（中英） | 由「建设中」改为实装组件页，附数据单源与沙盒差异提示 | 两语参数分别传 locale |
| 09:32 | gdl-engine（types/interpreter/renderer） | ELLIPS 签名由 2 参改为 3 参 `h, rx, ry`，按三轴缩放渲染 | 对齐官方签名；旧 2 参写法会报参数个数错误 |
| 09:33 | scripts/check-data.mjs（新增） | 速查 JSON 校验：字段完整、分类合法、命令不重复、章节文件存在 | 接入 npm run check:data 与 CI |
| 09:35 | scripts/check-i18n.mjs | 路径改用 fileURLToPath | 中文目录名被 URL 编码，Windows 本地直接跑会 ENOENT |
| 09:36 | config.mts | 删除中英侧边栏重复的第 2-5 章条目 | 第 1 章之后重复了一遍 |
| 09:37 | playground 页（中英） | 沙盒能力说明更新为实际支持集（PRISM/2D/MATERIAL/WHILE 等） | 原文案停留 P1 |
| 09:40 | 验证 | check:data 40 条通过、check:i18n 11 对通过、单测 38 例全绿、构建成功 | 下一批：第 6-12 章 + 引擎补 REVOLVE/TUBE 等 |

## 2026-11-07 P3 第二批：进阶篇 7 章 + 引擎放样能力

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:05 | gdl-engine（types/interpreter/renderer） | 新增 `EXTRUDE`（任意向量挤出）与 `REVOLVE`（截面绕 X 轴旋转，非整周自动补端盖），含零向量/零角度/负半径报错 | 签名按官方手册核对；mask 沙盒忽略；`RULED` / `SWEEP` / `TUBE` 未实现 |
| 10:10 | gdl-engine/errors.ts | 新增 `zeroExtrude` / `zeroRevolve` / `revolveY` 三条双语错误 | 沿用 Archicad 风格报错结构 |
| 10:12 | theme/GdlPlayground.vue | 新增 `revolve` / `extrude` 两个示例预设 | 原已有 `prism` 预设，避免重复 key 未再加 |
| 10:18 | tests/engine.test.ts | 新增 5 例：EXTRUDE 正常/零向量、REVOLVE 正常/负 y、ELLIPS 三参 | 单测 41 例 |
| 10:30 | guide/part2-intermediate（中英 14 页） | 第 6-12 章全文：PRISM 家族、旋转放样、材质属性、宏、门窗、字符串、参数化柜体 | 每章 159-180 行，结构统一；未支持命令只讲概念不编签名 |
| 10:40 | config.mts | 第二部分侧边栏由「待开放」改为 7 章实链，默认展开 | 中英同步 |
| 10:42 | guide/index（中英） | 路线图状态改「已完成」，进度清单补 6-12 章入口 | — |
| 10:45 | reference/data/commands.json | 新增 `EXTRUDE` / `REVOLVE` 与「旋转与放样」分类；PRISM/PRISM_/MATERIAL/PEN 回填章节链接 | 42 条 / 8 分类 |
| 10:50 | 修复 | 第 12 章英文 frontmatter 标题含冒号需加引号；两处 `/reference/commands` 补尾斜杠 | 死链检查与 YAML 解析报错 |
| 10:55 | 验证 | check:i18n 18 对、check:data 42 条、单测 41 例、build 成功 | 下一步 P4：精通篇 + 片段库 |

## 2026-11-07 开发计划 v2.0 全面改写

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:20 | 开发计划.md | 全面改写为 v2.0：19 章体系（0-18）、技术描述对齐实际、新增沙盒支持矩阵与三向校验、阶段表拆 P4a/b/c、质量保障章节、双语分层、版权授权与不做清单 | 保留 v1.0-v1.6 修订记录；.gsm L2 移出主线 |
| 11:28 | README.md | 章数 21 → 19；开发计划模块说明标注 v2.0 | 与计划保持一致 |
| 11:30 | guide/index（中英） | 路线图章数与精通篇编号同步为 19 章 / GDL-13~18；删除不存在的“自测清单”表述 | 原文与实际章节结构不符 |

## 2026-11-07 定位纠偏：查询优先（计划 v2.1）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:50 | scripts/check-search.mjs（新增） | 搜索命中率验收脚本：按 VitePress 同等配置重建索引，16 条固定查询，≥95% 算过；--cjk 可模拟二元分词对比 | 实测：默认分词 11/16（69%），二元分词 14/16（88%） |
| 11:52 | package.json | 新增 npm run check:search | 达标后再接入 CI 门禁 |
| 11:55 | 开发计划.md | 升 v2.1：核心定位改为「中文查询资料库 + 配套教程」；新增 4.2 引擎冻结策略、4.7 站内搜索与命令页静态化；P4 重排为 P4a 查询/P4b 精通/P4c 资料库/P4d 闭环；7.3 改脚本化验收 | 附带结论：速查页为纯组件，正文不进搜索索引，需静态化 |
| 11:58 | README.md | 补定位说明、check:search 模块与命令、计划版本号 | — |

**实测发现**：①「堆栈」查不到「变换堆栈」、「柜体」命中错页——中文词内子串缺失；②/reference/commands 由组件渲染，构建期搜索索引里没有命令名，查 BLOCK 找不到速查页，搜索引擎同样收录不到；③热点/HOTSPOT2 无内容，属章节缺口。

## 2026-11-07 P4a 查询能力：分词 + 命令页静态化 + 别名

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:00 | scripts/gen-command-pages.mjs（新增） | 由 commands.json 生成每条命令的独立 md 页（中英各一份），含分类/别名/语法/参数/说明/示例/相关章节/同类命令；自动清理孤儿页 | 生成物 gitignore，构建与 dev 前自动执行 |
| 10:02 | docs/.vitepress/config.mts | 新增 cjkTokenize 中文二元分词并接入 localSearch | 中文串输出整串 + 相邻二字组合，解决词内子串搜不到 |
| 10:05 | CommandTable.vue | 命令名改为详情页链接；搜索 haystack 纳入 aliases | 详情页由 JSON 生成，便于外部引用 |
| 10:06 | commands.json | 增 HOTSPOT2 完整签名（x,y,unID,type,dir）与 aliases；BLOCK 增中文别名；修正原 HOTSPOT2 两参数错误签名 | check:data 增 aliases 中英成对校验 |
| 10:10 | package.json / deploy.yml | 新增 predev/prebuild 生成、gen:commands、check:search 入 CI | CI 顺序：gen → i18n → data → search → test → build |
| 10:12 | check-search.mjs | 默认使用站点现用分词，--default 对比旧基线；查询增至 17 条并加入详情页期望 | 结果 17/17（100%），修复前 11/16（69%） |

**验证**：check:i18n 60 对、check:data 42 条、check:search 17/17、单测 41 例、build 成功（仅 Three.js chunk 体积提示）。
