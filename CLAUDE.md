# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm i` — install dependencies.
- `npm run dev` — start the Vite dev server.
- `npm run build` — production build with `vite build`.

There is no test runner, linter, formatter, or typecheck script configured. There is no `tsconfig.json` checked in, so TypeScript is compiled by Vite/esbuild without a formal type-check step — expect `.tsx`/`.ts` errors to surface only at build/runtime.

## Origin

This is a Figma Make export of the TOCATO design (Figma file `M0ZSyZrHPaV4m4uCJrl8Fc`). Two Figma-specific conventions carry over and must be preserved when editing:

1. `vite.config.ts` registers a `figmaAssetResolver` plugin that rewrites imports of the form `figma:asset/<filename>` to `src/assets/<filename>`. Do not remove it — existing exports rely on it.
2. The Vite config comments explicitly forbid removing the `react()` or `tailwindcss()` plugins even if they look unused at a glance (Figma Make requires both).
3. `src/app/components/figma/ImageWithFallback.tsx` is a Figma-provided component; treat it as vendor code.

## Architecture

React 18 + Vite 6 + Tailwind v4 SPA. Entry flow:

`index.html` → `src/main.tsx` → wraps `<App />` in MUI `CssVarsProvider` with `appTheme` and `defaultMode="system"` → `src/app/App.tsx` renders `RouterProvider` with the router from `src/app/routes.tsx` → routes mount `Layout` (Header + `<Outlet />` + Footer) with pages under `src/app/pages/`.

Today there is a single route: `/` renders `Home`, which composes the marketing sections `Hero`, `Categories`, `HowItWorks`, `Trust`, `CallToAction`. Add new routes to `routes.tsx`; add new pages under `src/app/pages/`.

### The dual design system (important)

The codebase runs two theming systems in parallel, and they do not share tokens:

- **MUI CSS Vars** — configured in `src/app/theme.ts` via `extendTheme({ cssVarPrefix: "mui", ... })`. These emit variables like `--mui-palette-background-default`, `--mui-palette-text-primary`, `--mui-palette-divider`. The `ColorModeToggle` flips MUI's mode via `useColorScheme()`.
- **shadcn/ui tokens** — defined in `src/styles/theme.css` (`--background`, `--foreground`, `--primary`, `--muted`, `--radius`, etc.) and exposed to Tailwind v4 via an `@theme inline` block. A `.dark` variant is declared with `@custom-variant dark (&:is(.dark *));`, but nothing in the app currently adds or removes the `.dark` class, so shadcn dark-mode styles will not activate from the MUI toggle alone.

The marketing components (`Hero`, `Categories`, etc.) largely use raw Tailwind colors (`bg-blue-600`, `text-slate-900`) rather than either token system, while the shadcn primitives under `src/app/components/ui/` consume shadcn tokens. `docs/design-review.md` documents this tension in detail and is the best reference before making cross-cutting theme changes.

### Styling pipeline

- Tailwind v4 is loaded via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. The content glob lives inside `src/styles/tailwind.css`: `@source '../**/*.{js,ts,jsx,tsx}';` Anything outside `src/` will not be scanned.
- `src/styles/index.css` is the single root stylesheet and imports `fonts.css`, `tailwind.css`, `theme.css` in that order.
- `default_shadcn_theme.css` at the repo root carries a `KEEP_IN_SYNC` comment pointing at Figma's internal `fullscreen/resources/figmake/shadcn/globals.css`. Treat it as a read-only reference copy of upstream shadcn defaults — don't import it, and if you update `src/styles/theme.css`, don't silently drift from it without a reason.
- Class merging uses the `cn()` helper at `src/app/components/ui/utils.ts` (clsx + tailwind-merge).

### Paths and aliases

- `@` is aliased to `src` (`vite.config.ts`).
- Raw imports are enabled for `.svg` and `.csv` only — do not add `.css`, `.ts`, or `.tsx` to `assetsInclude` (called out in a comment in `vite.config.ts`).

### UI copy

The product is French. User-facing strings, `aria-label`s, and alt text should be in French unless there's a specific reason otherwise.

## Other notes

- `guidelines/Guidelines.md` is currently the Figma Make template placeholder — no real rules yet. If the user asks about "project guidelines," don't treat the template comments as binding.
- `docs/design-review.md` (April 2026) is a thorough design/a11y audit of the landing page. Use it as the source of truth for known design debt; don't re-diagnose issues it already catalogs.
- `pnpm-workspace.yaml` exists and declares a single-package workspace (`.`), but `package-lock.json` is committed and the README instructs `npm i`, so npm is the actual package manager in use.
