---
title: GDL Playground
description: Write GDL in the browser and see the 3D model instantly, with Archicad-style error reporting
pageClass: wide-playground
aside: false
---

# GDL Interactive Playground

Write GDL on the left, watch the 3D model build itself on the right. This is the core training ground of the whole site: **change one number, see the model change instantly**.

## Start Experimenting

<GdlPlayground :height="460" />

## How to Use

1. **Write code**: the left pane is a GDL 3D script; `!` starts a comment, Tab indents
2. **Inspect the model**: drag to orbit, scroll to zoom in the right pane; orange line numbers in the gutter mark error lines
3. **Read errors**: the bottom panel locates errors the Archicad way — **script type + line + column + description**; fix the code and they disappear
4. **Take your work with you**: "Export object" produces an LP XML file; then use "Copy convert command" on a machine with Archicad installed to produce a `.gsm` you can open in Archicad

::: tip Sandbox scope
Currently supported: `BLOCK` / `CYLIND` / `SPHERE` / `CONE` primitives, `ADD` / `MUL` / `ROT` / `DEL` transformations, variables, expressions, `IF` / `FOR` control flow. The PRISM family, materials and parameter panels arrive with the intermediate chapters.
:::

## What Errors Look Like

Pick the "Buggy script" example to see three typical errors — **undefined variable, wrong argument count, unknown command** — each with line/column positions. The format mirrors Archicad's script checking window: practice reading errors here, and you will feel at home back in Archicad.
