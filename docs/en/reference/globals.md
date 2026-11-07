# GLOB Variables

Names starting with `GLOB_` are globals Archicad supplies while a script runs: current storey height, drawing scale, element ID. All are read-only except `GLOB_USER_*`.

## How to use them

- Names are fixed and upper-case; a typo does not error, it just returns 0
- Lengths are always in millimetres, regardless of project units
- `GLOB_SCALE` is the denominator: 1:50 gives 50, not 0.02
- GDL has no boolean type; `YES`/`NO` switches are integers 1/0
- Readable from 2D, 3D and parameter scripts; the parameter script usually pairs it with `GLOB_MODPAR_NAME`

<GlobTable />

## Similar names that are not GLOB

These are "general library part parameters" with their own chapter — do not mix them up with `GLOB_`:

| Variable | Meaning |
|---|---|
| `SYMB_POS_X` / `SYMB_POS_Y` / `SYMB_POS_Z` | Symbol position relative to the insertion point |
| `SYMB_ROTANGLE` | Symbol rotation angle |
| `SYMB_MIRRORED` | Whether the symbol is mirrored |
| `WALL_THICKNESS` | Host wall thickness (doors and windows) |
| `WIDO_SILL` | Sill height (doors and windows) |
| `PARAMETERS` | Parameter name → value map, read as `PARAMETERS.name` |

## Common myths

| Claim | Reality |
|---|---|
| `GLOB_STORY_NR`, `GLOB_MSTORIES` | Do not exist. Use `APPLICATION_QUERY` with `StoryInfo` |
| `GLOB_UNIT`, `GLOB_PAPER_SIZE` | Do not exist. Lengths are millimetres; paper info is not part of GDL |
| `GLOB_DATE`, `GLOB_TIME` | Do not exist. Only `GLOB_PROJECT_DATE`, written by EcoDesigner |
| `GLOB_CONTEXT` | Exists but deprecated; use `GLOB_VIEW_TYPE` + `GLOB_PREVIEW_MODE` |
| `GLOB_WALL_THICKNESS` | Wrong prefix; the variable is `WALL_THICKNESS` |

::: tip Single source, bilingual
The list lives in `reference/data/globals.json` with both languages in one record; the two pages read the same file, so edits never touch the pages.
:::

::: warning The sandbox has no GLOB
The sandbox does not emulate an Archicad project, so every `GLOB_*` returns 0. To see real values, print them with a 2D text in Archicad.
:::
