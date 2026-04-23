# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This repo hosts two apps side-by-side:

```
/            ← web prototype (Vite + React 18 + MUI + shadcn). Kept as a visual reference for the mobile port.
/mobile      ← active Expo app (SDK 54 + expo-router + NativeWind + react-native-reusables). iPhone-first, also targets web.
```

The Figma Make export at the repo root is **no longer the active development target** — treat it as frozen reference material. New feature work belongs in `mobile/`.

## Commands

**Mobile (primary, in `mobile/`)**

- `cd mobile && npm install` — install deps.
- `cd mobile && npx expo start` — start the Metro dev server. Press `w` for web, or scan the QR with the **Expo Go** app on a physical iPhone (Xcode Simulator is not an option on Windows).
- `cd mobile && npx expo start --web` — web target only.
- `cd mobile && npx expo-doctor` — validate project config against Expo/RN compat rules.
- `cd mobile && npx @react-native-reusables/cli@latest add <component>` — add an RNR primitive (writes to `mobile/components/ui/`).
- `cd mobile && npx @react-native-reusables/cli@latest doctor` — validate RNR setup (theme, tokens, styling library).
- `cd mobile && npx expo export --platform web` — production web build (also the fastest non-UI smoke test: if it bundles, NativeWind + TypeScript + aliases are healthy).

**Web prototype (legacy, at repo root)**

- `npm i` / `npm run dev` / `npm run build` — Vite.

There is no test runner, linter beyond `eslint-config-expo`, or Prettier configured in either project. Type-checking happens implicitly at bundle time.

## Mobile architecture (`mobile/`)

**Stack**: Expo SDK 54, expo-router v6 (file-based routing), React 19, React Native 0.81, NativeWind v4 (Tailwind v3 under the hood — v4 is **not** supported by NativeWind yet), react-native-reusables (shadcn-for-RN port).

**Why SDK 54 and not 55**: SDK 55 is not yet compatible with the public Expo Go app on the App Store. Since the dev loop on Windows relies on Expo Go on a physical iPhone, we pinned SDK 54. Do not bump to 55 until Expo confirms Expo Go compatibility (verify via https://docs.expo.dev/llms-full.txt).

**Routing**: `mobile/app/_layout.tsx` is the root Stack with `SafeAreaProvider`, `StatusBar`, and the `<PortalHost />` required by RNR's Dropdown/Popover/Tooltip primitives. File-based routing means new routes are new files under `mobile/app/`. `expo-router` docs: https://docs.expo.dev/router/introduction/.

**Styling pipeline**:
- `mobile/global.css` — Tailwind directives + CSS custom properties for shadcn-style tokens (`--background`, `--primary`, etc.). Imported once in `app/_layout.tsx`.
- `mobile/tailwind.config.js` — uses `nativewind/preset`; maps CSS vars to Tailwind color tokens; registers `tailwindcss-animate`.
- `mobile/metro.config.js` — wraps the Expo Metro config with `withNativeWind({ input: './global.css', inlineRem: 16 })`. The `inlineRem: 16` is **required** by react-native-reusables.
- `mobile/babel.config.js` — `babel-preset-expo` with `{ jsxImportSource: 'nativewind' }` plus the `nativewind/babel` preset.
- `mobile/nativewind-env.d.ts` — makes NativeWind's TypeScript types visible (the `className` prop on RN elements).
- `mobile/lib/theme.ts` — exports `THEME` (JS object) and `NAV_THEME` (for `@react-navigation/native`'s `ThemeProvider`). Must be kept in sync with the CSS vars in `global.css`.
- `mobile/lib/utils.ts` — the standard `cn()` helper (clsx + tailwind-merge).
- `mobile/components.json` — shadcn CLI config used by the RNR `add` command. Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`.

**Design tokens**: primary is the TOCATO brand blue (`hsl(221 83% 53%)` light / `hsl(217 91% 60%)` dark). When adjusting colors, update **both** `global.css` **and** `lib/theme.ts` — they are not auto-synced.

**Path alias**: `@/*` → `./*` (repo-root of `mobile/`). Configured in `tsconfig.json`.

**Adding components**: always prefer `npx @react-native-reusables/cli@latest add <name>` over hand-writing — it pulls the current upstream version. After adding, run the RNR `doctor` to confirm nothing is missing.

**Icons**: use `lucide-react-native` (not `lucide-react`, which is DOM-only).

**Images**: use `expo-image`'s `<Image>` (faster + better caching than RN's built-in).

**Hero smoke test**: `mobile/app/index.tsx` is a ported-down version of the web `Hero` section. It proves the NativeWind + RNR pipeline works end-to-end (image, gradient overlay, typography, button, pressable cards, lucide icons).

## External references

- **Expo docs (LLM-friendly)**: `https://docs.expo.dev/llms-full.txt` — full Expo documentation in a single plain-text file. WebFetch when making non-trivial Expo changes; Expo changes quickly and recall gets stale.
- **NativeWind docs**: `https://www.nativewind.dev/docs/getting-started/installation` — authoritative for Metro/Babel/Tailwind wiring.
- **react-native-reusables docs**: `https://reactnativereusables.com/docs` (and `https://github.com/founded-labs/react-native-reusables` for source).
- **Expo Router docs**: `https://docs.expo.dev/router/introduction/` — file-based routing conventions, layouts, modal patterns.

## Web prototype reference (`/src`, legacy)

The original Figma Make export. Keep it runnable but do not add features. It is the **design source of truth** for color, copy, and layout intent while we rebuild for mobile.

- Stack: Vite 6, React 18, MUI `CssVarsProvider`, shadcn/ui components under `src/app/components/ui/`, Tailwind v4 via `@tailwindcss/vite` (note: different Tailwind major than `mobile/`).
- Entry: `src/main.tsx` → MUI provider → `App.tsx` → `RouterProvider` (react-router v7) → `Layout` (Header/Outlet/Footer) → `src/app/pages/Home.tsx` composing `Hero`, `Categories`, `HowItWorks`, `Trust`, `CallToAction`.
- Dual theming tension (MUI vars vs shadcn vars never unified) is cataloged in `docs/design-review.md` — do not re-diagnose.
- Figma-Make-specific: `vite.config.ts` has a `figmaAssetResolver` plugin for `figma:asset/*` imports; both `react()` and `tailwindcss()` Vite plugins are required even when they look unused.
- UI copy is French.

## Other notes

- `guidelines/Guidelines.md` is the Figma Make template placeholder — not binding.
- `default_shadcn_theme.css` at the root is a frozen upstream-shadcn reference (`KEEP_IN_SYNC` comment). Don't import it; don't silently drift from it.
- Git identity on this repo's commits is currently `tristan-dev1 <2534117@etu.cchic.ca>` (school email) even though the user's GitHub account is `tristan-devos`. Existing commits were left as-is.
