---
title: Chapter 10 Doors and Windows
description: Door and window parameters, 3D script, 2D symbol, wall opening and subcontexts, with plan-symbol examples
---

# Chapter 10 Doors and Windows

> Sheet GDL-10 · Intermediate · ~20 min · Sandbox included

## Goals

- Name the parts that make up a door or window object
- Know the rough roles of `A`, `B` and `ZZYZX` in door/window templates
- Draw door and window plan symbols that follow drafting convention
- Understand that wall openings must be verified in Archicad; the sandbox has no host wall

## Doors and Windows Are Not Furniture

Furniture is a free-standing solid. A door or window must **sit inside a wall** and cut an opening in it. That adds four requirements:

| Requirement | Meaning |
|---|---|
| Adapt to wall thickness | Change to a thicker wall and the frame plus opening must follow |
| Cut automatically | Once inserted, the wall must not stay solid |
| Drafting-compliant symbol | A door needs a leaf and swing arc; a window needs a frame and glazing lines |
| Replaceable sub-parts | Leaf, handle and glass can change without rebuilding the object |

## Object Composition

| Part | Purpose | Edited in |
|---|---|---|
| Parameter panel | Width, height, wall thickness, handing, materials | Object settings |
| 3D script | Frame, leaf, glass, hardware | 3D script page |
| 2D script | Plan symbol | 2D script page |
| Wall opening (wallhole) | Defines the contour cut from the host wall | Opening component / opening script |
| Subcontext | Splits leaf, frame and handle into separately replaceable parts | Sub-part editing |

### About A, B and ZZYZX

| Parameter | Typical meaning in a door/window template | Note |
|---|---|---|
| `A` | Nominal opening width | Both the 2D symbol and the opening should derive from it |
| `B` | Nominal opening height | Base for leaf or sash height |
| `ZZYZX` | Depth-direction parameter, often wall thickness | Meaning varies by template; trust the parameter panel |

::: warning An opening is not a negative BLOCK
The wall opening is a contour defined by the object's opening component/script, which Archicad then cuts from the host wall. It is not "a BLOCK with negative size". Opening commands and parameter signatures vary by version and template, so this chapter gives no unverified syntax — check the Wallhole section of the official manual.
:::

### Design Order

1. Fix parameters: opening width `A`, height `B`, wall thickness
2. Draw the 3D body: frame → leaf → glass → hardware
3. Define the opening contour, matching the parameter-driven size
4. Draw the 2D symbol: opening lines, leaf, swing arc, label
5. Split subcontexts and assign materials
6. Insert into a real wall and verify: cutting, handing, wall-thickness changes

## Example 1: Single-Leaf Door Plan Symbol (Runnable)

The wall runs along X, thickness `t` along Y, the opening goes from `x = 0` to `x = w`, and the hinge is on the left:

```gdl
w = 0.9         ! opening width
t = 0.24        ! wall thickness
leaf = 0.045    ! leaf thickness

! Wall stubs on both sides
RECT2 -0.6, 0, 0, t
RECT2 w, 0, w + 0.6, t

! Opening lines (inner faces of the reveals)
LINE2 0, 0, 0, t
LINE2 w, 0, w, t

! Leaf: hinged left, opened 90 degrees
RECT2 0, t, leaf, t + w

! Swing arc: centre at the hinge, radius equals opening width
ARC2 0, t, w, 0, 90

! Label
TEXT2 -0.55, t + 0.1, "M900"
```

The stubs show the wall stopping, `LINE2` marks the reveals, `RECT2` is the open leaf, `ARC2` is the swing. All four together tell a reader which way the door opens and how far.

## Example 2: Single Window Plan Symbol (Runnable)

A window loses the swing arc and gains a frame and glazing lines:

```gdl
w = 1.2
t = 0.24

! Wall stubs and opening lines
RECT2 -0.5, 0, 0, t
RECT2 w, 0, w + 0.5, t
LINE2 0, 0, 0, t
LINE2 w, 0, w, t

! Frame: inset 60 mm from the opening
RECT2 0.06, 0.06, w - 0.06, t - 0.06

! Glazing: a double line at mid wall thickness
LINE2 0.06, t / 2 - 0.015, w - 0.06, t / 2 - 0.015
LINE2 0.06, t / 2 + 0.015, w - 0.06, t / 2 + 0.015

TEXT2 -0.45, t + 0.1, "C1200"
```

The point is the three-layer relationship "opening + frame + glazing", all derived from `w` and `t`, so parameter changes cannot shift the symbol.

## Try It: Door and Window Plan Symbols

The sandbox `plan` preset is a table plan symbol. Clear the editor and paste the whole of Example 1 into it to see a door symbol. Change two things:

<GdlPlayground preset="plan" :height="460" />

1. `w = 0.9` → `1.2`: opening, leaf and arc all grow
2. `t = 0.24` → `0.12`: the stubs and frame become thinner

The sandbox has no host wall, so you are checking the **symbol**, not the opening.

## Common Pitfalls

::: warning Three frequent errors
1. **Treating an opening as furniture**: a 3D body with no opening definition leaves the wall solid after insertion
2. **Hard-coding the 2D symbol**: `RECT2 0, 0, 0.9, 0.24` breaks when `A` or the wall thickness changes; derive every coordinate from `w` and `t`
3. **Testing openings in the sandbox**: it has no host wall, no cutting and no wall-thickness following; verify in Archicad
:::

## Exercises

**Exercise 1**: Turn Example 1 into a double door with opening width `w = 1.5`, each leaf taking half.

::: details Answer
Each leaf gets its own arc; the right hinge is at `x = w`:

```gdl
w = 1.5
t = 0.24
leaf = 0.045
half = w / 2

RECT2 -0.6, 0, 0, t
RECT2 w, 0, w + 0.6, t
LINE2 0, 0, 0, t
LINE2 w, 0, w, t

! Left leaf
RECT2 0, t, leaf, t + half
ARC2 0, t, half, 0, 90

! Right leaf
RECT2 w - leaf, t, w, t + half
ARC2 w, t, half, 90, 180

TEXT2 -0.55, t + 0.1, "M1500"
```

Write the right arc as `90, 180` to get the 90-degree quarter circle. Writing `180, 90` is computed as 270 degrees and draws three quarters instead.
:::

**Exercise 2**: Add a vertical mullion to the window in Example 2, splitting the glazing into two panes.

::: details Answer
After the glazing lines, add one vertical line at the centre of the opening:

```gdl
! append after the glazing lines in Example 2
LINE2 w / 2, 0.06, w / 2, t - 0.06
```

Full order: wall stubs → opening lines → frame → two glazing lines → mullion → label. The mullion runs from frame inner edge to inner edge, never into the wall stub.
:::

---

Next: [Chapter 11 Text and Strings](/en/guide/part2-intermediate/11-text-and-strings) — output text correctly in plan symbols and parameter prompts.
