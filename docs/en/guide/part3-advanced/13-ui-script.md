---
title: "Chapter 13 UI Script and the Parameter Interface"
description: "Parameter list, parameter script and UI script working together to turn a pile of variables into a panel your colleagues dare to use"
---

# Chapter 13 UI Script and the Parameter Interface

> Sheet GDL-13 · Advanced · about 30 min read · includes a sandbox exercise

## Goals

- Tell apart the three layers: parameter list, parameter script and UI script
- Constrain values with `VALUES`, link them with `PARAMETERS`, tidy the interface with `LOCK` / `HIDEPARAMETER`
- Lay out a readable panel using `UI_DIALOG` + `UI_PAGE` + controls
- Know the sandbox boundary: script variables only, no parameter table and no dialog

## Three layers: variables → parameters → interface

| Layer | Defined in | Responsible for | Cost of getting it wrong |
|---|---|---|---|
| Parameter list | Library Part Editor → parameter table | names, types, defaults | the 3D script reads wrong values |
| Parameter script | Parameter Script page | ranges, links, visibility | users can type numbers that break the model |
| UI script | UI Script page | control placement and paging | everything works, nobody can find it |

In one line: **the parameter list is data, the parameter script is rules, the UI script is layout.**

The sandbox has no parameter table, so assignments such as `w = 1.2` sit at the top of the 3D script. Back in Archicad those lines become parameter defaults, and the script reads parameters instead of hard-coded numbers.

## The parameter list: get the names right first

| Column | Example | Note |
|---|---|---|
| Variable name | `w` | Used inside scripts; renaming touches every script |
| Descriptive name | Overall width | Shown in the dialog; use your local language here |
| Type | Length | Lengths follow project units — do not fake them with Real |
| Default value | 1.20 | Initial size when the object is placed |

Three habits:

1. Short English variable names (`w` / `d` / `h`) plus a full descriptive name keep both script and dialog readable
2. Choose `Length` for sizes so Archicad converts millimetres/metres for you; `Real` means you own the unit logic
3. Past ten parameters, add prefixes (`doorW` / `winW` / `mat`) so the UI layout stays manageable

## The parameter script: lock down the values

The parameter script runs before the settings dialog opens and again after any parameter change, so keep it light — validate and link, never build geometry here.

```gdl
! 参数脚本 / parameter script
VALUES "w" 0.6, 3.0, 0.05                  ! min, max, step
VALUES "n" 1, 6, 1                         ! integer step of 1
VALUES "doorType" "Single", "Double", "Sliding"   ! string candidates become a dropdown

IF w < 0.9 THEN
  VALUES "n" 1, 2, 1                       ! narrow cabinets allow 1~2 doors
ENDIF

PARAMETERS h = w * 0.75                    ! linked: h follows w, shown read-only
LOCK "h"                                   ! extra guard against editing
HIDEPARAMETER "n"                          ! internal parameter, hidden from the list
```

| Statement | Effect | What the user sees |
|---|---|---|
| `VALUES` | Restricts range or candidates | Spin limits, dropdowns for strings |
| `PARAMETERS x = ...` | Derived from other parameters | Recomputed every run, manual edits ignored |
| `LOCK` / `UNLOCK` | Lock / unlock | Greyed-out field |
| `HIDEPARAMETER` | Removes it from the list | Invisible, still usable by scripts |

Do not confuse `PARAMETERS` with `LOCK`: the first means "this value is computed by a formula and recalculated every run", the second means "the user may not edit this, but the script still can". Use `PARAMETERS` for formula-driven values and `LOCK` for "look, don't touch".

## The UI script: lay the parameters out

The UI Script page in the Library Part Editor draws a custom settings panel with commands. The structure has three levels — dialog → page → control — and **the whole script is one dialog**: there is no end statement and no way to open a second dialog in the same part.

```gdl
UI_DIALOG "Cabinet Settings"
  ! coordinates are pixels, origin at the top-left, y grows downwards
  UI_OUTFIELD "Width",  15, 40, 180, 20
  UI_INFIELD  "w",      200, 40, 105, 20
  UI_OUTFIELD "Height", 15, 70, 180, 20
  UI_INFIELD  "h",      200, 70, 105, 20
  UI_RADIOBUTTON "doorType", 0, "Single", 15, 110, 100, 20
  UI_RADIOBUTTON "doorType", 1, "Double", 15, 130, 100, 20
```

| Command | Argument order | Notes |
|---|---|---|
| `UI_DIALOG` | title | Only one allowed; the usable area is fixed at about 444 × 296 px, so size arguments change nothing |
| `UI_PAGE` | page number [, parent page, page title] | Controls belong to the nearest `UI_PAGE`; the title only shows with hierarchical tabs |
| `UI_OUTFIELD` | text, x, y [, width, height] | Display only, not bound to a parameter |
| `UI_INFIELD` | parameter name, x, y, width, height | Input field, writes straight back to the parameter |
| `UI_RADIOBUTTON` | parameter name, value, text, x, y, width, height | Buttons on the same parameter form one mutually exclusive group |

Three layout principles:

1. One page, one topic (size / doors / details) — tabs beat a long scroll
2. Label on the left, input on the right, aligned in two columns so the eye does not jump
3. Frequent parameters top-left of page one; rare ones (materials, pens) on the last page

Two blanks that trip people up: **there is no `UI_CHECKBOX` command** — a checkbox is the checkbox mode of `UI_INFIELD` (written `UI_INFIELD{3}` in the official examples; see the reference for the argument order); **there is no `UI_ENDDIALOG` / `UI_ENDPAGE`** — do not add closing tags out of habit from other languages.

The UI script only displays and writes back — it never models. `UI_INFIELD "w"` just binds a control to parameter `w`; the 3D script still draws the cabinet with `w`.

::: warning The sandbox does not support parameter tables or UI scripts
The sandbox only executes variables and geometry commands. `VALUES` / `PARAMETERS` / `UI_*` are unknown there. The code blocks in this chapter follow the official signatures but only run in the Library Part Editor; the fastest way to compare is to open a stock library part with a custom panel and read its UI script.
:::

## Sandbox demo: variables are a parameter table in embryo

This preset keeps every size at the top of the script; change one number and the whole table responds. That is exactly what a parameter table does — except in a real object those numbers are parameters: stored with the object, editable in a dialog, constrained by the parameter script.

<GdlPlayground preset="table" :height="440" />

| In the sandbox | In Archicad |
|---|---|
| `w = 1.2` sits at the top of the 3D script | `w` is a parameter with default 1.20 |
| Edit code to resize | Double-click the object and edit the dialog |
| No range checks — `w = 0` passes | `VALUES "w" 0.6, 3.0, 0.05` stops it |
| Everything is flat | The UI script paginates it |

## Common pitfalls

::: warning Three frequent mistakes
1. **Descriptive names inside scripts**: `BLOCK OverallWidth, d, h` fails — scripts only know variable names
2. **Unquoted strings in `VALUES`**: `VALUES "doorType" Single, Double` becomes two undefined variables
3. **Hiding a parameter the user must fill in**: a hidden parameter keeps its default forever
:::

## Exercises

1. Constrain the cabinet's `th` (board thickness) to 0.012 ~ 0.025 with a step of 0.001, and limit the shelf count `n` to 1~3 whenever the thickness exceeds 0.02.
2. Using the UI script structure, arrange the cabinet's five parameters on two pages: page one for `w` / `h`, page two for `d` / `th` / `n`.

::: details Answer 1
```gdl
VALUES "th" 0.012, 0.025, 0.001
IF th > 0.02 THEN
  VALUES "n" 1, 3, 1
ELSE
  VALUES "n" 1, 6, 1
ENDIF
```
Numbers inside `VALUES` carry no unit — the parameter type (`Length`) decides that.
:::

::: details Answer 2
```gdl
UI_DIALOG "Cabinet Settings"
UI_PAGE 1
  UI_OUTFIELD "Width", 10, 10, 70, 20
  UI_INFIELD  "w",    85, 10, 90, 20
  UI_OUTFIELD "Height", 10, 40, 70, 20
  UI_INFIELD  "h",    85, 40, 90, 20
UI_PAGE 2
  UI_OUTFIELD "Depth", 10, 10, 70, 20
  UI_INFIELD  "d",    85, 10, 90, 20
  UI_OUTFIELD "Thickness", 10, 40, 70, 20
  UI_INFIELD  "th",   85, 40, 90, 20
  UI_OUTFIELD "Shelves", 10, 70, 70, 20
  UI_INFIELD  "n",    85, 70, 90, 20
```
Page numbers start at 1, and every page starts again from its own top-left corner. The tab title is the third argument of `UI_PAGE` and only appears with hierarchical tabs.
:::

---

Next: [Chapter 14 Booleans, GROUP and Hotspots](/en/guide/part3-advanced/14-boolean-and-hotspots) — merge solids into one body, then give users something to grab.
