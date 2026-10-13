# TESTING.md

How quality is checked. Kept light: this is a small static site, so favor simple checks over heavy tooling. Tooling choices are DECISIONS for the owner.

## 1. Principles
- Test behavior at module boundaries (input → output), not internals.
- Pure functions (shared helpers, render functions) are easy to test; keep them pure.
- A failing check must name the module and field responsible.

## 2. Levels

| Level | What | How (default) |
|---|---|---|
| Content validation | JSON matches `CONTENT.md` schemas | Validator in `shared/data-loader.js` + a check script |
| Unit | `shared/*` helpers (date format, dom, loader) | Small test file next to each helper |
| Render | Components/features return correct DOM for sample props | Test with fixture data |
| Accessibility | Semantics, contrast, keyboard | Automated scan + manual keyboard pass |
| Visual/responsive | Layout at sm/md/lg/xl | Manual pass (screenshots optional) |
| Performance | Lighthouse targets | Lighthouse run before release |

## 3. Fixtures
- `tests/fixtures/` holds sample content: one complete project, one minimal project (required fields only), one invalid project.
- Every feature must render correctly with the minimal fixture (proves optional fields are optional).

## 4. Required cases per module type

### Components
- Renders with required props only
- Renders with all props
- Optional prop absent → element hidden, no "undefined" text
- Variants produce expected classes

### Features
- Valid data → expected sections present
- Empty list → graceful empty state
- Missing data → fallback, no thrown error

### Shared helpers
- Normal input, edge input (empty, null, bad format), expected error shape

### Pages
- Composes features in the configured order
- One feature failing does not stop others rendering

## 5. Manual checklist (before each release)
- [ ] Keyboard-only: tab order logical, focus visible, skip link works
- [ ] Theme toggle: light, dark, system default, persistence
- [ ] 360px, 768px, 1280px: no horizontal scroll, readable text
- [ ] Every external link works and opens safely (`rel="noopener"`)
- [ ] Images have alt, load lazily below the fold
- [ ] Project not-found page shows a friendly message
- [ ] No console errors or warnings

## 6. Targets
| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 90 (aim 100) |
| Lighthouse Best Practices | ≥ 90 |
| Lighthouse SEO | ≥ 90 |
| Console errors | 0 |

## 7. For AIs
- Add or update tests in the same change as the module.
- Never weaken or delete a test to make a change pass; report the conflict instead.
- Do not introduce a test framework without logging it in the Decision Log.
