# TOCATO — Design Review & Polish

**Reviewed:** Landing page (`/` route) — Home.tsx composing Hero, Categories, HowItWorks, Trust, CallToAction, Header, Footer
**Stage:** Prototype exported from Figma
**Review scope:** Design critique · Accessibility (WCAG 2.1 AA) · Design system · UX copy
**Date:** 22 April 2026

---

## Overall Impression

TOCATO is a clean, confident landing page for a French peer-to-peer services marketplace (furniture assembly, cleaning, moving, gardening). The visual language is familiar and trustworthy — hero with search, categories, how-it-works, social proof, provider CTA. It reads like a well-known pattern done competently.

The biggest opportunity is not the visuals — it's the **theming foundation**. The codebase has two parallel design systems fighting each other: shadcn/ui's CSS variable tokens (`--primary`, `--foreground`, `--muted`, all defined in `theme.css`) and Material-UI's `CssVarsProvider` with hard-coded Tailwind color classes (`bg-blue-600`, `text-slate-500`) baked into every component. The dark-mode toggle exists but won't actually re-theme the marketing sections because nothing in those sections reads from a theme token. That's the single most leveraged fix.

Secondary opportunities cluster around **accessibility** (search is not a form, mobile menu button lacks aria attributes, all footer links go to `/`) and **copy** (one English alt text in a French site, the classic "En savoir plus" ambiguity twice).

### What works well

- Information architecture follows the conversion-first landing-page convention users already know.
- Typography hierarchy is clean: one dominant H1 in Hero, supportive H2s per section, consistent body sizing.
- Trust section pairs imagery + rating badge + feature list effectively — this is the strongest section.
- Animations are tasteful (staggered reveals on scroll, not distracting).
- French copy is warm and natural ("Fait avec passion en France" is a nice touch).

---

## 1. Design Critique

### Usability

| # | Finding | Severity | Recommendation |
|---|---------|----------|----------------|
| U1 | Two search inputs on the same page (Hero + Header) with different placeholders but identical function. Users can't tell if they do different things. | 🟡 Moderate | Keep the Hero search as the primary. Hide/shrink the Header search on the landing page, or collapse it into an icon-only trigger. |
| U2 | Hero search isn't a `<form>` — pressing Enter in the input does nothing. On desktop the submit button is visible; on mobile (`hidden sm:block`) the button disappears entirely and there is no submit affordance at all. | 🔴 Critical | Wrap in `<form onSubmit>`, keep the button visible (or replace with an icon-only submit) on mobile. |
| U3 | "Voir tous les services" appears twice — once inline on desktop, once as a full-width button on mobile. The desktop version is a right-aligned tertiary link that's easy to miss. | 🟢 Minor | Consider a single pattern (full-width link/button below the grid) that works at all breakpoints. |
| U4 | Category cards are visually interactive (`cursor-pointer`, hover scale) but aren't real links/buttons — they're `<motion.div>`s with no `onClick`, `href`, or keyboard access. | 🔴 Critical | Wrap each card in `<a>` or `<button>` with the appropriate role and tabindex. |
| U5 | Mobile menu icon in Header has no drawer/sheet behind it — tapping it does nothing. | 🟡 Moderate | Wire it to a `Sheet` (the `ui/sheet.tsx` is already present) or explicitly remove it until built. |
| U6 | All CTA buttons on the page (Hero "Rechercher", Quick Actions, CTA "Devenir prestataire", Trust "En savoir plus sur nos garanties") are dead ends — no `onClick`, no `href`. Clicking does nothing. | 🟡 Moderate | For a prototype, wire at least to placeholder routes or `#` anchors; remove `cursor-pointer` from elements that don't do anything so you don't create false affordance. |
| U7 | "1. Décrivez votre besoin" / "2. Choisissez…" / "3. Payez…" bake the step number into the heading text. Fine as-is, but it means screen readers hear "One Décrivez" etc. and you lose flexibility to add a visual step indicator later. | 🟢 Minor | Move the number into a visual pill above each card; keep the heading semantic. |

### Visual hierarchy

- **What the eye catches first (Hero):** the headline + search input + button chain — this is correct, it matches the conversion goal.
- **Hero quick actions compete with the submit button.** Four filled glass-pill buttons directly below a single solid-blue CTA creates visual parity between "search" and "browse a category," splitting user attention. Consider tertiary styling (smaller, outline-only, less saturated) so "Rechercher" clearly wins.
- **Trust section** is beautifully balanced — image weight on the left, text weight on the right, badge-overlay on the photo adds depth.
- **Categories grid** has weak hierarchy inside each card: title and price are the same visual weight, image dominates. Price is the key decision signal ("Dès 25€/heure") and should be more prominent.
- **CallToAction** is oversaturated — solid blue background, blue-lighter paragraph, blue-darker secondary button. All three blues blend, which is why the contrast issue below appears.

### Consistency

| Element | Issue | Recommendation |
|---------|-------|----------------|
| Primary CTA color | Hero button is `bg-blue-600`, CTA section is `bg-blue-600`, Header "S'inscrire" is `bg-blue-600` — but shadcn/ui `<Button>` is never used; each component rebuilds its own button. | Use a shared `<Button>` wrapper. Either use `ui/button.tsx` or define a new `PrimaryButton` that pulls from `--primary`. |
| Border radius | Values used across components: `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px), `rounded-full`, `rounded-md` on inputs. No systematic scale. Theme defines `--radius: 0.625rem` but nothing reads it. | Pick 2–3 radii (sm/md/lg) tied to tokens; apply consistently. |
| Heading color | H2s use `text-slate-900` everywhere — but the theme has `--foreground` defined. If dark mode activates, headings remain dark-on-dark. | Swap `text-slate-900` → `text-foreground`. |
| Body color | Mix of `text-slate-500`, `text-slate-600`, `text-slate-400` for body copy across sections. | Standardize on one "muted-foreground" class; use a second only when you need a visible tertiary tone. |
| Button padding | Hero quick actions: `px-5 py-3`; Hero submit: `py-4 px-8`; CTA buttons: `py-4 px-8`; Trust CTA: `py-3 px-8`; Header: `px-4 py-2`. Six different button sizes. | Define `sm`/`md`/`lg` and use them. |
| Blur decorations | Trust uses `animate-blob animation-delay-2000` — these utilities aren't defined in tailwind.css. They'll silently do nothing. | Remove or define the keyframes in `theme.css`. |

---

## 2. Accessibility Audit — WCAG 2.1 AA

**Summary:** 17 issues found — 4 critical · 8 major · 5 minor

### Perceivable

| # | Issue | WCAG | Severity | File:Line | Fix |
|---|-------|------|----------|-----------|-----|
| A1 | Hero background alt is `"Modern Home Background"` (English) in an otherwise French site. Decorative image gets an alt at all, which forces screen readers to announce a meaningless string. | 1.1.1 | 🟡 Major | `Hero.tsx:20` | Set `alt=""` and `role="presentation"` — this is pure decoration. |
| A2 | Hero search input has no `<label>` — placeholder "Que souhaitez-vous réaliser…" is the only instruction. Placeholders disappear on focus. | 3.3.2, 1.3.1 | 🔴 Critical | `Hero.tsx:52` | Add a visually-hidden `<label for="hero-search">Rechercher un service</label>`. |
| A3 | Header search input has the same issue. | 3.3.2, 1.3.1 | 🔴 Critical | `Header.tsx:15` | Same fix as A2. |
| A4 | `text-blue-100` (#dbeafe) on `bg-blue-600` (#2563eb) in CallToAction paragraph gives ~4.28:1 — below the 4.5:1 required for 20px non-bold body text. | 1.4.3 | 🟡 Major | `CallToAction.tsx:24` | Use `text-white/90` or a lighter blue shade; or bump the text to `font-semibold` which shifts the threshold. |
| A5 | Footer copyright `text-slate-500` (#64748b) on `bg-slate-900` (#0f172a) at `text-sm` (14px) gives ~4.0:1 — below 4.5:1. | 1.4.3 | 🟢 Minor | `Footer.tsx:56` | Use `text-slate-400` (≈6.5:1). |
| A6 | Icons in Trust cards (emerald-600, amber-500, blue-600 on white) are purely decorative but are ≈3px strokes on 24×24 — contrast on icon strokes is ~4.5:1 minimum; `text-amber-500` (#eab308) on white gives ~2.3:1 against white. Fails 1.4.11 (non-text contrast). | 1.4.11 | 🟡 Major | `Trust.tsx:10` | Use `text-amber-600` (≈3.4:1) or darker. |
| A7 | Hero submit button is hidden entirely below `sm` breakpoint. On mobile there is no way to perceive that search can be submitted. | 1.3.1 | 🟡 Major | `Hero.tsx:59` | Replace `hidden sm:block` with an icon-only submit that is always visible. |

### Operable

| # | Issue | WCAG | Severity | File:Line | Fix |
|---|-------|------|----------|-----------|-----|
| A8 | Category cards are `<motion.div cursor-pointer>` — not focusable, not keyboard-activatable. | 2.1.1 | 🔴 Critical | `Categories.tsx:48` | Wrap in `<a href>` or `<button>`. |
| A9 | Mobile menu button has no `aria-expanded`, `aria-controls`, or accessible name beyond the icon. | 4.1.2, 2.4.4 | 🟡 Major | `Header.tsx:40` | Add `aria-label="Ouvrir le menu"` and wire `aria-expanded`. |
| A10 | Focus indicators: almost every custom button uses only `transition-colors` on hover. Default browser focus rings are overridden by Tailwind reset in several places. Keyboard users can't see where they are. | 2.4.7 | 🔴 Critical | Header, Hero, CallToAction, Trust, Footer | Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to every interactive element. |
| A11 | Social media icons in Footer are `<a href="#">` — links that navigate nowhere. Keyboard users land on them then can't escape to meaningful content. | 2.4.4 | 🟡 Major | `Footer.tsx:17–20` | Either set real URLs, or remove until ready. |
| A12 | Touch targets: Hero quick action pills are `py-3 px-5` (~40px tall), social icons are 20×20 clickable — both below 44×44. | 2.5.5 | 🟢 Minor | `Hero.tsx:73`, `Footer.tsx:17–20` | Pad social icons to `p-2` (40px+) or `p-3`; bump quick pills to `py-3.5` + larger icon. |

### Understandable

| # | Issue | WCAG | Severity | File:Line | Fix |
|---|-------|------|----------|-----------|-----|
| A13 | `aria-label="toggle color mode"` is English while the visible tooltip `"Basculer le theme"` is French. Screen reader users in French get English. | 3.1.2 | 🟢 Minor | `ColorModeToggle.tsx:15` | Change to `aria-label="Basculer le thème"` (also fix the missing circumflex in the visible tooltip — it's "thème"). |
| A14 | No visible indication when the search input is in an invalid or empty state — no error copy, no validation. | 3.3.1 | 🟢 Minor | `Hero.tsx`, `Header.tsx` | Add inline validation copy when you wire submit. |
| A15 | Tooltip on color-mode toggle has no keyboard trigger — MUI tooltip only shows on mouse hover by default. | 3.2.4 | 🟢 Minor | `ColorModeToggle.tsx` | MUI tooltip does show on focus by default, but verify during keyboard testing. |

### Robust

| # | Issue | WCAG | Severity | File:Line | Fix |
|---|-------|------|----------|-----------|-----|
| A16 | `<section>` elements without accessible names. Screen readers can't jump between landmarks meaningfully. | 1.3.1 | 🟢 Minor | all components | Add `aria-labelledby="…"` pointing to each section's H2, or `aria-label`. |
| A17 | Layout doesn't include a `<main>` skip link. Keyboard users have to tab through the entire header to reach content. | 2.4.1 | 🟡 Major | `Layout.tsx` | Add a "Skip to main content" link at the top, visible on focus. |

### Color-contrast quick check

| Text | Foreground | Background | Ratio | AA Required | Pass? |
|------|-----------|------------|-------|-------------|-------|
| Hero H1 white | `#ffffff` | slate-900/60 over photo | ~12:1 est. | 4.5:1 | ✅ |
| Hero body slate-200 | `#e2e8f0` | slate-900/60 over photo | ~8:1 est. | 4.5:1 | ✅ |
| Category title slate-900 | `#0f172a` | white | 18.7:1 | 4.5:1 | ✅ |
| Category price blue-600 | `#2563eb` | white | 5.17:1 | 4.5:1 | ✅ |
| "Voir tous les services" blue-600 | `#2563eb` | white | 5.17:1 | 4.5:1 | ✅ |
| CTA paragraph blue-100 | `#dbeafe` | blue-600 `#2563eb` | 4.28:1 | 4.5:1 | ❌ |
| Footer tagline slate-500 | `#64748b` | slate-900 `#0f172a` | 4.0:1 | 4.5:1 | ❌ |
| Footer link slate-300 | `#cbd5e1` | slate-900 | 10.8:1 | 4.5:1 | ✅ |
| Step description slate-500 | `#64748b` | slate-50 `#f8fafc` | 4.4:1 | 4.5:1 | ❌ (by 0.1) |
| HowItWorks subtitle slate-500 | `#64748b` | slate-50 | 4.4:1 | 4.5:1 | ❌ (by 0.1) |
| Trust subtitle slate-500 | `#64748b` | white | 4.58:1 | 4.5:1 | ✅ |
| Trust feature body slate-600 | `#475569` | white | 7.2:1 | 4.5:1 | ✅ |

**Take-away:** `text-slate-500` on any light surface is hovering right at the threshold. Use `text-slate-600` (contrast ~7.2:1) or `text-muted-foreground` as the default body-secondary across the site.

---

## 3. Design System Audit

**Score: 42 / 100** — the bones are here (shadcn tokens defined, Tailwind 4 configured) but the marketing components don't use them.

### Naming & system consistency

| Issue | Where | Recommendation |
|-------|-------|----------------|
| Two parallel theming systems | `main.tsx` wires MUI `CssVarsProvider`; `theme.css` defines shadcn-style tokens. Components reference neither — they use raw Tailwind palette classes (`bg-blue-600`, `text-slate-900`). | Pick ONE. Given the project is Tailwind-first with shadcn/ui components, remove MUI and consolidate on `theme.css` tokens. If you need ColorModeToggle, swap it for `next-themes` (already in package.json). |
| Raw color literals in components | 50+ occurrences of `bg-blue-600`, `text-slate-900`, `text-slate-500`, `bg-slate-50`, etc. | Replace with token classes (`bg-primary`, `text-foreground`, `text-muted-foreground`, `bg-muted`). |
| Empty `fonts.css` | — | Either delete the import or register a web font (Inter is used in `theme.ts` but never loaded via @font-face or Google Fonts). Right now "Inter" silently falls back to the system stack. |
| shadcn `ui/*.tsx` imported nowhere in marketing code | 47 primitive components exist; zero are used in Hero/Categories/HowItWorks/Trust/CallToAction/Header/Footer. | Migrate custom buttons to `<Button>`, custom inputs to `<Input>`, search pattern to `<Command>`. |

### Token coverage

| Category | Defined in theme.css | Used by marketing components | Hardcoded instances |
|----------|---------------------|-------------------------------|---------------------|
| Colors | 28 tokens (primary, foreground, muted, accent, destructive, chart, sidebar) | 0 | ~55 (mostly blue-* and slate-*) |
| Radius | `--radius` + sm/md/lg/xl derivatives | 0 (components use raw `rounded-xl`, `rounded-2xl`, `rounded-full`) | ~20 |
| Spacing | Tailwind 4 default scale | 100% (no issue) | — |
| Typography | Base scale via `@layer base` with sizes for h1–h4 | Partially (headings override with `text-3xl`, `text-4xl`, `text-5xl` anyway) | — |
| Shadow | Not tokenized | — | `shadow-sm`, `shadow-lg`, `shadow-xl`, `shadow-md`, `shadow-2xl` all used |
| Motion | Not tokenized | — | Durations hardcoded (`duration-300`, `duration-500`, plus Framer Motion values) |

### Component completeness (shadcn primitives)

They're installed and ready but unused. Priority migrations:

1. **Button** — replace 9 custom `<button>` elements with `<Button variant="default|outline|secondary|ghost">`.
2. **Input** — replace 2 raw `<input>`s with `<Input>` (inherits focus ring, border, radius from the theme).
3. **Card** — wrap category items and trust feature items in `<Card>/<CardHeader>/<CardContent>`.
4. **Sheet** — back the mobile menu button in Header.
5. **Badge** — the rating pill in Trust could be `<Badge variant="secondary">`.

### Priority actions (design-system track)

1. **Collapse to one theming system** — remove MUI (`CssVarsProvider`, `CssBaseline`, `appTheme`, `IconButton`, `Tooltip` in ColorModeToggle). Swap the toggle to use `next-themes`. This unblocks every other token fix.
2. **Replace raw palette classes with tokens** — find/replace `text-slate-900` → `text-foreground`, `text-slate-500` → `text-muted-foreground`, `bg-blue-600` → `bg-primary`. Verify dark mode now actually works.
3. **Build a shared `<Button>` once** — migrate all nine variants in the marketing components to it.
4. **Define missing tokens**: shadow scale, motion durations/easings, gradient variables used in CallToAction.
5. **Document the 5 marketing-surface patterns** (Hero, FeatureGrid, Timeline, Testimonial, CTA) as named sections so future pages can reuse them.

---

## 4. UX Copy Review

Copy is already good — warm, specific, French-native. These are polish-level.

### Fixes (drop-in replacements)

| # | Where | Current | Proposed | Why |
|---|-------|---------|----------|-----|
| C1 | Hero quick actions | "Bricolage" / "Ménage" / "Déménagement" / "Jardinage" | keep, but add aria-label on the button: `aria-label="Parcourir les services de bricolage"` | Buttons that don't navigate anywhere need to at least communicate intent. |
| C2 | Hero submit button | "Rechercher" | "Rechercher" (keep) — but the alternative "Trouver un prestataire" makes the outcome more concrete. | Verbs that name the outcome convert better. |
| C3 | Categories section "Voir tous les services" | "Voir tous les services" | "Voir les 24 services" (use a live count) | Numbers are more clickable than "all". |
| C4 | Trust CTA button | "En savoir plus sur nos garanties" | keep — this one is specific and correct | ✅ |
| C5 | CallToAction primary | "Devenir prestataire" | keep — clean and action-oriented | ✅ |
| C6 | CallToAction secondary | "En savoir plus" | "Découvrir le programme prestataire" | Generic "Learn more" never performs; be specific. |
| C7 | Header search placeholder | "De quel service avez-vous besoin ?" | keep — it's conversational and clear | ✅ |
| C8 | Hero search placeholder | "Que souhaitez-vous réaliser ? (ex: Monter un meuble)" | keep the main text but move the example into a small subtext below the input, not into placeholder | Placeholders shouldn't carry critical info — A2. |
| C9 | Footer tagline | "Fait avec passion en France." | keep — lovely touch | ✅ |
| C10 | ColorModeToggle tooltip | "Basculer le theme" | "Basculer le thème" (add missing circumflex) | French typography. |
| C11 | ColorModeToggle aria-label | "toggle color mode" | "Basculer le thème clair/sombre" | Match language to site. |
| C12 | Trust rating subtext | "Basé sur plus de 10 000 avis" | keep — specific is good | ✅ |
| C13 | HowItWorks subtitle | "Réserver un service n'a jamais été aussi simple. Suivez ces 3 étapes pour trouver la bonne personne." | "Réserver un service n'a jamais été aussi simple — en 3 étapes." | The em-dash version is punchier and keeps the 3-step promise. |
| C14 | Categories subtitle | "Les prestations les plus demandées par notre communauté." | "Les services les plus demandés cette semaine" (if data supports) or keep as-is | Time-anchored recency converts better when accurate. |
| C15 | CallToAction paragraph | "Rejoignez des milliers de prestataires qui génèrent des revenus complémentaires chaque mois sur Tocato en aidant leurs voisins." | "Rejoignez les milliers de prestataires qui complètent leurs revenus chaque mois en aidant leurs voisins." | Tighter; removes the redundant "sur Tocato" (we're on Tocato). |

### Missing copy (to write before launch)

- **404 page** — no route exists; visitors to any other path will see a blank. Suggest: "Cette page a pris la tangente. Retour à l'accueil."
- **Search empty state** — when the search returns nothing, what does the user see?
- **Search results loading state** — "Recherche en cours…" with skeleton rows.
- **Form validation errors** — "Ce champ est obligatoire" etc.
- **Cookie banner** — required under French law; not present.
- **Accessibility statement** — required under French RGAA for public-facing sites; not present.

---

## 5. Priority Recommendations

### Ship-blocking (do before the prototype leaves internal review)

1. **A10 — Add focus-visible rings to every button and link.** This alone fixes the most common cited reason a site feels "unprofessional" to accessibility auditors.
2. **U2/A2/A3 — Wrap search inputs in `<form>` elements, add labels, keep the submit button visible on mobile.** The core CTA is currently unreachable for keyboard users on mobile.
3. **U4/A8 — Make category cards real links.** Right now they're purely decorative with hover lies.
4. **A4 — Fix CTA section contrast** — change `text-blue-100` to `text-white/90` on the blue background.

### High-value cleanup (one afternoon)

5. **DS1 — Collapse MUI + shadcn tokens into one system.** Enables dark mode to actually work and removes ~150KB of unused MUI from the bundle.
6. **DS2 — Find/replace hardcoded palette classes with semantic tokens.** Makes the dark-mode toggle meaningful.
7. **U6 — Wire placeholder routes behind every CTA, OR remove the hover-scale affordance from non-interactive elements.** Stop lying to users.
8. **C10/C11/A13 — Fix the French typography and match aria-label language.**

### Polish (nice to have)

9. Add a skip-link in Layout (A17).
10. Pad touch targets on social icons and Hero quick pills (A12).
11. Tokenize shadow and motion scale (DS task 4).
12. Write 404 page, loading/empty states, cookie banner, accessibility statement (missing copy).

---

## Appendix — Files affected

| File | Issues |
|------|--------|
| `src/app/components/Hero.tsx` | A1, A2, A7, U2, U7, C2, C8 |
| `src/app/components/Categories.tsx` | U3, U4, A8, C3 |
| `src/app/components/HowItWorks.tsx` | A5 (slate-500 on slate-50), C13 |
| `src/app/components/Trust.tsx` | A6 (amber-500), A16 |
| `src/app/components/CallToAction.tsx` | A4 (contrast), C6, C15 |
| `src/app/components/Header.tsx` | A3, A9, U1, U5 |
| `src/app/components/Footer.tsx` | A5 (slate-500), A11, A12 |
| `src/app/components/Layout.tsx` | A17 |
| `src/app/components/ColorModeToggle.tsx` | A13, C10, C11 |
| `src/styles/theme.css` | DS1 (unused tokens), DS4 (missing shadow/motion) |
| `src/main.tsx` | DS1 (remove MUI) |
| `src/styles/fonts.css` | DS3 (empty) |
