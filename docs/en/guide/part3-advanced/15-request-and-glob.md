---
title: "Chapter 15 REQUEST and GLOB"
description: "Read the project environment: GLOB globals, element placement, and runtime queries through REQUEST"
---

# Chapter 15 REQUEST and GLOB

> Sheet GDL-15 · Advanced · about 30 min read · includes a sandbox exercise

## Goals

- Tell apart values that come from parameters and values that come from the project (`GLOB_*`)
- Use `GLOB_SCALE` / `GLOB_ID` / `GLOB_HSTORY_ELEV` so objects follow the project
- Handle placement with `SYMB_POS_X/Y/Z` and `GLOB_WORLD_ORIGO_OFFSET_*`
- Query runtime data such as text styles with the `REQUEST` function

## Two kinds of outside data

Everything up to Chapter 14 was self-contained: parameters in, geometry out. In a real project the object must know where it is, at what scale it is drawn and which storey it belongs to. Archicad injects those values as global variables.

| Source | Written as | Supplied by | Typical use |
|---|---|---|---|
| Parameter | `w`, `h` | user / parameter table | sizes, switches |
| Global variable | `GLOB_SCALE` | Archicad project | scale-dependent display, view checks |
| Function query | `REQUEST(...)` | runtime data | text style height, referenced part data |

Globals are **read-only** — assigning to one is an error — and they are not saved and restored across macro calls the way the transform stack is.

## Common GLOB quick reference

| Variable | Meaning | Type |
|---|---|---|
| `GLOB_SCALE` | current drawing scale (100 = 1:100) | number |
| `GLOB_ID` | element ID string | string |
| `GLOB_HSTORY_ELEV` | elevation of the home storey | length |
| `GLOB_N_STORIES` | number of storeys in the project | number |
| `GLOB_FRAME_NR` | current frame number (multi-frame objects) | number |
| `SYMB_POS_X` / `Y` / `Z` | placement point of the object itself | length |
| `GLOB_WORLD_ORIGO_OFFSET_X` / `Y` | world origin offset in the project | length |

The full list (hundreds of entries, including view, curtain wall and MEP specific ones) is in the official Global Variables chapter. Search it by keyword instead of guessing names.

::: warning Globals have script type restrictions
View- and project-dependent globals must **not** be used in the parameter script. The parameter script runs again whenever the view changes, so the same object would get different parameter values in different views. Archicad raises a GDL warning and substitutes a type-matching default.
:::

## Example 1: scale-aware annotations

```gdl
! 2D script: text stays the same size on paper at any scale
paperH = 0.0025                    ! 2.5 mm on paper
modelH = paperH * GLOB_SCALE      ! convert to model space
TEXT2 0, 0, "SCALE 1:" + STR (GLOB_SCALE, 1, 0)
ADD2 0, modelH * 2
TEXT2 0, 0, "1000"
DEL2 1
```

`GLOB_SCALE` is the integer scale factor: 100 at 1:100. **All model geometry is written at real size**; only things that must look constant on paper (text height, symbols, arrow heads) are multiplied by it.

## Example 2: put the element ID on the object

```gdl
! 2D script: the label follows the element ID
IF GLOB_ID <> "" THEN
  elemID = GLOB_ID
ELSE
  elemID = "unassigned"
ENDIF
TEXT2 0, -0.15, elemID
```

Copy the object or renumber it and `GLOB_ID` follows, so the annotation stays correct — the same reason not to hard-code text (Chapter 11).

## REQUEST: ask Archicad for data

`REQUEST` is a **function**, not a statement. It returns how many output variables were filled:

```gdl
n = REQUEST ("Height_of_style", "Arial", hStyle)
```

| Part | Meaning |
|---|---|
| `"Height_of_style"` | request type (fixed string) |
| `"Arial"` | input: a style name |
| `hStyle` | output variable, in millimetres |
| `n` | 1 on success, 0 when nothing was read |

Typical uses: size a label frame from its text style, read parameters of a referenced library part, write object data into properties. Each request type has its own argument list, so **never write one from memory** — check the official REQUEST entry.

::: warning The sandbox supports neither GLOB nor REQUEST
The sandbox has no project environment, so `GLOB_*` and `REQUEST` are undefined there. The code here is a **structural sketch** to verify in Archicad. The demo below replaces `GLOB_SCALE` with a hard-coded scale; the logic is identical.
:::

## Sandbox demo: scale as a parameter first

Text height and symbol sizes are written as variables. Back in Archicad you only replace the two constants at the top with `GLOB_SCALE` expressions and nothing else changes.

<GdlPlayground preset="plan" :height="440" />

| In the sandbox | In Archicad |
|---|---|
| `scale = 100` written by hand | `scale = GLOB_SCALE` |
| Edit code to change scale | follows the drawing scale automatically |
| no project data | storeys, IDs and origin offsets available |

## Common pitfalls

::: warning Three frequent mistakes
1. **Reading `GLOB_SCALE` in the parameter script**: view-dependent globals are not allowed there; you get a warning and a dummy value
2. **Multiplying every size by `GLOB_SCALE`**: the model becomes 100 times too big; only paper-space sizes need it
3. **Using `REQUEST` as a statement**: `REQUEST "Height_of_style", ...` is invalid — it must be `n = REQUEST(...)`
:::

## Exercises

1. Build a scale bar symbol: draw a 1 m line that reports the correct length whether the drawing is 1:50 or 1:100.
2. Print `GLOB_HSTORY_ELEV` as text to verify it returns the storey elevation rather than an absolute height.

::: details Answer 1
```gdl
! 2D script
LINE2 0, 0, 1.0, 0                  ! 1 metre in the model
LINE2 0, -0.02, 0, 0.02
LINE2 1.0, -0.02, 1.0, 0.02
TEXT2 0.05, -0.10, "1 m  @  1:" + STR (GLOB_SCALE, 1, 0)
```
The line is always one metre (model units); only the text position and height need scale awareness.
:::

::: details Answer 2
```gdl
! 2D script: print the storey elevation
TEXT2 0, -0.2, "elev = " + STR (GLOB_HSTORY_ELEV, 8, 3)
```
The value already carries length units (metres) — do not multiply by 1000. `STR` only formats it. To check in 3D, place the text after `ADD 0, 0, GLOB_HSTORY_ELEV`.
:::

---

Next: [Chapter 16 Data and Files](/en/guide/part3-advanced/16-data-and-files) — arrays, string assembly, external files and property export.
