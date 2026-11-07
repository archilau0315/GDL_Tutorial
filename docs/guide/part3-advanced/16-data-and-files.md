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
| `DIM a[10]` | 固定长度 | 下标超出声明范围会报错并中止脚本 |
| `DIM a[]` | 动态长度 | 赋值时自动扩展，适合读文件；不检查越界 |
| `a[i]` | 第 i 个元素 | 下标从 1 开始，不是 0 |
| `DIM m[4][3]` | 二维数组 | 最多两维 |
| `VARDIM1(a)` / `VARDIM2(a)` | 取数组长度 | 动态数组读完文件后，用它拿到实际元素个数 |

固定长度的数组自带边界检查，写错下标会当场报错；动态数组把边界交给你自己管，越界读到的是内存里的垃圾值，而且不一定报错。读文件的循环结束后，用 `VARDIM1(codeArr)` 拿到的才是真实行数，别拿循环变量以外的数去猜。

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

`paramString` 里最常用的三项：

- `mode = ro` 只读，`wo` 只写（先清空原文件），`wa` 追加写。**没有 `rw`**，读写要分两次开
- `SEPARATOR = ','` 指定字段分隔符
- `LIBRARY` 表示相对当前库部件所在目录找文件

文本 Add-On 里，`INPUT` 的 `recordID` 是行号、`fieldID` 是行内第几个字段，都从 1 起；`OUTPUT` 不看这两个数的具体值，**只认它们变没变**——`recordID` 一变就换一行。所以导出时第 1 行写 `recordID = 1`、第 2 行写 `2`，纯粹是让人读起来对得上。

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

导出方向换 `mode = wo`（新建或覆盖）：

```gdl
ch = OPEN ("TEXT", "schedule.csv", "SEPARATOR = ',', mode = wo, LIBRARY")
IF ch > 0 THEN
  OUTPUT ch, 1, 1, "CODE", "WIDTH", "HEIGHT"
  FOR i = 1 TO n
    OUTPUT ch, i + 1, 1, codeArr[i], STR (wArr[i], 8, 3), STR (hArr[i], 8, 3)
  NEXT i
  CLOSE ch
ENDIF
```

`CLOSE` 负责把缓冲区刷到磁盘。写到一半直接崩掉，文件多半是残缺的，所以导出完立刻 `CLOSE`，别留在循环后面忘了。

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
1. **数组下标用 0**：固定数组直接报错，动态数组读到的是无意义的值
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
ch = OPEN ("TEXT", "shelf.csv", "SEPARATOR = ',', mode = wo, LIBRARY")
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
