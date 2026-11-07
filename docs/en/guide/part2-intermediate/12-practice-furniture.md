---
title: "Chapter 12 Practice: A Parametric Cabinet"
description: Assemble a runnable cabinet from five parameters, BLOCK panels, a FOR shelf loop and GOSUB doors
---

# Chapter 12 Practice: A Parametric Cabinet

> Sheet GDL-12 · Intermediate · ~25 min · Sandbox included

## Goals

- Drive a whole cabinet from five parameters (`w` / `d` / `h` / `th` / `n`)
- Build panels with `BLOCK` and divide the interior with a `FOR` shelf loop
- Reuse a door-plus-handle routine with `GOSUB`, and separate parts with `MATERIAL`
- Add a 2D plan symbol and make it run in the same sandbox script

## Parameters and Parts

| Parameter | Meaning | Value | Affects |
|---|---|---|---|
| `w` | Overall width | 1.20 | Top/bottom, shelves, door width |
| `d` | Overall depth | 0.45 | Side panels, shelf depth |
| `h` | Overall height | 2.00 | Side panel height |
| `th` | Panel thickness | 0.018 | Every panel |
| `n` | Shelf count | 4 | Interior bays = `n + 1` |

## Step: Doors and Handles with GOSUB

```gdl
doorW = (w - 2 * th) / 2
ADD th, -0.02, th          ! two doors side by side, in front
hx = doorW - 0.06          ! left handle near the centre gap
GOSUB 200
ADD doorW, 0, 0
hx = 0.04                  ! right handle also near the centre
GOSUB 200
DEL 2                      ! back to base (two ADDs must be paired)
END

200:
MATERIAL 1                 ! restore the door material on entry
BLOCK doorW - 0.003, 0.018, innerH
ADD hx, -0.025, innerH * 0.5 - 0.08
MATERIAL 6                 ! handle
BLOCK 0.02, 0.025, 0.16
DEL 1
RETURN
```

`hx` is the handle's x offset inside the door. The main program changes it before each call; the subroutine reads the same global variable — the simplest form of "passing a parameter". `MATERIAL` is not part of the transform stack: neither `DEL` nor `RETURN` restores it, so the subroutine resets the door material itself on entry.

## Minimal Runnable Version (paste as a whole)

```gdl
! === 参数化柜体（最小可运行版）/ parametric cabinet ===
w  = 1.20
d  = 0.45
h  = 2.00
th = 0.018
n  = 4
MATERIAL 8                        ! carcass
BLOCK th, d, h                    ! left side
ADD w - th, 0, 0
BLOCK th, d, h                    ! right side
DEL 1
ADD th, 0, 0
BLOCK w - 2 * th, d, th           ! bottom
ADD 0, 0, h - th
BLOCK w - 2 * th, d, th           ! top
DEL 2
innerH = h - 2 * th
gap = innerH / (n + 1)
FOR i = 1 TO n
  ADD th, 0, th + i * gap
  BLOCK w - 2 * th, d - 0.02, th  ! shelf
  DEL 1
NEXT i
MATERIAL 3                        ! back panel
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
RECT2 0, 0, w, d                  ! 2D plan symbol
LINE2 w / 2, 0, w / 2, -0.02      ! door gap
LINE2 0, -0.10, w, -0.10          ! width dimension
LINE2 0, -0.14, 0, -0.06
LINE2 w, -0.14, w, -0.06
TEXT2 0.02, d + 0.07, "CABINET 1200"
TEXT2 w / 2 - 0.15, -0.26, "1200"
END
200:
MATERIAL 1                        ! door
BLOCK doorW - 0.003, 0.018, innerH
ADD hx, -0.025, innerH * 0.5 - 0.08
MATERIAL 6                        ! handle
BLOCK 0.02, 0.025, 0.16
DEL 1
RETURN
```

Two notes. **The sandbox runs 3D and 2D in one script**, while real Archicad separates them into a 3D script and a 2D script. And `"CABINET 1200"` / `"1200"` are literals: changing `w` does not rewrite them (the limit from Chapter 11).

## Sandbox

<GdlPlayground preset="bookcase" :height="460" />

How the preset differs from the full version (watch the shelf rhythm first, then paste the full version to compare):

| Item | Preset `bookcase` | Full version here |
|---|---|---|
| Parameters | fixed `w=0.9 / d=0.3 / h=1.8 / th=0.02` | all five adjustable |
| Shelves | `WHILE`, one every 0.4 m | `FOR`, evenly divided by `n` |
| Doors/handles | none | `GOSUB` double doors + handles |
| Materials | not set | `MATERIAL 8/3/1/6` |
| Plan symbol | none | `RECT2` + `LINE2` + `TEXT2` |

## Debug Checklist

| Check | Typical symptom | Fix |
|---|---|---|
| Transform pairing | each panel drifts further | count `ADD` against `DEL` |
| Argument order | absurd panel sizes | `BLOCK width, depth, height`; `CYLIND height, radius` |
| Loop variable | one shelf too many or too few | after `FOR`, `i = n + 1` — don't reuse it outside |
| Material order | doors turn into handle colour | reset `MATERIAL` at subroutine entry |

## Common Pitfalls

::: warning Three frequent errors
1. **Unpaired `ADD` / `DEL`**: one missing `DEL` in a loop makes every later panel drift
2. **Missing `END` after `GOSUB`**: the main program falls into the label and draws an extra door
3. **Assuming material restores itself**: `MATERIAL` is global state; `RETURN` does not restore it, so the second door inherits the handle material
:::

## Exercises (Extension Tasks)

1. Change `n` to `6` and replace the double doors with a single door (`doorW = w - 2 * th`). List the lines that must change.
2. Add four 0.05-high feet with `MATERIAL 7`, and lift the whole cabinet by 0.05.

::: details Answer 1
```gdl
n = 6                        ! the interior becomes 7 bays
doorW = w - 2 * th           ! single door fills the clear width
ADD th, -0.02, th
hx = doorW - 0.06            ! handle to the right
GOSUB 200
DEL 1                        ! call once only
! delete the original second group: ADD doorW / hx = 0.04 / GOSUB 200
```
`innerH`, `gap` and the shelf loop all derive from `n`, so they stay unchanged.
:::

::: details Answer 2
```gdl
! 1) lift everything before the first BLOCK
ADD 0, 0, 0.05
! 2) return to the floor before the 2D symbol
DEL 1
! 3) feet from 0 to 0.05 at the four corners
MATERIAL 7
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD (i - 1) * (w - 0.10), (j - 1) * (d - 0.10), 0
    BLOCK 0.05, 0.05, 0.05
    DEL 1
  NEXT j
NEXT i
```
Order matters: lift the cabinet, drop back to the floor, then draw the feet — they sit under the cabinet instead of being hidden by it.
:::

---

This chapter ties panels, loops, subroutines, materials and the 2D symbol into one complete object. For command lookup, see the [Command Reference](/en/reference/commands/).
