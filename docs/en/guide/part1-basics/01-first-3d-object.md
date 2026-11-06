# Chapter 1 Your First 3D Object

> Sheet GDL-01 · Part 1 Basics · sandbox embedded — practice interactively in this chapter

In this chapter you will build a parametric stool with the four primitives `BLOCK`, `CYLIND`, `SPHERE`, `CONE` and the fixed parameters `A`, `B`, `ZZYZX`.

## Primitives at a Glance

```gdl
BLOCK 1, 2, 0.9      ! box: x length × y width × z height
CYLIND 1.2, 0.4      ! cylinder: height, base radius
SPHERE 0.5           ! sphere: radius
CONE 1.2, 0.5, 0     ! cone: height, base radius, top radius (0 = pointed)
```

::: warning Coordinate system
In GDL, X/Y is the horizontal plane and **Z points up** — just like Archicad; every primitive starts at the current origin.
:::

## Try It: Change the Code, Watch the Model

Hands on right now — in the sandbox below, change the table width `w = 1.2` to `2.0` and watch the table change; then try deleting a `DEL 1` line and see how the error report pinpoints the problem:

<GdlPlayground :height="420" />
