---
title: "Chapter 16 Data and Files"
description: "Store tabular data in arrays, assemble CSV lines from strings, and read or write external files with OPEN/INPUT/OUTPUT"
---

# Chapter 16 Data and Files

> Sheet GDL-16 · Advanced · about 30 min read · no sandbox demo (file access needs Archicad)

## Goals

- Declare arrays with `DIM`, index them from 1, and manage groups of related numbers
- Assemble arrays and strings into exportable lines of text
- Read and write text files with `OPEN` / `INPUT` / `OUTPUT` / `CLOSE`
- Know when `VARTYPE` saves you, and why archives need `FILE_DEPENDENCE`

## Arrays: put the data somewhere

GDL arrays must be declared before use, and indexing starts at **1**:

```gdl
DIM shelfH[8]          ! fixed length of 8
DIM rows[]             ! dynamic, grows on demand

shelfH[1] = 0.30
shelfH[2] = 0.35
shelfH[3] = 0.30

FOR i = 1 TO 3
  ADD 0, 0, shelfH[i]
  BLOCK 0.8, 0.3, 0.018
  DEL 1
NEXT i
```

| Form | Meaning | Note |
|---|---|---|
| `DIM a[10]` | fixed length | an index outside the declared range raises an error and stops the script |
| `DIM a[]` | dynamic length | grows on assignment, ideal for file input; bounds are not checked |
| `a[i]` | element i | 1-based, not 0 |
| `DIM m[4][3]` | two-dimensional | two dimensions maximum |
| `VARDIM1(a)` / `VARDIM2(a)` | array length | use it to get the real element count after reading a file |

Fixed-length arrays are bounds-checked, so a bad index fails immediately; dynamic arrays leave bounds to you, where an overflow reads whatever memory holds and may not complain. After the read loop, `VARDIM1(codeArr)` is the true row count — do not guess it from anything else.

The classic use is "turn a table into geometry": storey heights, door mullions, a hardware list. **Data in the array, geometry in the loop** — changing data never touches code.

## Strings: build one line

Chapter 11 covered `STR`; three more facts matter for export:

```gdl
line = "PANEL" + "," + STR (w, 8, 3) + "," + STR (h, 8, 3)
```

| Need | Write | Trap |
|---|---|---|
| number to text | `STR (x, 8, 3)` | the 2nd and 3rd arguments are total width and decimals — too narrow gives `****` |
| concatenation | `+` | both sides must be strings; wrap numbers in `STR` |
| substring / search | `STRSUB`, `STRSTR` | also 1-based |

The most common export bug is a too-narrow `STR`: `STR(1234.5, 4, 1)` yields `****`, not `1235`. **Go wide, never narrow.**

## File access: the four commands

GDL does not touch disks itself — file access comes from an **Add-On**. For text files that is the official GDL Text I/O Add-On, and the `filter` argument is `"TEXT"`.

| Command | Form | Returns |
|---|---|---|
| `OPEN` | `OPEN (filter, filename, paramString)` | positive = channel, `-1` missing file, `-2` missing Add-On |
| `INPUT` | `INPUT (channel, recordID, fieldID, var1, ...)` | number of values read, `-1` at end of file |
| `OUTPUT` | `OUTPUT channel, recordID, fieldID, expr1, ...` | nothing |
| `CLOSE` | `CLOSE channel` | nothing |

`recordID` / `fieldID` are interpreted by the Add-On. Three `paramString` keys matter most:

- `mode = ro` read-only, `wo` write (truncates the file first), `wa` append. **There is no `rw`** — open twice if you need both directions
- `SEPARATOR = ','` sets the field separator
- `LIBRARY` resolves the path relative to the library part

In the text Add-On, `INPUT`'s `recordID` is the line number and `fieldID` the field within that line, both 1-based; `OUTPUT` ignores the values themselves and **only watches whether they change** — a new `recordID` starts a new line. That is why exports number rows 1, 2, 3: purely for human readability.

```gdl
! read a 3-column CSV: code,width,height
ch = OPEN ("TEXT", "cabinet.csv", "SEPARATOR = ',', mode = ro, LIBRARY")
IF ch > 0 THEN
  n = 0
  WHILE INPUT (ch, n + 1, 1, code, cw, chh) > 0
    n = n + 1
    codeArr[n] = code
    wArr[n] = cw
    hArr[n] = chh
  ENDWHILE
  CLOSE ch
ELSE
  n = 0
ENDIF
```

Four steps: `OPEN` and check the return value → loop `INPUT` until `-1` → store into dynamic arrays → `CLOSE`. **Always test `OPEN > 0`**, otherwise every later `INPUT` talks to a channel that does not exist.

Export the other way round with `mode = wo` (create or overwrite):

```gdl
ch = OPEN ("TEXT", "schedule.csv", "SEPARATOR = ',', mode = wo, LIBRARY")
IF ch > 0 THEN
  OUTPUT ch, 1, 1, "CODE", "WIDTH", "HEIGHT"
  FOR i = 1 TO n
    OUTPUT ch, i + 1, 1, codeArr[i], STR (wArr[i], 8, 3), STR (hArr[i], 8, 3)
  NEXT i
  CLOSE ch
ENDIF
```

`CLOSE` flushes the buffer to disk. If the object dies midway the file is usually truncated, so close as soon as the export loop ends.

::: warning The sandbox supports neither arrays nor files
The engine implements only the geometry and flow commands the chapters need. `DIM`, `OPEN`, `INPUT` and `OUTPUT` are not among them, so this chapter has no interactive demo. Do the exercises in the Library Part Editor and use Check Script to inspect return values.
:::

## Archiving: do not forget FILE_DEPENDENCE

After an object reads an external file, that path only exists on your machine. To place the object in a `.pla` or send it to a colleague, declare the dependency so Archicad packs the file along:

```gdl
FILE_DEPENDENCE "cabinet.csv"
```

The symptom when you forget: everything works locally, every other machine silently falls back to defaults.

## VARTYPE: the safety net when reading

Values coming from `INPUT` take their type from the file, so a field may be numeric or text:

| `VARTYPE` returns | Type | Use |
|---|---|---|
| 1 | number | arithmetic |
| 2 | string | concatenation, comparison |
| 3 | group | boolean results |
| 4 | dictionary | key/value data |

Test with `IF VARTYPE (v) = 2 THEN` before converting. GDL will not catch a type mismatch at compile time — only at runtime.

## Common pitfalls

::: warning Three frequent mistakes
1. **Indexing from 0**: `a[0]` fails outright on a fixed array and returns noise on a dynamic one
2. **Ignoring the `OPEN` return value**: `-1` becomes the channel and everything after fails quietly
3. **A too-narrow `STR`**: numbers export as `****` and the whole table is unusable
:::

## Exercises

1. Store five shelf spacings (0.3 / 0.32 / 0.35 / 0.32 / 0.3) in an array and generate the shelves in a loop.
2. Export the five shelves' index and spacing into `shelf.csv`, one row each.

::: details Answer 1
```gdl
DIM sh[5]
sh[1] = 0.30
sh[2] = 0.32
sh[3] = 0.35
sh[4] = 0.32
sh[5] = 0.30

z = 0.018                       ! start on top of the bottom panel
FOR i = 1 TO 5
  ADD 0, 0, z
  BLOCK 0.8, 0.3, 0.018
  DEL 1
  z = z + sh[i]                 ! accumulate the next position
NEXT i
```
`z` is the accumulator: the array stores spacings, positions are derived.
:::

::: details Answer 2
```gdl
ch = OPEN ("TEXT", "shelf.csv", "SEPARATOR = ',', mode = wo, LIBRARY")
IF ch > 0 THEN
  OUTPUT ch, 1, 1, "INDEX", "HEIGHT"
  FOR i = 1 TO 5
    OUTPUT ch, i + 1, 1, STR (i, 2, 0), STR (sh[i], 8, 3)
  NEXT i
  CLOSE ch
ENDIF
```
Write the header first, number rows from 1 so they line up with the array index on the way back in.
:::

---

Next: [Chapter 17 Toolchain and Version Migration](/en/guide/part3-advanced/17-toolchain-and-migration) — GSM files, LP_XMLConverter, upgrade checklists and team workflow.
