# Chapter 0 Getting to Know GDL

> Sheet GDL-00 · Part 1 Basics · content under construction (full text lands in Phase P2)

In this chapter: what GDL is, how a library part is structured, what the six scripts do, and where to write your first object in Archicad.

## What is GDL

GDL (Geometric Description Language) is Graphisoft's parametric programming language. It describes 3D objects — doors, windows, furniture, stairs — and their 2D symbols on the floor plan. Writing GDL means having the power to manufacture parts for Archicad.

## The Six Scripts of a Library Part

| Script | Role |
|---|---|
| Master Script | runs before every other script, holds shared calculations |
| 3D Script | generates the 3D model |
| 2D Script | draws the plan symbol (falls back to binary 2D data if empty) |
| Parameter Script | constrains and links parameter values |
| Properties Script | components and descriptors for quantity takeoff |
| UI Script | custom parameter settings page |

::: tip Under construction
Phase P2 will add: a diagram of script execution order, the full walkthrough of creating a library part in Archicad, and the first minimal example.
:::
