---
title: Chapter 7 Sweeps and Revolutions
description: REVOLVE around an axis, EXTRUDE along any vector, and where RULED / SWEEP / TUBE fit
---

# Chapter 7 Sweeps and Revolutions

> Sheet GDL-07 · Intermediate · ~20 min · Sandbox included

## Goals

- Turn a profile into a solid with `REVOLVE` around the X axis
- Extrude in any direction with `EXTRUDE` and know what `mask` does
- Tell PRISM, EXTRUDE and REVOLVE apart and pick the right one
- Recognise what `RULED` / `SWEEP` / `TUBE` are for and when to switch to them

## Three Ways to Build a Solid

PRISM only grows straight up. Real components often lean or turn:

| Method | How the profile moves | Typical parts |
|---|---|---|
| `PRISM` | Straight along +Z | Shaped columns, profiles |
| `EXTRUDE` | Along any vector | Braces, canopies, ramps |
| `REVOLVE` | Around the X axis | Vases, capitals, rings |

One line to remember: **PRISM fixes a direction, EXTRUDE fixes a vector, REVOLVE fixes an axis.**

## REVOLVE: Spin the Profile

```gdl
REVOLVE n, alpha, mask, x1,y1,s1, x2,y2,s2, ..., xn,yn,sn
```

| Argument | Meaning |
|---|---|
| `n` | Number of vertices, matching the triples that follow |
| `alpha` | Rotation angle in degrees, never 0; `360` is a full turn |
| `mask` | Bit mask selecting which faces are built (ignored in the sandbox) |
| `x`, `y` | Profile vertices **in the x-y plane** |
| `s` | Status code, same rules as PRISM: `1` / `0` / `-1` |

The crucial point: **`y` is the radius**, and it must be ≥ 0. `y = 0` puts the vertex on the axis and the solid closes there; `y = 0.3` puts it 0.3 m out. `x` is the position along the axis.

A negative `y` or `alpha = 0` is an error. In the sandbox, an `alpha` below 360 gets caps at both ends.

::: tip The axis starts horizontal
REVOLVE turns around the **X axis**, so the result naturally lies along X. To get an upright column or vase, `ROT 0, 90, 0` first to stand the axis up, then `DEL 1` when done.
:::

## Example 1: A Cylinder

A rectangular profile revolved once gives a cylinder:

```gdl
ROT 0, 90, 0
REVOLVE 4, 360, 0,
  0,    0.00, 1,
  0,    0.30, 0,
  1.00, 0.30, 0,
  1.00, 0.00, -1
DEL 1
```

Four points: start on the axis, out to a 0.3 radius, along 1 m at that radius, back to the axis. With `alpha = 360` the surface closes on itself and needs no caps.

## Example 2: A Vase (Multi-segment Profile)

Split the radius by height (0.12 → 0.16 → 0.16 → 0.10 → 0) to get a base, a belly and a neck:

```gdl
MATERIAL 6
ROT 0, 90, 0
REVOLVE 6, 360, 0,
  0.00, 0.00, 1,
  0.00, 0.12, 0,
  0.06, 0.16, 0,
  0.22, 0.16, 0,
  0.30, 0.10, 0,
  0.30, 0.00, -1
DEL 1
```

Both ends sit at `y = 0` so the solid closes; the intermediate points with `y > 0` create the wall.

## EXTRUDE: Push Along Any Vector

```gdl
EXTRUDE n, dx, dy, dz, mask, x1,y1,s1, x2,y2,s2, ..., xn,yn,sn
```

| Argument | Meaning |
|---|---|
| `n` | Number of vertices |
| `dx`, `dy`, `dz` | Extrusion vector; it sets both length and direction |
| `mask` | Bit mask controlling end faces and side faces (ignored in the sandbox) |
| `x`, `y`, `s` | Profile vertices and status codes, same rules as PRISM |

Two hard rules: **a zero vector is an error** (`dx = dy = dz = 0` encloses no volume); **mask bit meanings belong to the official manual**, and the sandbox always builds every face, so differences are invisible there.

## Example 3: A Slanted Canopy

```gdl
MATERIAL 3
EXTRUDE 4, 1.0, 0, 0.45, 0,
  0,   0,   1,
  1.2, 0,   0,
  1.2, 0.6, 0,
  0,   0.6, -1
```

The profile is a plain 1.2 × 0.6 rectangle, but the extrusion vector carries `dz = 0.45`, so the slab rises as it runs forward. PRISM could only give you a flat slab — that is the essential difference.

## Sandbox Demo

Compare the two presets: how a solid is spun from a profile, and how angled extrusion differs from a straight column. Change `REVOLVE 6, 360` to `180` and watch the end caps appear.

<GdlPlayground preset="revolve" :height="440" />

<GdlPlayground preset="extrude" :height="440" />

Set `0.45` in `EXTRUDE 4, 1.0, 0, 0.45` to `0` and the canopy flattens instantly.

## RULED / SWEEP / TUBE

| Command | What it does | How it differs from EXTRUDE / REVOLVE |
|---|---|---|
| `RULED` | Surfaces between two different profiles | The two ends may differ; EXTRUDE moves one profile unchanged |
| `SWEEP` | Drags a profile along a path | The path can curve; REVOLVE only turns around a straight axis |
| `TUBE` | A circular section along a path | Purpose-built for pipes and bends, no profile needed |

Choosing order: straight push `PRISM` → angled push `EXTRUDE` → around an axis `REVOLVE` → profile changes `RULED` → curved path `SWEEP` / `TUBE`.

::: warning Not supported in the sandbox, and do not guess the arguments
`RULED` / `SWEEP` / `TUBE` are not implemented in the sandbox, take many arguments and vary between versions, so this chapter gives no signatures. When you need them, read the Graphisoft GDL Reference — do not paste forum snippets.
:::

## Common Pitfalls

::: warning Three frequent errors
1. **A negative `y` in `REVOLVE`**: `y` is a radius, not a coordinate; negative values fail
2. **`alpha = 0` or a zero extrusion vector**: nothing is swept, and you get a runtime error
3. **Forgetting to stand the axis up**: REVOLVE turns around X by default, so the part lies on its side without `ROT`
:::

## Exercises

1. Build a 270° curved backrest with `REVOLVE`: inner radius 0.25, outer radius 0.45, width 0.8.
2. Build a 45° brace with `EXTRUDE`: a 0.1 × 0.1 section running 0.8 along both X and Z.

::: details Answer 1: 270° curved backrest

```gdl
ROT 0, 90, 0
REVOLVE 4, 270, 0,
  0,    0.25, 1,
  0,    0.45, 0,
  0.80, 0.45, 0,
  0.80, 0.25, -1
DEL 1
```

:::

::: details Answer 2: 45° brace

```gdl
EXTRUDE 4, 0.8, 0, 0.8, 0,
  0,   0,   1,
  0.1, 0,   0,
  0.1, 0.1, 0,
  0,   0.1, -1
```

:::

---

Next comes materials and attributes: making the same geometry read as concrete, glass or timber — [Chapter 8 Materials and Attributes](/en/guide/part2-intermediate/08-materials).
