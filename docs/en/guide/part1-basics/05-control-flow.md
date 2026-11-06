---
title: Chapter 5 Control Flow
description: IF/FOR/WHILE/GOSUB — objects with logic and subroutines
---

# Chapter 5 Control Flow

> Sheet GDL-05 · Part 1 Basics · 25 min read · includes sandbox practice

## Goals

- Use `IF` in both block and single-line form
- Handle "repeat a known number of times" with `FOR` and "until a condition fails" with `WHILE`
- Package repeated code into subroutines with `GOSUB`
- Avoid infinite loops and leftover loop variables

## IF: Choose One of Two

Block form for multiple lines:

```gdl
IF h > 1.0 THEN
  BLOCK 1, 1, h
ELSE
  BLOCK 1, 1, 1.0
ENDIF
```

Single-line form for one action:

```gdl
IF legR > 0.05 THEN legR = 0.05
```

Conditions read like mathematics: `=` (equal), `<>` (not equal), `<`, `>`, `<=`, `>=`, combined with `AND` / `OR`.

::: warning Equality is `=`, not `==`
`IF a = 1 THEN` is correct. Writing `==` is a syntax error.
:::

## FOR: A Known Number of Repetitions

```gdl
FOR i = 1 TO 4
  ADD 0.3, 0, 0
  BLOCK 0.05, 0.05, 0.7
  DEL 1
NEXT i
```

Three notes:

1. The loop variable can be any name; `i` is conventional
2. `STEP` controls the increment: `FOR i = 10 TO 0 STEP -1` counts down
3. **The name after `NEXT` is optional**, but writing it improves clarity

::: tip The loop variable survives the loop
After `FOR i = 1 TO 4 ... NEXT i`, `i` equals **5** — the first value past the limit. Reassign it before further use.
:::

## WHILE: Keep Going While True

Use `WHILE` when the count is unknown:

```gdl
z = 0
WHILE z + 0.02 <= 1.8
  ADD 0, 0, z
  BLOCK 0.9, 0.3, 0.02
  DEL 1
  z = z + 0.4
ENDWHILE
```

**You must advance the condition variable yourself** (`z` here), otherwise it never ends. The sandbox has a 10 000-iteration fuse; real Archicad simply hangs — be careful.

## GOSUB: Subroutines

When an action repeats often ("draw one post"), package it:

```gdl
FOR i = 1 TO 7
  ADD (i - 1) * 0.5, 0, 0   ! move to where post i belongs
  GOSUB 100                 ! call: jump to label 100
  DEL 1                     ! back to the start for the next round
NEXT i
END                ! main program ends here (important!)

100:               ! label: subroutine entry
CYLIND 0.95, 0.02
RETURN             ! back to the caller
```

Four rules:

1. `GOSUB 100` jumps to label `100:`
2. A subroutine ends with `RETURN`, resuming after the call
3. **The main program must end with `END`**, otherwise execution falls into the subroutine and runs it again
4. Subroutines share global variables and may read and write them

The missing `END` is the classic slip. Without it the main program runs straight on into the subroutine and draws one extra copy of the geometry; only at `RETURN` do you get "RETURN without GOSUB". Extra geometry is far harder to trace than an error message.

## Try It: A Railing Array

The code below draws posts with `GOSUB`, arranges them with `FOR`, then adds a handrail. Change three things:

1. `n = 7` → `12`: posts get denser, spacing recomputed
2. `len = 3.0` → `6.0`: the railing lengthens
3. Delete the `END` line: an extra post appears and the `RETURN` line reports an error — the cost of forgetting it

<GdlPlayground preset="railing" :height="460" />

## Nesting: Loops Inside Loops

Four table legs are two nested loops:

```gdl
FOR i = 1 TO 2
  FOR j = 1 TO 2
    ADD (i - 1) * 1.0, (j - 1) * 0.5, 0
    BLOCK 0.05, 0.05, 0.7
    DEL 1
  NEXT j
NEXT i
```

**Inner and outer loop variables must differ**, or the outer count gets clobbered.

## Common Pitfalls

::: warning Five frequent errors
1. **Missing `ENDIF` / `NEXT` / `ENDWHILE`**: "not closed" errors, often reported at end of file
2. **Forgetting to advance the `WHILE` condition**: infinite loop
3. **Missing `RETURN` after `GOSUB`**: execution runs on and never returns
4. **Missing `END` in the main program**: the subroutine runs twice and geometry doubles
5. **Reusing a loop variable in nested loops**: scrambled results, painful to debug
:::

## Exercises

1. Use `IF` so that when `len > 5` the railing densifies: `n = len / 0.3` (hint: `INT`)
2. Draw a 10-step stair with `WHILE`: rise 0.17, going 0.28
3. Upgrade "draw one post" to "draw a post with a base plate" (a flat cylinder), still called by `GOSUB`

## Self-check

- [ ] I can write both block and single-line `IF`
- [ ] I know the loop variable's value after a `FOR` loop
- [ ] My `WHILE` loops always advance the condition
- [ ] My `GOSUB` has all three parts: label, `RETURN`, and `END` in the main program
- [ ] Nested loops use distinct variable names

---

That completes Part 1. Part 2 moves on to the PRISM family, sweeps, materials and macros — turning objects into real components.
