---
title: "Chapter 18 Final Project: Delivering a Door Object"
description: "From requirement sheet to parameter table, 3D, 2D, hotspots and acceptance — deliver a door your colleagues can use"
---

# Chapter 18 Final Project: Delivering a Door Object

> Sheet GDL-18 · Advanced · about 40 min read · includes a sandbox exercise

## Goals

- Turn "make me a single door" into a requirement sheet and a parameter table
- Deliver a complete object in the order 3D → 2D → hotspots → interface
- Self-check with an acceptance list instead of waiting for bug reports
- Know exactly which files a delivery contains

## Requirement sheet: agree before you model

| Item | Requirement | How to verify |
|---|---|---|
| Opening | width `A`, height `B`, free input | change the parameter, the model follows |
| Frame | 50 mm wide, depth follows `wallT` | measure in side view |
| Leaf | 40 mm thick, 3 mm gaps all round | zoom the 3D view |
| Swing | left / right, plan arc flips with it | check the plan |
| Handles | one each side, 1.0 m high | check in 3D |
| Plan symbol | opening + leaf + 90° arc + size text | plan at 1:50 |
| Editing | drag the top edge for `B`, the side for `A` | drag test in plan |
| Information | element ID and sizes printed in 2D | copy and renumber, text follows |

"Make a door" only becomes executable at this level of detail. **The parameter table is the requirement sheet in code form.**

## Parameter table

| Variable | Descriptive name | Type | Default |
|---|---|---|---|
| `A` | Opening width | Length | 1.00 |
| `B` | Opening height | Length | 2.10 |
| `wallT` | Wall thickness | Length | 0.20 |
| `ft` | Frame width | Length | 0.05 |
| `lt` | Leaf thickness | Length | 0.04 |
| `swing` | Open right | Boolean | 0 |
| `matFrame` | Frame material | Material | 3 |
| `matLeaf` | Leaf material | Material | 1 |

The parameter script guards the lower bounds so negative sizes never happen:

```gdl
! 参数脚本 / parameter script
VALUES "A" 0.60, 2.40, 0.05
VALUES "B" 1.80, 2.60, 0.05
VALUES "wallT" 0.10, 0.50, 0.01
VALUES "ft" 0.03, 0.10, 0.005
IF A < 0.9 THEN
  PARAMETERS ft = 0.04            ! narrower frame on narrow doors
ENDIF
```

## Step 1: the 3D script

```gdl
! === 单开门 3D / single door ===
! frame: two jambs + a head, depth follows the wall
MATERIAL matFrame
BLOCK ft, wallT, B
ADD A - ft, 0, 0
BLOCK ft, wallT, B
DEL 1
ADD 0, 0, B - ft
BLOCK A, wallT, ft
DEL 1

! leaf: 3 mm gap all round, centred in the wall
MATERIAL matLeaf
ADD ft + 0.003, (wallT - lt) / 2, 0.003
BLOCK A - 2 * ft - 0.006, lt, B - ft - 0.006
DEL 1

! handles, one on each face, 1.0 m high
MATERIAL 6
ADD A - ft - 0.12, -0.03, 1.00
BLOCK 0.025, 0.05, 0.025
ADD 0, wallT + 0.06, 0
BLOCK 0.025, 0.05, 0.025
DEL 2
```

Three coordinates are worth a pause: the leaf Y uses `(wallT - lt) / 2` so it stays centred when the wall changes; the handle sits at `A - ft - 0.12` near the leaf edge; `DEL 2` closes both `ADD` calls at once.

## Step 2: the 2D script

```gdl
! === 平面符号 / plan symbol ===
LINE2 0, 0, A, 0
LINE2 0, wallT, A, wallT
LINE2 0, 0, 0, wallT
LINE2 A, 0, A, wallT

! leaf + 90° swing arc
LINE2 0, 0, 0, A
ARC2 0, 0, A, 0, 90

! sizes and ID
TEXT2 0.02, -0.12, "D " + STR (A, 4, 2) + " x " + STR (B, 4, 2)
TEXT2 0.02, -0.26, GLOB_ID
```

`GLOB_ID` makes the label follow the element (Chapter 15). To support left/right swing, wrap the arc in `IF swing THEN` and draw it on the other side — the plan is where a wrong swing is easiest to see.

## Step 3: hotspots and interface

```gdl
! append to the 2D script: drag the side for A, the top for B
HOTSPOT2 0, 0, 1, A, 1 + 128        ! base of A
HOTSPOT2 -0.1, 0, 2, A, 3           ! reference, makes +X positive
HOTSPOT2 A, 0, 3, A, 2              ! moving point of A
HOTSPOT2 0, wallT, 4, B, 1 + 128    ! base of B
HOTSPOT2 0, -0.1, 5, B, 3
HOTSPOT2 0, B, 6, B, 2
```

The interface uses the three-level structure from Chapter 13 to split the most-used parameters over two pages:

```gdl
UI_DIALOG "Door"
UI_PAGE 1
  UI_OUTFIELD "Opening width", 10, 10, 70, 20
  UI_INFIELD  "A",            85, 10, 90, 20
  UI_OUTFIELD "Opening height", 10, 40, 70, 20
  UI_INFIELD  "B",            85, 40, 90, 20
UI_PAGE 2
  UI_OUTFIELD "Wall thickness", 10, 10, 70, 20
  UI_INFIELD  "wallT",         85, 10, 90, 20
  UI_RADIOBUTTON "swing", 0, "Left",  10, 45, 80, 20
  UI_RADIOBUTTON "swing", 1, "Right", 10, 70, 80, 20
```

## Step 4: acceptance list

| Check | How | Pass criteria |
|---|---|---|
| Linked sizes | change `A` / `B` | frame, leaf and handles all follow, nothing floats |
| Wall thickness | `wallT` from 0.1 to 0.5 | frame depth follows, leaf stays centred |
| Extremes | `A = 0.6`, `B = 2.6` | no negative sizes, no intersections |
| Plan quality | look at 1:50 and 1:100 | arc complete, text clear of lines |
| Dragging | drag side and top | parameters change and stay put |
| Copy | duplicate and renumber | 2D text updates by itself |
| Schedule | run one schedule | size fields filled, not blank |
| Performance | place 50 in plan | panning and zooming stay smooth |

## Sandbox demo: the 3D part

The code below runs as-is, with parameters at the top. Change `A`, `B` or `wallT` and watch the frame adapt; try other indices for `matFrame` / `matLeaf`.

<GdlPlayground preset="door" :height="460" />

## Delivery contents

| File | Content | For |
|---|---|---|
| `door.gsm` | the library part itself | the company library |
| `door.xml` | diffable source (Chapter 17) | git |
| `door.md` | parameter docs and usage notes | colleagues, newcomers |
| `door-plan.png` | plan symbol screenshot | project template |
| release note | version, date, changes | the library manager |

**An object without documentation is not delivered.** However clear the parameter names are, one page must say when each one applies and which values are forbidden.

## Common pitfalls

::: warning Three frequent mistakes
1. **Leaf touching the frame**: keep a 3 mm gap or coplanar faces flicker in 3D
2. **One `DEL` too few**: the handle lands at the next object's position and everything drifts
3. **Arc direction not tied to the swing flag**: the plan cannot show left or right, and the door is hung the wrong way on site
:::

## Exercises

1. Convert the door to double leaf: add a centre gap, give each leaf half the width, and let `swing` decide which leaf opens first.
2. Add a threshold line in plan and a 20 mm threshold stone in 3D.

::: details Answer 1
```gdl
! 3D: two leaves with a 4 mm centre gap
half = (A - 2 * ft - 0.004) / 2
MATERIAL matLeaf
ADD ft + 0.003, (wallT - lt) / 2, 0.003
BLOCK half, lt, B - ft - 0.006
ADD half + 0.004, 0, 0
BLOCK half, lt, B - ft - 0.006
DEL 2
```
The gap lives inside the `half` formula, so both leaves recompute when `A` changes.
:::

::: details Answer 2
```gdl
! 3D: threshold stone
MATERIAL 5
ADD 0, 0, -0.02
BLOCK A, wallT, 0.02
DEL 1

! 2D: threshold line
LINE2 0, 0, A, 0
```
The stone sits below `z = 0` — keep it off the slab plane. In plan the line coincides with the opening line; do not draw two.
:::

---

That is all nineteen chapters. Go back to the [learning path](/en/guide/) to review your progress, or jump into the [command index](/en/reference/commands/). Suggested next step: pick the object you edit most often at work and rebuild it using the Chapter 17 workflow.
