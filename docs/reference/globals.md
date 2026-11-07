# GLOB 变量速查

`GLOB_` 开头的是 Archicad 在运行脚本时提供的全局变量：当前层高、出图比例、元素编号都在这里。除了 `GLOB_USER_*`，它们都是只读的，不能赋值。

## 用法要点

- 名称固定且全大写，拼错不会报错，只会得到 0
- 长度单位一律毫米，不随项目单位设置变化
- `GLOB_SCALE` 是比例的分母：1:50 得到 50，不是 0.02
- GDL 没有布尔类型，`YES`/`NO` 这类开关本质是整数 1/0
- 2D、3D、参数脚本都能读；参数脚本里常和 `GLOB_MODPAR_NAME` 配合做联动

<GlobTable />

## 名字相近但不属于 GLOB

下面这些是「通用库部件参数」，官方单独成章，不要和 `GLOB_` 混着记：

| 变量 | 含义 |
|---|---|
| `SYMB_POS_X` / `SYMB_POS_Y` / `SYMB_POS_Z` | 符号相对插入点的位置 |
| `SYMB_ROTANGLE` | 符号旋转角 |
| `SYMB_MIRRORED` | 是否镜像放置 |
| `WALL_THICKNESS` | 宿主墙厚（门窗对象专用） |
| `WIDO_SILL` | 窗台高（门窗对象专用） |
| `PARAMETERS` | 参数名到值的映射，配合 `PARAMETERS.name` 读 |

## 常见误传

| 说法 | 实际情况 |
|---|---|
| `GLOB_STORY_NR`、`GLOB_MSTORIES` | 不存在。要楼层数量用 `APPLICATION_QUERY` 的 `StoryInfo` |
| `GLOB_UNIT`、`GLOB_PAPER_SIZE` | 不存在。长度恒为毫米，纸张信息不属于 GDL |
| `GLOB_DATE`、`GLOB_TIME` | 不存在。只有 `GLOB_PROJECT_DATE`，且由 EcoDesigner 写入 |
| `GLOB_CONTEXT` | 存在但已废弃，改用 `GLOB_VIEW_TYPE` + `GLOB_PREVIEW_MODE` |
| `GLOB_WALL_THICKNESS` | 前缀写错了，正确名是 `WALL_THICKNESS` |

::: tip 数据单源双语
变量清单存放在 `reference/data/globals.json`，中英字段并存一份，两个语言页面共用，修订只改数据不动页面。
:::

::: warning 沙盒不支持 GLOB
沙盒不模拟 Archicad 的项目环境，`GLOB_*` 一律返回 0。需要验证真实取值时，请在 Archicad 里用 2D 文本把值打印出来。
:::
