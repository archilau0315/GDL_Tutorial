---
title: Chapter 8 Materials and Attributes
description: MATERIAL and PEN index rules, setting order, and how the sandbox palette approximates them
---

# Chapter 8 Materials and Attributes

> Sheet GDL-08 · Intermediate · ~20 min · Sandbox included

## Goals

- Distinguish **materials** (surfaces) from **pens** (lines)
- Use `MATERIAL n` and `PEN n` with numeric indices
- Understand that an index points into a project table, not at a fixed colour
- Avoid two ordering traps: set-before-draw, and `DEL` does not restore

## Materials and Pens

`MATERIAL` and `PEN` draw nothing; they only change the current state:

| Command | Controls | Example | Affects |
|---|---|---|---|
| `MATERIAL n` | Surface material of 3D solids | `MATERIAL 8` | 3D shapes drawn afterwards |
| `PEN n` | Pen used for lines | `PEN 2` | Outlines and 2D lines drawn afterwards |

Both take **one numeric index**. `MATERIAL "Wood"` or `PEN "Red"` is an error — colour names are not valid arguments in GDL.

::: tip Materials and pens are two separate tables
The material table says what a surface is made of; the pen table says which pen and line weight to use. A timber panel can have a wood material and still use a thin pen for its outline. Changing `MATERIAL` will not change line colour.
:::

## An Index Is Not a Colour

In real Archicad, `MATERIAL 8` means "material number 8 in the current project's material table". That might be "Brick - Red" here and "Concrete" in another project. Switch templates, disciplines or merged layers, and the meaning can change.

1. Never memorise an index as if it were a colour constant
2. When delivering an object, note "8 = timber veneer" in comments and attach the project material list
3. After moving to another project, spot-check a few indices before bulk use

| Index | Sandbox approximation | Typical use (illustration only) |
|---|---|---|
| 0 | Default blue | No material assigned |
| 3 | Brown | Joinery, door leaf |
| 4 | Light brown | Veneer, furniture |
| 8 | Orange | Accent, worktop |

::: warning Sandbox colours do not match Archicad
The sandbox has no material table, only a fixed **13-colour** palette: the index is taken modulo 13, with 0 as the default blue. The table above is only "roughly what it looks like"; it is **not** a reference for Archicad's material table. The sandbox only helps you tell "this part differs from that part"; `PEN` is parsed but does not change line display.
:::

## Example 1: Materials for the Top and Legs

Order matters: each `MATERIAL` goes before the geometry it should affect.

```gdl
! Top: material 8; legs: material 3
MATERIAL 8
ADD 0, 0, 0.7
BLOCK 1.2, 0.6, 0.04
DEL 1

MATERIAL 3
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD 0.05 + (i - 1) * 1.1, 0.05 + (j - 1) * 0.5, 0
    CYLIND 0.7, 0.03
    DEL 1
  NEXT j
NEXT i
```

`MATERIAL 3` is set once in the loop, yet all four legs change — it is state, kept until the next assignment.

## Example 2: Set First, Draw Later, `DEL` Restores Nothing

```gdl
MATERIAL 8
BLOCK 1, 0.4, 0.1

ADD 0, 0.5, 0
BLOCK 1, 0.4, 0.1        ! still material 8

ADD 0, 0.5, 0
MATERIAL 4
BLOCK 1, 0.4, 0.1        ! only this one is material 4

ADD 0, 0.5, 0
BLOCK 1, 0.4, 0.1        ! still material 4: DEL does not restore it
DEL 3
```

- A material setting **never applies retroactively**
- `DEL` pops the transformation stack, not the attribute state
- To "restore" a material you must assign it again

## Example 3: Switching Materials Inside a Loop

Alternate drawer fronts with an even/odd test:

```gdl
FOR i = 1 TO 4
  IF i / 2 = INT(i / 2) THEN
    MATERIAL 4
  ELSE
    MATERIAL 8
  ENDIF
  ADD 0, 0, i * 0.18
  BLOCK 0.6, 0.03, 0.14
  DEL 1
NEXT i
```

`INT(i / 2)` equals `i / 2` when `i` is even. Only basic functions are used, so this runs in both the sandbox and Archicad.

## Try It: Recolour the Bookcase

The preset is a parametric bookcase with every panel in the default colour. Before running, make three edits:

1. Insert `MATERIAL 3` before the two side panels
2. Insert `MATERIAL 8` before the shelf `WHILE` loop
3. Insert `MATERIAL 4` before the top panel

<GdlPlayground preset="bookcase" :height="440" />

Two things to watch: the shelf loop sets the material once and every shelf changes; the top panel comes after the loop and needs its own setting, otherwise it keeps material 8.

## Common Pitfalls

::: warning Three frequent errors
1. **Draw first, set later**: once a `BLOCK` exists, a later `MATERIAL 3` does nothing; materials affect only shapes generated afterwards
2. **Assuming `DEL` restores materials**: `DEL` pops transformations, not attributes, so a material changed in a subroutine comes back with it
3. **Copying indices between projects**: index 8 may be timber veneer in project A and glass in project B
:::

## Exercises

**Exercise 1**: Make the bookcase shelves alternate between two materials, still using the `WHILE` loop.

::: details Answer
Add a counter `k`, increment it per shelf, and switch on parity:

```gdl
! after the bookcase preset defines w / d / h / th
z = 0
k = 0
WHILE z <= h - th
  IF k / 2 = INT(k / 2) THEN
    MATERIAL 4
  ELSE
    MATERIAL 8
  ENDIF
  ADD 0, 0, z
  BLOCK w, d, th
  DEL 1
  z = z + 0.4
  k = k + 1        ! must increment, or the material never changes
ENDWHILE
```
:::

**Exercise 2**: Why do both lines below fail for the same cabinet, and how do you fix them?

```gdl
! error demo: colour names are not valid arguments
MATERIAL "Wood"
PEN Red
```

::: details Answer
`"Wood"` is a string and `Red` is read as an undefined variable; both commands accept numeric indices only. Use numbers from the current project tables:

```gdl
MATERIAL 3
PEN 2
```
:::

---

Next: [Chapter 9 Macros and Object Structure](/en/guide/part2-intermediate/09-macros) — package repeated parts into reusable library components.
