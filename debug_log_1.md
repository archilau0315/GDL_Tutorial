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
