---
title: 第 12 章 实战：参数化柜体
description: 用五个参数、BLOCK 拼板、FOR 排层板、GOSUB 做门板，组装一个可运行的柜体
---

# 第 12 章 实战：参数化柜体

> 图号 GDL-12 · 进阶篇 · 阅读约 25 分钟 · 含沙盒练习

## 本章目标

- 用 5 个参数（`w` / `d` / `h` / `th` / `n`）驱动整柜尺寸
- 用 `BLOCK` 拼板件，用 `FOR` 把内高均分成层板
- 用 `GOSUB` 复用门板 + 把手，用 `MATERIAL` 区分部位
- 补一段 2D 平面符号，并让它在同一个沙盒脚本里跑通

## 参数与零件清单

| 参数 | 含义 | 取值 | 影响 |
|---|---|---|---|
| `w` | 总宽 | 1.20 | 顶底板、层板、门宽 |
| `d` | 总深 | 0.45 | 侧板、层板深度 |
| `h` | 总高 | 2.00 | 侧板高度 |
| `th` | 板厚 | 0.018 | 所有板件厚度 |
| `n` | 层板数 | 4 | 内部分格数 = `n + 1` |

## 分步示例：门板与把手（GOSUB）

```gdl
doorW = (w - 2 * th) / 2
ADD th, -0.02, th          ! 两扇门并排，位于柜体前方
hx = doorW - 0.06          ! 左门把手靠中缝
GOSUB 200
ADD doorW, 0, 0
hx = 0.04                  ! 右门把手也靠中缝
GOSUB 200
DEL 2                      ! 退回基准（两次 ADD 要配对）
END

200:
MATERIAL 1                 ! 每次进门先恢复门板材质
BLOCK doorW - 0.003, 0.018, innerH
ADD hx, -0.025, innerH * 0.5 - 0.08
MATERIAL 6                 ! 把手
BLOCK 0.02, 0.025, 0.16
DEL 1
RETURN
```

`hx` 是「把手在门板内的 x 偏移」，主程序在每次调用前改它，子程序读同一个全局变量——最朴素的传参方式。`MATERIAL` 不是变换栈的一部分，`DEL` 和 `RETURN` 都不会帮你恢复，所以子程序入口要自己设回门板材质。

## 最小可运行版（整段粘贴）

```gdl
! === 参数化柜体（最小可运行版）/ parametric cabinet ===
w  = 1.20
d  = 0.45
h  = 2.00
th = 0.018
n  = 4
MATERIAL 8                        ! 板材
BLOCK th, d, h                    ! 左侧板
ADD w - th, 0, 0
BLOCK th, d, h                    ! 右侧板
DEL 1
ADD th, 0, 0
BLOCK w - 2 * th, d, th           ! 底板
ADD 0, 0, h - th
BLOCK w - 2 * th, d, th           ! 顶板
DEL 2
innerH = h - 2 * th
gap = innerH / (n + 1)
FOR i = 1 TO n
  ADD th, 0, th + i * gap
  BLOCK w - 2 * th, d - 0.02, th  ! 层板
  DEL 1
NEXT i
MATERIAL 3                        ! 背板
ADD th, d - 0.01, th
BLOCK w - 2 * th, 0.01, innerH
DEL 1
doorW = (w - 2 * th) / 2
ADD th, -0.02, th
hx = doorW - 0.06
GOSUB 200
ADD doorW, 0, 0
hx = 0.04
GOSUB 200
DEL 2
RECT2 0, 0, w, d                  ! 2D 平面符号
LINE2 w / 2, 0, w / 2, -0.02      ! 门缝
LINE2 0, -0.10, w, -0.10          ! 宽度尺寸线
LINE2 0, -0.14, 0, -0.06
LINE2 w, -0.14, w, -0.06
TEXT2 0.02, d + 0.07, "CABINET 1200"
TEXT2 w / 2 - 0.15, -0.26, "1200"
END
200:
MATERIAL 1                        ! 门板
BLOCK doorW - 0.003, 0.018, innerH
ADD hx, -0.025, innerH * 0.5 - 0.08
MATERIAL 6                        ! 把手
BLOCK 0.02, 0.025, 0.16
DEL 1
RETURN
```

两点说明：**沙盒把 3D 与 2D 放在一个脚本里执行**，真实 Archicad 里要拆成 3D 脚本和 2D 脚本；`"CABINET 1200"` 与 `"1200"` 是字面量，改 `w` 不会自动改字（第 11 章的边界）。

## 沙盒演示

<GdlPlayground preset="bookcase" :height="460" />

预设与本章完整版的差异（先看层板节奏，再把完整版粘进编辑器对比）：

| 项目 | 预设 `bookcase` | 本章完整版 |
|---|---|---|
| 参数 | 固定 `w=0.9 / d=0.3 / h=1.8 / th=0.02` | 5 个参数都可改 |
| 层板 | `WHILE`，每 0.4 m 一层 | `FOR`，按 `n` 均分 |
| 门板/把手 | 无 | `GOSUB` 双门 + 把手 |
| 材质 | 未设置 | `MATERIAL 8/3/1/6` |
| 平面符号 | 无 | `RECT2` + `LINE2` + `TEXT2` |

## 调试检查表

| 检查项 | 典型症状 | 处理 |
|---|---|---|
| 变换栈配对 | 板件一块比一块偏 | 数 `ADD` 与 `DEL` 层数是否相等 |
| 参数顺序 | 板件尺寸离谱 | `BLOCK 宽, 深, 高`；`CYLIND 高, 半径` |
| 循环变量残留 | 层板多一块或少一块 | `FOR` 结束后 `i = n + 1`，别在循环外复用 |
| 材质顺序 | 门板变成把手色 | 子程序入口重设 `MATERIAL` |

## 常见坑

::: warning 三个高频错误
1. **`ADD` 与 `DEL` 不配对**：循环里少写 `DEL`，后面的板件全部跟着漂移
2. **`GOSUB` 后忘了 `END`**：主程序掉进标签，门板被多画一扇
3. **以为材质会自动恢复**：`MATERIAL` 是全局状态，`RETURN` 不会还原，第二扇门会继承把手材质
:::

## 练习（扩展任务）

1. 把 `n` 改成 `6`，并把双门改成单扇门（`doorW = w - 2 * th`），列出需要同步改的行。
2. 给柜子加 4 个高 0.05 的垫脚，用 `MATERIAL 7` 区分，并把柜体整体抬高 0.05。

::: details 参考答案 1
```gdl
n = 6                        ! 内部分格自动变成 7 段
doorW = w - 2 * th           ! 单扇门占满内宽
ADD th, -0.02, th
hx = doorW - 0.06            ! 把手靠右侧
GOSUB 200
DEL 1                        ! 只调用一次
! 删除原来的第二组：ADD doorW / hx = 0.04 / GOSUB 200
```
`innerH`、`gap`、层板循环都由 `n` 自动推导，不用改。
:::

::: details 参考答案 2
```gdl
! ① 在第一个 BLOCK 之前整体抬高
ADD 0, 0, 0.05
! ② 2D 符号之前退回地面
DEL 1
! ③ 垫脚画在 0 → 0.05，位于四角
MATERIAL 7
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD (i - 1) * (w - 0.10), (j - 1) * (d - 0.10), 0
    BLOCK 0.05, 0.05, 0.05
    DEL 1
  NEXT j
NEXT i
```
顺序很重要：先抬柜体、退回地面，再画垫脚；垫脚在柜体下方，不会被柜体遮住。
:::

---

本章把板件、循环、子程序、材质和 2D 符号串成了一个完整对象。命令速查见 [命令参考](/reference/commands/)。
