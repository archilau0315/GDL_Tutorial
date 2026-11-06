---
title: Chapter 4 The 2D Script
description: LINE2/RECT2/CIRCLE2/ARC2/POLY2_/TEXT2 and the plan symbol
---

# Chapter 4 The 2D Script

> Sheet GDL-04 · Part 1 Basics · 25 min read · includes sandbox practice

## Goals

- Understand the division of labour between 2D and 3D scripts
- Master six common 2D drawing commands and their **argument traps**
- Control contours and fills with `POLY2_`'s `frame_fill` bits
- Know what `PROJECT2` does and when to use it

## What the 2D Script Does

The 3D script builds the model; **the 2D script draws what appears in plan**. The two are independent:

- A chair in plan shows the symbol drawn by the 2D script, not a projection of the model
- An empty 2D script makes Archicad fall back to stored binary symbol data (legacy, not recommended)
- For complex parts, drawing the symbol is faster and more legible than projecting

::: tip Units and coordinates
2D lengths are in metres and **Y points up** (matching the 3D X/Y plane). The origin is the insertion point.
:::

## Six Commands

```gdl
LINE2   x1, y1, x2, y2           ! line: two points
RECT2   x1, y1, x2, y2           ! rectangle: two diagonal corners
CIRCLE2 x, y, r                  ! circle: centre + radius
ARC2    x, y, r, a1, a2          ! arc: centre, radius, start/end angle (deg)
POLY2   n, frame_fill, x1,y1, ...! polygon: n vertices
TEXT2   x, y, "text"             ! text: position + string
```

## Three Traps to Remember

::: warning Argument shapes are easy to get wrong
1. **`RECT2` takes diagonal corners, not "x, y, width, height"**
   `RECT2 0, 0, 1.2, 0.6` spans from (0,0) to (1.2,0.6).

2. **`CIRCLE2` includes the centre**
   `CIRCLE2 0.5, 0.5, 0.1` = centre (0.5, 0.5), radius 0.1.

3. **`TEXT2`'s third argument is a string**
   Quote it: `TEXT2 0, 0, "450x450"`. Unquoted, it is treated as a variable.
:::

## POLY2 and POLY2_: Contour and Fill

`POLY2` takes vertices only:

```gdl
POLY2 4, 7, 0, 0, 1.2, 0, 1.2, 0.6, 0, 0.6
```

`frame_fill` is a **bit combination**:

| Bit | Value | Meaning |
|---|---|---|
| j1 | 1 | draw contour |
| j2 | 2 | draw fill |
| j3 | 4 | close the polygon |

`7 = 1+2+4` means "contour + fill + closed", the usual choice. **With only bit 1 you get an outline; fill requires closure.**

`POLY2_` (with underscore) adds a status per vertex:

```gdl
POLY2_ 4, 7, 0,0,1, 1.2,0,1, 1.2,0.6,1, 0,0.6,-1
```

- `s = 1`: the segment starting at this vertex is **visible**
- `s = 0`: that segment is **hidden** (handy for filled shapes without edges)
- `s = -1`: **contour ends** (closure marker)

## Arcs: Angles of ARC2

`ARC2 x, y, r, a1, a2` draws **counter-clockwise** from `a1` to `a2`, in degrees:

```gdl
ARC2 0, 0, 0.5, 0, 90      ! from east to north, a quarter circle
ARC2 0, 0, 0.5, 0, 270     ! three quarters
```

Counter-clockwise is positive, so a lower half circle is `180 → 360`, not `0 → -180`.

## 2D Transforms: ADD2 / ROT2 / MUL2 / DEL2

2D has its own transform stack, with a `2` in the name:

```gdl
ADD2 0.5, 0      ! translate the 2D origin
ROT2 30          ! rotate the 2D frame (degrees)
MUL2 2, 1        ! scale
DEL2 1           ! pop one layer
```

**It is independent of the 3D stack**: `ADD 5,5,5` does not disturb 2D geometry. Verify it in the sandbox.

## PROJECT2: Projecting 3D into Plan

```gdl
PROJECT2 3, 270, 2
```

Meaning: use a projection of the 3D model as the plan symbol. The three arguments select projection mode, azimuth and display options.

**When to use it**: complex shapes whose plan truly is a top view. **When not to**: parts needing conventional drafting symbols (doors, windows, sanitary ware) — hand-drawing is clearer.

::: warning Sandbox limitation
The sandbox does not compute projections; `PROJECT2` is ignored. Learn the line for real Archicad work, and practise with hand-drawn 2D commands here.
:::

## Try It: A Chair Plan Symbol

The sandbox below is a pure 2D script (the 3D viewport will be empty; the right panel shows the symbol). Note four things:

1. The seat is a `RECT2` from two diagonal corners
2. Four leg circles, each with explicit centre
3. The armrest arc comes from `ARC2`
4. The fill uses `POLY2_` with `frame_fill = 7`

<GdlPlayground preset="chair2d" :height="460" />

Try three changes: bump the last number in `RECT2 0, 0, 0.45, 0.45` to `0.55` (deeper seat); enlarge the `ARC2` radius; change `7` in `POLY2_` to `1` (outline only, fill disappears).

## Common Pitfalls

::: warning Four frequent errors
1. **Treating `RECT2` as width/height**: wrong position and wrong size
2. **Wrong vertex count in `POLY2`**: `n` must match the coordinates given
3. **Forgetting closure**: without bit 4, no fill appears
4. **Using 3D transforms on 2D**: `ADD` does nothing to 2D geometry; use `ADD2`
:::

## Exercises

1. Add a cushion: a filled `POLY2_` inset 0.03 m inside the seat
2. Use `ROT2` in a loop to draw the chair symbol in four orientations (hint: `ROT2 i * 90`, then `DEL2`)
3. Draft the plan symbol of a 1.2 × 0.6 table: outer contour, four leg circles and a centred text label

## Self-check

- [ ] I know the 2D script only affects the plan symbol
- [ ] I remember `RECT2` uses diagonal corners and `CIRCLE2` includes the centre
- [ ] I can compute `frame_fill` bit combinations
- [ ] I can hide a single segment with `POLY2_` status codes
- [ ] I know the 2D and 3D transform stacks are independent

---

Next chapter: control flow — `IF` / `FOR` / `WHILE` / `GOSUB` for objects with logic.
