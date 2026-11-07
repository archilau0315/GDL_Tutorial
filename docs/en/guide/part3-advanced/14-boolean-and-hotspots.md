---
title: "Chapter 14 Booleans, GROUP and Hotspots"
description: "Package solids with GROUP, cut holes with SUBGROUP, and make sizes draggable with HOTSPOT"
---

# Chapter 14 Booleans, GROUP and Hotspots

> Sheet GDL-14 · Advanced · about 35 min read · includes a sandbox exercise

## Goals

- Package bodies into operable solids with `GROUP` / `ENDGROUP`
- Cut with `SUBGROUP`, merge with `ADDGROUP`, intersect with `ISECTGROUP`, place with `PLACEGROUP`
- Remember `KILLGROUP`: unreleased groups eat memory
- Use three matched `HOTSPOT2` points so users can drag an object to change a parameter

## Why groups exist

`BLOCK`, `CYLIND` and friends produce independent shells with no relation to each other. To cut a hole out of a board, the language first needs the idea that "this board is one solid" — that is a group.

| Concept | What it is | Analogy |
|---|---|---|
| Shell | faces produced by one `BLOCK` / `CYLIND` | a board |
| Solid | one or more shells as a single body | a board with a hole |
| Group | a named solid waiting for an operation | a part on the bench |

Groups do **not** appear in the model by themselves. After defining one you must `PLACEGROUP` it.

## GROUP and ENDGROUP

```gdl
GROUP "panel"
  BLOCK 0.60, 0.02, 2.00
ENDGROUP

GROUP "hole"
  ADD 0.30, -0.01, 1.20      ! transforms inside only affect the group
  ROTX -90                   ! turn the cylinder axis from +Z to +Y
  CYLIND 0.06, 0.03
ENDGROUP

result = SUBGROUP("panel", "hole")
PLACEGROUP result
KILLGROUP "panel"
KILLGROUP "hole"
```

Four rules:

1. Group names are strings and must be unique within the script
2. `GROUP` cannot be nested, but groups defined in macros can be used outside
3. `ADD` / `ROT` inside the definition stay inside; outside transforms do not reach in
4. Defining a group only registers it — `PLACEGROUP` generates the geometry

The `ROTX -90` trap deserves its own note: `CYLIND` always runs along +Z, so with the thickness in Y you must rotate the cylinder. Rotate the wrong way and the hole lands outside the board, looking like nothing happened.

## The three booleans

| Command | Result | Order sensitive |
|---|---|---|
| `ADDGROUP (a, b)` | union: two bodies into one | no |
| `SUBGROUP (a, b)` | difference: a minus b | **yes** |
| `ISECTGROUP (a, b)` | intersection: overlap only | no |

The result is a new group: store it in a variable, feed it into another operation, or place it directly. Below, a block minus a sphere plus a sphere sliced by a slab:

```gdl
GROUP "box"
  BLOCK 1.00, 1.00, 1.00
ENDGROUP

GROUP "sphere"
  ADD 0.50, 0.50, 1.00
  SPHERE 0.35
ENDGROUP

a = SUBGROUP("box", "sphere")

GROUP "dome"
  SPHERE 0.60
ENDGROUP

GROUP "slab"
  BLOCK 1.20, 1.20, 0.20
ENDGROUP

b = ISECTGROUP("dome", "slab")
c = ADDGROUP(a, b)
PLACEGROUP c

KILLGROUP "box"
KILLGROUP "sphere"
KILLGROUP "dome"
KILLGROUP "slab"
```

::: warning Booleans are expensive — keep the geometry clean
Every group operation performs a full solid intersection, orders of magnitude slower than drawing one `BLOCK`. Three hard rules: no self-intersecting bodies, no faces that touch exactly (leave a 1 mm gap), no zero-thickness parts. Call `KILLGROUP` as soon as a group is no longer needed.
:::

## Hotspots: drag the object, change the parameter

A hotspot is not geometry — it is an editing handle. To drag a length parameter in GDL you need three matched points:

| Role | `flags` type | Position | Purpose |
|---|---|---|---|
| Base | `1` | measurement start, usually a fixed corner | distance is measured from here |
| Moving | `2` | placed at the parameter value | the user drags this |
| Reference | `3` | gives the positive direction, always hidden | decides which way is positive |

```gdl
! 2D script: drag the top edge to change corner_y
HOTSPOT2 -1, 0, 1                        ! plain corner marker
HOTSPOT2  1, 0, 2
HOTSPOT2  0, 0, 3, corner_y, 1 + 128     ! base point, 128 = hidden
HOTSPOT2  0, -1, 4, corner_y, 3          ! reference point, hidden below
HOTSPOT2  0, corner_y, 5, corner_y, 2    ! moving point at the parameter value
```

Read it as: **value = distance from base to moving; positive direction = reference → base.** The reference sits at `(0, -1)` and the base at `(0, 0)`, so `+Y` is positive and dragging up increases `corner_y`.

The 3D version is `HOTSPOT x, y, z, ...` with the same arguments plus Z. If dragging must also work in 3D, the same set of hotspots has to be repeated in the 3D script.

::: warning The sandbox supports neither group operations nor hotspot editing
The sandbox rejects `GROUP` / `SUBGROUP` / `PLACEGROUP`, and accepts only `HOTSPOT2 x, y` (which draws nothing). Verify this chapter in Archicad; the demo below fakes a hole with separate blocks so the geometry stays visible.
:::

## Sandbox demo: cutting a hole without booleans

A board with a round hole in the middle, built from four rectangles. It runs, and it shows what a subtraction really does.

<GdlPlayground preset="boolean" :height="440" />

Faking versus real booleans:

| Item | Faking (sandbox) | `SUBGROUP` (Archicad) |
|---|---|---|
| Hole shape | rectangular approximation only | any shape: round, freeform |
| Faces | 4 boards = 16 faces | 1 board, hole walls generated |
| Material | visible seams | one continuous body |
| Cost | cheap | expensive but correct |

## Common pitfalls

::: warning Three frequent mistakes
1. **Forgetting `PLACEGROUP`**: the group is defined but nothing appears, and no error is raised
2. **Reversing `SUBGROUP`**: `SUBGROUP("hole", "panel")` subtracts the whole board from the hole and yields nothing
3. **Only drawing the moving hotspot**: without base and reference points nothing drags, and a wrong `flags` type fails the same way
:::

## Exercises

1. Cut two cable holes (radius 0.04, spacing 0.3) into the cabinet side panel with `SUBGROUP`.
2. Make the cabinet height `h` draggable: draw the three matched hotspots in the 2D script so the user can drag the top edge.

::: details Answer 1
```gdl
GROUP "panel"
  BLOCK 0.60, 0.02, 2.00
ENDGROUP

GROUP "holes"
  ADD 0.30, -0.01, 0.50
  ROTX -90
  CYLIND 0.06, 0.04
  BODY -1                    ! separates the second lump inside the same group
  ADD 0, 0, 0.30
  CYLIND 0.06, 0.04
ENDGROUP

PLACEGROUP SUBGROUP("panel", "holes")
KILLGROUP "panel"
KILLGROUP "holes"
```
Two holes must be two separate lumps — `BODY -1` is the separator. Without it the second cylinder joins the tail of the first and the result is one weird body.
:::

::: details Answer 2
```gdl
! 2D script
HOTSPOT2 0, 0, 1, h, 1 + 128          ! base point on the bottom edge
HOTSPOT2 -0.1, 0, 2, h, 3             ! reference on the left → +Y is positive
HOTSPOT2 0, h, 3, h, 2                ! moving point on the top edge
RECT2 0, 0, 0.60, h                   ! the outline follows as well
```
Once `h` changes the moving point jumps to the new height automatically — but the `RECT2` must actually use `h`, otherwise dragging changes the parameter and nothing else.
:::

---

Next: [Chapter 15 REQUEST and GLOB](/en/guide/part3-advanced/15-request-and-glob) — put the object into its project context and read floors, walls, project data and global variables.
