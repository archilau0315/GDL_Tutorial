---
title: Chapter 6 The PRISM Family
description: Extrude any profile from a vertex table — PRISM, PRISM_ and the four variants
---

# Chapter 6 The PRISM Family

> Sheet GDL-06 · Intermediate · ~20 min · Sandbox included

## Goals

- Read a `PRISM` vertex table and extrude any polygon in one call
- Understand what the status codes `1` / `0` / `-1` do
- Know which problem `PRISM_`, `CPRISM_`, `BPRISM_`, `FPRISM_` and `SPRISM_` each solve
- Decide when PRISM is the right tool and when `BLOCK` or `CYLIND` is simpler

## The Idea in One Sentence

`BLOCK` only makes boxes and `CYLIND` only makes cylinders. When a column has to be L-shaped, T-shaped or hexagonal, use `PRISM`: **give it a list of plan vertices and it pulls them up along Z**.

## Syntax: Three Parts

```gdl
PRISM n, h, x1,y1,s1, x2,y2,s2, ..., xn,yn,sn
```

| Argument | Meaning |
|---|---|
| `n` | Number of vertices (≥3), must match the number of triples that follow |
| `h` | Extrusion height along +Z |
| `x`, `y` | Vertex position in the **current** x-y plane, in metres |
| `s` | Status code: `1` for the first point, `0` for intermediate, `-1` for the last |

Status codes are not decoration: Archicad reads `1 ... 0 ... -1` to find where the contour starts and closes. Missing the first or last code gives an error or broken geometry.

::: tip Walk the boundary once, in order
List the vertices around the outline and **never cross yourself**. A self-intersecting profile (like a figure eight) is rejected by Archicad and can produce scrambled faces in the sandbox.
:::

## Example 1: A Triangular Column

```gdl
PRISM 3, 1.5,
  0,   0,   1,
  1.2, 0,   0,
  0,   0.9, -1
```

Three vertices, three status codes, 1.5 m tall. The profile closes automatically — **do not repeat the first point**.

## Example 2: An L-shaped Column

An L needs six points, walked in order:

| # | x | y | Status | Where it is |
|---|---|---|---|---|
| 1 | 0 | 0 | `1` | Start (inner corner) |
| 2 | 0.6 | 0 | `0` | Along +X |
| 3 | 0.6 | 0.2 | `0` | Turn up |
| 4 | 0.2 | 0.2 | `0` | Back to the left |
| 5 | 0.2 | 0.6 | `0` | Up again |
| 6 | 0 | 0.6 | `-1` | Close |

```gdl
ADD 0, 0, 0
PRISM 6, 1.2,
  0,   0,   1,
  0.6, 0,   0,
  0.6, 0.2, 0,
  0.2, 0.2, 0,
  0.2, 0.6, 0,
  0,   0.6, -1
DEL 1
```

The `ADD 0, 0, 0` and `DEL 1` pair looks pointless, but it is a habit: in real code a PRISM usually sits beside other parts. Pin the datum first, and moving the part later means editing one `ADD` line.

## Example 3: One Profile, Several Heights

```gdl
x = 0
FOR i = 1 TO 2
  h = 0.4 + (i - 1) * 0.8
  ADD x, 0, 0
  PRISM 4, h,
    0,   0,   1,
    0.5, 0,   0,
    0.5, 0.3, 0,
    0,   0.3, -1
  DEL 1
  x = x + 0.8
NEXT i
```

Same profile, different `h` — two profiles from one table. That is the seed of a parametric object: **the vertex table owns the shape, variables own the size**.

## Sandbox Demo

The preset is a single L-shaped column: a six-vertex profile extruded to 0.9 m, with a small cylinder stacked on top and two colours from `MATERIAL`.

<GdlPlayground preset="prism" :height="440" />

Change the height in `PRISM 6, 0.9` to `2.0`, or change the y of the third vertex `1.0, 0.6` to `0.9`.

## PRISM_ and the Four Variants

All of them combine a contour with a height; what differs is **how the contour is supplied**:

| Command | Purpose | Contour source |
|---|---|---|
| `PRISM_` | Multiple contours, holes (e.g. a pierced slab) | One vertex table, split by status codes |
| `CPRISM_` | Prism with arc-cut end faces | Profile plus arc parameters |
| `BPRISM_` | Prism with controllable top/bottom faces | Profile plus end-face control |
| `FPRISM_` | Prism that follows a reference surface | Profile plus reference plane |
| `SPRISM_` | Vertical profile plus lateral profile | Two profiles |

::: warning Sandbox supports a single contour only
The sandbox treats `PRISM_` as a **single contour** (a single contour runs fine); extra contours and holes are ignored. Test hole behaviour in Archicad.
:::

`CPRISM_`, `BPRISM_`, `FPRISM_` and `SPRISM_` have many arguments and vary between versions. This chapter only asks you to remember *when to reach for them* — **take the exact signature from the Graphisoft GDL Reference**, never from memory.

## When Not to Use PRISM

Rectangles go to `BLOCK`, circles to `CYLIND`, angled extrusion to `EXTRUDE`, rotation to `REVOLVE` — PRISM owns exactly one case: **a flat, odd-shaped profile extruded straight up**.

## Common Pitfalls

::: warning Three frequent errors
1. **`n` does not match the vertex triples**: `PRISM 6` with only five points reports an argument-count error
2. **Every status code set to `0`**: without a leading `1` and trailing `-1`, Archicad cannot bound the contour
3. **Vertices crossed out of order**: the profile self-intersects, faces flip or the command fails
:::

## Exercises

1. Turn the L into a **T-shaped column** (8 vertices), 0.9 m tall, flange 0.6 wide, web 0.2 wide.
2. Use `FOR` to place three hexagonal columns 0.9 m apart, with heights 0.4 / 0.8 / 1.2.

::: details Answer 1: T-shaped column

```gdl
ADD 0, 0, 0
PRISM 8, 0.9,
  0,   0,   1,
  0.6, 0,   0,
  0.6, 0.2, 0,
  0.4, 0.2, 0,
  0.4, 0.5, 0,
  0.2, 0.5, 0,
  0.2, 0.2, 0,
  0,   0.2, -1
DEL 1
```

:::

::: details Answer 2: Three hexagonal columns

```gdl
FOR i = 1 TO 3
  h = 0.4 * i
  ADD (i - 1) * 0.9, 0, 0
  PRISM 6, h,
     0.35,  0.000,  1,
     0.175, 0.303,  0,
    -0.175, 0.303,  0,
    -0.35,  0.000,  0,
    -0.175, -0.303, 0,
     0.175, -0.303, -1
  DEL 1
NEXT i
```

:::

---

Next up: put the profile in motion with rotation and angled extrusion — [Chapter 7 Sweeps and Revolutions](/en/guide/part2-intermediate/07-sweeps-and-revolves).
