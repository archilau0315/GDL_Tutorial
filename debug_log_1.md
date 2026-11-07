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

## 2026-11-07 P4b 精通篇 13-15 章

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:40 | docs/guide/part3-advanced/13-ui-script.md + en 版 | 新章：参数列表 / 参数脚本 / UI 脚本三层，VALUES、PARAMETERS、LOCK、HIDEPARAMETER，UI_DIALOG 结构示意 | 沙盒不支持参数脚本与 UI_*，代码块明示「结构示意」 |
| 10:48 | docs/guide/part3-advanced/14-boolean-and-hotspots.md + en 版 | 新章：GROUP/ENDGROUP、SUBGROUP/ADDGROUP/ISECTGROUP、PLACEGROUP/KILLGROUP、HOTSPOT2 三点长度编辑 | 签名依据官方 GDL Center 的 Solid Geometry 与 Hotspots 章节 |
| 10:52 | GdlPlayground.vue | 新增 preset `boolean`：四块拼出带洞的板，演示无布尔时的写法 | 沙盒不支持组运算 |
| 11:05 | docs/guide/part3-advanced/15-request-and-glob.md + en 版 | 新章：GLOB 常用表、脚本类型限制、SYMB_POS、REQUEST 为函数形式 | REQUEST 签名查官方 Height_of_style 条目 |
| 11:10 | commands.json | 修正 HOTSPOT2 为官方签名 x,y[,unID[,paramRef[,flags[,displayParam[,desc]]]]]；新增分类「实体与布尔」「参数与界面」及 GROUP/SUBGROUP/ADDGROUP/ISECTGROUP/PLACEGROUP/KILLGROUP/VALUES/PARAMETERS/LOCK/HIDEPARAMETER | 42 → 52 条，10 分类 |
| 11:12 | config.mts、guide/index.md（中英） | 侧边栏第三部分展开并登记 13-15 章；进度清单同步 | 第三部分改为默认展开 |

**验证**：check:i18n 62 对、check:data 52 条、check:search 17/17、单测 41 例、build 成功。

## 2026-11-07 P4b 精通篇收尾 16-18 章 + README 双语化

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:52 | README.md | 全文中英双语重写：badge、定位、章节进度表、快速开始、目录结构、模块清单、写章流程、部署 | 一个文件同时显示中英双语 |
| 11:02 | docs/guide/part3-advanced/16-data-and-files.md + en 版 | 新章：DIM 数组（1 起始、动态数组）、STR 宽度陷阱、OPEN/INPUT/OUTPUT/CLOSE、FILE_DEPENDENCE、VARTYPE | 签名依据官方 File Operations 与 Expressions |
| 11:06 | docs/guide/part3-advanced/17-toolchain-and-migration.md + en 版 | 新章：七个脚本页职责、LP_XMLConverter 往返、升级七步检查表、命名与版本规范、性能预算 | 流程篇，无沙盒 |
| 11:10 | docs/guide/part3-advanced/18-final-project.md + en 版 | 新章：门对象交付全流程（需求书→参数表→3D→2D→热区→UI→验收→交付物） | 含可运行 3D 片段 |
| 11:12 | GdlPlayground.vue | 新增 preset `door`：单开门门框 + 门扇 + 内外把手 | 沙盒可跑 |
| 11:16 | config.mts、guide/index.md（中英）、README 状态 | 登记 16-18 章，第三部分标记全部完成 | 19 章全部完成 |
| 11:20 | commands.json | 新增「数据与文件」分类及 DIM/OPEN/INPUT/OUTPUT/CLOSE/VARTYPE 6 条 | 52 → 58 条，11 分类 |

**验证**：check:data 58 条、check:i18n 76 对、check:search 17/17、单测 41 例、build 成功。

## 2026-11-07 内容校对批次（官方语法核对）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:38 | 13-ui-script.md（中英） | UI 示例改为官方签名：`UI_DIALOG` 只带标题、`UI_PAGE` 用页号、`UI_RADIOBUTTON` 补齐参数名与值；删除不存在的 `UI_CHECKBOX` 与尺寸参数；补命令参数表与「无 UI_ENDDIALOG/UI_ENDPAGE」提示 | `UI_DIALOG` 可用区固定约 444×296 px，尺寸参数无效 |
| 10:38 | 13-ui-script.md（中英） | 参考答案 2 改为合法写法：两页用 `UI_PAGE 1` / `UI_PAGE 2`，去掉标题当页号的错误 | 同步修正 warning 措辞 |
| 10:40 | 16-data-and-files.md（中英） | 修正数组越界说法（固定数组报错、动态数组不检查）；新增 `VARDIM1` / `VARDIM2`；`OPEN` 模式改为 ro/wo/wa 并声明无 rw；说明 INPUT 位置从 1 起、OUTPUT 只认 recordID 变化；CLOSE 措辞改为刷盘与截断风险 | 导出示例与参考答案 2 的 `mode = rw` 全部改 `wo` |
| 10:41 | 18-final-project.md（中英） | UI 示例去掉 `UI_DIALOG` 尺寸参数与 `UI_CHECKBOX`，`swing` 改为一组单选按钮 | 页号改为 1 / 2 |
| 10:42 | commands.json | 修正 DIM / OPEN / INPUT / OUTPUT / CLOSE / VARTYPE 的描述与参数；VARTYPE 示例换成类型转换写法；新增 VARDIM1 | 58 → 59 条 |
| 10:43 | README.md | 命令数 58 → 59（badge 与中英正文） | — |

**验证**：check:data 59 条 11 分类、check:i18n 82 对、check:search 17/17、单测 41 例、build 成功。

## 2026-11-07 GLOB 变量速查（P4c 第一模块）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:50 | reference/data/globals.json | 新建单源双语数据：28 个 GLOB 变量 / 7 类（楼层、项目、元素、太阳、输出、脚本、填充与自由全局），字段含类型、说明、最小示例、章节回链、中文别名 | 变量名与类型按官方 Global Variables 章节核对 |
| 10:51 | theme/components/GlobTable.vue | 新建速查组件：关键词搜索（含中文别名）+ 分类筛选 + 类型徽标 + 章节回链，样式沿用命令表 | 注册为全局组件 `GlobTable` |
| 10:51 | theme/i18n.ts | 新增 8 组界面文案（搜索、全部、计数、空态、三种类型、章节、数据来源） | 中英成对 |
| 10:52 | reference/globals.md（中英） | 新建页面：用法要点、变量表、非 GLOB 的内置变量对照、常见误传表、沙盒限制说明 | 中英镜像 |
| 10:52 | config.mts | 导航与侧边栏加入「GLOB 变量 / GLOB Variables」 | 两语 |
| 10:53 | scripts/check-data.mjs | 扩展校验 globals.json：命名前缀、类型枚举、中英字段、分类、章节文件存在性 | 一份脚本校验两份数据 |
| 10:53 | scripts/check-search.mjs | 新增 3 条 GLOB 查询用例（GLOB_SCALE、楼层标高、全局变量） | 17 → 20 条 |
| 10:54 | README.md / reference/index.md | 补「资料库」模块表、GLOB 徽章与入口链接；命令页与目录说明同步 | 中英双语 |

**验证**：check:data 59 条命令 + 28 个变量、check:i18n 84 对、check:search 20/20、单测 41 例、build 成功。

## 2026-11-07 开源定位修正 + 代码片段库（P4c 第二模块）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 10:56 | README.md | 定位由「公司内部学习资源」改为「公司开发并开源发布的资料」：徽章改 open source，授权段改为内容 CC BY 4.0 + 代码 MIT，中英同步 | 补「与 Graphisoft 无隶属关系」声明 |
| 10:57 | reference/data/snippets.json | 新建 12 段片段 / 4 类（几何阵列、参数联动、2D 符号、数据文件），字段含标题、说明、代码、标签、章节回链、沙盒可运行标记 | 全部为原创写法 |
| 10:57 | theme/components/SnippetList.vue | 新建片段库组件：搜索（标题/说明/代码/标签）+ 分类筛选 + 一键复制（含降级方案） | 注册为 `SnippetList` |
| 10:58 | theme/i18n.ts | 新增 9 组文案：搜索、全部、计数、空态、复制、已复制、沙盒可运行、章节、来源 | 中英成对 |
| 10:58 | reference/snippets.md（中英） | 新建页面：用法说明 + 片段列表 + 单源数据提示 | 中英镜像 |
| 10:59 | config.mts / reference/index.md | 侧边栏与资料库入口加入片段库 | 两语 |
| 10:59 | scripts/check-data.mjs | 扩展校验 snippets.json：id 唯一、分类、中英字段、sandbox 布尔、章节存在 | 一份脚本校验三份数据 |
| 11:00 | scripts/check-search.mjs | 新增 2 条片段查询用例；「圆形阵列」改为页面实有文案「沙盒可运行」 | 20 → 22 条，22/22 命中 |

**验证**：check:data 59 条命令 + 28 个变量 + 12 个片段、check:i18n 85 对、check:search 22/22、单测 41 例、build 成功。

## 2026-11-07 常见错误手册（P4c 第三模块，资料库收口）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:02 | reference/data/errors.json | 新建 24 条 / 5 类：语法结构 7、命令与参数 4、变量与表达式 4、几何与变换 5、Archicad 环境 4；每条含报错原文、原因、改法、错误/正确写法、章节回链 | 前 20 条消息取自 `gdl-engine/errors.ts` 原文 |
| 11:02 | theme/components/ErrorList.vue | 新建手册组件：搜索（消息/原因/改法/代码）+ 分类筛选 + 错误-正确双栏对照 | 注册为 `ErrorList` |
| 11:03 | theme/i18n.ts | 新增 11 组文案：搜索、全部、计数、空态、原因、改法、错误/正确写法、章节、来源 | 中英成对 |
| 11:03 | reference/errors.md（中英） | 新建页面：先看三件事 + 手册列表 + 未收录反馈指引 | 中英镜像 |
| 11:03 | config.mts / reference/index.md / README.md | 侧边栏、资料库入口、README 模块表补「常见错误手册 ✅」 | 资料库四模块齐备 |
| 11:04 | scripts/check-data.mjs | 扩展校验 errors.json；`checkChapter` 支持目录型链接（`/reference/commands/` → index.md） | 一份脚本校验四份数据 |
| 11:04 | scripts/check-search.mjs | 新增 2 条用例（常见错误、报错信息） | 22 → 24 条，24/24 命中 |

**验证**：check:data 59 命令 + 28 变量 + 12 片段 + 24 错误、check:i18n 86 对、check:search 24/24、单测 41 例、build 成功。

## 2026-11-07 P4d 学习闭环：进度面板 + README 公司名

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:05 | reference/data/chapters.json（新增） | 19 章清单单源：3 个分部 + 每章 num/part/中英标题/中英链接 | 章页新增只需改这一份 |
| 11:06 | theme/components/ProgressPanel.vue（新增） | 学习进度面板：总进度 + 分部进度条、逐章勾选、重置；localStorage `gdl-progress-v1` 持久化 | 只在 onMounted 读写，SSR 安全；隐私模式静默降级 |
| 11:07 | theme/index.ts、i18n.ts | 注册 `ProgressPanel`；新增 progSummary/progReset/progMark/progOpen/progHint 五组中英文案 | — |
| 11:08 | guide/index.md（中英） | 「当前进度」静态清单 → `## 我的进度` + `<ProgressPanel>`，静态勾选与真实学习状态解耦 | 原 19 条全 `[x]` 会误导新读者 |
| 11:08 | scripts/check-data.mjs | 扩展校验 chapters.json：id/章号不重复、分部存在、中英成对、href 前缀与页面存在 | 一份脚本校验五份数据 |
| 11:09 | scripts/check-search.mjs | 新增 2 条用例（我的进度、学习路径） | 24 → 26 条，26/26 命中 |
| 11:09 | README.md | 公司名统一为「匡形无界 / Kuanform Boundless Intelligent Technology」；模块表补「学习进度 ✅」；check:search 17 → 26；写章流程第 3 步改为维护 chapters.json | 中英双语同步 |

**验证**：check:data 59 命令 + 28 变量 + 12 片段 + 24 错误 + 19 章、check:i18n 86 对、check:search 26/26、单测 41 例、build 成功。

## 2026-11-07 P4d 续：章节页脚与跨页进度同步

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:20 | theme/useProgress.ts（新增） | 进度状态抽成组合式函数：模块级单例 Set、onMounted 读取、监听 storage 事件多标签页同步 | 组件不再各存一份，SSR 安全 |
| 11:22 | theme/components/ChapterFooter.vue（新增） | 章末页脚：按当前页路径自动匹配章节，给「上一章 / 标记本章学完 / 下一章」与总进度 | 匹配规则：去掉 `en/` 与 `.md` 后对齐 `href.zh`；非章节页自动隐藏 |
| 11:23 | theme/Layout.vue（新增）、theme/index.ts | 继承默认主题 Layout，在 `#doc-after` 插槽挂页脚；组件无需逐页手写 | 38 个章节页零改动即生效 |
| 11:24 | theme/components/ProgressPanel.vue | 改用 useProgress；新增「继续学习」按钮，跳第一个未完成章节（全完成回第一章） | 与页脚状态实时一致 |
| 11:25 | theme/i18n.ts | 新增 progContinue / progPrev / progNext / progDoneChapter / progMarkChapter / progOverall 六组中英文案 | — |
| 11:26 | README.md | 学习进度模块说明补章节页脚与跨标签同步，核心模块表改指 useProgress.ts | 中英同步 |

**验证**：build 成功；实测第 2 章页脚上一章→第 1 章、下一章→第 3 章，英文页自动用 `/en/` 链接；学习路径页「继续学习」按钮渲染正常。

## 2026-11-07 P4d 收尾：首页学习卡片

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 11:40 | theme/components/ProgressCard.vue（新增） | 首页学习卡片：总进度条 +「下一站：章节名」+ 继续/开始学习按钮 + 学习路径入口 | 复用 useProgress，纯前端 |
| 11:41 | theme/index.ts、i18n.ts | 注册 `ProgressCard`；新增 progStart / progCardTitle / progCardEmpty / progCardNext / progCardDone / progCardAll 六组文案 | 中英成对 |
| 11:42 | index.md（中英） | 首页 hero 下插入学习卡片；顺带修正特性文案「21 章」→「19 章」 | 与 chapters.json 一致 |
| 11:43 | README.md | 学习进度模块说明补「首页卡片」 | 中英同步 |

**验证**：build 成功；中文首页命中「我的学习进度 / 还没开始 / 开始学习」，英文首页命中「My learning progress / Not started yet」；未改动后端或存储结构。

## 2026-11-07 开发计划 v2.2：状态表对齐实际

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 12:05 | 开发计划.md | 版本 v2.1 → v2.2；当前进度改为 P0–P4d 主体完成并列出剩余项 | 文档长期停留在 P3 完成状态 |
| 12:06 | 开发计划.md | 阶段表：P4b ✅、P4c/P4d 主体完成、P4a 标出⑤⑥未完成、验收数字改为实测值 | 搜索 17/17 → 26/26 |
| 12:07 | 开发计划.md | 3.3 资料库表：四模块标已上线，新增「术语表」行；3.4 术语库改「待建」；精通篇标题改「已上线」 | — |
| 12:08 | 开发计划.md | 4.4 组件清单按真实文件重写（ProgressPanel / ProgressCard / ChapterFooter / useProgress），Quiz、VersionBadge 标待开发 | 原写的 ProgressTracker 并不存在 |
| 12:09 | 开发计划.md | 命令数 42 → 59、分类 8 → 11；修订记录追加 v2.2 | — |

## 2026-11-07 P4c 术语表上线

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 12:20 | reference/data/glossary.json（新增） | 39 个易混术语 / 6 类（对象与图库、脚本与运行、几何与坐标、参数与界面、属性与材质、工具链与交付），每条含中英术语、别名、一句话解释、章节回链 | 术语以官方英文为准，只收真正容易混的 |
| 12:24 | theme/components/GlossaryTable.vue（新增） | 中英术语同排 + 别名 + 说明 + 对应章节；搜索（中英皆可）与分类筛选；按用途分组 | 复用 globSearch 同类交互样式 |
| 12:26 | reference/glossary.md + en 版（新增） | 页首说明 + 「三组最容易搞混的词」对照表 + 组件 | 中英内容等价 |
| 12:27 | theme/index.ts、i18n.ts | 注册 `GlossaryTable`；新增 glSearch / glFound / glSource | 中英成对 |
| 12:28 | config.mts、reference/index.md（中英） | 侧边栏加「术语表 / Glossary」；资料库总览加入口 | — |
| 12:29 | scripts/check-data.mjs | 增加 glossary.json 校验（id、分类、中英 term/desc、aka、章节链接）与统计输出 | 六份数据统一校验 |
| 12:30 | scripts/check-search.mjs | 新增「热区」「图库部件」两条查询 | 26 → 28 条 |
| 12:31 | README.md、开发计划.md | 资料库表补术语表；校验说明补 glossary；P4c 状态同步 | 中英同步 |

**验证**：check:data（59 / 28 / 12 / 24 / 39 / 19 章）、check:i18n 87 对、check:search 28/28、单测 41 例、build 成功；SSR 产物含全部 39 条术语与 37 个章节回链。

## 2026-11-07 P5 第一批：性能与 SEO

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 13:10 | theme/components/GdlPlayground.vue | three / OrbitControls / renderer 改为挂载时动态导入，类型用 `import type`；3D 未就绪时先出 2D 与报错 | 主题分块 731KB → 218KB；three 单独 668KB，仅沙盒页加载 |
| 13:12 | theme/components/GdlPlayground.vue | `rebuild()` 增加 gfx 就绪守卫；`initThree` 改 async，加载中点离开时不再挂载 | 避免重复渲染与空指针 |
| 13:20 | docs/.vitepress/config.mts | 新增 `GDL_SITE_URL`；`transformHead` 输出 canonical、zh-CN / en / x-default hreflang、OG 与 twitter 标签 | 中英自动互指，子路径一并带上 |
| 13:22 | docs/.vitepress/config.mts | 启用 sitemap（`transformItems` 前缀 `GDL_BASE`）；`buildEnd` 生成 robots.txt | 域名与路径都不写死 |
| 13:23 | docs/.vitepress/config.mts | 英文 locale 补 description | 原来英文页会继承中文站点描述 |
| 13:26 | scripts/clean-dist.mjs（新增）、package.json | 构建前清空 dist | VitePress 不清理旧 hash 分块，dist 曾堆积 15 份 theme 包 |
| 13:30 | README.md、开发计划.md | 部署说明补 `GDL_SITE_URL` 与按需加载；计划升 v2.3，取消版本标注 | 中英同步 |

**验证**：check:data / check:i18n / check:search 28/28 / 单测 41 例全绿；默认构建与 `GDL_BASE=/resources/GDL_Tutorial/` 构建均成功；子路径构建下 canonical、sitemap、robots 均带 `/resources/GDL_Tutorial/`；英文页 og:description 为英文。

## 2026-11-07 P4d 章末自测（Quiz）

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 14:05 | theme/components/ChapterQuiz.vue（新增） | 从 `page.relativePath` 去掉 `en/` 与 `.md` 取末段作章节 id，匹配题库；无数据不渲染；单选 + 提交/重做 + 得分 + 逐题解析 | 不写进 md，靠插槽挂载 |
| 14:06 | theme/Layout.vue | `#doc-after` 插槽内 `ChapterQuiz` 置于 `ChapterFooter` 之前 | 38 个章节页零改动 |
| 14:07 | theme/i18n.ts | 新增 quizTitle / quizCount / quizHint / quizSubmit / quizRedo / quizScore / quizRight / quizExplain 中英文案 | — |
| 14:20 | reference/data/quizzes.json（新增） | 第 0–5 章 18 题（第一批，已提交） | 只出可验证的事实题 |
| 14:30 | scripts/check-data.mjs | 增加 quizzes 校验：章节存在且不重复、每章 ≥ 3 题、id / q / explain / options 中英成对、中英选项数量一致、answer 为合法下标；统计输出追加题数 | 七份数据统一门禁 |
| 15:10 | reference/data/quizzes.json | 第 6–12 章 21 题：PRISM 闭合轮廓、REVOLVE 绕 X 轴、材质索引、宏传参、WALLHOLE 用 2D 轮廓、STR 转换、柜体参数化 | 覆盖进阶篇全部章节 |
| 15:25 | reference/data/quizzes.json | 第 13–18 章 18 题：三层职责、PARAMETERS vs LOCK、PLACEGROUP、SUBGROUP 顺序、热区三点、GLOB 只读、REQUEST 返回值、数组从 1 起、OPEN 返回 -1、XML 进 git、门扇 3 mm 缝 | 覆盖精通篇全部章节 |
| 15:30 | reference/data/quizzes.json | 用一次性脚本重排选项，使正确答案分布在 A/B/C 各 19 题 | 规避「全选第一项」的假题 |
| 15:35 | README.md、开发计划.md | 资料库表补「章末自测」；模块表补 ChapterQuiz.vue；check:data 说明补 quizzes；P4d 标记完成，计划升 v2.4 | 中英同步 |

**验证**：check:data 输出「19 章 / 3 个分部，19 章自测（57 题）」；build 成功；中文第 13 章页含「本章自测」、英文页含「Chapter quiz」，选项文本正常渲染；命令详情页无自测块。

## 2026-11-07 手机端验证与命令卡横向溢出修复

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 16:10 | theme/components/CommandTable.vue | `.cmd-block` 增加 `min-width: 0`，移动端网格列改为 `minmax(0, 1fr)` | 修复示例代码长行把整页撑到 466px 的问题 |

**验证方法**：Chrome DevTools 协议做 390×844 / DPR3 / 触摸模拟，逐页读取 `scrollWidth` 与溢出元素，并按区段截图。

**结果**：首页、学习路径、章节页、沙盒、命令速查、命令详情、错误手册、代码片段、术语表、英文章节页共 10 页，`scrollWidth` 均为 390，无横向溢出；命令速查页修复前 466px、修复后 390px。章末自测在中文页显示「本章自测 / 提交答案 / 答对 3/3 / 重做」，英文页显示「Chapter quiz / Submit」，答完 3 题提交后出现 3 个「正确答案」标记与 3 段解析；章节页脚在手机上堆叠居中（标记学完 → 上一章 → 下一章）；汉堡菜单内含「简体中文 / English」切换与 Appearance；沙盒页编辑器与 3D 视口上下堆叠，canvas 按 DPR 渲染且无报错。

## 2026-11-07 沙盒命令搜索与自动补全

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 17:20 | theme/components/CommandFinder.vue（新建） | 输入即搜：命令名 > 别名 > 语法 > 说明四级打分；↑↓ 选择、回车插入、Esc 关闭；插入时替换光标前半截命令名并选中参数占位 | 数据直接复用 commands.json，无新增数据文件 |
| 17:22 | theme/components/GdlPlayground.vue | 编辑器标题行嵌入搜索框；`Ctrl/Cmd+Space` 聚焦；新增 `insertCommand()` 处理插入与选区 | 标题行高度保持 24px，不影响代码区高度计算 |
| 17:24 | theme/i18n.ts | 新增 `findPlaceholder` / `findEmpty` 中英文案 | 两语对齐仍为 87 对 |
| 17:30 | docs/playground/index.md、docs/en/playground/index.md | 用法第 1 条补充 Ctrl+Space 与中文检索说明 | 中英同步 |
| 17:35 | README.md | 核心模块表补「命令搜索」一行 | — |

**踩坑**：分类名一开始取 `c.label[loc]`（实际数据结构是 `{id, zh, en}` 直挂），且模板里用 ref 当动态键取值为空，改为 `catName()` 函数；失焦延时关闭会把重新聚焦后的下拉关掉，改为记录 timer、聚焦/输入时取消。

**验证**：`add` → ADD / ADD2 / ADDGROUP / ADDX / ADDY / ADDZ；`mater` → MATERIAL；`圆柱` → CYLIND；回车后编辑器出现 `MATERIAL index` 且 `index` 处于选中态；Ctrl+Space 焦点落到搜索框；桌面 1280 与手机 390 均无横向溢出。

## 2026-11-07 编辑器内联补全

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 18:05 | theme/styles/gdl-playground.css（新建） | 把 GdlPlayground 的 152 行 scoped 样式抽成外部文件，SFC 用 `<style scoped src>` 引用 | 组件从 827 行降到 737 行，回到 800 行以内 |
| 18:10 | theme/useEditorSuggest.ts（新建） | 光标前命令名做前缀匹配；用等宽字宽 + 行列号估算气泡坐标；底部空间不够时翻到光标上方 | 纯计算，不做 textarea 镜像层 |
| 18:12 | theme/components/EditorSuggest.vue（新建） | 候选气泡：命令名 + 语法，选中项高亮，Tab 提示 | 宽 200px，绝对定位于 `.pg-code-wrap` |
| 18:16 | theme/components/GdlPlayground.vue | 编辑器监听 input / click / scroll / blur；↑↓ 切换、Tab 或 Enter 取用、Esc 忽略当前词；输入法组合期间不弹 | 取用复用既有 `insertCommand()` |
| 18:18 | styles/gdl-playground.css | `.pg-code-wrap` 加 `position: relative` 作为气泡定位父级 | — |

**踩坑**：翻转到光标上方时写了 `let top = ...`，遮蔽了同名 ref，触发 `Cannot create property 'value' on number`，改名 `topY`；气泡以 `.pg-code-wrap` 为定位父级，坐标需加 `textarea.offsetLeft`（行号槽 40px）。

**验证**：输入 `blo` → BLOCK 气泡出现在光标下方；Tab → 插入 `BLOCK a, b, c` 且 `a, b, c` 选中；继续输入 `add` → 6 个候选；Esc 后同词不再弹；顶部搜索框（Ctrl+Space）不受影响。

## 2026-11-07 README 双语与 Gitee 镜像

| 时间 | 模块 | 变更简述 | 备注 |
|---|---|---|---|
| 18:40 | README.md | 标题下加语言跳转 `中文 / English`，两语各自锚点直达 | 一个文件承载双语 |
| 18:42 | README.md | 徽章区首位加 GitHub、Gitee 双徽章，视觉与原有技术徽章一致 | Gitee 用 `logo=gitee` + 品牌红 |
| 18:45 | README.md | 中文「快速开始」后新增「代码托管」：两条 clone 地址、国内走 Gitee、合并以 GitHub 为准 | — |
| 18:47 | README.md | 英文「Quick start」后新增「Source code」对应段落 | 与中文信息一致 |
| 18:50 | README.md | 英文补「Core modules」表（10 行），与中文核心模块表对齐；中文补「编辑器补全」一行 | 两语结构对齐 |

**备注**：Gitee 用户名确认为 `archilau`（`archilau0315` 在 Gitee 不存在），README 三处链接已由 `archilau0315` 改为 `archilau`；`https://gitee.com/archilau/GDL_Tutorial` 实测目前 404（仓库尚未创建），建好后徽章自动生效。GitHub 主仓已验证 200。

**验证**：README 中英两段结构一一对应（这是什么/现在有什么/资料库/快速开始/代码托管/目录结构/核心模块/写一章/部署/授权），无缺段。
