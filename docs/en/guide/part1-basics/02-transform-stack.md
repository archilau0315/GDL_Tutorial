---
title: Chapter 2 The Transformation Stack
description: ADD/ROT/MUL/DEL and the stack discipline — the core mindset of GDL
---

# Chapter 2 The Transformation Stack

> Sheet GDL-02 · Part 1 Basics · 25 min read · includes sandbox practice

## Goals

- Understand that transforms **move the whole coordinate system**, not the object
- Master the four core transforms `ADD` / `ROT` / `MUL` / `DEL`
- Build the habit of pairing `ADD` with `DEL`
- Predict the difference between "rotate then move" and "move then rotate"

## Mindset: You Move the Grid, Not the House

This is the most misunderstood and most important idea in GDL:

> `ADD` does not move an object — it **moves the entire coordinate system** (origin and axis directions). Everything drawn afterwards grows from the new origin.

Picture drawing on paper: `ADD 1, 0, 0` pushes the whole sheet 1 metre to the right; you keep drawing from the new origin. **What is already drawn stays put**; only what follows is affected.

## The Four Core Transforms

| Command | Effect | Typical use |
|---|---|---|
| `ADD x, y, z` | translate the origin | placing things |
| `ROT x, y, z` | rotate about X, then Y, then Z (degrees) | arrays, braces, revolved parts |
| `MUL x, y, z` | scale the axes | variants, local stretching |
| `DEL n` | undo the last n transforms | return to a previous frame |

`DEL` is a **stack operation**: every `ADD`/`ROT`/`MUL` pushes a layer, `DEL 1` pops one, `DEL 2` pops two, `DEL TOP` pops everything.

::: warning Transforms accumulate
```gdl
ADD 0, 0, 0.4
BLOCK 1, 0.6, 0.05
ADD 0, 0, 0.4
BLOCK 1, 0.6, 0.05
```
The second plate sits at **0.8**, not 0.4 — the second `ADD` adds 0.4 on an already lifted frame. This is the usual cause of mysterious drift.
:::

## Side-by-side: With and Without DEL

Both loops below are **character-for-character identical**: rotate by `i*45`, step out 0.9 m, draw a block. The only extra line on the right is `DEL 2`.

- **Left**: no `DEL`, so each `ROTZ i*45` piles onto the previous one (45°, 90°, 135°…) and the distance accumulates too — the blocks scatter and overlap
- **Right**: `DEL 2` returns to the start every iteration, so `i*45` is the angle you actually meant — a clean ring

<GdlPlayground preset="stack" :height="460" />

One `DEL 2` line is the whole difference, and the geometry is unrecognisable. **Watching the model teaches the stack faster than reading code.**

::: tip Why the left side "rotates away"
`i*45` in `ROTZ i*45` is an **absolute** angle, but `ROT` **adds to** the current frame: round 1 turns 45°, round 2 turns another 90° on top (135° total), round 3 another 135° (270° total). The angles drift, so the blocks drift. With `DEL 2` every round starts from 0°, and `i*45` finally means what you intended.
:::

## Single-axis Shortcuts

`ADD x, y, z` needs three arguments; GDL offers single-axis versions that read better:

| Shortcut | Equivalent |
|---|---|
| `ADDX 1.5` | `ADD 1.5, 0, 0` |
| `ADDY 1.5` | `ADD 0, 1.5, 0` |
| `ADDZ 0.9` | `ADD 0, 0, 0.9` |
| `ROTX 90` / `ROTY 90` / `ROTZ 90` | rotate about one axis |
| `MULX 2` / `MULY 2` / `MULZ 2` | scale one axis |

Beginner advice: **prefer single-axis commands** — intent is obvious and arguments cannot land in the wrong slot.

## Order Matters: Rotate First or Move First

Transforms stack in the order written, so order decides the result:

```gdl
! A: move to 1.5, then spin in place
ADD 1.5, 0, 0
ROTZ 45
BLOCK 0.3, 0.1, 0.6

! B: rotate the frame, then walk along the rotated X axis
ROTZ 45
ADD 1.5, 0, 0
BLOCK 0.3, 0.1, 0.6
```

In A the block sits at (1.5, 0) and spins; in B it walks 1.5 m along the 45° direction. **Different positions.**

Rule of thumb: a transform affects only the commands **after** it, and each new transform is applied to the **already transformed** frame.

## Arrays: Stack + Loop

```gdl
FOR i = 1 TO 8
  ROTZ i * 45          ! rotate the frame
  ADD 1.5, 0, 0        ! step along the rotated X axis
  BLOCK 0.3, 0.1, 0.6  ! draw one
  DEL 2                ! pop both, back to origin
NEXT i
```

`DEL 2` pops both `ROTZ` and `ADD`. **Every iteration must start from the same frame**, otherwise error accumulates — the reason array code always pairs transforms with `DEL`.

<GdlPlayground preset="array" :height="440" />

## Common Pitfalls

::: warning Four frequent mistakes
1. **Wrong `DEL` count**: two pushes, one pop — the next iteration starts from a shifted frame
2. **Drawing at the wrong level**: forgetting `DEL` after a `ROT` rotates everything that follows
3. **Assuming `ROT` spins around the object centre**: it rotates about **the current origin**
4. **Negative `MUL`**: mirroring flips face normals and may render oddly in Archicad
:::

## Exercises

1. Change the array from 8 blocks to 12, computing the angle automatically (`360 / 12`)
2. Build a table with **unevenly spaced legs**: two flush with the edges, two inset by 0.15 m (use explicit coordinates, no loop)
3. Use `ROTX 90` to stand a `BLOCK 1, 0.1, 0.5` upright as a chair back

## Self-check

- [ ] I can explain that transforms move the coordinate system
- [ ] I know `ADD` accumulates and `DEL` pops
- [ ] I can predict rotate-then-move versus move-then-rotate
- [ ] My array code pairs every transform with the right `DEL`
- [ ] I know the single-axis shortcuts and their equivalents

---

Next: making an object truly parametric — parameters, conditions and self-adjustment.
