# Glossary

Chinese GDL material often uses several names for one concept: some call a hotspot 「热点」, others 「热区」; some call a library part 「图库对象」 while the official term is 「图库部件」. When you cannot find a term in the manual, the problem is usually the name, not your understanding.

This table covers only the **genuinely confusable** terms, with the official English name and a one-line explanation.

## How to use it

- Search in Chinese or English — 「热区」, "hotspot" and "gsm" all work
- Grouped by purpose: objects & library, scripts & execution, geometry & coordinates, parameters & UI, attributes & materials, toolchain & delivery
- The "Related chapter" link jumps straight to the tutorial that explains the concept

<GlossaryTable locale="en" />

## Three pairs people mix up

| Confusing pair | Difference |
|---|---|
| Material / Building Material | The first is a rendering surface colour attribute; the second carries thickness and construction data for walls and composites |
| Hotspot / 热点 | The same thing (HOTSPOT2); 「热点」 is an older Chinese rendering, official Chinese uses 「热区」 |
| Master Script / Parameter Script | The master script passes parameters and does upfront work; the parameter script runs only when parameter values change |

::: tip Single bilingual data source
Term data lives in `reference/data/glossary.json` with both languages in one record, shared by the Chinese and English pages — update data only, never pages.
:::

::: warning When translations disagree, follow the English
If two textbooks disagree, trust the official English term and check it here. Command, parameter and variable names always stay in English — never translate them.
:::
