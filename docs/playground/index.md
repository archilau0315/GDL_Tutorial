---
title: GDL 交互沙盒
description: 在浏览器里写 GDL，实时看到 3D 模型，报错与 Archicad 一致的定位方式
pageClass: wide-playground
aside: false
---

# GDL 交互沙盒

左侧写 GDL 脚本，右侧即时生成 3D 模型。这是全站的核心练习场：**改一个数字，模型立刻变**。

## 开始实验

<GdlPlayground :height="460" />

## 怎么用

1. **写代码**：左栏即 GDL 3D 脚本，`!` 开头是注释，Tab 键缩进；记不住命令就按 `Ctrl+Space` 调出搜索框，输 `cyl`、`圆柱` 都能命中，回车自动补全语法
2. **看模型**：右栏拖动旋转、滚轮缩放；每行代码下方的橙色数字是出错行号
3. **读报错**：底部错误面板按 Archicad 习惯定位——**脚本类型 + 行号 + 列号 + 错误描述**，改对即消失
4. **带走作品**：点「导出对象」得到 LP XML 文件，再按「复制转换命令」在本机执行（需装有 Archicad），即可生成可在 Archicad 中打开的 `.gsm` 对象

::: tip 沙盒边界
当前支持：`BLOCK` / `CYLIND` / `SPHERE` / `ELLIPS` / `CONE` 基本体，`PRISM` / `PRISM_` 挤出，`ADD` / `MUL` / `ROT` / `DEL` 变换，2D 全套绘图与变换命令，`MATERIAL` / `PEN` 属性，以及 `IF` / `FOR` / `WHILE` / `GOSUB` 流程控制。常用函数（`SIN` / `COS` / `SQRT` 等）可用，完整清单见[命令速查表](/reference/commands/)。
:::

## 报错长什么样

选「含错误的脚本」示例，你会看到三类典型错误——**未定义变量、参数个数不符、未知命令**，每条都带行列定位。这个格式与 Archicad 的脚本检查窗口一致：在沙盒里练会读报错，回到 Archicad 就无缝衔接。
