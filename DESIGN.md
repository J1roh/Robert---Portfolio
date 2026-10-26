# DESIGN.md

Visual direction and design-token plan. Nothing here is final until the owner fills the `TBD` items. AIs must not choose brand colors, fonts, or imagery on their own; propose options and ask.

## 1. Direction (owner to decide)
- Mood: editorial, dark only, lime accent, mono labels, film grain, scroll parallax (owner's Figma Make design, Decision D9)
- Designer review (2026-10-26, mockup in Figma "Robert Portfolio — Redesign v2"): service-first hero ("Japanese → English Translator" is the largest text, name supports it); one dark scheme with 60-30-10 color (bg / surface + text / lime #d4ff3a); project cards put the title list beside the posters, never over them; no background rings; compact footer.
- Reference sites the owner likes: https://perryw-2023.webflow.io/
- Things to avoid: light/grey panels, harsh red, text over images, decorative lines
- Primary goal of the site: `TBD` (get hired / get clients / show craft / network)

## 2. Token plan
All values live in `styles/tokens.css`. Names are fixed now; values come later.

### Color (semantic)
| Token | Role |
|---|---|
| `--color-bg` | Page background |
| `--color-surface` | Cards, raised areas |
| `--color-text` | Body text |
| `--color-text-muted` | Secondary text |
| `--color-accent` | Links, primary buttons |
| `--color-accent-contrast` | Text on accent |
| `--color-border` | Dividers, outlines |
| `--color-focus` | Focus ring |

Rule: every text/background pair must meet WCAG AA.

### Spacing scale
`--space-1` … `--space-8` (suggested 4, 8, 12, 16, 24, 32, 48, 64 px).

### Typography
| Token | Role |
|---|---|
| `--font-body` | Body text |
| `--font-heading` | Headings |
| `--font-mono` | Code/tags (optional) |
| `--text-sm` … `--text-3xl` | Type scale |
| `--leading-tight`, `--leading-normal` | Line heights |

Fonts: Manrope (body/headings), Noto Sans JP (Japanese), IBM Plex Mono (labels), loaded from Google Fonts (Decision D9).

### Other
`--radius-sm/md/lg`, `--shadow-sm/md`, `--container-max`, `--transition-fast`.

## 3. Layout rules
- Single container width via `--container-max`; consistent horizontal padding.
- Section vertical rhythm uses one spacing token (e.g. `--space-8`) throughout.
- Projects grid: 1 column (mobile), 2 (md), 3 (lg).

## 4. Motion
- Subtle only: fades and small translations under 250ms.
- Exception (owner request): large text scrambles through katakana/Latin glyphs for up to ~750ms when the JP/EN language changes (`src/components/ScrambleText.tsx`). Skipped under reduced motion; screen readers get the real text.
- Exception (owner request): opening loader (`src/features/loader/Loader.tsx`), アニメ scrambles to ANIME, then a fade; about 1.4s total, aria-hidden, skipped under reduced motion. Currently off (`ENABLED = false` in that file).
- Exception (owner request, from the owner's Figma Make zip): hero art crossfades over ~1.9s every 8s; key art slowly zooms to 1.025, the poster wall slides in from the right and out to the left (`src/features/hero/hero-art.css`). Stops under reduced motion.
- Exception (owner request): hero parallax over the first screen of scroll; art lags, name and stats rise and fade (eased scroll position from `useHeroParallax` in `src/features/hero/Hero.tsx`, values in `hero.css`). Off under reduced motion.
- Approved (owner request, 2026-10-11): `motion` + `@base-ui/react` for the site select (`src/components/Select.tsx`, after motion.dev's react-base-select): popup fades/scales in over 0.15s. Lazy-loaded with the contact page; skipped under reduced motion.
- Exception (owner request): project "All titles" opens with a height ease and a staggered fade-in of titles (`src/features/projects/projects.css`). Instant under reduced motion.
- Exception (owner request): hovering a project title turns the card's poster coverflow to that title's poster (0.7s, `src/features/projects/projects.css`). Instant under reduced motion.
- Exception (owner request, 2026-10-12): the coverflow advances to the next title every 3s while the card is on screen and not hovered; the scrollable title list follows it (`ProjectVisual` in `src/features/projects/Projects.tsx`). Off under reduced motion.
- Exception (owner request, 2026-10-12): the site header hides on scroll down past 150px and returns on scroll up (0.3s ease-in-out, after motion.dev's scroll-hide-header; `src/features/site-header/`). Instant under reduced motion; stays shown while it has keyboard focus.
- Exception (owner request, 2026-10-12): numbers in the hero stats and the About statement spin up digit by digit (one full turn from 0) the first time they scroll into view (1.6s, 60ms stagger; `src/components/RollingNumber.tsx`, after motion.dev's number-trend). Instant under reduced motion.
- Exception (owner request, 2026-10-12, from the owner's Figma Make zip): a project title row highlights lime on hover or keyboard focus (tint, inset, left bar growing; 180ms), and clicking a title opens its details modal, copied one-to-one from the zip (backdrop fade 220ms, card rise 260ms; `src/features/projects/`). Instant under reduced motion.
- Exception (owner request, 2026-10-12): the landing-page title modal lies flat while the pointer is on it and tilts up to ±3° toward the pointer while it is over the backdrop (owner request: inverted), with a faint highlight on the card, settling over 500ms (after motion.dev's tilt card; `src/features/projects/`). Mouse/pen only; off under reduced motion.
- Everything must respect `prefers-reduced-motion`.
- No motion that carries essential meaning.
- Reference: consult https://motion.dev/ (docs and examples) for any animation work. It is a reference only; adding the `motion` package needs owner approval.

## 5. Imagery
- Project covers share one aspect ratio (default 16:9).
- Each image has `alt`, explicit dimensions, lazy-loading below the fold.
- Owner supplies all photos; AIs never fabricate or hotlink.

## 6. Theming
- Dark only (designer review 2026-10-26); the light theme and its toggle were removed. Values live in `styles/tokens.css`.

## 7. Design review checklist
- [ ] Contrast passes (dark only)
- [ ] Looks right at 360px, 768px, 1280px
- [ ] No hardcoded colors or pixel spacing outside tokens
- [ ] Focus states visible on every interactive element
- [ ] Hierarchy clear: one obvious primary action per view
