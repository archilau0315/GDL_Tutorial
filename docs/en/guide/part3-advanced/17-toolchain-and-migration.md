---
title: "Chapter 17 Toolchain and Version Migration"
description: "GSM versus XML, a checklist for upgrading Archicad, team conventions and a performance budget"
---

# Chapter 17 Toolchain and Version Migration

> Sheet GDL-17 · Advanced · about 25 min read · process chapter (no sandbox)

## Goals

- Know what each script page in the Library Part Editor is responsible for, and how to use Check Script
- Use `LP_XMLConverter` to turn a GSM into XML that git can diff
- Apply a checklist when moving objects to a new Archicad version
- Set up naming, versioning, release and rollback conventions for a team

## The seven places in the editor

| Place | Purpose | Cost of getting it wrong |
|---|---|---|
| Parameter table | names, types, defaults | scripts read the wrong values |
| Master script | call order of the other scripts | 3D and 2D never run |
| 3D script | solid geometry | empty 3D view |
| 2D script | plan symbol | only a hotspot in plan |
| Parameter script | ranges and links | users can break the model |
| UI script | custom settings panel | works, but nobody finds it |
| Property/additional scripts | property export, special tools | schedules and labels come up empty |

Run **Check Script** right after every edit: it validates syntax and parameters without generating geometry, which beats hunting for errors in the 3D window.

## GSM and XML: make objects reviewable

`.gsm` is a binary container — git sees *that* it changed, never *what* changed. Graphisoft ships `LP_XMLConverter` for a round trip:

```bash
# GSM -> XML (readable, diffable, reviewable)
LP_XMLConverter libpart2xml cabinet.gsm ./src/cabinet

# XML -> GSM (package again after editing)
LP_XMLConverter xml2libpart ./src/cabinet cabinet.gsm
```

| Approach | Pro | Con |
|---|---|---|
| Store GSM only | simple, ready for Archicad | no review, conflicts cannot be merged |
| Store XML + packaged output | visible changes, branches, precise rollback | one extra conversion step |

Team rule: **XML in git, GSM as a release artifact** (`dist/` stays out of the repository). Every change to a parameter name, a script or the UI shows up line by line in a pull request.

## Upgrade checklist

A major Archicad upgrade does not fix library parts automatically. Walk this list in order:

1. **Open the object and read the warnings**: the editor lists deprecated commands and parameter conflicts
2. **Run the parameter script first**: it executes before everything else, and its errors poison the whole dialog
3. **Audit global variables**: check that view- and project-dependent `GLOB_*` are not in the wrong script
4. **Run Check Script on all four scripts**, not just 3D
5. **Verify across views**: plan at 1:100 and 1:50, section, 3D, schedule
6. **Regenerate the 2D symbol**: plan representation is the easiest thing to miss
7. **Publish once**: schedule fields are the first casualty of renamed properties

::: warning Three silent migration killers
1. **Attribute indices move**: material and fill numbers can be reordered between versions — look up by name, not number
2. **Defaults get overwritten**: migration may reset parameter defaults; back up before you migrate
3. **Mixing the UI script with the old parameter interface**: never ship both, users will see two competing layouts
:::

## Team conventions

| Item | Recommendation | Why |
|---|---|---|
| Naming | `KB_Cabinet_1200`: company prefix + type + main size | filterable in the library list |
| Version | a `verMajor` / `verMinor` parameter printed in the 2D symbol corner | tells on site which build is in use |
| Prefixes | `door_` / `win_` / `mat_` | stays readable past twenty parameters |
| Before change | tag every release against an XML snapshot | precise rollback |
| Ownership | whoever changes it runs the checklist | no "works on my machine" |

## Performance budget

The same object written two ways can differ by an order of magnitude in opening speed. Empirical ceilings:

| Item | Suggested limit | If exceeded |
|---|---|---|
| Boolean operations | ≤ 5 per object | fake it with blocks or use `PRISM_` |
| Bodies in loops | ≤ 200 | use simplified geometry at distance |
| `PRISM_` vertices | ≤ 100 points per segment | split segments or lower arc resolution |
| 2D text items | ≤ 50 | merge into one multi-line text |

The principle: **whatever MVO can skip, skip**. A handle is not needed in a 1:200 plan.

## Common pitfalls

::: warning Three frequent mistakes
1. **Editing the GSM but not the XML source**: the next conversion overwrites your work
2. **Skipping Check Script after an upgrade**: syntax passes while parameters silently shift — the hardest bug to find
3. **Hard-coding material indices**: they change between projects and versions; resolve by name
:::

## Exercises

1. Export an existing object to XML, commit it, rename one parameter, convert back, and confirm the diff is a single line.
2. Rename your three most-used objects with the convention above and add version parameters to each.

::: details Answer 1
```bash
LP_XMLConverter libpart2xml old.gsm ./src/old
git add ./src/old
git commit -m "chore: import XML source of old"
# after renaming the parameter
LP_XMLConverter xml2libpart ./src/old old_v2.gsm
```
`git diff` should show one `<Name>` or `<Parameter>` line. If the whole file changed, converter versions or encodings differ — align the tool version before committing.
:::

::: details Answer 2
```
KB_Desk_1400   verMajor = 1  verMinor = 0
KB_Door_Single verMajor = 2  verMinor = 1
KB_Window_0900 verMajor = 1  verMinor = 3
```
Version parameters never touch geometry; print them in the 2D symbol corner with `TEXT2` so people can verify builds on site.
:::

---

Next: [Chapter 18 Final Project: Delivering a Door Object](/en/guide/part3-advanced/18-final-project) — everything from eighteen chapters combined into one object you can hand over.
