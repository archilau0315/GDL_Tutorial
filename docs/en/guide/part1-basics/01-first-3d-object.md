---
title: Chapter 1 Your First 3D Object
description: Build your first parametric table with BLOCK/CYLIND/SPHERE/CONE
---

# Chapter 1 Your First 3D Object

> Sheet GDL-01 · Part 1 Basics · 20 min read · includes sandbox practice

## Goals

- Master the four 3D primitives and their **argument order**
- Learn to drive dimensions with variables instead of hard-coded numbers
- Build a table-and-stool assembly: one object = several primitives + positions

## The Four Primitives

The GDL 3D world is assembled from primitives. Beginners need only four:

```gdl
BLOCK 1, 2, 0.9      ! box: x length, y width, z height
CYLIND 1.2, 0.4      ! cylinder: height, radius
SPHERE 0.5           ! sphere: radius
CONE 1.2, 0.5, 0.1   ! cone: height, bottom radius, top radius (0 = pointed)
```

Three things to remember:

1. Every primitive grows from **the current origin** along the positive axes (not from its centre)
2. **Z is height**, given as the last argument
3. For `CYLIND` and `CONE` the **first argument is height**, not radius — the most common mistake

::: warning Why CYLIND trips people up
Most software writes cylinders as `radius, height`; GDL reverses it: `CYLIND h, r`. Writing `CYLIND 0.4, 1.2` gives a squat 0.4-high, 1.2-wide drum.
:::

## From Hard-coded Numbers to Variables

Numbers work, but they cannot be changed. First move: lift dimensions into variables.

```gdl
w  = 1.2    ! width
d  = 0.6    ! depth
h  = 0.72   ! height
th = 0.04   ! board thickness
```

Variable names are case-insensitive; lowercase is conventional. **Variables are step one of parametric design**: in a real Archicad object these become parameters in the settings dialog (Chapter 3).

## Building the Table: Top Plus Four Legs

The logic is plain: place the tabletop, then move the origin to each leg position and draw a cylinder.

```gdl
w = 1.2
d = 0.6
h = 0.72
th = 0.04
legR = 0.03

! table top, lifted to h - th
ADD 0, 0, h - th
BLOCK w, d, th
DEL 1

! four legs via a nested loop
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD legR + (i - 1) * (w - 2 * legR), legR + (j - 1) * (d - 2 * legR), 0
    CYLIND h - th, legR
    DEL 1
  NEXT j
NEXT i
```

Three new things appear: `ADD` (move the origin), `DEL 1` (undo that move) and `FOR` (loop). **Chapters 2 and 5 explain them properly**; for now copy, run, and build intuition.

## Try It

The sandbox below holds exactly this code (plus a one-legged stool). Change three things and watch:

1. Set `w = 1.2` to `2.0` — the table widens and the legs follow automatically
2. Set `legR = 0.03` to `0.06` — legs thicken, positions adjust
3. Delete a `DEL 1` line — everything after it drifts, and errors may appear

<GdlPlayground :height="480" />

## Common Pitfalls

::: warning Four easy mistakes in this chapter
1. **Argument order**: `CYLIND h, r` and `CONE h, r1, r2` — height always first
2. **Forgetting DEL**: without it the origin stays moved, and everything afterwards drifts
3. **Contradictory dimensions**: a leg radius larger than the table width causes self-intersection or negative-value errors
4. **Unit confusion**: typing 720 for 720 mm sends the model into orbit
:::

## Exercises

1. Add a stretcher ring: at height 0.2 m, connect the four legs with `BLOCK` (hint: loop + `ADD`)
2. Change cylindrical legs to square legs (`BLOCK` of `2*legR × 2*legR`)
3. Turn the table into a bar counter: height 1.05 m, top thickness 0.06 m — do the legs need changes?

Hint: a stretcher means moving the origin to a leg, drawing a long bar, then `DEL`. Do not forget the `DEL`.

## Self-check

- [ ] I can write the four primitives with correct argument order
- [ ] I know primitives grow from the origin along positive axes
- [ ] I use variables instead of hard-coded numbers
- [ ] I understand `ADD` and `DEL` come in pairs
- [ ] The sandbox table runs and survives dimension changes

---

Next chapter is all about `ADD` / `ROT` / `MUL` / `DEL` — the core discipline of GDL: the transformation stack.
