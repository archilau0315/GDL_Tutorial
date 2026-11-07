---
title: Chapter 11 Text and Strings
description: Plan annotations with TEXT2, the rules of strings, and how 2D text differs from parameter labels
---

# Chapter 11 Text and Strings

> Sheet GDL-11 · Intermediate · ~20 min · Sandbox included

## Goals

- Write plan annotations with `TEXT2 x, y, "text"`
- Apply the three hard rules of strings: double quotes, literal text (Chinese included), quote escaping
- Tell "2D text" and "parameter label" apart by where each one appears
- Know what `STR` / `STRLEN` / splitting and concatenation are for — and the sandbox's limits

## Concept: Two Kinds of "Text"

Both are called text, but they live in different places:

| Aspect | 2D text `TEXT2` | Parameter label |
|---|---|---|
| Belongs to | 2D script / plan symbol | Object parameters (width `w`, depth `d`…) |
| Appears in | Plan, drawings, printouts | Object settings dialog, schedules |
| Who produces it | A text entity drawn by GDL | Archicad, reading the parameter definitions |
| Affects geometry | No — annotation only | No — it is data |
| Typical use | Codes, dimensions, room names | Parameter help, schedule columns |

In one line: **the words you see on the plan are drawn by `TEXT2`; the words in the settings dialog are shown by Archicad from the parameter definitions.** Neither replaces the other.

### Three rules for strings

1. **Double quotes are mandatory**: `"CABINET"` is a string; `CABINET` is read as a variable name
2. **Chinese, spaces and symbols go in directly**: `"Cabinet 1200 x 600"` needs no escaping
3. **A quote inside a string is written twice**: `""` means one double quote (the sandbox follows the GDL convention)

::: tip TEXT2 takes only three arguments in the sandbox
`TEXT2 x, y, "text"`: the first two are 2D coordinates in metres, the third is the string. The sandbox anchors text at its left baseline; text height and justification are separate settings in Archicad and must be verified locally.
:::

## Step 1: Minimal Text

```gdl
! 只有文字，没有几何 / text only
TEXT2 0, 0, "CABINET"
TEXT2 0, -0.12, "1200 x 600"
TEXT2 0.02, 0.10, "中文标注也可以"
```

After running, the 3D viewport stays empty and three lines appear in the 2D viewport. That is the point: **`TEXT2` belongs to the 2D script and creates no model geometry.**

## Step 2: Dimension a Plan

```gdl
! 2D 标注：轮廓 + 尺寸线 + 文字
w = 1.20
d = 0.60

RECT2 0, 0, w, d

! 下方尺寸线：主线 + 两端竖短线
LINE2 0, -0.12, w, -0.12
LINE2 0, -0.16, 0, -0.08
LINE2 w, -0.16, w, -0.08

! 文字位置可以用变量算，内容必须是字面量
TEXT2 w / 2 - 0.15, -0.28, "1200"
TEXT2 0.02, d + 0.08, "PLAN 1:50"
TEXT2 0.02, d / 2, "柜体 / CABINET"
```

Three things to notice:

- `RECT2` takes two opposite corners; `LINE2` takes two endpoints — all in metres
- The text *position* follows `w` / `d`; the text *content* does not
- Change `w` to `2.40` and the outline plus dimension line grow, but `"1200"` still says 1200 — the price of having no string concatenation

## Sandbox: The plan Preset

The `plan` preset combines outline, circles, fill and text — a good reference for this chapter:

- The left viewport is empty (a pure 2D script has no model)
- The right viewport shows a `RECT2` desktop, `CIRCLE2` leg positions and a `POLY2_` fill
- The last line, `TEXT2 0.05, 0.62, "1.2 x 0.6"`, is the dimension annotation

<GdlPlayground preset="plan" :height="460" />

Try three changes:

1. Replace the text with `"DESK 1200"` and watch the right viewport
2. Move a `TEXT2` to `0.5, -0.2` and see it leave the outline
3. Append `LINE2 0, 0.7, 1.2, 0.7` as a leader line

## String Functions: Know the Purpose

String handling is common in real objects: codes like `"CAB-001"`, specs like `"1200x600x750"`, or splitting a parameter by a delimiter. GDL offers these capabilities, but they are **not in the sandbox whitelist**:

| Need | GDL capability | Typical use | Sandbox |
|---|---|---|---|
| Number to text | the `STR` family | Build a code from the width | ✗ |
| String length | the `STRLEN` family | Validate a code's digit count | ✗ |
| Split by delimiter | the `SPLIT` family | Split `"1200x600x750"` | ✗ |
| Concatenate | string joining | Build a spec label | ✗ |

::: warning The sandbox does not support string functions
This chapter deliberately omits the exact argument order of these functions — it differs between versions, and a wrong signature misleads more than none. **Look them up in the Archicad GDL reference and test locally** when you need them; in the sandbox, write text as literals.
:::

## Common Pitfalls

::: warning Three frequent errors
1. **Missing double quotes**: `TEXT2 0, 0, CABINET` treats `CABINET` as a variable and reports "undefined variable"
2. **Trying to join with `+`**: `"W" + w` is numeric addition in the sandbox and reports "not a number"; joining needs string functions, which the sandbox lacks
3. **Mistaking `TEXT2` for a parameter label**: labels live in object settings and schedules; `TEXT2` only draws on the plan, and changing a parameter never rewrites the text
:::

## Exercises

1. Annotate a 1.2 × 0.6 cabinet plan with three labels — name on top, overall width below, overall depth on the right — and add end ticks to both dimension lines.
2. Use `ADD2` + `ROT2` to place one `"H"` in each of the four directions, and observe how text positions follow the transform stack.

::: details Answer 1
```gdl
w = 1.20
d = 0.60

RECT2 0, 0, w, d

! 下方总宽
LINE2 0, -0.12, w, -0.12
LINE2 0, -0.16, 0, -0.08
LINE2 w, -0.16, w, -0.08

! 右侧总深
LINE2 w + 0.12, 0, w + 0.12, d
LINE2 w + 0.08, 0, w + 0.16, 0
LINE2 w + 0.08, d, w + 0.16, d

TEXT2 0.02, d + 0.08, "BASE CABINET"
TEXT2 w / 2 - 0.15, -0.28, "1200"
TEXT2 w + 0.20, d / 2, "600"
```
:::

::: details Answer 2
```gdl
FOR i = 1 TO 4
  ADD2 0.60, 0.30     ! move to the centre
  ROT2 i * 90         ! turn 90° each round
  TEXT2 0.35, 0, "H"
  DEL2 2
NEXT i
```
Like geometry, text obeys the 2D transform stack, so the four `"H"` marks land above, left, below and right. Note that the sandbox moves text positions but does not rotate glyphs; text angle behaviour in Archicad must be verified locally.
:::

---

Next: [Chapter 12 Practice: A Parametric Cabinet](/en/guide/part2-intermediate/12-practice-furniture) — attach this chapter's annotations to a complete cabinet.
