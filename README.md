# Portfolio Website — Project Overview

> Start here. Then read `AGENTS.md` if you are an AI, or `ARCHITECTURE.md` if you are a human.

## What this is
A personal portfolio website. Its job: show who the owner is, what they have built, and how to contact them.

## Scope of this repo right now
**Implementation in progress** (owner approved 2026-10-10). See `TASKS.md` for the current phase. These docs define *how* the site is built so any developer or AI can build it consistently without producing spaghetti code.

## Document map

| File | Purpose | Read when |
|---|---|---|
| `README.md` | Overview and index (this file) | First |
| `AGENTS.md` | Hard rules and workflow for AI assistants | Before any AI touches the project |
| `ARCHITECTURE.md` | Layers, folder structure, data flow | Before designing or placing any file |
| `MODULES.md` | Every module: purpose, inputs, outputs, dependencies | Before creating or editing a module |
| `CONVENTIONS.md` | Naming, CSS, JS, accessibility, commit rules | Before writing any code |
| `CONTENT.md` | Where text/projects/links live and their schema | Before editing site content |
| `TASKS.md` | Build order, checklist, definition of done | When planning or picking up work |
| `GLOSSARY.md` | Exact meaning of project terms | When a term is unclear |
| `DESIGN.md` | Visual direction and design-token plan | Before any styling or visual choice |
| `PROMPTS.md` | Copy-paste prompts for working with AI | When starting an AI session or task |
| `TESTING.md` | Test levels, fixtures, release checklist | Before finishing or releasing a module |
| `DEPLOYMENT.md` | Hosting, SEO, release and rollback | Before going live |

## Core principles (summary)
1. **Modular** — one module, one job, one folder.
2. **Content is separate from code** — editing a project never requires touching a component.
3. **One-way dependencies** — lower layers never import from higher layers.
4. **No spaghetti** — no cross-module reaching, no global mutable state, no copy-paste duplication.
5. **Explicit over clever** — readable beats short.

## Defaults and decisions
Items marked **DECISION (default)** can be changed by the owner. If changed, update the relevant file *and* record it in the Decision Log below.

### Decision Log
| # | Decision | Default | Status |
|---|---|---|---|
| D1 | Tech stack | React + TypeScript (Vite). Replaces vanilla JS; ARCHITECTURE/MODULES/CONVENTIONS still describe the old stack and need a rewrite | Changed 2026-10-10 |
| D2 | Content format | JSON files in `content/` | Confirmed 2026-10-10 |
| D3 | Hosting | Static hosting (GitHub Pages / Netlify / Cloudflare Pages) | Confirmed 2026-10-10 |
| D4 | Pages | Landing and Login via hash routes (`#/`, `#/login`); Landing sections use plain anchors (`#work`, `#about`, `#contact`). The separate Contact page was replaced by the Landing contact section | Changed 2026-10-10 |
| D5 | Theming | CSS custom properties, light + dark | Confirmed 2026-10-10 |
| D6 | Module templates | Markup lives in each module's `render(props)` in its `.js` file; no `.html` fragments | Confirmed 2026-10-10 |
| D7 | Project URLs | `projects/project.html?slug=<slug>` (query string, no host rewrites) | Confirmed 2026-10-10 |
| D8 | Auth | Supabase email/password (`.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); users created in the Supabase dashboard | Added 2026-10-10 |
| D9 | Visual design | Owner's "Parallax Scrolling Website" (Figma Make) design: palette in `styles/tokens.css`; fonts Manrope, Noto Sans JP, IBM Plex Mono from Google Fonts (external request, linked in `index.html`). Light-theme accent (#4f5e00) and promo card (#a93f2f) darkened to pass WCAG AA. Tailwind from the export was not added (unused) | Added 2026-10-10 |
| D10 | Languages | Japanese/English switch; copy lives per language in `content/site.json`, choice saved in localStorage | Added 2026-10-10 |

## Open questions for the owner
Fill these in; AIs must not guess them.
- ~~Name, tagline, projects, contact, visual direction~~: supplied in the owner's design (D9, `content/`)
- Need a blog? Resume download? `TBD`
- ~~Project URL pattern~~: resolved as D7
- ~~Feature-template loading~~: resolved as D6
