---
title: 第 14 章 布尔、GROUP 与热区
description: 用 GROUP 打包实体、用 SUBGROUP 挖洞、用 HOTSPOT 做可拖拽的长度编辑
---

# 第 14 章 布尔、GROUP 与热区

> 图号 GDL-14 · 精通篇 · 阅读约 35 分钟 · 含沙盒练习

## 本章目标

- 用 `GROUP` / `ENDGROUP` 把体块打包成可运算的实体组
- 用 `SUBGROUP` 挖洞、`ADDGROUP` 合并、`ISECTGROUP` 取交集，用 `PLACEGROUP` 落位
- 记住 `KILLGROUP`：组不释放会一路吃内存
- 用 `HOTSPOT2` 三个一组做长度编辑，让用户直接拖对象改参数

## 为什么要「组」

`BLOCK`、`CYLIND` 这些基本体生成的是独立外壳，互相之间没有关系。想从一块板里挖个洞，语言层面必须先有「这块板是一个整体」的概念——这就是组。

| 概念 | 是什么 | 类比 |
|---|---|---|
| 外壳 shell | 一次 `BLOCK` / `CYLIND` 产生的面 | 一块板 |
| 实体 solid | 一个或多个外壳组成的整体 | 一块开了洞的板 |
| 组 group | 用名字标记的实体，等运算 | 工作台上的零件 |

组**不会**自己出现在模型里。定义完必须 `PLACEGROUP` 才真正生成几何。

## GROUP 与 ENDGROUP

```gdl
GROUP "panel"
  BLOCK 0.60, 0.02, 2.00
ENDGROUP

GROUP "hole"
  ADD 0.30, -0.01, 1.20      ! 组内变换只影响组内，不影响外面
  ROTX -90                   ! 圆柱轴由 Z 转向 +Y，才能穿透板厚
  CYLIND 0.06, 0.03
ENDGROUP

result = SUBGROUP("panel", "hole")   ! 板减洞
PLACEGROUP result
KILLGROUP "panel"
KILLGROUP "hole"
```

四条规矩：

1. 组名是字符串，同一个脚本里不能重名
2. `GROUP` 不能嵌套，但宏里定义的组可以在外层用
3. 组内的 `ADD` / `ROT` 只作用于组内，组定义外的变换也进不来
4. 组定义结束时几何只是「登记」了，`PLACEGROUP` 才落进模型

`ROTX -90` 这个坑值得单独记：`CYLIND` 的轴永远沿 +Z，板厚在 Y 方向时必须把圆柱转过去，转错方向洞就挖在板外面，看起来像「什么都没发生」。

## 三种布尔

| 命令 | 结果 | 顺序敏感 |
|---|---|---|
| `ADDGROUP (a, b)` | 并集：两块合成一块 | 否 |
| `SUBGROUP (a, b)` | 差集：a 减 b | **是**，写反了是另一回事 |
| `ISECTGROUP (a, b)` | 交集：只留重叠部分 | 否 |

运算结果是新的组，可以存进变量继续参与运算，也可以直接 `PLACEGROUP`。下面用「方块减球 + 球切板」拼一个带圆顶的底座：

```gdl
GROUP "box"
  BLOCK 1.00, 1.00, 1.00
ENDGROUP

GROUP "sphere"
  ADD 0.50, 0.50, 1.00
  SPHERE 0.35
ENDGROUP

a = SUBGROUP("box", "sphere")      ! 方块挖出一个球缺

GROUP "dome"
  SPHERE 0.60
ENDGROUP

GROUP "slab"
  BLOCK 1.20, 1.20, 0.20
ENDGROUP

b = ISECTGROUP("dome", "slab")     ! 球 ∩ 板 = 一个圆鼓
c = ADDGROUP(a, b)
PLACEGROUP c

KILLGROUP "box"
KILLGROUP "sphere"
KILLGROUP "dome"
KILLGROUP "slab"
```

::: warning 布尔运算贵，写法要干净
每次组运算都要做完整的实体求交，比画一个 `BLOCK` 慢几个数量级。三条硬规矩：不要自相交、不要让两个面刚好贴合（留 1 mm 缝）、不要出现零厚度。用完立刻 `KILLGROUP`，否则组会一直占着内存到脚本结束。
:::

## 热区：让用户拖对象改参数

热区（hotspot）不是几何，是编辑抓手。GDL 里做「拖动改尺寸」，长度参数必须凑齐三个点：

| 角色 | `flags` 类型 | 放在哪 | 作用 |
|---|---|---|---|
| 基准点 base | `1` | 测量起点，通常固定在角点 | 距离从这里量 |
| 移动点 moving | `2` | 位置 = 参数值 | 用户拖它 |
| 参考点 reference | `3` | 给正方向，永远隐藏 | 决定往哪边算正 |

```gdl
! 2D 脚本：拖上边改参数 corner_y
HOTSPOT2 -1, 0, 1                        ! 单纯的角点提示
HOTSPOT2  1, 0, 2
HOTSPOT2  0, 0, 3, corner_y, 1 + 128     ! 基准点，128 = 隐藏
HOTSPOT2  0, -1, 4, corner_y, 3          ! 参考点，藏在下方
HOTSPOT2  0, corner_y, 5, corner_y, 2    ! 移动点，画在参数值高度
```

读法：**参数值 = 基准点到移动点的距离；正方向 = 从参考点指向基准点。** 参考点在 `(0, -1)`，基准点在 `(0, 0)`，所以 `+Y` 为正，往上拖 `corner_y` 变大。

3D 版用 `HOTSPOT x, y, z, ...`，参数含义相同，只是多了 Z。要在 3D 里也能拖，3D 脚本得把同一组热区再写一遍。

::: warning 沙盒暂未支持组运算与热区编辑
沙盒不认 `GROUP` / `SUBGROUP` / `PLACEGROUP`，热区命令只接受 `HOTSPOT2 x, y` 两个参数且不显示。本章代码请回 Archicad 验证；下面的沙盒演示用「拼块」模拟开洞，先看清几何关系。
:::

## 沙盒演示：没有布尔时怎么开洞

一块中间带圆孔的板，用四个矩形拼出来。跑得通，也看得见「减法」在几何上到底做了什么。

<GdlPlayground preset="boolean" :height="440" />

拼块与真布尔的差别：

| 项目 | 拼块（沙盒） | `SUBGROUP`（Archicad） |
|---|---|---|
| 洞的形状 | 只能矩形近似 | 任意：圆、异形 |
| 面数 | 4 块板 = 16 个面 | 1 块板，孔壁自动生成 |
| 材质 | 拼接处有接缝 | 一体成型 |
| 性能 | 便宜 | 贵，但正确 |

## 常见坑

::: warning 三个高频错误
1. **忘了 `PLACEGROUP`**：组定义完没落位，模型里什么都没有，脚本也不报错
2. **`SUBGROUP` 顺序写反**：`SUBGROUP("hole", "panel")` 是把整块板从洞里减掉，得到空
3. **热区只写了移动点**：没有基准和参考点，拖不动；`flags` 类型写错也拖不动
:::

## 练习

1. 用 `SUBGROUP` 给柜体侧板开两个走线孔（半径 0.04、间距 0.3），写出完整脚本。
2. 给柜体加一个可拖拽的 `h`（总高）：在 2D 脚本里画三个一组的热区，让用户拖顶边改高度。

::: details 参考答案 1
```gdl
GROUP "panel"
  BLOCK 0.60, 0.02, 2.00
ENDGROUP

GROUP "holes"
  ADD 0.30, -0.01, 0.50
  ROTX -90
  CYLIND 0.06, 0.04
  BODY -1                    ! 同一组里放第二个独立体，必须用 BODY -1 分隔
  ADD 0, 0, 0.30
  CYLIND 0.06, 0.04
ENDGROUP

PLACEGROUP SUBGROUP("panel", "holes")
KILLGROUP "panel"
KILLGROUP "holes"
```
两个孔必须写成两个独立的「块」，`BODY -1` 就是分隔符；否则第二个圆柱会接到第一个的尾部变成一个异形。
:::

::: details 参考答案 2
```gdl
! 2D 脚本
HOTSPOT2 0, 0, 1, h, 1 + 128          ! 基准点在底边
HOTSPOT2 -0.1, 0, 2, h, 3             ! 参考点在左侧 → +Y 为正
HOTSPOT2 0, h, 3, h, 2                ! 移动点在顶边
RECT2 0, 0, 0.60, h                   ! 平面轮廓顺便跟着改
```
`h` 变了以后移动点自动跑到新高度，不需要额外刷新；但 `RECT2` 里必须真的用 `h`，否则拖了尺寸不变。
:::

---

下一章：[第 15 章 REQUEST 与 GLOB](/guide/part3-advanced/15-request-and-glob)——把对象放进项目环境，读取楼层、墙体、项目信息和全局变量。
