---
title: Chapter 3 Introduction to Parametrics
description: Parameters, variables and condition-driven geometry
---

# Chapter 3 Introduction to Parametrics

> Sheet GDL-03 · Part 1 Basics · 25 min read · includes sandbox practice

## Goals

- Tell **parameters** (user-editable in Archicad) from **variables** (computed in script)
- Use the built-in parameters `A`, `B`, `ZZYZX`
- Use `IF` so geometry adapts to dimensions
- Build your first object that reshapes itself when one number changes

## Parameters vs. Variables

They look and behave the same inside a script; the difference is **who changes them**:

| | Parameter | Variable |
|---|---|---|
| Defined by | the object settings dialog | an assignment in the script |
| Changed by | the user, per placed object | the script itself |
| Persisted | stored in the .gsm | recomputed every run |
| Typical use | width, depth, height, material | intermediate results, loop counters |

**Key point**: a parameter *is* a variable name in the script. Use it directly; there is nothing to declare or read.

## The Three Built-in Parameters

Every new Archicad object comes with three:

| Parameter | Meaning |
|---|---|
| `A` | width (X) |
| `B` | depth (Y) |
| `ZZYZX` | height (Z, objects and lamps only) |

So the smallest useful parametric object is:

```gdl
BLOCK A, B, ZZYZX
```

Change width/depth/height in the settings dialog and the model follows. **That is your first parametric object** — one line.

::: tip Sandbox substitute
The sandbox has no settings dialog, so use **variables** instead: write `A = 1.2`, `B = 0.6`, `ZZYZX = 0.72` at the top. When pasting back into Archicad, delete those lines — the parameters already carry values there.
:::

## Custom Parameters

Beyond A/B/ZZYZX you can add any parameter. For a bookcase:

| Name | Type | Default | Meaning |
|---|---|---|---|
| `shelfW` | Length | 0.9 | case width |
| `shelfD` | Length | 0.3 | case depth |
| `shelfH` | Length | 1.8 | case height |
| `boardT` | Length | 0.02 | board thickness |
| `spacing` | Length | 0.4 | shelf spacing |

In Archicad: `Object Settings → Parameters → New`, type "Length". Then use these names directly in scripts.

## Letting Structure Follow Parameters

Parametrics is not only "dimensions change" but "structure changes". For the bookcase, the number of shelves follows height and spacing, and a partial shelf at the top should not be forced in:

```gdl
z = 0
WHILE z + boardT <= shelfH
  ADD 0, 0, z
  BLOCK shelfW, shelfD, boardT
  DEL 1
  z = z + spacing
ENDWHILE
```

The `WHILE` condition *is* "does another shelf fit?" — **shelf count follows height automatically**. Change `shelfH` from 1.8 to 2.4 and the case grows from 4 shelves to 6.

An `IF` example: single door below 0.6 m width, double door above.

```gdl
IF A < 0.6 THEN
  doorW = A
  BLOCK doorW, B, 0.04
ELSE
  doorW = A / 2
  BLOCK doorW, B, 0.04
  ADD doorW, 0, 0
  BLOCK doorW, B, 0.04
  DEL 1
ENDIF
```

## Try It: A Parametric Bookcase

The sandbox holds a complete bookcase: two side panels, automatic shelves, top board. Change these four numbers:

- `h = 1.8` → `2.4`: more shelves appear
- `spacing = 0.4` → `0.25`: shelves get denser
- `w = 0.9` → `1.4`: everything widens, side panels follow
- `th = 0.02` → `0.05`: boards thicken; note the `z + th` test still governs placement

<GdlPlayground preset="bookcase" :height="480" />

## Three Rules for Parameter Design

1. **Expose only what users genuinely adjust**: width, depth, height, count, material. Keep computed values as variables, not parameters
2. **Provide defaults and ranges**: constrain them in the parameter script (`VALUES "shelfH" RANGE [0.6, 2.4]`), covered in Chapter 13
3. **Let parameters interact, but never contradict**: board thickness greater than shelf spacing produces clashing geometry

## Common Pitfalls

::: warning Four typical problems
1. **Assigning to a parameter inside the 3D script**: it overwrites the user's value permanently
2. **A parameter name colliding with a command name**: calling a parameter `BLOCK` breaks the script
3. **Re-applying units**: length parameters are already in metres — do not divide by 1000 again
4. **Changing dimensions without changing structure**: only possible with `IF`, otherwise you get slivers or overlaps
:::

## Exercises

1. Add a "back panel switch": use `IF backPanel = 1 THEN ... ENDIF`
2. Make leg count follow table width: one pair of legs per 0.6 m (hint: compute the `FOR` upper bound with an expression)
3. Make the bookcase turn into a low cabinet when height is below 1.0 m: one shelf plus the top board only

## Self-check

- [ ] I can explain parameter versus variable
- [ ] I use `A` / `B` / `ZZYZX` correctly
- [ ] I can create a custom parameter in Archicad
- [ ] I use `IF`/`WHILE` so structure follows parameters
- [ ] In the sandbox, changing height changes the shelf count

---

Next chapter switches viewpoint: from 3D to the 2D script that draws the plan symbol.
