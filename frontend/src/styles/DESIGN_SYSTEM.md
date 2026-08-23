# AI Job Portal — Design System Contract

**Every page MUST follow this. Non-negotiable.**

## 0. Critical rule: Tailwind v4

This project uses **Tailwind CSS v4** via `@tailwindcss/vite`.

- There is **NO `tailwind.config.js`** — it was deleted because v4 ignores it.
- All design tokens live in `src/styles/globals.css` inside `@theme { }`.
- **NEVER write unlayered plain-CSS element selectors** (`h1 {}`, `p {}`, `* {}`,
  `input {}`) in any `.css` file. Unlayered CSS outranks **all** Tailwind
  utilities and will silently destroy the app's layout. This exact mistake is
  what broke the previous build. If you need a base style, put it inside
  `@layer base { }`.
- Prefer Tailwind utility classes in JSX over new `.css` files.

## 1. Color tokens (available as utilities)

| Token | Utility examples | Use for |
|---|---|---|
| `brand-50…950` | `bg-brand-600` `text-brand-700` | Primary actions, links, active nav |
| `accent-400…600` | `from-accent-500` | Gradient partner to brand |
| `success-*` | `text-success-600` | Match scores, matching skills, positive states |
| `warning-*` | `text-warning-600` | Missing skills, pending states |
| `danger-*` | `bg-danger-500` | Errors, destructive actions, unread badges |
| `slate-*` (built-in) | `text-slate-900` | All neutral text & surfaces |

## 2. Contrast rules — HARD REQUIREMENTS

Text must **never** be low-contrast against its background.

```
Light mode          Dark mode
─────────────────   ─────────────────────────
Page   bg-slate-50    dark:bg-slate-950
Card   bg-white       dark:bg-slate-900
Border border-slate-200  dark:border-slate-800
Head   text-slate-900   dark:text-slate-50
Body   text-slate-600   dark:text-slate-300
Muted  text-slate-500   dark:text-slate-400
```

- NEVER `text-white` / `text-slate-100` / `text-slate-200` on a light background.
- NEVER `text-slate-900` on a dark background without a `dark:` variant.
- Every `text-*` on a colored surface must be explicitly checked.
- For gradient headlines use the ready-made `.text-gradient-brand` class —
  hand-rolled `bg-clip-text` frequently renders invisible. Never apply
  `text-transparent` without a background-image on the same element.

## 3. Standard patterns — copy these verbatim

**Card**
```jsx
<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl
                dark:border-slate-800 dark:bg-slate-900">
```

**Input / select / textarea**
```jsx
<input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5
                  text-slate-900 shadow-sm transition
                  placeholder:text-slate-400
                  focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30
                  dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
```
Always pair with a visible label:
```jsx
<label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
```

**Primary button**
```jsx
<button className="inline-flex items-center justify-center gap-2 rounded-xl
                   bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white
                   shadow-sm transition-all hover:bg-brand-700 hover:shadow-md
                   active:scale-[0.98] disabled:opacity-50">
```

**Secondary button**
```jsx
<button className="inline-flex items-center justify-center gap-2 rounded-xl
                   border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold
                   text-slate-700 transition-all hover:bg-slate-50
                   dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
                   dark:hover:bg-slate-800">
```

**Badge**
```jsx
<span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1
                 text-xs font-semibold text-brand-700 ring-1 ring-brand-200
                 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
```

**Page shell** — every page starts with this
```jsx
<div className="min-h-screen bg-slate-50 dark:bg-slate-950">
  <Navbar />
  <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    …
  </main>
</div>
```

**Section heading**
```jsx
<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
```

## 4. Layout rules

- Vertical rhythm: `space-y-6` between sections, `gap-6` in grids.
- Grids: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` — never fixed pixel widths.
- Nav/toolbars: `flex items-center gap-6` — items must never touch.
- **No horizontal overflow.** Wide tables go in
  `<div className="overflow-x-auto">`. Never let `<body>` scroll sideways.
- Absolutely-positioned panels must not overlap content — prefer normal flow
  or a proper grid sidebar (`lg:grid-cols-[280px_1fr]`).

## 5. Icons

Lucide React only. `size={16|18|20}`. Always give an icon a gap from its
label (`gap-2`), never rely on raw margin collapse.

## 6. States — every data view needs all four

1. **Loading** — skeletons (`animate-pulse bg-slate-200 dark:bg-slate-800`), not a bare spinner.
2. **Empty** — icon + heading + one-line explanation + a CTA.
3. **Error** — readable message + retry affordance.
4. **Loaded** — the real content.

## 7. Data integrity

- Never invent GitHub / LeetCode / LinkedIn statistics. If a value is absent,
  show "Not connected" and a connect CTA.
- Never show a random match percentage — render only what the API returned.
