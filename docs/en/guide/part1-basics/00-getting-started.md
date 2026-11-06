---
title: Chapter 0 Getting to Know GDL
description: What GDL is, the six scripts inside a library part, the coordinate system, and where to start
---

# Chapter 0 Getting to Know GDL

> Sheet GDL-00 · Part 1 Basics · 12 min read

## Goals

- Explain what GDL is, what it can do, and why it is worth learning
- Understand the structure of a library part (.gsm): what each of the six scripts does
- Establish the first key idea: **in GDL, the Z axis points up**
- Know where to start in Archicad, and how the sandbox differs from the real thing

## What GDL Is

GDL (Geometric Description Language) is Graphisoft's parametric modelling language for Archicad. You describe an object in a few dozen lines of text, and Archicad generates its 3D model and plan symbol from your parameters.

The payoff is direct:

1. **Build your own parts** — doors, windows, furniture and components missing from the standard library
2. **Write once, reuse everywhere** — one parametric shelf becomes a hundred variants
3. **Join the BIM data flow** — objects carry quantities, materials and properties into schedules
4. **Understand Archicad's internals** — once you see how library parts work, many mysterious behaviours make sense

For architects, GDL is the shortest path from design intent to a reusable tool — far more direct than learning a general-purpose programming language.

## Six Scripts Inside a Library Part

A `.gsm` part is not one chunk of code; it is split into scripts, each with a job:

| Script | Runs when | Responsibility |
|---|---|---|
| Master Script | first, before all others | shared calculations, parameter pre-processing |
| Parameter Script | when parameters change | parameter coupling and value constraints |
| 2D Script | drawing the plan | plan symbol: lines, fills, text |
| 3D Script | in 3D views | the model itself |
| Properties Script | quantity take-off | components, surfaces, classification |
| UI Script | opening the settings dialog | custom parameter panel layout |

**Beginners only need the 3D and 2D scripts.** The other four are advanced topics covered later.

::: tip Execution order
Master → Parameter → 2D/3D. That is why shared variables belong in the master script: computed before everything else, available to both 2D and 3D.
:::

## First Key Idea: Z Points Up

GDL uses a **right-handed coordinate system with Z up**:

- **X / Y** form the horizontal plane (the two directions you see in plan)
- **Z** is height, positive upwards

Many 3D tools use Y-up, and Rhino/Grasshopper habits can mislead you here. **Every height goes into the third argument or the Z direction.**

The origin (0, 0, 0) is the insertion point in plan, and the starting point of every 3D script.

## Syntax in Five Rules

```gdl
! An exclamation mark starts a comment, to end of line

a = 1.2          ! variable: case-insensitive (A and a are the same)
BLOCK a, 2, 0.5  ! command: name followed by comma-separated arguments

! Units: metres for length, degrees for angles. 0.72 means 720 mm
```

1. Comments start with `!`
2. **One statement per line**; a newline ends the statement
3. Arguments are separated by **commas**; a trailing comma continues onto the next line
4. Commands and variables are **case-insensitive** (convention: commands UPPER, variables lower)
5. Lengths in **metres**, angles in **degrees**

## Sandbox vs. Real Archicad

The sandbox runs this site's own GDL interpreter, covering the teaching scope:

| Item | Sandbox | Archicad |
|---|---|---|
| 3D script | ✅ supported | ✅ |
| 2D script | ✅ supported (no PROJECT2 projection) | ✅ |
| Parameter panel | ❌ variables stand in | ✅ real parameters |
| Error format | ✅ Archicad-style (script + line/col + message) | ✅ official text |
| Render fidelity | teaching approximation | exact |

**Bottom line**: the sandbox trains syntax and thinking; final verification happens in Archicad. Code that runs here will usually paste straight into a 3D script window.

## Where to Start in Archicad

1. `File → Libraries and Objects → New Library Object` (or "New Object" in Library Manager)
2. Name it, choose the subtype (usually "Object")
3. The object editor opens: script list on the left, code editor on the right
4. Select `3D Script`, write code, use "Check Script" to see errors
5. `File → Save As` to produce a `.gsm`, or let it take effect in the library

Chapter 20 covers the toolchain (LP_XMLConverter, batch conversion). For now you only need the entry point.

## Common Pitfalls

::: warning Three beginner traps
1. **Height in the wrong argument**: `BLOCK 1, 2, 0.5` is a 1×2 footprint, 0.5 high. `BLOCK 1, 0.5, 2` is something else entirely.
2. **Wrong units**: writing `720` means 720 metres, not 720 mm — the object flies off into space.
3. **Assuming growth from the centre**: GDL primitives grow from **the current origin** along the positive axes.
:::

## Exercises

1. In one sentence, distinguish the master script from the 3D script.
2. Write the `BLOCK` command for a table 1.2 m × 0.6 m with height 0.72 m.
3. In the sandbox, change the height in `BLOCK 1, 1, 1` to 3 and watch the model.

## Self-check

- [ ] I can describe what each of the six scripts does
- [ ] I remember: Z up, metres, degrees
- [ ] I know how to write comments and separate statements
- [ ] I know how the sandbox differs from Archicad
- [ ] I have found the "new library object" command in Archicad

---

Next chapter: write your first real 3D object.
