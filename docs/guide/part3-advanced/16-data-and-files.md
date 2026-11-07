---
title: 第 16 章 数据与文件
description: 用数组存表格数据，用字符串拼 CSV，用 OPEN/INPUT/OUTPUT 读写外部文件
---

# 第 16 章 数据与文件

> 图号 GDL-16 · 精通篇 · 阅读约 30 分钟 · 无沙盒演示（文件读写需回 Archicad 验证）

## 本章目标

- 用 `DIM` 声明数组，按 1 起始下标读写，把「一堆同类数值」管起来
- 把数组、字符串拼成可导出的一行行文本
- 用 `OPEN` / `INPUT` / `OUTPUT` / `CLOSE` 读写外部文本文件
- 知道 `VARTYPE` 什么时候救命，以及为什么归档要带 `FILE_DEPENDENCE`

## 数组：先把数据装起来

GDL 的数组必须先声明再使用，下标从 **1** 开始：

```gdl
DIM shelfH[8]          ! 固定 8 个元素
DIM rows[]             ! 动态数组，随用随长

shelfH[1] = 0.30
shelfH[2] = 0.35
shelfH[3] = 0.30

FOR i = 1 TO 3
  ADD 0, 0, shelfH[i]
  BLOCK 0.8, 0.3, 0.018
  DEL 1
NEXT i
```

| 写法 | 含义 | 注意 |
|---|---|---|
| `DIM a[10]` | 固定长度 | 越界不会报错，会读到垃圾值 |
| `DIM a[]` | 动态长度 | 赋值时自动扩展，适合读文件 |
| `a[i]` | 第 i 个元素 | 下标从 1 开始，不是 0 |
| `DIM m[4][3]` | 二维数组 | 最多两维 |

数组最常见的用途是「把参数表变成几何」：一张层高表、一组门窗分格、一列五金件。**数据放在数组里，几何用循环生成**，改数据不用改代码。

## 字符串：把数据拼成一行

第 11 章讲过 `STR`，这里补上导出场景需要的三条：

```gdl
line = "PANEL" + "," + STR (w, 8, 3) + "," + STR (h, 8, 3)
```

| 需求 | 写法 | 坑 |
|---|---|---|
| 数字转文本 | `STR (x, 8, 3)` | 第二、三个参数是总宽与小数位，太窄会变成一串 `*` |
| 拼接 | `+` | 两边必须都是字符串，数字要先 `STR` |
| 取子串 / 定位 | `STRSUB`、`STRSTR` | 下标同样从 1 开始 |

`STR` 的宽度不够是最常见的导出事故：`STR(1234.5, 4, 1)` 得到 `****`，不是 `1235`。**宁宽勿窄**。

## 文件读写：四件套

GDL 本身不碰磁盘，文件操作由 **Add-On** 完成。文本文件用官方的 GDL Text I/O Add-On，`OPEN` 的 `filter` 就填 `"TEXT"`。

| 命令 | 形式 | 返回值 |
|---|---|---|
| `OPEN` | `OPEN (filter, filename, paramString)` | 正数 = 通道号；`-1` 文件不存在；`-2` 缺 Add-On |
| `INPUT` | `INPUT (channel, recordID, fieldID, var1, ...)` | 成功读到的个数；`-1` 遇到文件尾 |
| `OUTPUT` | `OUTPUT channel, recordID, fieldID, expr1, ...` | 无 |
| `CLOSE` | `CLOSE channel` | 无 |

`recordID` / `fieldID` 是「从哪条记录、哪个字段开始」，具体解释权在 Add-On。文本文件一般按行/分隔符理解。

```gdl
! 读一个 3 列的 CSV：编号,宽,高
ch = OPEN ("TEXT", "cabinet.csv", "SEPARATOR = ',', mode = ro, LIBRARY")
IF ch > 0 THEN
  n = 0
  WHILE INPUT (ch, n + 1, 1, code, cw, chh) > 0
    n = n + 1
    codeArr[n] = code
    wArr[n] = cw
    hArr[n] = chh
  ENDWHILE
  CLOSE ch
ELSE
  n = 0
ENDIF
```

四步走：`OPEN` 判返回值 → 循环 `INPUT` 直到 `-1` → 存进动态数组 → `CLOSE`。**`OPEN` 一定要判 `> 0`**，否则后面所有 `INPUT` 都在对不存在的通道说话。

导出方向同理：

```gdl
ch = OPEN ("TEXT", "schedule.csv", "SEPARATOR = ',', mode = rw, LIBRARY")
IF ch > 0 THEN
  OUTPUT ch, 1, 1, "CODE", "WIDTH", "HEIGHT"
  FOR i = 1 TO n
    OUTPUT ch, i + 1, 1, codeArr[i], STR (wArr[i], 8, 3), STR (hArr[i], 8, 3)
  NEXT i
  CLOSE ch
ENDIF
```

::: warning 沙盒暂未支持数组与文件
沙盒引擎只实现章节需要的几何与流程命令，`DIM`、`OPEN`、`INPUT`、`OUTPUT` 都不在其中，本章因此没有交互演示。练习请直接在 Archicad 的库部件编辑器里做，用「检查脚本」看返回值。
:::

## 归档：别忘了 FILE_DEPENDENCE

对象读取外部文件后，文件路径只存在于当前电脑。把对象放进 `.pla` 或发给同事时，要用 `FILE_DEPENDENCE` 声明依赖，Archicad 才会把文件一起打包：

```gdl
FILE_DEPENDENCE "cabinet.csv"
```

漏了这一步的典型症状：本机一切正常，换台电脑全部读不到数据，对象静默退回默认值。

## VARTYPE：读文件时的保险

`INPUT` 读出来的变量类型由文件内容决定，可能是数字也可能是字符串：

| `VARTYPE` 返回 | 类型 | 用途 |
|---|---|---|
| 1 | 数值 | 参与计算 |
| 2 | 字符串 | 拼接、比较 |
| 3 | 组 | 布尔运算结果 |
| 4 | 字典 | 键值数据 |

读进来先 `IF VARTYPE (v) = 2 THEN` 再转换，比直接算术安全。类型不对时 GDL 不会在编译期拦住你，运行时才出错。

## 常见坑

::: warning 三个高频错误
1. **数组下标用 0**：`a[0]` 不是第一个元素，读到的值没有意义
2. **`OPEN` 不判返回值**：文件缺失时 `-1` 被当成通道号，后面全是无效操作
3. **`STR` 宽度给小了**：数字变成 `****`，导出的表全是星号
:::

## 练习

1. 用数组存 5 块层板的高度（0.3 / 0.32 / 0.35 / 0.32 / 0.3），循环生成柜体内部层板。
2. 写一段导出：把 5 块层板的序号和高度写进 `shelf.csv`，一行一块。

::: details 参考答案 1
```gdl
DIM sh[5]
sh[1] = 0.30
sh[2] = 0.32
sh[3] = 0.35
sh[4] = 0.32
sh[5] = 0.30

z = 0.018                       ! 从底板上表面起算
FOR i = 1 TO 5
  ADD 0, 0, z
  BLOCK 0.8, 0.3, 0.018
  DEL 1
  z = z + sh[i]                 ! 累加下一块的位置
NEXT i
```
`z` 是累加器，数组只存「间距」，位置由累加算出来。
:::

::: details 参考答案 2
```gdl
ch = OPEN ("TEXT", "shelf.csv", "SEPARATOR = ',', mode = rw, LIBRARY")
IF ch > 0 THEN
  OUTPUT ch, 1, 1, "INDEX", "HEIGHT"
  FOR i = 1 TO 5
    OUTPUT ch, i + 1, 1, STR (i, 2, 0), STR (sh[i], 8, 3)
  NEXT i
  CLOSE ch
ENDIF
```
先写表头再写数据，编号从 1 开始，方便回读时对应数组下标。
:::

---

下一章：[第 17 章 工具链与版本迁移](/guide/part3-advanced/17-toolchain-and-migration)——GSM 文件、LP_XMLConverter、版本升级检查表与团队协作。
