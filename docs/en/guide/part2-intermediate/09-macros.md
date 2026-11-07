---
title: Chapter 9 Macros and Object Structure
description: Splitting objects into macros, the CALL and PARAMETERS idea, plus naming and debugging order
---

# Chapter 9 Macros and Object Structure

> Sheet GDL-09 · Intermediate · ~20 min · Sandbox included

## Goals

- Explain the real difference between a macro and `GOSUB`
- Know what `CALL "name"` and `PARAMETERS` each do
- Split objects by the rule "one macro, one job"
- Follow a naming and debugging order that locates faults in the main object or a child macro

## What Macros Solve

A macro is an **independent library part**: it has its own parameters, 3D script and 2D script. It can be called by a main object, or reused by other objects.

| Problem | Everything in one script | Split into macros |
|---|---|---|
| Door leaves and handles repeat | Copy-paste; fix one, miss three | Edit the child macro once, all calls update |
| Scripts grow long | Hundreds of lines, hard to navigate | The main object only assembles |
| Another object needs the same part | Copy it again | Reuse it with `CALL` |
| Test a part in isolation | Only the whole object runs | A child macro can be opened alone |

## CALL and PARAMETERS

The entry point is `CALL "macro name"`, written `CALL "macro name" PARAMETERS parameterName = value`. The main object and macro do not share variables; data goes in explicitly.

1. Parameter names must match the macro definition; a typo is not corrected for you
2. A macro draws at its own origin and in its own coordinate system — position it with `ADD` before the call
3. A macro has its own script context; the main object's variables are not automatically visible

::: warning Syntax details belong to the official manual
The definition block, parameter declarations and the full `PARAMETERS` form vary by Archicad version and object type. This chapter covers the calling idea and file organisation only; it does not reproduce unverified definition syntax. Check the Macro chapter of the official GDL Reference before you build one.
:::

### CALL Is Not GOSUB

| | `GOSUB` | `CALL` |
|---|---|---|
| Scope | Jump inside the same script file | Call another library part |
| Data | Shared global variables | Passed explicitly with `PARAMETERS` |
| Separate scripts | None; it is just a code section | Has its own 2D / 3D scripts |
| Sandbox | Supported | Not supported |

## Example 1: A Main Object Calling a Child Macro (Not Runnable)

```gdl
! NOT RUNNABLE: real Archicad syntax; the sandbox does not support CALL
FOR i = 1 TO 2
  ADD (i - 1) * 0.42, 0, 0
  CALL "PRJ_Cabinet_Door" PARAMETERS doorWidth = 0.4, doorHeight = 0.7
  DEL 1
NEXT i
```

::: warning The sandbox reports an unknown command
The sandbox does not recognise `CALL`. The snippet above only explains the calling structure — do not paste it into the sandbox. Use the `GOSUB` version in the next section for practice.
:::

## Example 2: Reuse with GOSUB (Runnable)

Package "draw one cabinet door" into a subroutine and call it twice:

```gdl
! Two identical doors: GOSUB reuses "draw one door"
dw = 0.4
dh = 0.7
FOR i = 1 TO 2
  ADD (i - 1) * (dw + 0.02), 0, 0
  GOSUB 200
  DEL 1
NEXT i
END

200:
MATERIAL 3
BLOCK dw, 0.02, dh
ADD dw - 0.06, -0.03, dh / 2
MATERIAL 5
SPHERE 0.02
DEL 1
RETURN
```

`dw` and `dh` are shared variables — implicit parameters. A macro passes parameters explicitly, so this is a **teaching analogy, not an equivalent**: only `GOSUB` runs in the sandbox.

## File Organisation

A typical door/window object splits like this:

| Part | Responsibility | Should not do |
|---|---|---|
| Main object 3D script | Read parameters, compute overall size, call children, assemble | Contain large blocks of repeated geometry |
| Child macro: leaf | Draw the leaf only | Change main-object parameters |
| Child macro: handle | Draw the handle only | Assume an installation position |
| 2D script / symbol | Plan representation | Drift away from the 3D size |

### Naming

- Pattern: `Project_Category_Part`, e.g. `PRJ_Cabinet_Door`
- Letters, digits and underscores only; no spaces or non-ASCII file names
- One macro, one job; `_v2` and `_test` are temporary only — clean them before delivery

### Debugging Order

1. Open the child macro alone; confirm it draws correctly by itself
2. Check its parameter defaults; do not rely on the caller passing the right values by luck
3. Return to the main object and add one `CALL` at a time
4. Hard-code parameter values (such as `0.4`, `0.7`) to isolate geometry faults
5. Reconnect the parameter panel last, changing one value at a time

## Try It: Reuse in the Railing

The sandbox railing pulls "draw one post" into a `GOSUB`; the main loop only positions and arranges:

<GdlPlayground preset="railing" :height="460" />

Change three things to feel the reuse:

1. `n = 7` → `12`: more posts, subroutine unchanged
2. `len = 3.0` → `6.0`: longer span, spacing recomputed
3. Add a flat cylindrical base inside the subroutine: every post gains it at once

This is `GOSUB`, not a macro: a macro can be reused across files, `GOSUB` only within the current script.

## Common Pitfalls

::: warning Three frequent errors
1. **Trying `CALL` in the sandbox**: it reports an unknown command; practise the structure with `GOSUB` and verify real calls in Archicad
2. **Expecting a macro to see main-object variables**: a macro has its own context; pass what is needed through `PARAMETERS`, or you get defaults or errors
3. **One macro doing everything**: leaf, handle, glass and hardware in one macro is no split at all
:::

## Exercises

**Exercise 1**: Use two `GOSUB` labels to simulate a "leaf macro" and a "handle macro", drawing two doors.

::: details Answer
The main program only positions and calls; each subroutine owns one job:

```gdl
FOR i = 1 TO 2
  ADD (i - 1) * 0.42, 0, 0
  GOSUB 500
  GOSUB 600
  DEL 1
NEXT i
END

500:
BLOCK 0.4, 0.02, 0.7
RETURN

600:
ADD 0.34, -0.03, 0.35
SPHERE 0.02
DEL 1
RETURN
```

The `ADD` inside the handle subroutine must be matched by its own `DEL`, or the offset leaks back.
:::

**Exercise 2**: When you receive a new object, how do you decide which parts deserve a macro? Give three criteria.

::: details Answer
1. **Repetition**: the same geometry appears twice or more, or another object needs it
2. **Testable in isolation**: the part can be opened and judged on its own (leaf, handle, glass)
3. **Clean parameter boundary**: at most five inputs, with no hidden variables from the main object

All three — split it. Repetition alone with tangled parameters means clean up the interface first.
:::

---

Next: [Chapter 10 Doors and Windows](/en/guide/part2-intermediate/10-doors-and-windows) — combine parameters, 3D script, 2D symbol and wall opening into one complete object.
