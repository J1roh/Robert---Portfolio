# TASKS.md

Build order and status tracker. AIs: update checkboxes as work completes.

**Current phase:** Phase 2 — Shared layer (Phase 1 done; personal facts still `TBD`)

## Phase 0 — Specification (done)
- [x] README.md (overview, decision log)
- [x] AGENTS.md (AI rules)
- [x] ARCHITECTURE.md
- [x] MODULES.md
- [x] CONVENTIONS.md
- [x] CONTENT.md
- [x] TASKS.md
- [x] GLOSSARY.md, DESIGN.md, PROMPTS.md, TESTING.md, DEPLOYMENT.md
- [ ] Owner answers the open questions in `README.md` (personal facts; not blocking until Phase 5)
- [x] Owner confirms or changes decisions D1–D5
- [x] Owner resolves the module-template loading and project URL mapping questions in `ARCHITECTURE.md`
- [x] Owner approves moving to implementation

> Implementation approved 2026-10-10.

## Phase 1 — Foundation
- [x] `styles/tokens.css`
- [x] `styles/reset.css`, `base.css`, `layout.css`
- [x] Light and dark themes
- [x] `index.html` shell (landmarks, meta, skip link)

## Phase 2 — Shared layer
- [ ] `shared/dom.js`
- [ ] `shared/data-loader.js` (+ validation per `CONTENT.md`)
- [ ] `shared/format-date.js`
- [ ] `shared/theme-store.js`

## Phase 3 — Components
- [ ] button
- [ ] tag
- [ ] section-heading
- [ ] card
- [ ] icon
- [ ] theme-toggle

## Phase 4 — Features
- [x] nav — fixed to viewport top while scrolling
- [ ] hero
- [ ] about
- [ ] skills
- [ ] projects
- [ ] contact
- [ ] footer
- [ ] project-detail

## Phase 5 — Pages and content
- [ ] `pages/home.js`
- [ ] `pages/project.js` + `projects/project.html` (`?slug=`, D7)
- [ ] Real content filled in (owner-supplied)

## Phase 6 — Quality
- [ ] Accessibility audit (keyboard, contrast, screen reader pass)
- [ ] Lighthouse ≥ 90 across categories
- [ ] Responsive check at sm / md / lg / xl
- [ ] Spaghetti audit using `AGENTS.md` Section 5
- [ ] Docs match code (`MODULES.md` statuses current)

## Phase 7 — Launch
- [ ] Choose hosting (D3) and deploy
- [ ] Custom domain (optional)
- [ ] Analytics (optional, record in Decision Log)
- [ ] Final README pass

---

## Definition of Done (per task)
1. Meets its `MODULES.md` entry (input, output, boundaries).
2. Passes the `AGENTS.md` self-check.
3. Follows `CONVENTIONS.md`.
4. Docs and this checklist updated.
5. No placeholder presented as real content.

## Backlog / ideas (not scheduled)
- Blog or notes section
- Resume download
- Contact form (needs a service decision)
- Project filtering by tag
- i18n

## Change log
| Date | Change |
|---|---|
| 2026-10-10 | Initial specification files created |
| 2026-10-10 | Added the missing architecture, module, convention, and content specifications; Phase 0 remains open for owner decisions |
| 2026-10-10 | Owner confirmed D1–D5, added D6 (JS render templates) and D7 (`?slug=` URLs); Phase 1 foundation implemented |
| 2026-10-10 | Stack switched to React + TS (Vite); Landing/Contact/Login pages scaffolded in `src/`; Supabase login (D8). Phases 2–5 above describe the old vanilla plan |
| 2026-10-10 | Applied owner's "Parallax Scrolling Website" design (D9, D10): features in `src/features/` (site-header, hero, projects, about, contact, site-footer, backdrop), content in `content/site.json` + `content/projects.json`, Contact page folded into Landing |
| 2026-10-10 | Scramble-text effect on hero name, intro, About statement and Contact title when switching JP/EN; in-house instead of Motion+ ScrambleText (paid). Unit test via built-in `node:test` (`node --test src/lib/scramble.test.ts`) |
| 2026-10-10 | Kept the site header pinned during scroll and offset in-page anchor targets |
| 2026-10-10 | Hero slideshow: single images shown whole over a blurred fill (cover on phones); poster wall of up to 4 portrait posters (`assets/hero/portrait/`) that swaps extras in one tile at a time (`src/lib/poster-wall.ts`, `node --test src/lib/poster-wall.test.ts`). Slides listed in `content/site.json` `heroArt` |
| 2026-10-11 | Contact page (`#/contact`) with an enquiry form saved to Supabase (`02_create_enquiries_table.sql`), CMS Enquiries inbox, landing CTA "Start an enquiry" |
| 2026-10-11 | CMS Enquiries page (`#/cms/enquiries`): folders, read/unread, restore, 30-day purge; run `supabase/mitigations/03_enquiry_folders.sql` |
